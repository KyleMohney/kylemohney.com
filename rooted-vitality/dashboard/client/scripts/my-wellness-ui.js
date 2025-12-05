/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: dashboard/client/scripts/my-wellness-ui.js                   ║
║  Purpose: My Wellness UI rendering and interactions                 ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

FUNCTIONALITY:
- DOM rendering for match cards and threads
- User interface management
- Event listener binding
- Modal display management
- Thread messaging interface
*/

// ═══════════════════════════════════════════════════════════════════
// UI INITIALIZATION & SETUP
// ═══════════════════════════════════════════════════════════════════

/**
 * Initialize the entire My Wellness application
 */
async function initializeMyWellness() {
  try {
    if (!window.supabaseClient) {
      return;
    }

    if (!window.authManager) {
      return;
    }

    const currentUser = window.authManager.getCurrentUser();

    if (!currentUser) {
      window.location.href = '/rooted-vitality/dashboard/client/pages/client-signup.html';
      return;
    }

    // Load client profile
    const { data: clientProfile, error: clientError } = await window.supabaseClient
      .from('clients')
      .select('serial_number')
      .eq('id', currentUser.id)
      .single();

    if (clientError || !clientProfile) {
      showNotification('Please complete your client profile first', 'error');
      return;
    }

    // Load taxonomy data first
    await loadTaxonomy();

    // Load matches BEFORE projects so project card creation has access to match data
    await loadMatches(clientProfile.serial_number);
    
    // Load projects and render them with match data available
    await loadProjects(clientProfile.serial_number);

    // Update journey counters now that projects are loaded
    updateJourneyCounters();

    // Initialize handlers
    initFilterHandlers();
    initModalHandlers();
    initMessageThreadHandlers();
    initProjectFormHandlers();

    // Check if redirected from contact button with auto-open params
    const urlParams = new URLSearchParams(window.location.search);
    const autoOpenProjectId = urlParams.get('project_id');
    const autoOpenPractitionerSerial = urlParams.get('practitioner_serial');

    if (autoOpenProjectId && autoOpenPractitionerSerial) {
      const match = allMatches.find(m => m.project_serial === autoOpenProjectId && m.practitioner_serial === autoOpenPractitionerSerial);
      if (match) {
        openMessagingThread(match);
      }
    }

    // Set up real-time subscription for match acceptance
    if (clientProfile.serial_number) {
      const clientSerial = clientProfile.serial_number;

      window.supabaseClient
        .channel(`client-matches:${clientSerial}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'project_practitioner_matches',
          filter: `client_serial=eq.${clientSerial}`,
        }, (payload) => {
          const oldStatus = payload.old.status;
          const newStatus = payload.new.status;
          const newResponse = payload.new.practitioner_response;
          const oldResponse = payload.old.practitioner_response;

          // If practitioner declined or blocked
          if ((oldResponse !== 'declined' && newResponse === 'declined') ||
              (oldStatus === 'pending' && newStatus === 'declined')) {

            window.supabaseClient
              .from('project_practitioner_matches')
              .update({
                status: 'not-hired',
                updated_at: new Date().toISOString()
              })
              .eq('id', payload.new.id)
              .then(({ error }) => {
                if (!error) {
                  loadMatches(clientSerial).then(() => {
                    renderMatches();
                  });
                }
              });
          }
          // If match went from pending/active to hired/not-hired
          else if ((oldStatus === 'pending' || oldStatus === 'active' || oldStatus === 'in-progress') &&
                   (newStatus === 'hired' || newStatus === 'not-hired')) {

            loadMatches(clientSerial).then(() => {
              renderMatches();
            });
          }
          // If match went from pending to in-progress/active (practitioner accepted)
          else if (oldStatus === 'pending' && (newStatus === 'in-progress' || newStatus === 'active')) {

            // Create notification for the client
            const practitionerName = payload.new.practitioner_name || 'A practitioner';
            const clientSerial = payload.new.client_serial;

            window.supabaseClient
              .from('client_notifications')
              .insert({
                client_serial: clientSerial,
                type: 'match_accepted',
                title: 'Match Accepted!',
                message: `${practitionerName} has accepted your match request!`,
                practitioner_name: practitionerName,
                match_id: payload.new.id,
                is_read: false,
                created_at: new Date().toISOString()
              })
              .then(({ error }) => {
                if (!error) {
                  // Notification created
                }
              });

            loadMatches(clientSerial).then(() => {
              renderMatches();
            });
          }
        })
        .subscribe((status) => {
          // Subscription status
        });

      // Set up real-time listener for client notifications
      window.supabaseClient
        .channel(`client-notif:${clientSerial}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'client_notifications',
          filter: `client_serial=eq.${clientSerial}`,
        }, (payload) => {
          const notification = payload.new;

          // Show notification toast
          const notificationDiv = document.createElement('div');
          notificationDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #fbf7ec;
            border-left: 4px solid #4CAF50;
            padding: 16px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-size: 14px;
            max-width: 350px;
            animation: slideIn 0.3s ease-out;
          `;

          if (notification.type === 'match_accepted') {
            notificationDiv.style.borderLeftColor = '#4CAF50';
            notificationDiv.innerHTML = `
              <p style="margin: 0 0 8px 0; font-weight: 600; color: #2e2b28;">${notification.title}</p>
              <p style="margin: 0; color: #555;">${notification.message}</p>
            `;
          } else if (notification.type === 'match_declined') {
            notificationDiv.style.borderLeftColor = '#f44336';
            notificationDiv.innerHTML = `
              <p style="margin: 0 0 8px 0; font-weight: 600; color: #2e2b28;">${notification.title}</p>
              <p style="margin: 0; color: #555;">${notification.message}</p>
            `;
          }

          document.body.appendChild(notificationDiv);

          setTimeout(() => {
            notificationDiv.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
              notificationDiv.remove();
            }, 300);
          }, 5000);

          if (!document.querySelector('style[data-notif-anim]')) {
            const style = document.createElement('style');
            style.setAttribute('data-notif-anim', 'true');
            style.textContent = `
              @keyframes slideIn {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
              }
              @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(400px); opacity: 0; }
              }
            `;
            document.head.appendChild(style);
          }

          loadMatches(clientSerial).then(() => {
            renderMatches();
            updateJourneyCounters();
          });
        })
        .subscribe((status) => {
          // Subscription status
        });
    }

  } catch (error) {
    // Error initializing
  }

  // Expose global variables for matchMessagingManager
  window.allMatches = window.allMatches || allMatches;
  window.selectedMatchId = window.selectedMatchId || null;
  window.currentTab = currentTab;
  window.applyTabFilter = applyTabFilter;
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initializeMyWellness);

// ═══════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Show a toast notification to the user
 */
function showNotification(message, type = 'info') {
  const notificationDiv = document.createElement('div');
  notificationDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 20px;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    font-size: 14px;
    max-width: 400px;
    animation: notificationSlideIn 0.3s ease-out;
    color: #fff;
  `;

  // Style based on type
  if (type === 'error') {
    notificationDiv.style.background = '#f44336';
  } else if (type === 'success') {
    notificationDiv.style.background = '#4CAF50';
  } else if (type === 'warning') {
    notificationDiv.style.background = '#ff9800';
  } else {
    notificationDiv.style.background = '#2196F3';
  }

  notificationDiv.textContent = message;
  document.body.appendChild(notificationDiv);

  // Add animation styles if not already present
  if (!document.querySelector('style[data-notif-styles]')) {
    const style = document.createElement('style');
    style.setAttribute('data-notif-styles', 'true');
    style.textContent = `
      @keyframes notificationSlideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes notificationSlideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  // Auto-remove after 4 seconds
  setTimeout(() => {
    notificationDiv.style.animation = 'notificationSlideOut 0.3s ease-out';
    setTimeout(() => {
      notificationDiv.remove();
    }, 300);
  }, 4000);
}

// ═══════════════════════════════════════════════════════════════════
// MATCH LIST RENDERING
// ═══════════════════════════════════════════════════════════════════

/**
 * Update both journey counters - Total Journeys and Completed Care
 */
function updateJourneyCounters() {
  // Total Journeys = count of all projects (active + closed)
  const allProjects = document.querySelectorAll('.project-card').length;
  const totalJourneysElement = document.getElementById('total-projects');
  if (totalJourneysElement) {
    totalJourneysElement.textContent = allProjects;
  }
  
  // Completed Care = count of hired/completed projects
  const completedCount = (allMatches || []).filter(match => match.status === 'hired').length;
  const completedCareElement = document.getElementById('total-practitioners');
  if (completedCareElement) {
    completedCareElement.textContent = completedCount;
  }
}

/**
 * Update the Completed Care counter with count of closed/hired projects
 * @deprecated Use updateJourneyCounters() instead
 */
function updateCompletedCareCounter() {
  updateJourneyCounters();
}

/**
 * Display matches in the threads list container
 */
function displayMatches(page) {
  myWellnessState.currentPage = page;
  const container = document.getElementById('threads-list');

  if (filteredMatches.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 2rem; text-align: center; color: var(--text-tertiary);">
        <p>No practitioners found.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  filteredMatches.forEach(match => {
    const item = createThreadItem(match);

    item.addEventListener('click', (e) => {
      if (e.target.closest('.thread-menu-btn') ||
          e.target.closest('.opportunity-accept-btn') ||
          e.target.closest('.opportunity-decline-btn') ||
          e.target.closest('.thread-review-btn')) {
        return;
      }

      document.querySelectorAll('.thread-item').forEach(t => t.classList.remove('active'));
      item.classList.add('active');
      openMessagingThread(match);
    });

    container.appendChild(item);
  });

  // Attach button listeners
  attachOpportunityButtonListeners();

  // Update Completed Care counter
  updateCompletedCareCounter();

  // Hide pagination
  const paginationContainer = document.getElementById('pagination-container');
  if (paginationContainer) {
    paginationContainer.style.display = 'none';
  }
}

/**
 * Render match list using current filtered matches
 */
function renderMatches() {
  displayMatches(myWellnessState.currentPage);
}

// ═══════════════════════════════════════════════════════════════════
// THREAD ITEM CREATION
// ═══════════════════════════════════════════════════════════════════

/**
 * Create a thread item DOM element for the match list
 */
function createThreadItem(match) {
  const practitioner = match.practitioners;

  if (!practitioner || (typeof practitioner === 'object' && Object.keys(practitioner).length === 0)) {
    const item = document.createElement('button');
    item.className = 'thread-item';
    item.setAttribute('data-match-id', match.id);
    item.setAttribute('data-practitioner-serial', match.practitioner_serial);
    item.setAttribute('data-status', match.status);
    item.innerHTML = `<p style="color: #999; padding: 1rem;">Practitioner information unavailable</p>`;
    return item;
  }

  const displayName = formatPractitionerName(practitioner.dba_name || practitioner.legal_name || 'Practitioner');
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase();
  const logoUrl = practitioner.practice_logo_url;
  const specialty = 'Holistic Practitioner';
  const isPending = match.status === 'pending' && !match.practitioner_response;
  const phoneDisplay = isPending ? 'Phone available after acceptance' : formatPhoneNumber(practitioner.phone);
  const lastMessageTime = match.updated_at
    ? new Date(match.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Just now';

  const project = match.project || {};
  const services = getCategoryName(project);
  const location = project.zipcode || '-';
  const travelPrefs = project.travel_preference || '-';
  const description = project.description?.substring(0, 50) + '...' || '-';

  const isOpportunity = match.is_opportunity_message === true;
  const isClosed = match.status === 'hired' || match.status === 'not-hired' || match.status === 'declined';
  const isReviewable = match.status === 'hired' || match.status === 'not-hired';

  const item = document.createElement('button');
  item.className = `thread-item${isClosed ? ' thread-item--closed' : ''}${isOpportunity ? ' thread-item--opportunity' : ''}`;
  item.setAttribute('data-match-id', match.id);
  item.setAttribute('data-practitioner-serial', match.practitioner_serial);
  item.setAttribute('data-status', match.status);
  item.setAttribute('data-is-opportunity', isOpportunity);

  item.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; width: 100%;">
      <div class="thread-avatar-small">
        ${logoUrl ? `<img src="${logoUrl}" alt="${escapeHtml(displayName)}" style="width: 100%; height: 100%; object-fit: cover;">` : `<span style="color: #fbf7ec; font-weight: 700; font-size: 0.95rem;">${initials}</span>`}
      </div>
      <div style="flex: 1; min-width: 0;">
        <p class="thread-name">${escapeHtml(displayName)}</p>
        <p class="thread-preview">${escapeHtml(phoneDisplay)}</p>
        ${isOpportunity ? `<p class="thread-opportunity-badge" style="font-size: 0.75rem; color: #77883e; font-weight: 600; margin-top: 2px;">⭐ OPPORTUNITY</p>` : ''}
      </div>
      <span class="thread-time">${lastMessageTime}</span>
      ${!isOpportunity ? `
        <div class="thread-menu-wrapper">
          <button class="thread-menu-btn" title="Options">⋮</button>
        </div>
      ` : ''}
    </div>
    <div class="thread-meta">
      <div class="thread-project-details">
        <div class="project-detail-row">
          <div class="project-detail-item">
            <span class="detail-label">Services Needed</span>
            <span class="detail-value">${escapeHtml(services)}</span>
          </div>
          <div class="project-detail-item">
            <span class="detail-label">Location</span>
            <span class="detail-value">${escapeHtml(location)}</span>
          </div>
          <div class="project-detail-item">
            <span class="detail-label">Travel Preferences</span>
            <span class="detail-value">${escapeHtml(travelPrefs)}</span>
          </div>
        </div>
        <div class="project-detail-item">
          <span class="detail-label">Project Description</span>
          <span class="detail-value">${escapeHtml(description)}</span>
        </div>
      </div>
      ${isOpportunity ? `
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #ede9e2;">
          <p style="margin: 0 0 8px 0; font-size: 0.9rem; color: #666;">Message from Practitioner:</p>
          <p style="margin: 0 0 12px 0; font-size: 0.9rem; color: #333; line-height: 1.4; font-style: italic;">"${escapeHtml(match.opportunity_message_text)}"</p>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-sm btn-success opportunity-accept-btn" data-opportunity-id="${match.opportunity_id}" data-message-id="${match.id}" data-project-serial="${project.project_serial}" data-practitioner-serial="${match.practitioner_serial}">Accept</button>
            <button class="btn btn-sm btn-secondary opportunity-decline-btn" data-opportunity-id="${match.opportunity_id}">Decline</button>
          </div>
        </div>
      ` : (isReviewable ? `
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #ede9e2;">
          ${match.review && (match.review.rating > 0 || match.review.review_text) ? `
            <div style="margin-bottom: 12px;">
              <span class="badge badge--reviewed">★ Review</span>
            </div>
          ` : ''}
          <button class="thread-review-btn" data-match-id="${match.id}" data-practitioner-id="${match.practitioners?.id || ''}" data-practitioner-name="${escapeHtml(displayName)}" data-project-id="${match.project_serial || ''}" data-client-first-name="${escapeHtml(match.client_first_name || '')}" data-client-last-name="${escapeHtml(match.client_last_name || '')}">Leave Review</button>
        </div>
      ` : '')}
    </div>
  `;

  return item;
}

// ═══════════════════════════════════════════════════════════════════
// MESSAGING THREAD DISPLAY
// ═══════════════════════════════════════════════════════════════════

/**
 * Open and display the messaging thread for a selected match
 */
function openMessagingThread(match) {
  if (!match) {
    return;
  }

  // Fetch missing practitioner data if needed
  if (!match.practitioners || Object.keys(match.practitioners).length === 0) {
    window.supabaseClient.from('practitioners')
      .select('serial_number, id, legal_name, dba_name, phone, practice_city, practice_state, in_person_enabled, housecalls_enabled, virtual_enabled, timezone, email')
      .eq('serial_number', match.practitioner_serial)
      .then(({ data: practitionerData, error }) => {
        if (!error && practitionerData && practitionerData.length > 0) {
          match.practitioners = practitionerData[0];
          openMessagingThread(match);
        }
      });
    return;
  }

  selectedMatch = match;
  window.selectedMatchId = match.id;

  const practitioner = match.practitioners;
  const project = match.project || {};

  const threadPanelEl = document.getElementById('message-thread-panel');
  const threadNameEl = document.getElementById('thread-practitioner-name');
  const threadMetaEl = document.getElementById('thread-practitioner-meta');
  const threadAvatarEl = document.getElementById('thread-avatar');
  const closeThreadBtnEl = document.getElementById('close-thread-btn');
  const statusDropdownEl = document.getElementById('status-dropdown');
  const messageInputEl = document.getElementById('message-input');
  const sendBtnEl = document.getElementById('send-message-btn');
  const messageThreadEl = document.getElementById('message-thread');
  const messageInputAreaEl = document.querySelector('.message-input-area');

  if (!threadPanelEl || !threadNameEl) {
    return;
  }

  // Hide empty state
  if (messageThreadEl) {
    const emptyState = messageThreadEl.querySelector('.empty-state');
    if (emptyState) {
      emptyState.style.display = 'none';
    }
  }

  // Update header
  const practitionerDisplayName = formatPractitionerName(practitioner.dba_name || practitioner.legal_name || 'Practitioner');
  threadNameEl.textContent = practitionerDisplayName;
  threadNameEl.style.cursor = 'pointer';
  threadNameEl.style.color = '#77883e';
  threadNameEl.title = 'View practitioner profile';

  threadNameEl.onclick = () => {
    if (practitioner.id) {
      window.location.href = `/rooted-vitality/dashboard/pro/pages/practitioner-profile.html?id=${practitioner.id}`;
    }
  };

  // Update avatar
  if (threadAvatarEl) {
    const imgEl = threadAvatarEl.querySelector('#thread-avatar-img');
    const initialsEl = threadAvatarEl.querySelector('#thread-avatar-initials');

    if (practitioner.practice_logo_url) {
      if (imgEl) {
        imgEl.src = practitioner.practice_logo_url;
        imgEl.style.display = 'block';
      }
      if (initialsEl) {
        initialsEl.style.display = 'none';
      }
    } else {
      if (imgEl) {
        imgEl.style.display = 'none';
      }
      if (initialsEl) {
        const displayName = formatPractitionerName(practitioner.dba_name || practitioner.legal_name || 'Practitioner');
        initialsEl.textContent = displayName.split(' ').map(n => n[0]).join('').toUpperCase();
        initialsEl.style.display = 'block';
      }
    }

    threadAvatarEl.style.cursor = 'pointer';
    threadAvatarEl.onclick = () => {
      if (practitioner.id) {
        window.location.href = `/rooted-vitality/dashboard/pro/pages/practitioner-public-profile.html?id=${practitioner.id}`;
      }
    };
  }

  // Update meta info
  if (threadMetaEl) {
    const onlineStatus = 'Online';
    threadMetaEl.innerHTML = `
      <div id="thread-online-status" style="width: 8px; height: 8px; border-radius: 50%; background: #22c55e;"></div>
      <span id="thread-status-text" style="font-size: 13px; color: #666;">${onlineStatus}</span>
    `;
  }

  // Update close button
  if (closeThreadBtnEl) {
    closeThreadBtnEl.style.display = 'block';
    const newCloseBtn = closeThreadBtnEl.cloneNode(true);
    closeThreadBtnEl.parentNode.replaceChild(newCloseBtn, closeThreadBtnEl);

    const updatedCloseBtnEl = document.getElementById('close-thread-btn');
    updatedCloseBtnEl.addEventListener('click', closeMessagingThread);
  }

  // Update status dropdown
  if (statusDropdownEl) {
    const newDropdown = statusDropdownEl.cloneNode(true);
    statusDropdownEl.parentNode.replaceChild(newDropdown, statusDropdownEl);

    const updatedDropdownEl = document.getElementById('status-dropdown');
    const statusValue = match.status || 'pending';
    updatedDropdownEl.value = statusValue;
    updatedDropdownEl.style.display = 'block';

    const msgResponse = match.practitioner_response;
    const isLocked = match.status === 'pending' && !msgResponse;
    const isCompleted = match.status === 'not-hired' || match.status === 'hired' || match.status === 'declined';
    updatedDropdownEl.disabled = isLocked || isCompleted;

    if (updatedDropdownEl) {
      updatedDropdownEl.addEventListener('change', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const selectedStatus = e.target.value;
        const matchId = match.id;

        await updateMatchStatus(matchId, selectedStatus);
        const updatedMatch = allMatches.find(m => m.id === matchId);
        if (updatedMatch) {
          openMessagingThread(updatedMatch);
        }
      });
    }
  }

  // Update message input state based on match status
  const msgStatus = match.status;
  const msgResponse = match.practitioner_response;

  if (msgStatus === 'pending' && !msgResponse) {
    if (messageInputAreaEl) {
      messageInputAreaEl.style.display = 'flex';
      messageInputAreaEl.style.flexDirection = 'column';
      messageInputAreaEl.style.alignItems = 'center';
      messageInputAreaEl.style.justifyContent = 'center';
      messageInputAreaEl.style.padding = '24px';
      messageInputAreaEl.style.gap = '12px';

      if (messageInputEl) messageInputEl.style.display = 'none';
      if (sendBtnEl) sendBtnEl.style.display = 'none';

      let pendingMsgEl = messageInputAreaEl.querySelector('.pending-message-notice');
      if (!pendingMsgEl) {
        pendingMsgEl = document.createElement('div');
        pendingMsgEl.className = 'pending-message-notice';
        messageInputAreaEl.appendChild(pendingMsgEl);
      }

      pendingMsgEl.innerHTML = `
        <div style="text-align: center; color: #666;">
          <div style="font-size: 14px; font-weight: 500; margin-bottom: 8px;">
            Waiting for practitioner response
          </div>
          <div style="font-size: 13px; color: #888; line-height: 1.5;">
            Once ${practitioner.dba_name || practitioner.legal_name || 'the practitioner'} accepts your request,<br/>
            you'll be able to message them directly here.
          </div>
        </div>
      `;
    }
    if (messageInputEl) {
      messageInputEl.disabled = true;
      messageInputEl.placeholder = 'Waiting for practitioner response...';
    }
    if (sendBtnEl) sendBtnEl.disabled = true;

  } else if (msgResponse === 'declined') {
    if (messageInputAreaEl) {
      messageInputAreaEl.style.display = 'flex';
      messageInputAreaEl.style.flexDirection = 'column';
      messageInputAreaEl.style.alignItems = 'center';
      messageInputAreaEl.style.justifyContent = 'center';
      messageInputAreaEl.style.padding = '24px';

      if (messageInputEl) messageInputEl.style.display = 'none';
      if (sendBtnEl) sendBtnEl.style.display = 'none';

      let declinedMsgEl = messageInputAreaEl.querySelector('.declined-message-notice');
      if (!declinedMsgEl) {
        declinedMsgEl = document.createElement('div');
        declinedMsgEl.className = 'declined-message-notice';
        messageInputAreaEl.appendChild(declinedMsgEl);
      }

      declinedMsgEl.innerHTML = `
        <div style="text-align: center; color: #d32f2f;">
          <div style="font-size: 14px; font-weight: 500;">
            ✗ Practitioner has declined
          </div>
        </div>
      `;
    }
    if (messageInputEl) {
      messageInputEl.disabled = true;
      messageInputEl.placeholder = 'Practitioner has declined';
    }
    if (sendBtnEl) sendBtnEl.disabled = true;

  } else if (msgResponse === 'accepted' || msgStatus === 'active' || msgStatus === 'in-progress' || msgStatus === 'hired') {
    if (messageInputAreaEl) {
      messageInputAreaEl.style.display = 'flex';
      messageInputAreaEl.style.flexDirection = 'row';
      messageInputAreaEl.style.padding = '';
      messageInputAreaEl.style.gap = '';

      if (messageInputEl) {
        messageInputEl.style.display = 'block';
      }
      if (sendBtnEl) {
        sendBtnEl.style.display = 'block';
      }

      const pendingMsg = messageInputAreaEl.querySelector('.pending-message-notice');
      if (pendingMsg) pendingMsg.remove();

      const declinedMsg = messageInputAreaEl.querySelector('.declined-message-notice');
      if (declinedMsg) declinedMsg.remove();
    }
    if (messageInputEl) {
      messageInputEl.disabled = false;
      messageInputEl.placeholder = 'Type your message...';
    }
    if (sendBtnEl) sendBtnEl.disabled = false;

  } else {
    if (messageInputAreaEl) {
      messageInputAreaEl.style.display = 'none';
    }
    if (messageInputEl) {
      messageInputEl.disabled = true;
      messageInputEl.placeholder = 'Cannot send messages in this state';
    }
    if (sendBtnEl) sendBtnEl.disabled = true;
  }

  // Clear message thread
  if (messageThreadEl) {
    messageThreadEl.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">Loading messages...</div>';
  }

  // Initialize messaging system
  if (typeof initializeProjectMessaging === 'function') {
    initializeProjectMessaging(match.project, practitioner, match);
  }

  // Highlight selected card
  document.querySelectorAll('.match-card').forEach(card => {
    card.classList.remove('match-card--selected');
  });
  const selectedCard = document.querySelector(`[data-match-id="${match.id}"]`);
  if (selectedCard) {
    selectedCard.classList.add('match-card--selected');
  }
}

/**
 * Close the messaging thread without changing status
 */
function closeMessagingThread() {
  // Stop message polling
  if (typeof window !== 'undefined' && window.messagePollingInterval) {
    clearInterval(window.messagePollingInterval);
    window.messagePollingInterval = null;
  }

  // Reset loaded message tracking
  if (typeof window !== 'undefined') {
    window.loadedMessageIds = new Set();
  }

  // Hide the message thread
  const messageThreadEl = document.getElementById('message-thread');
  const messageInputAreaEl = document.querySelector('.message-input-area');

  if (messageThreadEl) {
    messageThreadEl.innerHTML = '<div class="empty-state"><p>Select a practitioner to view message history</p></div>';
    messageThreadEl.querySelector('.empty-state').style.display = 'block';
  }

  if (messageInputAreaEl) {
    messageInputAreaEl.style.display = 'none';
  }

  // Reset header
  const threadNameEl = document.getElementById('thread-practitioner-name');
  const closeThreadBtnEl = document.getElementById('close-thread-btn');
  const statusDropdownEl = document.getElementById('status-dropdown');
  const threadAvatarEl = document.getElementById('thread-avatar');
  const threadStatusTextEl = document.getElementById('thread-status-text');

  if (threadNameEl) threadNameEl.textContent = 'Select a practitioner';
  if (threadStatusTextEl) threadStatusTextEl.textContent = 'Offline';
  if (closeThreadBtnEl) closeThreadBtnEl.style.display = 'none';
  if (statusDropdownEl) statusDropdownEl.style.display = 'none';
  if (threadAvatarEl) {
    const imgEl = threadAvatarEl.querySelector('#thread-avatar-img');
    const initialsEl = threadAvatarEl.querySelector('#thread-avatar-initials');
    if (imgEl) {
      imgEl.src = '';
      imgEl.style.display = 'none';
    }
    if (initialsEl) {
      initialsEl.textContent = 'S';
      initialsEl.style.display = 'block';
    }
  }

  // Remove active state
  document.querySelectorAll('.thread-item').forEach(item => {
    item.classList.remove('active');
  });

  selectedMatch = null;
}

// ═══════════════════════════════════════════════════════════════════
// MODAL MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

/**
 * Initialize modal handlers
 */
function initModalHandlers() {
  const modal = document.getElementById('practitioner-modal');
  const closeBtn = document.querySelector('.modal__close');
  const cancelBtns = document.querySelectorAll('.modal-cancel');
  const overlay = document.querySelector('.modal__overlay');

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.add('modal--hidden');
    });
  }

  cancelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (modal) {
        modal.classList.add('modal--hidden');
      }
    });
  });

  if (overlay && modal) {
    overlay.addEventListener('click', () => {
      modal.classList.add('modal--hidden');
    });
  }
}

/**
 * Open practitioner modal with detailed information
 */
function openPractitionerModal(matchId) {
  const match = allMatches.find(m => m.id === matchId);
  if (!match || !match.practitioners) return;

  const p = match.practitioners;
  const displayName = formatPractitionerName(p.dba_name || p.legal_name || 'Practitioner');
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase();

  // Set avatar
  const logoUrl = p.practice_logo_url;
  const modalAvatarEl = document.getElementById('modal-avatar');
  if (logoUrl) {
    modalAvatarEl.innerHTML = `<img src="${logoUrl}" alt="${escapeHtml(displayName)}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
  } else {
    modalAvatarEl.textContent = initials;
  }

  document.getElementById('modal-name').textContent = displayName;
  document.getElementById('modal-specialty').textContent = 'Holistic Practitioner';

  const displayStatus = match.status;
  const statusLabel = {
    pending: 'Pending Review',
    active: 'Connected',
    'in-progress': 'In Progress',
    hired: 'Hired',
    completed: 'Completed',
    closed: 'Closed'
  }[displayStatus] || displayStatus;

  const statusClass = `status-${displayStatus}`;
  document.getElementById('modal-status').innerHTML = `<span class="match-card__status-indicator ${statusClass}">${statusLabel}</span>`;

  // Status message
  const statusMessageEl = document.getElementById('modal-status-message');
  const statusContentEl = document.getElementById('status-message-content');

  const msgStatus = match.status;
  const response = match.practitioner_response;

  if (msgStatus === 'pending' && !response) {
    statusMessageEl.style.display = 'block';
    statusContentEl.innerHTML = `
      <p><strong>✓ Connection Request Sent</strong></p>
      <p>An automatic message has been sent to ${displayName}, introducing you and your wellness project.</p>
      <p><strong>Next step:</strong> Once they accept your request, you'll be able to interact with them on the <strong>My Team</strong> page and send messages directly.</p>
    `;
  } else if (msgStatus === 'pending' && response === 'declined') {
    statusMessageEl.style.display = 'block';
    statusContentEl.innerHTML = `
      <p><strong>✗ Connection Declined</strong></p>
      <p>${displayName} declined your connection request${match.practitioner_response_reason ? ': ' + match.practitioner_response_reason : ''}.</p>
      <p>You can search for other practitioners on the Find Practitioners page.</p>
    `;
  } else if (msgStatus === 'in-progress' && response === 'accepted') {
    statusMessageEl.style.display = 'block';
    statusContentEl.innerHTML = `
      <p><strong>✓ Connection Accepted</strong></p>
      <p>${displayName} has accepted your request and you can now communicate on the <strong>My Team</strong> page.</p>
    `;
  } else if (msgStatus === 'hired' && response === 'accepted') {
    statusMessageEl.style.display = 'block';
    statusContentEl.innerHTML = `
      <p><strong>✓ Engagement Active</strong></p>
      <p>${displayName} is engaged on your project. Continue communication on the <strong>My Team</strong> page.</p>
    `;
  } else if (msgStatus === 'hired' || msgStatus === 'not-hired' || msgStatus === 'declined') {
    statusMessageEl.style.display = 'block';
    statusContentEl.innerHTML = `
      <p><strong>✓ Engagement Complete</strong></p>
      <p>Thank you for working with ${displayName}. Consider leaving a review of your experience.</p>
    `;
  } else {
    statusMessageEl.style.display = 'none';
  }

  document.getElementById('modal-bio').textContent = p.bio || 'No bio available';

  // Services
  const services = [
    p.in_person_enabled && 'In-Person Sessions',
    p.housecalls_enabled && 'House Calls',
    p.virtual_enabled && 'Virtual Sessions'
  ].filter(Boolean);
  document.getElementById('modal-services').innerHTML = services.length > 0
    ? `<ul style="margin: 0; padding-left: 1.25rem;"><li>${services.join('</li><li>')}</li></ul>`
    : '–';

  // Availability
  document.getElementById('modal-availability').innerHTML = `
    <div style="font-size: 0.95rem; line-height: 1.6; color: #555;">
      <p><strong>Timezone:</strong> ${p.timezone || 'Not specified'}</p>
      <p><strong>Modalities:</strong> ${p.modalities?.join(', ') || 'Not specified'}</p>
    </div>
  `;

  // Contact
  document.getElementById('modal-contact').innerHTML = `
    <div style="font-size: 0.95rem; line-height: 1.6; color: #555;">
      <p><strong>Email:</strong> ${p.email ? `<a href="mailto:${p.email}">${p.email}</a>` : 'Not available'}</p>
      <p><strong>Phone:</strong> ${p.phone || 'Not available'}</p>
    </div>
  `;

  // Message button
  const messageBtn = document.getElementById('btn-message');
  if (messageBtn) {
    if (match.status === 'accepted') {
      messageBtn.textContent = 'Send Message';
      messageBtn.onclick = () => sendMessage(matchId);
    } else if (match.status === 'pending') {
      messageBtn.textContent = 'Pending Response';
      messageBtn.disabled = true;
    } else {
      messageBtn.textContent = 'Connection Declined';
      messageBtn.disabled = true;
    }
  }

  const modal = document.getElementById('practitioner-modal');
  if (modal) {
    modal.classList.remove('modal--hidden');
  }
}

// ═══════════════════════════════════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════════

/**
 * Initialize filter handlers
 */
function initFilterHandlers() {
  const tabs = document.querySelectorAll('.sidebar-tab');
  const sortSelect = document.getElementById('sort-connections');
  const searchInput = document.getElementById('search-conversations');

  // Tab navigation
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const tabName = tab.getAttribute('data-tab');
      currentTab = tabName;
      window.currentTab = tabName;

      applyTabFilter(tabName);
    });
  });

  // Sort selection
  if (sortSelect) {
    sortSelect.addEventListener('change', applySorting);
  }

  // Search functionality
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();

      if (searchTerm.trim() === '') {
        displayMatches(1);
      } else {
        filteredMatches = allMatches.filter(m => {
          const practitioner = m.practitioners;
          if (!practitioner) return false;

          const name = (practitioner.dba_name || practitioner.legal_name || '').toLowerCase();
          const specialty = ''.toLowerCase();

          return name.includes(searchTerm) || specialty.includes(searchTerm);
        });

        displayMatches(1);
      }
    });
  }
}

/**
 * Attach event listeners to opportunity buttons
 */
function attachOpportunityButtonListeners() {
  // Accept buttons
  document.querySelectorAll('.opportunity-accept-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const opportunityId = btn.dataset.opportunityId;
      const projectSerial = btn.dataset.projectSerial;
      const practitionerSerial = btn.dataset.practitionerSerial;

      if (typeof window.acceptOpportunityMessage === 'function') {
        await window.acceptOpportunityMessage(opportunityId, projectSerial, practitionerSerial);
        const clientProfile = await window.supabaseClient
          .from('clients')
          .select('serial_number')
          .eq('id', window.authManager.getCurrentUser().id)
          .single();
        if (clientProfile.data) {
          await loadMatches(clientProfile.data.serial_number);
        }
      }
    });
  });

  // Decline buttons
  document.querySelectorAll('.opportunity-decline-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const opportunityId = btn.dataset.opportunityId;

      if (typeof window.declineOpportunityMessage === 'function') {
        await window.declineOpportunityMessage(opportunityId);
        const clientProfile = await window.supabaseClient
          .from('clients')
          .select('serial_number')
          .eq('id', window.authManager.getCurrentUser().id)
          .single();
        if (clientProfile.data) {
          await loadMatches(clientProfile.data.serial_number);
        }
      }
    });
  });

  // Attach review button listeners
  attachReviewButtonListeners();
}

/**
 * Attach event listeners to review buttons
 */
function attachReviewButtonListeners() {
  const reviewBtns = document.querySelectorAll('.thread-review-btn');

  reviewBtns.forEach(btn => {
    initializeReviewButtonText(btn);

    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const matchId = btn.dataset.matchId;
      const practitionerId = btn.dataset.practitionerId;
      const practitionerName = btn.dataset.practitionerName;
      const projectId = btn.dataset.projectId;
      const clientFirstName = btn.dataset.clientFirstName;
      const clientLastName = btn.dataset.clientLastName;
      const clientId = window.authManager?.getCurrentUser()?.id;

      if (window.reviewsManager && typeof window.reviewsManager.openReviewModal === 'function') {
        try {
          const hasExistingReview = await window.reviewsManager.checkForExistingReview(
            projectId,
            practitionerId,
            clientId
          );

          if (hasExistingReview) {
            btn.textContent = 'Update Review';
          } else {
            btn.textContent = 'Leave Review';
          }
        } catch (e) {
          // Error checking for existing review
        }

        window.reviewsManager.openReviewModal(
          matchId,
          practitionerId,
          practitionerName,
          projectId,
          clientFirstName,
          clientLastName,
          clientId
        );
      }
    });
  });
}

/**
 * Initialize review button text based on existing reviews
 */
async function initializeReviewButtonText(btn) {
  const projectId = btn.dataset.projectId;
  const practitionerId = btn.dataset.practitionerId;
  const clientId = window.authManager?.getCurrentUser()?.id;

  if (!projectId || !practitionerId || !clientId || !window.reviewsManager) {
    return;
  }

  try {
    const hasExistingReview = await window.reviewsManager.checkForExistingReview(
      projectId,
      practitionerId,
      clientId
    );

    if (hasExistingReview) {
      btn.textContent = 'Update Review';
    }
  } catch (e) {
    // Error initializing review button text
  }
}

/**
 * Initialize message thread handlers
 */
function initMessageThreadHandlers() {
  // No longer needed for 3-column layout - handlers are inline in openMessagingThread
}

// ═══════════════════════════════════════════════════════════════════
// PAGINATION
// ═══════════════════════════════════════════════════════════════════

/**
 * Render pagination controls
 */
function renderPagination(totalPages) {
  const container = document.getElementById('pagination-container');
  container.innerHTML = '';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'pagination-btn';
  prevBtn.textContent = '← Prev';
  prevBtn.disabled = myWellnessState.currentPage === 1;
  prevBtn.addEventListener('click', () => displayMatches(myWellnessState.currentPage - 1));
  container.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.className = 'pagination-btn';
    if (i === myWellnessState.currentPage) btn.classList.add('pagination-btn--active');
    btn.textContent = i;
    btn.addEventListener('click', () => displayMatches(i));
    container.appendChild(btn);
  }

  const nextBtn = document.createElement('button');
  nextBtn.className = 'pagination-btn';
  nextBtn.textContent = 'Next →';
  nextBtn.disabled = myWellnessState.currentPage === totalPages;
  nextBtn.addEventListener('click', () => displayMatches(myWellnessState.currentPage + 1));
  container.appendChild(nextBtn);
}

// ═══════════════════════════════════════════════════════════════════
// PROJECT MANAGEMENT - MODAL & FORM HANDLERS
// ═══════════════════════════════════════════════════════════════════

const TERMINAL_STATUSES = ['hired', 'canceled'];

/**
 * Open the close project modal - CALLED FROM INLINE ONCLICK
 */
function openCloseProjectModal(projectId) {
  const closeProjectModal = document.getElementById('close-project-modal');
  if (closeProjectModal) {
    window.projectToClose = projectId;
    
    const form = document.getElementById('close-project-form');
    if (form) {
      form.reset();
    }
    
    const otherReasonGroup = document.getElementById('other-reason-group');
    if (otherReasonGroup) {
      otherReasonGroup.classList.add('hidden');
    }
    
    closeProjectModal.classList.remove('modal--hidden');
  }
}

/**
 * Browse for practitioners for a project - CALLED FROM INLINE ONCLICK
 */
function browseForProject(projectId) {
  window.location.href = `./find-practitioners.html?project_id=${projectId}`;
}

/**
 * Populate category dropdown from taxonomy data
 */
function populateCategoryDropdown() {
  const categorySelect = document.getElementById('project-category');
  if (!categorySelect) return;

  // Clear existing options (keep placeholder)
  categorySelect.innerHTML = '<option value="">-- Select a category --</option>';

  // Populate from taxonomyData
  if (taxonomyData && Object.keys(taxonomyData).length > 0) {
    Object.values(taxonomyData).forEach(category => {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = category.name;
      categorySelect.appendChild(option);
    });
  }

  // Reset subcategories group visibility
  const subcategoriesGroup = document.getElementById('subcategories-group');
  if (subcategoriesGroup) {
    subcategoriesGroup.classList.add('hidden');
  }

  // Attach change listener to category dropdown
  categorySelect.addEventListener('change', handleCategoryChange);

  // Attach character counter to description field
  const descriptionField = document.getElementById('project-description');
  if (descriptionField) {
    // Remove old listeners by cloning
    const newDescField = descriptionField.cloneNode(true);
    descriptionField.parentNode.replaceChild(newDescField, descriptionField);

    // Attach new listener
    newDescField.addEventListener('input', (e) => {
      const charCount = document.getElementById('char-count');
      if (charCount) {
        charCount.textContent = e.target.value.length;
      }
    });
  }
}

/**
 * Handle category selection and populate subcategories
 */
function handleCategoryChange(e) {
  const categoryId = e.target.value;
  const subcategoriesGroup = document.getElementById('subcategories-group');
  const subcategoriesContainer = document.getElementById('subcategories-container');

  if (!categoryId) {
    if (subcategoriesGroup) {
      subcategoriesGroup.classList.add('hidden');
    }
    return;
  }

  const category = taxonomyData[categoryId];
  if (!category || !category.subcategories || category.subcategories.length === 0) {
    if (subcategoriesGroup) {
      subcategoriesGroup.classList.add('hidden');
    }
    return;
  }

  // Show subcategories group
  if (subcategoriesGroup) {
    subcategoriesGroup.classList.remove('hidden');
  }

  // Clear existing checkboxes
  if (subcategoriesContainer) {
    subcategoriesContainer.innerHTML = '';

    // Create checkbox for each subcategory
    category.subcategories.forEach(subcategoryName => {
      const label = document.createElement('label');
      label.className = 'checkbox-label';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.name = 'subcategories';
      checkbox.value = subcategoryName;

      const span = document.createElement('span');
      span.className = 'checkbox-text';
      span.textContent = subcategoryName;

      label.appendChild(checkbox);
      label.appendChild(span);
      subcategoriesContainer.appendChild(label);
    });
  }
}

/**
 * Open modal helper
 */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    modal.classList.remove('modal--hidden');
    
    // Populate categories if this is the create project modal
    if (modalId === 'create-project-modal') {
      populateCategoryDropdown();
      resetCreateProjectForm();
    }
  }
}

/**
 * Reset the create project form to initial state
 */
function resetCreateProjectForm() {
  const form = document.getElementById('create-project-form');
  if (form) {
    form.reset();
  }

  // Reset character counter
  const charCount = document.getElementById('char-count');
  if (charCount) {
    charCount.textContent = '0';
  }

  // Hide subcategories group
  const subcategoriesGroup = document.getElementById('subcategories-group');
  if (subcategoriesGroup) {
    subcategoriesGroup.classList.add('hidden');
  }

  // Clear subcategories
  const subcategoriesContainer = document.getElementById('subcategories-container');
  if (subcategoriesContainer) {
    subcategoriesContainer.innerHTML = '';
  }
}

/**
 * Close modal helper
 */
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    modal.classList.add('modal--hidden');
  }
}

/**
 * Initialize project form event listeners
 */
function initProjectFormHandlers() {
  const createBtn = document.getElementById('create-project-btn');
  if (createBtn) {
    createBtn.addEventListener('click', () => {
      openModal('create-project-modal');
    });
  }

  const matchNowBtn = document.getElementById('btn-match-now');
  if (matchNowBtn) {
    matchNowBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await submitCreateProjectAndFindMatches(e);
    });
  }

  const form = document.getElementById('create-project-form');
  if (form) {
    form.addEventListener('submit', submitCreateProject);
  }

  const closeProjectForm = document.getElementById('close-project-form');
  if (closeProjectForm) {
    closeProjectForm.addEventListener('submit', submitCloseProject);
  }

  const openToMatchToggle = document.getElementById('open-to-match-toggle');
  if (openToMatchToggle) {
    openToMatchToggle.addEventListener('change', async (e) => {
      await handleOpenToMatchToggle(e.target.checked);
    });
  }

  document.querySelectorAll('.modal__close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal');
      if (modal) {
        modal.classList.add('modal--hidden');
      }
    });
  });

  document.querySelectorAll('.modal__overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal');
      if (modal) {
        modal.classList.add('modal--hidden');
      }
    });
  });

  const closeProjectForm_local = document.getElementById('close-project-form');
  if (closeProjectForm_local) {
    const reasonRadios = closeProjectForm_local.querySelectorAll('input[name="closure-reason"]');
    reasonRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const otherReasonGroup = document.getElementById('other-reason-group');
        if (otherReasonGroup) {
          if (e.target.value === 'other') {
            otherReasonGroup.classList.remove('hidden');
          } else {
            otherReasonGroup.classList.add('hidden');
          }
        }
      });
    });
  }
}

/**
 * Attach collapse/expand handlers to project cards
 */
function attachProjectCollapseToggle() {
  const toggleButtons = document.querySelectorAll('.project-card__toggle');
  
  toggleButtons.forEach(button => {
    // Remove any existing listeners
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
    
    // Attach new listener
    newButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const projectId = newButton.getAttribute('data-toggle-card');
      const card = newButton.closest('.project-card');
      const cardBody = document.querySelector(`.project-card__body[data-card-body="${projectId}"]`);
      const footer = card?.querySelector('.project-card__footer');
      
      if (cardBody && footer && card) {
        cardBody.classList.toggle('project-card__body--collapsed');
        footer.classList.toggle('project-card__footer--collapsed');
        newButton.classList.toggle('project-card__toggle--rotated');
        card.classList.toggle('project-card--minimized');
      }
    });
  });
}

/**
 * Submit project creation form
 */
async function submitCreateProject(e) {
  e.preventDefault();
  console.log('[submitCreateProject] Project creation submitted');
}

/**
 * Submit create project and find matches
 */
async function submitCreateProjectAndFindMatches(e) {
  e.preventDefault();

  try {
    // Get current user
    if (!window.supabaseClient || !window.authManager) {
      showNotification('Authentication required', 'error');
      return;
    }

    const currentUser = window.authManager.getCurrentUser();
    if (!currentUser) {
      window.location.href = '/rooted-vitality/dashboard/client/pages/client-signup.html';
      return;
    }

    // Get client profile for serial number
    const { data: clientProfile, error: clientError } = await window.supabaseClient
      .from('clients')
      .select('id, serial_number')
      .eq('id', currentUser.id)
      .single();

    if (clientError || !clientProfile) {
      console.error('[submitCreateProjectAndFindMatches] Client profile error:', clientError);
      showNotification('Could not load client profile', 'error');
      return;
    }

    console.log('[submitCreateProjectAndFindMatches] Client profile:', { id: clientProfile.id, serial_number: clientProfile.serial_number });

    // Validate form
    const form = document.getElementById('create-project-form');
    if (!form || !form.checkValidity()) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    // Get form data
    const formData = new FormData(form);
    const categoryId = formData.get('category_id');
    const description = formData.get('description');
    const urgency = formData.get('urgency');
    const travelPreference = formData.get('travel_preference');
    const city = formData.get('city');
    const state = formData.get('state');
    const zipcode = formData.get('zipcode');
    const street = formData.get('street') || null;

    console.log('[submitCreateProjectAndFindMatches] Form values:', {
      urgency,
      travelPreference,
      categoryId,
      description
    });

    // Get category info from taxonomy (categoryId is the UUID)
    const taxonomyEntry = taxonomyData[categoryId];
    const categoryName = taxonomyEntry?.name || 'Wellness Journey';
    const categoryIdText = taxonomyEntry?.category_id; // This is the text ID needed for projects table

    console.log('[submitCreateProjectAndFindMatches] Category lookup:', {
      categoryId,
      categoryIdText,
      categoryName,
      taxonomyKeys: Object.keys(taxonomyData || {}),
      categoryFromTaxonomy: taxonomyEntry
    });

    // Validate category exists
    if (!categoryId || !taxonomyEntry) {
      showNotification('Please select a valid category', 'error');
      console.error('[submitCreateProjectAndFindMatches] Invalid category:', categoryId);
      return;
    }

    // Get selected subcategories
    const subcategoryCheckboxes = form.querySelectorAll('input[name="subcategories"]:checked');
    const subcategories = Array.from(subcategoryCheckboxes).map(cb => cb.value);

    // Create project in database
    const { data: newProject, error: createError } = await window.supabaseClient
      .from('projects')
      .insert([{
        client_id: currentUser.id,
        client_serial: clientProfile.serial_number,
        category_id: categoryIdText,
        category_name: categoryName,
        description: description,
        urgency: urgency,
        travel_preference: travelPreference,
        street: street || '',
        city: city,
        state: state,
        zipcode: zipcode,
        project_status: 'pending',
        start_date: new Date().toISOString()
      }])
      .select('id')
      .single();

    if (createError || !newProject) {
      console.error('[submitCreateProjectAndFindMatches] Error creating project:', createError);
      showNotification('Failed to create wellness journey: ' + (createError?.message || 'Unknown error'), 'error');
      return;
    }

    // Fetch the full project to get project_serial
    const { data: fullProject, error: fetchError } = await window.supabaseClient
      .from('projects')
      .select('id, project_serial')
      .eq('id', newProject.id)
      .single();

    if (fetchError || !fullProject) {
      console.error('[submitCreateProjectAndFindMatches] Error fetching project:', fetchError);
      showNotification('Project created but could not retrieve ID', 'error');
      return;
    }

    const projectId = fullProject.project_serial || fullProject.id;

    // Close the modal
    closeModal('create-project-modal');

    // Reload projects to show the new one
    const { data: clientProfile2 } = await window.supabaseClient
      .from('clients')
      .select('serial_number')
      .eq('id', currentUser.id)
      .single();

    if (clientProfile2 && typeof loadProjects === 'function') {
      await loadProjects(clientProfile2.serial_number);
    }

    // Redirect to find practitioners page with the new project
    setTimeout(() => {
      window.location.href = `./find-practitioners.html?project_id=${projectId}`;
    }, 500);

  } catch (error) {
    console.error('[submitCreateProjectAndFindMatches] Exception:', error);
    showNotification('An error occurred creating your wellness journey', 'error');
  }
}

/**
 * Submit close project form
 */
async function submitCloseProject(e) {
  e.preventDefault();
  
  if (!window.projectToClose) {
    console.error('[submitCloseProject] No project ID found');
    showNotification('Error: Could not identify project to close', 'error');
    return;
  }

  const projectId = window.projectToClose;
  const closureReason = document.querySelector('input[name="closure-reason"]:checked')?.value;
  const otherReason = document.getElementById('other-reason')?.value || '';

  if (!closureReason) {
    showNotification('Please select an outcome for this journey', 'error');
    return;
  }

  if (closureReason === 'other' && !otherReason.trim()) {
    showNotification('Please provide details about why you\'re closing this journey', 'error');
    return;
  }

  try {
    // Determine the project status based on closure reason
    let newStatus = 'canceled'; // Default to canceled
    if (closureReason === 'hired') {
      newStatus = 'hired'; // Hired practitioners mean project is hired
    }

    // Update project status to closed with closure reason
    const { error: updateError } = await window.supabaseClient
      .from('projects')
      .update({
        project_status: newStatus,
        closure_reason: closureReason,
        closure_notes: closureReason === 'other' ? otherReason : null
      })
      .eq('project_serial', projectId);

    if (updateError) {
      console.error('[submitCloseProject] Error updating project:', updateError);
      showNotification('Failed to close journey: ' + (updateError?.message || 'Unknown error'), 'error');
      return;
    }

    // Close the modal
    closeModal('close-project-modal');

    // Show success message
    showNotification('Journey closed successfully', 'success');

    // Reload projects to reflect the change
    const currentUser = window.authManager?.getCurrentUser?.();
    if (currentUser && typeof loadProjects === 'function') {
      const { data: clientProfile } = await window.supabaseClient
        .from('clients')
        .select('serial_number')
        .eq('id', currentUser.id)
        .single();

      if (clientProfile) {
        await loadProjects(clientProfile.serial_number);
      }
    }

  } catch (error) {
    console.error('[submitCloseProject] Exception:', error);
    showNotification('An error occurred closing your journey', 'error');
  }
}

/**
 * Handle Open to Match toggle
 */
async function handleOpenToMatchToggle(isChecked) {
  console.log('[handleOpenToMatchToggle] Toggle:', isChecked);
}

/**
 * Initialize project form handlers when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
  initProjectFormHandlers();
});

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

// Expose global state and functions
window.myWellnessUI = {
  renderMatches,
  displayMatches,
  openMessagingThread,
  closeMessagingThread,
  openPractitionerModal,
  initFilterHandlers,
  initModalHandlers,
  initMessageThreadHandlers,
  initializeMyWellness,
  openCloseProjectModal,
  browseForProject,
  openModal,
  closeModal
};
