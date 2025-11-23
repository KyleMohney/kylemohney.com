/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: scripts/unifiedMessagingSystem.js                           ║
║  Purpose: Unified messaging renderer for modern 2-way messaging    ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝
*/

/**
 * Unified message renderer for both client and practitioner views
 * Creates a modern iMessage-style messaging interface
 */

/**
 * Render messages in unified modern style
 * @param {Array} messages - Array of message objects
 * @param {string} containerSelector - ID or selector of container element
 * @param {string} currentUserType - 'client' or 'practitioner'
 * @param {object} otherUserInfo - Info about the other person {name, avatar}
 */
function renderUnifiedMessages(messages, containerSelector, currentUserType, otherUserInfo = {}) {
  const container = document.querySelector(containerSelector) || document.getElementById(containerSelector);
  
  if (!container) {
    console.error('[Messaging] Container not found:', containerSelector);
    return;
  }

  container.innerHTML = '';
  
  if (!messages || messages.length === 0) {
    container.innerHTML = `
      <div class="messages-empty-state">
        <div class="empty-state-content">
          <p class="empty-state-title">No messages yet</p>
          <p class="empty-state-text">Start the conversation with ${otherUserInfo.name || 'this person'}</p>
        </div>
      </div>
    `;
    return;
  }

  // Group consecutive messages from the same sender
  const groupedMessages = groupConsecutiveMessages(messages);

  groupedMessages.forEach((group, idx) => {
    const isCurrentUser = group.sender_type === currentUserType;
    const groupEl = document.createElement('div');
    groupEl.className = `message-group ${isCurrentUser ? 'message-group--sent' : 'message-group--received'}`;
    
    // Add avatar for received messages
    if (!isCurrentUser) {
      const avatarEl = document.createElement('div');
      avatarEl.className = 'message-avatar';
      
      if (otherUserInfo.avatar && otherUserInfo.avatar.startsWith('http')) {
        avatarEl.innerHTML = `<img src="${otherUserInfo.avatar}" alt="${otherUserInfo.name || 'User'}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22%3E%3Crect fill=%22%23ddd%22 width=%2224%22 height=%2224%22/%3E%3C/svg%3E'">`;
      } else {
        const initials = (otherUserInfo.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase();
        avatarEl.innerHTML = `<div class="avatar-initials">${initials}</div>`;
      }
      
      groupEl.appendChild(avatarEl);
    }

    // Message bubbles container
    const bubblesContainer = document.createElement('div');
    bubblesContainer.className = 'message-bubbles-container';

    group.messages.forEach((msg, msgIdx) => {
      const bubbleEl = document.createElement('div');
      bubbleEl.className = 'message-bubble';
      bubbleEl.setAttribute('data-message-id', msg.id);
      
      const time = formatMessageTime(new Date(msg.created_at));
      
      bubbleEl.innerHTML = `
        <div class="bubble-content">
          <p class="bubble-text">${escapeHtml(msg.message)}</p>
        </div>
        <span class="bubble-time">${time}</span>
      `;
      
      bubblesContainer.appendChild(bubbleEl);
    });

    groupEl.appendChild(bubblesContainer);
    container.appendChild(groupEl);
  });

  // Scroll to bottom
  setTimeout(() => {
    container.scrollTop = container.scrollHeight;
  }, 50);
}

/**
 * Group consecutive messages from the same sender
 * @param {Array} messages - Messages to group
 * @returns {Array} Grouped messages
 */
function groupConsecutiveMessages(messages) {
  if (!messages.length) return [];

  const groups = [];
  let currentGroup = {
    sender_type: messages[0].sender_type,
    messages: [messages[0]]
  };

  for (let i = 1; i < messages.length; i++) {
    if (messages[i].sender_type === currentGroup.sender_type) {
      // Same sender, add to current group
      currentGroup.messages.push(messages[i]);
    } else {
      // Different sender, start new group
      groups.push(currentGroup);
      currentGroup = {
        sender_type: messages[i].sender_type,
        messages: [messages[i]]
      };
    }
  }

  // Push the last group
  groups.push(currentGroup);

  return groups;
}

/**
 * Format time for message display
 * @param {Date} date - Date to format
 * @returns {string} Formatted time
 */
function formatMessageTime(date) {
  if (!date) return '';
  
  const now = new Date();
  const messageDate = new Date(date);
  
  // Same day
  if (
    messageDate.getDate() === now.getDate() &&
    messageDate.getMonth() === now.getMonth() &&
    messageDate.getFullYear() === now.getFullYear()
  ) {
    return messageDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }
  
  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (
    messageDate.getDate() === yesterday.getDate() &&
    messageDate.getMonth() === yesterday.getMonth() &&
    messageDate.getFullYear() === yesterday.getFullYear()
  ) {
    return 'Yesterday ' + messageDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }
  
  // Other days
  return messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
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
 * Add CSS styles for unified messaging (call once on page load)
 */
function injectUnifiedMessagingStyles() {
  if (document.getElementById('unified-messaging-styles')) {
    return; // Already injected
  }

  const style = document.createElement('style');
  style.id = 'unified-messaging-styles';
  style.textContent = `
    /* Unified Messaging Styles */
    .messages-empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      min-height: 300px;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      border-radius: 12px;
      padding: 2rem;
    }

    .empty-state-content {
      text-align: center;
      color: #666;
    }

    .empty-state-title {
      font-size: 1.3rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
      color: #333;
    }

    .empty-state-text {
      font-size: 0.95rem;
      margin: 0;
      color: #888;
    }

    /* Message Groups */
    .message-group {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1rem;
      animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .message-group--sent {
      justify-content: flex-end;
      padding-right: 0;
    }

    .message-group--received {
      justify-content: flex-start;
      padding-left: 0;
    }

    /* Avatar */
    .message-avatar {
      width: 40px;
      height: 40px;
      min-width: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
    }

    .message-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-initials {
      color: white;
      font-weight: bold;
      font-size: 0.9rem;
    }

    /* Bubbles Container */
    .message-bubbles-container {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      max-width: 70%;
    }

    .message-group--sent .message-bubbles-container {
      align-items: flex-end;
      max-width: 75%;
    }

    .message-group--received .message-bubbles-container {
      align-items: flex-start;
      max-width: 75%;
    }

    /* Message Bubble */
    .message-bubble {
      padding: 0.75rem 1rem;
      border-radius: 18px;
      word-wrap: break-word;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      display: flex;
      gap: 0.5rem;
      align-items: flex-end;
    }

    .message-group--sent .message-bubble {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-bottom-right-radius: 4px;
    }

    .message-group--received .message-bubble {
      background: #e9ecef;
      color: #333;
      border-bottom-left-radius: 4px;
    }

    .bubble-content {
      flex: 1;
    }

    .bubble-text {
      margin: 0;
      font-size: 0.95rem;
      line-height: 1.4;
      word-break: break-word;
      white-space: pre-wrap;
      overflow-wrap: break-word;
    }

    .bubble-time {
      font-size: 0.75rem;
      opacity: 0.7;
      margin-left: 0.25rem;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .message-group--sent .bubble-time {
      opacity: 0.8;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .message-bubbles-container {
        max-width: 90%;
      }

      .message-group--sent .message-bubbles-container {
        max-width: 90%;
      }

      .message-group--received .message-bubbles-container {
        max-width: 90%;
      }

      .message-bubble {
        padding: 0.65rem 0.85rem;
        font-size: 0.9rem;
      }
    }
  `;

  document.head.appendChild(style);
}

// Inject styles on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectUnifiedMessagingStyles);
} else {
  injectUnifiedMessagingStyles();
}
