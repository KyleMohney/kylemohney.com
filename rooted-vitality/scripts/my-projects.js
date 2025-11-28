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
let projectsRealtimeChannel = null;  // Store channel reference to keep it alive

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
  const otherReasonBox = document.getElementById('other-reason-group');
  if (otherReasonBox) {
    otherReasonBox.style.setProperty('display', 'none', 'important');
    console.log('[My Projects] Other reason group hidden');
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
      .select('id, serial_number, first_name, last_name, open_to_contact, open_to_match')
      .eq('id', currentUser.id)
      .single();

    if (clientError) {
      console.error('[My Projects] Error loading client profile:', clientError);
      return;
    }

    currentClientProfile = clientProfile;
    console.log('[My Projects] Client profile loaded:', currentClientProfile);

    // Set the Open to Match toggle based on saved state
    const openToMatchToggle = document.getElementById('open-to-match-toggle');
    if (openToMatchToggle) {
      openToMatchToggle.checked = clientProfile.open_to_match || false;
      console.log('[My Projects] Open to Match toggle set to:', openToMatchToggle.checked);
    }

    // Load taxonomy for category dropdown
    await loadTaxonomy();

    // Load practitioners for matching reference
    await loadPractitioners();

    // Load existing projects (fresh from database, not cached)
    await loadProjects();

    // Setup realtime listener for project updates
    setupProjectRealtimeListener();

    // If we detect stale data (projects loaded before backfill), reload after a short delay
    // This catches the case where backfill happened while page was open
    setTimeout(async () => {
      console.log('[My Projects] Background refresh to catch any database backfills or updates');
      await loadProjects();
    }, 2000);

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
    
    // Log status breakdown for debugging
    const statusCounts = {};
    projects.forEach(p => {
      statusCounts[p.project_status] = (statusCounts[p.project_status] || 0) + 1;
    });
    console.log('[My Projects] Status breakdown:', statusCounts);
    
    // DETAILED LOG: Show ALL projects with their full status info
    console.log('[My Projects] ========== DETAILED PROJECT LIST ==========');
    projects.forEach(p => {
      console.log(`Project ${p.project_serial}: "${p.custom_name || p.category_name}" | status="${p.project_status}" | hired_practitioner="${p.hired_practitioner_serial}" | matches=${(p.project_practitioner_matches || []).length}`);
    });
    console.log('[My Projects] ==========================================');
    
    console.log('[My Projects] Projects with hired status:', projects.filter(p => p.project_status === 'hired').map(p => ({ serial: p.project_serial, hired_practitioner: p.hired_practitioner_serial })));

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
 * Setup Realtime listener for project status changes
 * Automatically refreshes UI when projects are updated (e.g., when a match is hired)
 */
function setupProjectRealtimeListener() {
  if (!currentClientProfile) {
    console.warn('[My Projects] Client profile not loaded yet');
    return;
  }

  // Avoid duplicate subscriptions
  if (projectsRealtimeChannel) {
    console.log('[My Projects] Realtime channel already exists, unsubscribing first');
    projectsRealtimeChannel.unsubscribe();
  }

  console.log('[My Projects] 🔌 Setting up realtime listener for projects with client_serial:', currentClientProfile.serial_number);

  // Subscribe to project updates for this client
  projectsRealtimeChannel = supabaseClient
    .channel(`projects:${currentClientProfile.serial_number}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'projects',
        filter: `client_serial=eq.${currentClientProfile.serial_number}`
      },
      (payload) => {
        console.log('[My Projects] 🔔 REALTIME UPDATE RECEIVED!');
        console.log('[My Projects] Project ID:', payload.new.id);
        console.log('[My Projects] Project Serial:', payload.new.project_serial);
        console.log('[My Projects] Status change:', payload.old.project_status, '→', payload.new.project_status);
        
        // Find the updated project in our array by ID first
        let updatedProjectIndex = projects.findIndex(p => p.id === payload.new.id);
        
        if (updatedProjectIndex < 0) {
          // Fallback: find by project_serial
          console.log('[My Projects] ⚠️ Project not found by UUID, searching by project_serial...');
          updatedProjectIndex = projects.findIndex(p => p.project_serial === payload.new.project_serial);
        }
        
        if (updatedProjectIndex >= 0) {
          console.log('[My Projects] ✓ Found project at index:', updatedProjectIndex);
          
          // Update the project data
          projects[updatedProjectIndex] = {
            ...projects[updatedProjectIndex],
            ...payload.new
          };
          console.log('[My Projects] ✓ Local project updated - NEW STATUS:', projects[updatedProjectIndex].project_status);
          
          // Re-render the grid to show updated status
          console.log('[My Projects] 🔄 Re-rendering grid with updated status...');
          renderProjectsGrid();
          updateStats();
          console.log('[My Projects] ✅ GRID RE-RENDERED WITH NEW STATUS');
        } else {
          console.error('[My Projects] ❌ Project not found in array! ID:', payload.new.id, 'Serial:', payload.new.project_serial);
          console.error('[My Projects] Current projects array:', projects.map(p => ({ id: p.id, serial: p.project_serial })));
        }
      }
    )
    .subscribe((status) => {
      console.log('[My Projects] Realtime subscription status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('[My Projects] ✅✅✅ REALTIME SUBSCRIBED - READY TO RECEIVE UPDATES ✅✅✅');
      } else if (status === 'CLOSED') {
        console.error('[My Projects] ❌ Realtime subscription CLOSED - will not receive updates!');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('[My Projects] ❌ Realtime channel error!');
      }
    });

  // ALSO listen for broadcast updates from My Matches page (project-status-updates channel)
  // This is for IMMEDIATE notification when client selects "Hired" on a match
  console.log('[My Projects] 📢 Setting up broadcast listener for project-status-updates...');
  const broadcastChannel = supabaseClient.channel('project-status-updates');
  
  broadcastChannel.on('broadcast', { event: 'project_status_changed' }, (payload) => {
    console.log('[My Projects] 📨 BROADCAST RECEIVED from My Matches page!');
    console.log('[My Projects] Broadcast payload:', payload.payload);
    
    const { project_id, project_serial, new_status, hired_practitioner_serial, timestamp } = payload.payload;
    
    console.log(`[My Projects] Project status change: ${project_serial || project_id} → ${new_status}`);
    
    // Find project in array
    let projectIndex = projects.findIndex(p => 
      p.id === project_id || p.project_serial === project_serial
    );
    
    if (projectIndex >= 0) {
      console.log('[My Projects] ✓ Found broadcast-updated project at index:', projectIndex);
      
      // Update the project with new status
      projects[projectIndex].project_status = new_status;
      if (hired_practitioner_serial) {
        projects[projectIndex].hired_practitioner_serial = hired_practitioner_serial;
      }
      projects[projectIndex].updated_at = timestamp || new Date().toISOString();
      
      console.log('[My Projects] ✓ Project updated with new status:', new_status);
      
      // Re-render immediately
      console.log('[My Projects] 🔄 Re-rendering grid with broadcast update...');
      renderProjectsGrid();
      updateStats();
      console.log('[My Projects] ✅ GRID RE-RENDERED WITH BROADCAST UPDATE');
    } else {
      console.warn('[My Projects] ⚠️ Project not found for broadcast update:', project_id, project_serial);
    }
  }).subscribe((status) => {
    console.log('[My Projects] Broadcast subscription status:', status);
    if (status === 'SUBSCRIBED') {
      console.log('[My Projects] ✅ BROADCAST LISTENER READY - will update immediately when client marks match as Hired');
    }
  });
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
  const TERMINAL_STATUSES = ['hired', 'canceled'];
  const openProjects = projects.filter(p => !TERMINAL_STATUSES.includes(p.project_status));
  const closedProjects = projects.filter(p => TERMINAL_STATUSES.includes(p.project_status));

  let html = '';

  // Render open projects section (always shown, even if empty)
  html += '<div class="projects-section">';
  html += '<h2 class="projects-section__title">Active Care Requests</h2>';
  html += '<div class="projects-list">';
  if (openProjects.length > 0) {
    openProjects.forEach(project => {
      const card = createProjectCard(project);
      html += card.outerHTML;
    });
  }
  html += '</div></div>';

  // Render closed projects section (always shown, even if empty)
  html += '<div class="projects-section projects-section--closed">';
  html += '<h2 class="projects-section__title">Closed Care Requests</h2>';
  html += '<div class="projects-list projects-list--closed">';
  if (closedProjects.length > 0) {
    closedProjects.forEach(project => {
      const card = createProjectCard(project);
      html += card.outerHTML;
    });
  }
  html += '</div></div>';

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
  const TERMINAL_STATUSES = ['hired', 'canceled'];
  
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
  // CRITICAL: Check terminal statuses FIRST, before checking for active matches
  // A hired/canceled project should show that status, NOT "In Progress"
  let displayStatus = project.project_status || 'Pending';
  
  if (project.project_status === 'hired') {
    displayStatus = 'Hired';
  } else if (project.project_status === 'canceled') {
    displayStatus = 'Canceled';
  } else if (matchedRecords.length > 0) {
    // Only show "In Progress" if project is NOT in a terminal state AND has matches
    displayStatus = 'In Progress';
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

  // Handle close-project-modal - Show "other reason" field when "other" is selected
  const closeProjectModal = document.getElementById('close-project-modal');
  if (closeProjectModal) {
    const otherReasonGroup = document.getElementById('other-reason-group');
    const radios = closeProjectModal.querySelectorAll('input[name="closure-reason"]');
    
    radios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (otherReasonGroup) {
          if (e.target.value === 'other' && e.target.checked) {
            otherReasonGroup.style.display = 'block';
          } else {
            otherReasonGroup.style.display = 'none';
          }
        }
      });
    });

    // Close modal handlers
    const closeBtn = closeProjectModal.querySelector('.modal__close');
    const cancelBtn = closeProjectModal.querySelector('.modal-cancel');
    const overlay = closeProjectModal.querySelector('.modal__overlay');
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        closeProjectModal.classList.add('modal--hidden');
      });
    }
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        closeProjectModal.classList.add('modal--hidden');
      });
    }
    
    if (overlay) {
      overlay.addEventListener('click', () => {
        closeProjectModal.classList.add('modal--hidden');
      });
    }
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

    // ========== STEP 1: CREATE/UPDATE WELLNESS PROFILE ==========
    // Ensure a client_profiles entry exists with data from this project
    await ensureWellnessProfileFromProject(currentUser.id, currentClientProfile.serial_number, formData);

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

    // ========== STEP 1: CREATE/UPDATE WELLNESS PROFILE ==========
    // Ensure a client_profiles entry exists with data from this project
    await ensureWellnessProfileFromProject(currentUser.id, currentClientProfile.serial_number, formData);

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
// WELLNESS PROFILE CREATION
// ======================================================

/**
 * Ensure a wellness profile exists in client_profiles table
 * Creates or updates based on project information from Step 5
 * Maps project form data to wellness profile fields
 */
async function ensureWellnessProfileFromProject(userId, clientSerial, projectFormData) {
  try {
    console.log('[ensureWellnessProfileFromProject] Creating/updating wellness profile for user:', userId);
    console.log('[ensureWellnessProfileFromProject] Project form data:', projectFormData);

    // Check if wellness profile already exists
    const { data: existingProfile, error: checkError } = await supabaseClient
      .from('client_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) {
      console.warn('[ensureWellnessProfileFromProject] Error checking for existing profile:', checkError);
      return false;
    }

    // Map project form fields to wellness profile fields
    // Using project data to populate main_wellness_goal, duration_of_issue, etc.
    const wellnessData = {
      user_id: userId,
      serial_number: clientSerial,
      main_wellness_goal: projectFormData.description || '',  // Description becomes the main goal
      duration_of_issue: projectFormData.urgency || 'interested',  // Urgency maps to duration
      updated_at: new Date().toISOString()
      // Other fields remain empty/null unless filled on My Wellness page
    };

    if (existingProfile) {
      // Update existing profile
      console.log('[ensureWellnessProfileFromProject] Updating existing wellness profile');
      const { data: updateResult, error: updateError } = await supabaseClient
        .from('client_profiles')
        .update(wellnessData)
        .eq('user_id', userId)
        .select();

      if (updateError) {
        console.error('[ensureWellnessProfileFromProject] Error updating wellness profile:', updateError);
        return false;
      }

      console.log('[ensureWellnessProfileFromProject] ✓ Wellness profile updated successfully');
      return true;
    } else {
      // Create new profile
      console.log('[ensureWellnessProfileFromProject] Creating new wellness profile');
      const { data: insertResult, error: insertError } = await supabaseClient
        .from('client_profiles')
        .insert([wellnessData])
        .select();

      if (insertError) {
        console.error('[ensureWellnessProfileFromProject] Error creating wellness profile:', insertError);
        // Don't throw - let project creation continue even if wellness profile fails
        return false;
      }

      console.log('[ensureWellnessProfileFromProject] ✓ Wellness profile created successfully');
      return true;
    }
  } catch (error) {
    console.error('[ensureWellnessProfileFromProject] Exception:', error);
    // Don't throw - let project creation continue
    return false;
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
  // Open to Match Toggle
  const openToMatchToggle = document.getElementById('open-to-match-toggle');
  if (openToMatchToggle) {
    console.log('[attachEventListeners] Open to Match toggle found, attaching handler');
    openToMatchToggle.addEventListener('change', async (e) => {
      await handleOpenToMatchToggle(e.target.checked);
    });
  }

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
 * When project is canceled: sets project_status='canceled' AND cascades to set all matches to 'not-hired'
 * When project is hired: sets project_status='hired' and hired_practitioner_serial (matches handled by My Matches page)
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
    // Valid statuses: 'pending', 'in-progress', 'hired', 'canceled'
    // When closing a project without hiring: use 'canceled'
    // When closing a project after hiring: use 'hired'
    let projectStatus = 'canceled';
    if (closureReason === 'hired') {
      projectStatus = 'hired';
    }
    
    // Build update object - only include fields that exist
    const updateData = {
      project_status: projectStatus,
      updated_at: new Date().toISOString(),
      closed_date: new Date().toISOString().split('T')[0]  // Capture today's date (YYYY-MM-DD format)
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

    // WORKFLOW: When client cancels project, set ALL associated matches to 'not-hired'
    // This prevents orphaned matches and closes all connections when project is canceled
    if (projectStatus === 'canceled') {
      console.log('[My Projects] Project canceled - updating all matches to not-hired');
      
      // Get all matches for this project
      const projectMatches = projectToClose.project_practitioner_matches || [];
      console.log(`[My Projects] Found ${projectMatches.length} matches to update`);
      
      if (projectMatches.length > 0) {
        // Update all matches to 'not-hired'
        const matchIds = projectMatches.map(m => m.id);
        console.log('[My Projects] Match IDs to update:', matchIds);
        
        const { data: matchUpdateData, error: matchError } = await supabaseClient
          .from('project_practitioner_matches')
          .update({ status: 'not-hired', updated_at: new Date().toISOString() })
          .in('id', matchIds)
          .select();
        
        if (matchError) {
          console.error('[My Projects] Error updating matches:', matchError);
          console.error('[My Projects] Error details:', matchError.message, matchError.details, matchError.hint);
          // Don't block project closure if match update fails - project is already closed
        } else {
          console.log('[My Projects] Successfully updated all matches to not-hired:', matchUpdateData.length, 'matches');
        }
      }
    }

    // Close modal
    const modal = document.getElementById('close-project-modal');
    if (modal) {
      modal.style.setProperty('display', 'none', 'important');
    }

    // Update the local projects array with the new status (instead of reloading everything)
    // This allows realtime events from the inbox to work properly
    const projectIndex = projects.findIndex(p => p.id === projectId);
    if (projectIndex >= 0 && data && data[0]) {
      console.log('[My Projects] Updating local project array with closed status');
      projects[projectIndex] = {
        ...projects[projectIndex],
        ...data[0]
      };
      console.log('[My Projects] Local project updated - status:', projects[projectIndex].project_status);
      renderProjectsGrid();
      updateStats();
      console.log('[My Projects] Grid re-rendered with updated status');
    } else {
      console.warn('[My Projects] Could not update local array, falling back to full reload');
      await loadProjects();
    }

    // Show success message with custom modal
    const hiredMessage = closureReason === 'hired' 
      ? 'Congratulations! You\'ve successfully hired this practitioner.' 
      : 'Your wellness journey has been closed.';
    
    if (window.showSuccessModal) {
      window.showSuccessModal(hiredMessage);
    } else {
      showNotification(hiredMessage, 'success');
    }

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
 * Handle Open to Match Toggle - Updates opportunities table for pending projects
 */
async function handleOpenToMatchToggle(isEnabled) {
  try {
    console.log('[My Projects] Open to Match toggle:', isEnabled ? 'ENABLED' : 'DISABLED');

    // Get all pending projects for this client
    const pendingProjects = projects.filter(p => p.project_status === 'pending');
    
    if (pendingProjects.length === 0) {
      console.log('[My Projects] No pending projects found');
      alert('No pending wellness journeys to update.');
      return;
    }

    console.log('[My Projects] Found', pendingProjects.length, 'pending projects');

    // Prepare opportunities updates - get project IDs
    const projectIds = pendingProjects.map(p => p.id);
    
    // First, get or create opportunities for these projects
    const { data: existingOpportunities, error: fetchError } = await supabaseClient
      .from('opportunities')
      .select('*')
      .eq('client_id', currentUser.id)
      .in('project_id', projectIds);

    if (fetchError) throw fetchError;

    console.log('[My Projects] Found', existingOpportunities?.length || 0, 'existing opportunities');

    // Update or create opportunities with open_to_match status
    const updates = [];
    
    // Update existing opportunities
    if (existingOpportunities && existingOpportunities.length > 0) {
      for (const opportunity of existingOpportunities) {
        updates.push(
          supabaseClient
            .from('opportunities')
            .update({ status: isEnabled ? 'open_to_match' : 'closed' })
            .eq('id', opportunity.id)
        );
      }
    }

    // Create new opportunities for projects without one
    const opportunityProjectIds = new Set(existingOpportunities?.map(o => o.project_id) || []);
    const newOpportunities = pendingProjects
      .filter(p => !opportunityProjectIds.has(p.id))
      .map(p => ({
        client_id: currentUser.id,
        project_id: p.id,
        service_type: p.category_name || 'General',
        description: p.description || p.custom_name,
        status: isEnabled ? 'open_to_match' : 'closed',
        serial_number: `OPP-${currentUser.id.substring(0, 8)}-${Date.now()}`
      }));

    if (newOpportunities.length > 0) {
      updates.push(
        supabaseClient
          .from('opportunities')
          .insert(newOpportunities)
      );
    }

    // Also update the clients table to track this state
    updates.push(
      supabaseClient
        .from('clients')
        .update({ 
          open_to_match: isEnabled,
          open_to_match_updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id)
    );

    // Execute all updates
    await Promise.all(updates);

    console.log('[My Projects] Opportunities and client state updated successfully');
    
    // Show elegant modal instead of alert
    showOpenToMatchModal(isEnabled, pendingProjects.length);

  } catch (error) {
    console.error('[My Projects] Error handling Open to Match toggle:', error);
    
    // Show error modal
    const modal = document.getElementById('open-to-match-modal');
    if (modal) {
      document.getElementById('otm-title').textContent = 'Unable to Update';
      document.getElementById('otm-message').textContent = 'Something went wrong';
      document.getElementById('otm-details').textContent = 'Failed to update wellness journey status. Please try again.';
      modal.classList.remove('modal--hidden');
      modal.style.display = 'flex';
    } else {
      alert('Failed to update wellness journey status. Please try again.');
    }
    
    // Reset toggle on error
    const toggle = document.getElementById('open-to-match-toggle');
    if (toggle) {
      toggle.checked = !toggle.checked;
    }
  }
}

/**
 * Show elegant modal for Open to Match status
 */
function showOpenToMatchModal(isEnabled, journeyCount) {
  const modal = document.getElementById('open-to-match-modal');
  if (!modal) {
    console.error('[My Projects] Modal not found');
    return;
  }

  const titleEl = document.getElementById('otm-title');
  const messageEl = document.getElementById('otm-message');
  const detailsEl = document.getElementById('otm-details');

  if (isEnabled) {
    titleEl.textContent = 'Journey Open to Matches';
    messageEl.textContent = 'Your wellness journey is now visible to qualified practitioners.';
    detailsEl.innerHTML = `
      <strong>${journeyCount} journey${journeyCount > 1 ? 's' : ''} is now open to matches.</strong><br><br>
      Practitioners who can help with your wellness goals will be able to see and respond to your journey. You can turn this off anytime from your wellness dashboard.
    `;
  } else {
    titleEl.textContent = 'Journey Closed to Matches';
    messageEl.textContent = 'Your wellness journey is no longer visible to practitioners.';
    detailsEl.innerHTML = `
      <strong>${journeyCount} journey${journeyCount > 1 ? 's' : ''} is now closed to matches.</strong><br><br>
      When you're ready to receive practitioner connections again, you can enable this setting anytime.
    `;
  }

  // Show modal
  modal.classList.remove('modal--hidden');
  modal.style.display = 'flex';
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
























































