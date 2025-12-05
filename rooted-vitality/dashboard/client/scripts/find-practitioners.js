/*
================================================================================
  ROOTED VITALITY, INC.
  File: find-practitioners.js
  Purpose: Practitioner directory with filtering and connection
  Holistic Wellness · Modern Connection Platform
  rootedvitality.com | 2025
================================================================================

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
  initializePage();
});

async function initializePage() {
  try {

    // Wait for auth initialization - check authManager
    if (typeof window.authManager === 'undefined') {
      setTimeout(initializePage, 100);
      return;
    }

    const userData = window.authManager.getCurrentUser();
    if (!userData) {
      setTimeout(initializePage, 100);
      return;
    }

    supabaseClient = window.supabaseClient;
    currentUser = userData;

    // Load project and set up event listeners
    await loadProject();
    setupEventListeners();

  } catch (error) {
    console.error('[Find Practitioners] Initialization error:', error);
  }
}

// ============================================================================
// PROJECT LOADING
// ============================================================================

async function loadProject() {
  try {

    // Get project_id from URL
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('project_id');

    if (!projectId) {
      console.error('[loadProject] No project ID in URL');
      showEmptyState('No Wellness', 'Please select a wellness journey from My Wellness');
      return;
    }

    // Get project - explicitly select all fields including project_serial (INTEGER for matching)
    const { data: project, error: projectError } = await supabaseClient
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

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
    
    // Get all matches for this client ON THIS PROJECT ONLY
    // project_practitioner_matches.project_serial is INTEGER (project serial number)
    const { data: matches, error: matchesError } = await supabaseClient
      .from('project_practitioner_matches')
      .select('practitioner_serial')
      .eq('client_serial', clientProfile.serial_number)
      .eq('project_serial', selectedProject.project_serial);
    
    if (matchesError) {
      console.warn('[loadExistingMatches] Error loading matches:', matchesError);
      return;
    }
    
    // Store matched practitioner serials
    matchedPractitioners = (matches || []).map(m => m.practitioner_serial);
  } catch (error) {
    console.error('[loadExistingMatches] Exception:', error);
  }
}

// ============================================================================
// PRACTITIONER LOADING & FILTERING
// ============================================================================

async function loadPractitioners(project) {
  try {

    // Try to call the matching algorithm function (RPC)
    // Note: RPC expects project UUID (project.id), not the serial number
    let practitioners = [];
    const { data: rpcData, error: rpcError } = await supabaseClient
      .rpc('match_practitioners', { p_project_id: project.id });
    
    if (rpcError) {
      console.error('[loadPractitioners] RPC Error Details:', {
        code: rpcError?.code,
        message: rpcError?.message,
        details: rpcError?.details,
        hint: rpcError?.hint
      });

      // Try JavaScript fallback matching
      console.log('[loadPractitioners] Attempting JavaScript fallback matching...');
      const fallbackMatches = await performJavaScriptMatchingFindPractitioners(project);
      
      if (fallbackMatches && fallbackMatches.length > 0) {
        console.log('[loadPractitioners] Fallback matching succeeded with', fallbackMatches.length, 'matches');
        practitioners = fallbackMatches;
      } else {
        console.error('[loadPractitioners] Fallback matching also failed. Matching system unavailable.');
        
        // Show error state - matching function not available
        showEmptyState(
          'Matching System Unavailable',
          'The practitioner matching system is currently being deployed. Please try again in a few moments.'
        );
        filteredPractitioners = [];
        return;
      }
    } else {
      practitioners = rpcData || [];
    }
    
    // Enrich practitioners with profile data (photos, badges, etc)
    await enrichPractitionersWithProfileData(practitioners);
    
    allPractitioners = practitioners;

    // Update project info display
    updateProjectInfo(project);

    // Apply filters and display
    applyFilters();
    displayPractitioners();
    
  } catch (error) {
    console.error('[loadPractitioners] Exception:', error);
  }
}

/**
 * Enrich practitioners with profile data from practitioner_profiles table
 * and credentials data from practitioner_credentials table
 * This adds photos, badges, and other profile fields needed for display
 */
async function enrichPractitionersWithProfileData(practitioners) {
  if (!practitioners || practitioners.length === 0) return;

  try {

    // Get serial numbers to fetch profiles
    const serialNumbers = practitioners.map(p => p.serial_number);

    // Fetch profile data for all practitioners at once
    const { data: profiles, error: profileError } = await supabaseClient
      .from('practitioner_profiles')
      .select('practitioner_serial, practice_logo_url, bio')
      .in('practitioner_serial', serialNumbers);

    if (profileError) {
      console.warn('[enrichPractitionersWithProfileData] Error fetching profiles:', profileError);
      // Continue without profiles - not critical
    }

    // Fetch credentials data for badges
    const { data: credentials, error: credentialsError } = await supabaseClient
      .from('practitioner_credentials')
      .select('practitioner_serial, credentials_verified, badge_licensed, badge_certified, background_check_status')
      .in('practitioner_serial', serialNumbers);

    if (credentialsError) {
      console.warn('[enrichPractitionersWithProfileData] Error fetching credentials:', credentialsError);
      // Continue without credentials - not critical
    }

    // Fetch reviews count for each practitioner
    const { data: reviews, error: reviewsError } = await supabaseClient
      .from('reviews')
      .select('practitioner_serial, rating')
      .in('practitioner_serial', serialNumbers);

    if (reviewsError) {
      console.warn('[enrichPractitionersWithProfileData] Error fetching reviews:', reviewsError);
      // Continue without reviews - not critical
    }

    // Create lookup maps for quick access
    const profileMap = {};
    profiles?.forEach(profile => {
      profileMap[profile.practitioner_serial] = profile;
    });

    const credentialsMap = {};
    credentials?.forEach(cred => {
      credentialsMap[cred.practitioner_serial] = cred;
    });

    const reviewsMap = {};
    reviews?.forEach(review => {
      if (!reviewsMap[review.practitioner_serial]) {
        reviewsMap[review.practitioner_serial] = { count: 0, totalRating: 0 };
      }
      reviewsMap[review.practitioner_serial].count += 1;
      reviewsMap[review.practitioner_serial].totalRating += (review.rating || 0);
    });

    // Merge profile and credentials data into practitioners
    practitioners.forEach(practitioner => {
      const profile = profileMap[practitioner.serial_number];
      const cred = credentialsMap[practitioner.serial_number];
      const reviewData = reviewsMap[practitioner.serial_number];

      if (profile) {
        // Add profile fields to practitioner object
        practitioner.profile_photo_url = profile.practice_logo_url;
        
        // Use profile bio if available, otherwise empty (card will handle)
        if (profile.bio && !practitioner.bio) {
          practitioner.bio = profile.bio;
        }
      } else {
        // Ensure photo field exists even without profile data
        practitioner.profile_photo_url = null;
      }

      if (cred) {
        // Add credentials/badge fields to practitioner object
        practitioner.credentials_verified = cred.credentials_verified;
        practitioner.badge_licensed = cred.badge_licensed;
        practitioner.badge_certified = cred.badge_certified;
        practitioner.background_check_status = cred.background_check_status;
      }

      // Add reviews count and calculate average rating
      if (reviewData) {
        practitioner.reviews_count = reviewData.count;
        practitioner.rating = reviewData.totalRating / reviewData.count;
      } else {
        practitioner.reviews_count = 0;
        practitioner.rating = 0;
      }
    });

  } catch (error) {
    console.error('[enrichPractitionersWithProfileData] Exception:', error);
    // Continue without enrichment - it's not critical
  }
}

function updateProjectInfo(project) {
  // Update project name/title
  const projectName = document.getElementById('project-name');
  if (projectName) {
    projectName.textContent = project.custom_name || `${project.category_name} Project`;
  }

  // Update category
  const projectCategory = document.getElementById('project-category');
  if (projectCategory) {
    projectCategory.textContent = project.category_name;
  }

  // Update description
  const projectDescription = document.getElementById('project-description');
  if (projectDescription) {
    projectDescription.textContent = project.description;
  }

  // Update location
  const locationDisplay = document.getElementById('project-location');
  if (locationDisplay) {
    const city = project.city || '';
    const state = project.state || '';
    const zipcode = project.zipcode || '';
    const locationText = [city, state, zipcode].filter(Boolean).join(', ') || 'Not specified';
    locationDisplay.textContent = locationText;
  }

  // Update travel preference (session type)
  const preferenceDisplay = document.getElementById('project-preference');
  if (preferenceDisplay) {
    const preference = capitalizeFirst(project.travel_preference);
    preferenceDisplay.textContent = preference;
  }

  selectedProject = project;
}

/**
 * Refresh the practitioner search for the current project
 */
async function refreshSearch() {
  if (!selectedProject) {
    console.warn('[refreshSearch] No project selected');
    return;
  }
  
  // Show loading state
  const refreshBtn = document.getElementById('refresh-search');
  const originalText = refreshBtn.textContent;
  refreshBtn.textContent = 'Searching...';
  refreshBtn.disabled = true;

  try {
    // Reload practitioners
    await loadPractitioners(selectedProject);
    
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

  if (filteredPractitioners.length === 0) {
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

  // Clear and populate grid
  grid.innerHTML = '';
  pageData.forEach(practitioner => {
    grid.appendChild(createPractitionerCard(practitioner));
  });

  // Attach event listeners to View Profile buttons
  document.querySelectorAll('.card-btn--view').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const practitionerId = this.dataset.practitionerId;
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
  const isMatched = matchedPractitioners.includes(practitioner.serial_number);
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
  
  
  if (practitioner.credentials_verified) {
    badges.push('<li class="badge-item"><span class="badge-check">✔</span> Verified</li>');
  }
  if (practitioner.badge_licensed) {
    badges.push('<li class="badge-item"><span class="badge-check">✔</span> Licensed</li>');
  }
  if (practitioner.badge_certified) {
    badges.push('<li class="badge-item"><span class="badge-check">✔</span> Certified</li>');
  }
  if (practitioner.background_check_status === 'passed') {
    badges.push('<li class="badge-item"><span class="badge-check">✔</span> Background Check</li>');
  }
  
  const badgesHtml = badges.length > 0 ? `<ul class="card-header-badges">${badges.join('')}</ul>` : '';

  card.innerHTML = `
    ${isMatched ? '<div class="matched-overlay"><div class="matched-label">Matched</div></div>' : ''}
    <div class="card-header">
      <div class="card-avatar-section">
        <div class="card-avatar-container">
          <img src="${practitioner.profile_photo_url || 'https://via.placeholder.com/140?text=No+Photo'}" 
               alt="${displayName}"
               class="card-avatar"
               onerror="this.src='https://via.placeholder.com/140?text=No+Photo'">
          ${badgesHtml}
        </div>
      </div>
    </div>

    <div class="card-body">
      <h3 class="card-name">${displayName}</h3>
      <p class="card-specialty">Holistic Practitioner</p>

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
        <button class="card-btn card-btn--view" data-practitioner-id="${practitioner.id}" data-practitioner-serial="${practitioner.serial_number}">View Profile</button>
        <button class="card-btn card-btn--connect" data-practitioner-id="${practitioner.id}" data-practitioner-serial="${practitioner.serial_number}">Connect</button>
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
  document.getElementById('modal-specialty').textContent = 'Holistic Practitioner';
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
      { p_project_id: selectedProject.id }  // Use project UUID
    );

    if (!matchQueryError && matchData && matchData.length > 0) {
      const practitionerMatch = matchData.find(m => m.serial_number === practitionerSerial);
      if (practitionerMatch) {
        matchScore = practitionerMatch.match_score ?? 75;
      }
    }


    // Use RPC function to bypass RLS policy
    const { data, error } = await supabaseClient
      .rpc('create_practitioner_match', {
        p_project_serial: parseInt(selectedProject.project_serial),
        p_client_serial: selectedProject.client_serial,
        p_practitioner_serial: practitionerSerial,
        p_match_score: matchScore
      });
    
    if (error) {
      console.error('[sendConnectionRequest] Error:', error);
      console.error('[sendConnectionRequest] Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        status: error?.status
      });
      console.error('[sendConnectionRequest] Parameters sent:', {
        p_project_serial: parseInt(selectedProject.project_serial),
        p_client_serial: selectedProject.client_serial,
        p_practitioner_serial: practitionerSerial,
        p_match_score: matchScore
      });
      alert('Error sending connection request: ' + (error?.message || 'Unknown error'));
      return;
    }
    
    // Log the returned status from RPC
    if (data && data[0]) {
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

    // Create auto-message via RPC
    const clientName = clientData.first_name || 'Client';
    const messageText = `${clientName} wants connect about their wellness project!`;

    const { error: messageError } = await supabaseClient
      .rpc('create_project_message', {
        p_project_id: selectedProject.id,  // UUID of project
        p_practitioner_id: practitionerId,  // UUID of practitioner
        p_client_id: clientData.id,  // UUID of client
        p_sender_id: clientData.id,  // Client is sender of auto-message
        p_sender_type: 'client',
        p_message: messageText
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
        .eq('project_serial', selectedProject.project_serial)
        .eq('practitioner_serial', practitionerSerial);

      if (updateContactedError) {
        console.error('[sendConnectionRequest] Error updating contacted_at:', updateContactedError);
      }
    }
    
    // Notify practitioner of new match request (respects their notification preferences)
    if (window.notifyPractitionerOfNewMatch && typeof window.notifyPractitionerOfNewMatch === 'function') {
      const projectName = selectedProject.custom_name || selectedProject.category_name || 'your wellness project';
      const clientName = clientData.first_name || 'A client';
      await window.notifyPractitionerOfNewMatch({
        practitionerSerial: practitionerSerial,
        clientName: clientName,
        projectName: projectName,
        matchScore: matchScore
      });
    }
    
    // Redirect to My Matches page
    window.location.href = `/rooted-vitality/dashboard/client/pages/inbox.html?project_id=${selectedProject.id}&practitioner_serial=${practitionerSerial}`;

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
    backButton.addEventListener('click', () => {
      window.location.href = 'my-wellness.html';
    });
  } else {
    console.error('[setupEventListeners] Back button with id "back-to-projects" not found');
  }

  // Refresh button
  const refreshBtn = document.getElementById('refresh-search');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      refreshSearch();
    });
  }

  // Clear filters button
  const clearFiltersBtn = document.getElementById('clear-filters');
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      // Reset filters and refresh display
      applyFilters();
    });
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
// FALLBACK MATCHING (JavaScript implementation when RPC unavailable)
// ============================================================================

/**
 * Fallback: JavaScript-based practitioner matching when RPC is unavailable
 * Implements the same logic as the SQL match_practitioners function
 */
async function performJavaScriptMatchingFindPractitioners(project) {
  try {
    // Get active practitioners with matching_enabled = true
    const { data: practitioners, error: practError } = await supabaseClient
      .from('practitioners')
      .select('*')
      .eq('deleted_at', null)
      .eq('matching_enabled', true)
      .eq('matching_paused', false);

    if (practError || !practitioners) {
      console.error('[Fallback Matching] Error fetching practitioners:', practError);
      return [];
    }

    // Filter practitioners with active membership
    const { data: memberships } = await supabaseClient
      .from('memberships')
      .select('practitioner_id')
      .eq('status', 'active');

    const activePractitionerIds = new Set(memberships?.map(m => m.practitioner_id) || []);

    // Apply matching filters
    const matches = practitioners
      .filter(p => activePractitionerIds.has(p.id))
      .filter(p => {
        // Check category match
        const categoryIds = p.service_category_ids || [];
        if (!categoryIds.includes(project.category_id)) {
          return false;
        }

        // Check subcategory match if specified
        if (project.subcategory_name) {
          const projectSubs = project.subcategory_name
            .split(',')
            .map(s => s.trim())
            .filter(s => s);
          const practSubs = p.service_subcategory_names || [];
          const hasMatch = projectSubs.some(s => practSubs.includes(s));
          if (!hasMatch && projectSubs.length > 0) {
            return false;
          }
        }

        // Check travel preference match
        const travelPrefs = project.travel_preference || 'flexible';
        if (travelPrefs === 'in-person' && !p.in_person_enabled) return false;
        if (travelPrefs === 'housecalls' && !p.housecalls_enabled) return false;
        if (travelPrefs === 'virtual' && !p.virtual_enabled) return false;

        // Check geography match if not virtual or virtual coverage
        if (travelPrefs === 'in-person') {
          if (project.zipcode !== p.in_person_base_zipcode) {
            const inPersonZips = p.in_person_zipcodes || [];
            if (!inPersonZips.includes(project.zipcode)) {
              return false;
            }
          }
        } else if (travelPrefs === 'housecalls') {
          if (project.zipcode !== p.housecalls_base_zipcode) {
            const housecallZips = p.housecalls_zipcodes || [];
            if (!housecallZips.includes(project.zipcode)) {
              return false;
            }
          }
        } else if (travelPrefs === 'virtual') {
          const virtualStates = p.virtual_states || [];
          if (virtualStates.length > 0 && !virtualStates.includes(project.state)) {
            return false;
          }
        }

        return true;
      })
      .map(p => ({
        id: p.id,
        serial_number: p.serial_number,
        legal_name: p.legal_name,
        dba_name: p.dba_name || p.legal_name,
        email: p.email,
        phone: p.phone,
        match_score: 50  // Default score for fallback
      }));

    return matches;
  } catch (error) {
    console.error('[Fallback Matching] Exception:', error);
    return [];
  }
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
  if (!practitionerId) {
    console.error('[Find Practitioners] No practitioner ID provided');
    return;
  }
  
  // Include the project_id from selectedProject so practitioner profile knows which project to use
  let profileUrl = `/rooted-vitality/dashboard/pro/pages/practitioner-public-profile.html?id=${practitionerId}`;
  if (selectedProject && selectedProject.id) {
    profileUrl += `&project_id=${selectedProject.id}`;
  }
  
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



