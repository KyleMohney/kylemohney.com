/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: scripts/my-projects.js (CONSOLIDATED v3)                    ║
║  Purpose: Client project management - complete lifecycle            ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

FUNCTIONALITY:
- Load and display all client projects with status tracking
- Full project creation form with all fields 
- Captures: category, subcategories, urgency, travel_preference,
  street, city, state, zipcode, description
- Real-time project rendering with filtering
- Practitioner matching algorithm integration
- Project title inline editing
- All serial field naming: client_serial, practitioner_serial, project_serial
*/

console.log('[My Projects] Script loaded at:', new Date().toISOString());

let supabaseClient;
let authManager;
let currentUser = null;
let currentClientProfile = null;
let projects = [];
let practitioners = [];
let taxonomyData = {};
let selectedSubcategories = [];

/**
 * Open the close project modal - TOP LEVEL FUNCTION
 * Declared here so it's available as soon as the script loads
 */
function openCloseProjectModal(projectId) {
  console.log('[My Projects] openCloseProjectModal called with projectId:', projectId);
  
  const project = projects.find(p => p.id === projectId);
  if (!project) {
    console.error('[My Projects] Project not found:', projectId);
    return;
  }

  // Store the project ID for use when submitting the form
  window.projectToClose = projectId;
  
  // Reset form
  const form = document.getElementById('close-project-form');
  if (form) {
    form.reset();
    console.log('[My Projects] Form reset');
  }
  
  // Hide "other reason" field if shown
  const otherReasonBox = document.getElementById('other-reason-box');
  if (otherReasonBox) {
    otherReasonBox.style.setProperty('display', 'none', 'important');
    console.log('[My Projects] Other reason box hidden');
  }
  
  // Show the modal
  const modal = document.getElementById('close-project-modal');
  console.log('[My Projects] Modal element found:', !!modal);
  if (modal) {
    // CRITICAL: Remove modal--hidden class that might be hiding it
    modal.classList.remove('modal--hidden');
    console.log('[My Projects] Removed modal--hidden class');
    
    // Show modal using display:flex (works with flexbox centering)
    modal.style.display = 'flex';
    console.log('[My Projects] Modal display set to flex');
    console.log('[My Projects] Modal element:', modal);
  } else {
    console.error('[My Projects] Modal element not found!');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Initialize Supabase and Auth
    supabaseClient = window.supabaseClient;
    if (!supabaseClient) {
      console.error('[My Projects] Supabase client not initialized');
      return;
    }

    authManager = window.authManager;
    currentUser = authManager.getCurrentUser();

    if (!currentUser) {
      window.location.href = '/rooted-vitality/dashboard/signup.html';
      return;
    }

    console.log('[My Projects] User authenticated:', currentUser.email);

    // Load client profile
    const { data: clientProfile, error: clientError } = await supabaseClient
      .from('clients')
      .select('id, serial_number, first_name, last_name, open_to_contact')
      .eq('id', currentUser.id)
      .single();

    if (clientError) {
      console.error('[My Projects] Error loading client profile:', clientError);
      return;
    }

    currentClientProfile = clientProfile;
    console.log('[My Projects] Client profile loaded:', currentClientProfile);

    // Load taxonomy for category dropdown
    await loadTaxonomy();

    // Load practitioners for matching reference
    await loadPractitioners();

    // Load existing projects
    await loadProjects();

    // Initialize all handlers
    initializeFormHandlers();
    initializeModalHandlers();
    attachEventListeners();

  } catch (error) {
    console.error('[My Projects] Initialization error:', error);
  }
});

// Reload projects when page becomes visible (e.g., returning from another page)
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible') {
    console.log('[My Projects] Page became visible, reloading projects');
    await loadProjects();
  }
});

// ========================================== 
// TAXONOMY LOADING
// ========================================== 

async function loadTaxonomy() {
  try {
    const { data, error } = await supabaseClient
      .from('holistic_health_taxonomy')
      .select(`
        id,
        category_id,
        name,
        taxonomy_subcategories(id, name)
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    // Build taxonomy object indexed by ID with subcategories as array of names
    taxonomyData = {};
    data.forEach(category => {
      // Extract subcategory names from the nested response
      const subcategoryNames = (category.taxonomy_subcategories || []).map(sub => sub.name);
      taxonomyData[category.id] = {
        id: category.id,
        category_id: category.category_id,  // Store the category_id for FK reference
        name: category.name,
        subcategories: subcategoryNames
      };
    });

    console.log('[My Projects] Taxonomy loaded, categories:', Object.keys(taxonomyData).length);

    // Populate category dropdown
    populateCategoryDropdown();

  } catch (error) {
    console.error('[My Projects] Error loading taxonomy:', error);
  }
}

function populateCategoryDropdown() {
  const select = document.getElementById('project-category');
  if (!select) return;

  // Clear existing options
  select.innerHTML = '<option value="">-- Select a category --</option>';

  // Add categories
  Object.entries(taxonomyData).forEach(([id, category]) => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = category.name;
    select.appendChild(option);
  });

  console.log('[My Projects] Category dropdown populated');
}

// ========================================== 
// PRACTITIONERS LOADING
// ========================================== 

async function loadPractitioners() {
  try {
    const { data, error } = await supabaseClient
      .from('practitioners')
      .select('id, serial_number, legal_business_name')
      .eq('status', 'active');

    if (error) throw error;
    practitioners = data || [];
    console.log('[My Projects] Loaded', practitioners.length, 'practitioners');
  } catch (error) {
    console.error('[My Projects] Error loading practitioners:', error);
  }
}

// ========================================== 
// PROJECT LOADING & RENDERING
// ========================================== 

async function loadProjects() {
  try {
    console.log('[My Projects] loadProjects() called - fetching projects for client_serial:', currentClientProfile.serial_number);
    
    const { data, error } = await supabaseClient
      .from('projects')
      .select('*')
      .eq('client_serial', currentClientProfile.serial_number)
      .order('created_at', { ascending: false });

    if (error) throw error;

    projects = data || [];
    console.log('[My Projects] Loaded', projects.length, 'projects');
    console.log('[My Projects] Projects data:', projects);

    // Load matches for each project
    for (let project of projects) {
      const { data: matches, error: matchError } = await supabaseClient
        .from('project_practitioner_matches')
        .select('id, project_serial, client_serial, practitioner_serial, match_score, match_status')
        .eq('project_serial', project.project_serial);
      
      if (!matchError) {
        project.project_practitioner_matches = matches || [];
      }
    }

    // Render projects
    console.log('[My Projects] About to call renderProjectsGrid() with', projects.length, 'projects');
    renderProjectsGrid();
    updateStats();

  } catch (error) {
    console.error('[My Projects] Error loading projects:', error);
  }
}

/**
 * Render all projects in the grid, separated by open/closed status
 */
function renderProjectsGrid() {
  const container = document.getElementById('projects-container');
  
  if (!container) {
    console.warn('[renderProjectsGrid] Container not found');
    return;
  }

  if (projects.length === 0) {
    container.innerHTML = '<div class="projects-empty"><p>No projects yet. Create your first project to get started!</p></div>';
    return;
  }

  console.log('[renderProjectsGrid] Rendering', projects.length, 'projects');
  
  // Separate open and closed projects
  const TERMINAL_STATUSES = ['hired', 'canceled', 'declined'];
  const openProjects = projects.filter(p => !TERMINAL_STATUSES.includes(p.project_status));
  const closedProjects = projects.filter(p => TERMINAL_STATUSES.includes(p.project_status));

  let html = '';

  // Render open projects section
  if (openProjects.length > 0) {
    html += '<div class="projects-section">';
    html += '<h2 class="projects-section__title">Active Journeys</h2>';
    html += '<div class="projects-list">';
    openProjects.forEach(project => {
      const card = createProjectCard(project);
      html += card.outerHTML;
    });
    html += '</div></div>';
  }

  // Render closed projects section
  if (closedProjects.length > 0) {
    html += '<div class="projects-section projects-section--closed">';
    html += '<h2 class="projects-section__title">Completed Journeys</h2>';
    html += '<div class="projects-list projects-list--closed">';
    closedProjects.forEach(project => {
      const card = createProjectCard(project);
      html += card.outerHTML;
    });
    html += '</div></div>';
  }

  container.innerHTML = html;
  console.log('[renderProjectsGrid] Done. Rendered', openProjects.length, 'open and', closedProjects.length, 'closed projects');
  
  // Attach event listeners to newly rendered elements
  attachProjectCollapseToggle();
  attachProjectTitleEditing();
}

/**
 * Create HTML for a single project card
 * @param {Object} project - Project data from Supabase
 * @returns {HTMLElement} - DOM element for the project card
 */
function createProjectCard(project) {
  const TERMINAL_STATUSES = ['hired', 'canceled', 'declined'];
  
  const createdDate = new Date(project.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const matchedRecords = project.project_practitioner_matches || [];
  
  // Find practitioners from matched records using practitioner_serial
  const practitionersList = matchedRecords
    .map(match => {
      return practitioners.find(p => p.serial_number === match.practitioner_serial);
    })
    .filter(Boolean);

  // Determine display status
  let displayStatus = project.project_status || 'Pending';
  if (matchedRecords.length > 0 && !TERMINAL_STATUSES.includes(project.project_status)) {
    displayStatus = 'Active';
  } else if (project.project_status === 'hired') {
    displayStatus = 'Hired';
  } else if (project.project_status === 'canceled') {
    displayStatus = 'Canceled';
  } else if (project.project_status === 'declined') {
    displayStatus = 'Declined';
  } else {
    displayStatus = 'Pending';
  }

  const statusClass = `project-card__status--${displayStatus.toLowerCase()}`;
  const closedClass = TERMINAL_STATUSES.includes(project.project_status) ? ' project-card--closed' : '';

  // Create the card element
  const card = document.createElement('article');
  card.className = `project-card${closedClass}`;
  
  card.innerHTML = `
    <!-- Card Header -->
    <div class="project-card__header">
      <div class="project-card__title-group">
        <div class="project-card__title-row">
          <button type="button" class="project-card__toggle" data-toggle-card="${project.id}" title="Collapse/Expand project details" aria-label="Toggle project details">▼</button>
          <h3 class="project-card__title" contenteditable="true" data-project-id="${project.id}" spellcheck="false">${escapeHtml(project.custom_name || project.category_name || 'Untitled Project')}</h3>
        </div>
        <span class="project-card__status ${statusClass}">${displayStatus}</span>
      </div>
      <div class="project-card__meta">
        <span class="project-card__date">Created ${createdDate}</span>
      </div>
      <button class="project-card__close-btn" ${TERMINAL_STATUSES.includes(project.project_status) ? 'disabled title="Project is completed"' : 'onclick="openCloseProjectModal(\'' + project.id + '\')" title="Close this wellness journey"'} aria-label="Close project">×</button>
    </div>

    <!-- Card Body -->
    <div class="project-card__body">
      ${project.description ? `<p class="project-card__description">${escapeHtml(project.description)}</p>` : ''}
      
      ${project.category_id ? `
        <div class="project-card__category">
          <span class="category-badge">${escapeHtml(taxonomyData[project.category_id]?.name || 'Other')}</span>
        </div>
      ` : ''}

      <!-- Focus Areas (Subcategories) -->
      ${project.subcategories_selected ? `
        <div class="project-card__subcategories">
          <h4 class="project-card__section-title">Focus Areas</h4>
          <div class="subcategories-list">
            ${project.subcategories_selected.split(',').map(sub => sub.trim()).filter(Boolean).map(name => `<span class="subcategory-badge">${escapeHtml(name)}</span>`).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Urgency & Travel -->
      <div class="project-card__details">
        ${project.urgency ? `<span class="detail-badge urgency-${project.urgency}">${escapeHtml(project.urgency)}</span>` : ''}
        ${project.travel_preference ? `<span class="detail-badge travel">${escapeHtml(project.travel_preference)}</span>` : ''}
      </div>

      <!-- Location -->
      <div class="project-card__location">
        <span class="location-label">Location:</span>
        <span class="location-value">${escapeHtml(project.city || 'N/A')}, ${escapeHtml(project.state || '')}</span>
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
                    ${prac.practice_logo_url ? `<img src="${prac.practice_logo_url}" alt="${prac.legal_business_name}" class="practitioner-badge__avatar">` : '<div class="practitioner-badge__avatar--placeholder"></div>'}
                    <div class="practitioner-badge__info">
                      <div class="practitioner-badge__name">${escapeHtml(prac.legal_business_name)}</div>
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
      <button class="btn btn-primary btn-small" onclick="browseForProject('${project.id}')">Find Practitioners</button>
    </div>
  `;

  return card;
}

// ======================================================
// FORM INITIALIZATION
// ======================================================

function initializeFormHandlers() {
  const form = document.getElementById('create-project-form');
  if (!form) {
    console.warn('[initializeFormHandlers] Form not found');
    return;
  }

  // Category change handler
  const categorySelect = document.getElementById('project-category');
  if (categorySelect) {
    categorySelect.addEventListener('change', (e) => {
      const categoryId = e.target.value;
      updateSubcategoryCheckboxes(categoryId);
    });
  }

  // Subcategory checkboxes
  attachSubcategoryHandlers();
}

function initializeModalHandlers() {
  // Handle create-project-modal
  const createModal = document.getElementById('create-project-modal');
  if (createModal) {
    // Close on overlay click
    const overlay = createModal.querySelector('.modal__overlay');
    if (overlay) {
      overlay.addEventListener('click', () => closeModal('create-project-modal'));
    }

    // Close button
    const closeBtn = createModal.querySelector('.modal__close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => closeModal('create-project-modal'));
    }
  }

  // Handle close-project-modal - NEW SIMPLE VERSION
  const closeProjectModal = document.getElementById('close-project-modal');
  if (closeProjectModal) {
    // Show "other reason" field when "other" radio is selected
    const otherReasonBox = document.getElementById('other-reason-box');
    const radios = closeProjectModal.querySelectorAll('input[name="closure-reason"]');
    
    radios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (otherReasonBox) {
          if (e.target.value === 'other' && e.target.checked) {
            otherReasonBox.style.display = 'block';
          } else {
            otherReasonBox.style.display = 'none';
          }
        }
      });
    });
  }
}

function updateSubcategoryCheckboxes(categoryId) {
  const group = document.getElementById('subcategories-group');
  const container = document.getElementById('subcategories-container');
  
  if (!container || !group) {
    console.warn('[updateSubcategoryCheckboxes] Container or group not found');
    return;
  }

  const category = taxonomyData[categoryId];
  if (!category) {
    container.innerHTML = '';
    group.style.display = 'none';
    return;
  }

  const subcategories = category.subcategories || [];
  console.log('[updateSubcategoryCheckboxes] Category:', category.name, 'Subcategories:', subcategories);
  
  container.innerHTML = subcategories.map(sub => `
    <label class="checkbox-item">
      <input type="checkbox" name="subcategory" value="${sub}">
      <span>${escapeHtml(sub)}</span>
    </label>
  `).join('');

  // Show the subcategories group
  group.style.display = 'block';
  
  attachSubcategoryHandlers();
}

function attachSubcategoryHandlers() {
  const checkboxes = document.querySelectorAll('input[name="subcategory"]');
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const allChecked = Array.from(checkboxes).filter(cb => cb.checked);
      selectedSubcategories = allChecked.map(cb => cb.value);
      console.log('[My Projects] Selected subcategories:', selectedSubcategories);
    });
  });
}

// ========================================== 
// PROJECT CREATION
// ========================================== 

async function submitCreateProject(e) {
  e.preventDefault();

  if (!currentUser || !currentClientProfile) {
    console.error('[submitCreateProject] User or profile not loaded');
    alert('User profile not loaded. Please refresh and try again.');
    return;
  }

  try {
    // Get category name for default title
    const categoryId = document.getElementById('project-category')?.value;
    if (!categoryId) {
      alert('Please select a category');
      return;
    }
    
    const categoryName = taxonomyData[categoryId]?.name || 'Wellness Journey';
    
    console.log('[submitCreateProject] Category selected - ID:', categoryId, 'Name:', categoryName);
    
    // Gather form data - use category_id for FK constraint
    const formData = {
      category_id: taxonomyData[categoryId]?.category_id,  // Use category_id for foreign key
      category_name: categoryName,
      custom_name: categoryName,  // Default title is the category name (stored in custom_name)
      description: document.getElementById('project-description')?.value || '',
      subcategory_name: selectedSubcategories.join(', '),
      urgency: document.querySelector('input[name="urgency"]:checked')?.value,
      travel_preference: document.querySelector('input[name="travel_preference"]:checked')?.value,
      street: document.getElementById('project-street')?.value || '',
      city: document.getElementById('project-city')?.value || '',
      state: document.getElementById('project-state')?.value || '',
      zipcode: document.getElementById('project-zipcode')?.value || '',
      client_serial: currentClientProfile.serial_number,  // Use the serial_number like "C1"
      client_id: currentUser.id,
      client_first_name: currentClientProfile.first_name,
      client_last_name: currentClientProfile.last_name,
      project_status: 'pending',
      start_date: new Date().toISOString().split('T')[0]
    };

    console.log('[submitCreateProject] Creating project with data:', formData);
    console.log('[submitCreateProject] category_id:', formData.category_id);
    console.log('[submitCreateProject] client_id:', formData.client_id, 'client_serial:', formData.client_serial);

    // Insert project
    const { data: projectData, error: projectError } = await supabaseClient
      .from('projects')
      .insert([formData])
      .select();

    if (projectError) {
      console.error('[submitCreateProject] Project insert error:', projectError);
      console.error('[submitCreateProject] Full error details:', JSON.stringify(projectError, null, 2));
      console.error('[submitCreateProject] Category ID that failed:', categoryId);
      console.error('[submitCreateProject] Available categories in taxonomyData:', Object.keys(taxonomyData));
      alert('Error creating project: ' + projectError.message);
      return;
    }

    const createdProject = projectData[0];
    console.log('[submitCreateProject] Project created:', createdProject);

    // Now find matching practitioners using matching algorithm
    const matchRecords = await findMatchingPractitioners(createdProject);
    console.log('[submitCreateProject] Found', matchRecords.length, 'matching practitioners');

    if (matchRecords.length > 0) {
      // Insert match records
      const { error: matchError } = await supabaseClient
        .from('project_practitioner_matches')
        .insert(matchRecords);

      if (matchError) {
        console.error('[submitCreateProject] Error inserting matches:', matchError);
      } else {
        console.log('[submitCreateProject] Inserted', matchRecords.length, 'match records');
      }
    }

    // Reset form and close modal
    document.getElementById('create-project-form').reset();
    selectedSubcategories = [];
    closeModal('create-project-modal');

    // Reload projects
    await loadProjects();
    showNotification('Project created successfully and practitioners matched!', 'success');

  } catch (error) {
    console.error('[submitCreateProject] Error:', error);
    alert('Error: ' + error.message);
  }
}

/**
 * Submit form and navigate to find practitioners page
 */
async function submitCreateProjectAndFindMatches(e) {
  e.preventDefault();

  if (!currentUser || !currentClientProfile) {
    console.error('[submitCreateProjectAndFindMatches] User or profile not loaded');
    alert('User profile not loaded. Please refresh and try again.');
    return;
  }

  try {
    // Get category name for default title
    const categoryId = document.getElementById('project-category')?.value;
    if (!categoryId) {
      alert('Please select a category');
      return;
    }
    
    const categoryName = taxonomyData[categoryId]?.name || 'Wellness Journey';
    
    console.log('[submitCreateProjectAndFindMatches] Category selected - ID:', categoryId, 'Name:', categoryName);
    
    // Gather form data - use category_id for FK constraint
    const formData = {
      category_id: taxonomyData[categoryId]?.category_id,  // Use category_id for foreign key
      category_name: categoryName,
      custom_name: categoryName,  // Default title is the category name (stored in custom_name)
      description: document.getElementById('project-description')?.value || '',
      subcategory_name: selectedSubcategories.join(', '),
      urgency: document.querySelector('input[name="urgency"]:checked')?.value,
      travel_preference: document.querySelector('input[name="travel_preference"]:checked')?.value,
      street: document.getElementById('project-street')?.value || '',
      city: document.getElementById('project-city')?.value || '',
      state: document.getElementById('project-state')?.value || '',
      zipcode: document.getElementById('project-zipcode')?.value || '',
      client_serial: currentClientProfile.serial_number,  // Use the serial_number like "C1"
      client_id: currentUser.id,
      client_first_name: currentClientProfile.first_name,
      client_last_name: currentClientProfile.last_name,
      project_status: 'pending',
      start_date: new Date().toISOString().split('T')[0]
    };

    console.log('[submitCreateProjectAndFindMatches] Creating project with data:', formData);
    console.log('[submitCreateProjectAndFindMatches] category_id:', formData.category_id, 'exists in taxonomy:', !!taxonomyData[formData.category_id]);
    console.log('[submitCreateProjectAndFindMatches] client_id:', formData.client_id, 'client_serial:', formData.client_serial);

    // Insert project
    const { data: projectData, error: projectError } = await supabaseClient
      .from('projects')
      .insert([formData])
      .select();

    if (projectError) {
      console.error('[submitCreateProjectAndFindMatches] Project insert error:', projectError);
      alert('Error creating project: ' + projectError.message);
      return;
    }

    const createdProject = projectData[0];
    console.log('[submitCreateProjectAndFindMatches] Project created:', createdProject);

    // Now find matching practitioners using matching algorithm
    const matchRecords = await findMatchingPractitioners(createdProject);
    console.log('[submitCreateProjectAndFindMatches] Found', matchRecords.length, 'matching practitioners');

    if (matchRecords.length > 0) {
      // Insert match records
      const { error: matchError } = await supabaseClient
        .from('project_practitioner_matches')
        .insert(matchRecords);

      if (matchError) {
        console.error('[submitCreateProjectAndFindMatches] Error inserting matches:', matchError);
      } else {
        console.log('[submitCreateProjectAndFindMatches] Inserted', matchRecords.length, 'match records');
      }
    }

    // Reset form and close modal
    document.getElementById('create-project-form').reset();
    selectedSubcategories = [];
    closeModal('create-project-modal');

    // Reload projects to display the new card
    await loadProjects();
    console.log('[submitCreateProjectAndFindMatches] Projects reloaded');

    // Navigate to find practitioners page with the project ID
    console.log('[submitCreateProjectAndFindMatches] Navigating to find-practitioners.html with project_id:', createdProject.id);
    window.location.href = `./find-practitioners.html?project_id=${createdProject.id}`;

  } catch (error) {
    console.error('[submitCreateProjectAndFindMatches] Error:', error);
    alert('Error: ' + error.message);
  }
}

/**
 * Find matching practitioners using algorithm
 */
async function findMatchingPractitioners(project) {
  try {
    console.log('[findMatchingPractitioners] Starting match for project:', project.id, 'category:', project.category_id);
    console.log('[findMatchingPractitioners] Project details:', {
      id: project.id,
      project_serial: project.project_serial,
      category_name: project.category_name,
      subcategory_name: project.subcategory_name,
      travel_preference: project.travel_preference,
      zipcode: project.zipcode,
      state: project.state
    });
    
    // Call the SQL matching function via RPC
    const { data: matches, error: matchError } = await supabaseClient
      .rpc('match_practitioners', { p_project_id: project.id });

    if (matchError) {
      console.error('[findMatchingPractitioners] RPC error:', matchError);
      console.error('[findMatchingPractitioners] Error details:', matchError);
      throw matchError;
    }

    if (!matches || matches.length === 0) {
      console.warn('[findMatchingPractitioners] No matches found for project:', project.id);
      
      // Query all practitioners to debug why they didn't match
      const { data: allPractitioners, error: debugError } = await supabaseClient
        .from('practitioners')
        .select('id, serial_number, legal_name, service_category_names, in_person_enabled, housecalls_enabled, virtual_enabled, in_person_zipcodes, housecalls_zipcodes, virtual_states, matching_enabled, matching_paused, deleted_at')
        .order('serial_number');
      
      if (!debugError && allPractitioners) {
        console.log('[findMatchingPractitioners] DEBUG: All practitioners in system:');
        allPractitioners.forEach(p => {
          console.log(`  ${p.serial_number}: ${p.legal_name}`, {
            categories: p.service_category_names,
            matching_enabled: p.matching_enabled,
            matching_paused: p.matching_paused,
            deleted: p.deleted_at,
            travel_modes: {
              in_person: p.in_person_enabled,
              housecalls: p.housecalls_enabled,
              virtual: p.virtual_enabled
            },
            service_areas: {
              in_person_zips: p.in_person_zipcodes,
              housecalls_zips: p.housecalls_zipcodes,
              virtual_states: p.virtual_states
            }
          });
        });
      }
      
      return [];
    }

    // Transform RPC results to match insert format
    const matchRecords = matches.map(match => ({
      project_serial: project.project_serial || project.id,
      project_id: project.id,
      client_serial: project.client_serial,
      practitioner_serial: match.serial_number,
      match_score: match.match_score,
      status: 'matched'
    }));

    console.log('[findMatchingPractitioners] Generated', matchRecords.length, 'matches with scores:', matchRecords.map(m => `${m.practitioner_serial}:${m.match_score}`).join(', '));
    return matchRecords;

  } catch (error) {
    console.error('[findMatchingPractitioners] Caught error:', error.message);
    console.error('[findMatchingPractitioners] Full error:', JSON.stringify(error, null, 2));
    return [];
  }
}

// ======================================================
// MODAL MANAGEMENT
// ======================================================

function openModal(modalId) {
  console.log('[openModal] Opening modal:', modalId);
  const modal = document.getElementById(modalId);
  console.log('[openModal] Modal element:', modal ? 'FOUND' : 'NOT FOUND');
  if (modal) {
    console.log('[openModal] Current classes before:', modal.className);
    modal.classList.remove('modal--hidden');
    modal.style.display = 'flex'; // Force display
    console.log('[openModal] Current classes after:', modal.className);
    console.log('[openModal] Modal inline style after:', modal.style.cssText);
    document.body.style.overflow = 'hidden'; // Prevent scrolling behind modal
    console.log('[openModal] Modal should now be visible');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('modal--hidden');
    modal.style.display = 'none'; // Force display
    document.body.style.overflow = 'auto';
  }
}

function showNotification(message, type = 'info') {
  console.log(`[My Projects] Notification [${type}]:`, message);
  // TODO: Toast notification implementation
}

// ======================================================
// EVENT LISTENERS
// ======================================================

function attachEventListeners() {
  // Create project button
  const createBtn = document.getElementById('create-project-btn');
  console.log('[attachEventListeners] Looking for create-project-btn:', createBtn ? 'FOUND' : 'NOT FOUND');
  if (createBtn) {
    console.log('[attachEventListeners] Attaching click handler to create button');
    createBtn.addEventListener('click', () => {
      console.log('[attachEventListeners] CREATE BUTTON CLICKED');
      openModal('create-project-modal');
    });
  }

  // Match Now button - creates project and takes to find practitioners
  const matchNowBtn = document.getElementById('btn-match-now');
  if (matchNowBtn) {
    console.log('[attachEventListeners] Attaching click handler to match-now button');
    matchNowBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      console.log('[attachEventListeners] MATCH NOW BUTTON CLICKED');
      await submitCreateProjectAndFindMatches(e);
    });
  }

  // Create project form submission
  const form = document.getElementById('create-project-form');
  if (form) {
    form.addEventListener('submit', submitCreateProject);
  }

  // Close project form submission
  const closeProjectForm = document.getElementById('close-project-form');
  if (closeProjectForm) {
    closeProjectForm.addEventListener('submit', submitCloseProject);
  }

  // Keyboard: Escape to close modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal('create-project-modal');
      const closeProjectModal = document.getElementById('close-project-modal');
      if (closeProjectModal) {
        closeProjectModal.style.setProperty('display', 'none', 'important');
      }
    }
  });
}

/**
 * Attach collapse/expand toggle functionality to project cards
 */
function attachProjectCollapseToggle() {
  const toggleButtons = document.querySelectorAll('.project-card__toggle');
  
  console.log('[attachProjectCollapseToggle] Found', toggleButtons.length, 'toggle buttons');
  
  toggleButtons.forEach((btn, idx) => {
    // Prevent duplicate listeners
    if (btn.dataset.listenerAttached) return;
    btn.dataset.listenerAttached = 'true';
    
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation(); // Prevent title edit activation
      const cardId = btn.getAttribute('data-toggle-card');
      
      // Navigate up to find the project-card
      let card = btn;
      let depth = 0;
      while (card && card !== document.body && depth < 10) {
        if (card.classList && card.classList.contains('project-card')) {
          break;
        }
        card = card.parentElement;
        depth++;
      }
      
      if (card && card.classList) {
        card.classList.toggle('project-card--collapsed');
        const isCollapsed = card.classList.contains('project-card--collapsed');
        console.log('[My Projects] Toggle clicked - Card:', cardId, 'Collapsed:', isCollapsed, 'Final classes:', card.className);
        
        // Verify the body also got the class
        const body = card.querySelector('.project-card__body');
        if (body) {
          console.log('[My Projects] Body found, current max-height:', window.getComputedStyle(body).maxHeight);
        }
      } else {
        console.warn('[My Projects] Could not find project-card for toggle', cardId, 'Depth searched:', depth);
      }
    });
    
    console.log('[My Projects] Toggle button', idx, 'attached:', btn.getAttribute('data-toggle-card'));
  });
}

/**
 * Attach editing functionality to project title elements
 */
function attachProjectTitleEditing() {
  const editableTitles = document.querySelectorAll('.project-card__title');
  
  editableTitles.forEach(titleEl => {
    // Prevent duplicate listeners
    if (titleEl.dataset.listenerAttached) return;
    titleEl.dataset.listenerAttached = 'true';
    
    // On blur, save the new title
    titleEl.addEventListener('blur', async (e) => {
      const projectId = titleEl.getAttribute('data-project-id');
      const newTitle = titleEl.textContent.trim();
      
      if (!projectId || !newTitle) {
        // Revert if empty
        const project = projects.find(p => p.id === projectId);
        if (project) {
          titleEl.textContent = project.custom_name || project.category_name || 'Untitled Project';
        }
        return;
      }
      
      try {
        const { error } = await supabaseClient
          .from('projects')
          .update({ custom_name: newTitle })
          .eq('id', projectId)
          .eq('client_serial', currentUser.id);
        
        if (error) {
          console.error('[My Projects] Error updating project title:', error);
          showNotification('Failed to save project title', 'error');
          const project = projects.find(p => p.id === projectId);
          if (project) {
            titleEl.textContent = project.custom_name || project.category_name || 'Untitled Project';
          }
        } else {
          const project = projects.find(p => p.id === projectId);
          if (project) {
            project.custom_name = newTitle;
          }
          console.log('[My Projects] Project title updated:', newTitle);
          showNotification('Project title saved', 'success');
        }
      } catch (err) {
        console.error('[My Projects] Exception updating title:', err);
        showNotification('Error saving project title', 'error');
      }
    });
    
    // Enter key to save
    titleEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        titleEl.blur();
      }
    });
  });
}

/**
 * Navigate to browse practitioners for a project
 */
function browseForProject(projectId) {
  window.location.href = `./find-practitioners.html?project_id=${projectId}`;
}

/**
 * Submit close project form
 */
async function submitCloseProject(e) {
  e.preventDefault();

  if (!window.projectToClose) {
    console.error('[My Projects] No project ID to close');
    return;
  }

  const projectId = window.projectToClose;
  
  // Get form data
  const form = document.getElementById('close-project-form');
  const formData = new FormData(form);
  
  const closureReason = formData.get('closure-reason');
  const otherReason = formData.get('other-reason') || null;

  console.log('[My Projects] Closing project:', projectId, 'Reason:', closureReason);

  try {
    // Determine project_status based on closure reason
    // Valid statuses: 'pending', 'matched', 'hired', 'canceled'
    // When closing a project without hiring: use 'canceled'
    // When closing a project after hiring: use 'hired'
    let projectStatus = 'canceled';
    if (closureReason === 'hired') {
      projectStatus = 'hired';
    }
    
    // Build update object - only include fields that exist
    const updateData = {
      project_status: projectStatus,
      updated_at: new Date().toISOString()
    };
    
    // Try to add closure_reason if it exists (it may not be defined or may have constraints)
    if (closureReason) {
      updateData.closure_reason = closureReason;
    }
    
    // Update project in Supabase
    // Find the project to get its serial number for RLS compliance
    const projectToClose = projects.find(p => p.id === projectId);
    if (!projectToClose) {
      console.error('[My Projects] Project not found in local cache');
      alert('Project not found. Please refresh and try again.');
      return;
    }

    const { data, error } = await supabaseClient
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .eq('client_serial', currentClientProfile.serial_number)
      .select();

    if (error) {
      console.error('[My Projects] Error closing project:', error);
      console.error('[My Projects] Error details:', error.message, error.details, error.hint);
      alert('Failed to close project: ' + (error.message || 'Unknown error'));
      return;
    }

    console.log('[My Projects] Project closed successfully:', data);

    // Close modal
    const modal = document.getElementById('close-project-modal');
    if (modal) {
      modal.style.setProperty('display', 'none', 'important');
    }

    // Reload projects to reflect changes
    await loadProjects();

    // Show success message
    showNotification(`Project ${closureReason === 'hired' ? 'marked as hired' : 'closed'} successfully!`, 'success');

  } catch (error) {
    console.error('[My Projects] Unexpected error closing project:', error);
    alert('An unexpected error occurred. Please try again.');
  }
}


function updateStats() {
  const totalProjects = projects.length;
  let totalPractitionersCount = new Set();
  
  projects.forEach(project => {
    (project.project_practitioner_matches || []).forEach(match => {
      totalPractitionersCount.add(match.practitioner_serial);
    });
  });

  const totalEl = document.getElementById('total-projects');
  const practEl = document.getElementById('total-practitioners');
  
  if (totalEl) totalEl.textContent = totalProjects;
  if (practEl) practEl.textContent = totalPractitionersCount.size;
}

/**
 * Utility: Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

console.log('[My Projects] Module loaded and ready');
