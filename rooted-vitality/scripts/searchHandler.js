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
























































