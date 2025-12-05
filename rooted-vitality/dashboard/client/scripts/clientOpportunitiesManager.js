/*

FUNCTIONALITY:
- Load and display opportunity messages for clients
- Filter and sort opportunity messages
- Accept opportunity (creates match with in-progress status)
- Decline opportunity (archives silently)
- Auto-refresh when new opportunities arrive
- Real-time badge updates
*/

let clientOpportunities = [];
let filteredOpportunities = [];
let selectedOpportunity = null;
let currentClientSerial = null;

//Initialize the client opportunities manager
async function initializeClientOpportunitiesManager() {
  
  if (!window.supabaseClient) {
    console.error('[Client Opportunities] Supabase client not initialized');
    return;
  }

  if (!window.authManager) {
    console.error('[Client Opportunities] Auth manager not initialized');
    return;
  }

  // Get current user
  const currentUser = window.authManager.getCurrentUser();
  if (!currentUser) {
    console.error('[Client Opportunities] User not authenticated');
    return;
  }

  // Get client serial from clients table
  try {
    const { data: clientProfile, error } = await window.supabaseClient
      .from('clients')
      .select('serial_number')
      .eq('id', currentUser.id)
      .single();
    
    if (error || !clientProfile) {
      console.error('[Client Opportunities] Client profile not found:', error);
      return;
    }

    currentClientSerial = clientProfile.serial_number;
    // Setup event listeners
    setupClientOpportunitiesEventListeners();

    // Load opportunities
    await loadClientOpportunities();

    // Setup real-time subscription for new opportunities
    setupClientOpportunitiesSubscription();
  } catch (err) {
    console.error('[Client Opportunities] Error initializing:', err);
  }
}

 // Load opportunities where this client has toggled "open to match"
async function loadClientOpportunities() {
  try {

    // Query project_messages that are opportunity messages from practitioners
    const { data: messages, error } = await window.supabaseClient
      .from('project_messages')
      .select(`
        *,
        opportunities (
          id,
          project_serial,
          practitioner_serial,
          status,
          message_sent,
          message_count,
          declined_by_practitioner,
          declined_by_client,
          is_archived,
          practitioner_blocked,
          converted_to_match,
          match_id
        ),
        practitioners (
          id,
          serial_number,
          legal_name,
          dba_name
        ),
        projects (
          id,
          project_serial,
          custom_name,
          description,
          project_status
        )
      `)
      .eq('is_opportunity_message', true)
      .eq('client_serial', currentClientSerial)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Client Opportunities] Error loading opportunities:', error);
      showOpportunitiesError('Failed to load opportunities');
      return;
    }

    // Only show active opportunities (not declined, not blocked, not archived, not converted)
    clientOpportunities = (messages || []).filter(msg => {
      if (!msg.opportunities) return false;
      const opp = msg.opportunities;
      return !opp.declined_by_client && !opp.practitioner_blocked && !opp.is_archived && !opp.converted_to_match;
    });

    // Display opportunities
    displayClientOpportunities();

    // Update badge
    updateOpportunitiesBadge();

  } catch (error) {
    console.error('[Client Opportunities] Exception loading opportunities:', error);
    showOpportunitiesError('Error loading opportunities');
  }
}

// Display opportunities in the inbox
function displayClientOpportunities() {
  const container = document.getElementById('opportunities-list');
  if (!container) {
    console.warn('[Client Opportunities] Container not found');
    return;
  }

  if (clientOpportunities.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No new opportunities</p>
      </div>
    `;
    return;
  }

  // Render opportunity cards
  container.innerHTML = clientOpportunities.map(msg => {
    const opp = msg.opportunities;
    const practitioner = msg.practitioners;
    const project = msg.projects;

    if (!opp || !practitioner || !project) {
      console.warn('[Client Opportunities] Incomplete opportunity data:', msg);
      return '';
    }

    // Format date
    const date = new Date(msg.created_at);
    const timeAgo = getTimeAgo(date);

    // Get practitioner name
    const practitionerName = practitioner.dba_name || practitioner.legal_name || 'Practitioner';

    // Get practitioner initials
    const initials = practitionerName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return `
      <div class="opportunity-card" data-opportunity-id="${opp.id}" data-message-id="${msg.id}">
        <div class="opportunity-card__header">
          <div class="opportunity-card__practitioner">
            <div class="opportunity-card__avatar">
              <span>${initials}</span>
            </div>
            <div class="opportunity-card__info">
              <h3 class="opportunity-card__name">${practitionerName}</h3>
              <div class="opportunity-card__meta">
                <span class="opportunity-card__time">${timeAgo}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="opportunity-card__project">
          <h4 class="opportunity-card__project-title">${project.custom_name || 'Project'}</h4>
          <p class="opportunity-card__project-desc">${project.description ? project.description.substring(0, 150) : ''}</p>
        </div>

        <div class="opportunity-card__message">
          <p class="opportunity-card__message-text">${escapeHtml(msg.message_text) || 'Interested in connecting with you about this project.'}</p>
        </div>

        <div class="opportunity-card__actions">
          <button class="btn btn-sm btn-success opportunity-accept-btn" data-opportunity-id="${opp.id}" data-message-id="${msg.id}" data-project-serial="${project.project_serial}" data-practitioner-serial="${practitioner.serial_number}">
            Accept
          </button>
          <button class="btn btn-sm btn-secondary opportunity-decline-btn" data-opportunity-id="${opp.id}">
            Decline
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Attach event listeners to buttons
  attachOpportunityActionListeners();
}

// Attach event listeners to opportunity action buttons
function attachOpportunityActionListeners() {
  // Accept buttons
  document.querySelectorAll('.opportunity-accept-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const opportunityId = btn.dataset.opportunityId;
      const messageId = btn.dataset.messageId;
      const projectSerial = btn.dataset.projectSerial;
      const practitionerSerial = btn.dataset.practitionerSerial;


      await acceptOpportunity(opportunityId, messageId, projectSerial, practitionerSerial);
    });
  });

  // Decline buttons
  document.querySelectorAll('.opportunity-decline-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const opportunityId = btn.dataset.opportunityId;

      await declineOpportunity(opportunityId);
    });
  });
}

// Accept opportunity and create match
async function acceptOpportunity(opportunityId, messageId, projectSerial, practitionerSerial) {
  try {

    // Call the function from matchMessagingManager
    if (typeof window.acceptOpportunityMessage !== 'function') {
      console.error('[Client Opportunities] acceptOpportunityMessage function not found');
      showOpportunitiesError('Function not available');
      return;
    }

    // Call existing function from matchMessagingManager
    const result = await window.acceptOpportunityMessage(opportunityId, projectSerial, practitionerSerial);

    if (result) {

      // Show success message
      showOpportunitiesSuccess('Connection accepted! The match has been created.');

      // Remove from display
      const card = document.querySelector(`[data-opportunity-id="${opportunityId}"]`);
      if (card) {
        card.style.opacity = '0.5';
        card.style.pointerEvents = 'none';
      }

      // Reload opportunities
      setTimeout(() => {
        loadClientOpportunities();
      }, 500);

      // Refresh matches in other parts of the interface
      if (typeof window.loadMatches === 'function') {
        window.loadMatches(currentClientSerial);
      }
    }
  } catch (error) {
    console.error('[Client Opportunities] Error accepting opportunity:', error);
    showOpportunitiesError('Failed to accept opportunity');
  }
}

// Decline opportunity
async function declineOpportunity(opportunityId) {
  try {

    // Call the function from matchMessagingManager
    if (typeof window.declineOpportunityMessage !== 'function') {
      console.error('[Client Opportunities] declineOpportunityMessage function not found');
      showOpportunitiesError('Function not available');
      return;
    }

    // Call existing function from matchMessagingManager
    await window.declineOpportunityMessage(opportunityId);

    // Show success message
    showOpportunitiesSuccess('Opportunity declined.');

    // Remove from display
    const card = document.querySelector(`[data-opportunity-id="${opportunityId}"]`);
    if (card) {
      card.style.opacity = '0.5';
      card.style.pointerEvents = 'none';
    }

    // Reload opportunities
    setTimeout(() => {
      loadClientOpportunities();
    }, 500);
  } catch (error) {
    console.error('[Client Opportunities] Error declining opportunity:', error);
    showOpportunitiesError('Failed to decline opportunity');
  }
}

// Update opportunities badge count
function updateOpportunitiesBadge() {
  const badge = document.getElementById('opportunities-badge');
  if (badge) {
    badge.textContent = clientOpportunities.length;
    badge.style.display = 'flex';
  }
}

// Setup real-time subscription for new opportunities
function setupClientOpportunitiesSubscription() {
  if (!window.supabaseClient) return;

  // Subscribe to project_messages changes
  const subscription = window.supabaseClient
    .channel(`client-opportunities-${currentClientSerial}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'project_messages',
        filter: `project_client_serial=eq.${currentClientSerial}`
      },
      (payload) => {
        loadClientOpportunities();
      }
    )
    .subscribe();

  // Store subscription for cleanup
  if (!window.clientOpportunitiesSubscriptions) {
    window.clientOpportunitiesSubscriptions = [];
  }
  window.clientOpportunitiesSubscriptions.push(subscription);
}

// Setup event listeners for opportunity tabs
function setupClientOpportunitiesEventListeners() {
  // This is now handled by initTabSwitchers in my-wellness.js
  // But we need to add opportunity-specific tab handling
}

// Utility: Format practitioner name
function formatPractitionerName(name) {
  if (!name) return 'Practitioner';
  return name.replace(/_/g, ' ');
}

// Utility: Get time ago string
function getTimeAgo(date) {
  const now = new Date();
  const diff = now - date;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    return date.toLocaleDateString();
  } else if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
}

// Show error notification
function showOpportunitiesError(message) {
  console.error('[Client Opportunities] Error:', message);
  
  // Use existing notification system if available
  if (typeof window.showNotification === 'function') {
    window.showNotification(message, 'error');
  } else {
    alert(message);
  }
}

// Show success notification
function showOpportunitiesSuccess(message) {
  
  // Use existing notification system if available
  if (typeof window.showNotification === 'function') {
    window.showNotification(message, 'success');
  } else {
    alert(message);
  }
}

// Export functions to window
window.initializeClientOpportunitiesManager = initializeClientOpportunitiesManager;
window.loadClientOpportunities = loadClientOpportunities;
window.acceptOpportunity = acceptOpportunity;
window.declineOpportunity = declineOpportunity;