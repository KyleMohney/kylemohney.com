/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: scripts/matchMessagingManager.js                            ║
║  Purpose: Project-specific messaging between client and pro        ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝
*/

let supabaseClient;
let currentUser;
let messagePollingInterval;
let lastMessageSentTime = 0;  // Track last message send time to debounce polling
let selectedProjectId;
let selectedProjectUUID;  // UUID of the project
let selectedPractitionerId;
let selectedPractitionerUUID;  // UUID of the practitioner
let selectedMatchStatus;  // Track match status for UI updates
let selectedMatchResponse;  // Track practitioner response (accepted/declined/null)
let messageRealtimeSubscription;  // Real-time subscription for messages
let loadedMessageIds = new Set();  // Track which messages have been rendered to avoid re-rendering
let isLoadingMessages = false;  // Debounce flag to prevent concurrent loads

/**
 * Initialize messaging for a specific project + practitioner
 * @param {string} projectId - Project UUID
 * @param {string} practitionerId - Practitioner UUID
 * @param {object} practitioner - Practitioner object with name/info
 */
async function initializeProjectMessaging(projectData, practitionerData, matchData) {
  try {
    supabaseClient = window.supabaseClient;
    if (!supabaseClient) {
      console.error('[Messaging] Supabase not initialized');
      return;
    }

    // Get current user
    if (!window.authManager) {
      console.error('[Messaging] Auth manager not ready');
      return;
    }

    currentUser = window.authManager.getCurrentUser();
    if (!currentUser) {
      console.error('[Messaging] No authenticated user');
      return;
    }

    // Clear previous conversation state when switching practitioners
    loadedMessageIds.clear();
    const messageThread = document.getElementById('message-thread');
    if (messageThread) {
      messageThread.innerHTML = '';
    }

    // Extract IDs from objects
    const projectId = projectData?.id;
    const projectSerial = projectData?.project_serial;
    const practitionerId = practitionerData?.id;
    const practitionerSerial = practitionerData?.serial_number;
    
    if (!projectId) {
      console.error('[Messaging] No project ID available');
      return;
    }
    if (!practitionerId) {
      console.error('[Messaging] No practitioner ID available');
      return;
    }

    selectedProjectId = projectSerial;  // Store serial (used for lookups)
    selectedProjectUUID = projectId;  // Store UUID (used for inserts)
    selectedPractitionerId = practitionerSerial;  // Store serial
    selectedPractitionerUUID = practitionerId;  // Store UUID
    selectedMatchStatus = matchData?.status;  // Use status column
    selectedMatchResponse = matchData?.practitioner_response;  // Track practitioner response

    console.log('[Messaging] Initialized for project:', projectSerial, '(', projectId, ') practitioner:', practitionerSerial, '(', practitionerId, ') status:', selectedMatchStatus, 'response:', selectedMatchResponse);

    // Load and display existing messages
    await loadMessages();

    // Set up message input
    setupMessageInput();

    // Set up real-time subscription for new messages
    setupRealtimeSubscription(projectId, practitionerId);

    // Start polling for new messages every 5 seconds (reduced from 2 to prevent excessive refreshes)
    // Only poll if messages are actually being sent/received
    if (messagePollingInterval) clearInterval(messagePollingInterval);
    messagePollingInterval = setInterval(async () => {
      // Only reload if we haven't just sent a message
      if (Date.now() - lastMessageSentTime > 1000) {
        await loadMessages();
      }
    }, 5000);

  } catch (error) {
    console.error('[Messaging] Initialization error:', error);
  }
}

/**
 * Set up real-time subscription for messages
 */
function setupRealtimeSubscription(projectId, practitionerId) {
  if (!supabaseClient) {
    console.error('[Messaging] Supabase client not initialized for real-time');
    return;
  }

  // Unsubscribe from previous subscription if any
  if (messageRealtimeSubscription) {
    supabaseClient.removeChannel(messageRealtimeSubscription);
  }

  // Subscribe to changes on project_messages table for this project and practitioner
  messageRealtimeSubscription = supabaseClient
    .channel(`project_messages_${projectId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'project_messages',
        filter: `project_id=eq.${projectId}`
      },
      (payload) => {
        console.log('[Messaging] Real-time message received:', payload);
        // Reload messages when a new message is inserted
        loadMessages();
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[Messaging] Real-time subscription active for project:', projectId);
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        console.warn('[Messaging] Real-time subscription error, will rely on polling');
      }
    });
}

/**
 * Load all messages for this project
 */
async function loadMessages() {
  if (!selectedProjectUUID || !selectedPractitionerUUID) {
    console.log('[Messaging] loadMessages skipped - missing UUIDs:', { selectedProjectUUID, selectedPractitionerUUID });
    return;
  }

  // Prevent concurrent loads (debounce)
  if (isLoadingMessages) {
    console.log('[Messaging] loadMessages already in progress - skipping duplicate call');
    return;
  }

  isLoadingMessages = true;

  try {
    console.log('[Messaging] Loading messages for project UUID:', selectedProjectUUID, 'practitioner UUID:', selectedPractitionerUUID);
    const { data, error } = await supabaseClient
      .from('project_messages')
      .select('*')
      .eq('project_id', selectedProjectUUID)
      .eq('practitioner_id', selectedPractitionerUUID)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Messaging] Error loading messages:', error);
      console.error('[Messaging] Error status:', error.status);
      console.error('[Messaging] Error message:', error.message);
      console.error('[Messaging] Error details:', JSON.stringify(error));
      return;
    }

    console.log('[Messaging] Loaded', data?.length || 0, 'messages');
    displayMessages(data || []);

  } catch (error) {
    console.error('[Messaging] Exception loading messages:', error);
  } finally {
    isLoadingMessages = false;
  }
}

/**
 * Display messages in thread - only add new messages, don't rebuild entire DOM
 */
async function displayMessages(messages) {
  const messageThread = document.getElementById('message-thread');
  if (!messageThread) {
    console.warn('[Messaging] Message thread container not found');
    return;
  }

  // Get practitioner name for display
  const practitionerName = document.getElementById('thread-practitioner-name')?.textContent || 'Practitioner';
  
  // If no messages, show empty state
  if (!messages || messages.length === 0) {
    // Only update if we haven't already shown messages
    if (loadedMessageIds.size === 0) {
      let emptyMessageHTML = '<p>No messages yet. Start the conversation!</p>';
      
      if (selectedMatchStatus === 'pending' && !selectedMatchResponse) {
        emptyMessageHTML = `
          <div style="padding: 2rem; text-align: center; color: #666; line-height: 1.6;">
            <p style="font-size: 1.1rem; font-weight: bold; margin-bottom: 1rem; color: #4a90e2;">Awaiting Practitioner Response</p>
            <p style="margin: 0.5rem 0;">You've sent a connection request with an automatic introduction message.</p>
            <p style="margin: 0.5rem 0;">Once they accept, you'll be able to message them here.</p>
          </div>
        `;
      } else if (selectedMatchResponse === 'declined') {
        emptyMessageHTML = `
          <div style="padding: 2rem; text-align: center; color: #999; line-height: 1.6;">
            <p style="font-size: 1.1rem; font-weight: bold; margin-bottom: 1rem;">Connection Declined</p>
            <p style="margin: 0.5rem 0;">This practitioner has declined your request.</p>
          </div>
        `;
      } else if (selectedMatchResponse === 'accepted' && selectedMatchStatus === 'in-progress') {
        emptyMessageHTML = `
          <div style="padding: 2rem; text-align: center; color: #666; line-height: 1.6;">
            <p style="font-size: 1.1rem; font-weight: bold; margin-bottom: 1rem; color: #52a35e;">Connection Active</p>
            <p style="margin: 0.5rem 0;">Start your conversation with this practitioner here.</p>
          </div>
        `;
      }
      
      messageThread.innerHTML = `<div class="message-empty" style="display: flex; align-items: center; justify-content: center; height: 100%; min-height: 300px; background-color: #fafafa; border-radius: 8px;">${emptyMessageHTML}</div>`;
    }
    return;
  }

  // Check if messages have changed (by comparing message IDs)
  const currentMessageIds = new Set(messages.map(m => m.id));
  
  // If all messages have already been loaded, don't re-render
  if (currentMessageIds.size === loadedMessageIds.size && 
      [...currentMessageIds].every(id => loadedMessageIds.has(id))) {
    console.log('[Messaging] No new messages - skipping re-render');
    return;
  }

  // If this is the first load, render all messages
  if (loadedMessageIds.size === 0) {
    console.log('[Messaging] First load - rendering all messages');
    renderUnifiedMessages(
      messages,
      'message-thread',
      'client',
      {
        name: practitionerName,
        avatar: null
      }
    );
    // Mark all messages as loaded
    messages.forEach(msg => loadedMessageIds.add(msg.id));
    
    // Mark unread practitioner messages as read
    await markMessagesAsRead();
    return;
  }

  // Find new messages that haven't been rendered yet
  const newMessages = messages.filter(msg => !loadedMessageIds.has(msg.id));
  
  if (newMessages.length === 0) {
    console.log('[Messaging] No new messages to display');
    return;
  }

  console.log('[Messaging] Found', newMessages.length, 'new messages - re-rendering');
  
  // Re-render with all messages when new ones arrive
  renderUnifiedMessages(
    messages,
    'message-thread',
    'client',
    {
      name: practitionerName,
      avatar: null
    }
  );
  
  // Mark all messages as loaded
  messages.forEach(msg => loadedMessageIds.add(msg.id));
}

/**
 * Set up message input handler
 */
function setupMessageInput() {
  const sendBtn = document.getElementById('send-message-btn');
  const messageInput = document.getElementById('message-input');

  if (!sendBtn || !messageInput) return;

  sendBtn.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
}

/**
 * Send a message
 */
async function sendMessage() {
  const messageInput = document.getElementById('message-input');
  if (!messageInput) return;

  const message = messageInput.value.trim();
  if (!message) return;

  if (!selectedProjectId || !selectedPractitionerId) {
    console.error('[Messaging] No project/practitioner selected');
    return;
  }

  try {
    let senderId, senderType, clientId;
    const rvUserStr = localStorage.getItem('rvUser');
    const ispractitioner = rvUserStr ? JSON.parse(rvUserStr).role === 'practitioner' : false;

    if (ispractitioner) {
      // Sender is practitioner
      senderId = selectedPractitionerId;
      senderType = 'practitioner';
      
      // Get client ID and project ID from the project
      const { data: projectData, error: projectError } = await supabaseClient
        .from('projects')
        .select('id, client_serial')
        .eq('project_serial', selectedProjectId)
        .single();

      if (projectError || !projectData) {
        console.error('[Messaging] Could not find project');
        return;
      }

      selectedProjectUUID = projectData.id;
      clientSerialId = projectData.client_serial;

      // Get client ID from serial
      const { data: clientData, error: clientError } = await supabaseClient
        .from('clients')
        .select('id')
        .eq('serial_number', clientSerialId)
        .single();

      if (clientError || !clientData) {
        console.error('[Messaging] Could not find client');
        return;
      }

      clientId = clientData.id;
    } else {
      // Sender is client
      const { data: clientData, error: clientError } = await supabaseClient
        .from('clients')
        .select('id, serial_number')
        .eq('id', currentUser.id)
        .single();

      if (clientError || !clientData) {
        console.error('[Messaging] Could not find client record');
        return;
      }

      senderId = clientData.id;
      senderType = 'client';
      clientId = clientData.id;
      clientSerialId = clientData.serial_number;

      // Get project UUID
      const { data: projectData, error: projectError } = await supabaseClient
        .from('projects')
        .select('id')
        .eq('project_serial', selectedProjectId)
        .single();

      if (projectError || !projectData) {
        console.error('[Messaging] Could not find project');
        return;
      }

      selectedProjectUUID = projectData.id;
    }

    console.log('[Messaging] Sending message as:', senderType, 'with data:', {
      project_id: selectedProjectUUID,
      practitioner_id: selectedPractitionerUUID,
      client_id: clientId,
      sender_id: senderId,
      sender_type: senderType,
      project_serial: selectedProjectId,
      practitioner_serial: selectedPractitionerId,
      client_serial: clientSerialId
    });

    // Insert message with all required UUID fields
    const { error: insertError } = await supabaseClient
      .from('project_messages')
      .insert({
        project_id: selectedProjectUUID,
        practitioner_id: selectedPractitionerUUID,
        client_id: clientId,
        sender_id: senderId,
        sender_type: senderType,
        message: message,
        is_read: false,
        project_serial: selectedProjectId,
        practitioner_serial: selectedPractitionerId,
        client_serial: clientSerialId
      });

    if (insertError) {
      console.error('[Messaging] Error sending message:', insertError);
      console.error('[Messaging] Insert error details:', JSON.stringify(insertError));
      alert('Error sending message');
      return;
    }

    console.log('[Messaging] Message sent successfully');

    // Update match's contacted_at timestamp on first message
    const { error: matchUpdateError } = await supabaseClient
      .from('project_practitioner_matches')
      .update({
        contacted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('project_serial', selectedProjectId)
      .eq('practitioner_serial', selectedPractitionerId);

    if (matchUpdateError) {
      console.error('[Messaging] Error updating match contacted_at:', matchUpdateError);
    }

    // Clear input
    messageInput.value = '';
    messageInput.focus();

    // Track message send time to debounce polling
    lastMessageSentTime = Date.now();

    // NOTE: Do NOT call loadMessages() here - the realtime subscription will handle it
    // Calling it twice causes duplicate rendering

  } catch (error) {
    console.error('[Messaging] Exception sending message:', error);
    alert('Error sending message');
  }
}

/**
 * Mark messages as read
 */
async function markMessagesAsRead() {
  if (!selectedProjectUUID || !selectedPractitionerUUID) return;

  try {
    const { error } = await supabaseClient
      .from('project_messages')
      .update({ is_read: true })
      .eq('project_id', selectedProjectUUID)
      .eq('practitioner_id', selectedPractitionerUUID)
      .eq('sender_type', 'practitioner');

    if (error) {
      console.error('[Messaging] Error marking as read:', error);
    } else {
      console.log('[Messaging] Marked practitioner messages as read');
      
      // Update local project_messages data for the selected match
      if (window.allMatches) {
        const selectedMatch = window.allMatches.find(m => m.id === window.selectedMatchId);
        if (selectedMatch && selectedMatch.project_messages) {
          // Mark all practitioner messages as read in local state
          selectedMatch.project_messages.forEach(msg => {
            if (msg.sender_type === 'practitioner') {
              msg.is_read = true;
            }
          });
          
          // Re-apply tab filter to move match to appropriate tab
          if (window.applyTabFilter) {
            console.log('[Messaging] Re-applying tab filter after marking messages as read');
            window.applyTabFilter(window.currentTab || 'messages');
          }
        }
      }
    }
  } catch (error) {
    console.error('[Messaging] Error marking as read:', error);
  }
}

/**
 * Format timestamp for display
 */
function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();

  if (sameDay) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Close messaging thread
 */
function closeMessageThread() {
  if (messagePollingInterval) clearInterval(messagePollingInterval);
  
  // Unsubscribe from real-time messages
  if (messageRealtimeSubscription && supabaseClient) {
    supabaseClient.removeChannel(messageRealtimeSubscription);
    messageRealtimeSubscription = null;
    console.log('[Messaging] Real-time subscription closed');
  }
  
  selectedProjectId = null;
  selectedPractitionerId = null;

  const threadPanel = document.getElementById('message-thread-panel');
  if (threadPanel) {
    threadPanel.style.display = 'none';
  }
}

// Expose functions to window for external use
window.initializeProjectMessaging = initializeProjectMessaging;
window.sendMessage = sendMessage;
window.loadMessages = loadMessages;
window.closeMessageThread = closeMessageThread;
window.acceptOpportunityMessage = acceptOpportunityMessage;
window.declineOpportunityMessage = declineOpportunityMessage;

/**
 * Accept an opportunity message - converts to regular match
 */
async function acceptOpportunityMessage(opportunityId, projectId, practitionerId) {
  try {
    console.log('[Messaging] Accepting opportunity message:', { opportunityId, projectId, practitionerId });

    if (!supabaseClient) {
      supabaseClient = window.supabaseClient;
    }

    if (!currentUser) {
      currentUser = window.authManager.getCurrentUser();
    }

    // Get the opportunity details
    const { data: opp, error: oppError } = await supabaseClient
      .from('opportunities')
      .select('*')
      .eq('id', opportunityId)
      .single();

    if (oppError) throw oppError;

    // Create a match from the opportunity
    const { data: newMatch, error: matchError } = await supabaseClient
      .from('project_practitioner_matches')
      .insert({
        project_serial: opp.project_serial,
        practitioner_serial: opp.practitioner_serial,
        client_serial: opp.client_serial,
        status: 'in-progress',  // ✅ Automatically set to in-progress
        match_score: 85, // Default score for opportunity matches
        client_initiated: false,
        contacted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (matchError) throw matchError;

    // Update opportunity to mark as accepted and converted to match
    const { error: oppUpdateError } = await supabaseClient
      .from('opportunities')
      .update({
        converted_to_match: true,
        match_id: newMatch.id,
        status: 'accepted'
      })
      .eq('id', opportunityId);

    if (oppUpdateError) throw oppUpdateError;

    console.log('[Messaging] Opportunity accepted and converted to match:', newMatch.id);
    
    // Reload the matches to show the new status
    if (window.loadMatches) {
      await window.loadMatches();
    }

    // Show notification
    if (window.showNotification) {
      window.showNotification('Match accepted! Status set to In-Progress.', 'success');
    }

    return newMatch;

  } catch (error) {
    console.error('[Messaging] Error accepting opportunity:', error);
    if (window.showNotification) {
      window.showNotification('Failed to accept opportunity', 'error');
    }
  }
}

/**
 * Decline an opportunity message - archives it
 */
async function declineOpportunityMessage(opportunityId) {
  try {
    console.log('[Messaging] Declining opportunity message:', opportunityId);

    if (!supabaseClient) {
      supabaseClient = window.supabaseClient;
    }

    // Update opportunity to mark as declined by client
    const { error: oppUpdateError } = await supabaseClient
      .from('opportunities')
      .update({
        declined_by_client: true,
        is_archived: true
      })
      .eq('id', opportunityId);

    if (oppUpdateError) throw oppUpdateError;

    console.log('[Messaging] Opportunity declined and archived');

    // Show notification
    if (window.showNotification) {
      window.showNotification('Opportunity declined.', 'info');
    }

    return true;

  } catch (error) {
    console.error('[Messaging] Error declining opportunity:', error);
    if (window.showNotification) {
      window.showNotification('Failed to decline opportunity', 'error');
    }
  }
}

