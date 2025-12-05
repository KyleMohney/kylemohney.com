/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: match-settings-modals.js                                    ║
║  Purpose: Modal Management & UI Controls for Match Settings        ║
║  Handles: Category modals, confirmations, toasts                   ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

TABLE OF CONTENTS
  1. Modal State & Globals
  2. Category Modal Functions
  3. Confirmation Modal
  4. Toast Notifications
  5. Modal Event Setup
  6. Utilities

NOTE: Functions in HTML that are NOT duplicated here:
  - switchPanel() - MUST stay in HTML (called from onclick handlers)
  - populateStateDropdown() - MUST stay in HTML (called early in DOMContentLoaded)
  - loadTaxonomy() - MUST stay in HTML (called during initialization)
  - initializeMatchSettingsManager() - MUST stay in HTML (called during initialization)
  - loadSettingsIntoUI() - MUST stay in HTML (called from initializeMatchSettingsManager)
  - showToast() - MUST stay in HTML (called from multiple initialization points)

*/

/* ========================================== */
/* 1. MODAL STATE & GLOBALS */
/* ========================================== */

// Modal state (conditional declaration to avoid conflicts)
if (typeof pendingConfirmAction === 'undefined') { var pendingConfirmAction = null; }
if (typeof selectedCategoryForAdd === 'undefined') { var selectedCategoryForAdd = null; }


/* ========================================== */
/* 2. CATEGORY MODAL FUNCTIONS */
/* ========================================== */

/**
 * Generic modal opener (consolidates repetitive open functions)
 * @param {string} modalName - Simple modal name (e.g., 'browse', 'preferences')
 */
function openModal(modalName) {
  // Map modal names to their actual HTML IDs
  const modalIdMap = {
    'preferences': 'preferences-modal',
    'browse': 'browse-categories-modal',
    'membership-required': 'membership-required-modal',
    'credential-gate': 'credential-gate-modal',
    'confirm': 'confirm-modal'
  };

  const modalId = modalIdMap[modalName];
  if (!modalId) {
    console.warn(`Unknown modal name: ${modalName}`);
    return;
  }

  const modal = document.getElementById(modalId);
  
  if (!modal) {
    console.warn(`Modal not found: ${modalId}`);
    return;
  }

  // Special handling for browse modal
  if (modalName === 'browse' && typeof renderBrowseCategoryCards === 'function') {
    renderBrowseCategoryCards();
  }

  modal.classList.add('active');
}

/**
 * Open preferences modal for category editing (wrapper for compatibility)
 * @param {string} categoryId - The category to edit
 */
function openPreferencesModal(categoryId) {
  console.log('[Match Settings Modal] openPreferencesModal called with categoryId:', categoryId);
  
  const category = window.allCategories?.find(c => c.id === categoryId);
  if (!category) {
    console.error('[Match Settings Modal] Category not found:', categoryId);
    return;
  }

  // Store current category being edited - MUST be local variable for savePreferencesModal() in match-settings.js
  currentEditingCategory = categoryId;
  console.log('[Match Settings Modal] Set currentEditingCategory to:', currentEditingCategory);

  // Set modal title
  const titleElement = document.getElementById('preferences-modal-title');
  if (titleElement) {
    titleElement.textContent = category.name || 'Preferences';
  }

  // Load existing price if available
  const activeCategory = window.activeCategories?.find(ac => ac.id === categoryId);
  const priceInput = document.getElementById('modal-price-input');
  if (priceInput) {
    priceInput.value = (activeCategory && activeCategory.price_per_service) ? activeCategory.price_per_service : '';
  }

  // Load subcategories
  const subcategoriesList = document.getElementById('subcategories-list');
  if (subcategoriesList && category.subcategories) {
    subcategoriesList.innerHTML = '';
    category.subcategories.forEach(sub => {
      const label = document.createElement('label');
      label.className = 'checkbox-item';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.setAttribute('data-subcategory', sub);
      
      // Check if already selected in activeCategories
      if (activeCategory && activeCategory.subcategories && activeCategory.subcategories.includes(sub)) {
        checkbox.checked = true;
      }
      
      const span = document.createElement('span');
      span.className = 'checkbox-label';
      span.textContent = sub;
      
      label.appendChild(checkbox);
      label.appendChild(span);
      subcategoriesList.appendChild(label);
    });
  }

  // Open the modal using generic opener
  console.log('[Match Settings Modal] Opening preferences modal...');
  openModal('preferences');
}

/**
 * Open browse categories modal (wrapper for compatibility)
 */
function openBrowseCategoriesModal() {
  openModal('browse');
}

/**
 * Generic modal closer (consolidates repetitive close functions)
 * @param {string} modalName - The modal name (e.g., 'preferences', 'browse')
 * @param {boolean} clearState - Whether to clear associated state
 */
function closeModal(modalName, clearState = false) {
  // Map modal names to their actual HTML IDs
  const modalIdMap = {
    'preferences': 'preferences-modal',
    'browse': 'browse-categories-modal',
    'membership-required': 'membership-required-modal',
    'credential-gate': 'credential-gate-modal',
    'confirm': 'confirm-modal'
  };

  const modalId = modalIdMap[modalName];
  if (!modalId) {
    console.warn(`Unknown modal name: ${modalName}`);
    return;
  }

  const modal = document.getElementById(modalId);

  if (modal) modal.classList.remove('active');

  if (clearState && modalName === 'preferences') {
    selectedCategoryForAdd = null;
  }
  
  if (clearState && modalName === 'confirm') {
    pendingConfirmAction = null;
  }
}

/**
 * Close preferences modal (wrapper for compatibility)
 */
function closePreferencesModal() {
  closeModal('preferences', true);
}

/**
 * Save category price and close modal
 * NOTE: The actual working savePreferencesModal() function is in match-settings.js
 * This file should NOT redefine it - the working version handles:
 * - Getting selected subcategories from checkboxes
 * - Saving to database via matchSettingsManager.addServiceCategory()
 * - Syncing pricing and service arrays
 * - Rendering updated UI
 * 
 * This function is kept for reference only.
 * The working version is at match-settings.js line 1493
 */

// DEPRECATED: Do not use this - it's a placeholder
// The actual savePreference() in match-settings.js works correctly


/**
 * Close browse modal (wrapper for compatibility)
 */
function closeBrowseCategoriesModal() {
  closeModal('browse', false);
}

/**
 * Open credential gate modal (wrapper for compatibility)
 */
function openCredentialGateModal() {
  openModal('credential-gate');
}

/**
 * Close credential gate modal (wrapper for compatibility)
 */
function closeCredentialGateModal() {
  closeModal('credential-gate', false);
}

/**
 * Open membership required modal (wrapper for compatibility)
 */
function openMembershipRequiredModal() {
  openModal('membership-required');
}

/**
 * Close membership required modal (wrapper for compatibility)
 */
function closeMembershipRequiredModal() {
  closeModal('membership-required', false);
}


/* ========================================== */
/* 3. CONFIRMATION MODAL */
/* ========================================== */

/**
 * Request to remove a category (called from onclick)
 * @param {string} categoryId - The category to remove
 */
function confirmRemoveCategory(categoryId) {
  const category = window.activeCategories?.find(ac => ac.id === categoryId);
  if (!category) {
    showToast('Category not found', 'error');
    return;
  }

  pendingConfirmAction = {
    type: 'removeCategory',
    categoryId: categoryId,
    category: category
  };

  const modal = document.getElementById('confirm-modal');
  const overlay = document.getElementById('confirm-modal-overlay');
  const message = document.getElementById('confirm-message');

  if (message) {
    message.textContent = `Are you sure you want to remove "${category.name}" from your categories?`;
  }

  if (modal) modal.classList.add('active');
  if (overlay) overlay.classList.add('active');
}

/**
 * Remove category from database and UI (called from HTML via pendingConfirmAction)
 * @param {string} categoryId - The category to remove
 * @param {object} category - The category object
 */
async function removeCategoryFromDatabaseAndUI(categoryId, category) {
  try {
    // Remove from database if manager is initialized
    if (window.matchSettingsManager) {
      const categoryItem = window.activeCategories?.find(ac => ac.id === categoryId);
      if (categoryItem && categoryItem.serviceIds && categoryItem.serviceIds.length > 0) {
        // Delete all services for this category
        for (const serviceId of categoryItem.serviceIds) {
          await window.matchSettingsManager.removeServiceCategory(serviceId);
        }
      }
    }

    // Remove from UI
    window.activeCategories = window.activeCategories.filter(ac => ac.id !== categoryId);
    
    // Call render function
    if (window.renderActiveCategories) {
      window.renderActiveCategories();
    }
    
    showToast(`${category.name} removed.`, 'success');
    closeConfirmModal();
  } catch (error) {
    showToast('Failed to remove category: ' + error.message, 'error');
  }
}

/**
 * Close confirmation modal (wrapper for compatibility)
 */
function closeConfirmModal() {
  closeModal('confirm', true);
}

/**
 * Execute pending confirmation action (called from onclick)
 */
async function executeConfirmAction() {
  if (!pendingConfirmAction) return;

  if (pendingConfirmAction.type === 'removeCategory') {
    await removeCategoryFromDatabaseAndUI(
      pendingConfirmAction.categoryId,
      pendingConfirmAction.category
    );
  }

  closeConfirmModal();
}


/* ========================================== */
/* 4. TOAST NOTIFICATIONS */
/* ========================================== */

/**
 * Show toast notification
 * NOTE: This function exists in HTML as well for early initialization calls
 * This wrapper ensures it works when called from external JS files
 * @param {string} message - Toast message
 * @param {string} type - 'success', 'error', 'info'
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
/**
 * Show toast notification (wrapper for modalManager)
 * Uses the unified toast system from modalManager.js
 * @param {string} message - Message to display
 * @param {string} type - Type: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
function showToast(message, type = 'success', duration = 3000) {
  // Use modalManager's showToast if available
  if (typeof window.ModalManager !== 'undefined' && window.ModalManager.showToast) {
    window.ModalManager.showToast(message, type, duration);
  } else if (typeof window.ModalManagerInstance !== 'undefined' && window.ModalManagerInstance.showToast) {
    window.ModalManagerInstance.showToast(message, type, duration);
  }
  // If modalManager not loaded, silently fail (user should load it first)
}


/* ========================================== */
/* 5. MODAL EVENT SETUP */
/* ========================================== */

/**
 * Setup all modal event listeners
 * Call this from DOMContentLoaded
 * 
 * NOTE: Save button listeners are NOT attached here because savePreferencesModal()
 * is defined in match-settings.js and should be called via onclick in the HTML
 */
function setupModalListeners() {
  // Preferences modal close handlers
  const preferencesOverlay = document.getElementById('preferences-modal-overlay');
  if (preferencesOverlay) {
    preferencesOverlay.addEventListener('click', closePreferencesModal);
  }

  const preferencesClose = document.querySelector('#preferences-modal .modal-close');
  if (preferencesClose) {
    preferencesClose.addEventListener('click', closePreferencesModal);
  }

  // NOTE: Save button is handled by match-settings.js savePreferencesModal() via onclick
  
  // Browse modal close handlers
  const browseOverlay = document.getElementById('browse-modal-overlay');
  if (browseOverlay) {
    browseOverlay.addEventListener('click', closeBrowseModal);
  }

  const browseClose = document.querySelector('#browse-modal .modal-close');
  if (browseClose) {
    browseClose.addEventListener('click', closeBrowseModal);
  }

  // Credential gate close handlers
  const credentialOverlay = document.getElementById('credential-gate-modal-overlay');
  if (credentialOverlay) {
    credentialOverlay.addEventListener('click', closeCredentialGateModal);
  }

  const credentialClose = document.querySelector('#credential-gate-modal .modal-close');
  if (credentialClose) {
    credentialClose.addEventListener('click', closeCredentialGateModal);
  }

  // Confirmation modal handlers
  const confirmOverlay = document.getElementById('confirm-modal-overlay');
  if (confirmOverlay) {
    confirmOverlay.addEventListener('click', closeConfirmModal);
  }

  const confirmClose = document.querySelector('#confirm-modal .modal-close');
  if (confirmClose) {
    confirmClose.addEventListener('click', closeConfirmModal);
  }

  const confirmCancel = document.getElementById('confirm-cancel-btn');
  if (confirmCancel) {
    confirmCancel.addEventListener('click', closeConfirmModal);
  }

  const confirmExecute = document.getElementById('confirm-execute-btn');
  if (confirmExecute) {
    confirmExecute.addEventListener('click', executeConfirmAction);
  }
}


/* ========================================== */
/* 6. UTILITIES */
/* ========================================== */

/**
 * Close all modals at once
 */
function closeAllModals() {
  closePreferencesModal();
  closeBrowseModal();
  closeCredentialGateModal();
  closeConfirmModal();
}

/**
 * Check if any modal is currently open
 * @returns {boolean} True if any modal is open
 */
function isAnyModalOpen() {
  const modals = [
    document.getElementById('preferences-modal'),
    document.getElementById('browse-modal'),
    document.getElementById('credential-gate-modal'),
    document.getElementById('confirm-modal')
  ];
  
  return modals.some(m => m && m.classList.contains('active'));
}

/**
 * Function name aliases for compatibility with HTML onclick handlers
 */
// For backward compatibility - these are now just references to wrappers
const openBrowseModal = openBrowseCategoriesModal;
const closeBrowseModal = closeBrowseCategoriesModal;
const showMembershipRequiredModal = openMembershipRequiredModal;
