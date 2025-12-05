/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: userSearch.js                                               ║
║  Purpose: Admin User Search Functionality                          ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

TABLE OF CONTENTS
  1. SEARCH INITIALIZATION
  2. SEARCH EXECUTION
  3. RESULT RENDERING
  4. USER DETAIL VIEW

═══════════════════════════════════════════════════════════════════════════════
*/

// ═══════════════════════════════════════════════════════════════════════════════
// 1. SEARCH INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Initialize search functionality
 */
function initializeSearch() {
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');

  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        performSearch();
      }
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', performSearch);
  }

  console.log('[User Search] Initialized');
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. SEARCH EXECUTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Perform user search
 */
async function performSearch() {
  const searchInput = document.getElementById('search-input');
  const query = searchInput?.value?.trim();

  if (!query || query.length < 2) {
    showNotification('Please enter at least 2 characters', 'warning');
    return;
  }

  try {
    const searchBtn = document.getElementById('search-btn');
    searchBtn.disabled = true;
    searchBtn.textContent = 'Searching...';

    console.log('[User Search] Searching for:', query);

    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const results = [];

    // Search practitioners
    const { data: practitioners } = await supabase
      .from('practitioners')
      .select('id, email, serial_number, legal_name, created_at')
      .or(`email.ilike.%${query}%,legal_name.ilike.%${query}%,serial_number.ilike.%${query}%`);

    if (practitioners) {
      results.push(...practitioners.map(p => ({
        id: p.id,
        email: p.email,
        name: p.legal_name,
        serial_number: p.serial_number,
        user_type: 'practitioner',
        created_at: p.created_at
      })));
    }

    // Search clients
    const { data: clients } = await supabase
      .from('clients')
      .select('id, email, serial_number, first_name, last_name, created_at')
      .or(`email.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%,serial_number.ilike.%${query}%`);

    if (clients) {
      results.push(...clients.map(c => ({
        id: c.id,
        email: c.email,
        name: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
        serial_number: c.serial_number,
        user_type: 'client',
        created_at: c.created_at
      })));
    }

    console.log('[User Search] Results:', results);
    displaySearchResults(results);
  } catch (error) {
    console.error('[User Search] Error:', error);
    showNotification('Search failed - please try again', 'error');
  } finally {
    const searchBtn = document.getElementById('search-btn');
    searchBtn.disabled = false;
    searchBtn.textContent = 'Search';
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. RESULT RENDERING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Display search results
 */
function displaySearchResults(users) {
  const resultsList = document.getElementById('results-list');
  const searchResults = document.getElementById('search-results');
  const noResults = document.getElementById('no-results');
  const resultCount = document.getElementById('result-count');

  // Clear previous results
  if (resultsList) {
    resultsList.innerHTML = '';
  }

  if (users.length === 0) {
    searchResults.style.display = 'none';
    noResults.style.display = 'block';
    return;
  }

  // Show results
  searchResults.style.display = 'block';
  noResults.style.display = 'none';
  resultCount.textContent = users.length;

  // Render each user
  users.forEach(user => {
    const resultHTML = createUserResultElement(user);
    if (resultsList) {
      resultsList.innerHTML += resultHTML;
    }
  });

  // Add click handlers
  document.querySelectorAll('.user-result').forEach(element => {
    element.addEventListener('click', (e) => {
      viewUserDetails(e.currentTarget.dataset);
    });
  });
}

/**
 * Create user result element HTML
 */
function createUserResultElement(user) {
  const userType = user.user_type || 'unknown';
  const typeLabel = userType === 'practitioner' ? 'Practitioner' : userType === 'client' ? 'Client' : 'User';

  // Build meta information based on available fields
  let meta = [];
  if (user.email) meta.push(user.email);
  if (user.phone) meta.push(user.phone);
  if (user.serial) meta.push(`Serial: ${user.serial}`);
  if (user.id) meta.push(`ID: ${user.id}`);

  return `
    <div class="user-result" data-id="${user.id}" data-name="${user.name || 'Unknown'}" data-email="${user.email}" data-user-type="${userType}" data-created-at="${user.created_at || ''}">
      <div class="result-header">
        <div class="result-name">${user.name || 'Unknown'}</div>
        <span class="result-badge">${typeLabel}</span>
      </div>
      <div class="result-meta">${meta.join(' • ')}</div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. USER DETAIL VIEW
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * View full user details - navigate based on user type
 */
async function viewUserDetails(userData) {
  try {
    const userId = userData.id;
    const userType = userData.userType;

    console.log('[User Search] Loading details for user:', userId, 'Type:', userType);

    // Route to appropriate detail view based on user type
    if (userType === 'practitioner') {
      displayPractitionerDetail(userId);
    } else if (userType === 'client') {
      // TODO: Implement client detail view
      alert('Client detail view coming soon');
    } else {
      alert('Unknown user type');
    }

  } catch (error) {
    console.error('[User Search] Error loading details:', error);
    showNotification('Failed to load user details', 'error');
  }
}

/**
 * Display user details (legacy - kept for backward compatibility)
 */
function displayUserDetails(user) {
  console.log('[User Search] User details:', user);
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
  console.log(`[${type.toUpperCase()}] ${message}`);
}

/**
 * Get Supabase client (from adminAuth.js global)
 */
function getSupabaseClient() {
  // Use global supabaseClient from adminAuth.js
  if (typeof supabaseClient !== 'undefined') {
    return supabaseClient;
  }
  // Fallback if called before adminAuth initialization
  console.warn('[User Search] Supabase client not initialized');
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT SEARCH
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Initialize project search functionality
 */
function initializeProjectSearch() {
  const searchInput = document.getElementById('search-projects-input');
  const searchBtn = document.getElementById('search-projects-btn');

  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        performProjectSearch();
      }
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', performProjectSearch);
  }

  console.log('[Project Search] Initialized');
}

/**
 * Perform project search
 */
async function performProjectSearch() {
  const searchInput = document.getElementById('search-projects-input');
  const query = searchInput?.value?.trim();

  if (!query || query.length < 2) {
    showNotification('Please enter at least 2 characters', 'warning');
    return;
  }

  try {
    const searchBtn = document.getElementById('search-projects-btn');
    searchBtn.disabled = true;
    searchBtn.textContent = 'Searching...';

    console.log('[Project Search] Searching for:', query);

    // Call backend search function
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${supabase.supabaseUrl}/functions/v1/admin-search-projects`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query })
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[Project Search] Response error:', response.status, errorData);
      throw new Error(`Search failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('[Project Search] Results:', data.results);

    displayProjectResults(data.results || []);
  } catch (error) {
    console.error('[Project Search] Error:', error);
    showNotification('Search failed - please try again', 'error');
  } finally {
    const searchBtn = document.getElementById('search-projects-btn');
    searchBtn.disabled = false;
    searchBtn.textContent = 'Search';
  }
}

/**
 * Display project search results
 */
function displayProjectResults(projects) {
  const resultsList = document.getElementById('projects-list');
  const searchResults = document.getElementById('projects-results');
  const noResults = document.getElementById('no-projects');
  const resultCount = document.getElementById('projects-result-count');

  // Clear previous results
  if (resultsList) {
    resultsList.innerHTML = '';
  }

  if (projects.length === 0) {
    searchResults.style.display = 'none';
    noResults.style.display = 'block';
    return;
  }

  // Show results
  searchResults.style.display = 'block';
  noResults.style.display = 'none';
  resultCount.textContent = projects.length;

  // Render each project
  projects.forEach(project => {
    const resultHTML = createProjectResultElement(project);
    if (resultsList) {
      resultsList.innerHTML += resultHTML;
    }
  });
}

/**
 * Create project result element HTML
 */
function createProjectResultElement(project) {
  const statusLabels = {
    'open': 'Open',
    'matched': 'Matched',
    'in_progress': 'In Progress',
    'completed': 'Completed',
    'cancelled': 'Cancelled'
  };
  
  const statusLabel = statusLabels[project.status] || project.status;

  // Build meta information
  let meta = [];
  if (project.client_name) meta.push(`Client: ${project.client_name}`);
  if (project.serial) meta.push(`Serial: ${project.serial}`);
  if (project.id) meta.push(`ID: ${project.id}`);

  return `
    <div class="project-result" data-id="${project.id}" data-title="${project.title}" data-status="${project.status}">
      <div class="result-header">
        <div class="result-name">${project.title || 'Untitled Project'}</div>
        <span class="result-badge">${statusLabel}</span>
      </div>
      <div class="result-meta">${meta.join(' • ')}</div>
    </div>
  `;
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeSearch();
    initializeProjectSearch();
  });
} else {
  initializeSearch();
  initializeProjectSearch();
}
