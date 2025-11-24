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

function formatPhoneNumber(phone) {
  if (!phone) return 'No phone on file';
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  // If it's 10 digits, format as x-xxx-xxx-xxxx
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d)(\d{3})(\d{3})(\d{4})/, '$1-$2-$3-$4');
  }
  // If it's 11 digits (US with country code), format as x-xxx-xxx-xxxx
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d)(\d{3})(\d{3})(\d{4})/, '$1-$2-$3-$4');
  }
  // Otherwise return as-is
  return phone;
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
          
          const oldStatus = payload.old.status;
          const newStatus = payload.new.status;
          const newResponse = payload.new.practitioner_response;
          const oldResponse = payload.old.practitioner_response;
          
          // If practitioner declined or blocked (practitioner_response changed to 'declined')
          if ((oldResponse !== 'declined' && newResponse === 'declined') || 
              (oldStatus === 'pending' && newStatus === 'declined')) {
            console.log('[My Matches] Practitioner declined! Auto-setting to not-hired and moving to completed...');
            
            // Auto-update status to not-hired in the database
            window.supabaseClient
              .from('project_practitioner_matches')
              .update({ 
                status: 'not-hired',
                updated_at: new Date().toISOString()
              })
              .eq('id', payload.new.id)
              .then(({ error }) => {
                if (error) {
                  console.error('[My Matches] Error auto-updating status to not-hired:', error);
                } else {
                  console.log('[My Matches] Status auto-updated to not-hired');
                  // Reload matches to reflect the change
                  loadMatches(clientSerial).then(() => {
                    renderMatches();
                  });
                }
              });
          }
          // If match went from pending/active to hired/not-hired
          else if ((oldStatus === 'pending' || oldStatus === 'active' || oldStatus === 'in-progress') && 
                   (newStatus === 'hired' || newStatus === 'not-hired' || newStatus === 'completed')) {
            console.log('[My Matches] Match completed! Moving to completed section...');
            loadMatches(clientSerial).then(() => {
              renderMatches();
            });
          }
          // If match went from pending to in-progress/active (practitioner accepted)
          else if (oldStatus === 'pending' && (newStatus === 'in-progress' || newStatus === 'active')) {
            console.log('[My Matches] Practitioner accepted! Reloading matches...');
            loadMatches(clientSerial).then(() => {
              renderMatches();
              // Show toast notification
              const updatedMatch = allMatches.find(m => m.id === payload.new.id);
              if (updatedMatch && updatedMatch.practitioners) {
                console.log('[My Matches] Match updated to:', newStatus);
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
        .select('serial_number, id, legal_name, dba_name, phone, practice_city, practice_state, in_person_enabled, housecalls_enabled, virtual_enabled, timezone, email')
        .in('serial_number', practitionerSerials);
      
      if (practitionersError) {
        console.warn('Warning loading practitioner details:', practitionersError);
      } else {
        // Fetch practitioner profile data
        const { data: profilesData, error: profilesError } = await window.supabaseClient
          .from('practitioner_profiles')
          .select('practitioner_serial, bio, practice_logo_url, modalities')
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
            dba_name: p.dba_name,
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
        .select('id, match_id, sender_type, created_at')
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
      last_message: 'Message thread',
      is_opportunity_message: false
    }));

    // Load opportunity messages and merge them into allMatches
    try {
      const { data: oppMessages, error: oppError } = await window.supabaseClient
        .from('project_messages')
        .select(`
          id,
          created_at,
          updated_at,
          opportunities (
            id,
            project_serial,
            practitioner_serial,
            client_serial,
            status,
            converted_to_match,
            declined_by_client,
            is_archived
          ),
          practitioners (
            serial_number,
            id,
            legal_name,
            phone,
            practice_city,
            practice_state,
            in_person_enabled,
            housecalls_enabled,
            virtual_enabled,
            timezone,
            email
          ),
          practitioner_profiles (
            practitioner_serial,
            bio,
            dba_name,
            practice_logo_url,
            modalities
          ),
          projects (
            id,
            project_serial,
            category_id,
            category_name,
            zipcode,
            travel_preference,
            description,
            custom_name
          )
        `)
        .eq('is_opportunity_message', true)
        .eq('project_client_serial', clientSerial)
        .order('created_at', { ascending: false });

      if (!oppError && oppMessages) {
        // Filter to only active opportunities (not declined, not converted, not archived)
        const activeOppMessages = oppMessages.filter(msg => {
          if (!msg.opportunities) return false;
          const opp = msg.opportunities;
          return !opp.declined_by_client && !opp.converted_to_match && !opp.is_archived;
        });

        // Merge opportunity messages into allMatches as special items
        const oppItems = activeOppMessages.map(msg => ({
          id: msg.id,
          is_opportunity_message: true,
          opportunity_id: msg.opportunities?.id,
          project_serial: msg.opportunities?.project_serial,
          practitioner_serial: msg.opportunities?.practitioner_serial,
          client_serial: msg.opportunities?.client_serial,
          status: 'opportunity', // Mark as opportunity status
          created_at: msg.created_at,
          updated_at: msg.updated_at,
          practitioners: msg.practitioners ? {
            ...msg.practitioners,
            ...msg.practitioner_profiles
          } : {},
          project: msg.projects || {},
          last_message: 'Opportunity',
          opportunity_message_text: 'Interested in connecting with you about this project.'
        }));

        allMatches = [...allMatches, ...oppItems].sort((a, b) => 
          new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
        );

        console.log('[My Matches] Loaded opportunity messages:', activeOppMessages.length);
      }
    } catch (oppLoadError) {
      console.warn('[My Matches] Warning loading opportunity messages:', oppLoadError);
    }

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
 * - Messages: Total matched practitioners (active or in-progress status, excluding completed)
 * - Unread: Count of unread messages for active matches (excluding completed)
 * - Completed: Total completed entries (hired, not_hired, declined, or completed)
 */
async function updateBadgeCounts() {
  try {
    // Count messages (active/in-progress matches, excluding completed)
    const messagesCount = allMatches.filter(m => 
      (m.status === 'active' || m.status === 'in-progress') &&
      m.status !== 'hired' && m.status !== 'not-hired' && m.status !== 'declined' && m.status !== 'completed'
    ).length;
    const messagesBadge = document.getElementById('messages-badge');
    if (messagesBadge) messagesBadge.textContent = messagesCount;

    // Count completed (hired/not-hired/declined/completed ONLY)
    const completedCount = allMatches.filter(m => 
      m.status === 'hired' || m.status === 'not-hired' || m.status === 'declined' || m.status === 'completed'
    ).length;
    const completedBadge = document.getElementById('completed-badge');
    if (completedBadge) completedBadge.textContent = completedCount;

    // Count unread messages - query project_messages where is_read=false for ACTIVE matches only (not completed)
    const unreadBadge = document.getElementById('unread-badge');
    if (allMatches.length > 0) {
      // Only count unread for non-completed matches
      const activeMatchIds = allMatches
        .filter(m => m.status !== 'hired' && m.status !== 'not-hired' && m.status !== 'declined' && m.status !== 'completed')
        .map(m => m.id);
      
      if (activeMatchIds.length > 0) {
        const { data: unreadMessages, error: unreadError } = await window.supabaseClient
          .from('project_messages')
          .select('id')
          .in('match_id', activeMatchIds)
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
      // Don't trigger on menu button or opportunity buttons (accept/decline) or review button
      if (e.target.closest('.thread-menu-btn') || e.target.closest('.opportunity-accept-btn') || e.target.closest('.opportunity-decline-btn') || e.target.closest('.thread-review-btn')) return;
      
      // Remove active class from all thread items
      document.querySelectorAll('.thread-item').forEach(t => t.classList.remove('active'));
      
      // Add active class to clicked item
      item.classList.add('active');
      
      openMessagingThread(match);
    });
    
    container.appendChild(item);
  });

  // Attach opportunity button listeners
  attachOpportunityButtonListeners();

  // Hide pagination - thread list doesn't use it
  const paginationContainer = document.getElementById('pagination-container');
  if (paginationContainer) {
    paginationContainer.style.display = 'none';
  }
}

/**
 * Attach event listeners to opportunity accept/decline buttons
 */
function attachOpportunityButtonListeners() {
  // Accept buttons
  document.querySelectorAll('.opportunity-accept-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const opportunityId = btn.dataset.opportunityId;
      const messageId = btn.dataset.messageId;
      const projectSerial = btn.dataset.projectSerial;
      const practitionerSerial = btn.dataset.practitionerSerial;

      console.log('[My Matches] Accept opportunity:', { opportunityId, messageId, projectSerial, practitionerSerial });

      if (typeof window.acceptOpportunityMessage === 'function') {
        await window.acceptOpportunityMessage(opportunityId, projectSerial, practitionerSerial);
        // Reload matches to show the newly created match
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

      console.log('[My Matches] Decline opportunity:', opportunityId);

      if (typeof window.declineOpportunityMessage === 'function') {
        await window.declineOpportunityMessage(opportunityId);
        // Reload matches to remove the declined opportunity
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
  console.log('[My Matches] Found review buttons:', reviewBtns.length);
  
  reviewBtns.forEach(btn => {
    // Check on initial load if review already exists and update button text
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

      console.log('[My Matches] Review button clicked:', { matchId, practitionerId, projectId });

      if (window.reviewsManager && typeof window.reviewsManager.openReviewModal === 'function') {
        console.log('[My Matches] Calling openReviewModal');
        
        // Check for existing review and update button text
        try {
          const hasExistingReview = await window.reviewsManager.checkForExistingReview(
            projectId,
            practitionerId,
            clientId
          );
          
          if (hasExistingReview) {
            console.log('[My Matches] Existing review found, updating button text');
            btn.textContent = 'Update Review';
          } else {
            btn.textContent = 'Leave Review';
          }
        } catch (e) {
          console.warn('[My Matches] Error checking for existing review:', e);
        }
        
        // Open the modal
        window.reviewsManager.openReviewModal(
          matchId,
          practitionerId,
          practitionerName,
          projectId,
          clientFirstName,
          clientLastName,
          clientId
        );
      } else {
        console.error('[My Matches] reviewsManager not available or openReviewModal not a function');
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
      console.log('[My Matches] Review button initialized as "Update Review"');
    }
  } catch (e) {
    console.warn('[My Matches] Error initializing review button text:', e);
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
  
  // Get phone number - hide if pending match (not yet accepted)
  const isPending = match.status === 'pending' && !match.practitioner_response;
  const phoneDisplay = isPending ? 'Phone available after acceptance' : formatPhoneNumber(practitioner.phone);
  
  const lastMessageTime = match.updated_at ? new Date(match.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now';

  // Get project details
  const project = match.project || {};
  const services = getCategoryName(project);
  const location = project.zipcode || '-';
  const travelPrefs = project.travel_preference || '-';
  const description = project.description?.substring(0, 50) + '...' || '-';
  
  // Check if this is an opportunity message
  const isOpportunity = match.is_opportunity_message === true;
  
  // Check if status is completed
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
        ${logoUrl ? `<img src="${logoUrl}" alt="${escapeHtml(displayName)}" style="width: 100%; height: 100%; object-fit: cover;">` : `<span style="color: white; font-weight: 700; font-size: 0.95rem;">${initials}</span>`}
      </div>
      <div style="flex: 1; min-width: 0;">
        <p class="thread-name">${escapeHtml(displayName)}</p>
        <p class="thread-preview">${escapeHtml(phoneDisplay)}</p>
        ${isOpportunity ? `<p class="thread-opportunity-badge" style="font-size: 0.75rem; color: #5c9a72; font-weight: 600; margin-top: 2px;">⭐ OPPORTUNITY</p>` : ''}
      </div>
      <span class="thread-time">${lastMessageTime}</span>
      ${!isOpportunity ? `
        <div class="thread-menu-wrapper">
          <button class="thread-menu-btn" title="Options">⋮</button>
        </div>
      ` : ''}
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

  // Only add sort listener if element exists
  if (sortSelect) {
    sortSelect.addEventListener('change', applySorting);
  }
  
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
      // Only show active conversations (not pending, not completed)
      filteredMatches = allMatches.filter(m => 
        (m.status === 'active' || m.status === 'in-progress' || m.status === 'opportunity') &&
        m.status !== 'hired' && m.status !== 'not-hired' && m.status !== 'declined' && m.status !== 'completed'
      );
      break;
    case 'unread':
      // Only show pending matches (awaiting practitioner response)
      filteredMatches = allMatches.filter(m => m.status === 'pending');
      break;
    case 'completed':
      // Show only completed/closed projects (hired, not-hired, declined, completed)
      filteredMatches = allMatches.filter(m => 
        m.status === 'hired' || m.status === 'not-hired' || m.status === 'declined' || m.status === 'completed'
      );
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

    console.log('[My Matches] Match status updated successfully to:', newStatus);
    
    // Update the selected match object locally
    if (selectedMatch && selectedMatch.id === matchId) {
      selectedMatch.status = newStatus;
      console.log('[My Matches] Updated local selectedMatch status to:', newStatus);
    }
    
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
        
        // Broadcast event to practitioner's inbox to update/move card
        if (window.supabaseClient) {
          const channel = window.supabaseClient.channel('match-status-changes');
          channel.send('broadcast', {
            event: 'match_status_changed',
            payload: {
              practitioner_serial: selectedMatch.practitioner_serial,
              project_serial: selectedMatch.project_serial,
              status: newStatus,
              timestamp: new Date().toISOString()
            }
          });
          console.log('[My Matches] Broadcast sent to practitioner inbox:', {
            practitioner_serial: selectedMatch.practitioner_serial,
            status: newStatus
          });
        }
      }
    }
    
    // Update project status ONLY when match is hired
    // CRITICAL: Project and Match statuses are independent!
    // - Match status: pending/in-progress/active/hired/not-hired/declined (per individual match)
    // - Project status: pending/active/in-progress/hired/not-hired (overall project state)
    // They only interact when match=hired, which also closes the project=hired
    if (selectedMatch) {
      console.log('[My Matches] Project update check - newStatus:', newStatus, 'project_serial:', selectedMatch.project_serial, 'practitioner_serial:', selectedMatch.practitioner_serial);
      
      // ONLY update project if match status changes to "hired"
      if (newStatus === 'hired') {
        // Store practitioner serial (e.g., "P1", "P2") in hired_practitioner_serial
        const projectUpdateData = {
          project_status: 'hired',
          hired_practitioner_serial: selectedMatch.practitioner_serial,  // TEXT: "P1", "P2", etc.
          updated_at: new Date().toISOString()
        };
        
        // Try to update using project_serial first (preferred), fallback to id if missing
        const useProjectSerial = !!selectedMatch.project_serial;
        const lookupValue = useProjectSerial ? selectedMatch.project_serial : selectedMatch.id;
        const lookupField = useProjectSerial ? 'project_serial' : 'id';
        
        console.log(`[My Matches] Match hired - CLOSING PROJECT. Using ${lookupField}=${lookupValue}`, 'Update data:', projectUpdateData);
        console.log('[My Matches] Setting hired_practitioner_serial:', selectedMatch.practitioner_serial);
        
        const query = window.supabaseClient
          .from('projects')
          .update(projectUpdateData);
        
        if (useProjectSerial) {
          query.eq('project_serial', lookupValue);
        } else {
          query.eq('id', lookupValue);
        }
        
        const { data: updateResult, error: projectError } = await query.select();

        if (projectError) {
          console.error('[My Matches] Error closing project:', projectError);
          console.error('[My Matches] Error details:', projectError.message, projectError.code);
        } else if (!updateResult || updateResult.length === 0) {
          console.error('[My Matches] Project update returned no results! Check that lookupValue exists:', lookupValue);
        } else {
          console.log('[My Matches] ✅ Project closed successfully. Result:', updateResult);
          console.log('[My Matches] 🔔 Realtime UPDATE event should fire now for:', lookupValue);
          // Trigger a realtime event update if my-wellness page is open
          if (window.location.pathname.includes('my-wellness')) {
            console.log('[My Matches] On my-wellness page - project update will be reflected via realtime');
          }
        }
      } else {
        // For all other match statuses (pending, in-progress, not-hired, declined)
        // The project status is NOT affected - it stays in its current state
        // This allows the client to have multiple matches at different stages
        console.log('[My Matches] Match status:', newStatus, '- Project status unchanged (project still open for other matches)');
      }
    } else {
      console.error('[My Matches] Cannot update project - selectedMatch is null or undefined');
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
    
    // Re-open the current match thread to update the thread panel with new status
    if (selectedMatch && selectedMatch.id === matchId) {
      const updatedMatch = allMatches.find(m => m.id === matchId);
      if (updatedMatch) {
        console.log('[My Matches] Re-opening match thread with new status:', updatedMatch.status);
        openMessagingThread(updatedMatch);
      }
    }
    
    // Show feedback with correct status label
    const statusLabels = {
      'in-progress': 'In-Progress',
      'hired': 'Hired',
      'not-hired': 'Not Hired',
      'declined': 'Declined'
    };
    const label = statusLabels[newStatus] || newStatus;
    console.log('[My Matches] Status updated successfully - showing alert for:', label);
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
  const practitionerDisplayName = formatPractitionerName(practitioner.dba_name || practitioner.legal_name || 'Practitioner');
  threadNameEl.textContent = practitionerDisplayName;
  threadNameEl.style.cursor = 'pointer';
  threadNameEl.style.color = '#5c9a72';
  threadNameEl.title = 'View practitioner profile';
  
  // Make name clickable to view public preview profile
  threadNameEl.onclick = () => {
    if (practitioner.id) {
      // Navigate to public practitioner preview profile
      window.location.href = `/rooted-vitality/dashboard/pro/pages/practitioner-profile.html?id=${practitioner.id}`;
    }
  };
  
  // Make avatar clickable too
  const threadAvatarClickable = threadAvatarEl;
  if (threadAvatarClickable) {
    threadAvatarClickable.style.cursor = 'pointer';
    threadAvatarClickable.onclick = () => {
      if (practitioner.id) {
        // Navigate to public practitioner preview profile
        window.location.href = `/rooted-vitality/dashboard/pro/pages/practitioner-profile.html?id=${practitioner.id}`;
      }
    };
  }
  
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
  
  // Update practitioner meta info - show online/offline status
  if (threadMetaEl) {
    const onlineStatus = 'Offline'; // Default to offline for now
    threadMetaEl.innerHTML = `
      <div id="thread-online-status" style="width: 8px; height: 8px; border-radius: 50%; background: #ccc;"></div>
      <span id="thread-status-text" style="font-size: 13px; color: #666;">${onlineStatus}</span>
    `;
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
    
    // First, remove any existing change listeners by cloning and replacing
    const newDropdown = statusDropdownEl.cloneNode(true);
    statusDropdownEl.parentNode.replaceChild(newDropdown, statusDropdownEl);
    
    // Re-query the dropdown element after clone
    const updatedDropdownEl = document.getElementById('status-dropdown');
    
    // NOW set the value after cloning (on the new element)
    const statusValue = match.status || 'pending';
    updatedDropdownEl.value = statusValue;
    console.log('[My Matches] Set dropdown value to:', statusValue);
    updatedDropdownEl.style.display = 'block';
    
    // Lock dropdown until pro accepts/rejects - only unlock if pro has responded
    const msgResponse = match.practitioner_response;
    const isLocked = match.status === 'pending' && !msgResponse;
    // Also lock if already completed (not-hired, hired, declined)
    const isCompleted = match.status === 'not-hired' || match.status === 'hired' || match.status === 'declined' || match.status === 'completed';
    updatedDropdownEl.disabled = isLocked || isCompleted;
    console.log('[My Matches] Dropdown locked:', isLocked || isCompleted, '(pending and no response:', isLocked, ', completed:', isCompleted, ')');
    
    // Add change listener
    if (updatedDropdownEl) {
      updatedDropdownEl.addEventListener('change', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const selectedStatus = e.target.value;
        const matchId = match.id;
        console.log('[My Matches] Dropdown changed to value:', selectedStatus, 'for match:', matchId);
        await updateMatchStatus(matchId, selectedStatus);
        // Get the updated match from allMatches
        const updatedMatch = allMatches.find(m => m.id === matchId);
        if (updatedMatch) {
          console.log('[My Matches] Re-opening thread with updated match, status:', updatedMatch.status);
          openMessagingThread(updatedMatch);
        }
      });
    } else {
      console.error('[My Matches] Failed to re-query dropdown after clone');
    }
  } else {
    console.error('[My Matches] Status dropdown NOT found');
  }
  
  // Enable/disable message input based on status and practitioner_response
  const msgStatus = match.status;
  const msgResponse = match.practitioner_response;
  
  if (msgStatus === 'pending' && !msgResponse) {
    // Pending with no response: show pending status message
    if (messageInputAreaEl) {
      messageInputAreaEl.style.display = 'flex';
      messageInputAreaEl.style.flexDirection = 'column';
      messageInputAreaEl.style.alignItems = 'center';
      messageInputAreaEl.style.justifyContent = 'center';
      messageInputAreaEl.style.padding = '24px';
      messageInputAreaEl.style.gap = '12px';
      
      // Hide input and button, show pending message
      if (messageInputEl) messageInputEl.style.display = 'none';
      if (sendBtnEl) sendBtnEl.style.display = 'none';
      
      // Create or update pending message div
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
    console.log('[My Matches] Messages locked - awaiting practitioner response');
  } else if (msgResponse === 'declined') {
    // Declined: cannot send messages, only view history
    if (messageInputAreaEl) {
      messageInputAreaEl.style.display = 'flex';
      messageInputAreaEl.style.flexDirection = 'column';
      messageInputAreaEl.style.alignItems = 'center';
      messageInputAreaEl.style.justifyContent = 'center';
      messageInputAreaEl.style.padding = '24px';
      
      // Hide input and button
      if (messageInputEl) messageInputEl.style.display = 'none';
      if (sendBtnEl) sendBtnEl.style.display = 'none';
      
      // Create or update declined message div
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
    console.log('[My Matches] Messages locked - practitioner has declined');
  } else if (msgResponse === 'accepted' || msgStatus === 'active' || msgStatus === 'in-progress' || msgStatus === 'hired') {
    // Accepted or active engagement: can send messages
    if (messageInputAreaEl) {
      messageInputAreaEl.style.display = 'flex';
      messageInputAreaEl.style.flexDirection = 'row';
      messageInputAreaEl.style.padding = '';  // Reset padding
      messageInputAreaEl.style.gap = '';  // Reset gap
      
      // Show input and button, remove any pending/declined messages
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
  
  // Clear message thread to show loading state
  if (messageThreadEl) {
    messageThreadEl.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">Loading messages...</div>';
  }
  
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

