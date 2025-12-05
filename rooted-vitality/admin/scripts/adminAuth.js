/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: adminAuth.js                                                ║
║  Purpose: Admin Panel Authentication & Authorization               ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

TABLE OF CONTENTS
  1. INITIALIZATION
  2. AUTHENTICATION CHECK
  3. LOGOUT
  4. HELPER FUNCTIONS

═══════════════════════════════════════════════════════════════════════════════
*/

// ═══════════════════════════════════════════════════════════════════════════════
// 1. INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

const SUPABASE_URL = 'https://racsktdyrvepyvndbjzs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhY3NrdGR5cnZlcHl2bmRianpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3ODIyNDUsImV4cCI6MjA3NzM1ODI0NX0.5a0HksN7H1r5qBMExzKa9mPY-5uzTcJhffRuc5gNU2M';
const ADMIN_EMAIL_DOMAIN = '@rootedvitality.health';

let supabaseClient;
let currentUser = null;

/**
 * Initialize Supabase and check authentication
 */
async function initializeAdmin() {
  try {
    // Initialize Supabase
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('[Admin Auth] Supabase initialized');

    // Check session
    await checkAuthentication();
  } catch (error) {
    console.error('[Admin Auth] Initialization error:', error);
    showUnauthorized();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. AUTHENTICATION CHECK
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if user is authenticated and authorized
 */
async function checkAuthentication() {
  try {
    // Check for OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('code')) {
      console.log('[Admin Auth] OAuth callback detected, exchanging code for session...');
      // Supabase automatically handles this, just get the session
    }

    const { data, error } = await supabaseClient.auth.getSession();
    
    if (error) {
      console.error('[Admin Auth] Session error:', error);
      redirectToAdminLogin();
      return;
    }

    const session = data?.session;
    if (!session) {
      console.log('[Admin Auth] No active session');
      redirectToAdminLogin();
      return;
    }

    // Get user details
    const { data: userData, error: userError } = await supabaseClient.auth.getUser();
    if (userError) {
      console.error('[Admin Auth] User fetch error:', userError);
      redirectToAdminLogin();
      return;
    }

    const user = userData?.user;
    if (!user) {
      console.log('[Admin Auth] User not found');
      redirectToAdminLogin();
      return;
    }

    // STRICT CHECK: Email must be @rootedvitality.health
    if (!user.email || !user.email.endsWith(ADMIN_EMAIL_DOMAIN)) {
      console.warn(`[Admin Auth] ❌ UNAUTHORIZED: Email "${user.email}" is not an admin email`);
      await supabaseClient.auth.signOut();
      showUnauthorized();
      return;
    }

    // Success - user is authorized admin
    console.log('[Admin Auth] ✓ User authorized:', user.email);
    currentUser = user;
    showAdminPanel();
    initializeUI();
  } catch (error) {
    console.error('[Admin Auth] Authentication check failed:', error);
    redirectToAdminLogin();
  }
}

/**
 * Redirect to admin login page
 */
function redirectToAdminLogin() {
  window.location.href = '/rooted-vitality/admin/login.html';
}

/**
 * Show admin panel after successful auth
 */
function showAdminPanel() {
  const authCheck = document.getElementById('auth-check');
  const adminPanel = document.getElementById('admin-panel');
  const unauthorized = document.getElementById('unauthorized');

  authCheck.style.display = 'none';
  unauthorized.style.display = 'none';
  adminPanel.style.display = 'flex';

  // Show user email
  const userEmail = document.getElementById('user-email');
  if (userEmail) {
    userEmail.textContent = currentUser.email;
  }
}

/**
 * Show unauthorized message
 */
function showUnauthorized() {
  const authCheck = document.getElementById('auth-check');
  const adminPanel = document.getElementById('admin-panel');
  const unauthorized = document.getElementById('unauthorized');

  authCheck.style.display = 'none';
  adminPanel.style.display = 'none';
  unauthorized.style.display = 'flex';
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. LOGOUT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Logout user
 */
async function logoutAdmin() {
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      console.error('[Admin Auth] Logout error:', error);
      return;
    }

    console.log('[Admin Auth] ✓ User logged out');
    currentUser = null;
    window.location.href = '/rooted-vitality/';
  } catch (error) {
    console.error('[Admin Auth] Logout failed:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get current admin user
 */
function getCurrentAdmin() {
  return currentUser;
}

/**
 * Check if user is admin
 */
function isAdmin() {
  return currentUser !== null;
}

/**
 * Navigate between pages
 */
function navigateTo(page) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  
  // Show target page
  const targetPage = document.getElementById(`page-${page}`);
  if (targetPage) {
    targetPage.classList.add('active');
  }

  // Update sidebar nav
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  
  const activeNav = document.querySelector(`[data-page="${page}"]`);
  if (activeNav) {
    activeNav.classList.add('active');
  }
}

/**
 * Initialize UI event listeners
 */
function initializeUI() {
  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logoutAdmin);
  }

  // Navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      if (page) {
        navigateTo(page);
      }
    });
  });
}

/**
 * Get Supabase client (for other scripts)
 */
function getSupabaseClient() {
  return supabaseClient;
}

// ═══════════════════════════════════════════════════════════════════════════════
// START AUTHENTICATION CHECK ON PAGE LOAD
// ═══════════════════════════════════════════════════════════════════════════════

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAdmin);
} else {
  initializeAdmin();
}
