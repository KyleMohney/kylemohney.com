/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: scripts/authManager.js                                      ║
║  Purpose: Supabase Authentication & Session Management              ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

TABLE OF CONTENTS
  1. AUTH MANAGER NAMESPACE
  2. REGISTRATION FUNCTION
  3. LOGIN FUNCTION
  4. PASSWORD RESET FUNCTION
  5. LOGOUT FUNCTION
  6. SESSION MANAGEMENT
  7. HELPER FUNCTIONS
*/

console.log('[Rooted Vitality] authManager.js loading...');

// ======================================================
// 1. AUTH MANAGER NAMESPACE
// ======================================================
window.authManager = {
    
    // ======================================================
    // 2. REGISTRATION FUNCTION
    // ======================================================
    /**
     * Register new user with Supabase Auth + role assignment
     * @param {string} role - 'client' or 'practitioner'
     * @param {string} email - User email address
     * @param {string} password - User password
     */
    async register(role, email, password) {
        console.log(`[Rooted Vitality] Registering ${role}: ${email}`);
        
        // Validation
        if (!this._validateInput(email, password, role)) return false;
        
        // Ensure Supabase client is initialized
        if (!window.supabaseClient) {
            console.error('[Rooted Vitality] Supabase client not initialized');
            alert('Authentication system not ready. Please refresh the page and try again.');
            return false;
        }
        
        try {
            // Sign up user with Supabase Auth
            const { data, error } = await window.supabaseClient.auth.signUp({
                email: email,
                password: password
            });
            
            if (error) {
                console.error('[Rooted Vitality] Registration error:', error.message);
                alert(`Registration failed: ${error.message}`);
                return false;
            }
            
            console.log('[Rooted Vitality] User registered, ID:', data.user.id);
            
            // Assign role to profile
            await this._setRole(role, data.user);
            
            // Show success message
            alert('Account created successfully! Please check your email to verify your account.');
            
            // Close modal and reset form
            if (typeof closeLoginModal === 'function') {
                closeLoginModal();
            }
            
            return true;
        } catch (error) {
            console.error('[Rooted Vitality] Unexpected registration error:', error);
            alert('An unexpected error occurred during registration.');
            return false;
        }
    },
    
    // ======================================================
    // 3. LOGIN FUNCTION
    // ======================================================
    /**
     * Login user with Supabase Auth
     * Role is automatically determined from user profile
     * @param {string} email - User email address
     * @param {string} password - User password
     */
    async login(email, password) {
        console.log(`[Rooted Vitality] Signing in: ${email}`);
        
        // Validation
        if (!this._validateInput(email, password)) return false;
        
        // Ensure Supabase client is initialized
        if (!window.supabaseClient) {
            console.error('[Rooted Vitality] Supabase client not initialized');
            alert('Authentication system not ready. Please refresh the page and try again.');
            return false;
        }

        // Check if "Remember me" is checked
        const rememberMeCheckbox = document.getElementById('rvRememberMe');
        const rememberMe = rememberMeCheckbox ? rememberMeCheckbox.checked : false;
        
        try {
            // Sign in with Supabase Auth
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) {
                console.error('[Rooted Vitality] Login error:', error.message);
                alert(`Sign in failed: ${error.message}`);
                return false;
            }

            console.log('[Rooted Vitality] User signed in, ID:', data.user.id);
            
            // Retrieve user profile including role and firstName
            const userProfile = await this._getUserProfile(data.user.id);
            const userRole = userProfile?.role || role;
            const firstName = userProfile?.first_name || '';
            
            console.log('[Rooted Vitality] User profile retrieved:', {
                id: data.user.id,
                email: data.user.email,
                profileRole: userProfile?.role,
                firstName: userProfile?.first_name,
                finalRole: userRole
            });
            
            // Update last_login timestamp in database
            await this._updateLastLogin(data.user.id, userRole);
            
            // Store session locally with firstName
            this._persistUser(data.user, userRole, firstName);

            // Handle "Remember Me"
            if (rememberMe) {
                localStorage.setItem('rvRememberEmail', email);
                localStorage.setItem('rvRememberMe', 'true');
                console.log('[Rooted Vitality] Email saved for next login');
            } else {
                localStorage.removeItem('rvRememberEmail');
                localStorage.removeItem('rvRememberMe');
            }
            
            // Set default view for all users (client)
            localStorage.setItem('active_view', 'client');
            console.log('[Rooted Vitality] Default view set to: client');
            
            // Update header UI
            this._updateHeader(userRole || role);
            
            // Close modal
            if (typeof closeLoginModal === 'function') {
                closeLoginModal();
            }
            
            console.log('[Rooted Vitality] Login successful');
            
            // Check if there's a redirect URL from a previous action (like landing page CTA)
            const redirectUrl = sessionStorage.getItem('redirectAfterAuth');
            if (redirectUrl) {
                console.log('[Rooted Vitality] Redirect URL found in sessionStorage:', redirectUrl);
                sessionStorage.removeItem('redirectAfterAuth');
                window.location.href = redirectUrl;
                return true;
            }
            
            // Default redirect based on role
            const finalRole = userRole || role;
            const baseUrl = (typeof RootedVitality !== 'undefined' && RootedVitality.config.siteUrl) ? RootedVitality.config.siteUrl : '/rooted-vitality/';
            if (finalRole === 'practitioner') {
                console.log('[Rooted Vitality] Redirecting to practitioner dashboard');
                window.location.href = baseUrl + 'dashboard/pro/index.html';
            } else if (finalRole === 'client') {
                console.log('[Rooted Vitality] Redirecting to client dashboard');
                window.location.href = baseUrl + 'dashboard/client/pages/dashboard.html';
            }
            
            return true;
        } catch (error) {
            console.error('[Rooted Vitality] Unexpected login error:', error);
            alert('An unexpected error occurred during sign in.');
            return false;
        }
    },    // ======================================================
    // 4. PASSWORD RESET FUNCTION
    // ======================================================
    /**
     * Send password reset link to user email
     * @param {string} email - User email address
     */
    async resetPassword(email) {
        if (!email || !email.includes('@')) {
            alert('Please enter a valid email address.');
            return false;
        }
        
        console.log('[Rooted Vitality] Password reset requested for:', email);
        
        try {
            const baseUrl = (typeof RootedVitality !== 'undefined' && RootedVitality.config.siteUrl) ? RootedVitality.config.siteUrl : '/rooted-vitality/';
            const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}${baseUrl}reset.html`
            });
            
            if (error) {
                console.error('[Rooted Vitality] Password reset error:', error.message);
                alert(`Password reset failed: ${error.message}`);
                return false;
            }
            
            console.log('[Rooted Vitality] Password reset link sent');
            alert('Password reset link sent to your email. Please check your inbox.');
            return true;
        } catch (error) {
            console.error('[Rooted Vitality] Unexpected password reset error:', error);
            alert('An unexpected error occurred while sending reset link.');
            return false;
        }
    },
    
    // ======================================================
    // 5. LOGOUT FUNCTION
    // ======================================================
    /**
     * Logout user and clear session
     */
    async logout() {
        console.log('[Rooted Vitality] Signing out...');
        
        try {
            const { error } = await window.supabaseClient.auth.signOut();
            
            if (error) {
                console.error('[Rooted Vitality] Logout error:', error.message);
                return false;
            }
            
            // Clear local session storage
            localStorage.removeItem('rvUser');
            sessionStorage.removeItem('rvSessionToken');
            
            // Reset header UI
            this._resetHeader();
            
            console.log('[Rooted Vitality] Logout successful');
            alert('You have been signed out.');
            
            // Redirect to rooted vitality home
            window.location.href = '/rooted-vitality/index.html';
            
            return true;
        } catch (error) {
            console.error('[Rooted Vitality] Unexpected logout error:', error);
            return false;
        }
    },
    
    // ======================================================
    // 6. SESSION MANAGEMENT
    // ======================================================
    /**
     * Retrieve current Supabase session
     * @return {object|null} Session object if authenticated
     */
    async getSession() {
        try {
            const { data, error } = await window.supabaseClient.auth.getSession();
            
            if (error) {
                console.error('[Rooted Vitality] Session retrieval error:', error);
                return null;
            }
            
            return data.session;
        } catch (error) {
            console.error('[Rooted Vitality] Unexpected session error:', error);
            return null;
        }
    },
    
    /**
     * Retrieve current authenticated user from localStorage
     * @return {object|null} User object if authenticated
     */
    getCurrentUser() {
        try {
            const user = localStorage.getItem('rvUser');
            return user ? JSON.parse(user) : null;
        } catch (error) {
            console.error('[Rooted Vitality] Error retrieving user:', error);
            return null;
        }
    },
    
    /**
     * Check if user is authenticated
     * @return {boolean} True if session exists
     */
    isAuthenticated() {
        return this.getCurrentUser() !== null;
    },
    
    // ======================================================
    // 7. HELPER FUNCTIONS
    // ======================================================
    /**
     * Validate email and password input
     * @private
     */
    _validateInput(email, password) {
        if (!email || !password) {
            alert('Email and password are required.');
            return false;
        }
        
        if (!email.includes('@')) {
            alert('Please enter a valid email address.');
            return false;
        }
        
        if (password.length < 6) {
            alert('Password must be at least 6 characters.');
            return false;
        }
        
        return true;
    },
    
    /**
     * Assign role to user profile in Supabase
     * @private
     */
    async _setRole(role, user) {
        try {
            // Role is now implicit based on which table the user is in (clients vs practitioners)
            // This method is deprecated but keeping for compatibility
            console.log('[Rooted Vitality] Role assignment:', role, '(stored in clients/practitioners tables)');
            return true;
        } catch (error) {
            console.error('[Rooted Vitality] Unexpected role assignment error:', error);
            return false;
        }
    },
    
    /**
     * Retrieve user role from database
     * @private
     */
    async _getUserRole(userId) {
        try {
            // IMPORTANT: Check practitioners FIRST
            // Users who are practitioners should always be identified as practitioners
            // even if they also have a client record
            const { data: practitioner, error: practError } = await window.supabaseClient
                .from('practitioners')
                .select('id')
                .eq('id', userId)
                .single();
            
            if (practitioner && !practError) {
                return 'practitioner';
            }
            
            // Fall back to clients table if not a practitioner
            const { data: client, error: clientError } = await window.supabaseClient
                .from('clients')
                .select('id')
                .eq('id', userId)
                .single();
            
            if (client && !clientError) {
                return 'client';
            }
            
            console.error('[Rooted Vitality] Could not determine user role');
            return null;
        } catch (error) {
            console.error('[Rooted Vitality] Unexpected role retrieval error:', error);
            return null;
        }
    },

    /**
     * Retrieve full user profile data
     * @private
     */
    async _getUserProfile(userId) {
        try {
            console.log('[Rooted Vitality] Fetching profile for user:', userId);
            
            // IMPORTANT: Check practitioners FIRST
            // Users who are practitioners should always be identified as practitioners
            // even if they also have a client record
            const { data: practitioner, error: practError } = await window.supabaseClient
                .from('practitioners')
                .select('*')
                .eq('id', userId)
                .single();
            
            if (practitioner && !practError) {
                console.log('[Rooted Vitality] User found in practitioners table');
                return { role: 'practitioner', ...practitioner };
            }
            
            // Fall back to clients table if not a practitioner
            const { data: client, error: clientError } = await window.supabaseClient
                .from('clients')
                .select('*')
                .eq('id', userId)
                .single();
            
            if (client && !clientError) {
                console.log('[Rooted Vitality] User found in clients table');
                return { role: 'client', ...client };
            }
            
            if (practError) {
                console.error('[Rooted Vitality] Error retrieving from practitioners table:', practError);
            }
            if (clientError) {
                console.error('[Rooted Vitality] Error retrieving from clients table:', clientError);
            }
            
            return null;
        } catch (error) {
            console.error('[Rooted Vitality] Unexpected profile retrieval error:', error);
            return null;
        }
    },
    
    /**
     * Update last_login timestamp in database
     * @private
     */
    async _updateLastLogin(userId, userRole) {
        try {
            const tableName = userRole === 'practitioner' ? 'practitioners' : 'clients';
            const now = new Date().toISOString();
            
            const { error } = await window.supabaseClient
                .from(tableName)
                .update({ last_login: now })
                .eq('id', userId);
            
            if (error) {
                console.error('[Rooted Vitality] Error updating last_login:', error);
            } else {
                console.log(`[Rooted Vitality] last_login updated for ${tableName}`);
            }
        } catch (error) {
            console.error('[Rooted Vitality] Exception updating last_login:', error);
        }
    },
    
    /**
     * Persist user session to localStorage
     * @private
     */
    _persistUser(user, role, firstName = '') {
        try {
            const sessionData = {
                id: user.id,
                email: user.email,
                role: role,
                firstName: firstName,
                timestamp: Date.now(),
                isAuthenticated: true
            };
            console.log('[Rooted Vitality] Persisting session data:', sessionData);
            localStorage.setItem('rvUser', JSON.stringify(sessionData));
            console.log('[Rooted Vitality] Session persisted to localStorage');
        } catch (error) {
            console.error('[Rooted Vitality] Error persisting session:', error);
        }
    },
    
    /**
     * Update header UI to reflect logged-in state
     * @private
     */
    _updateHeader(role) {
        // Use new role-based header system
        if (typeof RootedVitality !== 'undefined' && typeof RootedVitality.renderHeader === 'function') {
            console.log('[Rooted Vitality] Updating header to role:', role);
            RootedVitality.renderHeader(role);
        } else {
            console.warn('[Rooted Vitality] renderHeader not available, falling back to DOM manipulation');
            
            // Fallback to old method if renderHeader not available
            const loginBtn = document.getElementById('rvLoginBtn');
            const nav = loginBtn?.parentElement;
            
            if (loginBtn && nav) {
                // Check if buttons already exist
                if (document.getElementById('rvDashboardBtn') || document.getElementById('rvLogoutBtn')) {
                    console.log('[Rooted Vitality] Header already updated, skipping duplicate');
                    return;
                }
                
                // Hide login button
                loginBtn.style.display = 'none';
                
                // Create Dashboard button
                const dashboardBtn = document.createElement('button');
                dashboardBtn.id = 'rvDashboardBtn';
                dashboardBtn.className = 'rv-nav-btn rv-dashboard-btn';
                dashboardBtn.textContent = 'Dashboard';
                dashboardBtn.setAttribute('aria-label', 'Go to dashboard');
                dashboardBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Get current directory and navigate from there
                    const currentPath = window.location.pathname;
                    const isInSubdir = currentPath.includes('/articles/') || currentPath.includes('/policies/') || currentPath.includes('/dashboard/');
                    const baseDir = isInSubdir ? '../' : '';
                    const dashboardFile = role === 'practitioner' ? 'dashboard/pro/index.html' : 'dashboard/client/pages/dashboard.html';
                    window.location.href = baseDir + dashboardFile;
                    console.log('[Dashboard] Navigating to:', baseDir + dashboardFile);
                });
                
                // Create Logout button
                const logoutBtn = document.createElement('button');
                logoutBtn.id = 'rvLogoutBtn';
                logoutBtn.className = 'rv-nav-btn rv-logout-btn';
                logoutBtn.textContent = 'Logout';
                logoutBtn.setAttribute('aria-label', 'Logout');
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.logout();
                });
                
                // Insert buttons after login button
                loginBtn.parentNode.insertBefore(dashboardBtn, loginBtn.nextSibling);
                loginBtn.parentNode.insertBefore(logoutBtn, dashboardBtn.nextSibling);
                
                console.log('[Rooted Vitality] Header updated: Dashboard + Logout buttons added');
            }
        }
    },
    
    /**
     * Reset header UI to login state
     * @private
     */
    _resetHeader() {
        // Use new role-based header system
        if (typeof RootedVitality !== 'undefined' && typeof RootedVitality.renderHeader === 'function') {
            console.log('[Rooted Vitality] Resetting header to public role');
            RootedVitality.renderHeader('public');
        } else {
            console.warn('[Rooted Vitality] renderHeader not available, falling back to DOM manipulation');
            
            // Fallback to old method if renderHeader not available
            const loginBtn = document.getElementById('rvLoginBtn');
            const dashboardBtn = document.getElementById('rvDashboardBtn');
            const logoutBtn = document.getElementById('rvLogoutBtn');
            
            if (loginBtn) {
                loginBtn.style.display = '';
                
                // Remove Dashboard button
                if (dashboardBtn) dashboardBtn.remove();
                
                // Remove Logout button
                if (logoutBtn) logoutBtn.remove();
                
                // Re-attach login modal trigger
                loginBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (typeof openLoginModal === 'function') {
                        openLoginModal('client');
                    }
                });
                
                console.log('[Rooted Vitality] Header reset to Login');
            }
        }
    }
};

// ======================================================
// 8. AUTO-INITIALIZE SESSION ON PAGE LOAD
// ======================================================
/**
 * Check for existing session on page load and restore it
 */
window.addEventListener('DOMContentLoaded', async () => {
    try {
        const session = await authManager.getSession();
        
        if (session && session.user) {
            console.log('[Rooted Vitality] Existing session found, restoring...');
            
            // Get user profile including role and firstName
            const userProfile = await authManager._getUserProfile(session.user.id);
            const role = userProfile?.role;
            const firstName = userProfile?.first_name || '';
            
            if (role) {
                // Persist session data with firstName
                authManager._persistUser(session.user, role, firstName);
                
                // Wait for header to be injected/rendered, then update it
                // This applies to ALL pages including dashboard pages
                const updateHeaderWhenReady = () => {
                    // Check for new role-based header system first
                    const header = document.getElementById('rvHeader');
                    if (header) {
                        authManager._updateHeader(role);
                        console.log('[Rooted Vitality] Session restored for:', session.user.email, '| Role:', role);
                    } else {
                        // Header not ready yet, wait and retry
                        setTimeout(updateHeaderWhenReady, 100);
                    }
                };
                
                updateHeaderWhenReady();
            }
        }
    } catch (error) {
        console.error('[Rooted Vitality] Error checking session on load:', error);
    }
});

console.log('[Rooted Vitality] authManager ready (Supabase integration)');

// End of authManager.js — Rooted Vitality Supabase Authentication Module

