// ╔════════════════════════════════════════════════════════════════════════════╗
// ║  ROOTED VITALITY, INC.                                                     ║
// ║  File: dashboard/pro/scripts/practitionerHeaderAvatar.js                   ║
// ║  Purpose: Universal practitioner avatar/logo initialization                ║
// ║  Holistic Wellness · Modern Connection Platform                            ║
// ║  rootedvitality.com | 2025                                                 ║
// ╚════════════════════════════════════════════════════════════════════════════╝
//
// TABLE OF CONTENTS
//   1. INITIALIZATION STATE
//   2. INITIALIZE (Auth & Avatar Load)
//   3. LOAD FROM DATABASE (Practitioner Data)
//   4. FALLBACK FROM USER (AuthManager Data)
//   5. UPDATE WITH LOGO (Image Display)
//   6. UPDATE WITH INITIAL (Text Display)
//   7. FALLBACK TO INITIAL (Error Handling)
//   8. UPDATE FROM UPLOAD (Dynamic Logo)
//   9. AUTO-INITIALIZATION
//
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// 1. INITIALIZATION STATE
// ═══════════════════════════════════════════════════════════════════════════

window.PractitionerHeaderAvatar = {
    avatarLoaded: false,
    logoLoaded: false,
    maxRetries: 5,
    retryCount: 0,
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 2. INITIALIZE (Auth & Avatar Load)
    // ═══════════════════════════════════════════════════════════════════════════
    initialize: async function() {
        // Check if this is a practitioner in practitioner view
        const userData = window.authManager?.getCurrentUser?.();
        const activeView = localStorage.getItem('active_view') || 'client';
        
        if (userData?.role !== 'practitioner') {
            return;
        }
        
        if (activeView !== 'practitioner') {
            return;
        }
        
        // Get current user ID from auth
        let userId = null;
        try {
            if (!window.supabaseClient) {
                setTimeout(() => this.initialize(), 300);
                return;
            }
            
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            userId = user?.id;
        } catch (error) {
            return;
        }
        
        if (!userId) {
            return;
        }
        
        // Load avatar/logo from database
        await this.loadAvatarFromDatabase(userId);
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 3. LOAD FROM DATABASE (Practitioner Data)
    // ═══════════════════════════════════════════════════════════════════════════
    loadAvatarFromDatabase: async function(userId) {
        try {
            if (!window.supabaseClient) {
                return;
            }
            
            // Fetch practitioner data from practitioners table
            const { data: practitioner, error: practError } = await window.supabaseClient
                .from('practitioners')
                .select('legal_business_name, serial_number')
                .eq('id', userId)
                .single();
            
            if (practError && practError.code !== 'PGRST116') {
                this.setInitialFromUser();
                return;
            }
            
            if (!practitioner) {
                this.setInitialFromUser();
                return;
            }
            
            // Fetch profile logo from practitioner_profiles table
            let logoUrl = null;
            if (practitioner.serial_number) {
                const { data: profile, error: profileError } = await window.supabaseClient
                    .from('practitioner_profiles')
                    .select('practice_logo_url')
                    .eq('id', userId)
                    .single();
                
                if (!profileError && profile) {
                    logoUrl = profile.practice_logo_url;
                }
            }
            
            const firstName = practitioner.legal_business_name;
            
            if (logoUrl) {
                // Has a logo - display it
                this.updateHeaderWithLogo(logoUrl);
                this.logoLoaded = true;
            } else if (firstName) {
                // No logo, show first initial
                this.updateHeaderWithInitial(firstName);
                this.avatarLoaded = true;
            } else {
                // Fallback
                this.updateHeaderWithInitial('U');
                this.avatarLoaded = true;
            }
            
        } catch (error) {
            this.setInitialFromUser();
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 4. FALLBACK FROM USER (AuthManager Data)
    // ═══════════════════════════════════════════════════════════════════════════
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
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 5. UPDATE WITH LOGO (Image Display)
    // ═══════════════════════════════════════════════════════════════════════════
    updateHeaderWithLogo: function(logoUrl) {
        // Wait for avatar button to be ready
        const waitForAvatarBtn = () => {
            const avatarBtn = document.querySelector('.rv-avatar-btn');
            
            if (!avatarBtn) {
                if (this.retryCount < this.maxRetries) {
                    this.retryCount++;
                    setTimeout(() => waitForAvatarBtn(), 150);
                }
                return;
            }
            
            // Clear retries on success
            this.retryCount = 0;
            
            // Hide the text initial
            const avatarInitial = avatarBtn.querySelector('.rv-avatar-initial');
            if (avatarInitial) {
                avatarInitial.style.display = 'none';
            }
            
            // Remove existing image if present
            const existingImg = avatarBtn.querySelector('img');
            if (existingImg) {
                existingImg.remove();
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
                // Logo loaded successfully
            };
            avatarImg.onerror = () => {
                avatarImg.remove();
                this.fallbackToInitial();
            };
            
            avatarBtn.appendChild(avatarImg);
        };
        
        waitForAvatarBtn();
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 6. UPDATE WITH INITIAL (Text Display)
    // ═══════════════════════════════════════════════════════════════════════════
    updateHeaderWithInitial: function(nameOrInitial) {
        // Wait for avatar initial element to be ready
        const waitForInitial = () => {
            const avatarInitial = document.getElementById('rvAvatarInitial');
            
            if (!avatarInitial) {
                if (this.retryCount < this.maxRetries) {
                    this.retryCount++;
                    setTimeout(() => waitForInitial(), 150);
                }
                return;
            }
            
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
                }
            }
            
            // Update and show initial
            avatarInitial.textContent = initial;
            avatarInitial.style.display = 'block';
        };
        
        waitForInitial();
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 7. FALLBACK TO INITIAL (Error Handling)
    // ═══════════════════════════════════════════════════════════════════════════
    fallbackToInitial: function() {
        const userData = window.authManager?.getCurrentUser?.();
        if (userData?.firstName) {
            this.updateHeaderWithInitial(userData.firstName);
        } else {
            this.updateHeaderWithInitial('U');
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 8. UPDATE FROM UPLOAD (Dynamic Logo)
    // ═══════════════════════════════════════════════════════════════════════════
    updateLogoFromUpload: function(logoUrl) {
        this.updateHeaderWithLogo(logoUrl);
        this.logoLoaded = true;
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// 9. AUTO-INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════
const maxWaitAttempts = 50; // 5 seconds max
let attempts = 0;

const tryInit = () => {
    attempts++;
    
    // Check for all required dependencies
    const hasDependencies = typeof window.authManager !== 'undefined' && 
                           typeof window.supabaseClient !== 'undefined';
    
    const hasHeader = document.getElementById('rvHeader') !== null;
    
    if (hasDependencies && hasHeader) {
        window.PractitionerHeaderAvatar.initialize();
        return;
    }
    
    if (attempts < maxWaitAttempts) {
        setTimeout(tryInit, 100);
    }
};

// Start trying on DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInit);
} else {
    tryInit();
}