/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: scripts/clientHeaderAvatar.js                               ║
║  Purpose: Universal client avatar/profile picture initialization   ║
║  Loads on ALL client pages with proper initialization order        ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

PURPOSE:
- Ensure client avatar (initial or profile picture) loads universally on ALL pages
- Display first initial until profile picture is uploaded
- Swap to profile picture once uploaded
- Handle timing properly regardless of page load order
- Works on: client-dashboard.html, client-settings.html, etc.
*/

console.log('[Rooted Vitality] clientHeaderAvatar.js loading...');

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
        console.log('[Rooted Vitality Avatar] initialize() called for client');
        console.log('[Rooted Vitality Avatar] Current state - pictureLoaded:', this.pictureLoaded, 'avatarLoaded:', this.avatarLoaded);
        
        // Check if this is a client in client view
        const userData = window.authManager?.getCurrentUser?.();
        const activeView = localStorage.getItem('active_view') || 'client';
        
        console.log('[Rooted Vitality Avatar] User data:', userData);
        console.log('[Rooted Vitality Avatar] Active view:', activeView);
        console.log('[Rooted Vitality Avatar] User role:', userData?.role);
        
        // IMPORTANT: Only initialize if user is actually a CLIENT (not practitioner viewing client view)
        if (userData?.role === 'practitioner') {
            console.log('[Rooted Vitality Avatar] User is practitioner, skipping client avatar initialization');
            return;
        }
        
        if (userData?.role !== 'client') {
            console.log('[Rooted Vitality Avatar] User is not a client, skipping');
            return;
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
            console.log('[Rooted Vitality Avatar] Got user ID:', userId);
        } catch (error) {
            console.warn('[Rooted Vitality Avatar] Error getting user ID:', error);
            return;
        }
        
        if (!userId) {
            console.warn('[Rooted Vitality Avatar] No user ID found');
            return;
        }
        
        // Load avatar/profile picture from database - ALWAYS attempt fresh load
        console.log('[Rooted Vitality Avatar] Attempting fresh avatar load from database');
        await this.loadAvatarFromDatabase(userId);
    },
    
    /**
     * Load avatar/profile picture from client database record
     */
    loadAvatarFromDatabase: async function(userId) {
        try {
            console.log('[Rooted Vitality Avatar] loadAvatarFromDatabase() called for userId:', userId);
            
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
            
            console.log('[Rooted Vitality Avatar] Clients table query result:', { 
                hasClients: !!clients,
                error: error?.message || 'none'
            });
            
            if (error) {
                console.warn('[Rooted Vitality Avatar] Database error:', error);
                this.setInitialFromUser();
                return;
            }
            
            if (!clients) {
                console.log('[Rooted Vitality Avatar] No client record found, using fallback');
                this.setInitialFromUser();
                return;
            }
            
            console.log('[Rooted Vitality Avatar] Client data retrieved:', {
                firstName: clients.first_name,
                hasProfilePicture: !!clients.profile_picture_url
            });
            
            // Determine what to show
            const profilePictureUrl = clients.profile_picture_url;
            const firstName = clients.first_name;
            
            if (profilePictureUrl) {
                // Has a profile picture - display it
                console.log('[Rooted Vitality Avatar] Profile picture URL found, updating header with image');
                this.updateHeaderWithPicture(profilePictureUrl);
                this.pictureLoaded = true;
            } else if (firstName) {
                // No picture, show first initial
                console.log('[Rooted Vitality Avatar] No profile picture, showing first initial from name:', firstName);
                this.updateHeaderWithInitial(firstName);
                this.avatarLoaded = true;
            } else {
                // Fallback
                console.log('[Rooted Vitality Avatar] No name or picture, using default');
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
                console.log('[Rooted Vitality Avatar] Fallback: Using firstName from authManager:', userData.firstName);
                this.updateHeaderWithInitial(userData.firstName);
                this.avatarLoaded = true;
            } else {
                console.log('[Rooted Vitality Avatar] Fallback: No first name, using default');
                this.updateHeaderWithInitial('U');
                this.avatarLoaded = true;
            }
        } catch (error) {
            console.log('[Rooted Vitality Avatar] Fallback error, using default initial');
            this.updateHeaderWithInitial('U');
            this.avatarLoaded = true;
        }
    },
    
    /**
     * Update header with profile picture image
     */
    updateHeaderWithPicture: function(pictureUrl) {
        console.log('[Rooted Vitality Avatar] updateHeaderWithPicture() called');
        this.retryCount = 0; // Reset retries for this operation
        
        // Wait for avatar button to be ready
        const waitForAvatarBtn = () => {
            const avatarBtn = document.querySelector('.rv-avatar-btn');
            
            if (!avatarBtn) {
                if (this.retryCount < this.maxRetries) {
                    this.retryCount++;
                    console.log(`[Rooted Vitality Avatar] Avatar button not found (attempt ${this.retryCount}/${this.maxRetries})`);
                    setTimeout(() => waitForAvatarBtn(), 150);
                } else {
                    console.warn('[Rooted Vitality Avatar] Avatar button not found after max retries');
                }
                return;
            }
            
            console.log('[Rooted Vitality Avatar] Avatar button found, updating with profile picture');
            
            // Clear retries on success
            this.retryCount = 0;
            
            // Hide the text initial
            const avatarInitial = avatarBtn.querySelector('.rv-avatar-initial');
            if (avatarInitial) {
                avatarInitial.style.display = 'none';
                console.log('[Rooted Vitality Avatar] Hidden initial text');
            }
            
            // Remove existing image if present
            const existingImg = avatarBtn.querySelector('img');
            if (existingImg) {
                existingImg.remove();
                console.log('[Rooted Vitality Avatar] Removed existing image');
            }
            
            // Create and add new avatar image
            const avatarImg = document.createElement('img');
            avatarImg.src = pictureUrl;
            avatarImg.alt = 'Profile Picture';
            avatarImg.style.width = '100%';
            avatarImg.style.height = '100%';
            avatarImg.style.objectFit = 'cover';
            avatarImg.style.borderRadius = 'inherit';
            avatarImg.onload = () => {
                console.log('[Rooted Vitality Avatar] ✓ Profile picture loaded successfully');
            };
            avatarImg.onerror = () => {
                console.warn('[Rooted Vitality Avatar] Profile picture failed to load, falling back to initial');
                avatarImg.remove();
                this.fallbackToInitial();
            };
            
            avatarBtn.appendChild(avatarImg);
            console.log('[Rooted Vitality Avatar] ✓ Profile picture appended to avatar button');
        };
        
        waitForAvatarBtn();
    },
    
    /**
     * Update header with first initial
     */
    updateHeaderWithInitial: function(nameOrInitial) {
        console.log('[Rooted Vitality Avatar] updateHeaderWithInitial() called with:', nameOrInitial);
        this.retryCount = 0; // Reset retries for this operation
        
        // Wait for avatar initial element to be ready
        const waitForInitial = () => {
            const avatarInitial = document.getElementById('rvAvatarInitial');
            
            if (!avatarInitial) {
                if (this.retryCount < this.maxRetries) {
                    this.retryCount++;
                    console.log(`[Rooted Vitality Avatar] Avatar initial element not found (attempt ${this.retryCount}/${this.maxRetries})`);
                    setTimeout(() => waitForInitial(), 150);
                } else {
                    console.warn('[Rooted Vitality Avatar] Avatar initial element not found after max retries');
                }
                return;
            }
            
            console.log('[Rooted Vitality Avatar] Avatar initial element found');
            
            // Clear retries on success
            this.retryCount = 0;
            
            // Extract first letter
            const firstLetter = nameOrInitial?.charAt(0)?.toUpperCase() || 'U';
            
            // Update the initial
            avatarInitial.textContent = firstLetter;
            avatarInitial.style.display = 'flex';
            avatarInitial.style.alignItems = 'center';
            avatarInitial.style.justifyContent = 'center';
            
            console.log('[Rooted Vitality Avatar] ✓ Avatar initial updated to:', firstLetter);
        };
        
        waitForInitial();
    },
    
    /**
     * Fallback when image fails to load
     */
    fallbackToInitial: function() {
        console.log('[Rooted Vitality Avatar] Fallback to initial triggered');
        const userData = window.authManager?.getCurrentUser?.();
        const firstName = userData?.firstName || 'U';
        this.updateHeaderWithInitial(firstName);
    }
};

// Auto-initialize when this script loads and supabase is ready
console.log('[Rooted Vitality] Setting up client avatar auto-initialization');

// Wrapper to initialize avatar whenever needed
async function initializeClientAvatarIfNeeded() {
    if (!window.supabaseClient) {
        console.log('[Rooted Vitality Avatar] Waiting for supabase...');
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
    console.log('[Rooted Vitality Avatar] Header found, initializing avatar');
    window.ClientHeaderAvatar.retryCount = 0; // Reset retries for fresh attempt
    window.ClientHeaderAvatar.pictureLoaded = false; // Reset state
    window.ClientHeaderAvatar.avatarLoaded = false; // Reset state
    await window.ClientHeaderAvatar.initialize();
}

// Wait for supabase client to be available
const waitForSupabase = () => {
    if (window.supabaseClient) {
        console.log('[Rooted Vitality Avatar] Supabase client available');
        initializeClientAvatarIfNeeded();
    } else {
        console.log('[Rooted Vitality Avatar] Waiting for supabase client...');
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
    console.log('[Rooted Vitality Avatar] Window load event - reinitializing avatar');
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
            console.log('[Rooted Vitality Avatar] Wrapping injectLoggedInHeader');
            const result = await originalInjectLoggedInHeader.call(this, ...args);
            
            // After header is injected, reinitialize avatar
            setTimeout(() => {
                console.log('[Rooted Vitality Avatar] Header injected by RV, reinitializing avatar');
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
    console.log('[Rooted Vitality Avatar] Header injected event received');
    window.ClientHeaderAvatar.retryCount = 0;
    window.ClientHeaderAvatar.pictureLoaded = false;
    window.ClientHeaderAvatar.avatarLoaded = false;
    window.ClientHeaderAvatar.initialize();
}, false);

// Also reinitialize when page becomes visible (user returns from another tab/page)
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        console.log('[Rooted Vitality Avatar] Page became visible, checking avatar');
        const avatarBtn = document.querySelector('.rv-avatar-btn');
        if (avatarBtn) {
            // Check if avatar has the picture or just the initial
            const img = avatarBtn.querySelector('img');
            const initial = avatarBtn.querySelector('.rv-avatar-initial');
            
            // If showing initial but should show picture, reinitialize
            if (initial && initial.style.display !== 'none') {
                console.log('[Rooted Vitality Avatar] Page visible - avatar showing initial, reinitializing to check for picture');
                window.ClientHeaderAvatar.retryCount = 0;
                window.ClientHeaderAvatar.pictureLoaded = false;
                window.ClientHeaderAvatar.avatarLoaded = false;
                window.ClientHeaderAvatar.initialize();
            }
        }
    }
}, false);

























































