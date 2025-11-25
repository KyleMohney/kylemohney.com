/*
  =====================================================================
  ROOTED VITALITY, INC.
  File: scripts/modalManager.js
  Purpose: Global Modal Management System - Single Source of Truth
  Holistic Wellness · Modern Connection Platform
  rootedvitality.com | 2025
  =====================================================================

  ARCHITECTURE:
    - Centralized modal management replacing 233+ inline alert/confirm calls
    - Brand-aligned styling with cream backgrounds, green accents
    - Callback-based architecture for async handling
    - Global window.showAlertModal() and window.showConfirmModal()
    - Toast notifications for non-blocking messages
    - Success/Error/Warning modal types with icons
  
  USAGE:
    window.showAlertModal('Your message', () => { console.log('closed'); });
    window.showConfirmModal('Continue?', () => { // yes }, () => { // no });
    window.showSuccessModal('Success!');
    window.showErrorModal('Error: Something failed');
    window.showToast('Quick message');
*/

// Prevent duplicate declaration if script loads multiple times
if (typeof ModalManager !== 'undefined') {
  console.warn('[Modal Manager] Already loaded, skipping initialization');
} else {

const ModalManager = {
  activeModals: new Set(),
  
  init() {
    console.log('[Modal Manager] Initialized - Global modal system ready');
    // Ensure functions are available globally
    window.showAlertModal = this.showAlertModal.bind(this);
    window.showConfirmModal = this.showConfirmModal.bind(this);
    window.showSuccessModal = this.showSuccessModal.bind(this);
    window.showErrorModal = this.showErrorModal.bind(this);
    window.showWarningModal = this.showWarningModal.bind(this);
    window.showToast = this.showToast.bind(this);
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
    let icon = '??';
    
    if (type === 'success') {
      backgroundColor = '#77883e';
      icon = '?';
    } else if (type === 'error') {
      backgroundColor = '#d64545';
      icon = '??';
    } else if (type === 'warning') {
      backgroundColor = '#e8a517';
      icon = '?';
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
  `;
  document.head.appendChild(style);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ModalManager;
}

} // End of duplicate prevention guard


























































