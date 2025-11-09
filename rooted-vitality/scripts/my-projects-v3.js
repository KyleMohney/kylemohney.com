/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: scripts/my-projects-v3.js                                    ║
║  Purpose: Client project management - single-page form              ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

FUNCTIONALITY:
- Load and display client's projects
- Single-page project creation form with ALL fields
- Captures: category, subcategories, urgency, start_date, travel_preference, 
  street, city, state, zipcode, description
- Full database integration with projects table
- Real-time project loading and rendering
*/

let supabaseClient;
let authManager;
let currentUser = null;
let currentClientProfile = null;
let taxonomyData = {};
let selectedSubcategories = [];

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

    // Load existing projects
    await loadProjects();

    // Initialize form handlers
    initializeFormHandlers();
    initializeModalHandlers();
    initializeOpenToContactToggle();

  } catch (error) {
    console.error('[My Projects] Initialization error:', error);
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
// PROJECT LOADING & RENDERING
// ========================================== 

async function loadProjects() {
  try {
    const { data, error } = await supabaseClient
      .from('projects')
      .select('*')
      .eq('id', currentUser.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log('[My Projects] Loaded', data.length, 'projects');

    // Render projects
    renderProjectsGrid(data);
    updateStats(data);

  } catch (error) {
    console.error('[My Projects] Error loading projects:', error);
  }
}

function renderProjectsGrid(projects) {
  const container = document.getElementById('projects-container');
  if (!container) return;

  if (!projects || projects.length === 0) {
    container.innerHTML = '<div class="projects-empty"><p>No projects yet. Create your first project to get started!</p></div>';
    return;
  }

  container.innerHTML = projects.map(project => `
    <div class="project-card">
      <div class="project-card__header">
        <h3 class="project-card__title">${project.category_name || 'Project'}</h3>
        <span class="project-card__status project-card__status--${project.project_status}">${project.project_status}</span>
      </div>
      <div class="project-card__body">
        <p class="project-card__description">${project.description || ''}</p>
        <div class="project-card__meta">
          <span class="meta-item"><strong>Urgency:</strong> ${project.urgency}</span>
          <span class="meta-item"><strong>Start:</strong> ${new Date(project.start_date).toLocaleDateString()}</span>
          <span class="meta-item"><strong>Location:</strong> ${project.city}, ${project.state}</span>
        </div>
      </div>
      <div class="project-card__actions">
        <button class="btn btn-secondary btn-sm" onclick="openCloseProjectModal('${project.id}')">Close Project</button>
      </div>
    </div>
  `).join('');

  console.log('[My Projects] Projects grid rendered');
}

function updateStats(projects) {
  const totalEl = document.getElementById('total-projects');
  if (totalEl) totalEl.textContent = projects.length;
}

// ========================================== 
// FORM INITIALIZATION & HANDLERS
// ========================================== 

function initializeFormHandlers() {
  const form = document.getElementById('create-project-form');
  const categorySelect = document.getElementById('project-category');
  const descriptionTA = document.getElementById('project-description');
  const charCount = document.getElementById('char-count');
  const matchLaterBtn = document.getElementById('btn-match-later');
  const matchNowBtn = document.getElementById('btn-match-now');

  // Category change - load subcategories
  if (categorySelect) {
    categorySelect.addEventListener('change', (e) => {
      const categoryId = e.target.value;
      loadSubcategories(categoryId);
    });
  }

  // Character counter
  if (descriptionTA && charCount) {
    descriptionTA.addEventListener('input', (e) => {
      charCount.textContent = e.target.value.length;
    });
  }

  // Match Later button - create project and stay on page
  if (matchLaterBtn) {
    matchLaterBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await submitCreateProject(false);
    });
  }

  // Match Now button - create project and redirect
  if (matchNowBtn) {
    matchNowBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await submitCreateProject(true);
    });
  }

  console.log('[My Projects] Form handlers initialized');
}

function loadSubcategories(categoryId) {
  const container = document.getElementById('subcategories-container');
  const group = document.getElementById('subcategories-group');

  if (!container || !categoryId) {
    if (group) group.style.display = 'none';
    return;
  }

  const category = taxonomyData[categoryId];
  if (!category || !category.subcategories) {
    if (group) group.style.display = 'none';
    return;
  }

  // Clear previous selection
  selectedSubcategories = [];

  // Render subcategory checkboxes
  container.innerHTML = category.subcategories.map((subcat, idx) => `
    <div class="checkbox-item">
      <input 
        type="checkbox" 
        id="subcat-${idx}" 
        name="subcategory" 
        value="${subcat}"
        onchange="handleSubcategoryChange('${subcat}', this.checked)"
      >
      <label for="subcat-${idx}">${subcat}</label>
    </div>
  `).join('');

  if (group) group.style.display = 'block';
  console.log('[My Projects] Subcategories loaded for category:', categoryId);
}

function handleSubcategoryChange(subcategory, isChecked) {
  if (isChecked) {
    if (!selectedSubcategories.includes(subcategory)) {
      selectedSubcategories.push(subcategory);
    }
  } else {
    selectedSubcategories = selectedSubcategories.filter(s => s !== subcategory);
  }
  console.log('[My Projects] Selected subcategories:', selectedSubcategories);
}

async function submitCreateProject(matchNow = false) {
  try {
    // Get form data
    const categoryId = document.getElementById('project-category').value;
    const description = document.getElementById('project-description').value.trim();
    const startDate = document.getElementById('project-start-date').value;
    const urgency = document.querySelector('input[name="urgency"]:checked')?.value;
    let travelPreference = document.querySelector('input[name="travel_preference"]:checked')?.value;
    const street = document.getElementById('project-street').value || null;
    const city = document.getElementById('project-city').value.trim();
    const state = document.getElementById('project-state').value.trim();
    const zipcode = document.getElementById('project-zipcode').value.trim();

    // NORMALIZE travel preference values for SQL matching
    // The matching function expects: 'in-person', 'housecalls', 'virtual'
    // Form provides: 'in-person', 'house-calls', 'virtual', 'flexible'
    let matchingTravelPreference = travelPreference;
    
    if (travelPreference === 'house-calls') {
      matchingTravelPreference = 'housecalls'; // SQL function expects 'housecalls' without hyphen
    } else if (travelPreference === 'flexible') {
      // For flexible, we'll default to 'virtual' for matching (broadest reach)
      // The user can still manually browse other travel types in find-practitioners
      matchingTravelPreference = 'virtual';
    }

    // Validate required fields
    if (!categoryId) {
      alert('Please select a category');
      return;
    }
    if (selectedSubcategories.length === 0) {
      alert('Please select at least one concern');
      return;
    }
    if (!description) {
      alert('Please describe your situation');
      return;
    }
    if (!startDate) {
      alert('Please select a start date');
      return;
    }
    if (!urgency) {
      alert('Please select urgency level');
      return;
    }
    if (!travelPreference) {
      alert('Please select session type preference');
      return;
    }
    if (!city || !state || !zipcode) {
      alert('Please enter city, state, and zip code');
      return;
    }

    // Get category name
    const categoryName = taxonomyData[categoryId]?.name || categoryId;
    const subcategoryNames = selectedSubcategories.join(', ');

    // For 'flexible' travel preference, we store it as-is but will use 'virtual' for initial matching
    const storedTravelPreference = travelPreference;

    console.log('[My Projects] Creating project with data:', {
      categoryId,
      categoryName,
      subcategoryNames,
      urgency,
      startDate,
      travelPreference: storedTravelPreference,
      matchingTravelPreference,
      city,
      state,
      zipcode,
      matchNow
    });

    // Build project object
    const projectData = {
      id: currentUser.id,
      category_id: categoryId,
      category_name: categoryName,
      subcategory_name: subcategoryNames,
      description: description,
      start_date: startDate,
      urgency: urgency,
      travel_preference: storedTravelPreference,
      street: street,
      city: city,
      state: state,
      zipcode: zipcode,
      project_status: 'pending'
    };

    // Insert into database
    const { data, error } = await supabaseClient
      .from('projects')
      .insert([projectData])
      .select();

    if (error) {
      console.error('[My Projects] Error creating project:', error);
      alert('Error creating project: ' + error.message);
      return;
    }

    const newProject = data[0];
    console.log('[My Projects] Project created successfully:', newProject);

    // CRITICAL: NOW RUN THE MATCHING ALGORITHM
    console.log('[My Projects] Running matching algorithm for project:', newProject.id);
    
    let allMatches = [];

    // If travel preference is 'flexible', match all three types and combine
    const travelTypesToMatch = (matchingTravelPreference === 'virtual' && travelPreference === 'flexible') 
      ? ['in-person', 'housecalls', 'virtual']
      : [matchingTravelPreference];

    console.log('[My Projects] Will match travel types:', travelTypesToMatch);

    for (const travelType of travelTypesToMatch) {
      try {
        console.log('[My Projects] Matching for travel type:', travelType);

        // For matching, temporarily update project's travel_preference
        const { error: updateError } = await supabaseClient
          .from('projects')
          .update({ travel_preference: travelType })
          .eq('id', newProject.id);

        if (updateError) {
          console.error('[My Projects] Error temporarily updating travel preference:', updateError);
          continue;
        }

        // Call the match_practitioners RPC function
        const { data: matchedPractitioners, error: matchError } = await supabaseClient
          .rpc('match_practitioners', { p_project_id: newProject.id });

        if (matchError) {
          console.error('[My Projects] Error running matching algorithm for', travelType, ':', matchError);
        } else {
          console.log('[My Projects] Matched', matchedPractitioners?.length || 0, 'practitioners for', travelType);
          
          if (matchedPractitioners && matchedPractitioners.length > 0) {
            // Add unique practitioners (dedup by ID)
            matchedPractitioners.forEach(m => {
              if (!allMatches.find(existing => existing.practitioner_id === m.practitioner_id)) {
                allMatches.push(m);
              }
            });
          }
        }
      } catch (travelTypeError) {
        console.error('[My Projects] Exception matching for travel type', travelType, ':', travelTypeError);
      }
    }

    // Restore original travel_preference in database
    if (travelPreference === 'flexible' || travelPreference === 'house-calls') {
      const restoreValue = travelPreference === 'flexible' ? 'flexible' : 'house-calls';
      console.log('[My Projects] Restoring travel_preference to:', restoreValue);
      
      try {
        const { error: restoreError } = await supabaseClient
          .from('projects')
          .update({ travel_preference: restoreValue })
          .eq('id', newProject.id);

        if (restoreError) {
          console.error('[My Projects] Error restoring travel_preference:', restoreError);
        }
      } catch (restoreEx) {
        console.error('[My Projects] Exception restoring travel_preference:', restoreEx);
      }
    }

    console.log('[My Projects] Total unique matches:', allMatches.length);

    // POPULATE PROJECT_PRACTITIONER_MATCHES TABLE
    if (allMatches && allMatches.length > 0) {
      const matchRecords = allMatches.map(practitioner => ({
        project_id: newProject.project_id,
        client_serial: currentClientProfile.serial_number,
        practitioner_id: practitioner.practitioner_id,
        practitioner_serial: practitioner.practitioner_serial,
        match_score: practitioner.match_score,
        match_status: 'matched'
      }));

      console.log('[My Projects] Inserting', matchRecords.length, 'match records...');

      try {
        const { error: insertError } = await supabaseClient
          .from('project_practitioner_matches')
          .insert(matchRecords);

        if (insertError) {
          console.error('[My Projects] Error inserting matches:', insertError);
          alert('Warning: Matches could not be saved. Error: ' + insertError.message);
        } else {
          console.log('[My Projects] All match records inserted successfully');
        }
      } catch (insertEx) {
        console.error('[My Projects] Exception inserting matches:', insertEx);
        alert('Warning: Error saving match records: ' + insertEx.message);
      }
    } else {
      console.log('[My Projects] No practitioners matched for this project');
    }

    // Clear form and reload projects
    document.getElementById('create-project-form').reset();
    selectedSubcategories = [];
    document.getElementById('subcategories-group').style.display = 'none';
    document.getElementById('char-count').textContent = '0';

    // Close modal
    closeModal('create-project-modal');

    // Reload projects
    await loadProjects();

    if (matchNow) {
      // Redirect to find practitioners page with project UUID
      console.log('[My Projects] Redirecting to find practitioners with project ID:', newProject.id);
      window.location.href = `./find-practitioners.html?project_id=${newProject.id}`;
    } else {
      console.log('[My Projects] Project saved, staying on page');
    }

  } catch (error) {
    console.error('[My Projects] Error:', error);
    alert('Error: ' + error.message);
  }
}

function initializeModalHandlers() {
  const modal = document.getElementById('create-project-modal');
  const openBtn = document.getElementById('create-project-btn');
  const closeBtn = document.querySelector('#create-project-modal .modal__close');
  const cancelBtns = document.querySelectorAll('#create-project-modal .modal-cancel');
  const overlay = document.querySelector('#create-project-modal .modal__overlay');

  if (openBtn) {
    openBtn.addEventListener('click', () => {
      modal.classList.remove('modal--hidden');
      console.log('[My Projects] Create project modal opened');
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.add('modal--hidden');
    });
  }

  cancelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modal.classList.add('modal--hidden');
    });
  });

  if (overlay) {
    overlay.addEventListener('click', () => {
      modal.classList.add('modal--hidden');
    });
  }

  // Initialize close project modal
  initCloseProjectModal();
  console.log('[My Projects] Modal handlers initialized');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('modal--hidden');
}

// ========================================== 
// CLOSE PROJECT MODAL
// ========================================== 

function openCloseProjectModal(projectId) {
  console.log('[My Projects] Opening close project modal for:', projectId);
  // Implementation for close project modal
}

function initCloseProjectModal() {
  // Close project modal implementation
  console.log('[My Projects] Close project modal initialized');
}

// ========================================== 
// OPEN TO CONTACT TOGGLE
// ========================================== 

function initializeOpenToContactToggle() {
  const toggle = document.getElementById('open-to-contact-toggle');
  if (!toggle) return;

  toggle.addEventListener('change', async (e) => {
    const newValue = e.target.checked;
    console.log('[My Projects] Open to contact toggled:', newValue);

    // Update in database
    const { error } = await supabaseClient
      .from('clients')
      .update({ open_to_contact: newValue })
      .eq('id', currentUser.id);

    if (error) {
      console.error('[My Projects] Error updating open_to_contact:', error);
      alert('Error saving preference');
      e.target.checked = !newValue; // Revert
    } else {
      currentClientProfile.open_to_contact = newValue;
      console.log('[My Projects] Open to contact updated successfully');
    }
  });

  // Set initial value
  toggle.checked = currentClientProfile?.open_to_contact !== false;
}
