/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: searchHandler.js                                            ║
║  Purpose: Search input handling and article filtering              ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

 TABLE OF CONTENTS
   1. SEARCH INITIALIZATION & EVENT LISTENERS
   2. SEARCH FILTERING & MATCHING
   3. RESULT RENDERING
   4. EXPORTS & GLOBALS
*/

// ======================================================
// 1. SEARCH INITIALIZATION & EVENT LISTENERS
// ======================================================

// ======================================================
// searchHandler.js
// ======================================================
// Purpose: Manages search input and filtering

// ======================================================
// 1. INITIALIZE SEARCH HANDLER
// ======================================================
function initSearchHandler() {
  const searchInput = document.getElementById('searchInput');
  
  searchInput.addEventListener('input', () => {
    window.renderManager.handleSearch();
  });
}

// Export
window.searchHandler = {
  initSearchHandler
};


























































