/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: authManager.js                                              ║
║  Purpose: Centralized authentication management (register/login)    ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

 TABLE OF CONTENTS
   1. AUTH MANAGER NAMESPACE
   2. REGISTRATION FUNCTION
   3. LOGIN FUNCTION
   4. PASSWORD RESET FUNCTION
   5. CHANGE EMAIL FUNCTION
   6. LOGOUT FUNCTION
   7. SESSION MANAGEMENT
   8. HELPER FUNCTIONS
   9. AUTO-INITIALIZE SESSION ON PAGE LOAD
*/

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
            
            // Assign role to profile
            await this._setRole(role, data.user);
            
            // Show success message
            alert('Account created successfully! Please check your email to verify your account.');
            
            // TODO: Email verification is disabled until fully tested
            // Supabase will NOT send verification email yet - this is intentional
            console.warn('[Rooted Vitality] EMAIL VERIFICATION DISABLED - User must manually verify in Supabase dashboard');
            
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
            
            // Retrieve user profile including role and firstName
            const userProfile = await this._getUserProfile(data.user.id);
            const userRole = userProfile?.role || role;
            const firstName = userProfile?.first_name || '';
            // Update last_login timestamp in database
            await this._updateLastLogin(data.user.id, userRole);
            
            // Store session locally with firstName
            this._persistUser(data.user, userRole, firstName);

            // Handle "Remember Me"
            if (rememberMe) {
                localStorage.setItem('rvRememberEmail', email);
                localStorage.setItem('rvRememberMe', 'true');
            } else {
                localStorage.removeItem('rvRememberEmail');
                localStorage.removeItem('rvRememberMe');
            }
            
            // Set default view for all users (client)
            localStorage.setItem('active_view', 'client');
            
            // Update header UI
            this._updateHeader(userRole || role);
            
            // Close modal
            if (typeof closeLoginModal === 'function') {
                closeLoginModal();
            }
            
            // ALWAYS clear any redirect URLs on login - go to role-specific dashboard
            sessionStorage.removeItem('redirectAfterAuth');
            
            // Check if we're in onboarding modal - if so, skip redirect
            if (window.skipAuthRedirect) {
                console.log('[Rooted Vitality] In onboarding flow, skipping redirect');
                return true;
            }
            
            // Determine final role and redirect
            const finalRole = userRole || role;
            const baseUrl = (typeof RootedVitality !== 'undefined' && RootedVitality.config.siteUrl) ? RootedVitality.config.siteUrl : '/rooted-vitality/';
            
            let redirectPath;
            if (finalRole === 'practitioner') {
                redirectPath = baseUrl + 'dashboard/pro/pages/index.html';
            } else if (finalRole === 'client') {
                redirectPath = baseUrl + 'index.html';
            }
            
            if (redirectPath) {
                window.location.href = redirectPath;
                return true;
            }

            
            return true;
        } catch (error) {
            console.error('[Rooted Vitality] Unexpected login error:', error);
            alert('An unexpected error occurred during sign in.');
            return false;
        }
    },    
    
    // ======================================================
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
        
        try {
            console.log('[Rooted Vitality] PASSWORD RESET requested for:', email);
            const baseUrl = (typeof RootedVitality !== 'undefined' && RootedVitality.config.siteUrl) ? RootedVitality.config.siteUrl : '/rooted-vitality/';
            const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}${baseUrl}reset.html`
            });
            
            if (error) {
                console.error('[Rooted Vitality] Password reset error:', error.message);
                alert(`Password reset failed: ${error.message}`);
                return false;
            }
            
            console.log('[Rooted Vitality] ✓ PASSWORD RESET EMAIL SENT to:', email);
            console.log('[Rooted Vitality] Works for: Clients, Practitioners, All authenticated users');
            alert('Password reset link sent to your email. Please check your inbox.');
            return true;
        } catch (error) {
            console.error('[Rooted Vitality] Unexpected password reset error:', error);
            alert('An unexpected error occurred while sending reset link.');
            return false;
        }
    },
    
    // ======================================================
    // 5. CHANGE EMAIL FUNCTION
    // ======================================================
    /**
     * Initiate email change request for user
     * Sends verification link to new email address
     * @param {string} newEmail - New email address to change to
     */
    async changeEmail(newEmail) {
        if (!newEmail || !newEmail.includes('@')) {
            alert('Please enter a valid email address.');
            return false;
        }
        
        try {
            console.log('[Rooted Vitality] EMAIL CHANGE requested for:', newEmail);
            const baseUrl = (typeof RootedVitality !== 'undefined' && RootedVitality.config.siteUrl) ? RootedVitality.config.siteUrl : '/rooted-vitality/';
            const { error } = await window.supabaseClient.auth.updateUser({
                email: newEmail
            });
            
            if (error) {
                console.error('[Rooted Vitality] Email change error:', error.message);
                alert(`Email change failed: ${error.message}`);
                return false;
            }
            
            console.log('[Rooted Vitality] ✓ EMAIL CHANGE CONFIRMATION SENT to:', newEmail);
            console.log('[Rooted Vitality] Works for: Clients, Practitioners, All authenticated users');
            alert('A confirmation link has been sent to your new email address. Please check your inbox to verify the change.');
            return true;
        } catch (error) {
            console.error('[Rooted Vitality] Unexpected email change error:', error);
            alert('An unexpected error occurred while changing your email.');
            return false;
        }
    },
    
    // ======================================================
    // 6. LOGOUT FUNCTION
    // ======================================================
    /**
     * Logout user and clear session
     */
    async logout() {        
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
            
            // Show logout modal instead of alert
            this._showLogoutModal();
            
            return true;
        } catch (error) {
            console.error('[Rooted Vitality] Unexpected logout error:', error);
            return false;
        }
    },

    /**
     * Show logout confirmation modal
     * @private
     */
    _showLogoutModal() {
        // Simple inline HTML with onclick in the HTML itself
        const html = `
            <div id="logout-modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;">
                <div style="background: #fbf7ec; border-radius: 12px; padding: 2rem; max-width: 400px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15); text-align: center; z-index: 10001;">
                    <div style="margin-bottom: 1.5rem;">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#77883e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin: 0 auto; display: block;"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <h2 style="margin: 0 0 0.5rem 0; font-size: 1.25rem; font-weight: 600; color: #2e2b28;">Signed Out</h2>
                    <p style="margin: 0 0 1.5rem 0; color: #666; font-size: 0.95rem;">You have been successfully signed out.</p>
                    <button onclick="document.getElementById('logout-modal-overlay').remove(); window.location.href='/rooted-vitality/index.html';" style="background: #77883e; color: #fbf7ec; border: none; border-radius: 6px; padding: 0.75rem 1.5rem; font-size: 0.95rem; font-weight: 500; cursor: pointer; transition: all 0.2s ease; width: 100%;">Continue</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', html);
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
     * HIPAA Compliance: Enforce strong password requirements
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
        
        // HIPAA requirement: Minimum 12 characters
        if (password.length < 12) {
            alert('Password must be at least 12 characters long.');
            return false;
        }
        
        // Check for complexity: uppercase, lowercase, number, special character
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
        
        if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar) {
            alert('Password must contain uppercase, lowercase, number, and special character.');
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
            
            // IMPORTANT: Check practitioners FIRST
            // Users who are practitioners should always be identified as practitioners
            // even if they also have a client record
            const { data: practitioner, error: practError } = await window.supabaseClient
                .from('practitioners')
                .select('*')
                .eq('id', userId)
                .maybeSingle();
            
            if (practitioner && !practError) {
                return { role: 'practitioner', ...practitioner };
            }
            
            // Fall back to clients table if not a practitioner
            const { data: client, error: clientError } = await window.supabaseClient
                .from('clients')
                .select('*')
                .eq('id', userId)
                .maybeSingle();
            
            if (client && !clientError) {
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
            localStorage.setItem('rvUser', JSON.stringify(sessionData));
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
            RootedVitality.renderHeader(role);
        } else {
            // Fallback to old method if renderHeader not available
            const loginBtn = document.getElementById('rvLoginBtn');
            const nav = loginBtn?.parentElement;
            
            if (loginBtn && nav) {
                // Check if buttons already exist
                if (document.getElementById('rvDashboardBtn') || document.getElementById('rvLogoutBtn')) {
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
                    const dashboardFile = role === 'practitioner' ? 'dashboard/pro/pages/index.html' : 'dashboard/client/pages/client-profile.html';
                    window.location.href = baseDir + dashboardFile;
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
            RootedVitality.renderHeader('public');
        } else {
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
if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('DOMContentLoaded', async () => {
    try {
        const session = await authManager.getSession();
        
        if (session && session.user) {
            
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
}

// End of authManager.js â€” Rooted Vitality Supabase Authentication Module


