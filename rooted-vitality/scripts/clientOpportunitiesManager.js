/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: scripts/clientOpportunitiesManager.js                       ║
║  Purpose: Client-side opportunity message inbox management         ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

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

/**
 * Initialize the client opportunities manager
 */
async function initializeClientOpportunitiesManager() {
  console.log('[Client Opportunities] Initializing manager');
  
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

  // Get client profile
  const clientProfile = await window.authManager.getClientProfile(currentUser.id);
  if (!clientProfile) {
    console.error('[Client Opportunities] Client profile not found');
    return;
  }

  currentClientSerial = clientProfile.serial_number;
  console.log('[Client Opportunities] Initialized with client serial:', currentClientSerial);

  // Setup event listeners
  setupClientOpportunitiesEventListeners();

  // Load opportunities
  await loadClientOpportunities();

  // Setup real-time subscription for new opportunities
  setupClientOpportunitiesSubscription();
}

/**
 * Load opportunities where this client has toggled "open to match"
 */
async function loadClientOpportunities() {
  try {
    console.log('[Client Opportunities] Loading opportunities');

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
          name,
          specialty,
          bio,
          avatar_url,
          rating
        ),
        projects (
          id,
          project_serial,
          title,
          description,
          project_status
        )
      `)
      .eq('is_opportunity_message', true)
      .eq('project_client_serial', currentClientSerial)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Client Opportunities] Error loading opportunities:', error);
      showOpportunitiesError('Failed to load opportunities');
      return;
    }

    console.log('[Client Opportunities] Loaded messages:', messages?.length || 0);

    // Only show active opportunities (not declined, not blocked, not archived, not converted)
    clientOpportunities = (messages || []).filter(msg => {
      if (!msg.opportunities) return false;
      const opp = msg.opportunities;
      return !opp.declined_by_client && !opp.practitioner_blocked && !opp.is_archived && !opp.converted_to_match;
    });

    console.log('[Client Opportunities] Active opportunities:', clientOpportunities.length);

    // Display opportunities
    displayClientOpportunities();

    // Update badge
    updateOpportunitiesBadge();

  } catch (error) {
    console.error('[Client Opportunities] Exception loading opportunities:', error);
    showOpportunitiesError('Error loading opportunities');
  }
}

/**
 * Display opportunities in the inbox
 */
function displayClientOpportunities() {
  const container = document.getElementById('opportunities-container');
  if (!container) {
    console.warn('[Client Opportunities] Container not found');
    return;
  }

  if (clientOpportunities.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 2rem; text-align: center; color: #999;">
        <p style="margin: 0; font-size: 1rem;">No new opportunities at this time</p>
        <p style="margin: 0.5rem 0 0; font-size: 0.9rem; color: #bbb;">
          Check back soon or adjust your project settings
        </p>
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

    // Get practitioner initials
    const initials = (practitioner.name || 'P')
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
              ${practitioner.avatar_url 
                ? `<img src="${practitioner.avatar_url}" alt="${practitioner.name}" style="width: 100%; height: 100%; object-fit: cover;">`
                : `<span>${initials}</span>`
              }
            </div>
            <div class="opportunity-card__info">
              <h3 class="opportunity-card__name">${formatPractitionerName(practitioner.name)}</h3>
              <p class="opportunity-card__specialty">${practitioner.specialty || 'Practitioner'}</p>
              <div class="opportunity-card__meta">
                <span class="opportunity-card__rating">⭐ ${practitioner.rating ? practitioner.rating.toFixed(1) : 'New'}</span>
                <span class="opportunity-card__time">${timeAgo}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="opportunity-card__project">
          <h4 class="opportunity-card__project-title">${project.title}</h4>
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

/**
 * Attach event listeners to opportunity action buttons
 */
function attachOpportunityActionListeners() {
  // Accept buttons
  document.querySelectorAll('.opportunity-accept-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const opportunityId = btn.dataset.opportunityId;
      const messageId = btn.dataset.messageId;
      const projectSerial = btn.dataset.projectSerial;
      const practitionerSerial = btn.dataset.practitionerSerial;

      console.log('[Client Opportunities] Accept button clicked:', {
        opportunityId,
        messageId,
        projectSerial,
        practitionerSerial
      });

      await acceptOpportunity(opportunityId, messageId, projectSerial, practitionerSerial);
    });
  });

  // Decline buttons
  document.querySelectorAll('.opportunity-decline-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const opportunityId = btn.dataset.opportunityId;

      console.log('[Client Opportunities] Decline button clicked:', opportunityId);

      await declineOpportunity(opportunityId);
    });
  });
}

/**
 * Accept opportunity and create match
 */
async function acceptOpportunity(opportunityId, messageId, projectSerial, practitionerSerial) {
  try {
    console.log('[Client Opportunities] Accepting opportunity:', opportunityId);

    // Call the function from matchMessagingManager
    if (typeof window.acceptOpportunityMessage !== 'function') {
      console.error('[Client Opportunities] acceptOpportunityMessage function not found');
      showOpportunitiesError('Function not available');
      return;
    }

    // Call existing function from matchMessagingManager
    const result = await window.acceptOpportunityMessage(opportunityId, projectSerial, practitionerSerial);

    if (result) {
      console.log('[Client Opportunities] Opportunity accepted, match created:', result.id);

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

/**
 * Decline opportunity
 */
async function declineOpportunity(opportunityId) {
  try {
    console.log('[Client Opportunities] Declining opportunity:', opportunityId);

    // Call the function from matchMessagingManager
    if (typeof window.declineOpportunityMessage !== 'function') {
      console.error('[Client Opportunities] declineOpportunityMessage function not found');
      showOpportunitiesError('Function not available');
      return;
    }

    // Call existing function from matchMessagingManager
    await window.declineOpportunityMessage(opportunityId);

    console.log('[Client Opportunities] Opportunity declined');

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

/**
 * Update opportunities badge count
 */
function updateOpportunitiesBadge() {
  const badge = document.getElementById('opportunities-badge');
  if (badge) {
    // Show only active opportunities in the badge
    badge.textContent = clientOpportunities.length;
    badge.style.display = clientOpportunities.length > 0 ? 'flex' : 'none';
  }
}

/**
 * Setup real-time subscription for new opportunities
 */
function setupClientOpportunitiesSubscription() {
  if (!window.supabaseClient) return;

  console.log('[Client Opportunities] Setting up real-time subscription');

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
        console.log('[Client Opportunities] Real-time update received:', payload);
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

/**
 * Setup event listeners for opportunity tabs
 */
function setupClientOpportunitiesEventListeners() {
  // This is now handled by initTabSwitchers in my-matches.js
  // But we need to add opportunity-specific tab handling
  console.log('[Client Opportunities] Event listeners setup ready');
}

/**
 * Utility: Format practitioner name
 */
function formatPractitionerName(name) {
  if (!name) return 'Practitioner';
  return name.replace(/_/g, ' ');
}

/**
 * Utility: Escape HTML
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Utility: Get time ago string
 */
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

/**
 * Show error notification
 */
function showOpportunitiesError(message) {
  console.error('[Client Opportunities] Error:', message);
  
  // Use existing notification system if available
  if (typeof window.showNotification === 'function') {
    window.showNotification(message, 'error');
  } else {
    alert(message);
  }
}

/**
 * Show success notification
 */
function showOpportunitiesSuccess(message) {
  console.log('[Client Opportunities] Success:', message);
  
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
























































