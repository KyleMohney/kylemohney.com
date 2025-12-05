/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: notificationToast.js                                        ║
║  Purpose: Toast notifications for real-time events                 ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

 TABLE OF CONTENTS
   1. INITIALIZATION & QUEUE MANAGEMENT
   2. TOAST CREATION & DISPLAY
   3. AUTO-DISMISS & STACKING
   4. EVENT LISTENERS & INTERACTIONS
   5. STYLING & ANIMATIONS

 ARCHITECTURE:
   - Displays toast notifications for real-time events (reviews, messages, etc.)
   - Auto-dismisses after 6 seconds or on user interaction
   - Stacks multiple notifications
   - Integrates with reviewNotificationManager
*/

// ======================================================
// 1. INITIALIZATION & QUEUE MANAGEMENT
// ======================================================

let notificationToast = {
  queue: [],
  
  init() {
    // Create container if not exists
    if (!document.getElementById('notification-toast-container')) {
      const container = document.createElement('div');
      container.id = 'notification-toast-container';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        max-width: 400px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      `;
      document.body.appendChild(container);
    }
    
    // Listen for review notifications
    window.addEventListener('reviewNotification', (e) => {
      this.show(e.detail);
    });
  },

  show(notification) {
    const container = document.getElementById('notification-toast-container');
    if (!container) {
      console.warn('[Notification Toast] Container not found');
      return;
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'notification-toast notification-toast--review';
    
    // Determine color based on rating
    let ratingColor = '#77883e'; // green for default
    if (notification.rating <= 2) {
      ratingColor = '#e8a517'; // amber for lower ratings
    }
    
    toast.style.cssText = `
      background: #fbf7ec;
      border-left: 4px solid ${ratingColor};
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      padding: 16px;
      margin-bottom: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      animation: slideInRight 0.3s ease-out;
      overflow: hidden;
    `;

    // Build content
    const starsHtml = 'â­'.repeat(notification.rating);
    
    toast.innerHTML = `
      <div style="display: flex; gap: 12px; align-items: flex-start;">
        <div style="font-size: 24px; flex-shrink: 0;">
          ${starsHtml}
        </div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 600; color: #2e2b28; margin-bottom: 4px;">
            ${notification.title}
          </div>
          <div style="color: #666; font-size: 14px; line-height: 1.4; word-break: break-word;">
            ${notification.message}
          </div>
          <div style="color: #999; font-size: 12px; margin-top: 8px;">
            ${notification.timestamp}
          </div>
        </div>
        <button style="
          background: none;
          border: none;
          color: #fbf7ec;
          font-size: 20px;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        " onclick="this.closest('.notification-toast').remove()">
          Ã—
        </button>
      </div>
    `;

    // Add click handler to navigate to reviews
    toast.addEventListener('click', (e) => {
      if (e.target.tagName !== 'BUTTON') {
        window.location.href = notification.link;
      }
    });

    // Add progress bar
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      background: ${ratingColor};
      width: 100%;
      animation: slideOutLeft 6s ease-in forwards;
    `;
    toast.style.position = 'relative';
    toast.appendChild(progressBar);

    // Add to container
    container.appendChild(toast);

    // Auto-remove after 6 seconds
    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease-out forwards';
      setTimeout(() => toast.remove(), 300);
    }, 6000);
  }
};

// Add animations to document
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideOutRight {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(100%);
    }
  }

  @keyframes slideOutLeft {
    from {
      width: 100%;
    }
    to {
      width: 0%;
    }
  }
`;
document.head.appendChild(style);

// Initialize and expose globally
window.notificationToast = notificationToast;
window.showNotificationToast = (notification) => notificationToast.show(notification);

document.addEventListener('DOMContentLoaded', () => {
  notificationToast.init();
});


























































