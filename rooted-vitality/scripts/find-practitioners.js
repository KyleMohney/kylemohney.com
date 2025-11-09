/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: scripts/find-practitioners.js                               ║
║  Purpose: Practitioner directory with filtering and connection     ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

FUNCTIONALITY:
- Load client's projects from database
- Allow selection of project
- Filter practitioners by travel preference and services
- Sort by rating, recent, name, match score
- Display practitioner cards with basic info
- Send connection requests
- Manage pagination (10 per page)
- Responsive design for mobile/tablet/desktop

DEPENDENCIES:
- Supabase (v2)
- auth-init.js (for currentUser)
- header-inject.js (for page header)

*/

let supabaseClient;
let currentUser = null;
let allPractitioners = [];
let filteredPractitioners = [];
let selectedProject = null;
let currentPage = 1;
const practitionersPerPage = 10;
let matchedPractitioners = []; // Track which practitioners have been matched

// ============================================================================
// INITIALIZATION
// ============================================================================

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Find Practitioners] DOMContentLoaded fired');
  initializePage();
});

async function initializePage() {
  try {
    console.log('[Find Practitioners] Initializing page...');

    // Wait for auth initialization - check authManager
    if (typeof window.authManager === 'undefined') {
      console.log('[Find Practitioners] authManager not ready, waiting...');
      setTimeout(initializePage, 100);
      return;
    }

    const userData = window.authManager.getCurrentUser();
    if (!userData) {
      console.log('[Find Practitioners] No authenticated user, waiting...');
      setTimeout(initializePage, 100);
      return;
    }

    supabaseClient = window.supabaseClient;
    currentUser = userData;

    console.log('[Find Practitioners] Current user:', currentUser.email);

    // Load project and set up event listeners
    await loadProject();
    setupEventListeners();

    console.log('[Find Practitioners] Page initialized successfully');
  } catch (error) {
    console.error('[Find Practitioners] Initialization error:', error);
  }
}

// ============================================================================
// PROJECT LOADING
// ============================================================================

async function loadProject() {
  try {
    console.log('[loadProject] Fetching project...');

    // Get project_id from URL
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('project_id');

    console.log('[loadProject] Project ID from URL:', projectId);
    console.log('[loadProject] Full URL:', window.location.href);

    if (!projectId) {
      console.error('[loadProject] No project ID in URL');
      showEmptyState('No Project', 'Please select a project from My Projects');
      return;
    }

    // Get project
    const { data: project, error: projectError } = await supabaseClient
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    console.log('[loadProject] Query result - Project:', project, 'Error:', projectError);

    if (projectError || !project) {
      console.error('[loadProject] Error fetching project:', projectError);
      console.error('[loadProject] Error details:', {
        code: projectError?.code,
        message: projectError?.message,
        details: projectError?.details,
        hint: projectError?.hint
      });
      showEmptyState('Project Not Found', 'The project you selected does not exist or you do not have permission to access it. Error: ' + (projectError?.message || 'Unknown error'));
      return;
    }

    // Load practitioners for this project
    selectedProject = project;
    sessionStorage.setItem('selectedProjectId', project.project_id);  // Store INTEGER serial number
    
    // Load existing matches first
    await loadExistingMatches();
    
    // Then load practitioners for this project
    await loadPractitioners(project);
  } catch (error) {
    console.error('[loadProject] Exception:', error);
  }
}

// ============================================================================
// LOAD EXISTING MATCHES
// ============================================================================

async function loadExistingMatches() {
  try {
    console.log('[loadExistingMatches] Loading existing matches...');
    
    // Get client's serial number
    const { data: clientProfile, error: clientError } = await supabaseClient
      .from('clients')
      .select('serial_number')
      .eq('id', currentUser.id)
      .single();
    
    if (clientError || !clientProfile) {
      console.warn('[loadExistingMatches] Could not load client profile');
      return;
    }
    
    // Get all matches for this client
    const { data: matches, error: matchesError } = await supabaseClient
      .from('project_practitioner_matches')
      .select('practitioner_id, practitioner_serial')
      .eq('client_serial', clientProfile.serial_number);
    
    if (matchesError) {
      console.warn('[loadExistingMatches] Error loading matches:', matchesError);
      return;
    }
    
    // Store matched practitioner IDs
    matchedPractitioners = (matches || []).map(m => m.practitioner_id);
    console.log('[loadExistingMatches] Found', matchedPractitioners.length, 'matched practitioners');
  } catch (error) {
    console.error('[loadExistingMatches] Exception:', error);
  }
}

// ============================================================================
// PRACTITIONER LOADING & FILTERING
// ============================================================================

async function loadPractitioners(project) {
  try {
    console.log('[loadPractitioners] Loading matches for project:', project.project_id);
    console.log('[loadPractitioners] Project details:', {
      id: project.id,
      project_id: project.project_id,
      travel_preference: project.travel_preference,
      zipcode: project.zipcode,
      state: project.state,
      category_id: project.category_id
    });

    // Try to call the matching algorithm function (RPC)
    // Note: RPC expects project UUID (project.id), not the serial number
    let practitioners = [];
    const { data: rpcData, error: rpcError } = await supabaseClient
      .rpc('match_practitioners', { p_project_id: project.id });

    console.log('[loadPractitioners] RPC Response - Data:', rpcData, 'Error:', rpcError);
    
    if (rpcError) {
      console.error('[loadPractitioners] RPC Error Details:', {
        code: rpcError?.code,
        message: rpcError?.message,
        details: rpcError?.details,
        hint: rpcError?.hint
      });
    }

    if (rpcError) {
      console.warn('[loadPractitioners] RPC function not available yet:', rpcError.message);
      console.error('[loadPractitioners] Matching system not deployed. Please contact support.');
      
      // Show error state - matching function not available
      showEmptyState(
        'Matching System Unavailable',
        'The practitioner matching system is currently being deployed. Please try again in a few moments.'
      );
      filteredPractitioners = [];
    } else {
      practitioners = rpcData || [];
      console.log('[loadPractitioners] Found', practitioners.length, 'matching practitioners');
      console.log('[loadPractitioners] Practitioners data:', practitioners);
      
      // Fetch full practitioner details including badge fields
      if (practitioners.length > 0) {
        const practitionerIds = practitioners.map(p => p.id);
        const { data: fullPractitioners, error: detailsError } = await supabaseClient
          .from('practitioners')
          .select('id, badge_licensed, badge_certified, badge_background_check, credentials_verified, profile_completeness_percent')
          .in('id', practitionerIds);
        
        if (!detailsError && fullPractitioners) {
          console.log('[loadPractitioners] Full practitioner details:', fullPractitioners);
          
          // Merge badge fields into practitioners data
          const badgeMap = {};
          fullPractitioners.forEach(p => {
            badgeMap[p.id] = {
              badge_licensed: p.badge_licensed,
              badge_certified: p.badge_certified,
              badge_background_check: p.badge_background_check,
              credentials_verified: p.credentials_verified
            };
          });
          
          // Update practitioners with badge fields
          practitioners = practitioners.map(p => ({
            ...p,
            ...badgeMap[p.id]
          }));
          
          console.log('[loadPractitioners] Merged practitioners with badges:', practitioners);
        }
      }
      
      allPractitioners = practitioners;

      // Update project info display
      updateProjectInfo(project);

      // Apply filters and display
      applyFilters();
      displayPractitioners();
    }
  } catch (error) {
    console.error('[loadPractitioners] Exception:', error);
  }
}

function updateProjectInfo(project) {
  const subtitle = document.getElementById('directory-subtitle');
  const infoDisplay = document.getElementById('project-info-display');
  const locationDisplay = document.getElementById('project-location');
  const preferenceDisplay = document.getElementById('preference-display');

  // Safely update subtitle (always exists)
  if (subtitle) {
    subtitle.textContent = `${project.description.substring(0, 60)}...`;
  }

  // Only update optional elements if they exist
  if (infoDisplay) {
    infoDisplay.textContent = project.description.substring(0, 150) + (project.description.length > 150 ? '...' : '');
  }

  if (locationDisplay) {
    locationDisplay.textContent = `📍 ${project.zipcode}, ${project.state}`;
    locationDisplay.style.display = 'block';
  }

  if (preferenceDisplay) {
    preferenceDisplay.textContent = capitalizeFirst(project.travel_preference);
  }

  selectedProject = project;
  sessionStorage.setItem('selectedProjectId', project.project_id);  // Store INTEGER serial number
}

/**
 * Refresh the practitioner search for the current project
 */
async function refreshSearch() {
  if (!selectedProject) {
    console.warn('[refreshSearch] No project selected');
    return;
  }

  console.log('[refreshSearch] Refreshing search for project:', selectedProject.project_id);
  
  // Show loading state
  const refreshBtn = document.getElementById('refresh-search');
  const originalText = refreshBtn.textContent;
  refreshBtn.textContent = 'Searching...';
  refreshBtn.disabled = true;

  try {
    // Reload practitioners
    await loadPractitioners(selectedProject);
    
    console.log('[refreshSearch] Search complete. Found', filteredPractitioners.length, 'practitioners');
  } catch (error) {
    console.error('[refreshSearch] Error refreshing search:', error);
    showEmptyState('Search Error', 'Failed to refresh search. Please try again.');
  } finally {
    // Restore button
    refreshBtn.textContent = originalText;
    refreshBtn.disabled = false;
  }
}

function applyFilters() {
  let filtered = [...allPractitioners];

  if (!selectedProject) return;

  // Matches are already filtered by the matching algorithm
  // No additional filtering needed - display all matched results
  filteredPractitioners = filtered;

  // Apply sorting
  applySorting();
}

function applySorting() {
  const sortValue = document.getElementById('sort-selector').value;

  switch(sortValue) {
    case 'rating':
      filteredPractitioners.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
    case 'name':
      filteredPractitioners.sort((a, b) => {
        const nameA = (a.legal_name || '').toLowerCase();
        const nameB = (b.legal_name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
      break;
    case 'match-score':
      filteredPractitioners.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
      break;
    case 'profile-completeness':
      filteredPractitioners.sort((a, b) => (b.profile_completeness_percent || 0) - (a.profile_completeness_percent || 0));
      break;
    case 'recent':
    default:
      // Sort by profile completeness as default (best match first)
      filteredPractitioners.sort((a, b) => (b.profile_completeness_percent || 0) - (a.profile_completeness_percent || 0));
      break;
  }

  currentPage = 1;
  updatePagination();
}

// ============================================================================
// DISPLAY FUNCTIONS
// ============================================================================

function displayPractitioners() {
  const grid = document.getElementById('practitioners-grid');
  const emptyState = document.getElementById('empty-state');
  const pagination = document.getElementById('pagination');

  console.log('[displayPractitioners] filteredPractitioners:', filteredPractitioners);
  console.log('[displayPractitioners] filteredPractitioners.length:', filteredPractitioners.length);
  console.log('[displayPractitioners] allPractitioners:', allPractitioners);

  if (filteredPractitioners.length === 0) {
    console.log('[displayPractitioners] No practitioners to display, showing empty state');
    grid.style.display = 'none';
    pagination.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }

  grid.style.display = 'grid';
  emptyState.style.display = 'none';

  // Calculate pagination
  const totalPages = Math.ceil(filteredPractitioners.length / practitionersPerPage);
  const startIdx = (currentPage - 1) * practitionersPerPage;
  const endIdx = startIdx + practitionersPerPage;
  const pageData = filteredPractitioners.slice(startIdx, endIdx);

  console.log('[displayPractitioners] Displaying page with', pageData.length, 'practitioners');

  // Clear and populate grid
  grid.innerHTML = '';
  pageData.forEach(practitioner => {
    grid.appendChild(createPractitionerCard(practitioner));
  });

  // Attach event listeners to View Profile buttons
  document.querySelectorAll('.card-btn--view').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('[displayPractitioners] View Profile button clicked');
      console.log('[displayPractitioners] Button dataset:', this.dataset);
      const practitionerId = this.dataset.practitionerId;
      console.log('[displayPractitioners] Practitioner ID from data attribute:', practitionerId);
      if (practitionerId) {
        navigateToPractitionerProfile(practitionerId);
      } else {
        console.error('[displayPractitioners] No practitioner ID found in button data');
      }
    });
  });

  // Attach event listeners to Connect buttons
  document.querySelectorAll('.card-btn--connect').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const practitionerId = this.dataset.practitionerId;
      if (practitionerId) {
        openConnectionRequest(practitionerId);
      }
    });
  });

  // Update count
  document.getElementById('showing-count').textContent = pageData.length;
  document.getElementById('total-count').textContent = filteredPractitioners.length;

  // Show/update pagination
  if (totalPages > 1) {
    pagination.style.display = 'flex';
    updatePaginationButtons(totalPages);
  } else {
    pagination.style.display = 'none';
  }
}

function createPractitionerCard(practitioner) {
  const card = document.createElement('div');
  
  // Check if this practitioner has already been matched
  const isMatched = matchedPractitioners.includes(practitioner.practitioner_id);
  const matchedClass = isMatched ? ' practitioner-card--matched' : '';
  card.className = `practitioner-card${matchedClass}`;

  // Use business name fields only: legal_business_name or dba_name (not legal_name which is owner name)
  const displayName = practitioner.legal_business_name || practitioner.dba_name || 'Practitioner';

  const services = [];
  if (practitioner.in_person_enabled) services.push('In-Person');
  if (practitioner.housecalls_enabled) services.push('House Calls');
  if (practitioner.virtual_enabled) services.push('Virtual');

  // Build badges list - only show the main credentials
  const badges = [];
  
  // Debug: log all practitioner fields related to badges
  console.log('[createPractitionerCard] Practitioner badge fields:', {
    name: displayName,
    credentials_verified: practitioner.credentials_verified,
    badge_licensed: practitioner.badge_licensed,
    badge_certified: practitioner.badge_certified,
    badge_background_check: practitioner.badge_background_check,
    allFields: Object.keys(practitioner).filter(k => k.includes('badge') || k.includes('verified'))
  });
  
  if (practitioner.credentials_verified) {
    badges.push('<li class="badge-item"><span class="badge-check">✓</span> Verified</li>');
  }
  if (practitioner.badge_licensed) {
    badges.push('<li class="badge-item"><span class="badge-check">✓</span> Licensed</li>');
  }
  if (practitioner.badge_certified) {
    badges.push('<li class="badge-item"><span class="badge-check">✓</span> Certified</li>');
  }
  if (practitioner.background_check_status === 'passed') {
    badges.push('<li class="badge-item"><span class="badge-check">✓</span> Background Check</li>');
  }
  
  const badgesHtml = badges.length > 0 ? `<ul class="card-header-badges">${badges.join('')}</ul>` : '';

  card.innerHTML = `
    ${isMatched ? '<div class="matched-overlay"><div class="matched-label">Matched</div></div>' : ''}
    <div class="card-header">
      <div class="card-avatar-section">
        <img src="${practitioner.profile_photo_url || 'https://via.placeholder.com/140?text=No+Photo'}" 
             alt="${displayName}"
             class="card-avatar"
             onerror="this.src='https://via.placeholder.com/140?text=No+Photo'">
      </div>
      ${badgesHtml}
    </div>

    <div class="card-body">
      <h3 class="card-name">${displayName}</h3>
      <p class="card-specialty">${practitioner.modalities?.join(', ') || 'Various Modalities'}</p>

      <div class="card-rating">
        <span class="rating-stars">${createStars(practitioner.rating || 0)}</span>
        <span class="rating-count">${practitioner.reviews_count || 0} reviews</span>
        ${practitioner.match_score ? `<span class="match-score">Match: ${practitioner.match_score}%</span>` : ''}
      </div>

      <div class="card-services">
        ${services.map(service => `<span class="service-badge service-badge--available">${service}</span>`).join('')}
      </div>

      <p class="card-bio">${(practitioner.bio || '').substring(0, 150)}${(practitioner.bio || '').length > 150 ? '...' : ''}</p>

      <div class="card-actions">
        <button class="card-btn card-btn--view" data-practitioner-id="${practitioner.practitioner_id}">View Profile</button>
        <button class="card-btn card-btn--connect" data-practitioner-id="${practitioner.practitioner_id}">Connect</button>
      </div>
    </div>
  `;

  return card;
}

function createStars(rating) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  let stars = '★'.repeat(fullStars);
  if (hasHalf) stars += '½';
  stars += '☆'.repeat(5 - Math.ceil(rating));
  return stars.substring(0, 5);
}

function showEmptyState(title, message) {
  const emptyState = document.getElementById('empty-state');
  const emptyStateTitle = document.getElementById('empty-state__title');
  const emptyStateText = document.getElementById('empty-state__text');
  
  if (emptyState) {
    emptyState.style.display = 'block';
  }
  if (emptyStateTitle) {
    emptyStateTitle.textContent = title;
  }
  if (emptyStateText) {
    emptyStateText.textContent = message;
  }
}

// ============================================================================
// MODALS
// ============================================================================

async function openPractitionerModal(practitionerId) {
  const practitioner = allPractitioners.find(p => p.id === practitionerId);
  if (!practitioner) return;

  // Populate modal
  document.getElementById('modal-name').textContent = practitioner.legal_name || 'Practitioner';
  document.getElementById('modal-specialty').textContent = (practitioner.modalities || []).join(', ') || 'Various Modalities';
  document.getElementById('modal-avatar').src = practitioner.profile_photo_url || 'https://via.placeholder.com/120?text=No+Photo';
  document.getElementById('modal-rating').textContent = createStars(practitioner.rating || 0);
  document.getElementById('modal-rating-count').textContent = `(${practitioner.reviews_count || 0} reviews)`;
  document.getElementById('modal-bio').textContent = practitioner.bio || 'No bio available';

  // Services
  const servicesHtml = [];
  if (practitioner.in_person_enabled) servicesHtml.push('<span class="service-badge service-badge--available">In-Person</span>');
  if (practitioner.housecalls_enabled) servicesHtml.push('<span class="service-badge service-badge--available">House Calls</span>');
  if (practitioner.virtual_enabled) servicesHtml.push('<span class="service-badge service-badge--available">Virtual</span>');
  document.getElementById('modal-services').innerHTML = servicesHtml.join('');

  // Coverage
  const coverage = [];
  if (practitioner.in_person_enabled) coverage.push('In-Person: ' + (practitioner.travel_radius || 'Service Area'));
  if (practitioner.housecalls_enabled) coverage.push('House Calls: ' + (practitioner.travel_radius || 'Service Area'));
  if (practitioner.virtual_enabled) coverage.push('Virtual: Available');
  document.getElementById('modal-coverage').textContent = coverage.join(' • ') || 'Contact for details';

  // Contact
  document.getElementById('modal-email-link').href = `mailto:${practitioner.email}`;
  document.getElementById('modal-email-link').textContent = practitioner.email;
  document.getElementById('modal-email').style.display = 'block';

  if (practitioner.phone) {
    document.getElementById('modal-phone-link').href = `tel:${practitioner.phone}`;
    document.getElementById('modal-phone-link').textContent = practitioner.phone;
    document.getElementById('modal-phone').style.display = 'block';
  } else {
    document.getElementById('modal-phone').style.display = 'none';
  }

  // Store for connection request
  document.getElementById('modal-send-request').dataset.practitionerId = practitioner.id;

  // Show modal
  document.getElementById('practitioner-modal').classList.add('active');
}

function openConnectionRequest(practitionerId) {
  const practitioner = allPractitioners.find(p => p.id === practitionerId);
  if (!practitioner) return;

  // Close detail modal if open
  document.getElementById('practitioner-modal').classList.remove('active');

  // Show confirmation
  document.getElementById('request-practitioner-name').textContent = practitioner.legal_name || 'Practitioner';
  document.getElementById('connection-request-modal').classList.add('active');

  // Handle submission
  document.getElementById('request-modal-close').onclick = async () => {
    await sendConnectionRequest(practitionerId, practitioner.serial_number);
    document.getElementById('connection-request-modal').classList.remove('active');
  };
}

async function sendConnectionRequest(practitionerId, practitionerSerial) {
  if (!selectedProject) return;

  try {
    console.log('[sendConnectionRequest] Creating match...');

    // Get client ID and name
    const currentUser = window.authManager?.getCurrentUser();
    if (!currentUser) {
      alert('Error: Not authenticated');
      return;
    }

    const { data: clientData, error: clientError } = await supabaseClient
      .from('clients')
      .select('id, first_name, last_name')
      .eq('id', currentUser.id)
      .single();

    if (clientError || !clientData) {
      console.error('[sendConnectionRequest] Could not find client:', clientError);
      alert('Error retrieving client information');
      return;
    }

    // Get match score and distance from the matching algorithm
    let matchScore = 75;
    let distanceMiles = null;
    
    const { data: matchData, error: matchQueryError } = await supabaseClient.rpc(
      'match_practitioners',
      { v_project_id: selectedProject.project_id }  // Use project_id (integer), not id (UUID)
    );

    if (!matchQueryError && matchData && matchData.length > 0) {
      const practitionerMatch = matchData.find(m => m.practitioner_id === practitionerId);
      if (practitionerMatch) {
        matchScore = practitionerMatch.match_score ?? 75;
        distanceMiles = practitionerMatch.distance_miles ?? null;
      }
    }

    console.log('[sendConnectionRequest] Match score:', matchScore, 'Distance:', distanceMiles);

    // Create match with all fields
    const { data, error } = await supabaseClient
      .from('project_practitioner_matches')
      .insert({
        project_id: selectedProject.project_id,     // Integer serial number, not UUID
        practitioner_id: practitionerId,
        client_serial: selectedProject.client_serial,
        practitioner_serial: practitionerSerial,
        status: 'active',
        is_read: false,                              // Unread when first created
        client_initiated: true,                      // Client sent request
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        matched_at: new Date().toISOString(),
        contacted_at: null,                          // Will be set when practitioner responds
        match_score: matchScore,                     // Quality score from matching algorithm
        distance_miles: distanceMiles,               // Distance to practitioner
        matched_concerns: selectedProject.description ? [selectedProject.description] : []
      });

    if (error) {
      console.error('[sendConnectionRequest] Error:', error);
      alert('Error sending connection request');
      return;
    }

    // Update projects table to track matched practitioners
    const currentMatched = selectedProject.matched_practitioners || [];
    if (!currentMatched.includes(practitionerId)) {
      const { error: projectUpdateError } = await supabaseClient
        .from('projects')
        .update({
          matched_practitioners: [...currentMatched, practitionerId],
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedProject.id);

      if (projectUpdateError) {
        console.error('[sendConnectionRequest] Error updating matched practitioners:', projectUpdateError);
      }
    }

    // Create auto-message
    const clientName = clientData.first_name || 'Client';
    const messageText = `${clientName} wants connect about their wellness project!`;

    const { error: messageError } = await supabaseClient
      .from('project_messages')
      .insert({
        project_id: selectedProject.project_id,  // Use project_id (INTEGER), not id (UUID)
        practitioner_id: practitionerId,
        client_id: clientData.id,
        sender_id: clientData.id,
        sender_type: 'client',
        message: messageText,
        is_read: false
      });

    if (messageError) {
      console.error('[sendConnectionRequest] Error creating auto-message:', messageError);
    } else {
      // Message created successfully - update contacted_at in the match
      const { error: updateContactedError } = await supabaseClient
        .from('project_practitioner_matches')
        .update({
          contacted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('project_id', selectedProject.project_id)  // Use project_id (integer), not id (UUID)
        .eq('practitioner_id', practitionerId);

      if (updateContactedError) {
        console.error('[sendConnectionRequest] Error updating contacted_at:', updateContactedError);
      }
    }

    console.log('[sendConnectionRequest] Connection request sent successfully');
    alert('Connection established! Message them in "My Matches".');

  } catch (error) {
    console.error('[sendConnectionRequest] Exception:', error);
  }
}

// ============================================================================
// PAGINATION
// ============================================================================

function updatePaginationButtons(totalPages) {
  const currentPageEl = document.getElementById('current-page');
  const totalPagesEl = document.getElementById('total-pages');
  const prevBtn = document.getElementById('prev-page');
  const nextBtn = document.getElementById('next-page');

  currentPageEl.textContent = currentPage;
  totalPagesEl.textContent = totalPages;

  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage === totalPages;
}

function updatePagination() {
  displayPractitioners();
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

function setupEventListeners() {
  // Service filters
  document.querySelectorAll('.service-filter').forEach(checkbox => {
    checkbox.addEventListener('change', () => applyFilters());
  });

  // Sort selector
  document.getElementById('sort-selector').addEventListener('change', () => applySorting());

  // Modal close buttons
  document.querySelector('.modal__close').addEventListener('click', () => {
    document.getElementById('practitioner-modal').classList.remove('active');
  });

  document.getElementById('practitioner-modal').querySelector('.modal__overlay').addEventListener('click', () => {
    document.getElementById('practitioner-modal').classList.remove('active');
  });

  document.getElementById('modal-close').addEventListener('click', () => {
    document.getElementById('practitioner-modal').classList.remove('active');
  });

  // Back button
  const backButton = document.getElementById('back-to-projects');
  if (backButton) {
    console.log('[setupEventListeners] Back button found, attaching click handler');
    backButton.addEventListener('click', () => {
      console.log('[Back Button] Navigating to my-projects.html');
      window.location.href = 'my-projects.html';
    });
  } else {
    console.error('[setupEventListeners] Back button with id "back-to-projects" not found');
  }

  // Pagination
  document.getElementById('prev-page').addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      displayPractitioners();
    }
  });

  document.getElementById('next-page').addEventListener('click', () => {
    const totalPages = Math.ceil(filteredPractitioners.length / practitionersPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      displayPractitioners();
    }
  });
}

// ============================================================================
// UTILITIES
// ============================================================================

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).replace('-', ' ');
}

/**
 * Navigate to practitioner profile page
 */
function navigateToPractitionerProfile(practitionerId) {
  console.log('[Find Practitioners] Navigating to profile for practitioner:', practitionerId);
  if (!practitionerId) {
    console.error('[Find Practitioners] No practitioner ID provided');
    return;
  }
  const profileUrl = `/rooted-vitality/dashboard/pro/pages/practitioner-profile.html?practitioner_id=${practitionerId}`;
  console.log('[Find Practitioners] Navigating to:', profileUrl);
  window.location.href = profileUrl;
}

// ============================================================================
// PAGE INITIALIZATION
// ============================================================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePage);
} else {
  initializePage();
}

