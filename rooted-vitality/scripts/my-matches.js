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

// Utility function to format practitioner names (replace underscores with spaces)
function formatPractitionerName(name) {
  if (!name) return 'Practitioner';
  return name.replace(/_/g, ' ');
}

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
    const autoOpenPractitionerSerial = urlParams.get('practitioner_serial');
    
    if (autoOpenProjectId && autoOpenPractitionerSerial) {
      console.log('[My Matches] Auto-opening messaging for project:', autoOpenProjectId, 'practitioner:', autoOpenPractitionerSerial);
      // Find the match and open it
      const match = allMatches.find(m => m.project_serial === autoOpenProjectId && m.practitioner_serial === autoOpenPractitionerSerial);
      if (match) {
        openMessagingThread(match);
      } else {
        console.warn('[My Matches] Could not find match to auto-open');
      }
    }

    // Set up real-time subscription for match acceptance
    if (clientProfile.data?.serial_number) {
      const clientSerial = clientProfile.data.serial_number;
      console.log('[My Matches] Setting up real-time subscription for client:', clientSerial);
      
      window.supabaseClient
        .channel(`client-matches:${clientSerial}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'project_practitioner_matches',
          filter: `client_serial=eq.${clientSerial}`,
        }, (payload) => {
          console.log('[My Matches] Match update received:', payload);
          // If match went from pending to in-progress/active/hired, reload matches
          if (payload.old.status === 'pending' && (payload.new.status === 'in-progress' || payload.new.status === 'active' || payload.new.status === 'hired')) {
            console.log('[My Matches] Practitioner accepted! Reloading matches...');
            loadMatches(clientSerial).then(() => {
              renderMatches();
              // Show toast notification
              const updatedMatch = allMatches.find(m => m.id === payload.new.id);
              if (updatedMatch && updatedMatch.practitioners) {
                console.log('[My Matches] Match updated to:', payload.new.status);
              }
            });
          }
        })
        .subscribe((status) => {
          console.log('[My Matches] Real-time subscription status:', status);
        });
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
    // Fetch matches with all necessary fields
    console.log('[My Matches] loadMatches called with clientSerial:', clientSerial);
    const { data: matchesData, error: matchesError } = await window.supabaseClient
      .from('project_practitioner_matches')
      .select('id, project_serial, practitioner_serial, client_serial, status, practitioner_response, practitioner_responded_at, created_at, updated_at')
      .eq('client_serial', clientSerial)
      .order('updated_at', { ascending: false });

    console.log('[My Matches] Query result - matchesData:', matchesData, 'error:', matchesError);
    
    if (matchesError) throw matchesError;

    // Fetch practitioner details for all matches (by serial number to avoid FK ambiguity)
    const practitionerSerials = [...new Set((matchesData || []).map(m => m.practitioner_serial))];
    
    let practitionersMap = {};
    if (practitionerSerials.length > 0) {
      // Fetch core practitioner data
      const { data: practitionersData, error: practitionersError } = await window.supabaseClient
        .from('practitioners')
        .select('serial_number, id, legal_name, phone, practice_city, practice_state, in_person_enabled, housecalls_enabled, virtual_enabled, timezone, email')
        .in('serial_number', practitionerSerials);
      
      if (practitionersError) {
        console.warn('Warning loading practitioner details:', practitionersError);
      } else {
        // Fetch practitioner profile data
        const { data: profilesData, error: profilesError } = await window.supabaseClient
          .from('practitioner_profiles')
          .select('practitioner_serial, bio, dba_name, practice_logo_url, modalities')
          .in('practitioner_serial', practitionerSerials);
        
        if (profilesError) {
          console.warn('Warning loading practitioner profiles:', profilesError);
        }
        
        // Create map with merged data
        const profilesMap = {};
        (profilesData || []).forEach(p => {
          profilesMap[p.practitioner_serial] = p;
        });
        
        (practitionersData || []).forEach(p => {
          const profile = profilesMap[p.serial_number] || {};
          practitionersMap[p.serial_number] = {
            ...p,
            dba_name: profile.dba_name,
            bio: profile.bio,
            practice_logo_url: profile.practice_logo_url,
            modalities: profile.modalities
          };
        });
      }
    }

    // Fetch project details for all matches - INCLUDE ALL NECESSARY FIELDS
    const projectSerials = [...new Set((matchesData || []).map(m => m.project_serial).filter(Boolean))];
    let projectsMap = {};
    if (projectSerials.length > 0) {
      const { data: projectsData, error: projectsError } = await window.supabaseClient
        .from('projects')
        .select('id, project_serial, category_id, category_name, zipcode, travel_preference, description, custom_name')
        .in('project_serial', projectSerials);  // Match on project_serial (integer)
      
      if (projectsError) {
        console.warn('Warning loading project details:', projectsError);
      } else {
        (projectsData || []).forEach(p => {
          projectsMap[p.project_serial] = p;  // Map by project_serial (integer)
        });
      }
    }

    // Fetch latest messages for each match
    let messagesMap = {};
    if (matchesData && matchesData.length > 0) {
      const matchIds = matchesData.map(m => m.id);
      const { data: messagesData, error: messagesError } = await window.supabaseClient
        .from('project_messages')
        .select('id, match_id, message_text, sender_role, created_at')
        .in('match_id', matchIds)
        .order('created_at', { ascending: false });
      
      if (messagesError) {
        console.warn('Warning loading latest messages:', messagesError);
      } else {
        // Group messages by match_id and get the latest one
        (messagesData || []).forEach(msg => {
          if (!messagesMap[msg.match_id]) {
            messagesMap[msg.match_id] = msg;
          }
        });
      }
    }

    // Merge practitioner, project, and message data into matches
    allMatches = (matchesData || []).map(match => ({
      ...match,
      practitioners: practitionersMap[match.practitioner_serial] || {},
      project: projectsMap[match.project_serial] || {},
      last_message: messagesMap[match.id]?.message_text || 'No messages yet'
    }));
    filteredMatches = [...allMatches];

    console.log('[My Matches] Loaded matches:', allMatches);
    console.log('[My Matches] Total matches:', allMatches.length);
    console.log('[My Matches] First match project data:', allMatches[0]?.project);
    console.log('[My Matches] Practitioners map:', practitionersMap);
    console.log('[My Matches] Projects map:', projectsMap);
    if (allMatches.length > 0) {
      console.log('[My Matches] First match full object:', allMatches[0]);
      console.log('[My Matches] First match practitioners:', allMatches[0].practitioners);
      console.log('[My Matches] First match last message:', allMatches[0].last_message);
    }

    // Display matches
    displayMatches(1);
    
    // Update badge counts
    await updateBadgeCounts();

  } catch (error) {
    console.error('Error loading matches:', error);
    showNotification('Failed to load matches', 'error');
  }
}

/**
 * Update badge counts for Messages, Unread, and Completed tabs
 * - Messages: Total matched practitioners (active or in-progress status)
 * - Unread: Count of unread messages 
 * - Completed: Total completed entries (hired, not_hired, or declined)
 */
async function updateBadgeCounts() {
  try {
    // Count messages (active/in-progress matches)
    const messagesCount = allMatches.filter(m => m.status === 'active' || m.status === 'in-progress').length;
    const messagesBadge = document.getElementById('messages-badge');
    if (messagesBadge) messagesBadge.textContent = messagesCount;

    // Count completed (hired/not_hired/declined)
    const completedCount = allMatches.filter(m => m.status === 'hired' || m.status === 'not_hired' || m.status === 'declined').length;
    const completedBadge = document.getElementById('completed-badge');
    if (completedBadge) completedBadge.textContent = completedCount;

    // Count unread messages - query project_messages where is_read=false
    const unreadBadge = document.getElementById('unread-badge');
    if (allMatches.length > 0) {
      const matchIds = allMatches.map(m => m.id);
      const { data: unreadMessages, error: unreadError } = await window.supabaseClient
        .from('project_messages')
        .select('id')
        .in('match_id', matchIds)
        .eq('is_read', false);
      
      if (unreadError) {
        console.warn('[My Matches] Error fetching unread count:', unreadError);
        if (unreadBadge) unreadBadge.textContent = '0';
      } else {
        const unreadCount = (unreadMessages || []).length;
        if (unreadBadge) unreadBadge.textContent = unreadCount;
      }
    } else {
      if (unreadBadge) unreadBadge.textContent = '0';
    }

    console.log('[My Matches] Badge counts updated - Messages:', messagesCount, 'Unread:', unreadBadge?.textContent, 'Completed:', completedCount);
  } catch (error) {
    console.error('[My Matches] Error updating badge counts:', error);
  }
}

function displayMatches(page) {
  currentPage = page;
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
    
    // Add click handler to open messaging thread and set active state
    item.addEventListener('click', (e) => {
      // Don't trigger on menu button
      if (e.target.closest('.thread-menu-btn')) return;
      
      // Remove active class from all thread items
      document.querySelectorAll('.thread-item').forEach(t => t.classList.remove('active'));
      
      // Add active class to clicked item
      item.classList.add('active');
      
      openMessagingThread(match);
    });
    
    container.appendChild(item);
  });

  // Hide pagination - thread list doesn't use it
  const paginationContainer = document.getElementById('pagination-container');
  if (paginationContainer) {
    paginationContainer.style.display = 'none';
  }
}

/**
 * Create a thread item element (for practitioner list in client view)
 */
function createThreadItem(match) {
  const practitioner = match.practitioners;
  if (!practitioner) return document.createElement('div');

  const displayName = formatPractitionerName(practitioner.dba_name || practitioner.legal_name || 'Practitioner');
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase();
  
  // Use practice logo for avatar
  const logoUrl = practitioner.practice_logo_url;
  const avatarHtml = logoUrl 
    ? `<img src="${logoUrl}" alt="${escapeHtml(displayName)}" style="width: 100%; height: 100%; object-fit: cover;">`
    : initials;

  // Get modalities/specialty
  const specialty = escapeHtml(practitioner.modalities?.join(', ') || 'Holistic Practitioner');
  
  // Get last message time formatted
  const lastMessageTime = match.updated_at ? new Date(match.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now';

  // Get project details
  const project = match.project || {};
  const services = getCategoryName(project);
  const location = project.zipcode || '-';
  const travelPrefs = project.travel_preference || '-';
  const description = project.description?.substring(0, 50) + '...' || '-';
  
  // Check if status is completed
  const isClosed = match.status === 'hired' || match.status === 'not_hired' || match.status === 'declined';
  const isReviewable = match.status === 'hired' || match.status === 'not_hired';

  const item = document.createElement('button');
  item.className = `thread-item${isClosed ? ' thread-item--closed' : ''}`;
  item.setAttribute('data-match-id', match.id);
  item.setAttribute('data-practitioner-serial', match.practitioner_serial);
  item.setAttribute('data-status', match.status);
  
  item.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; width: 100%;">
      <div class="thread-avatar-small">
        ${logoUrl ? `<img src="${logoUrl}" alt="${escapeHtml(displayName)}" style="width: 100%; height: 100%; object-fit: cover;">` : `<span style="color: white; font-weight: 700; font-size: 0.95rem;">${initials}</span>`}
      </div>
      <div style="flex: 1; min-width: 0;">
        <p class="thread-name">${escapeHtml(displayName)}</p>
        <p class="thread-preview">${escapeHtml(specialty)}</p>
      </div>
      <span class="thread-time">${lastMessageTime}</span>
      <div class="thread-menu-wrapper">
        <button class="thread-menu-btn" title="Options">⋮</button>
      </div>
    </div>
    <div class="thread-meta">
      <!-- Project Details -->
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
      ${isReviewable ? `
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #ede9e2;">
          <button class="thread-review-btn" onclick="openReviewModal('${match.id}', '${match.practitioner_serial}', '${escapeHtml(displayName)}', '${match.project_serial || ''}', '${escapeHtml(match.client_first_name || '')}', '${escapeHtml(match.client_last_name || '')}')">Leave Review</button>
        </div>
      ` : ''}
    </div>
  `;
  
  return item;
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

// ========================================== 
// FILTERS & SORTING
// ========================================== 

function initFilterHandlers() {
  // Tab navigation
  const tabs = document.querySelectorAll('.sidebar-tab');
  const sortSelect = document.getElementById('sort-connections');
  const searchInput = document.getElementById('search-conversations');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs
      tabs.forEach(t => t.classList.remove('active'));
      // Add active class to clicked tab
      tab.classList.add('active');
      
      const tabName = tab.getAttribute('data-tab');
      console.log('[My Matches] Switched to tab:', tabName);
      
      applyTabFilter(tabName);
    });
  });

  sortSelect.addEventListener('change', applySorting);
  
  // Search functionality
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      console.log('[My Matches] Searching for:', searchTerm);
      
      if (searchTerm.trim() === '') {
        // Reset to current tab filter
        displayMatches(1);
      } else {
        // Filter matches by practitioner name or specialty
        filteredMatches = allMatches.filter(m => {
          const practitioner = m.practitioners;
          if (!practitioner) return false;
          
          const name = (practitioner.dba_name || practitioner.legal_name || '').toLowerCase();
          const specialty = (practitioner.modalities?.join(', ') || '').toLowerCase();
          
          return name.includes(searchTerm) || specialty.includes(searchTerm);
        });
        
        displayMatches(1);
      }
    });
  }
}

/**
 * Filter matches based on selected tab
 */
function applyTabFilter(tabName) {
  switch(tabName) {
    case 'messages':
      // Active conversations
      filteredMatches = allMatches.filter(m => m.status === 'active' || m.status === 'in-progress');
      break;
    case 'unread':
      // Pending responses or new messages
      filteredMatches = allMatches.filter(m => m.status === 'pending');
      break;
    case 'completed':
      // Hired or archived
      filteredMatches = allMatches.filter(m => m.status === 'hired' || m.status === 'not_hired' || m.status === 'declined');
      break;
    default:
      filteredMatches = [...allMatches];
  }
  
  displayMatches(1);
  updateBadgeCounts();
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
    
    // When client closes a match (hired/not-hired), also update pro's version
    if ((newStatus === 'hired' || newStatus === 'not-hired') && selectedMatch) {
      console.log('[My Matches] Client closed match - syncing status to pro side');
      const { error: syncError } = await window.supabaseClient
        .from('project_practitioner_matches')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('project_serial', selectedMatch.project_serial)
        .eq('practitioner_serial', selectedMatch.practitioner_serial)
        .neq('id', matchId); // Don't update the current match again
      
      if (syncError) {
        console.warn('[My Matches] Warning syncing status to pro side:', syncError);
      } else {
        console.log('[My Matches] Pro match status synced to:', newStatus);
      }
    }
    
    // Update project status based on match status
    if (selectedMatch && selectedMatch.project_serial) {
      let newProjectStatus = null;
      let projectUpdateData = {};
      
      if (newStatus === 'in-progress') {
        newProjectStatus = 'in-progress';
      } else if (newStatus === 'hired') {
        newProjectStatus = 'hired';
        // Capture which practitioner was hired
        projectUpdateData.hired_practitioner_serial = selectedMatch.practitioner_serial;
      } else if (newStatus === 'not-hired') {
        newProjectStatus = 'not-hired';
      }

      if (newProjectStatus) {
        projectUpdateData.project_status = newProjectStatus;
        projectUpdateData.updated_at = new Date().toISOString();
        
        const { error: projectError } = await window.supabaseClient
          .from('projects')
          .update(projectUpdateData)
          .eq('project_serial', selectedMatch.project_serial);  // Use project_serial (INTEGER)

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

// ==========================================
// MESSAGING THREAD HANDLERS
// ==========================================

/**
 * Close the messaging thread without changing status
 */
function closeMessagingThread() {
  console.log('[My Matches] Closing messaging thread');
  
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
  
  // Remove active state from thread items
  document.querySelectorAll('.thread-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // Clear selected match
  selectedMatch = null;
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
  const threadAvatarEl = document.getElementById('thread-avatar');
  const threadOnlineStatusEl = document.getElementById('thread-online-status');
  const threadStatusTextEl = document.getElementById('thread-status-text');
  const closeThreadBtnEl = document.getElementById('close-thread-btn');
  const statusDropdownEl = document.getElementById('status-dropdown');
  const messageInputEl = document.getElementById('message-input');
  const sendBtnEl = document.getElementById('send-message-btn');
  const messageThreadEl = document.getElementById('message-thread');
  const messageInputAreaEl = document.querySelector('.message-input-area');
  
  if (!threadPanelEl || !threadNameEl) {
    console.error('[My Matches] Required DOM elements not found');
    return;
  }

  // Hide the empty state placeholder
  if (messageThreadEl) {
    const emptyState = messageThreadEl.querySelector('.empty-state');
    if (emptyState) {
      emptyState.style.display = 'none';
    }
  }
  
  // Update header with practitioner name
  threadNameEl.textContent = formatPractitionerName(practitioner.dba_name || practitioner.legal_name || 'Practitioner');
  
  // Update avatar
  if (threadAvatarEl) {
    const imgEl = threadAvatarEl.querySelector('#thread-avatar-img');
    const initialsEl = threadAvatarEl.querySelector('#thread-avatar-initials');
    
    if (practitioner.practice_logo_url) {
      // Show image, hide initials
      if (imgEl) {
        imgEl.src = practitioner.practice_logo_url;
        imgEl.style.display = 'block';
      }
      if (initialsEl) {
        initialsEl.style.display = 'none';
      }
    } else {
      // Show initials, hide image
      if (imgEl) {
        imgEl.style.display = 'none';
      }
      if (initialsEl) {
        const displayName = formatPractitionerName(practitioner.dba_name || practitioner.legal_name || 'Practitioner');
        initialsEl.textContent = displayName.split(' ').map(n => n[0]).join('').toUpperCase();
        initialsEl.style.display = 'block';
      }
    }
  }
  
  // Update online status indicator (for now, default to offline)
  if (threadOnlineStatusEl && threadStatusTextEl) {
    threadOnlineStatusEl.style.background = '#ccc'; // Default offline
    threadStatusTextEl.textContent = 'Offline';
  }
  
  // Update close button handler
  if (closeThreadBtnEl) {
    closeThreadBtnEl.style.display = 'block';
    // Remove previous listeners
    const newCloseBtn = closeThreadBtnEl.cloneNode(true);
    closeThreadBtnEl.parentNode.replaceChild(newCloseBtn, closeThreadBtnEl);
    
    // Re-query and add new listener
    const updatedCloseBtnEl = document.getElementById('close-thread-btn');
    updatedCloseBtnEl.addEventListener('click', closeMessagingThread);
  }
  
  // Update status dropdown
  if (statusDropdownEl) {
    console.log('[My Matches] Status dropdown found, setting display to block');
    // Set to actual match status, not hardcoded pending
    statusDropdownEl.value = match.status || 'pending';
    statusDropdownEl.style.display = 'block';
    
    // Lock dropdown until pro accepts/rejects - only unlock if pro has responded
    const msgResponse = match.practitioner_response;
    const isLocked = match.status === 'pending' && !msgResponse;
    statusDropdownEl.disabled = isLocked;
    
    // Remove any previous listeners and add new one
    const newDropdown = statusDropdownEl.cloneNode(true);
    statusDropdownEl.parentNode.replaceChild(newDropdown, statusDropdownEl);
    
    // Re-query the dropdown element after clone
    const updatedDropdownEl = document.getElementById('status-dropdown');
    updatedDropdownEl.addEventListener('change', (e) => updateMatchStatus(match.id, e.target.value));
  } else {
    console.error('[My Matches] Status dropdown NOT found');
  }
  
  // Enable/disable message input based on status and practitioner_response
  const msgStatus = match.status;
  const msgResponse = match.practitioner_response;
  
  if (msgStatus === 'pending' && !msgResponse) {
    // Pending with no response: cannot send messages until practitioner responds
    if (messageInputAreaEl) {
      messageInputAreaEl.style.display = 'none';
    }
    if (messageInputEl) {
      messageInputEl.disabled = true;
      messageInputEl.placeholder = 'Waiting for practitioner response...';
    }
    if (sendBtnEl) sendBtnEl.disabled = true;
    console.log('[My Matches] Messages locked - awaiting practitioner response');
  } else if (msgResponse === 'declined') {
    // Declined: cannot send messages, only view history
    if (messageInputAreaEl) {
      messageInputAreaEl.style.display = 'none';
    }
    if (messageInputEl) {
      messageInputEl.disabled = true;
      messageInputEl.placeholder = 'Practitioner has declined';
    }
    if (sendBtnEl) sendBtnEl.disabled = true;
    console.log('[My Matches] Messages locked - practitioner has declined');
  } else if (msgResponse === 'accepted' || msgStatus === 'active' || msgStatus === 'in-progress' || msgStatus === 'hired') {
    // Accepted or active engagement: can send messages
    if (messageInputAreaEl) {
      messageInputAreaEl.style.display = 'flex';
    }
    if (messageInputEl) {
      messageInputEl.disabled = false;
      messageInputEl.placeholder = 'Type your message...';
    }
    if (sendBtnEl) sendBtnEl.disabled = false;
    console.log('[My Matches] Messages enabled - engagement active');
  } else {
    // Other statuses: cannot send
    if (messageInputAreaEl) {
      messageInputAreaEl.style.display = 'none';
    }
    if (messageInputEl) {
      messageInputEl.disabled = true;
      messageInputEl.placeholder = 'Cannot send messages in this state';
    }
    if (sendBtnEl) sendBtnEl.disabled = true;
  }
  
  console.log('[My Matches] Initializing project messaging with:', {
    projectSerial: match.project_serial,
    practitionerSerial: match.practitioner_serial,
    projectData: match.project,
    practitionerId: practitioner.id,
    practitionerName: threadNameEl.textContent
  });
  
  // Initialize messaging - pass project data to get UUID
  initializeProjectMessaging(
    match.project,  // Pass full project object which has id (UUID)
    practitioner,   // Pass full practitioner object
    match           // Pass full match for reference
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

function applySorting() {
  const sortValue = document.getElementById('sort-connections').value;

  if (sortValue === 'recent') {
    filteredMatches.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  } else if (sortValue === 'rating') {
    filteredMatches.sort((a, b) => (b.practitioners?.rating || 0) - (a.practitioners?.rating || 0));
  } else if (sortValue === 'name') {
    filteredMatches.sort((a, b) => {
      const nameA = formatPractitionerName(a.practitioners?.dba_name || a.practitioners?.legal_name || '');
      const nameB = formatPractitionerName(b.practitioners?.dba_name || b.practitioners?.legal_name || '');
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
  const displayName = formatPractitionerName(p.dba_name || p.legal_name || 'Practitioner');
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
  
  // Use status column value
  const displayStatus = match.status;
  const displayResponse = match.practitioner_response;
  
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

  // Show status message
  const statusMessageEl = document.getElementById('modal-status-message');
  const statusContentEl = document.getElementById('status-message-content');
  
  // Determine display status
  const msgStatus = match.status;
  const response = match.practitioner_response;
  
  if (msgStatus === 'pending' && !response) {
    // Waiting for practitioner response
    statusMessageEl.style.display = 'block';
    statusContentEl.innerHTML = `
      <p><strong>✓ Connection Request Sent</strong></p>
      <p>An automatic message has been sent to ${displayName}, introducing you and your wellness project.</p>
      <p><strong>Next step:</strong> Once they accept your request, you'll be able to interact with them on the <strong>My Team</strong> page and send messages directly.</p>
    `;
  } else if (msgStatus === 'pending' && response === 'declined') {
    // Practitioner declined
    statusMessageEl.style.display = 'block';
    statusContentEl.innerHTML = `
      <p><strong>✗ Connection Declined</strong></p>
      <p>${displayName} declined your connection request${match.practitioner_response_reason ? ': ' + match.practitioner_response_reason : ''}.</p>
      <p>You can search for other practitioners on the Find Practitioners page.</p>
    `;
  } else if ((msgStatus === 'active' || msgStatus === 'in-progress') && response === 'accepted') {
    // Active engagement
    statusMessageEl.style.display = 'block';
    statusContentEl.innerHTML = `
      <p><strong>✓ Connection Accepted</strong></p>
      <p>${displayName} has accepted your request and you can now communicate on the <strong>My Team</strong> page.</p>
    `;
  } else if (msgStatus === 'hired' && response === 'accepted') {
    // Hired/Completed
    statusMessageEl.style.display = 'block';
    statusContentEl.innerHTML = `
      <p><strong>✓ Engagement Active</strong></p>
      <p>${displayName} is engaged on your project. Continue communication on the <strong>My Team</strong> page.</p>
    `;
  } else if (msgStatus === 'closed' || msgStatus === 'completed') {
    // Engagement ended
    statusMessageEl.style.display = 'block';
    statusContentEl.innerHTML = `
      <p><strong>✓ Engagement Complete</strong></p>
      <p>Thank you for working with ${displayName}. Consider leaving a review of your experience.</p>
    `;
  } else {
    statusMessageEl.style.display = 'none';
  }

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

