/*
╔═════════════════════════════════════════════════════════════════════════════╗
║                         ROOTED VITALITY DASHBOARD                           ║
║                    CLIENT INBOX MANAGER (LOGIC)                             ║
║                                                                             ║
║ File:        dashboard/client/scripts/inbox-manager.js                      ║
║ Purpose:     Core data loading, filtering, sorting, and match management    ║
║ Description: Handles Supabase queries, data aggregation, real-time sync,    ║
║              match status updates, and application state management.         ║
║ Last Update: November 2025                                                  ║
║ Status:      Production-Ready | Build Standard v2.0 Compliant               ║
║                                                                             ║
║ QUICK REFERENCE:                                                            ║
║ - Data Loading | Match Logic | Filtering | Status Updates                   ║
║ - Real-Time Events | Synchronization | Badge Counting                       ║
║                                                                             ║
╚═════════════════════════════════════════════════════════════════════════════╝
*/

// ═══════════════════════════════════════════════════════════════════════════
// TABLE OF CONTENTS
// ═══════════════════════════════════════════════════════════════════════════
//
// 1. STATE & INITIALIZATION
// 2. UTILITY FUNCTIONS
// 3. DATA LOADING
// 4. BADGE MANAGEMENT
// 5. FILTERING & SORTING
// 6. MATCH STATUS MANAGEMENT
// 7. REAL-TIME EVENTS
//
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// 1. STATE & INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

// Namespace inbox state to avoid conflicts with other modules
const inboxState = {
  currentPage: 1,
  itemsPerPage: 10,
  allMatches: [],
  filteredMatches: [],
  selectedMatch: null,
  currentTab: 'messages',
  taxonomyData: {}
};

// Convenience getters/setters for backward compatibility
Object.defineProperty(window, 'currentPage', {
  get: () => inboxState.currentPage,
  set: (val) => { inboxState.currentPage = val; }
});
Object.defineProperty(window, 'itemsPerPage', {
  get: () => inboxState.itemsPerPage
});
Object.defineProperty(window, 'allMatches', {
  get: () => inboxState.allMatches,
  set: (val) => { inboxState.allMatches = val; }
});
Object.defineProperty(window, 'filteredMatches', {
  get: () => inboxState.filteredMatches,
  set: (val) => { inboxState.filteredMatches = val; }
});
Object.defineProperty(window, 'selectedMatch', {
  get: () => inboxState.selectedMatch,
  set: (val) => { inboxState.selectedMatch = val; }
});
Object.defineProperty(window, 'currentTab', {
  get: () => inboxState.currentTab,
  set: (val) => { inboxState.currentTab = val; }
});
Object.defineProperty(window, 'taxonomyData', {
  get: () => inboxState.taxonomyData,
  set: (val) => { inboxState.taxonomyData = val; }
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Format practitioner names by replacing underscores with spaces
 */
function formatPractitionerName(name) {
  if (!name) return 'Practitioner';
  return name.replace(/_/g, ' ');
}

/**
 * Format phone numbers to standardized format
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
 * Get category name from project using taxonomy mapping
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
 * Escape HTML special characters for safe display
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. DATA LOADING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Load taxonomy data (currently loads from projects table during loadMatches)
 */
async function loadTaxonomy() {
  try {
    // Taxonomy data is loaded from projects table during loadMatches
    // No separate taxonomy table query needed
  } catch (error) {
    // Error loading taxonomy - will use fallback
  }
}

/**
 * Load all matches with associated practitioner, project, and message data
 */
async function loadMatches(clientSerial) {
  try {
    // Fetch matches with all necessary fields
    const { data: matchesData, error: matchesError } = await window.supabaseClient
      .from('project_practitioner_matches')
      .select('id, project_serial, practitioner_serial, client_serial, status, practitioner_response, practitioner_responded_at, contacted_at, created_at, updated_at')
      .eq('client_serial', clientSerial)
      .order('updated_at', { ascending: false });

    if (matchesError) throw matchesError;

    // Fetch practitioner details for all matches
    const practitionerSerials = [...new Set((matchesData || []).map(m => m.practitioner_serial))];
    let practitionersMap = {};

    if (practitionerSerials.length > 0) {
      // Fetch core practitioner data
      const { data: practitionersData, error: practitionersError } = await window.supabaseClient
        .from('practitioners')
        .select('serial_number, id, legal_name, dba_name, phone, practice_city, practice_state, in_person_enabled, housecalls_enabled, virtual_enabled, timezone, email')
        .in('serial_number', practitionerSerials);

      if (practitionersError) {
        // Error loading practitioner details - will use fallback
      } else if (!practitionersData || practitionersData.length === 0) {
        // No practitioner data returned - will display placeholder
      } else {
        // Fetch practitioner profile data
        const { data: profilesData, error: profilesError } = await window.supabaseClient
          .from('practitioner_profiles')
          .select('practitioner_serial, bio, practice_logo_url')
          .in('practitioner_serial', practitionerSerials);

        if (profilesError) {
          // Warning loading practitioner profiles - will use core data only
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

      if (!projectsError) {
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

      if (!messagesError) {
        (messagesData || []).forEach(msg => {
          if (!messagesMap[msg.match_id]) {
            messagesMap[msg.match_id] = [];
          }
          messagesMap[msg.match_id].push(msg);
        });
      }
    }

    // Merge practitioner, project, and message data into matches
    allMatches = (matchesData || []).map(match => {
      const messages = messagesMap[match.id] || [];
      return {
        ...match,
        project_messages: messages,
        practitioners: practitionersMap[match.practitioner_serial] || {},
        project: projectsMap[match.project_serial] || {},
        last_message: 'Message thread',
        is_opportunity_message: false
      };
    });

    // Load opportunity messages and merge them into allMatches
    try {
      // Query opportunities directly for this client
      const { data: opportunities, error: oppError } = await window.supabaseClient
        .from('opportunities')
        .select('id, project_serial, practitioner_serial, client_serial, status, converted_to_match, declined_by_client, is_archived, created_at, updated_at')
        .eq('client_serial', clientSerial)
        .eq('declined_by_client', false)
        .eq('converted_to_match', false)
        .eq('is_archived', false)
        .order('updated_at', { ascending: false });

      if (oppError) {
        console.warn('Error loading opportunities:', oppError);
      }

      if (!oppError && opportunities && opportunities.length > 0) {
        // Fetch full details for practitioners and projects
        const practitionerSerials = [...new Set(opportunities.map(o => o.practitioner_serial).filter(Boolean))];
        const projectSerials = [...new Set(opportunities.map(o => o.project_serial).filter(Boolean))];

        let practitionersDetailsMap = {};
        let projectsDetailsMap = {};

        if (practitionerSerials.length > 0) {
          const { data: practData } = await window.supabaseClient
            .from('practitioners')
            .select('serial_number, id, legal_name, phone, practice_city, practice_state, in_person_enabled, housecalls_enabled, virtual_enabled, timezone, email')
            .in('serial_number', practitionerSerials);
          
          if (practData) {
            practData.forEach(p => {
              practitionersDetailsMap[p.serial_number] = p;
            });
          }

          const { data: profData } = await window.supabaseClient
            .from('practitioner_profiles')
            .select('practitioner_serial, bio, dba_name, practice_logo_url')
            .in('practitioner_serial', practitionerSerials);
          
          if (profData) {
            profData.forEach(prof => {
              if (practitionersDetailsMap[prof.practitioner_serial]) {
                practitionersDetailsMap[prof.practitioner_serial] = {
                  ...practitionersDetailsMap[prof.practitioner_serial],
                  ...prof
                };
              }
            });
          }
        }

        if (projectSerials.length > 0) {
          const { data: projData } = await window.supabaseClient
            .from('projects')
            .select('id, category_id, category_name, zipcode, travel_preference, description, custom_name, client_id')
            .in('id', projectIds);
          
          if (projData) {
            projData.forEach(proj => {
              projectsDetailsMap[proj.id] = proj;
            });
          }
        }

        const oppItems = opportunities.map(opp => {
          const practitioner = practitionersDetailsMap[opp.practitioner_serial] || {};
          const project = projectsDetailsMap[opp.project_serial] || {};
          
          return {
            id: opp.id,
            is_opportunity_message: true,
            opportunity_id: opp.id,
            project_serial: opp.project_serial,
            practitioner_serial: opp.practitioner_serial,
            client_serial: opp.client_serial,
            status: 'opportunity',
            created_at: opp.created_at,
            updated_at: opp.updated_at,
            practitioners: practitioner,
            project: project,
            last_message: 'Opportunity',
            opportunity_message_text: 'Interested in connecting with you about this project.'
          };
        });

        allMatches = [...allMatches, ...oppItems].sort((a, b) => 
          new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
        );
      }
    } catch (oppLoadError) {
      console.error('Error loading opportunity messages:', oppLoadError);
      // Continue with matches loaded so far - opportunities are optional
    }

    filteredMatches = [...allMatches];

    // Apply initial filter for Messages tab
    applyTabFilter('messages');

    // Update badge counts
    await updateBadgeCounts();

  } catch (error) {
    showNotification('Failed to load matches', 'error');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. BADGE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Update badge counts for Messages, Unread, and Completed tabs
 */
async function updateBadgeCounts() {
  try {
    // Count messages (pending/in-progress matches without unread practitioner messages)
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

    // Count completed (hired/not-hired/declined only)
    const completedCount = allMatches.filter(m => 
      m.status === 'hired' || m.status === 'not-hired' || m.status === 'declined'
    ).length;

    const completedBadge = document.getElementById('completed-badge');
    if (completedBadge) completedBadge.textContent = completedCount;

    // Count unread messages
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

  } catch (error) {
    // Error updating badge counts - will display what's available
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. FILTERING & SORTING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Filter matches based on selected tab
 */
function applyTabFilter(tabName) {
  // Hide all content sections first
  const messagesContent = document.getElementById('messages-content');
  const opportunitiesContent = document.getElementById('opportunities-content');
  const messageThreadPanel = document.getElementById('message-thread-panel');
  const messageInputEl = document.getElementById('message-input');
  const sendMessageBtn = document.getElementById('send-message-btn');

  if (messagesContent) messagesContent.classList.add('hidden');
  if (opportunitiesContent) opportunitiesContent.classList.add('hidden');
  if (messageThreadPanel) messageThreadPanel.classList.add('hidden');

  switch(tabName) {
    case 'messages':
      if (messagesContent) messagesContent.classList.remove('hidden');
      if (messageThreadPanel) messageThreadPanel.classList.remove('hidden');
      
      // Enable messaging when not in opportunities view
      if (messageInputEl && selectedMatch) {
        messageInputEl.disabled = false;
        messageInputEl.setAttribute('data-locked', 'false');
      }
      if (sendMessageBtn && selectedMatch) {
        sendMessageBtn.disabled = false;
      }
      
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

    case 'opportunities':
      if (opportunitiesContent) opportunitiesContent.classList.remove('hidden');
      
      // Lock messaging when in opportunities view
      if (messageInputEl) {
        messageInputEl.disabled = true;
        messageInputEl.placeholder = 'Complete opportunities first';
        messageInputEl.setAttribute('data-locked', 'true');
      }
      if (sendMessageBtn) {
        sendMessageBtn.disabled = true;
      }
      
      // Load opportunities if available
      if (typeof window.loadClientOpportunities === 'function') {
        window.loadClientOpportunities();
      }
      return; // Don't call renderMatches for opportunities tab

    case 'unread':
      if (messagesContent) messagesContent.classList.remove('hidden');
      if (messageThreadPanel) messageThreadPanel.classList.remove('hidden');
      
      // Enable messaging when not in opportunities view
      if (messageInputEl && selectedMatch) {
        messageInputEl.disabled = false;
        messageInputEl.setAttribute('data-locked', 'false');
      }
      if (sendMessageBtn && selectedMatch) {
        sendMessageBtn.disabled = false;
      }
      
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
      if (messagesContent) messagesContent.classList.remove('hidden');
      if (messageThreadPanel) messageThreadPanel.classList.remove('hidden');
      
      // Enable messaging when not in opportunities view
      if (messageInputEl && selectedMatch) {
        messageInputEl.disabled = false;
        messageInputEl.setAttribute('data-locked', 'false');
      }
      if (sendMessageBtn && selectedMatch) {
        sendMessageBtn.disabled = false;
      }
      
      filteredMatches = allMatches.filter(m => 
        m.status === 'hired' || m.status === 'not-hired' || m.status === 'declined'
      );
      break;

    default:
      if (messagesContent) messagesContent.classList.remove('hidden');
      if (messageThreadPanel) messageThreadPanel.classList.remove('hidden');
      
      if (messageInputEl && selectedMatch) {
        messageInputEl.disabled = false;
        messageInputEl.setAttribute('data-locked', 'false');
      }
      if (sendMessageBtn && selectedMatch) {
        sendMessageBtn.disabled = false;
      }
      
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

  if (typeof renderMatches === 'function') {
    renderMatches();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. MATCH STATUS MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Update match status (In-Progress / Hired / Not Hired / Declined)
 * Also handles project status sync and broadcast events
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

    // Update local match object
    if (selectedMatch && selectedMatch.id === matchId) {
      selectedMatch.status = newStatus;
    }

    // Notify practitioner when client accepts match (status changes to 'in-progress')
    if (newStatus === 'in-progress' && selectedMatch && typeof notifyPractitionerOfMatchAcceptance === 'function') {
      await notifyPractitionerOfMatchAcceptance({
        practitionerSerial: selectedMatch.practitioner_serial,
        clientName: selectedMatch.client_name || 'A Client',
        projectName: selectedMatch.project_name || 'Your Project'
      });
    }

    // Sync status to pro side
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

      if (!syncError && window.supabaseClient) {
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
      }
    }

    // Update project status only when match is hired
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

      if (!projectError && updateResult && updateResult.length > 0) {
        if (window.supabaseClient) {
          try {
            const channel = window.supabaseClient.channel('project-status-updates');
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
          } catch (broadcastError) {
            // Error sending broadcast - will continue
          }
        }
      }
    }

    // Update local match in array
    const matchIdx = allMatches.findIndex(m => m.id === matchId);
    if (matchIdx >= 0) {
      allMatches[matchIdx].status = newStatus;
    }

    // Refresh display
    if (typeof renderMatches === 'function') {
      renderMatches();
    }

    // Re-open messaging thread
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

// ═══════════════════════════════════════════════════════════════════════════
// 7. REAL-TIME EVENTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Setup real-time subscriptions for match updates and notifications
 */
function setupRealtimeSubscriptions(clientSerial) {
  if (!window.supabaseClient) return;

  // Subscribe to match updates
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

      // Handle practitioner decline
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
                if (typeof renderMatches === 'function') {
                  renderMatches();
                }
              });
            }
          });
      }
      // Handle status transitions
      else if ((oldStatus === 'pending' || oldStatus === 'active' || oldStatus === 'in-progress') && 
               (newStatus === 'hired' || newStatus === 'not-hired')) {
        loadMatches(clientSerial).then(() => {
          if (typeof renderMatches === 'function') {
            renderMatches();
          }
        });
      }
      // Handle acceptance
      else if (oldStatus === 'pending' && (newStatus === 'in-progress' || newStatus === 'active')) {
        const practitionerName = payload.new.practitioner_name || 'A practitioner';
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
              loadMatches(clientSerial).then(() => {
                if (typeof renderMatches === 'function') {
                  renderMatches();
                }
              });
            }
          });
      }
    })
    .subscribe();

  // Subscribe to notifications
  window.supabaseClient
    .channel(`client-notif:${clientSerial}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'client_notifications',
      filter: `client_serial=eq.${clientSerial}`,
    }, (payload) => {
      const notification = payload.new;

      if (notification.type === 'match_accepted' || notification.type === 'match_declined') {
        const message = `${notification.title}: ${notification.message}`;
        const notificationType = notification.type === 'match_accepted' ? 'success' : 'warning';

        if (window.showToast) {
          window.showToast(message, notificationType, 5000);
        } else if (window.notificationManager) {
          window.notificationManager.displayNotification(message, notificationType);
        }
      }

      loadMatches(clientSerial).then(() => {
        if (typeof renderMatches === 'function') {
          renderMatches();
        }
      });
    })
    .subscribe();
}

/**
 * Display notification using universal system
 */
function showNotification(message, type = 'info') {
  if (window.showToast) {
    window.showToast(message, type, 3000);
  } else if (window.notificationManager) {
    window.notificationManager.displayNotification(message, type);
  }
}

// Expose global functions and state for other scripts
window.inboxManager = {
  allMatches: () => allMatches,
  filteredMatches: () => filteredMatches,
  selectedMatch: () => selectedMatch,
  loadMatches,
  updateBadgeCounts,
  applyTabFilter,
  applySorting,
  updateMatchStatus,
  setupRealtimeSubscriptions,
  formatPractitionerName,
  formatPhoneNumber,
  getCategoryName,
  showNotification
};
