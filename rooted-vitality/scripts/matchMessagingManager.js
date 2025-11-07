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
let selectedProjectId;
let selectedPractitionerId;

/**
 * Initialize messaging for a specific project + practitioner
 * @param {string} projectId - Project UUID
 * @param {string} practitionerId - Practitioner UUID
 * @param {object} practitioner - Practitioner object with name/info
 */
async function initializeProjectMessaging(projectId, practitionerId, practitioner) {
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

    selectedProjectId = projectId;
    selectedPractitionerId = practitionerId;

    console.log('[Messaging] Initialized for project:', projectId, 'practitioner:', practitionerId);

    // Load and display existing messages
    await loadMessages();

    // Set up message input
    setupMessageInput();

    // Start polling for new messages every 2 seconds
    if (messagePollingInterval) clearInterval(messagePollingInterval);
    messagePollingInterval = setInterval(loadMessages, 2000);

  } catch (error) {
    console.error('[Messaging] Initialization error:', error);
  }
}

/**
 * Load all messages for this project
 */
async function loadMessages() {
  if (!selectedProjectId || !selectedPractitionerId) return;

  try {
    const { data, error } = await supabaseClient
      .from('project_messages')
      .select('*')
      .eq('project_id', selectedProjectId)
      .eq('practitioner_id', selectedPractitionerId)
      .order('created_at', { ascending: true });

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
 * Display messages in thread
 */
function displayMessages(messages) {
  const messageThread = document.getElementById('message-thread');
  if (!messageThread) {
    console.warn('[Messaging] Message thread container not found');
    return;
  }

  // Clear existing
  messageThread.innerHTML = '';

  if (messages.length === 0) {
    messageThread.innerHTML = '<div class="message-empty">No messages yet. Start the conversation!</div>';
    return;
  }

  // Add each message
  messages.forEach(msg => {
    const isClient = msg.sender_type === 'client';
    const messageEl = document.createElement('div');
    messageEl.className = `message ${isClient ? 'message--client' : 'message--practitioner'}`;
    messageEl.innerHTML = `
      <div class="message-bubble">
        <p class="message-text">${escapeHtml(msg.message)}</p>
        <time class="message-time">${formatTime(msg.created_at)}</time>
      </div>
    `;
    messageThread.appendChild(messageEl);
  });

  // Auto-scroll to bottom
  messageThread.scrollTop = messageThread.scrollHeight;

  // Mark as read
  markMessagesAsRead();
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
        .eq('project_id', selectedProjectId)
        .eq('practitioner_id', selectedPractitionerId)
        .single();

      if (matchError || !matchData) {
        console.error('[Messaging] Could not find match record');
        return;
      }

      // Get client ID from the project
      const { data: projectData, error: projectError } = await supabaseClient
        .from('projects')
        .select('client_id')
        .eq('id', selectedProjectId)
        .single();

      if (projectError || !projectData) {
        console.error('[Messaging] Could not find project');
        return;
      }

      clientId = projectData.client_id;
    } else {
      // Sender is client
      const { data: clientData, error: clientError } = await supabaseClient
        .from('clients')
        .select('id')
        .eq('user_id', currentUser.id)
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
        project_id: selectedProjectId,
        practitioner_id: selectedPractitionerId,
        client_id: clientId,
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

    // Clear input
    messageInput.value = '';
    messageInput.focus();

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
