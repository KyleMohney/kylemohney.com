/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: tabController.js                                            ║
║  Purpose: Tab switching between Client and Practitioner views      ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

 TABLE OF CONTENTS
   1. SWITCH TAB HANDLER
   2. INITIALIZE TAB LISTENERS
   3. EXPORTS & GLOBALS
*/

// ======================================================
// 1. SWITCH TAB HANDLER
// ======================================================

// ======================================================
// tabController.js
// ======================================================
// Purpose: Manages tab switching between Client and Practitioner

// ======================================================
// 1. SWITCH TAB HANDLER
// ======================================================
function switchTab(tabType) {
  const clientTab = document.getElementById('clientTab');
  const practitionerTab = document.getElementById('practitionerTab');
  
  if (tabType === 'client') {
    clientTab.classList.add('active');
    practitionerTab.classList.remove('active');
    clientTab.setAttribute('aria-pressed', 'true');
    practitionerTab.setAttribute('aria-pressed', 'false');
  } else {
    practitionerTab.classList.add('active');
    clientTab.classList.remove('active');
    practitionerTab.setAttribute('aria-pressed', 'true');
    clientTab.setAttribute('aria-pressed', 'false');
  }
  
  // Update render manager
  window.renderManager.setCurrentTab(tabType);
}

// ======================================================
// 2. INITIALIZE TAB LISTENERS
// ======================================================
function initTabListeners() {
  const clientTab = document.getElementById('clientTab');
  const practitionerTab = document.getElementById('practitionerTab');
  
  // Click handlers
  clientTab.addEventListener('click', () => switchTab('client'));
  practitionerTab.addEventListener('click', () => switchTab('practitioner'));
  
  // Keyboard handlers
  clientTab.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      switchTab('client');
    }
  });
  
  practitionerTab.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      switchTab('practitioner');
    }
  });
}

// Export
window.tabController = {
  switchTab,
  initTabListeners
};


























































