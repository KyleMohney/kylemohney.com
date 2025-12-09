/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: modalManager.js                                             ║
║  Purpose: Global Modal Management System - Centralized UI dialogs   ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

 TABLE OF CONTENTS
   1. MODAL MANAGER INITIALIZATION
   2. ALERT & CONFIRM MODALS
   3. STATUS MODALS (SUCCESS/ERROR/WARNING)
   4. SPECIAL MODALS (WELCOME, STATUS)
   5. TOAST NOTIFICATIONS
   6. UTILITY FUNCTIONS

 ARCHITECTURE:
   - Centralized modal management replacing 233+ inline alert/confirm calls
   - Brand-aligned styling with cream backgrounds, green accents
   - Callback-based architecture for async handling
   - Global window.showAlertModal() and window.showConfirmModal()
   - Toast notifications for non-blocking messages

 USAGE:
   window.showAlertModal('Your message', () => {  });
   window.showConfirmModal('Continue?', () => { }, () => { });
   window.showSuccessModal('Success!');
   window.showErrorModal('Error: Something failed');
   window.showToast('Quick message');
*/

// ======================================================
// 1. MODAL MANAGER INITIALIZATION
// ======================================================

// Prevent duplicate declaration if script loads multiple times
if (typeof ModalManager !== 'undefined') {
  console.warn('[Modal Manager] Already loaded, skipping initialization');
} else {

const ModalManager = {
  activeModals: new Set(),
  isInitialized: false,
  pageLoadTime: Date.now(),
  
  init() {
    // Mark as initialized after a brief delay to prevent modals during initial page load
    setTimeout(() => {
      this.isInitialized = true;
      // Clean up any orphaned modals from page refresh
      this.cleanupOrphanedModals();
    }, 100);

    // Ensure functions are available globally
    window.showAlertModal = this.showAlertModal.bind(this);
    window.showConfirmModal = this.showConfirmModal.bind(this);
    window.showSuccessModal = this.showSuccessModal.bind(this);
    window.showErrorModal = this.showErrorModal.bind(this);
    window.showWarningModal = this.showWarningModal.bind(this);
    window.showStatusModal = this.showStatusModal.bind(this);
    window.showWelcomeModal = this.showWelcomeModal.bind(this);
    window.showToast = this.showToast.bind(this);
  },

  /**
   * Clean up any orphaned modals that might exist from previous page loads
   */
  cleanupOrphanedModals() {
    const overlays = document.querySelectorAll('[id$="-overlay"]');
    overlays.forEach(overlay => {
      // Skip if it's part of the onboarding modal
      if (!overlay.id.includes('guided')) {
        overlay.remove();
      }
    });
  },

  /**
   * Auto-scroll page to top when modal opens
   */
  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  /**
   * Helper: Create modal HTML without inline styles (uses CSS classes instead)
   * @param {string} modalId - Unique modal identifier
   * @param {string} title - Modal title
   * @param {string} content - Modal content/message
   * @param {string} buttonText - Button label (default: "OK")
   * @param {string} statusType - Status type for styling (success, error, warning, info)
   */
  createModalHTML(modalId, title, content, buttonText = 'OK', statusType = 'default') {
    const statusClass = statusType && statusType !== 'default' ? `modal-dynamic--${statusType}` : '';
    return `
      <div id="${modalId}-overlay" style="
        position: fixed; 
        top: 0; 
        left: 0; 
        right: 0; 
        bottom: 0; 
        background: rgba(0,0,0,0.5); 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        z-index: 3000;
        animation: fadeIn 0.2s ease-out;
      ">
        <div class="modal-dynamic ${statusClass}">
          <h2 class="modal-dynamic__title">${title}</h2>
          <p class="modal-dynamic__subtitle" style="word-break: break-word;">${this.escapeHtml(content)}</p>
          <button id="${modalId}-btn" class="modal-dynamic__button">${buttonText}</button>
        </div>
      </div>
    `;
  },

  /**
   * Helper: Create confirm modal HTML without inline styles
   */
  createConfirmModalHTML(modalId, title, content, confirmText = 'Confirm', cancelText = 'Cancel') {
    return `
      <div id="${modalId}-overlay" style="
        position: fixed; 
        top: 0; 
        left: 0; 
        right: 0; 
        bottom: 0; 
        background: rgba(0,0,0,0.5); 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        z-index: 3000;
        animation: fadeIn 0.2s ease-out;
      ">
        <div class="modal-dynamic">
          <h2 class="modal-dynamic__title">${title}</h2>
          <p class="modal-dynamic__subtitle" style="word-break: break-word; margin-bottom: 2rem;">${this.escapeHtml(content)}</p>
          <div style="display: flex; gap: 1rem;">
            <button id="${modalId}-cancel" class="modal-dynamic__button" style="background: var(--color-text-muted); flex: 1;">${cancelText}</button>
            <button id="${modalId}-confirm" class="modal-dynamic__button" style="flex: 1;">${confirmText}</button>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Show alert modal - uses CSS classes instead of inline styles
   */
  showAlertModal(message, onClose) {
    // Prevent showing modals before initialization is complete
    if (!this.isInitialized) {
      return;
    }

    const modalId = 'alert-modal-' + Date.now();
    const modalHTML = this.createModalHTML(modalId, 'Notice', message, 'OK', 'info');
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.activeModals.add(modalId);
    this.scrollToTop();
    
    const modalOverlay = document.getElementById(modalId + '-overlay');
    const closeBtn = document.getElementById(modalId + '-btn');
    
    const closeModal = () => {
      if (modalOverlay) modalOverlay.remove();
      this.activeModals.delete(modalId);
      if (onClose) onClose();
    };
    
    closeBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });

    // Allow Escape key to close
    const escapeHandler = (e) => {
      if (e.key === 'Escape' && modalOverlay && modalOverlay.parentNode) {
        document.removeEventListener('keydown', escapeHandler);
        closeModal();
      }
    };
    document.addEventListener('keydown', escapeHandler);
  },  /**
   * Show confirm modal - uses CSS classes instead of inline styles
   * @param {string} message - Message to display
   * @param {function} onConfirm - Callback on confirm
   * @param {function} onCancel - Callback on cancel
   */
  showConfirmModal(message, onConfirm, onCancel) {
    // Prevent showing modals before initialization is complete
    if (!this.isInitialized) {
      return;
    }

    const modalId = 'confirm-modal-' + Date.now();
    const modalHTML = this.createConfirmModalHTML(modalId, 'Confirm', message, 'Continue', 'Cancel');
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.activeModals.add(modalId);
    this.scrollToTop();
    
    const modalOverlay = document.getElementById(modalId + '-overlay');
    const confirmBtn = document.getElementById(modalId + '-confirm');
    const cancelBtn = document.getElementById(modalId + '-cancel');
    
    const closeModal = () => {
      if (modalOverlay) modalOverlay.remove();
      this.activeModals.delete(modalId);
      document.removeEventListener('keydown', escapeHandler);
    };
    
    confirmBtn.addEventListener('click', () => {
      closeModal();
      if (onConfirm) onConfirm();
    });
    
    cancelBtn.addEventListener('click', () => {
      closeModal();
      if (onCancel) onCancel();
    });
    
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeModal();
        if (onCancel) onCancel();
      }
    });
    
    // Allow Escape key to close (cancel action)
    const escapeHandler = (e) => {
      if (e.key === 'Escape' && modalOverlay && modalOverlay.parentNode) {
        closeModal();
        if (onCancel) onCancel();
      }
    };
    document.addEventListener('keydown', escapeHandler);
  },

  /**
   * Show success modal - uses CSS classes instead of inline styles
   * @param {string} message - Success message
   * @param {function} onClose - Callback when closed
   */
  showSuccessModal(message, onClose) {
    if (!this.isInitialized) return;
    const modalId = 'success-modal-' + Date.now();
    const modalHTML = this.createModalHTML(modalId, '✓ Success', message, 'Great!', 'success');
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.activeModals.add(modalId);
    this.scrollToTop();
    
    const modalOverlay = document.getElementById(modalId + '-overlay');
    const closeBtn = document.getElementById(modalId + '-btn');
    
    const closeModal = () => {
      if (modalOverlay) modalOverlay.remove();
      this.activeModals.delete(modalId);
      if (onClose) onClose();
    };
    
    closeBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });

    // Allow Escape key to close
    const escapeHandler = (e) => {
      if (e.key === 'Escape' && modalOverlay && modalOverlay.parentNode) {
        document.removeEventListener('keydown', escapeHandler);
        closeModal();
      }
    };
    document.addEventListener('keydown', escapeHandler);
  },

  /**
   * Show error modal
   * @param {string} message - Error message
   * @param {function} onClose - Callback when closed
   */
  /**
   * Show error modal - uses CSS classes instead of inline styles
   * @param {string} message - Error message
   * @param {function} onClose - Callback when closed
   */
  showErrorModal(message, onClose) {
    if (!this.isInitialized) return;
    const modalId = 'error-modal-' + Date.now();
    const modalHTML = this.createModalHTML(modalId, '✕ Error', message, 'Dismiss', 'error');
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.activeModals.add(modalId);
    this.scrollToTop();
    
    const modalOverlay = document.getElementById(modalId + '-overlay');
    const closeBtn = document.getElementById(modalId + '-btn');
    
    const closeModal = () => {
      if (modalOverlay) modalOverlay.remove();
      this.activeModals.delete(modalId);
      if (onClose) onClose();
    };
    
    closeBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  },

  /**
   * Show warning modal - uses CSS classes instead of inline styles
   * @param {string} message - Warning message
   * @param {function} onClose - Callback when closed
   */
  showWarningModal(message, onClose) {
    if (!this.isInitialized) return;
    const modalId = 'warning-modal-' + Date.now();
    const modalHTML = this.createModalHTML(modalId, '⚠ Warning', message, 'Got it', 'warning');
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.activeModals.add(modalId);
    this.scrollToTop();
    
    const modalOverlay = document.getElementById(modalId + '-overlay');
    const closeBtn = document.getElementById(modalId + '-btn');
    
    const closeModal = () => {
      if (modalOverlay) modalOverlay.remove();
      this.activeModals.delete(modalId);
      if (onClose) onClose();
    };
    
    closeBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  },

  /**
   * Show toast notification (non-blocking)
   * @param {string} message - Toast message
   * @param {string} type - 'success', 'error', 'info' (default: 'info')
   * @param {number} duration - Auto-close duration in ms (default: 3000)
   */
  showToast(message, type = 'info', duration = 3000) {
    const toastId = 'toast-' + Date.now();
    
    let backgroundColor = '#77883e';
    let icon = '?';
    
    if (type === 'success') {
      backgroundColor = '#77883e';
      icon = '✓'; // Checkmark for success
    } else if (type === 'error') {
      backgroundColor = '#d64545';
      icon = '✕'; // X mark for error
    } else if (type === 'warning') {
      backgroundColor = '#e8a517';
      icon = '!'; // Exclamation for warning
    }
    
    const toastHTML = `
      <div id="${toastId}" style="
        position: fixed; 
        bottom: 20px; 
        right: 20px; 
        background: ${backgroundColor}; 
        color: #fbf7ec; 
        padding: 16px 24px; 
        border-radius: 8px; 
        box-shadow: 0 4px 12px rgba(0,0,0,0.15); 
        z-index: 2999;
        max-width: 300px;
        animation: slideInRight 0.3s ease-out;
        display: flex;
        gap: 12px;
        align-items: center;
      ">
        <span style="font-size: 18px;">${icon}</span>
        <span>${this.escapeHtml(message)}</span>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', toastHTML);
    const toast = document.getElementById(toastId);
    
    setTimeout(() => {
      if (toast && toast.parentNode) {
        toast.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
          if (toast && toast.parentNode) {
            toast.remove();
          }
        }, 300);
      }
    }, duration);
  },

  /**
   * Show custom status update modal for match status changes
   * @param {string} status - The new status ('hired', 'not-hired', 'in-progress', 'declined')
   * @param {function} onClose - Callback when closed
   */
  showStatusModal(status, onClose) {
    if (!this.isInitialized) return;
    const modalId = 'status-modal-' + Date.now();
    
    const statusConfig = {
      'hired': {
        icon: 'âœ“',
        title: 'Match Hired',
        message: 'Great! You\'ve successfully hired this practitioner.',
        color: '#77883e',
        bgColor: '#e8f0d9'
      },
      'not-hired': {
        icon: 'âœ—',
        title: 'Match Not Hired',
        message: 'You\'ve decided not to hire this practitioner.',
        color: '#d64545',
        bgColor: '#fde8e8'
      },
      'in-progress': {
        icon: 'â†’',
        title: 'In Progress',
        message: 'You\'re now communicating with this practitioner.',
        color: '#77883e',
        bgColor: '#e8f0d9'
      },
      'declined': {
        icon: 'âœ—',
        title: 'Match Declined',
        message: 'This match has been declined.',
        color: '#d64545',
        bgColor: '#fde8e8'
      }
    };
    
    const config = statusConfig[status] || statusConfig['in-progress'];
    const modalHTML = this.createModalHTML(modalId, config.icon + ' ' + config.title, config.message, 'Dismiss', config.type);
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.activeModals.add(modalId);
    this.scrollToTop();
    
    const modalOverlay = document.getElementById(modalId + '-overlay');
    const closeBtn = document.getElementById(modalId + '-btn');
    
    const closeModal = () => {
      if (modalOverlay && modalOverlay.parentNode) {
        modalOverlay.remove();
      }
      this.activeModals.delete(modalId);
      if (onClose) onClose();
    };
    
    closeBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
    
    // Allow Escape key to close
    const escapeHandler = (e) => {
      if (e.key === 'Escape' && modalOverlay && modalOverlay.parentNode) {
        document.removeEventListener('keydown', escapeHandler);
        closeModal();
      }
    };
    document.addEventListener('keydown', escapeHandler);
  },

  /**
   * Show warm welcome modal for new client signups
   * @param {string} clientName - The client's name to personalize welcome
   * @param {function} onClose - Callback when closed (typically triggers redirect)
   */
  showWelcomeModal(clientName = '', onClose) {
    if (!this.isInitialized) return;
    const modalId = 'welcome-modal-' + Date.now();
    const greeting = clientName ? `Welcome, ${clientName}!` : 'Welcome to Rooted Vitality!';
    const message = 'You\'re now part of a community dedicated to holistic wellness and meaningful connections. Let\'s find the perfect practitioners for your wellness journey.';
    const modalHTML = this.createModalHTML(modalId, '🌱 ' + greeting, message, 'Get Started', 'success');
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.activeModals.add(modalId);
    this.scrollToTop();
    
    const modalOverlay = document.getElementById(modalId + '-overlay');
    const closeBtn = document.getElementById(modalId + '-btn');
    
    const closeModal = () => {
      if (modalOverlay && modalOverlay.parentNode) {
        // Add fade out animation before removing
        modalOverlay.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
          if (modalOverlay && modalOverlay.parentNode) {
            modalOverlay.remove();
          }
          this.activeModals.delete(modalId);
          if (onClose) onClose();
        }, 300);
      } else {
        this.activeModals.delete(modalId);
        if (onClose) onClose();
      }
    };
    
    closeBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  },

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} - Escaped text
   */
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
};

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ModalManager.init());
} else {
  ModalManager.init();
}

// Add animations to stylesheet if not present
if (!document.getElementById('modal-manager-styles')) {
  const style = document.createElement('style');
  style.id = 'modal-manager-styles';
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
    
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(20px); }
      to { opacity: 1; transform: translateX(0); }
    }
    
    @keyframes slideOutRight {
      from { opacity: 1; transform: translateX(0); }
      to { opacity: 0; transform: translateX(20px); }
    }
    
    @keyframes bounce {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.15); }
    }
  `;
  document.head.appendChild(style);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ModalManager;
}

} // End of duplicate prevention guard





























































