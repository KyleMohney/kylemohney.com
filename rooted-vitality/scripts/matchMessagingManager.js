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
let selectedPractitionerId;
let selectedMatchStatus;  // Track match status for UI updates
let selectedMatchResponse;  // Track practitioner response (accepted/declined/null)

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

    // Extract IDs from objects
    const projectId = projectData?.id;
    const practitionerId = practitionerData?.id;
    
    if (!projectId) {
      console.error('[Messaging] No project ID available');
      return;
    }
    if (!practitionerId) {
      console.error('[Messaging] No practitioner ID available');
      return;
    }

    selectedProjectId = projectId;
    selectedPractitionerId = practitionerId;
    selectedMatchStatus = matchData?.status;  // Use status column
    selectedMatchResponse = matchData?.practitioner_response;  // Track practitioner response

    console.log('[Messaging] Initialized for project:', projectId, 'practitioner:', practitionerId, 'status:', selectedMatchStatus, 'response:', selectedMatchResponse);

    // Load and display existing messages
    await loadMessages();

    // Set up message input
    setupMessageInput();

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
 * Load all messages for this project
 */
async function loadMessages() {
  if (!selectedProjectId || !selectedPractitionerId) {
    console.log('[Messaging] loadMessages skipped - missing IDs:', { selectedProjectId, selectedPractitionerId });
    return;
  }

  try {
    console.log('[Messaging] Loading messages for project:', selectedProjectId, 'practitioner:', selectedPractitionerId);
    const { data, error } = await supabaseClient
      .from('project_messages')
      .select('*')
      .eq('project_id', selectedProjectId)
      .eq('practitioner_id', selectedPractitionerId)
      .order('created_at', { ascending: true });

    console.log('[Messaging] Message load result - data:', data, 'error:', error);
    
    if (error) {
      console.error('[Messaging] Error loading messages:', error);
      return;
    }

    displayMessages(data || []);

  } catch (error) {
    console.error('[Messaging] Exception loading messages:', error);
  }
}

/**
 * Display messages in thread - only add new messages, don't rebuild entire DOM
 */
function displayMessages(messages) {
  const messageThread = document.getElementById('message-thread');
  if (!messageThread) {
    console.warn('[Messaging] Message thread container not found');
    return;
  }

  // Count existing messages to see if we need to add new ones
  const existingMessageCount = messageThread.querySelectorAll('.message').length;
  
  // If no messages exist and we have messages to display
  if (existingMessageCount === 0 && messages.length === 0) {
    // Show appropriate empty state message
    let emptyMessageHTML = '<p>No messages yet. Start the conversation!</p>';
    
    if (selectedMatchStatus === 'pending' && !selectedMatchResponse) {
      console.log('[Messaging] Showing pending response message');
      emptyMessageHTML = `
        <div style="padding: 2rem; text-align: center; color: #666; line-height: 1.6;">
          <p style="font-size: 1.1rem; font-weight: bold; margin-bottom: 1rem; color: #4a90e2;">Awaiting Practitioner Response</p>
          <p style="margin: 0.5rem 0;">You've sent a connection request with an automatic introduction message.</p>
          <p style="margin: 0.5rem 0;">Once they accept, you'll be able to message them here.</p>
        </div>
      `;
    } else if (selectedMatchResponse === 'declined') {
      console.log('[Messaging] Showing declined response message');
      emptyMessageHTML = `
        <div style="padding: 2rem; text-align: center; color: #999; line-height: 1.6;">
          <p style="font-size: 1.1rem; font-weight: bold; margin-bottom: 1rem;">Connection Declined</p>
          <p style="margin: 0.5rem 0;">This practitioner has declined your request.</p>
        </div>
      `;
    } else if (selectedMatchResponse === 'accepted' && (selectedMatchStatus === 'active' || selectedMatchStatus === 'in-progress')) {
      console.log('[Messaging] Showing accepted status message');
      emptyMessageHTML = `
        <div style="padding: 2rem; text-align: center; color: #666; line-height: 1.6;">
          <p style="font-size: 1.1rem; font-weight: bold; margin-bottom: 1rem; color: #52a35e;">Connection Active</p>
          <p style="margin: 0.5rem 0;">Start your conversation with this practitioner here.</p>
        </div>
      `;
    }
    
    messageThread.innerHTML = `<div class="message-empty" style="display: flex; align-items: center; justify-content: center; height: 100%; min-height: 300px; background-color: #fafafa; border-radius: 8px;">${emptyMessageHTML}</div>`;
    return;
  }

  // If we have messages and they should be displayed
  if (messages.length > 0) {
    // Remove empty state if it exists
    const emptyState = messageThread.querySelector('.message-empty');
    if (emptyState) {
      emptyState.remove();
    }

    // Only add NEW messages (not already in DOM)
    messages.forEach((msg, index) => {
      // Check if this message already exists in the DOM by checking the message ID
      const existingMsg = messageThread.querySelector(`[data-message-id="${msg.id}"]`);
      if (existingMsg) {
        // Message already displayed, skip
        return;
      }

      // Create new message element
      const isClient = msg.sender_type === 'client';
      const messageEl = document.createElement('div');
      messageEl.className = `message ${isClient ? 'message--client' : 'message--practitioner'}`;
      messageEl.setAttribute('data-message-id', msg.id);
      messageEl.innerHTML = `
        <div class="message-bubble">
          <p class="message-text">${escapeHtml(msg.message)}</p>
          <time class="message-time">${formatTime(msg.created_at)}</time>
        </div>
      `;
      messageThread.appendChild(messageEl);
    });

    // Add pending status message at the bottom if awaiting response
    if (selectedMatchStatus === 'pending' && !selectedMatchResponse) {
      // Check if pending message already exists
      const existingPendingMsg = messageThread.querySelector('[data-message-type="pending-status"]');
      if (!existingPendingMsg) {
        const pendingMsgEl = document.createElement('div');
        pendingMsgEl.className = 'message-pending-status';
        pendingMsgEl.setAttribute('data-message-type', 'pending-status');
        pendingMsgEl.innerHTML = `
          <div style="padding: 1rem; background: #f0f4f8; border-radius: 8px; text-align: center; color: #4a90e2; font-size: 0.9rem; margin-top: 1rem; border-left: 4px solid #4a90e2;">
            <p style="margin: 0;">This match is pending the practitioner's response. Once they accept, you'll be able to exchange messages.</p>
          </div>
        `;
        messageThread.appendChild(pendingMsgEl);
      }
    }

    // Scroll to bottom
    messageThread.scrollTop = messageThread.scrollHeight;
  }
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
      
      // Get client ID from the project_practitioner_matches
      const { data: matchData, error: matchError } = await supabaseClient
        .from('project_practitioner_matches')
        .select('id')
        .eq('project_serial', selectedProjectId)
        .eq('practitioner_serial', selectedPractitionerId)
        .single();

      if (matchError || !matchData) {
        console.error('[Messaging] Could not find match record');
        return;
      }

      // Get client serial from the project
      const { data: projectData, error: projectError } = await supabaseClient
        .from('projects')
        .select('client_serial')
        .eq('project_serial', selectedProjectId)
        .single();

      if (projectError || !projectData) {
        console.error('[Messaging] Could not find project');
        return;
      }

      clientSerialId = projectData.client_serial;
    } else {
      // Sender is client
      const { data: clientData, error: clientError } = await supabaseClient
        .from('clients')
        .select('id')
        .eq('id', currentUser.id)
        .single();

      if (clientError || !clientData) {
        console.error('[Messaging] Could not find client record');
        return;
      }

      senderId = clientData.id;
      senderType = 'client';
      clientId = clientData.id;
    }

    // Insert message
    const { error: insertError } = await supabaseClient
      .from('project_messages')
      .insert({
        project_serial: selectedProjectId,
        practitioner_serial: selectedPractitionerId,
        client_serial: clientSerialId,
        sender_id: senderId,
        sender_type: senderType,
        message: message,
        is_read: false
      });

    if (insertError) {
      console.error('[Messaging] Error sending message:', insertError);
      alert('Error sending message');
      return;
    }

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

    // Reload messages immediately
    await loadMessages();

  } catch (error) {
    console.error('[Messaging] Exception sending message:', error);
    alert('Error sending message');
  }
}

/**
 * Mark messages as read
 */
async function markMessagesAsRead() {
  if (!selectedProjectId || !selectedPractitionerId) return;

  try {
    await supabaseClient
      .from('project_messages')
      .update({ is_read: true })
      .eq('project_id', selectedProjectId)
      .eq('practitioner_id', selectedPractitionerId)
      .eq('sender_type', 'practitioner');

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
  selectedProjectId = null;
  selectedPractitionerId = null;

  const threadPanel = document.getElementById('message-thread-panel');
  if (threadPanel) {
    threadPanel.style.display = 'none';
  }
}

