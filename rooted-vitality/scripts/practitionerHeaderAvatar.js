/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: scripts/practitionerHeaderAvatar.js                         ║
║  Purpose: Universal practitioner avatar/logo initialization        ║
║  Loads on ALL practitioner pages with proper initialization order  ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

PURPOSE:
- Ensure practitioner avatar (initial or logo) loads universally on ALL pages
- Display first initial until business logo is uploaded
- Swap to logo once uploaded
- Handle timing properly regardless of page load order
- Works on: profile.html, index.html, match-settings.html, etc.
*/

console.log('[Rooted Vitality] practitionerHeaderAvatar.js loading...');

window.PractitionerHeaderAvatar = {
    avatarLoaded: false,
    logoLoaded: false,
    maxRetries: 5,
    retryCount: 0,
    
    /**
     * Initialize avatar/logo loading - call this when user is confirmed as practitioner
     * Does NOT require RootedVitality to be loaded first
     */
    initialize: async function() {
        console.log('[Rooted Vitality Avatar] initialize() called');
        
        // Check if this is a practitioner in practitioner view
        const userData = window.authManager?.getCurrentUser?.();
        const activeView = localStorage.getItem('active_view') || 'client';
        
        console.log('[Rooted Vitality Avatar] User data:', userData);
        console.log('[Rooted Vitality Avatar] Active view:', activeView);
        
        if (userData?.role !== 'practitioner') {
            console.log('[Rooted Vitality Avatar] User is not a practitioner, skipping');
            return;
        }
        
        if (activeView !== 'practitioner') {
            console.log('[Rooted Vitality Avatar] Not in practitioner view, skipping');
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
        
        // Load avatar/logo from database
        await this.loadAvatarFromDatabase(userId);
    },
    
    /**
     * Load avatar/logo from practitioner database record
     */
    loadAvatarFromDatabase: async function(userId) {
        try {
            console.log('[Rooted Vitality Avatar] loadAvatarFromDatabase() called for userId:', userId);
            
            if (!window.supabaseClient) {
                console.warn('[Rooted Vitality Avatar] supabaseClient not available');
                return;
            }
            
            // Fetch practitioner data
            const { data: practitioner, error } = await window.supabaseClient
                .from('practitioners')
                .select('legal_business_name, practice_logo_url')
                .eq('user_id', userId)
                .single();
            
            console.log('[Rooted Vitality Avatar] Database query result:', { 
                hasPractitioner: !!practitioner,
                error: error?.message || 'none'
            });
            
            if (error && error.code !== 'PGRST116') {
                console.warn('[Rooted Vitality Avatar] Database error:', error);
                this.setInitialFromUser();
                return;
            }
            
            if (!practitioner) {
                console.log('[Rooted Vitality Avatar] No practitioner record found, using fallback');
                this.setInitialFromUser();
                return;
            }
            
            console.log('[Rooted Vitality Avatar] Practitioner data retrieved:', {
                name: practitioner.legal_business_name,
                hasPracticeLogoUrl: !!practitioner.practice_logo_url
            });
            
            // Determine what to show
            const logoUrl = practitioner.practice_logo_url;
            const firstName = practitioner.legal_business_name;
            
            if (logoUrl) {
                // Has a logo - display it
                console.log('[Rooted Vitality Avatar] Logo URL found, updating header with logo');
                this.updateHeaderWithLogo(logoUrl);
                this.logoLoaded = true;
            } else if (firstName) {
                // No logo, show first initial
                console.log('[Rooted Vitality Avatar] No logo, showing first initial from name:', firstName);
                this.updateHeaderWithInitial(firstName);
                this.avatarLoaded = true;
            } else {
                // Fallback
                console.log('[Rooted Vitality Avatar] No name or logo, using default');
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
     * Update header with business logo image
     */
    updateHeaderWithLogo: function(logoUrl) {
        console.log('[Rooted Vitality Avatar] updateHeaderWithLogo() called');
        
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
            
            console.log('[Rooted Vitality Avatar] Avatar button found, updating with logo');
            
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
            avatarImg.src = logoUrl;
            avatarImg.alt = 'Business Logo';
            avatarImg.style.width = '100%';
            avatarImg.style.height = '100%';
            avatarImg.style.objectFit = 'cover';
            avatarImg.style.borderRadius = 'inherit';
            avatarImg.onload = () => {
                console.log('[Rooted Vitality Avatar] ✓ Logo image loaded successfully');
            };
            avatarImg.onerror = () => {
                console.warn('[Rooted Vitality Avatar] Logo image failed to load, falling back to initial');
                avatarImg.remove();
                this.fallbackToInitial();
            };
            
            avatarBtn.appendChild(avatarImg);
            console.log('[Rooted Vitality Avatar] ✓ Logo image appended to avatar button');
        };
        
        waitForAvatarBtn();
    },
    
    /**
     * Update header with first initial
     */
    updateHeaderWithInitial: function(nameOrInitial) {
        console.log('[Rooted Vitality Avatar] updateHeaderWithInitial() called with:', nameOrInitial);
        
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
            
            console.log('[Rooted Vitality Avatar] Avatar initial element found, updating');
            
            // Clear retries on success
            this.retryCount = 0;
            
            // Get first character as initial
            const initial = (nameOrInitial && nameOrInitial.length > 0) 
                ? nameOrInitial.charAt(0).toUpperCase() 
                : 'U';
            
            // Also remove any existing image elements
            const avatarBtn = document.querySelector('.rv-avatar-btn');
            if (avatarBtn) {
                const existingImg = avatarBtn.querySelector('img');
                if (existingImg) {
                    existingImg.remove();
                    console.log('[Rooted Vitality Avatar] Removed existing image before showing initial');
                }
            }
            
            // Update and show initial
            avatarInitial.textContent = initial;
            avatarInitial.style.display = 'block';
            
            console.log(`[Rooted Vitality Avatar] ✓ Avatar initial set to: "${initial}"`);
        };
        
        waitForInitial();
    },
    
    /**
     * Fallback to initial if logo fails to load
     */
    fallbackToInitial: function() {
        const userData = window.authManager?.getCurrentUser?.();
        if (userData?.firstName) {
            this.updateHeaderWithInitial(userData.firstName);
        } else {
            this.updateHeaderWithInitial('U');
        }
    },
    
    /**
     * Called when practitioner uploads a new logo - updates header immediately
     * Used by proProfile.js when uploading avatar
     */
    updateLogoFromUpload: function(logoUrl) {
        console.log('[Rooted Vitality Avatar] updateLogoFromUpload called with:', logoUrl.substring(0, 50) + '...');
        this.updateHeaderWithLogo(logoUrl);
        this.logoLoaded = true;
    }
};

// Auto-initialize when document is ready and dependencies are available
// Use a more robust approach with retries
const initPractitionerAvatar = () => {
    const maxWaitAttempts = 50; // 5 seconds max
    let attempts = 0;
    
    const tryInit = () => {
        attempts++;
        
        // Check for all required dependencies
        const hasDependencies = typeof window.authManager !== 'undefined' && 
                               typeof window.supabaseClient !== 'undefined';
        
        const hasHeader = document.getElementById('rvHeader') !== null;
        
        if (hasDependencies && hasHeader) {
            console.log(`[Rooted Vitality Avatar] All dependencies ready (attempt ${attempts}), initializing`);
            window.PractitionerHeaderAvatar.initialize();
            return;
        }
        
        if (attempts < maxWaitAttempts) {
            if (attempts === 1 || attempts % 10 === 0) {
                console.log(`[Rooted Vitality Avatar] Waiting for dependencies... (attempt ${attempts}/${maxWaitAttempts})`);
            }
            setTimeout(tryInit, 100);
        } else {
            console.log('[Rooted Vitality Avatar] Max wait attempts reached, avatar may not load');
        }
    };
    
    // Start trying on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryInit);
    } else {
        tryInit();
    }
};

// Start the initialization
initPractitionerAvatar();

console.log('[Rooted Vitality] practitionerHeaderAvatar.js loaded');
