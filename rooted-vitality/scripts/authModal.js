/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: authModal.js                                                ║
║  Purpose: Pure UI layer for auth modal (login/signup)              ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

 TABLE OF CONTENTS
   1. MODAL INITIALIZATION (LAZY - ON DEMAND ONLY)
   2. OPEN / CLOSE FUNCTIONS
   3. FORM EVENT HANDLERS
   4. TAB SWITCHING
   5. UTILITY FUNCTIONS

 PURPOSE: Pure UI layer for auth modal. All business logic delegated to authManager.js.
 No login/logout logic here - only DOM manipulation and user input collection.
*/

// ======================================================
// 1. MODAL INITIALIZATION (LAZY - ON DEMAND ONLY)
// ======================================================

let modalInitialized = false;

/**
 * Initialize auth modal on first use (lazy initialization)
 * Creates modal HTML, injects into DOM, sets up event listeners
 */
window.initAuthModal = () => {
    if (modalInitialized) {
        return;
    }
    modalInitialized = true;
    
    // Detect if we're in a subdirectory
    const currentPath = window.location.pathname;
    const isSubdirectory = currentPath.includes('/articles/') || currentPath.includes('/policies/') || 
                          currentPath.includes('/dashboard/') || currentPath.includes('/help-center/');
    const pathPrefix = isSubdirectory ? '../' : './';

    const modalHTML = `
    <div id="rvAuthOverlay" class="rv-auth-overlay" inert aria-hidden="true">
        <div class="rv-auth-modal" role="dialog" aria-modal="true" aria-labelledby="rvAuthTitle">
            <h2 id="rvAuthTitle" style="display: none;">Login</h2>
            <button class="rv-auth-close" aria-label="Close login modal">×</button>
            <h2 id="rvAuthTitle">Sign In to Rooted Vitality</h2>
            <p class="rv-auth-subtitle">Enter your email and password. Your experience will automatically match your account type.</p>
            <form id="rvAuthForm" data-mode="login">
                <label for="rvAuthEmail">Email</label>
                <input type="email" id="rvAuthEmail" required>
                <label for="rvAuthPassword">Password</label>
                <input type="password" id="rvAuthPassword" required>
                <div class="rv-auth-actions" id="rvAuthActions">
                    <label><input type="checkbox" id="rvRememberMe"> Remember me</label>
                    <a href="#" class="rv-forgot">Forgot password?</a>
                </div>
                <button type="submit" class="rv-auth-submit">Sign In</button>
            </form>
            <div class="rv-auth-footer">
                <p id="rvToggleLogin">Don't have an account? <a href="${pathPrefix}dashboard/client/pages/client-signup.html" id="rvRegisterLink">Sign up</a></p>
            </div>
        </div>
    </div>
    `;

    // Inject modal at end of body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Get modal element references
    const overlay = document.getElementById('rvAuthOverlay');
    const closeBtn = overlay.querySelector('.rv-auth-close');
    const form = document.getElementById('rvAuthForm');
    const submitBtn = overlay.querySelector('.rv-auth-submit');
    const registerLink = document.getElementById('rvRegisterLink');
    const forgotLink = document.querySelector('.rv-forgot');

    // ======================================================
    // 2. CLOSE FUNCTION
    // ======================================================

    /**
     * Close login modal
     */
    window.closeLoginModal = () => {
        const overlay = document.getElementById('rvAuthOverlay');
        if (!overlay) return;
        
        overlay.classList.remove('active');
        overlay.setAttribute('inert', '');
        overlay.setAttribute('aria-hidden', 'true');
        
        const form = document.getElementById('rvAuthForm');
        if (form) form.reset();
    };

    // ======================================================
    // 3. FORM EVENT HANDLERS
    // ======================================================

    // Close button
    closeBtn.addEventListener('click', window.closeLoginModal);

    // Close on outside click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            window.closeLoginModal();
        }
    });

    // Close on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('active')) {
            window.closeLoginModal();
        }
    });

    // ======================================================
    // 4. UTILITY FUNCTIONS
    // ======================================================

    // Redirect to signup page
    registerLink.addEventListener('click', (e) => {
        e.preventDefault();
        const signupPath = isSubdirectory ? '../dashboard/client/pages/client-signup.html' : './dashboard/client/pages/client-signup.html';
        window.location.href = signupPath;
    });

    // Password reset
    forgotLink.addEventListener('click', (e) => {
        e.preventDefault();
        const email = document.getElementById('rvAuthEmail').value.trim();
        if (!email) {
            alert('Please enter your email address to receive a password reset link.');
            return;
        }

        if (typeof authManager !== 'undefined' && authManager.resetPassword) {
            authManager.resetPassword(email);
        } else {
            alert('Authentication system not ready. Please refresh the page.');
        }
    });

    // Form submission â€” delegates to authManager
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const mode = form.dataset.mode || 'login';
        const email = document.getElementById('rvAuthEmail').value.trim();
        const password = document.getElementById('rvAuthPassword').value.trim();


        if (typeof authManager === 'undefined') {
            alert('Authentication system not ready. Please refresh the page.');
            return;
        }

        try {
            if (mode === 'register') {
                if (typeof authManager.register === 'function') {
                    await authManager.register(email, password);
                } else {
                    alert('Registration not available.');
                }
            } else {
                if (typeof authManager.login === 'function') {
                    await authManager.login(email, password);
                } else {
                    alert('Login not available.');
                }
            }
        } catch (error) {
            console.error('[Rooted Vitality] Auth error:', error);
            alert('An error occurred. Please try again.');
        }
    });

    modalInitialized = true;
};

/**
 * Open login modal (creates modal on first call)
 * @param {string} role - 'client' or 'practitioner'
 */
window.openLoginModal = (role = 'client') => {
    
    // Initialize modal if not already done
    if (!modalInitialized) {
        window.initAuthModal();
    }
    
    const overlay = document.getElementById('rvAuthOverlay');
    if (!overlay) {
        console.error('[Rooted Vitality] Modal overlay not found after initialization');
        return;
    }
    
    overlay.classList.add('active');
    overlay.removeAttribute('inert');
    overlay.setAttribute('aria-hidden', 'false');

    // Set active tab
    const tabs = overlay.querySelectorAll('.rv-auth-tab');
    tabs.forEach(t => t.classList.remove('active'));
    const activeTab = overlay.querySelector(`[data-role="${role}"]`);
    if (activeTab) activeTab.classList.add('active');
    overlay.dataset.role = role;

    // Prefill remember me credentials
    const rememberMe = localStorage.getItem('rvRememberMe') === 'true';
    const savedEmail = localStorage.getItem('rvRememberEmail');
    if (rememberMe && savedEmail) {
        document.getElementById('rvAuthEmail').value = savedEmail;
        document.getElementById('rvRememberMe').checked = true;
    } else {
        document.getElementById('rvAuthEmail').value = '';
        document.getElementById('rvRememberMe').checked = false;
    }

    // Focus email for accessibility
    setTimeout(() => {
        document.getElementById('rvAuthEmail')?.focus();
    }, 100);
};

// DO NOT auto-initialize - modal should only be created when login button is clicked

