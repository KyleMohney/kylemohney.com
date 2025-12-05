/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: practitionerDetails.js                                      ║
║  Purpose: Comprehensive Practitioner Detail View                   ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

TABLE OF CONTENTS
  1. DETAIL VIEW INITIALIZATION & NAVIGATION
  2. DATA FETCHING
  3. DISPLAY RENDERING
  4. HELPER FUNCTIONS
  5. FORMATTING UTILITIES

═══════════════════════════════════════════════════════════════════════════════
*/

// Toggle section collapse/expand
function toggleSection(event) {
  const titleElement = event.currentTarget;
  const section = titleElement.closest('.detail-section');
  if (section) {
    section.classList.toggle('collapsed');
    titleElement.classList.toggle('collapsed');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. DETAIL VIEW INITIALIZATION & NAVIGATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Display practitioner detail view
 */
async function displayPractitionerDetail(practitionerId) {
  try {
    console.log('[Practitioner Detail] Loading practitioner:', practitionerId);
    
    // Hide search results, show detail view
    document.getElementById('page-search-users').style.display = 'none';
    document.getElementById('page-practitioner-detail').style.display = 'block';
    
    // Update sidebar active state
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });

    // Fetch practitioner data
    const data = await fetchPractitionerData(practitionerId);
    
    if (data) {
      renderPractitionerDetail(data);
      console.log('[Practitioner Detail] Rendered successfully');
    }
  } catch (error) {
    console.error('[Practitioner Detail] Error:', error);
    alert('Error loading practitioner details');
  }
}

/**
 * Navigate back to search
 */
function backToSearch() {
  document.getElementById('page-practitioner-detail').style.display = 'none';
  document.getElementById('page-search-users').style.display = 'block';
  
  // Restore sidebar active state
  document.querySelector('[data-page="search-users"]').classList.add('active');
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. DATA FETCHING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Fetch complete practitioner data from backend
 */
async function fetchPractitionerData(practitionerId) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    // Fetch practitioner profile
    const { data: practitioner, error: practError } = await supabase
      .from('practitioners')
      .select('*')
      .eq('id', practitionerId)
      .single();

    if (practError) throw practError;
    if (!practitioner) throw new Error('Practitioner not found');

    // Fetch practitioner profile details
    const { data: profile } = await supabase
      .from('practitioner_profiles')
      .select('*')
      .eq('practitioner_serial', practitioner.serial_number)
      .single();

    // Fetch credentials
    const { data: credentials } = await supabase
      .from('practitioner_credentials')
      .select('*')
      .eq('practitioner_serial', practitioner.serial_number)
      .single();

    // Fetch selected services
    const { data: services } = await supabase
      .from('practitioner_selected_services')
      .select('*')
      .eq('practitioner_serial', practitioner.serial_number);

    // Fetch projects/matches
    const { data: matches } = await supabase
      .from('project_practitioner_matches')
      .select('*')
      .eq('practitioner_serial', practitioner.serial_number);

    // Fetch blocks
    const { data: blocks } = await supabase
      .from('practitioner_blocks')
      .select('*')
      .eq('practitioner_serial', practitioner.serial_number);

    // Fetch memberships
    const { data: memberships } = await supabase
      .from('memberships')
      .select('*')
      .eq('practitioner_serial', practitioner.serial_number);

    return {
      practitioner,
      profile: profile || {},
      credentials: credentials || {},
      services: services || [],
      matches: matches || [],
      blocks: blocks || [],
      memberships: memberships || [],
      reviews: [],
      matchCount: (matches || []).length
    };
  } catch (error) {
    console.error('[Practitioner Detail] Fetch error:', error);
    throw error;
  }
}

/**
 * Get Supabase auth token
 */
async function getSupabaseToken() {
  if (typeof supabaseClient === 'undefined') {
    throw new Error('Supabase client not initialized');
  }
  const { data: { session } } = await supabaseClient.auth.getSession();
  return session?.access_token || '';
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. DISPLAY RENDERING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Render complete practitioner profile
 */
function renderPractitionerDetail(data) {
  const p = data.practitioner;
  const prof = data.profile;
  const cred = data.credentials;

  // HEADER
  document.getElementById('detail-practitioner-name').textContent = 
    p.legal_name || 'Unknown Practitioner';
  document.getElementById('detail-practitioner-serial').textContent = 
    `Serial: ${p.serial_number}`;

  // ─────────────────────────────────────────────────────────────────────────
  // BASIC INFORMATION
  // ─────────────────────────────────────────────────────────────────────────
  document.getElementById('detail-legal-name').textContent = p.legal_name || '—';
  document.getElementById('detail-email').textContent = p.email || '—';
  document.getElementById('detail-phone').textContent = p.phone || '—';
  document.getElementById('detail-serial').textContent = p.serial_number || '—';
  
  // Status badge
  const statusEl = document.getElementById('detail-status');
  statusEl.textContent = formatStatus(p.status);
  statusEl.className = `status-badge ${getStatusClass(p.status)}`;
  
  document.getElementById('detail-created').textContent = 
    formatDate(p.created_at) || '—';
  document.getElementById('detail-last-login').textContent = 
    formatDate(p.last_login) || '—';
  document.getElementById('detail-updated').textContent = 
    formatDate(p.updated_at) || '—';

  // ─────────────────────────────────────────────────────────────────────────
  // BUSINESS INFORMATION
  // ─────────────────────────────────────────────────────────────────────────
  document.getElementById('detail-business-name').textContent = 
    p.legal_business_name || '—';
  document.getElementById('detail-dba-name').textContent = p.dba_name || '—';
  document.getElementById('detail-business-size').textContent = 
    p.business_size || '—';
  document.getElementById('detail-practice-city').textContent = 
    p.practice_city || '—';
  document.getElementById('detail-practice-state').textContent = 
    p.practice_state || '—';
  document.getElementById('detail-timezone').textContent = p.timezone || '—';
  document.getElementById('detail-address').textContent = 
    p.physical_address || '—';
  document.getElementById('detail-zipcode').textContent = p.zipcode || '—';

  // ─────────────────────────────────────────────────────────────────────────
  // SERVICE INFORMATION
  // ─────────────────────────────────────────────────────────────────────────
  document.getElementById('detail-service-categories').innerHTML = 
    formatArray(p.service_category_names);
  document.getElementById('detail-service-subcategories').innerHTML = 
    formatArray(p.service_subcategory_names);
  document.getElementById('detail-pricing').textContent = 
    p.pricing ? JSON.stringify(p.pricing, null, 2) : '—';

  // ─────────────────────────────────────────────────────────────────────────
  // SERVICE MODES
  // ─────────────────────────────────────────────────────────────────────────
  document.getElementById('detail-virtual').innerHTML = 
    formatBoolean(p.virtual_enabled);
  document.getElementById('detail-virtual-states').innerHTML = 
    formatArray(p.virtual_states);
  document.getElementById('detail-in-person').innerHTML = 
    formatBoolean(p.in_person_enabled);
  document.getElementById('detail-in-person-zipcode').textContent = 
    p.in_person_base_zipcode || '—';
  document.getElementById('detail-in-person-radius').textContent = 
    p.in_person_radius_miles ? `${p.in_person_radius_miles} miles` : '—';
  document.getElementById('detail-housecalls').innerHTML = 
    formatBoolean(p.housecalls_enabled);
  document.getElementById('detail-housecalls-zipcode').textContent = 
    p.housecalls_base_zipcode || '—';
  document.getElementById('detail-housecalls-radius').textContent = 
    p.housecalls_radius_miles ? `${p.housecalls_radius_miles} miles` : '—';

  // ─────────────────────────────────────────────────────────────────────────
  // PAYMENT & INSURANCE
  // ─────────────────────────────────────────────────────────────────────────
  document.getElementById('detail-accepts-insurance').innerHTML = 
    formatBoolean(p.accepts_insurance);
  document.getElementById('detail-insurance-providers').innerHTML = 
    formatArray(p.insurance_providers);
  document.getElementById('detail-custom-insurance').textContent = 
    p.custom_insurance_providers || '—';
  document.getElementById('detail-payment-methods').textContent = 
    p.payment_methods || '—';
  document.getElementById('detail-custom-payment').textContent = 
    p.custom_payment_methods || '—';

  // ─────────────────────────────────────────────────────────────────────────
  // PROFILE INFORMATION
  // ─────────────────────────────────────────────────────────────────────────
  document.getElementById('detail-bio').textContent = prof.bio || '—';
  document.getElementById('detail-ethos').textContent = prof.ethos_statement || '—';
  document.getElementById('detail-languages').innerHTML = 
    formatArray(prof.languages);
  document.getElementById('detail-modalities').innerHTML = 
    formatArray(prof.modalities);
  document.getElementById('detail-conditions').innerHTML = 
    formatArray(prof.conditions_treated);
  document.getElementById('detail-practice-type').textContent = 
    prof.practice_type || '—';
  document.getElementById('detail-year-established').textContent = 
    prof.year_established || '—';
  document.getElementById('detail-profile-completeness').textContent = 
    prof.profile_completeness_percent ? `${prof.profile_completeness_percent}%` : '—';

  // ─────────────────────────────────────────────────────────────────────────
  // CREDENTIALS & VERIFICATION
  // ─────────────────────────────────────────────────────────────────────────
  document.getElementById('detail-badge-verified').innerHTML = 
    formatBoolean(cred.badge_verified);
  document.getElementById('detail-badge-certified').innerHTML = 
    formatBoolean(cred.badge_certified);
  document.getElementById('detail-badge-licensed').innerHTML = 
    formatBoolean(cred.badge_licensed);
  document.getElementById('detail-badge-bg-check').innerHTML = 
    formatBoolean(cred.badge_background_check_verified);
  document.getElementById('detail-bg-check-status').textContent = 
    cred.background_check_status || '—';
  document.getElementById('detail-bg-check-date').textContent = 
    formatDate(cred.background_check_date) || '—';
  document.getElementById('detail-bg-check-provider').textContent = 
    cred.background_check_provider || '—';
  document.getElementById('detail-credentials-json').textContent = 
    cred.credentials ? JSON.stringify(cred.credentials, null, 2) : '—';

  // ─────────────────────────────────────────────────────────────────────────
  // MATCHING & STATUS
  // ─────────────────────────────────────────────────────────────────────────
  document.getElementById('detail-matching-enabled').innerHTML = 
    formatBoolean(p.matching_enabled);
  document.getElementById('detail-matching-paused').innerHTML = 
    formatBoolean(p.matching_paused);
  document.getElementById('detail-total-matches').textContent = 
    data.matchCount || '0';
  document.getElementById('detail-blocked-count').textContent = 
    data.blocks.length || '0';
  document.getElementById('detail-deleted').innerHTML = 
    formatBoolean(!!p.deleted_at);
  document.getElementById('detail-deleted-at').textContent = 
    formatDate(p.deleted_at) || '—';

  // ─────────────────────────────────────────────────────────────────────────
  // MEMBERSHIP STATUS
  // ─────────────────────────────────────────────────────────────────────────
  renderMemberships(data.memberships);

  // ─────────────────────────────────────────────────────────────────────────
  // RECENT REVIEWS
  // ─────────────────────────────────────────────────────────────────────────
  renderReviews(data.reviews);
}

/**
 * Render membership information
 */
function renderMemberships(memberships) {
  const container = document.getElementById('membership-info');
  
  if (!memberships || memberships.length === 0) {
    container.innerHTML = '<div class="detail-item"><label>No memberships found</label></div>';
    return;
  }

  container.innerHTML = memberships.map(m => `
    <div class="membership-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
        <strong>Membership #${memberships.indexOf(m) + 1}</strong>
        <span class="membership-status ${m.status.toLowerCase()}">
          ${formatStatus(m.status)}
        </span>
      </div>
      <div style="font-size: 0.9rem; color: var(--text-secondary);">
        <div>Started: ${formatDate(m.started_at) || '—'}</div>
        <div>Created: ${formatDate(m.created_at) || '—'}</div>
        ${m.canceled_at ? `<div>Canceled: ${formatDate(m.canceled_at)}</div>` : ''}
        ${m.re_enrolled_on ? `<div>Re-enrolled: ${formatDate(m.re_enrolled_on)}</div>` : ''}
      </div>
    </div>
  `).join('');
}

/**
 * Render reviews
 */
function renderReviews(reviewData) {
  const container = document.getElementById('reviews-info');
  const reviews = reviewData.data || [];
  const totalCount = reviewData.totalCount || 0;

  if (!reviews || reviews.length === 0) {
    container.innerHTML = `
      <div class="detail-item">
        <label>Total Reviews: ${totalCount}</label>
        <p>No recent reviews available</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="detail-item full-width">
      <label>Total Reviews: ${totalCount} (Showing first ${reviews.length})</label>
    </div>
  ` + reviews.map((r, idx) => `
    <div class="review-card">
      <div style="display: flex; justify-content: space-between; align-items: start;">
        <div>
          <div class="review-rating">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
          <div style="font-size: 0.85rem; font-weight: 600; margin-top: 0.25rem;">
            ${r.client_name || 'Anonymous'}
          </div>
        </div>
        ${r.is_verified ? '<span style="background: #d4f0e8; color: #10b981; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 600;">Verified</span>' : ''}
      </div>
      <div class="review-text">"${r.review_text}"</div>
      <div class="review-meta">
        Project: ${r.project_serial || '—'} | ${formatDate(r.review_date) || formatDate(r.created_at)}
      </div>
    </div>
  `).join('');
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. HELPER FUNCTIONS - FORMATTING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Format date
 */
function formatDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format status
 */
function formatStatus(status) {
  if (!status) return '—';
  return status
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get CSS class for status
 */
function getStatusClass(status) {
  if (!status) return 'inactive';
  const s = status.toLowerCase();
  if (s.includes('active') || s.includes('approved')) return 'active';
  if (s.includes('pending')) return 'pending';
  if (s.includes('deleted') || s.includes('inactive')) return 'deleted';
  return 'pending';
}

/**
 * Format boolean value
 */
function formatBoolean(value) {
  const isTrue = value === true || value === 'true' || value === 1 || value === '1';
  const text = isTrue ? 'Yes' : 'No';
  const className = isTrue ? 'boolean-true' : 'boolean-false';
  return `<div class="${className}">${text}</div>`;
}

/**
 * Format array as tags
 */
function formatArray(arr) {
  if (!arr || !Array.isArray(arr) || arr.length === 0) {
    return '—';
  }
  return `<div class="array-list">${
    arr.map(item => `<span class="array-tag">${item}</span>`).join('')
  }</div>`;
}
