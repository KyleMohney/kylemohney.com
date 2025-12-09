/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: dashboard/client/scripts/my-wellness-manager.js             ║
║  Purpose: My Wellness data management (core logic)                 ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

FUNCTIONALITY:
- Data loading and fetching from Supabase
- State management for matches and filters
- Badge count calculations
- Filtering and sorting logic
- Match status updates
*/

// ═══════════════════════════════════════════════════════════════════
// STATE & INITIALIZATION
// ═══════════════════════════════════════════════════════════════════

// Namespace My Wellness state to avoid conflicts with inbox
const myWellnessState = {
  currentPage: 1,
  itemsPerPage: 10,
  allMatches: [],
  filteredMatches: [],
  selectedMatch: null,
  currentTab: 'messages',
  taxonomyData: {},
  allProjects: [],
  filteredProjects: []
};

// Convenience getters/setters for backward compatibility
Object.defineProperty(window, 'myWellnessCurrentPage', {
  get: () => myWellnessState.currentPage,
  set: (val) => { myWellnessState.currentPage = val; }
});
Object.defineProperty(window, 'myWellnessItemsPerPage', {
  get: () => myWellnessState.itemsPerPage
});
Object.defineProperty(window, 'myWellnessAllMatches', {
  get: () => myWellnessState.allMatches,
  set: (val) => { myWellnessState.allMatches = val; }
});
Object.defineProperty(window, 'myWellnessFilteredMatches', {
  get: () => myWellnessState.filteredMatches,
  set: (val) => { myWellnessState.filteredMatches = val; }
});
Object.defineProperty(window, 'myWellnessSelectedMatch', {
  get: () => myWellnessState.selectedMatch,
  set: (val) => { myWellnessState.selectedMatch = val; }
});
Object.defineProperty(window, 'myWellnessCurrentTab', {
  get: () => myWellnessState.currentTab,
  set: (val) => { myWellnessState.currentTab = val; }
});
Object.defineProperty(window, 'myWellnessTaxonomyData', {
  get: () => myWellnessState.taxonomyData,
  set: (val) => { myWellnessState.taxonomyData = val; }
});

// For backward compatibility with existing code that uses the non-namespaced versions
const currentPage = myWellnessState.currentPage;
const itemsPerPage = myWellnessState.itemsPerPage;
let allMatches = myWellnessState.allMatches;
let filteredMatches = myWellnessState.filteredMatches;
let selectedMatch = myWellnessState.selectedMatch;
let currentTab = myWellnessState.currentTab;
let taxonomyData = myWellnessState.taxonomyData;

// ═══════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Format practitioner names (replace underscores with spaces)
 */
function formatPractitionerName(name) {
  if (!name) return 'Practitioner';
  return name.replace(/_/g, ' ');
}

/**
 * Format phone numbers into readable format
 */
function formatPhoneNumber(phone) {
  if (!phone) return 'No phone on file';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d)(\d{3})(\d{3})(\d{4})/, '$1-$2-$3-$4');
  }
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d)(\d{3})(\d{3})(\d{4})/, '$1-$2-$3-$4');
  }
  return phone;
}

/**
 * Get category name from project (custom_name > category_name > taxonomy lookup)
 */
function getCategoryName(project) {
  if (!project) return 'Project';
  if (project.custom_name && project.custom_name.trim()) return project.custom_name;
  if (project.category_name) return project.category_name;
  if (project.category_id && taxonomyData[project.category_id]) {
    return taxonomyData[project.category_id].name;
  }
  return project.category_id || 'Project';
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Show notification message
 */
function showNotification(message, type = 'info') {
  // TODO: Implement toast notification UI
}

// ═══════════════════════════════════════════════════════════════════
// DATA LOADING
// ═══════════════════════════════════════════════════════════════════

/**
 * Load taxonomy data
 */
async function loadTaxonomy() {
  try {
    const { data, error } = await window.supabaseClient
      .from('holistic_health_taxonomy')
      .select(`
        id,
        category_id,
        name,
        taxonomy_subcategories(id, name)
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    // Build taxonomy object indexed by ID with subcategories as array of names
    myWellnessState.taxonomyData = {};
    (data || []).forEach(category => {
      // Extract subcategory names from the nested response
      const subcategoryNames = (category.taxonomy_subcategories || []).map(sub => sub.name);
      myWellnessState.taxonomyData[category.id] = {
        id: category.id,
        category_id: category.category_id,
        name: category.name,
        subcategories: subcategoryNames
      };
    });

    taxonomyData = myWellnessState.taxonomyData;

  } catch (error) {
    console.error('[My Wellness] Error loading taxonomy:', error);
  }
}

/**
 * Load all matches for the client
 */
async function loadMatches(clientSerial) {
  try {
    // Fetch matches with all necessary fields
    const { data: matchesData, error: matchesError } = await window.supabaseClient
      .from('project_practitioner_matches')
      .select('id, project_serial, practitioner_serial, client_serial, status, practitioner_response, practitioner_responded_at, contacted_at, created_at, updated_at')
      .eq('client_serial', clientSerial)
      .order('updated_at', { ascending: false });

    if (matchesError) {
      console.error('[loadMatches] Error fetching matches:', matchesError);
      // Don't throw - allow the page to load with no matches
      myWellnessState.allMatches = [];
      myWellnessState.filteredMatches = [];
      filteredMatches = [];
      allMatches = [];
      return;
    }

    // Fetch practitioner details for all matches (by serial number)
    const practitionerSerials = [...new Set((matchesData || []).map(m => m.practitioner_serial))];

    let practitionersMap = {};
    if (practitionerSerials.length > 0) {
      // Fetch core practitioner data
      const { data: practitionersData, error: practitionersError } = await window.supabaseClient
        .from('practitioners')
        .select('serial_number, id, legal_name, dba_name, phone, practice_city, practice_state, in_person_enabled, housecalls_enabled, virtual_enabled, timezone, email')
        .in('serial_number', practitionerSerials);

      if (practitionersError) {
        // Error fetching practitioners
      } else if (!practitionersData || practitionersData.length === 0) {
        // No practitioners found
      } else {
        // Fetch practitioner profile data
        const { data: profilesData, error: profilesError } = await window.supabaseClient
          .from('practitioner_profiles')
          .select('practitioner_serial, bio, practice_logo_url')
          .in('practitioner_serial', practitionerSerials);

        if (profilesError) {
          // Error fetching profiles
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
            practice_logo_url: profile.practice_logo_url
          };
        });
      }
    }

    // Fetch project details for all matches
    const projectSerials = [...new Set((matchesData || []).map(m => m.project_serial).filter(Boolean))];
    let projectsMap = {};
    if (projectSerials.length > 0) {
      const { data: projectsData, error: projectsError } = await window.supabaseClient
        .from('projects')
        .select('id, project_serial, category_id, category_name, zipcode, travel_preference, description, custom_name')
        .in('project_serial', projectSerials);

      if (projectsError) {
        // Error fetching projects
      } else {
        (projectsData || []).forEach(p => {
          projectsMap[p.project_serial] = p;
        });
      }
    }

    // Fetch latest messages for each match
    let messagesMap = {};
    if (matchesData && matchesData.length > 0) {
      const matchIds = matchesData.map(m => m.id);
      const { data: messagesData, error: messagesError } = await window.supabaseClient
        .from('project_messages')
        .select('id, match_id, sender_type, is_read, created_at')
        .in('match_id', matchIds)
        .order('created_at', { ascending: false });

      if (messagesError) {
        // Error fetching messages
      } else {
        (messagesData || []).forEach(msg => {
          if (!messagesMap[msg.match_id]) {
            messagesMap[msg.match_id] = [];
          }
          messagesMap[msg.match_id].push(msg);
        });
      }
    }

    // Fetch reviews for all projects and practitioners
    let reviewsMap = {};
    if (matchesData && matchesData.length > 0) {
      // Get unique project_serial and practitioner_serial combinations
      const projectSerials = [...new Set(matchesData.map(m => m.project_serial).filter(Boolean))];
      const practitionerSerials = [...new Set(matchesData.map(m => m.practitioner_serial).filter(Boolean))];
      
      if (projectSerials.length > 0 && practitionerSerials.length > 0) {
        const { data: reviewsData, error: reviewsError } = await window.supabaseClient
          .from('reviews')
          .select('*')
          .in('project_serial', projectSerials)
          .in('practitioner_serial', practitionerSerials);

        if (reviewsError) {
          console.error('[loadMatches] Error fetching reviews:', reviewsError);
        } else if (reviewsData) {
          // Map reviews by project_serial + practitioner_serial combo for quick lookup
          (reviewsData || []).forEach(review => {
            const key = `${review.project_serial}:${review.practitioner_serial}`;
            reviewsMap[key] = review;
          });
        }
      }
    }

    // Merge practitioner, project, message, and review data into matches
    allMatches = (matchesData || []).map(match => {
      const messages = messagesMap[match.id] || [];
      // Look up review by project_serial:practitioner_serial combo
      const reviewKey = `${match.project_serial}:${match.practitioner_serial}`;
      const review = reviewsMap[reviewKey] || null;

      return {
        ...match,
        project_messages: messages,
        review: review,
        practitioners: practitionersMap[match.practitioner_serial] || {},
        project: projectsMap[match.project_serial] || {},
        last_message: 'Message thread',
        is_opportunity_message: false
      };
    });

    // Load opportunity messages and merge them into allMatches
    try {
      const { data: oppMessages, error: oppError } = await window.supabaseClient
        .from('project_messages')
        .select('id, created_at, updated_at, project_serial')
        .order('created_at', { ascending: false });

      if (!oppError && oppMessages) {
        // Messages loaded successfully - opportunity integration simplified
      }
    } catch (oppLoadError) {
      // Error loading opportunities
    }

    filteredMatches = [...allMatches];

    // Don't apply tab filter here - that's for inbox page
    // Just update badge counts for the current state
    await updateBadgeCounts();

  } catch (error) {
    console.error('[loadMatches] Exception:', error);
    // Don't show error notification - just log it
    // showNotification('Failed to load matches', 'error');
  }
}

// ═══════════════════════════════════════════════════════════════════
// BADGE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

/**
 * Update badge counts for Messages, Unread, and Completed tabs
 */
async function updateBadgeCounts() {
  try {
    // Count messages (pending/in-progress matches WITHOUT unread practitioner messages)
    const messagesCount = allMatches.filter(m => {
      const isOngoingMatch = m.status === 'pending' || m.status === 'in-progress';
      if (!isOngoingMatch) return false;

      if (m.project_messages && m.project_messages.length > 0) {
        const hasUnreadFromPractitioner = m.project_messages.some(msg =>
          msg.sender_type === 'practitioner' && !msg.is_read
        );
        if (hasUnreadFromPractitioner) {
          return false;
        }
      }
      return true;
    }).length;
    const messagesBadge = document.getElementById('messages-badge');
    if (messagesBadge) messagesBadge.textContent = messagesCount;

    // Count completed (hired/not-hired ONLY)
    const completedCount = allMatches.filter(m =>
      m.status === 'hired' || m.status === 'not-hired'
    ).length;
    const completedBadge = document.getElementById('completed-badge');
    if (completedBadge) completedBadge.textContent = completedCount;

    // Count unread messages - matches with unread messages FROM practitioner
    const unreadBadge = document.getElementById('unread-badge');
    const unreadCount = allMatches.filter(m => {
      if (!m.project_messages || m.project_messages.length === 0) {
        return false;
      }
      return m.project_messages.some(msg =>
        msg.sender_type === 'practitioner' && !msg.is_read
      );
    }).length;
    if (unreadBadge) unreadBadge.textContent = unreadCount;

    // Update journey counters
    if (typeof updateJourneyCounters === 'function') {
      updateJourneyCounters();
    }

  } catch (error) {
    // Error updating badge counts
  }
}

// ═══════════════════════════════════════════════════════════════════
// FILTERING & SORTING
// ═══════════════════════════════════════════════════════════════════

/**
 * Filter matches based on selected tab
 */
function applyTabFilter(tabName) {
  switch(tabName) {
    case 'messages':
      // Show all pending/active/in-progress matches EXCEPT those with unread practitioner messages
      filteredMatches = allMatches.filter(m => {
        const isOngoingMatch = m.status === 'pending' || m.status === 'active' || m.status === 'in-progress';
        if (!isOngoingMatch) return false;

        if (m.project_messages && m.project_messages.length > 0) {
          const hasUnreadFromPractitioner = m.project_messages.some(msg =>
            msg.sender_type === 'practitioner' && !msg.is_read
          );
          if (hasUnreadFromPractitioner) {
            return false;
          }
        }
        return true;
      });
      break;
    case 'unread':
      // Only show matches with unread messages FROM the practitioner
      filteredMatches = allMatches.filter(m => {
        if (!m.project_messages || m.project_messages.length === 0) {
          return false;
        }
        return m.project_messages.some(msg =>
          msg.sender_type === 'practitioner' && !msg.is_read
        );
      });
      break;
    case 'completed':
      // Show only completed/closed matches
      filteredMatches = allMatches.filter(m =>
        m.status === 'hired' || m.status === 'not-hired'
      );
      break;
    default:
      filteredMatches = [...allMatches];
  }

  if (typeof renderMatches === 'function') {
    renderMatches();
  }
  updateBadgeCounts();
}

/**
 * Apply sorting to filtered matches
 */
function applySorting() {
  const sortSelect = document.getElementById('sort-connections');
  if (!sortSelect) return;

  const sortValue = sortSelect.value;

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

  if (typeof renderMatches === 'function') {
    renderMatches();
  }
}

// ═══════════════════════════════════════════════════════════════════
// MATCH STATUS MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

/**
 * Update match status (In-Progress / Hired / Not Hired)
 */
async function updateMatchStatus(matchId, newStatus) {
  try {
    const updateData = {
      status: newStatus,
      updated_at: new Date().toISOString(),
      is_read: true
    };

    if (newStatus === 'in-progress') {
      updateData.contacted_at = new Date().toISOString();
    }

    const { error } = await window.supabaseClient
      .from('project_practitioner_matches')
      .update(updateData)
      .eq('id', matchId);

    if (error) {
      alert('Error updating status: ' + error.message);
      return;
    }

    // Update the selected match object locally
    if (selectedMatch && selectedMatch.id === matchId) {
      selectedMatch.status = newStatus;
    }

    // When client closes a match, also update pro's version
    if ((newStatus === 'hired' || newStatus === 'not-hired') && selectedMatch) {
      const { error: syncError } = await window.supabaseClient
        .from('project_practitioner_matches')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('project_serial', selectedMatch.project_serial)
        .eq('practitioner_serial', selectedMatch.practitioner_serial)
        .neq('id', matchId);

      if (syncError) {
        // Sync error
      } else {
        // Broadcast event to practitioner's inbox
        if (window.supabaseClient) {
          const channel = window.supabaseClient.channel('match-status-changes');
          channel.subscribe(() => {
            channel.send('broadcast', {
              event: 'match_status_changed',
              payload: {
                practitioner_serial: selectedMatch.practitioner_serial,
                project_serial: selectedMatch.project_serial,
                status: newStatus,
                timestamp: new Date().toISOString()
              }
            });
          });
        }
      }
    }

    // Update project status ONLY when match is hired
    if (selectedMatch && newStatus === 'hired') {
      const projectUUID = selectedMatch.project?.id;
      if (!projectUUID) {
        return;
      }

      const projectUpdateData = {
        project_status: 'hired',
        hired_practitioner_serial: selectedMatch.practitioner_serial,
        closed_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      };

      const { data: updateResult, error: projectError } = await window.supabaseClient
        .from('projects')
        .update(projectUpdateData)
        .eq('id', projectUUID)
        .select();

      if (projectError) {
        // Project error
      } else if (!updateResult || updateResult.length === 0) {
        // No result
      } else {
        // Broadcast event to notify My Wellness page
        if (window.supabaseClient) {
          try {
            const channel = window.supabaseClient.channel('project-status-updates');
            channel.subscribe(() => {
              channel.send('broadcast', {
                event: 'project_status_changed',
                payload: {
                  project_id: projectUUID,
                  project_serial: selectedMatch.project_serial,
                  new_status: 'hired',
                  hired_practitioner_serial: selectedMatch.practitioner_serial,
                  timestamp: new Date().toISOString()
                }
              });
            });
          } catch (broadcastError) {
            // Broadcast error
          }
        }
      }
    }

    // Update match in allMatches
    const matchIdx = allMatches.findIndex(m => m.id === matchId);
    if (matchIdx >= 0) {
      allMatches[matchIdx].status = newStatus;
    }

    // Refresh display
    if (typeof renderMatches === 'function') {
      renderMatches();
    }

    // Re-open the current match thread to update the thread panel
    if (selectedMatch && selectedMatch.id === matchId) {
      const updatedMatch = allMatches.find(m => m.id === matchId);
      if (updatedMatch && typeof openMessagingThread === 'function') {
        openMessagingThread(updatedMatch);
      }
    }

    // Show feedback
    const statusLabels = {
      'in-progress': 'In-Progress',
      'hired': 'Hired',
      'not-hired': 'Not Hired',
      'declined': 'Declined'
    };
    const label = statusLabels[newStatus] || newStatus;

    if (window.showStatusModal) {
      window.showStatusModal(newStatus);
    } else {
      alert(`Status changed to "${label}"`);
    }

  } catch (error) {
    alert('Error updating status');
  }
}

// ═══════════════════════════════════════════════════════════════════
// PROJECTS MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

/**
 * Load projects from Supabase for the current client
 */
async function loadProjects(clientSerial) {
  try {
    const { data: projects, error } = await window.supabaseClient
      .from('projects')
      .select('id, project_serial, category_id, category_name, custom_name, description, urgency, travel_preference, street, city, state, zipcode, project_status, client_serial, created_at, updated_at, start_date')
      .eq('client_serial', clientSerial)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[loadProjects] Error:', error);
      return;
    }

    myWellnessState.allProjects = projects || [];
    myWellnessState.filteredProjects = [...myWellnessState.allProjects];

    // Render the projects grid
    renderProjectsGrid();
    
    // Update the "open to match" toggle to reflect the first project's state
    if (window.updateOpenToMatchToggle) {
      window.updateOpenToMatchToggle();
    }

  } catch (err) {
    console.error('[loadProjects] Exception:', err);
  }
}

/**
 * Render projects grid on the page in two columns (Active and Closed)
 */
function renderProjectsGrid() {
  const TERMINAL_STATUSES = ['hired', 'canceled'];
  const activeContainer = document.getElementById('active-projects-container');
  const closedContainer = document.getElementById('closed-projects-container');
  
  if (!activeContainer || !closedContainer) return;

  // Separate projects into active and closed
  const activeProjects = myWellnessState.filteredProjects.filter(p => !TERMINAL_STATUSES.includes(p.project_status));
  const closedProjects = myWellnessState.filteredProjects.filter(p => TERMINAL_STATUSES.includes(p.project_status));

  // Render active projects
  if (activeProjects.length === 0) {
    activeContainer.innerHTML = '<div class="projects-empty"><p>No active wellness journeys. Create your first journey to get started!</p></div>';
  } else {
    activeContainer.innerHTML = '';
    activeProjects.forEach(project => {
      const card = createProjectCard(project);
      activeContainer.appendChild(card);
    });
  }

  // Render closed projects
  if (closedProjects.length === 0) {
    closedContainer.innerHTML = '<div class="projects-empty"><p>No closed care requests yet.</p></div>';
  } else {
    closedContainer.innerHTML = '';
    closedProjects.forEach(project => {
      const card = createProjectCard(project);
      closedContainer.appendChild(card);
    });
  }

  // Attach collapse handlers to all project cards
  if (typeof attachProjectCollapseToggle === 'function') {
    attachProjectCollapseToggle();
  }
}

/**
 * Create a project card element with collapsibility
 */
function createProjectCard(project) {
  const TERMINAL_STATUSES = ['hired', 'canceled'];
  const card = document.createElement('div');
  
  const statusDisplay = project.project_status === 'hired' ? 'Hired' : 
                       project.project_status === 'canceled' ? 'Canceled' : 
                       project.project_status === 'pending' ? 'Pending' :
                       project.project_status === 'in-progress' ? 'In Progress' : project.project_status;
  
  const statusClass = `project-card__status--${(project.project_status || 'pending').toLowerCase()}`;
  const closedClass = TERMINAL_STATUSES.includes(project.project_status) ? ' project-card--closed' : '';

  // Get hired practitioner info if status is 'hired'
  let hiredPractitioner = null;
  let hasReview = false;
  let pracBadgesHTML = '';

  if (project.project_status === 'hired') {
    // Find the hired match for this project
    const hiredMatch = allMatches.find(m => m.project_serial === project.project_serial && m.status === 'hired');
    if (hiredMatch && hiredMatch.practitioners) {
      hiredPractitioner = hiredMatch.practitioners;
      // Check if there's a review (review object exists with rating or review_text)
      hasReview = hiredMatch.review && (hiredMatch.review.rating > 0 || hiredMatch.review.review_text);
      
      // Build practitioner name and review badge to show in header row and below
      if (hiredPractitioner.dba_name || hiredPractitioner.legal_name) {
        pracBadgesHTML = `
          ${hasReview ? '<span class="badge badge--reviewed">★ Review</span>' : ''}
          <div class="project-card__practitioner-name">${escapeHtml(hiredPractitioner.dba_name || hiredPractitioner.legal_name)}</div>
        `;
      } else if (hasReview) {
        pracBadgesHTML = `<span class="badge badge--reviewed">★ Review</span>`;
      }
    }
  }

  card.className = `project-card${closedClass}`;
  card.setAttribute('data-project-id', project.id);
  card.innerHTML = `
    <div class="project-card__header">
      <div class="project-card__title-group">
        <div class="project-card__title-row">
          <button type="button" class="project-card__toggle" data-toggle-card="${project.id}" title="Collapse/Expand project details" aria-label="Toggle project details">▼</button>
          <h3 class="project-card__title" contenteditable="false" data-project-id="${project.id}" spellcheck="false">${escapeHtml(project.custom_name || project.category_name || 'Untitled Project')}</h3>
        </div>
        <div class="project-card__status-row">
          <span class="project-card__status ${statusClass}">${statusDisplay}</span>
          ${hasReview ? '<span class="badge badge--reviewed">★ Review</span>' : ''}
        </div>
        ${pracBadgesHTML && pracBadgesHTML.match(/<div class="project-card__practitioner-name">/) ? `<div style="margin-top: 0.5rem;">${pracBadgesHTML.substring(pracBadgesHTML.indexOf('<div class="project-card__practitioner-name">'))}</div>` : ''}
      </div>
      <div class="project-card__meta">
        <span class="project-card__date">Created ${new Date(project.created_at).toLocaleDateString()}</span>
      </div>
      <button class="project-card__close-btn" ${TERMINAL_STATUSES.includes(project.project_status) ? 'disabled title="Project is completed"' : 'onclick="openCloseProjectModal(' + project.project_serial + ')" title="Close this wellness journey"'} aria-label="Close project">×</button>
    </div>
    <div class="project-card__body" data-card-body="${project.id}">
      ${project.description ? `<p class="project-card__description">${escapeHtml(project.description)}</p>` : ''}
      <div class="project-card__details">
        ${project.urgency ? `<span class="detail-badge urgency-${project.urgency}">${escapeHtml(project.urgency)}</span>` : ''}
        ${project.travel_preference ? `<span class="detail-badge travel">${escapeHtml(project.travel_preference)}</span>` : ''}
      </div>
      <div class="project-card__location">
        <span class="location-label">Location:</span>
        <span class="location-value">${escapeHtml(project.city || 'N/A')}, ${escapeHtml(project.state || '')}</span>
      </div>
    </div>
    <div class="project-card__footer">
      <button class="btn btn-primary btn-small" onclick="browseForProject('${project.id}')" ${TERMINAL_STATUSES.includes(project.project_status) ? 'disabled title="Cannot find practitioners for closed projects"' : ''}>Find Practitioners</button>
    </div>
  `;

  return card;
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

// Expose global state and functions
window.myWellnessManager = {
  loadMatches,
  loadProjects,
  loadTaxonomy,
  updateBadgeCounts,
  applyTabFilter,
  applySorting,
  updateMatchStatus,
  getCategoryName,
  formatPractitionerName,
  formatPhoneNumber,
  escapeHtml,
  showNotification
};
