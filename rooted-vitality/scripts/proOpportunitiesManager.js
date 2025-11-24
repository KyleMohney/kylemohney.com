/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: scripts/proOpportunitiesManager.js                          ║
║  Purpose: Practitioner Opportunities Management                    ║
║  - Display opportunities from open-to-match clients                ║
║  - 1-message-only messaging from opportunities                     ║
║  - Decline and Block functionality                                 ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝
*/

console.log('[Pro Opportunities] Manager script loaded');

let supabaseClient;
let authManager;
let currentPractitioner = null;
let opportunities = [];
let selectedOpportunity = null;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Initialize Supabase and Auth
    supabaseClient = window.supabaseClient;
    authManager = window.authManager;

    if (!supabaseClient || !authManager) {
      console.error('[Pro Opportunities] Supabase or Auth not initialized');
      return;
    }

    const currentUser = authManager.getCurrentUser();
    if (!currentUser) {
      console.log('[Pro Opportunities] User not authenticated');
      return;
    }

    // Load practitioner profile
    const { data: practitionerData, error: practError } = await supabaseClient
      .from('practitioners')
      .select('id, serial_number, legal_name')
      .eq('id', currentUser.id)
      .single();

    if (practError) {
      console.error('[Pro Opportunities] Error loading practitioner:', practError);
      return;
    }

    currentPractitioner = practitionerData;
    console.log('[Pro Opportunities] Practitioner loaded:', currentPractitioner.legal_name);

    // Set up sidebar tab switching
    setupTabSwitching();

    // Load opportunities
    await loadOpportunities();

    // Set up event listeners
    setupEventListeners();

  } catch (error) {
    console.error('[Pro Opportunities] Initialization error:', error);
  }
});

/**
 * Setup sidebar tab switching for New Clients vs Opportunities
 */
function setupTabSwitching() {
  const tabs = document.querySelectorAll('.sidebar-tab');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const target = tab.getAttribute('data-tab');
      
      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Show corresponding list
      const newClientsList = document.getElementById('new-clients');
      const opportunitiesList = document.getElementById('opportunities');
      
      if (target === 'new-clients') {
        newClientsList.style.display = 'flex';
        opportunitiesList.style.display = 'none';
      } else if (target === 'opportunities') {
        newClientsList.style.display = 'none';
        opportunitiesList.style.display = 'flex';
      }
      
      console.log('[Pro Opportunities] Switched to tab:', target);
    });
  });
}

/**
 * Load opportunities from open-to-match clients with active projects
 */
async function loadOpportunities() {
  try {
    console.log('[Pro Opportunities] Loading opportunities...');

    // Get opportunities where:
    // - Status is 'open_to_match'
    // - Not archived
    // - Not declined by practitioner
    // - Not blocked
    // - Practitioner hasn't sent message yet (message_count = 0) OR hasn't declined/blocked yet
    const { data: opps, error: oppError } = await supabaseClient
      .from('opportunities')
      .select(`
        id,
        serial_number,
        client_id,
        project_id,
        service_type,
        description,
        status,
        message_sent,
        message_count,
        declined_by_practitioner,
        practitioner_blocked,
        created_at,
        projects (
          id,
          custom_name,
          category_name,
          description,
          urgency,
          client_serial,
          client_first_name,
          client_last_name
        ),
        clients (
          id,
          first_name,
          last_name,
          profile_picture_url
        )
      `)
      .eq('status', 'open_to_match')
      .eq('is_archived', false)
      .eq('declined_by_practitioner', false)
      .eq('practitioner_blocked', false)
      .order('created_at', { ascending: false });

    if (oppError) throw oppError;

    opportunities = opps || [];
    console.log('[Pro Opportunities] Loaded', opportunities.length, 'opportunities');

    renderOpportunities();

  } catch (error) {
    console.error('[Pro Opportunities] Error loading opportunities:', error);
    showToast('Failed to load opportunities', 'error');
  }
}

/**
 * Render opportunities cards
 */
function renderOpportunities() {
  const container = document.getElementById('opportunities');
  
  if (!container) {
    console.error('[Pro Opportunities] Container not found');
    return;
  }

  if (opportunities.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No Opportunities</h3>
        <p>No clients are currently open to matches. Check back soon!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = opportunities.map(opp => {
    const client = opp.clients[0];
    const project = opp.projects[0];
    const clientName = client ? `${client.first_name} ${client.last_name}` : 'Unknown Client';
    const avatar = client?.first_name?.charAt(0).toUpperCase() || 'C';
    const canMessage = !opp.message_sent && opp.message_count === 0;

    return `
      <div class="client-card" data-opp-id="${opp.id}">
        <div class="card-header">
          <div class="client-avatar">${avatar}</div>
          <div class="client-info">
            <h3 class="client-name">${clientName}</h3>
            <p class="client-service">${project?.category_name || opp.service_type}</p>
            <p class="client-meta">
              <strong>Urgency:</strong> ${project?.urgency || 'Not specified'} • 
              <strong>Posted:</strong> ${formatDate(opp.created_at)}
            </p>
          </div>
        </div>
        
        <div class="message-preview-box">
          <p class="message-text">${project?.description || opp.description || 'No description'}</p>
        </div>
        
        <div class="match-details">
          <span class="match-detail-item">
            <span class="match-detail-label">Project:</span>
            ${project?.custom_name || 'Wellness Journey'}
          </span>
          <span class="match-detail-item">
            <span class="match-detail-label">Messages Sent:</span>
            ${opp.message_count || 0}/1
          </span>
        </div>
        
        <div class="card-actions">
          ${canMessage ? `
            <button class="btn-accent opp-message-btn" data-opp-id="${opp.id}">
              Send Message (1)
            </button>
          ` : `
            <button class="btn-neutral" disabled>
              Message Already Sent
            </button>
          `}
          <button class="btn-neutral opp-decline-btn" data-opp-id="${opp.id}">
            Decline
          </button>
          <button class="btn-danger opp-block-btn" data-opp-id="${opp.id}">
            Block
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Attach event listeners to buttons
  attachOpportunityListeners();
}

/**
 * Attach event listeners to opportunity action buttons
 */
function attachOpportunityListeners() {
  // Message buttons
  document.querySelectorAll('.opp-message-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const oppId = e.currentTarget.dataset.oppId;
      const opp = opportunities.find(o => o.id === oppId);
      if (opp) {
        openOpportunityMessageModal(opp);
      }
    });
  });

  // Decline buttons
  document.querySelectorAll('.opp-decline-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const oppId = e.currentTarget.dataset.oppId;
      const opp = opportunities.find(o => o.id === oppId);
      if (opp) {
        declineOpportunity(opp);
      }
    });
  });

  // Block buttons
  document.querySelectorAll('.opp-block-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const oppId = e.currentTarget.dataset.oppId;
      const opp = opportunities.find(o => o.id === oppId);
      if (opp) {
        blockOpportunityClient(opp);
      }
    });
  });
}

/**
 * Open modal to send message from opportunity
 */
function openOpportunityMessageModal(opp) {
  const client = opp.clients[0];
  const project = opp.projects[0];
  const clientName = client ? `${client.first_name} ${client.last_name}` : 'Unknown Client';

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'opp-message-modal';
  modal.innerHTML = `
    <div class="modal__overlay"></div>
    <div class="modal__content modal__content--small">
      <div class="modal__header">
        <h2>Send Message to ${clientName}</h2>
        <button class="modal__close" aria-label="Close modal">&times;</button>
      </div>
      <div class="modal__body">
        <div style="background: #f5f5f5; padding: 1rem; border-radius: 6px; margin-bottom: 1.5rem;">
          <p style="margin: 0; font-size: 0.85rem; color: #666;"><strong>Project:</strong> ${project?.custom_name}</p>
          <p style="margin: 0.5rem 0 0 0; font-size: 0.85rem; color: #666;"><strong>Need:</strong> ${project?.category_name}</p>
        </div>
        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; font-size: 0.9rem;">Your Message (max 1):</label>
        <textarea 
          id="opp-message-text" 
          placeholder="Introduce yourself and why you're a good fit for their needs..."
          style="width: 100%; height: 120px; padding: 0.75rem; border: 1px solid #ddd; border-radius: 6px; font-family: inherit; font-size: 0.9rem; resize: vertical;"
        ></textarea>
        <p style="font-size: 0.8rem; color: #999; margin: 0.5rem 0 0 0;">💡 Tip: This is your only message. Make it count!</p>
      </div>
      <div class="modal__footer">
        <button id="opp-message-cancel" class="btn btn--secondary">Cancel</button>
        <button id="opp-message-send" class="btn btn-accent" data-opp-id="${opp.id}">Send Message</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Close button
  modal.querySelector('.modal__close').addEventListener('click', () => modal.remove());
  document.getElementById('opp-message-cancel').addEventListener('click', () => modal.remove());

  // Send button
  document.getElementById('opp-message-send').addEventListener('click', async () => {
    const messageText = document.getElementById('opp-message-text').value.trim();
    if (!messageText) {
      showToast('Please type a message', 'error');
      return;
    }
    
    await sendOpportunityMessage(opp, messageText);
    modal.remove();
  });

  modal.style.display = 'flex';
}

/**
 * Send opportunity message (1 per opportunity)
 */
async function sendOpportunityMessage(opp, messageText) {
  try {
    console.log('[Pro Opportunities] Sending opportunity message for:', opp.id);

    // Create project message
    const { data: msgData, error: msgError } = await supabaseClient
      .from('project_messages')
      .insert({
        project_id: opp.project_id,
        practitioner_id: currentPractitioner.id,
        client_id: opp.client_id,
        sender_id: currentPractitioner.id,
        sender_type: 'practitioner',
        message: messageText,
        is_read: false,
        is_opportunity_message: true,
        opportunity_id: opp.id,
        practitioner_serial: currentPractitioner.serial_number,
        client_serial: opp.clients[0]?.serial_number || 'unknown',
        project_serial: opp.projects[0]?.project_serial || 0
      })
      .select()
      .single();

    if (msgError) throw msgError;

    // Update opportunity to mark message as sent
    const { error: oppError } = await supabaseClient
      .from('opportunities')
      .update({
        message_sent: true,
        message_count: 1
      })
      .eq('id', opp.id);

    if (oppError) throw oppError;

    console.log('[Pro Opportunities] Message sent and opportunity updated');
    showToast('Message sent! The client will see it in their inbox.', 'success');

    // Reload opportunities
    await loadOpportunities();

  } catch (error) {
    console.error('[Pro Opportunities] Error sending message:', error);
    showToast('Failed to send message', 'error');
  }
}

/**
 * Decline opportunity (silent, no notification)
 */
async function declineOpportunity(opp) {
  if (!confirm(`Decline this opportunity from ${opp.clients[0]?.first_name}? They won't be notified.`)) {
    return;
  }

  try {
    console.log('[Pro Opportunities] Declining opportunity:', opp.id);

    const { error } = await supabaseClient
      .from('opportunities')
      .update({
        declined_by_practitioner: true,
        is_archived: true
      })
      .eq('id', opp.id);

    if (error) throw error;

    console.log('[Pro Opportunities] Opportunity declined');
    showToast('Opportunity declined', 'success');

    // Reload opportunities
    await loadOpportunities();

  } catch (error) {
    console.error('[Pro Opportunities] Error declining opportunity:', error);
    showToast('Failed to decline opportunity', 'error');
  }
}

/**
 * Block client from opportunity (silent, no notification)
 */
async function blockOpportunityClient(opp) {
  if (!confirm(`Block ${opp.clients[0]?.first_name} from reaching you again? They won't be notified.`)) {
    return;
  }

  try {
    console.log('[Pro Opportunities] Blocking client:', opp.client_id);

    // Create block record
    const { error: blockError } = await supabaseClient
      .from('practitioner_blocks')
      .insert({
        practitioner_id: currentPractitioner.id,
        client_serial: opp.clients[0]?.serial_number || 'unknown',
        practitioner_serial: currentPractitioner.serial_number,
        is_blocked: true,
        from_opportunity: true
      });

    if (blockError && blockError.code !== 'PGRST116') {
      throw blockError; // Ignore unique constraint errors
    }

    // Update all opportunities from this client to blocked
    const { error: oppError } = await supabaseClient
      .from('opportunities')
      .update({ practitioner_blocked: true })
      .eq('client_id', opp.client_id);

    if (oppError) throw oppError;

    console.log('[Pro Opportunities] Client blocked');
    showToast('Client blocked. They won\'t be able to reach you.', 'success');

    // Reload opportunities
    await loadOpportunities();

  } catch (error) {
    console.error('[Pro Opportunities] Error blocking client:', error);
    showToast('Failed to block client', 'error');
  }
}

/**
 * Setup general event listeners
 */
function setupEventListeners() {
  // This is where you'd add any other listeners needed
}

/**
 * Format date for display
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container') || document.body;
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    margin-bottom: 0.5rem;
  `;
  
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

console.log('[Pro Opportunities] Manager initialized and ready');
