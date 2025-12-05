/*
╔═════════════════════════════════════════════════════════════════════════════╗
║                         ROOTED VITALITY DASHBOARD                           ║
║                    CLIENT HEADER AVATAR MANAGER (SCRIPT)                    ║
║                                                                             ║
║ File:        dashboard/client/scripts/clientHeaderAvatar.js                 ║
║ Purpose:     Universal client avatar/profile picture initialization         ║
║ Description: Ensures client avatar (initial or profile picture) loads       ║
║              universally on ALL client pages. Displays first initial until  ║
║              profile picture is uploaded, then swaps to profile picture.    ║
║              Handles timing properly regardless of page load order.         ║
║ Last Update: November 2025                                                  ║
║ Status:      Production-Ready | Build Standard v2.0 Compliant               ║
║                                                                             ║
║ QUICK REFERENCE:                                                            ║
║ - Universal Avatar Loading | Retry Logic | Initial Fallback                 ║
║ - Design System: Client avatar styling with profile picture swap            ║
║ - Utilities: Works on all client pages (dashboard, settings, inbox, etc.)   ║
║                                                                             ║
║ CSS CLASSES USED:                                                           ║
║ - .hidden: Hides elements when initial needs to be swapped for picture      ║
║ - .avatar-image: Applied to profile picture img elements                    ║
║ - .avatar-initial: Applied to initial display elements                      ║
║                                                                             ║
╚═════════════════════════════════════════════════════════════════════════════╝
*/

// ═══════════════════════════════════════════════════════════════════════════
// TABLE OF CONTENTS
// ═══════════════════════════════════════════════════════════════════════════
//
// 1. INITIALIZATION
// 2. AVATAR LOADING
// 3. EVENT LISTENERS
// 4. UTILITIES
//
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// 1. INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

window.ClientHeaderAvatar = {
    avatarLoaded: false,
    pictureLoaded: false,
    maxRetries: 5,
    retryCount: 0,
    
    /**
     * Initialize avatar/profile picture loading - call this when user is confirmed as client
     * Does NOT require RootedVitality to be loaded first
     */
    initialize: async function() {
        
        // Check if this is a client in client view
        const userData = window.authManager?.getCurrentUser?.();
        const activeView = localStorage.getItem('active_view') || 'client';
        
        // IMPORTANT: Only initialize if user is actually a CLIENT (not practitioner viewing client view)
        if (userData?.role === 'practitioner') {
            return;
        }
        
        if (userData?.role !== 'client') {
            return ;
        }
        
        // Check if avatar button exists in DOM
        const avatarBtn = document.querySelector('.rv-avatar-btn');
        if (!avatarBtn) {
            console.warn('[Rooted Vitality Avatar] Avatar button not found in DOM, cannot initialize');
            return;
        }
        
        // Get current user ID from auth
        let userId = null;
        try {
            if (!window.supabaseClient) {
                console.warn('[Rooted Vitality Avatar] supabaseClient not available yet, scheduling retry');
                setTimeout(() => this.initialize(), 300);
                return;
            }
            
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            userId = user?.id;
        } catch (error) {
            console.warn('[Rooted Vitality Avatar] Error getting user ID:', error);
            return;
        }
        
        if (!userId) {
            console.warn('[Rooted Vitality Avatar] No user ID found');
            return;
        }
        
        // Load avatar/profile picture from database - ALWAYS attempt fresh load
        await this.loadAvatarFromDatabase(userId);
    },
    
    /**
     * Load avatar/profile picture from client database record
     */
    loadAvatarFromDatabase: async function(userId) {
        try {
            
            if (!window.supabaseClient) {
                console.warn('[Rooted Vitality Avatar] supabaseClient not available');
                return;
            }
            
            // Fetch client data from clients table
            const { data: clients, error } = await window.supabaseClient
                .from('clients')
                .select('first_name, profile_picture_url')
                .eq('id', userId)
                .single();
            
            if (error) {
                console.warn('[Rooted Vitality Avatar] Database error:', error);
                this.setInitialFromUser();
                return;
            }
            
            if (!clients) {
                this.setInitialFromUser();
                return;
            }

            
            // Determine what to show
            const profilePictureUrl = clients.profile_picture_url;
            const firstName = clients.first_name;
            
            if (profilePictureUrl) {
                // Has a profile picture - display it
                this.updateHeaderWithPicture(profilePictureUrl);
                this.pictureLoaded = true;
            } else if (firstName) {
                // No picture, show first initial
                this.updateHeaderWithInitial(firstName);
                this.avatarLoaded = true;
            } else {
                // Fallback
                this.updateHeaderWithInitial('U');
                this.avatarLoaded = true;
            }
            
        } catch (error) {
            console.error('[Rooted Vitality Avatar] Exception in loadAvatarFromDatabase:', error);
            this.setInitialFromUser();
        }
    },
    
    /**
     * Fallback: Set initial from authManager
     */
    setInitialFromUser: function() {
        try {
            const userData = window.authManager?.getCurrentUser?.();
            if (userData?.firstName) {
                this.updateHeaderWithInitial(userData.firstName);
                this.avatarLoaded = true;
            } else {
                this.updateHeaderWithInitial('U');
                this.avatarLoaded = true;
            }
        } catch (error) {
            this.updateHeaderWithInitial('U');
            this.avatarLoaded = true;
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // 2. AVATAR LOADING
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * Update header with profile picture image
     */
    updateHeaderWithPicture: function(pictureUrl) {
        this.retryCount = 0; // Reset retries for this operation
        
        // Wait for avatar button to be ready
        const waitForAvatarBtn = () => {
            const avatarBtn = document.querySelector('.rv-avatar-btn');
            
            if (!avatarBtn) {
                if (this.retryCount < this.maxRetries) {
                    this.retryCount++;
                    setTimeout(() => waitForAvatarBtn(), 150);
                } else {
                    console.warn('[Rooted Vitality Avatar] Avatar button not found after max retries');
                }
                return;
            }
            
            // Clear retries on success
            this.retryCount = 0;
            
            // Hide the text initial
            const avatarInitial = avatarBtn.querySelector('.rv-avatar-initial');
            if (avatarInitial) {
                avatarInitial.classList.add('hidden');
            }
            
            // Remove existing image if present
            const existingImg = avatarBtn.querySelector('img');
            if (existingImg) {
                existingImg.remove();
            }
            
            // Create and add new avatar image
            const avatarImg = document.createElement('img');
            avatarImg.src = pictureUrl;
            avatarImg.alt = 'Profile Picture';
            avatarImg.classList.add('avatar-image');
            avatarImg.onload = () => {
            };
            avatarImg.onerror = () => {
                avatarImg.remove();
                this.fallbackToInitial();
            };
            
            avatarBtn.appendChild(avatarImg);
        };
        
        waitForAvatarBtn();
    },
    
    /**
     * Update header with first initial
     */
    updateHeaderWithInitial: function(nameOrInitial) {
        this.retryCount = 0; // Reset retries for this operation
        
        // Wait for avatar initial element to be ready
        const waitForInitial = () => {
            const avatarInitial = document.getElementById('rvAvatarInitial');
            
            if (!avatarInitial) {
                if (this.retryCount < this.maxRetries) {
                    this.retryCount++;
                    setTimeout(() => waitForInitial(), 150);
                } else {
                    console.warn('[Rooted Vitality Avatar] Avatar initial element not found after max retries');
                }
                return;
            }
            
            // Clear retries on success
            this.retryCount = 0;
            
            // Extract first letter
            const firstLetter = nameOrInitial?.charAt(0)?.toUpperCase() || 'U';
            
            // Update the initial
            avatarInitial.textContent = firstLetter;
            avatarInitial.classList.add('avatar-initial');
            avatarInitial.classList.remove('hidden');
            
        };
        
        waitForInitial();
    },
    
    /**
     * Fallback when image fails to load
     */
    fallbackToInitial: function() {
        const userData = window.authManager?.getCurrentUser?.();
        const firstName = userData?.firstName || 'U';
        this.updateHeaderWithInitial(firstName);
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// 3. EVENT LISTENERS & INITIALIZATION HOOKS
// ═══════════════════════════════════════════════════════════════════════════

// Wrapper to initialize avatar whenever needed
async function initializeClientAvatarIfNeeded() {
    if (!window.supabaseClient) {
        setTimeout(initializeClientAvatarIfNeeded, 200);
        return;
    }
    
    const headerElement = document.querySelector('.rv-avatar-btn');
    if (!headerElement) {
        // Header not injected yet, wait and try again
        setTimeout(initializeClientAvatarIfNeeded, 200);
        return;
    }
    
    // Header exists, now initialize avatar
    window.ClientHeaderAvatar.retryCount = 0; // Reset retries for fresh attempt
    window.ClientHeaderAvatar.pictureLoaded = false; // Reset state
    window.ClientHeaderAvatar.avatarLoaded = false; // Reset state
    await window.ClientHeaderAvatar.initialize();
}

// Wait for supabase client to be available
const waitForSupabase = () => {
    if (window.supabaseClient) {
        initializeClientAvatarIfNeeded();
    } else {
        setTimeout(waitForSupabase, 200);
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForSupabase);
} else {
    waitForSupabase();
}

// ALWAYS reinitialize on window load to catch page returns
window.addEventListener('load', () => {
    setTimeout(() => {
        window.ClientHeaderAvatar.retryCount = 0;
        window.ClientHeaderAvatar.pictureLoaded = false;
        window.ClientHeaderAvatar.avatarLoaded = false;
        window.ClientHeaderAvatar.initialize();
    }, 500);
});

// Hook into injections system to reinitialize after header injection
// Check if RootedVitality object exists and wrap its injectLoggedInHeader
const setupRVHook = () => {
    if (!window.RootedVitality) {
        setTimeout(setupRVHook, 100);
        return;
    }
    
    const originalInjectLoggedInHeader = window.RootedVitality.injectLoggedInHeader;
    if (originalInjectLoggedInHeader) {
        window.RootedVitality.injectLoggedInHeader = async function(...args) {
            const result = await originalInjectLoggedInHeader.call(this, ...args);
            
            // After header is injected, reinitialize avatar
            setTimeout(() => {
                window.ClientHeaderAvatar.retryCount = 0;
                window.ClientHeaderAvatar.pictureLoaded = false;
                window.ClientHeaderAvatar.avatarLoaded = false;
                window.ClientHeaderAvatar.initialize();
            }, 100);
            
            return result;
        };
    }
};

setupRVHook();

// Also listen for custom event that might be fired
document.addEventListener('rvHeaderInjected', () => {
    window.ClientHeaderAvatar.retryCount = 0;
    window.ClientHeaderAvatar.pictureLoaded = false;
    window.ClientHeaderAvatar.avatarLoaded = false;
    window.ClientHeaderAvatar.initialize();
}, false);

// ═══════════════════════════════════════════════════════════════════════════
// 4. UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

// Also reinitialize when page becomes visible (user returns from another tab/page)
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        const avatarBtn = document.querySelector('.rv-avatar-btn');
        if (avatarBtn) {
            // Check if avatar has the picture or just the initial
            const img = avatarBtn.querySelector('img');
            const initial = avatarBtn.querySelector('.rv-avatar-initial');
            
            // If showing initial but should show picture, reinitialize
            if (initial && !initial.classList.contains('hidden')) {
                window.ClientHeaderAvatar.retryCount = 0;
                window.ClientHeaderAvatar.pictureLoaded = false;
                window.ClientHeaderAvatar.avatarLoaded = false;
                window.ClientHeaderAvatar.initialize();
            }
        }
    }
}, false);



























































