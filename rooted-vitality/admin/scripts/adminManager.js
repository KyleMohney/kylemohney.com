/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: adminManager.js                                             ║
║  Purpose: Admin Core Operations (User Management, Data Operations) ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

TABLE OF CONTENTS
  1. DASHBOARD INITIALIZATION
  2. USER MANAGEMENT & ACTIONS
  3. USER DETAIL RETRIEVAL
  4. DATA OPERATIONS
  5. NOTIFICATIONS

═══════════════════════════════════════════════════════════════════════════════
*/

let currentSelectedUser = null;

// ═══════════════════════════════════════════════════════════════════════════════
// 1. DASHBOARD INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Initialize dashboard stats
 */
async function initializeDashboard() {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    // Direct query method - Edge Function not deployed
    
    const [practCount, clientCount, projectCount, hiredCount] = await Promise.all([
      supabase
        .from('practitioners')
        .select('*', { count: 'exact', head: true }),
      
      supabase
        .from('clients')
        .select('*', { count: 'exact', head: true }),
      
      supabase
        .from('projects')
        .select('*', { count: 'exact', head: true }),
      
      supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .not('hired_practitioner_serial', 'is', null),
    ]);

    const stats = {
      practitioners: practCount.count || 0,
      clients: clientCount.count || 0,
      projects: projectCount.count || 0,
      hired: hiredCount.count || 0,
    };

    const totalUsers = (stats.clients || 0) + (stats.practitioners || 0);

    // Update dashboard cards
    document.getElementById('stat-total-users').textContent = totalUsers.toLocaleString();
    document.getElementById('stat-practitioners').textContent = (stats.practitioners || 0).toLocaleString();
    document.getElementById('stat-clients').textContent = (stats.clients || 0).toLocaleString();
    document.getElementById('stat-requests').textContent = (stats.projects || 0).toLocaleString();
    document.getElementById('stat-hired').textContent = (stats.hired || 0).toLocaleString();
  } catch (error) {
    console.error('[Admin Manager] Dashboard init error:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. USER MANAGEMENT & ACTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Display user details on the Details page
 */
function displayUserDetails(user) {
  try {
    currentSelectedUser = user;
    const container = document.getElementById('user-details-container');
    const noUserMsg = document.getElementById('no-user-selected');

    // Show details container, hide "no user" message
    container.style.display = 'block';
    noUserMsg.style.display = 'none';

    // Populate basic info
    document.getElementById('detail-name').textContent = user.name || '-';
    document.getElementById('detail-email').textContent = user.email || '-';
    document.getElementById('detail-type').textContent = user.user_type === 'practitioner' ? '👩‍⚕️ Practitioner' : '👤 Client';
    document.getElementById('detail-id').textContent = user.id || '-';
    document.getElementById('detail-created').textContent = formatDate(user.created_at) || '-';
    document.getElementById('detail-status').textContent = user.status === 'banned' ? '🚫 Banned' : user.status === 'suspended' ? '⏸ Suspended' : '✅ Active';

    // Show/hide sections based on user type
    const practSection = document.getElementById('practitioner-section');
    const clientSection = document.getElementById('client-section');

    if (user.user_type === 'practitioner') {
      practSection.style.display = 'block';
      clientSection.style.display = 'none';
      // TODO: Populate practitioner data
    } else {
      practSection.style.display = 'none';
      clientSection.style.display = 'block';
      // TODO: Populate client data
    }
  } catch (error) {
    console.error('[Admin Manager] Error displaying user details:', error);
  }
}

/**
 * Ban a user account
 */
async function banUser() {
  if (!currentSelectedUser) return;

  const confirmed = confirm(`Ban user ${currentSelectedUser.email}? This action is permanent.`);
  if (!confirmed) return;

  try {
    const supabase = getSupabaseClient();
    const table = currentSelectedUser.user_type === 'practitioner' ? 'practitioners' : 'clients';

    const { error } = await supabase
      .from(table)
      .update({ status: 'banned', updated_at: new Date().toISOString() })
      .eq('id', currentSelectedUser.id);

    if (error) throw error;

    currentSelectedUser.status = 'banned';
    document.getElementById('detail-status').textContent = '🚫 Banned';
    showNotification('User banned successfully', 'success');
  } catch (error) {
    console.error('[Admin Manager] Ban user error:', error);
    showNotification('Failed to ban user', 'error');
  }
}

/**
 * Suspend a user account
 */
async function suspendUser() {
  if (!currentSelectedUser) return;

  const confirmed = confirm(`Suspend user ${currentSelectedUser.email}? They will not be able to log in.`);
  if (!confirmed) return;

  try {
    const supabase = getSupabaseClient();
    const table = currentSelectedUser.user_type === 'practitioner' ? 'practitioners' : 'clients';

    const { error } = await supabase
      .from(table)
      .update({ status: 'suspended', updated_at: new Date().toISOString() })
      .eq('id', currentSelectedUser.id);

    if (error) throw error;

    currentSelectedUser.status = 'suspended';
    document.getElementById('detail-status').textContent = '⏸ Suspended';
    showNotification('User suspended successfully', 'success');
  } catch (error) {
    console.error('[Admin Manager] Suspend user error:', error);
    showNotification('Failed to suspend user', 'error');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. USER DETAIL RETRIEVAL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * View practitioner billing history
 */
async function viewBillingHistory() {
  if (!currentSelectedUser || currentSelectedUser.user_type !== 'practitioner') return;
  
  // TODO: Implement billing history modal/page
  showNotification('Billing history view coming soon', 'info');
}

/**
 * View match history
 */
async function viewMatchHistory() {
  if (!currentSelectedUser || currentSelectedUser.user_type !== 'practitioner') return;
  
  // TODO: Implement match history modal/page
  showNotification('Match history view coming soon', 'info');
}

/**
 * View client projects
 */
async function viewProjects() {
  if (!currentSelectedUser || currentSelectedUser.user_type !== 'client') return;
  
  // TODO: Implement projects modal/page
  showNotification('Projects view coming soon', 'info');
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. DATA OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get Supabase client (from adminAuth.js global)
 */
function getSupabaseClient() {
  // Use global supabaseClient from adminAuth.js
  if (typeof supabaseClient !== 'undefined') {
    return supabaseClient;
  }
  console.warn('[Admin Manager] Supabase client not initialized');
  return null;
}

/**
 * Format date for display
 */
function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Show notification message
 */
function showNotification(message, type = 'info') {
  // TODO: Implement toast notification UI
  // For now, just use console and alert as fallback
  if (type === 'error') {
    alert('Error: ' + message);
  }
}

// Initialize on document ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
    
    // Setup detail page action buttons
    const banBtn = document.getElementById('ban-user-btn');
    const suspendBtn = document.getElementById('suspend-user-btn');
    
    if (banBtn) banBtn.addEventListener('click', banUser);
    if (suspendBtn) suspendBtn.addEventListener('click', suspendUser);
  });
} else {
  initializeDashboard();
  
  const banBtn = document.getElementById('ban-user-btn');
  const suspendBtn = document.getElementById('suspend-user-btn');
  
  if (banBtn) banBtn.addEventListener('click', banUser);
  if (suspendBtn) suspendBtn.addEventListener('click', suspendUser);
}
