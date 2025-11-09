/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: scripts/my-projects-v2.js                                    ║
║  Purpose: Client project management with multi-step form            ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

FUNCTIONALITY:
- Load and display client's projects with serial numbers
- Multi-step project creation form (5 steps)
- Dynamic taxonomy loading based on category selection
- Create project & save to Supabase with serial numbers
- Match Now redirect to directory page
- Practitioner matching badge system
*/

let supabaseClient;
let authManager;
let currentUser = null;
let currentPage = 1;
const totalPages = 3;
let taxonomyData = {};
let selectedConcerns = [];

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Get Supabase client from global config
    supabaseClient = window.supabaseClient;
    if (!supabaseClient) {
      console.error('Supabase client not initialized');
      return;
    }

    // Get auth manager
    authManager = window.authManager;
    currentUser = authManager.getCurrentUser();

    if (!currentUser) {
      window.location.href = '/rooted-vitality/dashboard/signup.html';
      return;
    }

    // Check if user has a client profile (practitioners in client view need client record)
    const { data: clientProfile, error: clientError } = await supabaseClient
      .from('clients')
      .select('serial_number, open_to_contact')
      .eq('id', currentUser.id)
      .single();

    if (clientError || !clientProfile) {
      console.error('[My Projects] No client profile found. User must create client profile first.');
      showNotification('Please complete your client profile before creating projects', 'error');
      // Optionally redirect to profile setup
      return;
    }

    console.log('[My Projects] Client serial number:', clientProfile.serial_number);

    // Load taxonomy data
    await loadTaxonomy();
    
    // Load user's projects
    await loadProjects();

    // Initialize form handlers
    initFormHandlers();
    initModalHandlers();
    
    // Initialize open to contact toggle
    initOpenToContactToggle();

    // Refresh projects when page gains focus (in case changes were made on My Matches page)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        console.log('[My Projects] Page became visible, refreshing projects...');
        loadProjects();
      }
    });

  } catch (error) {
    console.error('Error initializing projects page:', error);
  }
});

// ========================================== 
// OPEN TO CONTACT TOGGLE
// ========================================== 

async function initOpenToContactToggle() {
  const toggle = document.getElementById('open-to-contact-toggle');
  if (!toggle) return;

  // Load current setting from client profile
  const { data: clientProfile } = await supabaseClient
    .from('clients')
    .select('open_to_contact')
    .eq('id', currentUser.id)
    .single();

  if (clientProfile) {
    toggle.checked = clientProfile.open_to_contact !== false;
  }

  // Handle toggle changes
  toggle.addEventListener('change', async (e) => {
    const isEnabled = e.target.checked;
    
    try {
      const { error } = await supabaseClient
        .from('clients')
        .update({ 
          open_to_contact: isEnabled,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id);

      if (error) {
        console.error('[Open to Contact] Error updating:', error);
        showNotification('Failed to update setting', 'error');
        toggle.checked = !isEnabled; // Revert
        return;
      }

      const message = isEnabled 
        ? 'You are now open to practitioner matches' 
        : 'You will not receive new match requests';
      showNotification(message, 'success');
      
    } catch (error) {
      console.error('[Open to Contact] Exception:', error);
      showNotification('Error updating setting', 'error');
      toggle.checked = !isEnabled; // Revert
    }
  });
}

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
        icon,
        taxonomy_subcategories(id, name)
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    // Build taxonomy object
    data.forEach(category => {
      taxonomyData[category.category_id] = {
        id: category.id,
        name: category.name,
        icon: category.icon,
        subcategories: category.taxonomy_subcategories || []
      };
    });

    // Populate category dropdown
    populateCategoryDropdown(data);

  } catch (error) {
    console.error('Error loading taxonomy:', error);
  }
}

function populateCategoryDropdown(categories) {
  const select = document.getElementById('project-category');
  
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.category_id;
    option.textContent = category.name;
    select.appendChild(option);
  });

  // Add change listener
  select.addEventListener('change', (e) => {
    selectedConcerns = [];
    if (e.target.value) {
      document.getElementById('concerns-section').style.display = 'block';
      populateSubcategories(e.target.value);
    } else {
      document.getElementById('concerns-section').style.display = 'none';
    }
  });
}

function populateSubcategories(categoryId) {
  const container = document.getElementById('subcategories-container');
  container.innerHTML = '';
  
  if (!categoryId || !taxonomyData[categoryId]) return;

  const subcategories = taxonomyData[categoryId].subcategories;
  
  subcategories.forEach(sub => {
    const label = document.createElement('label');
    label.className = 'checkbox-label';
    label.innerHTML = `
      <input 
        type="checkbox" 
        value="${sub.id}" 
        data-name="${sub.name}"
        class="concern-checkbox"
      >
      <span>${sub.name}</span>
    `;
    container.appendChild(label);

    // Add change listener
    label.querySelector('input').addEventListener('change', (e) => {
      if (e.target.checked) {
        selectedConcerns.push({
          id: sub.id,
          name: sub.name
        });
      } else {
        selectedConcerns = selectedConcerns.filter(c => c.id !== sub.id);
      }
    });
  });
}

// ========================================== 
// FORM PAGE NAVIGATION
// ========================================== 

function initFormHandlers() {
  const form = document.getElementById('create-project-form');
  const categorySelect = document.getElementById('project-category');
  const descriptionTextarea = document.getElementById('project-description');

  // Character counter
  if (descriptionTextarea) {
    descriptionTextarea.addEventListener('input', (e) => {
      const count = e.target.value.length;
      document.getElementById('char-count').textContent = `${count} / 1000 characters`;
    });
  }

  // Page navigation
  document.getElementById('btn-next-page').addEventListener('click', () => goToPage(currentPage + 1));
  document.getElementById('btn-prev-page').addEventListener('click', () => goToPage(currentPage - 1));

  // Action buttons on page 3
  const createBtn = document.getElementById('btn-create-project');
  const matchBtn = document.getElementById('btn-match-now');

  console.log('[initFormHandlers] Create button:', createBtn ? 'FOUND' : 'NOT FOUND');
  console.log('[initFormHandlers] Match button:', matchBtn ? 'FOUND' : 'NOT FOUND');

  if (createBtn) {
    console.log('[initFormHandlers] Adding click handler to "Create Project" button');
    createBtn.addEventListener('click', async (e) => {
      console.log('[initFormHandlers] "Create Project" CLICKED');
      console.log('[initFormHandlers] Event:', e);
      e.preventDefault();
      e.stopPropagation();
      await createProject(false);
    });
  }

  if (matchBtn) {
    console.log('[initFormHandlers] Adding click handler to "Match Now" button');
    matchBtn.addEventListener('click', async (e) => {
      console.log('[initFormHandlers] "Match Now" CLICKED');
      console.log('[initFormHandlers] Event:', e);
      e.preventDefault();
      e.stopPropagation();
      await createProject(true);
    });
  }
}

function goToPage(page) {
  if (page < 1 || page > totalPages) return;

  // Validate current page before moving forward
  if (page > currentPage && !validatePage(currentPage)) {
    return;
  }

  currentPage = page;
  updatePageDisplay();
}

function validatePage(page) {
  switch(page) {
    case 1:
      const category = document.getElementById('project-category').value;
      if (!category) {
        alert('Please select a category');
        return false;
      }
      const description = document.getElementById('project-description').value.trim();
      if (!description) {
        alert('Please describe your situation');
        return false;
      }
      if (selectedConcerns.length === 0) {
        alert('Please select at least one concern');
        return false;
      }
      return true;
    
    case 2:
      const zipcode = document.getElementById('project-zipcode').value.trim();
      const state = document.getElementById('project-state').value.trim();
      const city = document.getElementById('project-city').value.trim();
      const street = document.getElementById('project-street').value.trim();
      const startDate = document.getElementById('project-start-date').value;
      const urgency = document.querySelector('input[name="urgency"]:checked');
      const travelPref = document.querySelector('input[name="travel-preference"]:checked');
      
      if (!street) {
        alert('Please enter your street address');
        return false;
      }
      
      if (!city) {
        alert('Please enter your city');
        return false;
      }
      if (!zipcode || !state || !startDate) {
        alert('Please fill in zip code, state, and start date');
        return false;
      }
      if (!urgency) {
        alert('Please select how urgent your need is');
        return false;
      }
      if (!travelPref) {
        alert('Please select your session type preference');
        return false;
      }
      return true;
    
    default:
      return true;
  }
}

function updatePageDisplay() {
  // Hide all pages
  document.querySelectorAll('.form-page').forEach(page => {
    page.classList.remove('form-page--active');
  });

  // Show current page
  const currentPageEl = document.querySelector(`[data-page="${currentPage}"]`);
  if (currentPageEl) {
    currentPageEl.classList.add('form-page--active');
  }

  // Update button visibility
  const prevBtn = document.getElementById('btn-prev-page');
  const nextBtn = document.getElementById('btn-next-page');
  const cancelBtn = document.getElementById('btn-cancel-form');

  if (currentPage === 1) {
    prevBtn.style.display = 'none';
  } else {
    prevBtn.style.display = 'inline-block';
  }

  if (currentPage === totalPages) {
    nextBtn.style.display = 'none';
    cancelBtn.style.display = 'none';
  } else {
    nextBtn.style.display = 'inline-block';
    cancelBtn.style.display = 'inline-block';
  }
}

// ========================================== 
// PROJECT CREATION
// ========================================== 

async function createProject(matchNow = false) {
  try {
    console.log('[createProject] Starting project creation...');
    console.log('[createProject] matchNow =', matchNow);
    

    // Get client serial number and open_to_contact setting
    const { data: clientProfile, error: clientError } = await supabaseClient
      .from('clients')
      .select('serial_number, open_to_contact, first_name, last_name')
      .eq('id', currentUser.id)
      .single();

    if (clientError || !clientProfile) {
      throw new Error('No client profile found. Please complete your client profile first.');
    }

    console.log('[createProject] Using client serial:', clientProfile.serial_number);
    console.log('[createProject] Client open_to_contact:', clientProfile.open_to_contact);
    
    // Get category name from taxonomyData based on category_id
    const selectedCategoryId = document.getElementById('project-category').value;
    const categoryName = taxonomyData[selectedCategoryId]?.name || selectedCategoryId;
    console.log('[createProject] Category:', selectedCategoryId, '→', categoryName);
    
    // Build subcategory names from selected concerns
    const subcategoryNames = selectedConcerns.length > 0 
      ? selectedConcerns.map(c => c.name).join(', ') 
      : null;
    
    const formData = {
      client_serial: clientProfile.serial_number,  // Use serial number, not UUID
      client_first_name: clientProfile.first_name,  // Capture client's first name
      client_last_name: clientProfile.last_name,    // Capture client's last name
      category_id: selectedCategoryId,
      category_name: categoryName,  // Store human-readable category name from taxonomy
      street: document.getElementById('project-street').value || null,
      city: document.getElementById('project-city').value || null,
      zipcode: document.getElementById('project-zipcode').value,
      state: document.getElementById('project-state').value,
      start_date: document.getElementById('project-start-date').value,
      urgency: document.querySelector('input[name="urgency"]:checked').value,
      travel_preference: document.querySelector('input[name="travel-preference"]:checked').value,
      description: document.getElementById('project-description').value,
      project_status: 'pending',  // New projects start as 'pending'
      review_left: false,  // No review yet
      client_open_to_contact: clientProfile.open_to_contact !== false,  // Sync from client settings
      subcategory_name: subcategoryNames,  // Store selected subcategories with their taxonomy names
      matched_practitioners: [],  // Initialize as empty - will be updated when practitioners match
      hired_practitioner: null,    // Initialize as null - set when client hires
      custom_name: null,           // Optional custom project name
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('[createProject] Form data:', formData);

    // Insert project
    const { data: projectData, error: projectError } = await supabaseClient
      .from('projects')
      .insert([formData])
      .select();

    console.log('[createProject] Project insert response:', { projectData, projectError });

    if (projectError) throw projectError;

    const projectId = projectData[0].id;
    const projectSerialNumber = projectData[0].project_id;

    console.log('[createProject] Project created with ID:', projectId, 'Serial:', projectSerialNumber);

    // Insert selected concerns
    const concernInserts = selectedConcerns.map(concern => ({
      project_id: projectId,
      taxonomy_id: taxonomyData[document.getElementById('project-category').value].id,
      subcategory_id: concern.id
    }));

    console.log('[createProject] Concern inserts:', concernInserts);

    if (concernInserts.length > 0) {
      const { error: concernError } = await supabaseClient
        .from('project_client_concerns')
        .insert(concernInserts);

      if (concernError) throw concernError;
    }

    console.log('[createProject] Project and concerns created successfully');

    // Close modal and refresh projects
    document.getElementById('create-project-modal').classList.add('modal--hidden');
    document.getElementById('create-project-form').reset();
    currentPage = 1;
    updatePageDisplay();
    selectedConcerns = [];

    // Refresh projects list
    await loadProjects();

    if (matchNow) {
      console.log('[createProject] Redirecting to Find Practitioners page...');
      window.location.href = `find-practitioners.html?project_id=${projectId}`;
    } else {
      console.log('[createProject] Showing success notification');
      showNotification(`Project created successfully!`, 'success');
    }

  } catch (error) {
    console.error('[createProject] Error:', error);
    showNotification('Error creating project: ' + error.message, 'error');
  }
}

// ========================================== 
// PROJECT LOADING & DISPLAY
// ========================================== 

async function loadProjects() {
  try {
    // Get client serial number
    const { data: clientProfile, error: clientError } = await supabaseClient
      .from('clients')
      .select('serial_number')
      .eq('id', currentUser.id)
      .single();

    if (clientError || !clientProfile) {
      console.error('[loadProjects] No client profile found');
      return;
    }

    const { data, error } = await supabaseClient
      .from('projects')
      .select(`
        id,
        project_id,
        category_id,
        custom_name,
        description,
        street,
        city,
        zipcode,
        state,
        start_date,
        urgency,
        project_status,
        review_left,
        client_open_to_contact,
        created_at,
        subcategory_name,
        project_client_concerns(
          id,
          subcategory_id,
          taxonomy_subcategories(id, name)
        ),
        project_practitioner_matches(
          practitioner_serial,
          status
        ),
        holistic_health_taxonomy!inner(name)
      `)
      .eq('client_serial', clientProfile.serial_number)  // Use serial number
      .order('created_at', { ascending: false });

    if (error) throw error;

    const container = document.getElementById('projects-container');
    
    if (data.length === 0) {
      container.innerHTML = `
        <div class="projects-empty">
          <p>No projects yet. Create your first project to get started!</p>
        </div>
      `;
      return;
    }

    // Filter out canceled projects (customer shouldn't see them)
    const visibleProjects = data.filter(p => p.project_status !== 'canceled');
    
    if (visibleProjects.length === 0) {
      container.innerHTML = `
        <div class="projects-empty">
          <p>No projects yet. Create your first project to get started!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    visibleProjects.forEach(project => {
      const card = createProjectCard(project);
      container.appendChild(card);
      
      // Add collapse toggle handler
      const toggleBtn = card.querySelector('.project-card__toggle');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          card.classList.toggle('project-card--collapsed');
        });
      }

      // Add title editor handler for custom_name
      const titleEditor = card.querySelector('[data-project-title-editor]');
      if (titleEditor) {
        titleEditor.addEventListener('blur', async (e) => {
          const newTitle = e.target.textContent.trim();
          const projectId = e.target.dataset.projectId;
          const currentDisplayName = project.custom_name || project.holistic_health_taxonomy?.name;
          
          if (newTitle && newTitle !== currentDisplayName) {
            try {
              const { error } = await supabaseClient
                .from('projects')
                .update({ custom_name: newTitle })
                .eq('id', projectId);
              
              if (error) throw error;
              console.log('[Project Title] Updated project', projectId, 'to:', newTitle);
            } catch (error) {
              console.error('[Project Title] Error updating project:', error);
              // Revert the title on error
              e.target.textContent = currentDisplayName;
            }
          }
        });
      }
    });

    // Update stats
    updateStats(visibleProjects);

  } catch (error) {
    console.error('Error loading projects:', error);
  }
}

function createProjectCard(project) {
  // Determine display title: use custom_name if set, otherwise use category name from taxonomy join
  let displayTitle = project.custom_name && project.custom_name.trim() 
    ? project.custom_name 
    : (project.holistic_health_taxonomy?.name || project.category_id);
  
  // Build focus areas from subcategory_name field (directly from projects table)
  const concerns = project.subcategory_name && project.subcategory_name.trim()
    ? project.subcategory_name
    : 'No focus areas selected';

  const urgencyColor = {
    browsing: '#999',
    interested: '#5c9a72',
    urgent: '#d4534f'
  }[project.urgency] || '#999';

  const statusLabel = {
    pending: 'Pending',
    'in-progress': 'In-Progress',
    hired: 'Hired',
    'not-hired': 'Not Hired',
    declined: 'Declined'
  }[project.project_status] || project.project_status;

  // Status color based on project status
  const statusColor = {
    pending: '#f59e0b',  // Orange
    'in-progress': '#3b82f6',  // Blue
    hired: '#5c9a72',    // Green
    'not-hired': '#ef4444',  // Red
    declined: '#999'     // Gray
  }[project.project_status] || '#999';

  // Format location as "City, State"
  const location = [project.city, project.state]
    .filter(Boolean)
    .join(', ') || 'N/A';

  const card = document.createElement('div');
  const TERMINAL_STATUSES = ['hired', 'not-hired', 'declined'];
  const closedClass = TERMINAL_STATUSES.includes(project.project_status) ? ' project-card--closed' : '';
  card.className = `project-card${closedClass}`;
  card.innerHTML = `
    <div class="project-card__header" data-project-id="${project.id}">
      <div class="project-card__title-row">
        <button class="project-card__toggle" aria-label="Toggle project details">
          <span class="toggle-icon">▼</span>
        </button>
        <h3 class="project-card__title" contenteditable="true" spellcheck="false" data-project-id="${project.id}" data-project-title-editor>${escapeHtml(displayTitle)}</h3>
        <span class="project-card__status" style="background-color: ${statusColor}20; color: ${statusColor}; border: 1px solid ${statusColor}">
          ${statusLabel}
        </span>
      </div>
    </div>

    <div class="project-card__body">
      <p class="project-card__description">${escapeHtml(project.description)}</p>
      
      <div class="project-card__details">
        <div class="detail-row">
          <span class="detail-label">Focus Areas</span>
          <span class="detail-value">${escapeHtml(concerns)}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Location</span>
          <span class="detail-value">${escapeHtml(location)}</span>
        </div>
        
        <div class="detail-grid">
          <div class="detail-row">
            <span class="detail-label">Start Date</span>
            <span class="detail-value">${new Date(project.start_date).toLocaleDateString()}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Priority</span>
            <span class="detail-value detail-value--${project.urgency}">${project.urgency.charAt(0).toUpperCase() + project.urgency.slice(1)}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="project-card__footer">
      <button class="btn-project-action btn-project-action--primary" onclick="browseMatches('${project.id}')">
        Find Practitioners
      </button>
      <button class="btn-project-action btn-project-action--secondary" onclick="viewMatches('${project.id}')">
        My Matches
      </button>
      ${(project.project_status !== 'hired' && project.project_status !== 'canceled') ? `
        <button class="btn-project-action btn-project-action--danger" onclick="openCloseProjectModal('${project.id}')">
          Close Project
        </button>
      ` : ''}
    </div>
  `;

  return card;
}

function updateStats(projects) {
  const totalProjects = projects.length;
  
  // Count unique practitioners across all visible projects who have active matches
  const uniquePractitioners = new Set(
    projects
      .flatMap(p => p.project_practitioner_matches || [])
      .filter(match => match.status !== 'rejected') // Only count non-rejected matches
      .map(match => match.practitioner_serial)
  ).size;

  document.getElementById('total-projects').textContent = totalProjects;
  document.getElementById('total-practitioners').textContent = uniquePractitioners;
}

function browseMatches(projectId) {
  window.location.href = `find-practitioners.html?project_id=${projectId}`;
}

function viewMatches(projectId) {
  // View matches takes to My Matches page showing all connections for this client
  window.location.href = `/rooted-vitality/dashboard/client/pages/my-matches.html`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showNotification(message, type = 'info') {
  console.log(`[${type.toUpperCase()}] ${message}`);
  // TODO: Implement toast notification UI
}

// ========================================== 
// MODAL HANDLERS
// ========================================== 

function initModalHandlers() {
  const modal = document.getElementById('create-project-modal');
  const openBtn = document.getElementById('create-project-btn');
  const closeBtn = document.querySelector('.modal__close');
  const cancelBtns = document.querySelectorAll('.modal-cancel');
  const overlay = document.querySelector('.modal__overlay');

  openBtn.addEventListener('click', () => {
    modal.classList.remove('modal--hidden');
  });

  closeBtn.addEventListener('click', () => {
    modal.classList.add('modal--hidden');
  });

  cancelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modal.classList.add('modal--hidden');
      const closeModal = document.getElementById('close-project-modal');
      if (closeModal) closeModal.classList.add('modal--hidden');
    });
  });

  overlay.addEventListener('click', () => {
    modal.classList.add('modal--hidden');
  });

  // Initialize Close Project Modal handlers
  initCloseProjectModal();
}

// ========================================== 
// CLOSE PROJECT FUNCTIONALITY
// ========================================== 

let currentProjectToClose = null;

function openCloseProjectModal(projectId) {
  currentProjectToClose = projectId;
  const modal = document.getElementById('close-project-modal');
  modal.classList.remove('modal--hidden');
  
  // Reset form
  document.getElementById('close-project-form').reset();
  document.getElementById('other-reason-group').style.display = 'none';
}

function initCloseProjectModal() {
  const modal = document.getElementById('close-project-modal');
  const closeBtn = modal.querySelector('.modal__close');
  const overlay = modal.querySelector('.modal__overlay');
  const form = document.getElementById('close-project-form');
  const reasonRadios = document.querySelectorAll('input[name="closure-reason"]');
  const otherReasonGroup = document.getElementById('other-reason-group');

  // Show/hide "Other" explanation field
  reasonRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === 'other') {
        otherReasonGroup.style.display = 'block';
      } else {
        otherReasonGroup.style.display = 'none';
      }
    });
  });

  // Close modal handlers
  closeBtn.addEventListener('click', () => {
    modal.classList.add('modal--hidden');
    currentProjectToClose = null;
  });

  overlay.addEventListener('click', () => {
    modal.classList.add('modal--hidden');
    currentProjectToClose = null;
  });

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleCloseProject();
  });
}

async function handleCloseProject() {
  if (!currentProjectToClose) return;

  const form = document.getElementById('close-project-form');
  const formData = new FormData(form);
  const closureReason = formData.get('closure-reason');
  const otherReasonText = formData.get('other-reason');

  try {
    // Determine the new project status
    let newStatus = 'canceled'; // default
    if (closureReason === 'hired') {
      newStatus = 'hired';
    } else if (closureReason === 'canceled') {
      newStatus = 'canceled';
    } else if (closureReason === 'other') {
      // For "other", we'll mark as canceled but store the reason
      newStatus = 'canceled';
    }

    // Update the project status with closed_date and other tracking fields
    const { error: updateError } = await supabaseClient
      .from('projects')
      .update({ 
        project_status: newStatus,
        closed_date: new Date().toISOString(),  // Capture when project was closed
        updated_at: new Date().toISOString()    // Track the update time
        // Optionally store closure notes if you have that column
        // closure_notes: closureReason === 'other' ? otherReasonText : null
      })
      .eq('id', currentProjectToClose);

    if (updateError) throw updateError;

    // Close modal
    const modal = document.getElementById('close-project-modal');
    modal.classList.add('modal--hidden');
    currentProjectToClose = null;

    // Show success message
    showNotification(`Project closed successfully`, 'success');

    // Reload projects to reflect the change
    await loadProjects();

  } catch (error) {
    console.error('Error closing project:', error);
    showNotification('Failed to close project. Please try again.', 'error');
  }
}

