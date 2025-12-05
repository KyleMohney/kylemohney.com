/*
╔═════════════════════════════════════════════════════════════════════════════╗
║                         ROOTED VITALITY DASHBOARD                           ║
║                    CLIENT INBOX UI (RENDERING)                              ║
║                                                                             ║
║ File:        dashboard/client/scripts/inbox-ui.js                           ║
║ Purpose:     UI rendering, display management, and user interactions        ║
║ Description: Handles DOM rendering for match cards, threading, modals,      ║
║              messaging interface, and all event listeners for user actions. ║
║ Last Update: November 2025                                                  ║
║ Status:      Production-Ready | Build Standard v2.0 Compliant               ║
║                                                                             ║
║ QUICK REFERENCE:                                                            ║
║ - Match Display | Thread UI | Modal Management | Event Binding              ║
║ - DOM Creation | Dynamic Updates | User Interactions                        ║
║                                                                             ║
╚═════════════════════════════════════════════════════════════════════════════╝
*/

// ═══════════════════════════════════════════════════════════════════════════
// TABLE OF CONTENTS
// ═══════════════════════════════════════════════════════════════════════════
//
// 1. INITIALIZATION & SETUP
// 2. MATCH LIST RENDERING
// 3. THREAD ITEM CREATION
// 4. MESSAGING THREAD DISPLAY
// 5. MODAL MANAGEMENT
// 6. EVENT LISTENERS
// 7. PAGINATION
//
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// 1. INITIALIZATION & SETUP
// ═══════════════════════════════════════════════════════════════════════════

// Note: State variables (currentPage, allMatches, etc.) are declared in inbox-manager.js
// This file accesses them globally

/**
 * Initialize UI handlers (called on page load)
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

  // Sorting
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
 * Initialize message thread event handlers
 */
function initMessageThreadHandlers() {
  // Handlers are inline in openMessagingThread for 3-column layout
}

/**
 * Initialize modal handlers
 */
function initModalHandlers() {
  const modal = document.getElementById('practitioner-modal');
  const closeBtn = document.querySelector('.modal__close');
  const cancelBtns = document.querySelectorAll('.modal-cancel');
  const overlay = document.querySelector('.modal__overlay');

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.add('modal--hidden');
    });
  }

  cancelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modal.classList.add('modal--hidden');
    });
  });

  if (overlay) {
    overlay.addEventListener('click', () => {
      modal.classList.add('modal--hidden');
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. MATCH LIST RENDERING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Display matches in the threads list container
 */
function displayMatches(page) {
  inboxState.currentPage = page;
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
  displayMatches(currentPage);
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. THREAD ITEM CREATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a thread item DOM element for the match list
 */
function createThreadItem(match) {
  const practitioner = match.practitioners;

  // Handle missing practitioner data
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

  // Project details
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
          <button class="thread-review-btn" data-match-id="${match.id}" data-practitioner-id="${match.practitioners?.id || ''}" data-practitioner-name="${escapeHtml(displayName)}" data-project-id="${match.project_serial || ''}" data-client-first-name="${escapeHtml(match.client_first_name || '')}" data-client-last-name="${escapeHtml(match.client_last_name || '')}">Leave Review</button>
        </div>
      ` : '')}
    </div>
  `;

  return item;
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. MESSAGING THREAD DISPLAY
// ═══════════════════════════════════════════════════════════════════════════

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
      .select('serial_number, id, legal_name, dba_name, phone, practice_city, practice_state, in_person_enabled, housecalls_enabled, virtual_enabled, timezone, email, practice_logo_url')
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

  // Get DOM elements
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

  // Show thread header and controls
  const threadHeaderEl = document.querySelector('.thread-header');
  if (threadHeaderEl) {
    threadHeaderEl.classList.add('active');
  }
  if (closeThreadBtnEl) {
    closeThreadBtnEl.classList.remove('hidden');
  }
  if (statusDropdownEl) {
    statusDropdownEl.classList.remove('hidden');
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
        // Add error handler to fall back to initials if image fails to load
        imgEl.onerror = () => {
          imgEl.style.display = 'none';
          if (initialsEl) {
            const displayName = formatPractitionerName(practitioner.dba_name || practitioner.legal_name || 'Practitioner');
            initialsEl.textContent = displayName.split(' ').map(n => n[0]).join('').toUpperCase();
            initialsEl.style.display = 'block';
          }
        };
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
      <div class="thread-status-container">
        <div id="thread-online-status" class="thread-status-indicator thread-status-indicator--online"></div>
        <span id="thread-status-text" class="thread-status-text">${onlineStatus}</span>
      </div>
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
  const threadHeaderEl = document.querySelector('.thread-header');

  if (threadNameEl) threadNameEl.textContent = 'Select a practitioner';
  if (threadStatusTextEl) threadStatusTextEl.textContent = 'Offline';
  if (closeThreadBtnEl) closeThreadBtnEl.style.display = 'none';
  if (statusDropdownEl) statusDropdownEl.style.display = 'none';
  if (threadHeaderEl) threadHeaderEl.classList.remove('active');
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

// ═══════════════════════════════════════════════════════════════════════════
// 5. MODAL MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

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

  const modal = document.getElementById('practitioner-modal');
  modal.classList.remove('modal--hidden');
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════════════════

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
          // Error checking for existing review - will use default text
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
    // Error initializing review button text - will use default
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. PAGINATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Render pagination controls
 */
function renderPagination(totalPages) {
  const container = document.getElementById('pagination-container');
  container.innerHTML = '';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'pagination-btn';
  prevBtn.textContent = '← Prev';
  prevBtn.disabled = inboxState.currentPage === 1;
  prevBtn.addEventListener('click', () => displayMatches(inboxState.currentPage - 1));
  container.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.className = 'pagination-btn';
    if (i === inboxState.currentPage) btn.classList.add('pagination-btn--active');
    btn.textContent = i;
    btn.addEventListener('click', () => displayMatches(i));
    container.appendChild(btn);
  }

  const nextBtn = document.createElement('button');
  nextBtn.className = 'pagination-btn';
  nextBtn.textContent = 'Next →';
  nextBtn.disabled = inboxState.currentPage === totalPages;
  nextBtn.addEventListener('click', () => displayMatches(inboxState.currentPage + 1));
  container.appendChild(nextBtn);
}

/**
 * Initialize the entire inbox application
 */
async function initializeInbox() {
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

    // Load taxonomy data first (for category name lookups)
    await loadTaxonomy();

    // Load matches
    await loadMatches(clientProfile.serial_number);

    // Initialize handlers
    initFilterHandlers();
    initModalHandlers();
    initMessageThreadHandlers();
    
    // Check if redirected from contact button with auto-open params
    const urlParams = new URLSearchParams(window.location.search);
    const autoOpenProjectId = urlParams.get('project_id');
    const autoOpenPractitionerSerial = urlParams.get('practitioner_serial');
    
    if (autoOpenProjectId && autoOpenPractitionerSerial) {
      // Find the match and open it
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
          
          // If practitioner declined or blocked (practitioner_response changed to 'declined')
          if ((oldResponse !== 'declined' && newResponse === 'declined') || 
              (oldStatus === 'pending' && newStatus === 'declined')) {
            
            // Auto-update status to not-hired in the database
            window.supabaseClient
              .from('project_practitioner_matches')
              .update({ 
                status: 'not-hired',
                updated_at: new Date().toISOString()
              })
              .eq('id', payload.new.id)
              .then(({ error }) => {
                if (!error) {
                  // Reload matches to reflect the change
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
                  // Notification created successfully
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

          // Display notification based on type
          if (notification.type === 'match_accepted' || notification.type === 'match_declined') {
            const message = `${notification.title}: ${notification.message}`;
            const notificationType = notification.type === 'match_accepted' ? 'success' : 'warning';
            
            // Use universal notification system if available
            if (window.showToast) {
              window.showToast(message, notificationType, 5000);
            } else if (window.notificationManager) {
              // Fallback to notificationManager if available
              window.notificationManager.displayNotification(message, notificationType);
            }
          }
          
          // Reload matches to show updated status
          loadMatches(clientSerial).then(() => {
            renderMatches();
          });
        })
        .subscribe((status) => {
          // Subscription status
        });
    }
  } catch (error) {
    console.error('Error initializing inbox:', error);
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initializeInbox);

// Expose global state and functions
window.inboxUI = {
  renderMatches,
  displayMatches,
  openMessagingThread,
  closeMessagingThread,
  openPractitionerModal,
  initFilterHandlers,
  initModalHandlers,
  initMessageThreadHandlers,
  initializeInbox
};
