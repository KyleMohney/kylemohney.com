/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: scripts/authHooks.js                                        ║
║  Purpose: Universal auth initialization on every page              ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

TABLE OF CONTENTS
  1. INITIALIZATION
  2. SESSION RESTORATION
  3. HEADER UPDATES
  4. REDIRECT LOGIC

PURPOSE: Single function called on every page to handle auth state consistently.
Ensures logged-in status shows, logout is available, and redirects work everywhere.
*/

console.log('[Rooted Vitality] authHooks.js loading...');

/**
 * Initialize auth on any page
 * Called on DOMContentLoaded on every page
 * Handles:
 * - Session restoration
 * - Header updates (show Dashboard + Logout if authenticated)
 * - Redirects if needed
 */
window.initializeAuthOnPage = async () => {
    console.log('[Rooted Vitality] initializeAuthOnPage() called');

    try {
        // Check for existing session
        const session = await window.authManager.getSession();
        const userData = window.authManager.getCurrentUser();

        console.log('[Rooted Vitality Auth] Session:', session ? 'found' : 'none', 'LocalStorage:', userData ? 'found' : 'none');

        // Header is now rendered by RootedVitality.init() which checks auth status
        // This function can be used for other auth-related tasks if needed
        // (previously updated header here, but that's now handled by init())
        
        if ((session || userData) && userData?.role) {
            console.log('[Rooted Vitality Auth] User authenticated:', userData.email);
            // Header already rendered by init() - no need to update again
        } else {
            console.log('[Rooted Vitality Auth] No active session');
        }

    } catch (error) {
        console.error('[Rooted Vitality Auth] Error in initializeAuthOnPage:', error);
    }
};

// Auto-call on DOMContentLoaded if authManager exists
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (typeof window.authManager !== 'undefined') {
            window.initializeAuthOnPage();
        } else {
            console.warn('[Rooted Vitality Auth] authManager not ready on DOMContentLoaded');
        }
    });
} else {
    // Document already loaded
    if (typeof window.authManager !== 'undefined') {
        window.initializeAuthOnPage();
    }
}

console.log('[Rooted Vitality] authHooks.js loaded');
