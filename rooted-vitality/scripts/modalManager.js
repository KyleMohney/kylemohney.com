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
  
  init() {

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
   * Auto-scroll page to top when modal opens
   */
  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  /**
   * Show alert modal (replaces window.showAlertModal())
   * @param {string} message - Message to display
   * @param {function} onClose - Callback when closed
   */
  showAlertModal(message, onClose) {
    const modalId = 'alert-modal-' + Date.now();
    
    const modalHTML = `
      <div class="modal-overlay" id="${modalId}-overlay" style="
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
        <div class="modal-content" style="
          background: #fbf7ec; 
          border-radius: 12px; 
          padding: 40px; 
          max-width: 420px; 
          width: 90%; 
          box-shadow: 0 10px 40px rgba(0,0,0,0.15); 
          text-align: center;
          animation: slideUp 0.3s ease-out;
        ">
          <h2 style="
            font-size: 18px; 
            color: #2e2b28; 
            margin-bottom: 16px; 
            font-weight: 600;
          ">Notice</h2>
          <p style="
            font-size: 14px; 
            color: #666; 
            line-height: 1.6; 
            margin-bottom: 24px;
            word-break: break-word;
          ">${this.escapeHtml(message)}</p>
          <button id="${modalId}-btn" style="
            width: 100%; 
            padding: 12px; 
            background: #77883e; 
            color: #fbf7ec; 
            border: none; 
            border-radius: 8px; 
            font-size: 14px; 
            font-weight: 600; 
            cursor: pointer;
            transition: all 0.2s;
          " onmouseover="this.style.background='#5e6e30'" onmouseout="this.style.background='#77883e'">OK</button>
        </div>
      </div>
    `;
    
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
   * Show confirm modal
   * @param {string} message - Message to display
   * @param {function} onConfirm - Callback on confirm
   * @param {function} onCancel - Callback on cancel
   */
  showConfirmModal(message, onConfirm, onCancel) {
    const modalId = 'confirm-modal-' + Date.now();
    
    const modalHTML = `
      <div class="modal-overlay" id="${modalId}-overlay" style="
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
        <div class="modal-content" style="
          background: #fbf7ec; 
          border-radius: 12px; 
          padding: 40px; 
          max-width: 420px; 
          width: 90%; 
          box-shadow: 0 10px 40px rgba(0,0,0,0.15); 
          text-align: center;
          animation: slideUp 0.3s ease-out;
        ">
          <h2 style="
            font-size: 18px; 
            color: #2e2b28; 
            margin-bottom: 16px; 
            font-weight: 600;
          ">Confirm</h2>
          <p style="
            font-size: 14px; 
            color: #666; 
            line-height: 1.6; 
            margin-bottom: 24px;
            word-break: break-word;
          ">${this.escapeHtml(message)}</p>
          <div style="display: flex; gap: 12px;">
            <button id="${modalId}-cancel" style="
              flex: 1; 
              padding: 12px; 
              background: #e8e6e1; 
              color: #2e2b28; 
              border: none; 
              border-radius: 8px; 
              font-size: 14px; 
              font-weight: 600; 
              cursor: pointer;
              transition: all 0.2s;
            " onmouseover="this.style.background='#fbf7ec9cf'" onmouseout="this.style.background='#e8e6e1'">Cancel</button>
            <button id="${modalId}-confirm" style="
              flex: 1; 
              padding: 12px; 
              background: #77883e; 
              color: #fbf7ec; 
              border: none; 
              border-radius: 8px; 
              font-size: 14px; 
              font-weight: 600; 
              cursor: pointer;
              transition: all 0.2s;
            " onmouseover="this.style.background='#5e6e30'" onmouseout="this.style.background='#77883e'">Continue</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.activeModals.add(modalId);
    this.scrollToTop();
    
    const modalOverlay = document.getElementById(modalId + '-overlay');
    const confirmBtn = document.getElementById(modalId + '-yes-btn');
    const cancelBtn = document.getElementById(modalId + '-no-btn');
    
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
   * Show success modal
   * @param {string} message - Success message
   * @param {function} onClose - Callback when closed
   */
  showSuccessModal(message, onClose) {
    const modalId = 'success-modal-' + Date.now();
    
    const modalHTML = `
      <div class="modal-overlay" id="${modalId}-overlay" style="
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
        <div class="modal-content" style="
          background: #fbf7ec; 
          border-radius: 12px; 
          padding: 40px; 
          max-width: 420px; 
          width: 90%; 
          box-shadow: 0 10px 40px rgba(0,0,0,0.15); 
          text-align: center;
          animation: slideUp 0.3s ease-out;
        ">
          <div style="
            font-size: 48px; 
            margin-bottom: 16px;
          ">?</div>
          <h2 style="
            font-size: 18px; 
            color: #77883e; 
            margin-bottom: 16px; 
            font-weight: 600;
          ">Success</h2>
          <p style="
            font-size: 14px; 
            color: #666; 
            line-height: 1.6; 
            margin-bottom: 24px;
            word-break: break-word;
          ">${this.escapeHtml(message)}</p>
          <button id="${modalId}-btn" style="
            width: 100%; 
            padding: 12px; 
            background: #77883e; 
            color: #fbf7ec; 
            border: none; 
            border-radius: 8px; 
            font-size: 14px; 
            font-weight: 600; 
            cursor: pointer;
            transition: all 0.2s;
          " onmouseover="this.style.background='#5e6e30'" onmouseout="this.style.background='#77883e'">Great!</button>
        </div>
      </div>
    `;
    
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
   * Show error modal
   * @param {string} message - Error message
   * @param {function} onClose - Callback when closed
   */
  showErrorModal(message, onClose) {
    const modalId = 'error-modal-' + Date.now();
    
    const modalHTML = `
      <div class="modal-overlay" id="${modalId}-overlay" style="
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
        <div class="modal-content" style="
          background: #fbf7ec; 
          border-radius: 12px; 
          padding: 40px; 
          max-width: 420px; 
          width: 90%; 
          box-shadow: 0 10px 40px rgba(0,0,0,0.15); 
          text-align: center;
          animation: slideUp 0.3s ease-out;
        ">
          <div style="
            font-size: 48px; 
            margin-bottom: 16px;
          ">??</div>
          <h2 style="
            font-size: 18px; 
            color: #d64545; 
            margin-bottom: 16px; 
            font-weight: 600;
          ">Error</h2>
          <p style="
            font-size: 14px; 
            color: #666; 
            line-height: 1.6; 
            margin-bottom: 24px;
            word-break: break-word;
          ">${this.escapeHtml(message)}</p>
          <button id="${modalId}-btn" style="
            width: 100%; 
            padding: 12px; 
            background: #d64545; 
            color: #fbf7ec; 
            border: none; 
            border-radius: 8px; 
            font-size: 14px; 
            font-weight: 600; 
            cursor: pointer;
            transition: all 0.2s;
          " onmouseover="this.style.background='#b93535'" onmouseout="this.style.background='#d64545'">Dismiss</button>
        </div>
      </div>
    `;
    
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
   * Show warning modal
   * @param {string} message - Warning message
   * @param {function} onClose - Callback when closed
   */
  showWarningModal(message, onClose) {
    const modalId = 'warning-modal-' + Date.now();
    
    const modalHTML = `
      <div class="modal-overlay" id="${modalId}-overlay" style="
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
        <div class="modal-content" style="
          background: #fbf7ec; 
          border-radius: 12px; 
          padding: 40px; 
          max-width: 420px; 
          width: 90%; 
          box-shadow: 0 10px 40px rgba(0,0,0,0.15); 
          text-align: center;
          animation: slideUp 0.3s ease-out;
        ">
          <div style="
            font-size: 48px; 
            margin-bottom: 16px;
          ">?</div>
          <h2 style="
            font-size: 18px; 
            color: #e8a517; 
            margin-bottom: 16px; 
            font-weight: 600;
          ">Warning</h2>
          <p style="
            font-size: 14px; 
            color: #666; 
            line-height: 1.6; 
            margin-bottom: 24px;
            word-break: break-word;
          ">${this.escapeHtml(message)}</p>
          <button id="${modalId}-btn" style="
            width: 100%; 
            padding: 12px; 
            background: #e8a517; 
            color: #fbf7ec; 
            border: none; 
            border-radius: 8px; 
            font-size: 14px; 
            font-weight: 600; 
            cursor: pointer;
            transition: all 0.2s;
          " onmouseover="this.style.background='#d69500'" onmouseout="this.style.background='#e8a517'">Got it</button>
        </div>
      </div>
    `;
    
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
    
    const modalHTML = `
      <div class="modal-overlay" id="${modalId}-overlay" style="
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
        <div class="modal-content" style="
          background: #fbf7ec; 
          border-radius: 12px; 
          padding: 40px; 
          max-width: 440px; 
          width: 90%; 
          box-shadow: 0 10px 40px rgba(0,0,0,0.15); 
          text-align: center;
          animation: slideUp 0.3s ease-out;
          border-left: 5px solid ${config.color};
        ">
          <div style="
            font-size: 56px; 
            margin-bottom: 20px;
            color: ${config.color};
          ">${config.icon}</div>
          <h2 style="
            font-size: 20px; 
            color: ${config.color}; 
            margin-bottom: 12px; 
            font-weight: 700;
            letter-spacing: 0.5px;
          ">${config.title}</h2>
          <p style="
            font-size: 14px; 
            color: #666; 
            line-height: 1.6; 
            margin-bottom: 28px;
            word-break: break-word;
          ">${this.escapeHtml(config.message)}</p>
          <button id="${modalId}-btn" style="
            width: 100%; 
            padding: 14px; 
            background: ${config.color}; 
            color: #fbf7ec; 
            border: none; 
            border-radius: 8px; 
            font-size: 14px; 
            font-weight: 600; 
            cursor: pointer;
            transition: all 0.2s;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          " onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">Dismiss</button>
        </div>
      </div>
    `;
    
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
    const modalId = 'welcome-modal-' + Date.now();
    
    const greeting = clientName ? `Welcome, ${clientName}!` : 'Welcome to Rooted Vitality!';
    
    const modalHTML = `
      <div class="modal-overlay" id="${modalId}-overlay" style="
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
        <div class="modal-content" style="
          background: linear-gradient(135deg, #fbf7ec 0%, #f5f0e6 100%); 
          border-radius: 12px; 
          padding: 50px 40px; 
          max-width: 480px; 
          width: 90%; 
          box-shadow: 0 15px 50px rgba(0,0,0,0.2); 
          text-align: center;
          animation: slideUp 0.4s ease-out;
          border-top: 4px solid #77883e;
        ">
          <div style="
            font-size: 64px; 
            margin-bottom: 24px;
            animation: bounce 0.6s ease-out;
          ">ðŸŒ±</div>
          <h2 style="
            font-size: 24px; 
            color: #77883e; 
            margin-bottom: 16px; 
            font-weight: 700;
            letter-spacing: 0.5px;
          ">${this.escapeHtml(greeting)}</h2>
          <p style="
            font-size: 15px; 
            color: #555; 
            line-height: 1.8; 
            margin-bottom: 12px;
          ">You're now part of a community dedicated to holistic wellness and meaningful connections.</p>
          <p style="
            font-size: 14px; 
            color: #888; 
            line-height: 1.6; 
            margin-bottom: 32px;
            font-style: italic;
          ">Let's find the perfect practitioners for your wellness journey.</p>
          <button id="${modalId}-btn" style="
            width: 100%; 
            padding: 16px; 
            background: #77883e; 
            color: #fbf7ec; 
            border: none; 
            border-radius: 8px; 
            font-size: 15px; 
            font-weight: 700; 
            cursor: pointer;
            transition: all 0.3s;
            text-transform: uppercase;
            letter-spacing: 1px;
          " onmouseover="this.style.background='#5e6e30'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(119,136,62,0.3)'" onmouseout="this.style.background='#77883e'; this.style.transform='translateY(0)'; this.style.boxShadow='none'">Get Started</button>
        </div>
      </div>
    `;
    
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





























































