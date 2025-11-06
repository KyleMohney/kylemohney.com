/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: scripts/my-projects.js                                      ║
║  Purpose: Client project management - load, render, create projects║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

TABLE OF CONTENTS
  1. INITIALIZATION & AUTH CHECK
  2. DATA LOADING
  3. PROJECT RENDERING
  4. PROJECT CREATION
  5. MODAL MANAGEMENT
  6. EVENT LISTENERS
*/

console.log('[My Projects] Initializing...');

// ======================================================
// 1. INITIALIZATION & AUTH CHECK
// ======================================================

let currentUser = null;
let projects = [];
let practitioners = [];

/**
 * Initialize the page - check auth and load data
 */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Check authentication
    const userData = window.authManager.getCurrentUser();

    if (!userData) {
      console.warn('[My Projects] Not authenticated, redirecting to login');
      window.location.href = '../index.html';
      return;
    }

    currentUser = userData;
    console.log('[My Projects] User authenticated:', currentUser.email);

    // Load projects
    await loadProjects();
    renderProjectsGrid();
    attachEventListeners();

  } catch (error) {
    console.error('[My Projects] Initialization error:', error);
  }
});

// ======================================================
// 2. DATA LOADING
// ======================================================

/**
 * Load all projects for the current user from Supabase
 */
async function loadProjects() {
  try {
    const { data, error } = await window.supabase
      .from('projects')
      .select('*, project_practitioners(practitioner_id)')
      .eq('client_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    projects = data || [];
    console.log('[My Projects] Loaded', projects.length, 'projects');
    updateStats();
  } catch (error) {
    console.error('[My Projects] Error loading projects:', error);
  }
}

/**
 * Load practitioners data for reference
 */
async function loadPractitioners() {
  try {
    const { data, error } = await window.supabase
      .from('practitioners')
      .select('id, first_name, last_name, specialty, avatar_url')
      .eq('status', 'active');

    if (error) throw error;
    practitioners = data || [];
    console.log('[My Projects] Loaded', practitioners.length, 'practitioners');
  } catch (error) {
    console.error('[My Projects] Error loading practitioners:', error);
  }
}

// ======================================================
// 3. PROJECT RENDERING
// ======================================================

/**
 * Render all projects in the grid
 */
function renderProjectsGrid() {
  const container = document.getElementById('projects-container');
  
  if (projects.length === 0) {
    container.innerHTML = '<div class="projects-empty"><p>No projects yet. Create your first project to get started!</p></div>';
    return;
  }

  container.innerHTML = projects.map(project => createProjectCard(project)).join('');
}

/**
 * Create HTML for a single project card
 * @param {Object} project - Project data from Supabase
 * @returns {string} - HTML for the project card
 */
function createProjectCard(project) {
  const createdDate = new Date(project.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const matchedPractitioners = project.project_practitioners || [];
  const practitionersList = matchedPractitioners
    .map(pp => practitioners.find(p => p.id === pp.practitioner_id))
    .filter(Boolean);

  const statusClass = `project-card__status--${project.status || 'active'}`;
  const statusLabel = (project.status || 'active').charAt(0).toUpperCase() + (project.status || 'active').slice(1);

  return `
    <article class="project-card">
      <!-- Card Header -->
      <div class="project-card__header">
        <div class="project-card__title-group">
          <h3 class="project-card__title">${escapeHtml(project.name)}</h3>
          <span class="project-card__status ${statusClass}">${statusLabel}</span>
        </div>
        <div class="project-card__meta">
          <span class="project-card__date">Created ${createdDate}</span>
        </div>
      </div>

      <!-- Card Body -->
      <div class="project-card__body">
        ${project.description ? `<p class="project-card__description">${escapeHtml(project.description)}</p>` : ''}
        
        <div class="project-card__category">
          <span class="category-badge">${formatCategory(project.category)}</span>
        </div>

        <!-- Practitioners Section -->
        <div class="project-card__practitioners">
          <h4 class="project-card__section-title">Matched Practitioners</h4>
          ${
            practitionersList.length > 0
              ? `
                <div class="practitioners-list">
                  ${practitionersList.map(prac => `
                    <div class="practitioner-badge">
                      ${prac.avatar_url ? `<img src="${prac.avatar_url}" alt="${prac.first_name}" class="practitioner-badge__avatar">` : '<div class="practitioner-badge__avatar--placeholder"></div>'}
                      <div class="practitioner-badge__info">
                        <div class="practitioner-badge__name">${escapeHtml(prac.first_name)} ${escapeHtml(prac.last_name)}</div>
                        <div class="practitioner-badge__specialty">${escapeHtml(prac.specialty)}</div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              `
              : '<p class="practitioners-empty">No practitioners matched yet. Browse and connect with practitioners.</p>'
          }
        </div>
      </div>

      <!-- Card Footer / Actions -->
      <div class="project-card__footer">
        <a href="./project-detail.html?id=${project.id}" class="btn btn-secondary btn-small">View Details</a>
        <button class="btn btn-primary btn-small" onclick="browseForProject('${project.id}')">Find Practitioners</button>
      </div>
    </article>
  `;
}

// ======================================================
// 4. PROJECT CREATION
// ======================================================

/**
 * Create a new project and save to Supabase
 * @param {Object} formData - Form data from the create modal
 */
async function createProject(formData) {
  try {
    const { data, error } = await window.supabase
      .from('projects')
      .insert([
        {
          client_id: currentUser.id,
          name: formData.name,
          description: formData.description,
          category: formData.category,
          status: 'active',
          start_date: formData.start_date,
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) throw error;

    console.log('[My Projects] Project created:', data[0]);
    closeModal('create-project-modal');
    
    // Reset form
    document.getElementById('create-project-form').reset();
    
    // Reload projects
    await loadProjects();
    renderProjectsGrid();

    // Show success message
    showNotification('Project created successfully!', 'success');

  } catch (error) {
    console.error('[My Projects] Error creating project:', error);
    showNotification('Failed to create project. Please try again.', 'error');
  }
}

// ======================================================
// 5. MODAL MANAGEMENT
// ======================================================

/**
 * Open modal by ID
 */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('modal--hidden');
  }
}

/**
 * Close modal by ID
 */
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('modal--hidden');
  }
}

/**
 * Show notification to user
 */
function showNotification(message, type = 'info') {
  console.log(`[My Projects] Notification [${type}]:`, message);
  // TODO: Implement toast notification component
}

// ======================================================
// 6. EVENT LISTENERS
// ======================================================

/**
 * Attach all event listeners
 */
function attachEventListeners() {
  // Create project button
  const createBtn = document.getElementById('create-project-btn');
  if (createBtn) {
    createBtn.addEventListener('click', () => openModal('create-project-modal'));
  }

  // Modal close button
  const closeBtn = document.querySelector('.modal__close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeModal('create-project-modal'));
  }

  // Modal cancel button
  const cancelBtn = document.querySelector('.modal-cancel');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => closeModal('create-project-modal'));
  }

  // Modal overlay click to close
  const modal = document.getElementById('create-project-modal');
  if (modal) {
    const overlay = modal.querySelector('.modal__overlay');
    if (overlay) {
      overlay.addEventListener('click', () => closeModal('create-project-modal'));
    }
  }

  // Form submission
  const form = document.getElementById('create-project-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = {
        name: document.getElementById('project-name').value,
        description: document.getElementById('project-description').value,
        category: document.getElementById('project-category').value,
        start_date: document.getElementById('project-start-date').value
      };
      await createProject(formData);
    });
  }

  // Filter by status
  const filterSelect = document.getElementById('filter-status');
  if (filterSelect) {
    filterSelect.addEventListener('change', (e) => filterProjectsByStatus(e.target.value));
  }
}

/**
 * Filter projects by status
 */
function filterProjectsByStatus(status) {
  if (!status) {
    renderProjectsGrid();
    return;
  }
  
  const filtered = projects.filter(p => p.status === status);
  const container = document.getElementById('projects-container');
  
  if (filtered.length === 0) {
    container.innerHTML = '<div class="projects-empty"><p>No projects with this status.</p></div>';
    return;
  }
  
  container.innerHTML = filtered.map(p => createProjectCard(p)).join('');
}

/**
 * Update statistics display
 */
function updateStats() {
  const totalProjects = projects.length;
  let totalPractitionersCount = new Set();
  
  projects.forEach(project => {
    (project.project_practitioners || []).forEach(pp => {
      totalPractitionersCount.add(pp.practitioner_id);
    });
  });

  document.getElementById('total-projects').textContent = totalProjects;
  document.getElementById('total-practitioners').textContent = totalPractitionersCount.size;
}

/**
 * Navigate to browse practitioners for a project
 */
function browseForProject(projectId) {
  window.location.href = `./project-practitioners.html?project_id=${projectId}`;
}

/**
 * Utility: Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Utility: Format category name for display
 */
function formatCategory(category) {
  const categoryMap = {
    'nutrition': 'Nutrition & Diet',
    'fitness': 'Fitness & Movement',
    'mental-health': 'Mental Health & Wellness',
    'chronic-care': 'Chronic Care Management',
    'preventive': 'Preventive Health',
    'recovery': 'Recovery & Rehabilitation',
    'other': 'Other'
  };
  return categoryMap[category] || category;
}

console.log('[My Projects] Initialized');
