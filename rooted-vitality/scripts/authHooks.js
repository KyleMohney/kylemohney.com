/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: authHooks.js                                                ║
║  Purpose: Auth initialization and session restoration on all pages  ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

 TABLE OF CONTENTS
   1. INITIALIZATION & SESSION RESTORATION
   2. AUTO-CALL ON PAGE LOAD
*/

// ======================================================
// 1. INITIALIZATION & SESSION RESTORATION
// ======================================================

/**
 * Initialize auth on any page
 * Called on DOMContentLoaded on every page
 * Handles:
 * - Session restoration
 * - Header updates (show Dashboard + Logout if authenticated)
 * - Redirects if needed
 */
window.initializeAuthOnPage = async () => {

    try {
        // Check for existing session
        const session = await window.authManager.getSession();
        const userData = window.authManager.getCurrentUser();

        // Header is now rendered by RootedVitality.init() which checks auth status
        // This function can be used for other auth-related tasks if needed
        // (previously updated header here, but that's now handled by init())

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

