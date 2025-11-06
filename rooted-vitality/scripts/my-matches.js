/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: scripts/my-matches.js                                        ║
║  Purpose: My Matches page logic (show accepted connections)        ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

FUNCTIONALITY:
- Load client's practitioner connections from database
- Display only practitioners they've connected with
- Filter by connection status (pending, accepted, declined)
- Sort by recent, rating, or name
- Show connection status badges
- Modal view for detailed practitioner info
- Pagination for large result sets
*/

let supabaseClient;
let authManager;
let currentUser = null;
let currentPage = 1;
const itemsPerPage = 10;
let allMatches = [];
let filteredMatches = [];

document.addEventListener('DOMContentLoaded', async () => {
  try {
    supabaseClient = window.supabaseClient;
    if (!supabaseClient) {
      console.error('Supabase client not initialized');
      return;
    }

    authManager = window.authManager;
    currentUser = authManager.getCurrentUser();

    if (!currentUser) {
      window.location.href = '/rooted-vitality/signup.html';
      return;
    }

    // Load client profile
    const { data: clientProfile, error: clientError } = await supabaseClient
      .from('clients')
      .select('serial_number')
      .eq('user_id', currentUser.id)
      .single();

    if (clientError || !clientProfile) {
      console.error('[My Matches] No client profile found');
      showNotification('Please complete your client profile first', 'error');
      return;
    }

    console.log('[My Matches] Client serial number:', clientProfile.serial_number);

    // Load matches
    await loadMatches(clientProfile.serial_number);

    // Initialize handlers
    initFilterHandlers();
    initModalHandlers();

  } catch (error) {
    console.error('Error initializing My Matches page:', error);
  }
});

// ========================================== 
// LOAD MATCHES
// ========================================== 

async function loadMatches(clientSerial) {
  try {
    const { data, error } = await supabaseClient
      .from('project_practitioner_matches')
      .select(`
        id,
        practitioner_serial,
        status,
        created_at,
        practitioners(
          id,
          serial_number,
          dba_name,
          legal_name,
          bio,
          modalities,
          rating,
          in_person_enabled,
          housecalls_enabled,
          virtual_enabled,
          timezone,
          email,
          phone
        )
      `)
      .eq('client_serial', clientSerial)
      .order('created_at', { ascending: false });

    if (error) throw error;

    allMatches = data || [];
    filteredMatches = [...allMatches];

    // Update total count
    document.getElementById('total-connections').textContent = allMatches.length;

    // Display matches
    displayMatches(1);

  } catch (error) {
    console.error('Error loading matches:', error);
    showNotification('Failed to load matches', 'error');
  }
}

function displayMatches(page) {
  currentPage = page;
  const container = document.getElementById('matches-container');
  const startIdx = (page - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const pageMatches = filteredMatches.slice(startIdx, endIdx);

  if (pageMatches.length === 0) {
    container.innerHTML = `
      <div class="matches-empty">
        <p>No connections found.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  pageMatches.forEach(match => {
    const card = createMatchCard(match);
    container.appendChild(card);
  });

  // Update showing count
  document.getElementById('showing-count').textContent = 
    filteredMatches.length > 0 ? `${pageMatches.length} of ${filteredMatches.length}` : '0';

  // Show/hide pagination
  const paginationContainer = document.getElementById('pagination-container');
  const totalPages = Math.ceil(filteredMatches.length / itemsPerPage);
  
  if (totalPages > 1) {
    paginationContainer.style.display = 'flex';
    renderPagination(totalPages);
  } else {
    paginationContainer.style.display = 'none';
  }
}

function createMatchCard(match) {
  const practitioner = match.practitioners;
  if (!practitioner) return document.createElement('div');

  const displayName = practitioner.dba_name || practitioner.legal_name || 'Practitioner';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase();

  const statusLabel = {
    pending: 'Pending',
    accepted: 'Connected',
    declined: 'Declined'
  }[match.status] || match.status;

  const statusClass = `match-card__status-indicator--${match.status}`;
  const services = [
    practitioner.in_person_enabled && 'In-Person',
    practitioner.housecalls_enabled && 'House Calls',
    practitioner.virtual_enabled && 'Virtual'
  ].filter(Boolean).join(', ');

  const card = document.createElement('div');
  card.className = 'match-card';
  card.innerHTML = `
    <div class="match-card__avatar">${initials}</div>
    
    <div class="match-card__content">
      <div class="match-card__header">
        <div class="match-card__title">
          <h3 class="match-card__name">${escapeHtml(displayName)}</h3>
          <p class="match-card__specialty">${escapeHtml(practitioner.modalities?.join(', ') || 'Holistic Practitioner')}</p>
        </div>
        <span class="match-card__status-indicator ${statusClass}">${statusLabel}</span>
      </div>

      <div class="match-card__rating">
        ${'⭐'.repeat(Math.round(practitioner.rating || 4))} (${practitioner.rating || 4}.0)
      </div>

      <div class="match-card__meta">
        <div class="match-card__meta-item">📍 ${services || 'Services TBD'}</div>
        <div class="match-card__meta-item">🕐 ${practitioner.timezone || 'Timezone TBD'}</div>
      </div>

      <p class="match-card__bio">${escapeHtml(practitioner.bio || 'No bio available')}</p>

      <div class="match-card__actions">
        <button class="match-card__action-btn match-card__action-btn--primary" onclick="openPractitionerModal('${match.id}')">
          View Profile
        </button>
        ${match.status === 'accepted' ? `
          <button class="match-card__action-btn match-card__action-btn--secondary" onclick="sendMessage('${match.id}')">
            Message
          </button>
        ` : ''}
      </div>
    </div>
  `;

  return card;
}

// ========================================== 
// FILTERS & SORTING
// ========================================== 

function initFilterHandlers() {
  const statusFilter = document.getElementById('filter-status');
  const serviceFilter = document.getElementById('filter-service-type');
  const resetBtn = document.getElementById('btn-reset-filters');
  const sortSelect = document.getElementById('sort-connections');

  statusFilter.addEventListener('change', applyFilters);
  serviceFilter.addEventListener('change', applyFilters);
  sortSelect.addEventListener('change', applySorting);
  
  resetBtn.addEventListener('click', () => {
    statusFilter.value = '';
    serviceFilter.value = '';
    sortSelect.value = 'recent';
    applyFilters();
  });
}

function applyFilters() {
  const statusFilter = document.getElementById('filter-status').value;
  const serviceFilter = document.getElementById('filter-service-type').value;

  filteredMatches = allMatches.filter(match => {
    const matchStatus = !statusFilter || match.status === statusFilter;
    const matchService = !serviceFilter || hasService(match.practitioners, serviceFilter);
    return matchStatus && matchService;
  });

  applySorting();
}

function hasService(practitioner, serviceType) {
  if (serviceType === 'in-person') return practitioner.in_person_enabled;
  if (serviceType === 'house-calls') return practitioner.housecalls_enabled;
  if (serviceType === 'virtual') return practitioner.virtual_enabled;
  return true;
}

function applySorting() {
  const sortValue = document.getElementById('sort-connections').value;

  if (sortValue === 'recent') {
    filteredMatches.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  } else if (sortValue === 'rating') {
    filteredMatches.sort((a, b) => (b.practitioners?.rating || 0) - (a.practitioners?.rating || 0));
  } else if (sortValue === 'name') {
    filteredMatches.sort((a, b) => {
      const nameA = a.practitioners?.dba_name || a.practitioners?.legal_name || '';
      const nameB = b.practitioners?.dba_name || b.practitioners?.legal_name || '';
      return nameA.localeCompare(nameB);
    });
  }

  displayMatches(1);
}

// ========================================== 
// PAGINATION
// ========================================== 

function renderPagination(totalPages) {
  const container = document.getElementById('pagination-container');
  container.innerHTML = '';

  // Previous button
  const prevBtn = document.createElement('button');
  prevBtn.className = 'pagination-btn';
  prevBtn.textContent = '← Prev';
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener('click', () => displayMatches(currentPage - 1));
  container.appendChild(prevBtn);

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.className = 'pagination-btn';
    if (i === currentPage) btn.classList.add('pagination-btn--active');
    btn.textContent = i;
    btn.addEventListener('click', () => displayMatches(i));
    container.appendChild(btn);
  }

  // Next button
  const nextBtn = document.createElement('button');
  nextBtn.className = 'pagination-btn';
  nextBtn.textContent = 'Next →';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener('click', () => displayMatches(currentPage + 1));
  container.appendChild(nextBtn);
}

// ========================================== 
// MODAL HANDLERS
// ========================================== 

function initModalHandlers() {
  const modal = document.getElementById('practitioner-modal');
  const closeBtn = document.querySelector('.modal__close');
  const cancelBtns = document.querySelectorAll('.modal-cancel');
  const overlay = document.querySelector('.modal__overlay');

  closeBtn.addEventListener('click', () => {
    modal.classList.add('modal--hidden');
  });

  cancelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modal.classList.add('modal--hidden');
    });
  });

  overlay.addEventListener('click', () => {
    modal.classList.add('modal--hidden');
  });
}

function openPractitionerModal(matchId) {
  const match = allMatches.find(m => m.id === matchId);
  if (!match || !match.practitioners) return;

  const p = match.practitioners;
  const displayName = p.dba_name || p.legal_name || 'Practitioner';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase();

  document.getElementById('modal-avatar').textContent = initials;
  document.getElementById('modal-name').textContent = displayName;
  document.getElementById('modal-specialty').textContent = p.modalities?.join(', ') || 'Holistic Practitioner';
  document.getElementById('modal-rating').textContent = `${'⭐'.repeat(Math.round(p.rating || 4))} (${p.rating || 4}.0 Rating)`;
  
  const statusLabel = {
    pending: 'Pending Review',
    accepted: 'Connected',
    declined: 'Declined'
  }[match.status] || match.status;
  const statusClass = `status-${match.status}`;
  document.getElementById('modal-status').innerHTML = `<span class="match-card__status-indicator ${statusClass}">${statusLabel}</span>`;

  document.getElementById('modal-bio').textContent = p.bio || 'No bio available';

  // Services offered
  const services = [
    p.in_person_enabled && 'In-Person Sessions',
    p.housecalls_enabled && 'House Calls',
    p.virtual_enabled && 'Virtual Sessions'
  ].filter(Boolean);
  document.getElementById('modal-services').innerHTML = services.length > 0 
    ? `<ul style="margin: 0; padding-left: 1.25rem;"><li>${services.join('</li><li>')}</li></ul>`
    : '—';

  // Availability
  document.getElementById('modal-availability').innerHTML = `
    <div style="font-size: 0.95rem; line-height: 1.6; color: #555;">
      <p><strong>Timezone:</strong> ${p.timezone || 'Not specified'}</p>
      <p><strong>Modalities:</strong> ${p.modalities?.join(', ') || 'Not specified'}</p>
    </div>
  `;

  // Contact
  document.getElementById('modal-contact').innerHTML = `
    <div style="font-size: 0.95rem; line-height: 1.6; color: #555;">
      <p><strong>Email:</strong> ${p.email ? `<a href="mailto:${p.email}">${p.email}</a>` : 'Not available'}</p>
      <p><strong>Phone:</strong> ${p.phone || 'Not available'}</p>
    </div>
  `;

  // Update button based on status
  const messageBtn = document.getElementById('btn-message');
  if (match.status === 'accepted') {
    messageBtn.textContent = 'Send Message';
    messageBtn.onclick = () => sendMessage(matchId);
  } else if (match.status === 'pending') {
    messageBtn.textContent = 'Pending Response';
    messageBtn.disabled = true;
  } else {
    messageBtn.textContent = 'Connection Declined';
    messageBtn.disabled = true;
  }

  const modal = document.getElementById('practitioner-modal');
  modal.classList.remove('modal--hidden');
}

function sendMessage(matchId) {
  // TODO: Implement messaging system
  showNotification('Messaging feature coming soon!', 'info');
}

// ========================================== 
// UTILITIES
// ========================================== 

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showNotification(message, type = 'info') {
  console.log(`[${type.toUpperCase()}] ${message}`);
  // TODO: Implement toast notification UI
}
