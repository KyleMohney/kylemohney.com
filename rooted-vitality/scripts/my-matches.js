/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: scripts/my-matches.js                                        ║
║  Purpose: My Matches page logic (show accepted connections)        ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

FUNCTIONALITY:
- Load client's practitioner connections from database
- Display only practitioners they've connected with
- Filter by connection status (pending, accepted, declined)
- Sort by recent, rating, or name
- Show connection status badges
- Modal view for detailed practitioner info
- Pagination for large result sets
*/

let currentPage = 1;
const itemsPerPage = 10;
let allMatches = [];
let filteredMatches = [];
let selectedMatch = null;
let taxonomyData = {}; // Store category name mappings

document.addEventListener('DOMContentLoaded', async () => {
  try {
    if (!window.supabaseClient) {
      console.error('Supabase client not initialized');
      return;
    }

    if (!window.authManager) {
      console.error('Auth manager not initialized');
      return;
    }

    currentUser = window.authManager.getCurrentUser();

    if (!currentUser) {
      window.location.href = '/rooted-vitality/dashboard/signup.html';
      return;
    }

    // Load client profile
    const { data: clientProfile, error: clientError } = await window.supabaseClient
      .from('clients')
      .select('serial_number')
      .eq('id', currentUser.id)
      .single();

    if (clientError || !clientProfile) {
      console.error('[My Matches] No client profile found');
      showNotification('Please complete your client profile first', 'error');
      return;
    }

    console.log('[My Matches] Client serial number:', clientProfile.serial_number);

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
    const autoOpenPractitionerId = urlParams.get('practitioner_id');
    
    if (autoOpenProjectId && autoOpenPractitionerId) {
      console.log('[My Matches] Auto-opening messaging for project:', autoOpenProjectId, 'practitioner:', autoOpenPractitionerId);
      // Find the match and open it
      const match = allMatches.find(m => m.project_id === autoOpenProjectId && m.practitioner_id === autoOpenPractitionerId);
      if (match) {
        openMessagingThread(match);
      } else {
        console.warn('[My Matches] Could not find match to auto-open');
      }
    }

  } catch (error) {
    console.error('Error initializing My Matches page:', error);
  }
});

// ========================================== 
// ========================================== 
// LOAD TAXONOMY
// ========================================== 

async function loadTaxonomy() {
  try {
    // Taxonomy data is loaded from projects table during loadMatches
    // No separate taxonomy table query needed
    console.log('[My Matches] Taxonomy data available from projects');
  } catch (error) {
    console.error('[My Matches] Error loading taxonomy:', error);
  }
}

// ========================================== 
// LOAD MATCHES
// ========================================== 

async function loadMatches(clientSerial) {
  try {
    // Fetch matches
    const { data: matchesData, error: matchesError } = await window.supabaseClient
      .from('project_practitioner_matches')
      .select('id, project_id, practitioner_id, practitioner_serial, client_serial, status, created_at')
      .eq('client_serial', clientSerial)
      .order('created_at', { ascending: false });

    if (matchesError) throw matchesError;

    // Fetch practitioner details for all matches (by serial number to avoid FK ambiguity)
    const practitionerSerials = [...new Set((matchesData || []).map(m => m.practitioner_serial))];
    
    let practitionersMap = {};
    if (practitionerSerials.length > 0) {
      const { data: practitionersData, error: practitionersError } = await window.supabaseClient
        .from('practitioners')
        .select('serial_number, id, dba_name, legal_name, bio, modalities, in_person_enabled, housecalls_enabled, virtual_enabled, timezone, email, phone, practice_logo_url, practice_city, practice_state')
        .in('serial_number', practitionerSerials);
      
      if (practitionersError) {
        console.warn('Warning loading practitioner details:', practitionersError);
      } else {
        // Create map for fast lookup
        (practitionersData || []).forEach(p => {
          practitionersMap[p.serial_number] = p;
        });
      }
    }

    // Fetch project details for all matches
    const projectIds = [...new Set((matchesData || []).map(m => m.project_id))];
    let projectsMap = {};
    if (projectIds.length > 0) {
      const { data: projectsData, error: projectsError } = await window.supabaseClient
        .from('projects')
        .select('id, project_id, category_id, category_name')
        .in('project_id', projectIds);  // Match on project_id (integer) not id (UUID)
      
      if (projectsError) {
        console.warn('Warning loading project details:', projectsError);
      } else {
        (projectsData || []).forEach(p => {
          projectsMap[p.project_id] = p;  // Map by project_id (integer)
        });
      }
    }

    // Merge practitioner and project data into matches
    allMatches = (matchesData || []).map(match => ({
      ...match,
      practitioners: practitionersMap[match.practitioner_serial] || {},
      project: projectsMap[match.project_id] || {}  // Lookup by project_id (integer)
    }));
    filteredMatches = [...allMatches];

    console.log('[My Matches] Loaded matches:', allMatches);
    console.log('[My Matches] Total matches:', allMatches.length);
    console.log('[My Matches] First match project data:', allMatches[0]?.project);

    // Update total count
    document.getElementById('total-connections').textContent = allMatches.length;

    // Display matches
    displayMatches(1);

  } catch (error) {
    console.error('Error loading matches:', error);
    showNotification('Failed to load matches', 'error');
  }
}

function displayMatches(page) {
  currentPage = page;
  const container = document.getElementById('matches-container');
  const startIdx = (page - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const pageMatches = filteredMatches.slice(startIdx, endIdx);

  if (pageMatches.length === 0) {
    container.innerHTML = `
      <div class="matches-empty">
        <p>No connections found.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  pageMatches.forEach(match => {
    const card = createMatchCard(match);
    
    // Add click handler to open messaging thread
    card.addEventListener('click', (e) => {
      // Don't trigger on action buttons
      if (e.target.tagName === 'BUTTON') return;
      
      openMessagingThread(match);
    });
    
    container.appendChild(card);
  });

  // Update showing count
  document.getElementById('showing-count').textContent = 
    filteredMatches.length > 0 ? `${pageMatches.length} of ${filteredMatches.length}` : '0';

  // Show/hide pagination
  const paginationContainer = document.getElementById('pagination-container');
  const totalPages = Math.ceil(filteredMatches.length / itemsPerPage);
  
  if (totalPages > 1) {
    paginationContainer.style.display = 'flex';
    renderPagination(totalPages);
  } else {
    paginationContainer.style.display = 'none';
  }
}

// Helper: Get category name from category_id using taxonomy mapping
function getCategoryName(project) {
  if (!project) return 'Project';
  
  // Use custom_name if available and not empty
  if (project.custom_name && project.custom_name.trim()) return project.custom_name;
  
  // Use category_name if available
  if (project.category_name) return project.category_name;
  
  // Fall back to taxonomy lookup using category_id
  if (project.category_id && taxonomyData[project.category_id]) {
    return taxonomyData[project.category_id].name;
  }
  
  // Last resort: return category_id or 'Project'
  return project.category_id || 'Project';
}

function createMatchCard(match) {
  const practitioner = match.practitioners;
  if (!practitioner) return document.createElement('div');

  const displayName = practitioner.dba_name || practitioner.legal_name || 'Practitioner';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase();
  
  // Use practice logo, fallback to initials
  const logoUrl = practitioner.practice_logo_url;
  const avatarHtml = logoUrl 
    ? `<img src="${logoUrl}" alt="${escapeHtml(displayName)}" class="match-card__avatar-img">`
    : `<div class="match-card__avatar-initials">${initials}</div>`;

  const statusLabel = {
    'in-progress': 'In-Progress',
    hired: 'Hired',
    'not-hired': 'Not Hired',
    declined: 'Declined'
  }[match.status] || match.status;

  const statusClass = `match-card__status-pill--${match.status}`;
  const services = [
    practitioner.in_person_enabled && 'In-Person',
    practitioner.housecalls_enabled && 'House Calls',
    practitioner.virtual_enabled && 'Virtual'
  ].filter(Boolean).join(', ');

  // Get project category info
  const project = match.project || {};
  const projectDisplay = getCategoryName(project);

  const card = document.createElement('div');
  const closedClass = (match.status === 'hired' || match.status === 'not-hired' || match.status === 'declined') ? ' match-card--closed' : '';
  card.className = `match-card${closedClass}`;
  card.setAttribute('data-match-id', match.id);
  card.innerHTML = `
    <div class="match-card__avatar">${avatarHtml}</div>
    
    <div class="match-card__content">
      <div class="match-card__header">
        <div class="match-card__title">
          <h3 class="match-card__name">${escapeHtml(displayName)}</h3>
          <p class="match-card__specialty">${escapeHtml(practitioner.modalities?.join(', ') || 'Holistic Practitioner')}</p>
        </div>
        <div class="match-card__project-tag">${escapeHtml(projectDisplay)}</div>
      </div>

      <div class="match-card__meta">
        <div class="match-card__meta-item">${services || 'Services TBD'}</div>
        <div class="match-card__meta-item">${practitioner.practice_city && practitioner.practice_state ? `${practitioner.practice_city}, ${practitioner.practice_state}` : 'Location TBD'}</div>
      </div>

      <p class="match-card__bio">${escapeHtml(practitioner.bio || 'No bio available')}</p>

      <div class="match-card__footer">
        <div class="match-card__actions">
          <button class="match-card__action-btn match-card__action-btn--primary" onclick="openPractitionerModal('${match.id}')">
            View Profile
          </button>
          ${(match.status === 'hired' || match.status === 'not-hired') ? `
            <button class="match-card__action-btn match-card__action-btn--review" onclick="openReviewModal('${match.id}', '${match.practitioner_id}', '${escapeHtml(match.practitioners?.dba_name || match.practitioners?.legal_name || 'Practitioner')}', '${match.project_id || ''}', '${escapeHtml(match.client_first_name || '')}', '${escapeHtml(match.client_last_name || '')}', '${match.client_id || ''}')">
              Leave Review
            </button>
          ` : ''}
        </div>
        <span class="match-card__status-pill match-card__status-pill--${match.status.replace('-', '_')}">${statusLabel}</span>
      </div>
    </div>
  `;

  return card;
}

// ========================================== 
// FILTERS & SORTING
// ========================================== 

function initFilterHandlers() {
  const statusFilter = document.getElementById('filter-status');
  const serviceFilter = document.getElementById('filter-service-type');
  const resetBtn = document.getElementById('btn-reset-filters');
  const sortSelect = document.getElementById('sort-connections');

  statusFilter.addEventListener('change', applyFilters);
  serviceFilter.addEventListener('change', applyFilters);
  sortSelect.addEventListener('change', applySorting);
  
  resetBtn.addEventListener('click', () => {
    statusFilter.value = '';
    serviceFilter.value = '';
    sortSelect.value = 'recent';
    applyFilters();
  });
}

function initMessageThreadHandlers() {
  // No longer needed for 3-column layout - handlers are inline in openMessagingThread
  console.log('[My Matches] Message thread handlers initialized for 3-column layout');
}

/**
 * Update match status (In-Progress / Hired / Not Hired)
 */
async function updateMatchStatus(matchId, newStatus) {
  try {
    console.log('[My Matches] Updating match status:', { matchId, newStatus });
    
    // Build update object with all relevant fields
    const updateData = {
      status: newStatus,
      updated_at: new Date().toISOString(),
      is_read: true  // Mark as read when practitioner views/updates
    };

    // Track when practitioner first responds
    if (newStatus === 'active' || newStatus === 'in-progress') {
      updateData.contacted_at = new Date().toISOString();
    }
    
    const { error } = await window.supabaseClient
      .from('project_practitioner_matches')
      .update(updateData)
      .eq('id', matchId);
    
    if (error) {
      console.error('[My Matches] Error updating match status:', error);
      alert('Error updating status: ' + error.message);
      return;
    }

    console.log('[My Matches] Match status updated successfully');
    
    // Update project status based on match status
    if (selectedMatch && selectedMatch.project_id) {
      let newProjectStatus = null;
      let projectUpdateData = {};
      
      if (newStatus === 'in-progress') {
        newProjectStatus = 'in-progress';
      } else if (newStatus === 'hired') {
        newProjectStatus = 'hired';
        // Capture which practitioner was hired
        projectUpdateData.hired_practitioner = selectedMatch.practitioner_id;
      } else if (newStatus === 'not-hired') {
        newProjectStatus = 'not-hired';
      }

      if (newProjectStatus) {
        projectUpdateData.project_status = newProjectStatus;
        projectUpdateData.updated_at = new Date().toISOString();
        
        const { error: projectError } = await window.supabaseClient
          .from('projects')
          .update(projectUpdateData)
          .eq('project_id', selectedMatch.project_id);  // Use project_id (INTEGER), not id (UUID)

        if (projectError) {
          console.error('[My Matches] Error updating project status:', projectError);
        } else {
          console.log('[My Matches] Project status updated to:', newProjectStatus, 'with data:', projectUpdateData);
        }
      }
    }
    
    // Update local match
    if (selectedMatch && selectedMatch.id === matchId) {
      selectedMatch.status = newStatus;
      
      // Update message input state based on new status
      const messageInputEl = document.getElementById('message-input');
      const sendBtnEl = document.getElementById('send-message-btn');
      
      if (newStatus === 'declined') {
        // Lock messages if declined
        if (messageInputEl) messageInputEl.disabled = true;
        if (sendBtnEl) sendBtnEl.disabled = true;
      } else {
        // Enable messages for all other statuses
        if (messageInputEl) messageInputEl.disabled = false;
        if (sendBtnEl) sendBtnEl.disabled = false;
      }
    }
    
    // Update match in allMatches
    const matchIdx = allMatches.findIndex(m => m.id === matchId);
    if (matchIdx >= 0) {
      allMatches[matchIdx].status = newStatus;
    }
    
    // Refresh display to show updated status
    displayMatches(currentPage);
    
    // Show feedback with correct status label
    const statusLabels = {
      'in-progress': 'In-Progress',
      'hired': 'Hired',
      'not-hired': 'Not Hired',
      'declined': 'Declined'
    };
    const label = statusLabels[newStatus] || newStatus;
    alert(`Status changed to "${label}"`);
    
  } catch (error) {
    console.error('[My Matches] Exception updating match status:', error);
    alert('Error updating status');
  }
}

function openMessagingThread(match) {
  console.log('[My Matches] openMessagingThread called with match:', match);
  
  if (!match || !match.practitioners) {
    console.error('[My Matches] Invalid match object or no practitioner data');
    return;
  }
  
  // Store selected match for status updates
  selectedMatch = match;
  
  const practitioner = match.practitioners;
  const project = match.project || {};
  
  // Get DOM elements
  const threadPanelEl = document.getElementById('message-thread-panel');
  const threadNameEl = document.getElementById('thread-practitioner-name');
  const threadMetaEl = document.getElementById('thread-practitioner-meta');
  const statusDropdownEl = document.getElementById('status-dropdown');
  const messageInputEl = document.getElementById('message-input');
  const sendBtnEl = document.getElementById('send-message-btn');
  
  if (!threadPanelEl || !threadNameEl) {
    console.error('[My Matches] Required DOM elements not found');
    return;
  }
  
  // Update header with practitioner name and project category
  threadNameEl.textContent = practitioner.dba_name || practitioner.legal_name || 'Practitioner';
  if (threadMetaEl) {
    const projectDisplay = getCategoryName(project);
    threadMetaEl.textContent = `${projectDisplay} • ${practitioner.modalities?.join(', ') || 'Practitioner'} • ${match.status || 'pending'}`;
  }
  
  // Update status dropdown
  if (statusDropdownEl) {
    console.log('[My Matches] Status dropdown found, setting display to block');
    statusDropdownEl.value = match.status || '';
    statusDropdownEl.style.display = 'block';
    statusDropdownEl.addEventListener('change', (e) => updateMatchStatus(match.id, e.target.value));
  } else {
    console.error('[My Matches] Status dropdown NOT found');
  }
  
  // Enable/disable message input based on status
  if (match.status === 'declined') {
    // Declined: cannot send messages, only view history
    if (messageInputEl) messageInputEl.disabled = true;
    if (sendBtnEl) sendBtnEl.disabled = true;
    console.log('[My Matches] Messages locked - practitioner has declined');
  } else {
    // All other statuses: can send messages
    if (messageInputEl) messageInputEl.disabled = false;
    if (sendBtnEl) sendBtnEl.disabled = false;
  }
  
  console.log('[My Matches] Initializing project messaging with:', {
    projectId: match.project_id,
    practitionerId: match.practitioner_id,
    practitionerName: threadNameEl.textContent
  });
  
  // Initialize messaging
  initializeProjectMessaging(
    match.project_id,
    match.practitioner_id,
    practitioner
  );
  
  // Highlight selected card
  document.querySelectorAll('.match-card').forEach(card => {
    card.classList.remove('match-card--selected');
  });
  const selectedCard = document.querySelector(`[data-match-id="${match.id}"]`);
  if (selectedCard) {
    selectedCard.classList.add('match-card--selected');
  }
}

function applyFilters() {
  const statusFilter = document.getElementById('filter-status').value;
  const serviceFilter = document.getElementById('filter-service-type').value;

  filteredMatches = allMatches.filter(match => {
    const matchStatus = !statusFilter || match.status === statusFilter;
    const matchService = !serviceFilter || hasService(match.practitioners, serviceFilter);
    return matchStatus && matchService;
  });

  applySorting();
}

function hasService(practitioner, serviceType) {
  if (serviceType === 'in-person') return practitioner.in_person_enabled;
  if (serviceType === 'house-calls') return practitioner.housecalls_enabled;
  if (serviceType === 'virtual') return practitioner.virtual_enabled;
  return true;
}

function applySorting() {
  const sortValue = document.getElementById('sort-connections').value;

  if (sortValue === 'recent') {
    filteredMatches.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  } else if (sortValue === 'rating') {
    filteredMatches.sort((a, b) => (b.practitioners?.rating || 0) - (a.practitioners?.rating || 0));
  } else if (sortValue === 'name') {
    filteredMatches.sort((a, b) => {
      const nameA = a.practitioners?.dba_name || a.practitioners?.legal_name || '';
      const nameB = b.practitioners?.dba_name || b.practitioners?.legal_name || '';
      return nameA.localeCompare(nameB);
    });
  }

  displayMatches(1);
}

// ========================================== 
// PAGINATION
// ========================================== 

function renderPagination(totalPages) {
  const container = document.getElementById('pagination-container');
  container.innerHTML = '';

  // Previous button
  const prevBtn = document.createElement('button');
  prevBtn.className = 'pagination-btn';
  prevBtn.textContent = '← Prev';
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener('click', () => displayMatches(currentPage - 1));
  container.appendChild(prevBtn);

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.className = 'pagination-btn';
    if (i === currentPage) btn.classList.add('pagination-btn--active');
    btn.textContent = i;
    btn.addEventListener('click', () => displayMatches(i));
    container.appendChild(btn);
  }

  // Next button
  const nextBtn = document.createElement('button');
  nextBtn.className = 'pagination-btn';
  nextBtn.textContent = 'Next →';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener('click', () => displayMatches(currentPage + 1));
  container.appendChild(nextBtn);
}

// ========================================== 
// MODAL HANDLERS
// ========================================== 

function initModalHandlers() {
  const modal = document.getElementById('practitioner-modal');
  const closeBtn = document.querySelector('.modal__close');
  const cancelBtns = document.querySelectorAll('.modal-cancel');
  const overlay = document.querySelector('.modal__overlay');

  closeBtn.addEventListener('click', () => {
    modal.classList.add('modal--hidden');
  });

  cancelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modal.classList.add('modal--hidden');
    });
  });

  overlay.addEventListener('click', () => {
    modal.classList.add('modal--hidden');
  });
}

function openPractitionerModal(matchId) {
  const match = allMatches.find(m => m.id === matchId);
  if (!match || !match.practitioners) return;

  const p = match.practitioners;
  const displayName = p.dba_name || p.legal_name || 'Practitioner';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase();
  
  // Set avatar (image or initials)
  const logoUrl = p.practice_logo_url;
  const modalAvatarEl = document.getElementById('modal-avatar');
  if (logoUrl) {
    modalAvatarEl.innerHTML = `<img src="${logoUrl}" alt="${escapeHtml(displayName)}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
  } else {
    modalAvatarEl.textContent = initials;
  }

  document.getElementById('modal-name').textContent = displayName;
  document.getElementById('modal-specialty').textContent = p.modalities?.join(', ') || 'Holistic Practitioner';
  
  const statusLabel = {
    pending: 'Pending Review',
    accepted: 'Connected',
    declined: 'Declined'
  }[match.status] || match.status;
  const statusClass = `status-${match.status}`;
  document.getElementById('modal-status').innerHTML = `<span class="match-card__status-indicator ${statusClass}">${statusLabel}</span>`;

  document.getElementById('modal-bio').textContent = p.bio || 'No bio available';

  // Services offered
  const services = [
    p.in_person_enabled && 'In-Person Sessions',
    p.housecalls_enabled && 'House Calls',
    p.virtual_enabled && 'Virtual Sessions'
  ].filter(Boolean);
  document.getElementById('modal-services').innerHTML = services.length > 0 
    ? `<ul style="margin: 0; padding-left: 1.25rem;"><li>${services.join('</li><li>')}</li></ul>`
    : '—';

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

  // Update button based on status
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

function sendMessage(matchId) {
  // TODO: Implement messaging system
  showNotification('Messaging feature coming soon!', 'info');
}

// ========================================== 
// UTILITIES
// ========================================== 

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showNotification(message, type = 'info') {
  console.log(`[${type.toUpperCase()}] ${message}`);
  // TODO: Implement toast notification UI
}

