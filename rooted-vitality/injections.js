/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: injections.js                                               ║
║  Purpose: Global Utilities & Helper Functions                      ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

TABLE OF CONTENTS
  1. BRANDING & CONFIG
  2. BACK BUTTON FUNCTIONALITY
  3. UTILITY FUNCTIONS
  4. INITIALIZATION
*/
// ======================================================
// GLOBAL NAVIGATION FUNCTIONS
// ======================================================
window.navigateToPage = function(page) {
  // Since we're always on pages within /dashboard/pro/ or /dashboard/client/
  // and the header is injected, we can use a simple relative path
  window.location.href = './' + page + '.html';
};

window.logout = function() {
  if (window.authManager && typeof window.authManager.logout === 'function') {
    window.authManager.logout();
  } else {
    window.location.href = '/rooted-vitality/index.html';
  }
};

/**
 * Open Contact Us Modal
 */
window.openContactModal = function() {
    const modal = document.getElementById('contact-us-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
};

/**
 * Close Contact Us Modal
 */
window.closeContactModal = function() {
    const modal = document.getElementById('contact-us-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
};

// ======================================================
const RootedVitality = {
    config: {
        siteName: 'Rooted Vitality',
        siteUrl: '/rooted-vitality/',
        brandColor: '#77883e',
        accentGold: '#d4c47c',
        accentGreen: '#ebf6e8',
        accentCream: '#fbf7ec',
        accentPeach: '#fae2ca',
        year: 2025
    },
    
    // Prevent duplicate renders
    _headerRendering: false,
    _headerRendered: false,
    _footerRendered: false,
    _logoLoadAttempts: 0,
    _logoLoadedForUser: {}, // Track per user ID instead of global
    _clientAvatarLoadedForUser: {}, // Track client avatar loads per user
    
    // ======================================================
    // 2. BACK BUTTON FUNCTIONALITY
    // ======================================================
    /**
     * Inject back button that appears on article pages
     * Usage: RootedVitality.injectBackButton();
     */
    injectBackButton: function() {
        const backBtn = document.querySelector('.back-button');
        if (backBtn) {
            backBtn.addEventListener('click', function(e) {
                if (this.href === '../index.html' || this.href === './index.html') {
                    e.preventDefault();
                    window.history.back();
                }
            });
        }
    },
    
    // ======================================================
    // 3. UTILITY FUNCTIONS
    // ======================================================
    /**
     * Format date to readable string
     * Usage: RootedVitality.formatDate(new Date());
     */
    formatDate: function(date) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(date).toLocaleDateString('en-US', options);
    },
    
    /**
     * Generate article metadata
     * Usage: RootedVitality.generateMeta('5 min read', 'Customer Guide');
     */
    generateMeta: function(readTime, category) {
        return `${readTime} • ${category}`;
    },
    
    /**
     * Smooth scroll to element
     * Usage: RootedVitality.smoothScroll('.target-element');
     */
    smoothScroll: function(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },
    
    /**
     * Track page view (for analytics)
     * Usage: RootedVitality.trackPageView();
     */
    trackPageView: function() {
        const pagePath = window.location.pathname;
        // Hook for future analytics integration
    },
    
    /**
     * Detect if user prefers dark mode
     * Usage: RootedVitality.prefersDarkMode();
     */
    prefersDarkMode: function() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    },
    
    /**
     * Debounce function for performance
     * Usage: window.addEventListener('resize', RootedVitality.debounce(callback, 250));
     */
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    /**
     * Log warning/info to console with branding
     * Usage: RootedVitality.log('Custom message');
     */
    log: function(message, type = 'info') {
        const style = 'color: #77883e; font-weight: bold;';
    },
    
    // ======================================================
    // PHASE 1: UNIVERSAL HEADER SYSTEM
    // ======================================================
    /**
     * Render role-based header component
     * Fetches appropriate header based on user authentication state
     * @param {string} role - 'public' (default), 'client', or 'practitioner'
     * @param {string} view - For practitioners: 'client' or 'practitioner' view (defaults to localStorage.active_view or 'client')
     * Usage: RootedVitality.renderHeader('practitioner', 'practitioner');
     */
    renderHeader: async function(role = 'public', view = null) {
        // Prevent concurrent renders
        if (this._headerRendering) {
            return;
        }
        
        // Check if header already rendered with the same role and view
        const existingHeader = document.getElementById('rvHeader');
        if (existingHeader) {
            const headerRole = existingHeader.dataset.role || 'public';
            const headerView = existingHeader.dataset.view || 'client';
            
            // If header exists with SAME role and view, skip render
            if (headerRole === role && headerView === (view || 'client')) {
                
                // But still load logo if practitioner view
                if (role === 'practitioner' && view === 'practitioner') {
                    this.loadPractitionerLogo();
                }
                return;
            } else {
                // Different role or view - allow re-render
                
            }
        }
        
        this._headerRendering = true;
        
        try {
            // Determine view for practitioners
            if (role === 'practitioner' && !view) {
                view = localStorage.getItem('active_view') || 'client';
            }
            
            
        
            // Check if a correct header already exists
            const existingHeader = document.getElementById('rvHeader');
            if (existingHeader) {
                const headerRole = existingHeader.dataset.role || 'public';
                const headerView = existingHeader.dataset.view || 'client';
                
                if (headerRole === role && headerView === (view || 'client')) {
                    this._headerRendering = false;
                    return;
                }
                existingHeader.remove();
            }
            
            // Detect if we're in a subdirectory and how deep
            const currentPath = window.location.pathname;
            let isSubdirectory = false;
            let pathPrefix = './';
            
            // Check if page has set a custom path prefix (for deep article pages) - HIGHEST PRIORITY
            if (window.ARTICLE_PATH_PREFIX) {
                pathPrefix = window.ARTICLE_PATH_PREFIX;
                isSubdirectory = true;
            }
            // Check if we're in /dashboard/pro/pages/ (three levels deep)
            else if (currentPath.includes('/dashboard/pro/pages/')) {
                isSubdirectory = true;
                pathPrefix = '../../../';
            }
            // Check if we're in /dashboard/client/pages/ (three levels deep)
            else if (currentPath.includes('/dashboard/client/pages/')) {
                isSubdirectory = true;
                pathPrefix = '../../../';
            }
            // Check if we're in /dashboard/pro/ or /dashboard/client/ (two levels deep - legacy)
            else if (currentPath.includes('/dashboard/pro/') || currentPath.includes('/dashboard/client/')) {
                isSubdirectory = true;
                pathPrefix = '../../';
            }
            // Check for other first-level subdirectories
            else if (currentPath.includes('/articles/') || 
                     currentPath.includes('/policies/') || 
                     currentPath.includes('/dashboard/') || 
                     currentPath.includes('/products/') ||
                     currentPath.includes('/help-center/')) {
                isSubdirectory = true;
                pathPrefix = '../';
            }
            
            // Determine which header component to load
            let headerFile = '';
            
            switch(role) {
                case 'client':
                    headerFile = 'header_client.html';
                    break;
                case 'practitioner':
                    // For practitioners, use view to decide which header to show
                    headerFile = (view === 'practitioner') ? 'header_practitioner.html' : 'header_client.html';
                    break;
                case 'public':
                default:
                    headerFile = 'header_public.html';
                    break;
            }
            
            const headerPath = pathPrefix + 'components/' + headerFile;
            // Fetch the header component
            const response = await fetch(headerPath);
            if (!response.ok) {
                throw new Error(`Failed to fetch header: ${response.status}`);
            }
            
            let headerHTML = await response.text();
            
            // Replace absolute paths with correct relative paths based on current location
            if (isSubdirectory) {
                // Use the calculated pathPrefix for replacements (respects window.ARTICLE_PATH_PREFIX if set)
                let replacementPrefix = pathPrefix;
                
                // Only override if we didn't use a custom path prefix
                if (!window.ARTICLE_PATH_PREFIX) {
                    // For /dashboard/pro/ we need ../../
                    if (currentPath.includes('/dashboard/pro/')) {
                        replacementPrefix = '../../';
                    } else {
                        replacementPrefix = '../';
                    }
                }
                
                // Replace absolute paths (/) with relative paths
                // BUT: Don't replace paths that already contain /rooted-vitality/ (they're already correct)
                // Keep all /rooted-vitality/ paths as absolute root paths
                headerHTML = headerHTML
                    .replace(/href="\/(?!rooted-vitality)([^"]+)"/g, `href="${replacementPrefix}$1"`)
                    .replace(/src="\/(?!rooted-vitality)([^"]+)"/g, `src="${replacementPrefix}$1"`);
            }
            // In root: paths remain as-is (/)
            
            // Find header-inject element if it exists on the page
            const headerContainer = document.getElementById('header-inject');
            
            // Inject at top of body or into header-inject container
            if (document.body) {
                if (headerContainer) {
                    // If header-inject element exists, inject into it
                    headerContainer.innerHTML = headerHTML;
                } else {
                    // Otherwise inject at beginning of body (legacy behavior)
                    document.body.insertAdjacentHTML('afterbegin', headerHTML);
                }
                
                // Mark the header with role and view for future reference
                const injectedHeader = document.getElementById('rvHeader');
                if (injectedHeader) {
                    injectedHeader.dataset.role = role;
                    injectedHeader.dataset.view = view || 'client';
                }
                this.log(`${role.charAt(0).toUpperCase() + role.slice(1)} header loaded successfully`);
                
                // Initialize public header login button
                if (role === 'public') {
                    const loginBtn = document.getElementById('loginBtn');
                    if (loginBtn) {
                        loginBtn.addEventListener('click', function(e) {
                            e.preventDefault();
                            if (window.openLoginModal && typeof window.openLoginModal === 'function') {
                                window.openLoginModal('client');
                            } else {
                                console.error('[Rooted Vitality] openLoginModal not available');
                            }
                        });
                    }
                }
                
                // Hide "Become a Practitioner" button if user is already a practitioner in client view
                if (role === 'practitioner' && view === 'client') {
                    const becomePractitionerBtn = document.getElementById('becomePractitionerBtn');
                    if (becomePractitionerBtn) {
                        becomePractitionerBtn.style.display = 'none';
                    }
                }
                
                // Initialize logged-in header interactions if applicable
                if (role === 'client' || role === 'practitioner') {
                    // Small delay to ensure DOM is ready
                    setTimeout(() => {
                        // Attach logo behavior for dynamic routing
                        this.attachLogoBehavior(role, view);
                        
                        // Attach view switcher for practitioners (regardless of current view)
                        if (role === 'practitioner') {
                            this.attachViewSwitcher();
                        }
                        
                        this.initAvatarMenu();
                        this.initNotificationsMenu();
                        this.initLogoutButtons();
                        
                        // Subscribe to real-time notifications for new matches
                        this.subscribeToNewMatches();
                        
                        // Subscribe to real-time notification updates (badge, dropdown list)
                        // NOTE: For practitioner pages, this is handled by practitioner-notifications.js module
                        // Only activate for client pages to avoid duplicate listeners
                        if (role === 'client') {
                            this.subscribeToNotificationUpdates();
                        }
                        
                        // Load initial notifications to populate badge on page load
                        this.loadNotifications();
                        
                        // Update avatar initial with user's first name
                        let firstName = '';
                        
                        // Try multiple sources for firstName
                        try {
                            const userData = window.authManager?.getCurrentUser();
                            
                            
                            if (userData?.firstName) {
                                firstName = userData.firstName;
                                
                            } else {
                                // Fallback: get from localStorage
                                const storedUser = localStorage.getItem('rvUser');
                                if (storedUser) {
                                    const user = JSON.parse(storedUser);
                                    firstName = user.firstName || '';
                                }
                            }
                        } catch (e) {
                        }
                        
                        if (firstName) {
                            this.updateAvatarInitial(firstName);
                        } else {
                            this.updateAvatarInitial('U');
                        }
                        
                        // Load appropriate avatar based on role and view
                        if (role === 'practitioner' && view === 'practitioner') {
                            // Practitioner in practitioner view - show business logo
                            this.loadPractitionerLogo();
                        } else if (role === 'practitioner' && view === 'client') {
                            // Practitioner in client view - show client avatar (not business logo)
                            this.loadClientAvatar();
                        } else if (role === 'client') {
                            // Client - load client avatar
                            this.loadClientAvatar();
                        }
                        
                        // Initialize mobile menu toggle
                        this.initMobileMenuToggle();
                    }, 100);
                } else if (role === 'public') {
                    // For public header, also initialize mobile menu
                    setTimeout(() => {
                        this.initMobileMenuToggle();
                    }, 100);
                }
            } else {
            }
        } catch (error) {
            console.error('[Rooted Vitality] Error rendering header:', error);
            // Fallback: inject basic public header
            this._injectFallbackPublicHeader();
        } finally {
            this._headerRendering = false;
            this._headerRendered = true;
        }
    },
    
    /**
     * Initialize mobile menu toggle for responsive header
     * Handles hamburger menu for screens smaller than 768px
     */
    initMobileMenuToggle: function() {
        const toggle = document.querySelector('.rv-menu-toggle');
        const nav = document.querySelector('.rv-nav');
        
        if (!toggle || !nav) {
            return;
        }
        
        // Mobile menu toggle with keyboard support
        toggle.addEventListener('click', () => {
            nav.classList.toggle('open');
            const isOpen = nav.classList.contains('open');
            toggle.setAttribute('aria-expanded', isOpen);
        });
        
        // Close mobile menu when hamburger nav links are clicked
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
            });
        });
        
        // Close mobile menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && nav.classList.contains('open')) {
                nav.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!toggle.contains(e.target) && !nav.contains(e.target) && nav.classList.contains('open')) {
                nav.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });
    },
    
    /**
     * Attach logo behavior for dynamic routing based on view
     * @param {string} role - 'client' or 'practitioner'
     * @param {string} view - For practitioners: 'client' or 'practitioner'
     */
    attachLogoBehavior: function(role, view) {
        const logo = document.querySelector('.rv-logo');
        if (!logo) {
            return;
        }
        
        let targetHref = this.config.siteUrl + 'index.html';
        if (role === 'practitioner' && view === 'practitioner') {
            targetHref = this.config.siteUrl + 'dashboard/pro/pages/index.html';
        }
        
        logo.setAttribute('href', targetHref);
    },
    
    /**
     * Attach view switcher for practitioners to toggle between Client and Practitioner views
     * Looks for buttons with data-switch-view attribute and adds click handlers
     */
    attachViewSwitcher: function() {
        const elements = document.querySelectorAll('[data-switch-view]');
        
        
        document.querySelectorAll('[data-switch-view]').forEach(btn => {
            const switchValue = btn.dataset.switchView;
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                
                const newView = btn.dataset.switchView === 'practitioner' ? 'practitioner' : 'client';
                
                // Persist active view
                localStorage.setItem('active_view', newView);
                // Navigate using absolute path from rooted-vitality root
                const currentPath = window.location.pathname;
                let targetUrl = '';
                if (newView === 'practitioner') {
                    targetUrl = '/rooted-vitality/dashboard/pro/pages/index.html';
                } else {
                    targetUrl = '/rooted-vitality/dashboard/client/pages/client-profile.html';
                }
                window.location.href = targetUrl;
            });
        });
    },
    
    /**
     * Fallback public header injection (if component fetch fails)
     * Ensures header always appears even if component loading fails
     */
    _injectFallbackPublicHeader: function() {
        // Detect if we're in a subdirectory
        const currentPath = window.location.pathname;
        const isSubdirectory = currentPath.includes('/articles/') || 
                               currentPath.includes('/policies/') || 
                               currentPath.includes('/dashboard/') || 
                               currentPath.includes('/products/') ||
                               currentPath.includes('/help-center/');
        const pathPrefix = isSubdirectory ? '../' : './';
        
        const fallbackHTML = `
        <header id="rvHeader" class="rv-header rv-header-public">
          <div class="rv-header-inner container-wide">
            <a href="${pathPrefix}index.html" class="rv-logo" aria-label="Rooted Vitality Home">
              <span class="rv-brand-text">Rooted Vitality</span>
            </a>
            <nav class="rv-nav" aria-label="Primary Navigation">
              <a href="${pathPrefix}dashboard/client/pages/client-signup.html" class="rv-nav-link rv-btn-accent">Sign Up</a>
              <a href="${pathPrefix}login.html" class="rv-nav-link rv-nav-login">Log In</a>
            </nav>
          </div>
        </header>
        `;
        
        if (document.body) {
            document.body.insertAdjacentHTML('afterbegin', fallbackHTML);
        }
    },
    
    /**
     * Initialize avatar menu interactions for client header
     * Handles click toggle, keyboard navigation, outside click close
     */
    initAvatarMenu: function() {
        const avatarBtn = document.querySelector('.rv-avatar-btn');
        const avatarDropdown = document.querySelector('.rv-avatar-dropdown');
        const dropdownItems = document.querySelectorAll('.rv-avatar-dropdown .rv-dropdown-item');
        
        if (!avatarBtn || !avatarDropdown) {
            return;
        }
        
        // Toggle dropdown on button click/focus
        avatarBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = avatarDropdown.classList.toggle('show');
            avatarBtn.setAttribute('aria-expanded', isOpen);
            
            if (isOpen && dropdownItems.length > 0) {
                // Focus first item when dropdown opens
                dropdownItems[0].focus();
            }
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!avatarBtn.contains(e.target) && !avatarDropdown.contains(e.target)) {
                avatarDropdown.classList.remove('show');
                avatarBtn.setAttribute('aria-expanded', 'false');
            }
        });
        
        // Keyboard navigation
        avatarBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                avatarBtn.click();
            }
        });
        
        // Close dropdown on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && avatarDropdown.classList.contains('show')) {
                avatarDropdown.classList.remove('show');
                avatarBtn.setAttribute('aria-expanded', 'false');
                avatarBtn.focus();
            }
        });
        
        // Tab navigation within menu
        dropdownItems.forEach((item, index) => {
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    if (e.shiftKey && index === 0) {
                        // Shift+Tab on first item → focus button and close
                        e.preventDefault();
                        avatarDropdown.classList.remove('show');
                        avatarBtn.setAttribute('aria-expanded', 'false');
                        avatarBtn.focus();
                    } else if (!e.shiftKey && index === dropdownItems.length - 1) {
                        // Tab on last item → wrap to button
                        e.preventDefault();
                        avatarDropdown.classList.remove('show');
                        avatarBtn.setAttribute('aria-expanded', 'false');
                        avatarBtn.focus();
                    }
                }
                
                if (e.key === 'Escape') {
                    e.preventDefault();
                    avatarDropdown.classList.remove('show');
                    avatarBtn.setAttribute('aria-expanded', 'false');
                    avatarBtn.focus();
                }
            });
        });
        
        // Show "Practitioner View" link only if user is a practitioner AND currently in client view
        const switchToPractitionerBtn = document.getElementById('switchToPractitioner');
        if (switchToPractitionerBtn) {
            try {
                // Get user data from authManager
                let userData = null;
                if (typeof window.authManager !== 'undefined' && window.authManager.getCurrentUser) {
                    userData = window.authManager.getCurrentUser();
                }
                
                // If no user or role not in userData, check localStorage directly
                let userRole = userData?.role;
                if (!userRole) {
                    const storedUser = localStorage.getItem('rvUser');
                    if (storedUser) {
                        try {
                            const parsedUser = JSON.parse(storedUser);
                            userRole = parsedUser.role;
                        } catch (e) {
                            // ignore parse errors
                        }
                    }
                }
                
                const activeView = localStorage.getItem('active_view') || 'client';
                
                // Show button if: user is practitioner AND they're viewing the client dashboard
                if (userRole === 'practitioner' && activeView === 'client') {
                    switchToPractitionerBtn.classList.remove('hidden');
                    switchToPractitionerBtn.style.display = 'block';
                } else {
                    switchToPractitionerBtn.classList.add('hidden');
                    switchToPractitionerBtn.style.display = 'none';
                }
            } catch (error) {
                console.error('[Header] Error determining practitioner status:', error);
                switchToPractitionerBtn.style.display = 'none';
            }
        }
    },

    /**
     * Update avatar initial with user's first name
     * @param {string} firstName - User's first name
     */
    updateAvatarInitial: function(firstName = 'U') {
        const avatarInitial = document.getElementById('rvAvatarInitial');
        if (avatarInitial) {
            const initial = (firstName && firstName.length > 0) ? firstName.charAt(0).toUpperCase() : 'U';
            avatarInitial.textContent = initial;
        } else {
        }
    },

    /**
     * Update header avatar with profile picture
     * Used when practitioner uploads business logo or client uploads profile picture
     * @param {string} imageUrl - The URL of the profile/logo image
     */
    updateHeaderAvatar: function(imageUrl) {
        if (!imageUrl) return;
        // Try to find and update avatar in the header
        const avatarBtn = document.querySelector('.rv-avatar-btn');
        if (avatarBtn) {
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
            avatarImg.src = imageUrl;
            avatarImg.alt = 'Profile Avatar';
            avatarImg.style.width = '100%';
            avatarImg.style.height = '100%';
            avatarImg.style.objectFit = 'cover';
            avatarImg.style.borderRadius = 'inherit';
            avatarBtn.appendChild(avatarImg);
        } else {
        }
    },

    /**
     * Update header logo/business image in the avatar button
     * Used when practitioner uploads practice logo
     * @param {string} logoUrl - The URL of the logo image
     * @param {string} role - 'client' or 'practitioner'
     * @param {string} view - For practitioners: 'client' or 'practitioner' view
     */
    updateHeaderLogo: function(logoUrl, role = 'practitioner', view = 'practitioner') {
        if (!logoUrl) return;
        // Only update logo for practitioner view with practitioners
        if (role === 'practitioner' && view === 'practitioner') {
            const avatarBtn = document.querySelector('.rv-avatar-btn');
            if (avatarBtn) {
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
                
                // Create and add new logo image
                const logoImg = document.createElement('img');
                logoImg.src = logoUrl;
                logoImg.alt = 'Business Logo';
                logoImg.style.width = '100%';
                logoImg.style.height = '100%';
                logoImg.style.objectFit = 'cover';
                logoImg.style.borderRadius = 'inherit';
                
                // Log when image loads or fails
                logoImg.onload = () => {
                };
                logoImg.onerror = () => {
                    console.error('[Rooted Vitality] Logo image failed to load:', logoUrl);
                };
                
                avatarBtn.appendChild(logoImg);
            } else {
            }
        }
    },

    /**
     * Clear the logo cache for the current user
     * Call this after uploading a new logo to force reload on next page visit
     */
    clearLogoCacheForUser: async function() {
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (user && this._logoLoadedForUser[user.id]) {
                delete this._logoLoadedForUser[user.id];
            }
        } catch (error) {
            console.error('[Rooted Vitality] Error clearing logo cache:', error);
        }
    },

    /**
     * Clear the client avatar cache for the current user
     * Call this after uploading a new avatar to force reload on next page visit
     */
    clearClientAvatarCacheForUser: async function() {
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (user && this._clientAvatarLoadedForUser[user.id]) {
                delete this._clientAvatarLoadedForUser[user.id];
            }
        } catch (error) {
            console.error('[Rooted Vitality] Error clearing client avatar cache:', error);
        }
    },

    /**
     * Load practitioner's business logo universally across all pages in practitioner view
     * Fetches profile_photo_url from practitioners table and updates header logo
     * Includes retry logic for timing issues
     */
    loadPractitionerLogo: async function(retryCount = 0) {
        const maxRetries = 3;
        
        
        try {
            // Check if avatar button exists in DOM
            const avatarBtn = document.querySelector('.rv-avatar-btn');
            if (!avatarBtn) {
                
                
                // Retry if we haven't exceeded max retries
                if (retryCount < maxRetries) {
                    
                    setTimeout(() => this.loadPractitionerLogo(retryCount + 1), 200);
                } else {
                    console.error('[Rooted Vitality] Max retries exceeded, avatar button never found');
                }
                return;
            }
            // Only attempt if Supabase client is available
            if (!window.supabaseClient) {
                if (retryCount < maxRetries) {
                    setTimeout(() => this.loadPractitionerLogo(retryCount + 1), 200);
                }
                return;
            }
            // Get current user
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) {
                return;
            }
            // Check if already loaded for this user
            if (this._logoLoadedForUser[user.id]) {
                return;
            }
            
            // Fetch practitioner data
            const { data: practitioner, error } = await window.supabaseClient
                .from('practitioners')
                .select('legal_business_name, serial_number')
                .eq('id', user.id)
                .single();
            
            if (error) {
                console.error('[Rooted Vitality] Database query failed:', error);
                return;
            }
            
            if (!practitioner) {
                return;
            }
            
            // Fetch logo from practitioner_profiles table using serial_number
            const { data: profile, error: profileError } = await window.supabaseClient
                .from('practitioner_profiles')
                .select('practice_logo_url')
                .eq('practitioner_serial', practitioner.serial_number)
                .single();
            
            let logoUrl = null;
            if (!profileError && profile) {
                logoUrl = profile.practice_logo_url;
            }
            if (logoUrl) {
                
                this.updateHeaderLogo(logoUrl, 'practitioner', 'practitioner');
            } else {
                // No logo - update initial with business name from database
                if (practitioner.legal_business_name) {
                    this.updateAvatarInitial(practitioner.legal_business_name);
                }
            }
            
            // Mark logo as loaded regardless of whether we found one
            // This prevents repeated database queries on every page load
            this._logoLoadedForUser[user.id] = true;
        } catch (error) {
            console.error('[Rooted Vitality] Exception in loadPractitionerLogo:', error.message);
            
            if (retryCount < maxRetries) {
                setTimeout(() => this.loadPractitionerLogo(retryCount + 1), 200);
            }
        }
    },

    /**
     * Load client's avatar from profiles table
     * Displays avatar in header for logged-in clients
     */
    loadClientAvatar: async function(retryCount = 0) {
        const maxRetries = 3;
        
        
        try {
            const avatarBtn = document.querySelector('.rv-avatar-btn');
            if (!avatarBtn) {
                if (retryCount < maxRetries) {
                    setTimeout(() => this.loadClientAvatar(retryCount + 1), 200);
                }
                return;
            }
            
            if (!window.supabaseClient) {
                if (retryCount < maxRetries) {
                    setTimeout(() => this.loadClientAvatar(retryCount + 1), 200);
                }
                return;
            }
            
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) return;
            
            if (this._clientAvatarLoadedForUser && this._clientAvatarLoadedForUser[user.id]) {
                return;
            }
            
            const { data: client, error } = await window.supabaseClient
                .from('clients')
                .select('profile_picture_url, first_name')
                .eq('id', user.id)
                .single();
            
            if (error || !client) return;
            
            if (client.profile_picture_url) {
                this.updateHeaderAvatar(client.profile_picture_url);
            }
            
            if (!this._clientAvatarLoadedForUser) {
                this._clientAvatarLoadedForUser = {};
            }
            this._clientAvatarLoadedForUser[user.id] = true;
            
        } catch (error) {
            console.error('[Rooted Vitality] Error in loadClientAvatar:', error.message);
            if (retryCount < maxRetries) {
                setTimeout(() => this.loadClientAvatar(retryCount + 1), 200);
            }
        }
    },

    /**
     * Mark a notification as read in database
     */
    markNotificationAsRead: async function(notifId) {
        try {
            // Determine if user is client or practitioner
            const userRole = window.authManager?.getCurrentUser()?.role || 'client';
            const table = userRole === 'client' ? 'client_notifications' : 'practitioner_notifications';
            
            // Fetch the current user and their serial
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) {
                console.error('[Rooted Vitality] No authenticated user');
                return;
            }
            
            // Get the serial number to include in the UPDATE filter (required by RLS policy)
            let serialField, serialValue;
            if (userRole === 'client') {
                const { data: clientData } = await window.supabaseClient
                    .from('clients')
                    .select('serial_number')
                    .eq('id', user.id)
                    .single();
                if (clientData) {
                    serialField = 'client_serial';
                    serialValue = clientData.serial_number;
                }
            } else {
                const { data: practData } = await window.supabaseClient
                    .from('practitioners')
                    .select('serial_number')
                    .eq('id', user.id)
                    .single();
                if (practData) {
                    serialField = 'practitioner_serial';
                    serialValue = practData.serial_number;
                }
            }
            
            // Build query with both id and serial filters (required by RLS)
            let query = window.supabaseClient
                .from(table)
                .update({ is_read: true })
                .eq('id', notifId);
            
            if (serialField && serialValue) {
                query = query.eq(serialField, serialValue);
            }
            
            const { error, data } = await query;
            
            // If direct update fails or returns no data, try the SECURITY DEFINER function
            if (!error && (!data || data.length === 0)) {
                
                const functionName = userRole === 'client' 
                  ? 'mark_client_notification_read'
                  : 'mark_practitioner_notification_read';
                
                const { data: funcResult, error: funcError } = await window.supabaseClient
                  .rpc(functionName, { p_notification_id: notifId });
                
                if (funcError) {
                    console.error('[Rooted Vitality] Error marking notification as read:', funcError);
                    return;
                }
                return;
            }
            
            if (error) {
                console.error('[Rooted Vitality] Error marking notification as read:', error);
                return;
            }
            
            console.log('[Rooted Vitality] Successfully marked notification as read. Data returned:', data);
            
            // If on practitioner page and PractitionerNotifications module is available, update it
            if (window.PractitionerNotifications && typeof window.PractitionerNotifications.markAsRead === 'function') {
              await window.PractitionerNotifications.markAsRead(notifId);
            }
            
            // DO NOT reload - let the real-time listener handle UI update
            // This prevents the flip-back bug where notifications revert to unread
        } catch (error) {
            console.error('[Rooted Vitality] Exception marking notification as read:', error);
        }
    },

    /**
     * Mark ALL unread notifications as read when dropdown opens
     */
    markAllNotificationsAsRead: async function() {
        if (!window.supabaseClient) {
            return;
        }

        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) {
                return;
            }

            const currentUser = window.authManager?.getCurrentUser?.();
            const userRole = currentUser?.role || localStorage.getItem('rvUserRole') || 'practitioner';

            let notificationTable, whereField, whereValue;

            if (userRole === 'client') {
                notificationTable = 'client_notifications';
                whereField = 'client_serial';
                
                // Fetch client serial from clients table using auth user ID
                const { data: clientData, error: clientError } = await window.supabaseClient
                    .from('clients')
                    .select('serial_number')
                    .eq('id', user.id)
                    .single();
                
                if (clientError || !clientData) {
                    return;
                }
                
                whereValue = clientData.serial_number;
            } else {
                notificationTable = 'practitioner_notifications';
                whereField = 'practitioner_serial';
                
                // Get practitioner serial from practitioners table
                const { data: practData, error: practError } = await window.supabaseClient
                    .from('practitioners')
                    .select('serial_number')
                    .eq('id', user.id)
                    .single();
                
                if (practError || !practData) {
                    return;
                }
                
                whereValue = practData.serial_number;
            }

            if (!whereValue) {
                console.error('[Rooted Vitality] whereValue is empty - cannot mark notifications as read');
                return;
            }

            // Test if there are unread notifications to mark as read
            const testSelect = await window.supabaseClient
              .from(notificationTable)
              .select('id, ' + whereField + ', is_read')
              .eq(whereField, whereValue)
              .eq('is_read', false);

            if (testSelect.data && testSelect.data.length > 0) {
              
              // Call the server function that bypasses RLS
              const functionName = userRole === 'client' 
                ? 'mark_all_client_notifications_read'
                : 'mark_all_practitioner_notifications_read';
              
              await window.supabaseClient
                .rpc(functionName, { 
                  p_client_serial: userRole === 'client' ? whereValue : undefined,
                  p_practitioner_serial: userRole === 'practitioner' ? whereValue : undefined
                });
              return;
            }

            // Fallback: Update using direct query (if function didn't work)
            if (testSelect.data && testSelect.data.length > 0) {
              for (const notif of testSelect.data) {
                await window.supabaseClient
                  .from(notificationTable)
                  .update({ is_read: true })
                  .eq('id', notif.id)
                  .eq(whereField, whereValue);
              }
              return;
            }

            // Update all unread notifications to read (fallback)
            const { error, data: updatedData, status } = await window.supabaseClient
                .from(notificationTable)
                .update({ is_read: true })
                .eq(whereField, whereValue)
                .eq('is_read', false);

            if (error) {
                console.error('[Rooted Vitality] Error marking all notifications as read:', error);
                return;
            }
            
            // If on practitioner page and PractitionerNotifications module is available, update it
            if (window.PractitionerNotifications && typeof window.PractitionerNotifications.markAllAsRead === 'function') {
              await window.PractitionerNotifications.markAllAsRead();
            }
            
            // DO NOT reload - let the real-time listener handle UI update
            // This prevents the flip-back bug where notifications revert to unread
        } catch (error) {
            console.error('[Rooted Vitality] Exception marking all notifications as read:', error);
        }
    },

    /**
     * Subscribe to real-time notifications for new matches
     * Automatically creates notification when new match is found
     */
    subscribeToNewMatches: async function() {
        if (!window.supabaseClient) {
            return;
        }

        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) {
                return;
            }

            const currentUser = window.authManager?.getCurrentUser?.();
            const userRole = currentUser?.role || localStorage.getItem('rvUserRole') || 'practitioner';
            
            // Only practitioners need match notifications
            if (userRole !== 'practitioner') {
                return;
            }

            // Get practitioner serial from practitioners table
            const { data: practData, error: practError } = await window.supabaseClient
                .from('practitioners')
                .select('serial_number')
                .eq('id', user.id)
                .single();
            
            if (practError || !practData) {
                console.error('[Realtime] Error fetching practitioner serial for matches:', practError);
                return;
            }
            
            const practitionerSerial = practData.serial_number;
            if (!practitionerSerial) {
                return;
            }
            
            // Subscribe to changes in project_practitioner_matches table
            // NOTE: Notifications are created by window.notifyPractitionerOfNewMatch() in find-practitioners.js
            // This subscription only refreshes the UI, does NOT duplicate notifications
            const subscription = window.supabaseClient
                .channel(`matches:${practitionerSerial}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'project_practitioner_matches',
                        filter: `practitioner_serial=eq.${practitionerSerial}`
                    },
                    async (payload) => {
                        console.log('[Realtime] New match INSERT detected for:', practitionerSerial);
                        
                        // Just refresh notifications UI - the actual notification was created
                        // by window.notifyPractitionerOfNewMatch() RPC in find-practitioners.js
                        this.loadNotifications();
                        
                        // Trigger any page-specific handlers
                        if (window.onNewMatchReceived) {
                            window.onNewMatchReceived(payload.new);
                        }
                    }
                )
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        console.log('[Realtime] Subscribed to new matches for:', practitionerSerial);
                    }
                });

            // Store subscription for cleanup if needed
            window.notificationSubscriptions = window.notificationSubscriptions || [];
            window.notificationSubscriptions.push(subscription);

        } catch (error) {
            console.error('[Realtime] Error setting up match listener:', error);
        }
    },

    /**
     * Subscribe to real-time notification updates
     * Handles INSERT, UPDATE, DELETE on notifications table to keep badge and list in sync
     * Runs on ALL pages for all users (client and practitioner)
     */
    subscribeToNotificationUpdates: async function() {
        if (!window.supabaseClient) {
            return;
        }

        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) {
                return;
            }

            const currentUser = window.authManager?.getCurrentUser?.();
            const userRole = currentUser?.role || localStorage.getItem('rvUserRole') || 'practitioner';
            
            // Determine table and filter based on user role
            let table, serial, roleLabel;
            if (userRole === 'client') {
                table = 'client_notifications';
                
                // Fetch client serial from clients table
                const { data: clientData, error: clientError } = await window.supabaseClient
                    .from('clients')
                    .select('serial_number')
                    .eq('id', user.id)
                    .single();
                
                if (clientError || !clientData) {
                    return;
                }
                
                serial = clientData.serial_number;
                roleLabel = 'client';
            } else {
                table = 'practitioner_notifications';
                roleLabel = 'practitioner';
                
                // Get practitioner serial from practitioners table - MUST fetch from DB
                const { data: practData, error: practError } = await window.supabaseClient
                    .from('practitioners')
                    .select('serial_number')
                    .eq('id', user.id)
                    .single();
                
                if (practError || !practData) {
                    console.error('[Realtime] Error fetching practitioner serial:', practError);
                    return;
                }
                
                serial = practData.serial_number;
            }

            if (!serial) {
                return;
            }
            // Subscribe to ALL changes on the notifications table for this user
            const channel = window.supabaseClient
                .channel(`notif-updates:${roleLabel}:${serial}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',  // Listen for INSERT, UPDATE, DELETE
                        schema: 'public',
                        table: table,
                        filter: userRole === 'client' 
                            ? `client_serial=eq.${serial}`
                            : `practitioner_serial=eq.${serial}`
                    },
                    async (payload) => {
                        console.log('[Realtime] Notification change detected:', payload.eventType, 'is_read:', payload.new?.is_read);
                        
                        // For new notifications (INSERT), immediately update badge and dropdown
                        if (payload.eventType === 'INSERT' && payload.new) {
                            // Update badge count immediately
                            const badge = document.querySelector('.rv-notification-badge');
                            if (badge) {
                                const currentCount = parseInt(badge.textContent) || 0;
                                const newCount = currentCount + 1;
                                badge.textContent = newCount;
                                badge.classList.add('active');
                                // CSS handles display via .active class
                            }

                            // Update bell icon color to gold to indicate unread
                            const bellIcon = document.querySelector('.rv-bell-icon');
                            if (bellIcon) {
                                bellIcon.style.color = '#d4c47c';
                            }

                            // If notification dropdown is open, add the notification to the list
                            const notificationsList = document.querySelector('.rv-notifications-list');
                            if (notificationsList && notificationsList.parentElement.classList.contains('show')) {
                                const notifElement = document.createElement('a');
                                notifElement.className = 'rv-notifications-item unread';
                                notifElement.href = payload.new.link || '#';
                                notifElement.dataset.notifId = payload.new.id;
                                notifElement.innerHTML = `
                                    <p class="rv-notifications-title">${payload.new.title}</p>
                                    <p class="rv-notifications-message">${payload.new.message}</p>
                                    <span class="rv-notifications-time">${new Date(payload.new.created_at).toLocaleDateString()}</span>
                                `;
                                notifElement.addEventListener('click', (e) => {
                                    e.preventDefault();
                                    const notifId = notifElement.dataset.notifId;
                                    if (notifId && !notifElement.classList.contains('read')) {
                                        this.markNotificationAsRead(notifId);
                                        notifElement.classList.remove('unread');
                                        notifElement.classList.add('read');
                                    }
                                });

                                // Remove empty state message if it exists
                                const emptyMessage = notificationsList.querySelector('.rv-notifications-empty');
                                if (emptyMessage) {
                                    emptyMessage.remove();
                                }

                                // Insert at the top of the list
                                if (notificationsList.firstChild) {
                                    notificationsList.insertBefore(notifElement, notificationsList.firstChild);
                                } else {
                                    notificationsList.appendChild(notifElement);
                                }
                            }
                        } 
                        // For UPDATE events (mark as read/unread), update the UI directly without reloading
                        else if (payload.eventType === 'UPDATE' && payload.new) {
                            console.log('[Realtime] Updating notification UI for:', payload.new.id, 'is_read:', payload.new.is_read);
                            
                            // Find the notification element in the dropdown (if visible)
                            const notifElement = document.querySelector(`.rv-notifications-item[data-notif-id="${payload.new.id}"]`);
                            if (notifElement) {
                                if (payload.new.is_read) {
                                    notifElement.classList.remove('unread');
                                    notifElement.classList.add('read');
                                } else {
                                    notifElement.classList.remove('read');
                                    notifElement.classList.add('unread');
                                }
                            }
                            
                            // Always recalculate badge count from visible items in dropdown
                            // This ensures badge reflects current state regardless of page state
                            const unreadCount = document.querySelectorAll('.rv-notifications-item.unread').length;
                            const badge = document.querySelector('.rv-notification-badge');
                            const bellIcon = document.querySelector('.rv-bell-icon');
                            
                            if (badge) {
                                if (unreadCount > 0) {
                                    badge.textContent = unreadCount;
                                    badge.classList.add('active');
                                    if (bellIcon) {
                                        bellIcon.style.color = '#d4c47c'; // Gold for unread
                                    }
                                } else {
                                    badge.textContent = '0';
                                    badge.classList.remove('active');
                                    if (bellIcon) {
                                        bellIcon.style.color = 'currentColor'; // Normal color
                                    }
                                }
                            }
                        }
                        // For DELETE events, remove from the list
                        else if (payload.eventType === 'DELETE' && payload.old) {
                            console.log('[Realtime] Removing deleted notification:', payload.old.id);
                            const notifElement = document.querySelector(`.rv-notifications-item[data-notif-id="${payload.old.id}"]`);
                            if (notifElement) {
                                notifElement.remove();
                            }
                        }
                    }
                )
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                    }
                });

            // Store subscription for cleanup if needed
            window.notificationSubscriptions = window.notificationSubscriptions || [];
            window.notificationSubscriptions.push(channel);

        } catch (error) {
            console.error('[Rooted Vitality] Error setting up notification updates listener:', error);
        }
    },

    /**
     * Load and display notifications for practitioner or client
     */
    loadNotifications: async function() {
        if (!window.supabaseClient) {
            return;
        }

        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) {
                return;
            }

            // Determine user type and get appropriate serial number
            let notificationTable, whereField, whereValue;
            const currentUser = window.authManager?.getCurrentUser?.();
            const userRole = currentUser?.role || localStorage.getItem('rvUserRole') || 'practitioner';

            if (userRole === 'client') {
                notificationTable = 'client_notifications';
                whereField = 'client_serial';
                
                // Fetch client serial from clients table using auth user ID
                const { data: clientData, error: clientError } = await window.supabaseClient
                    .from('clients')
                    .select('serial_number')
                    .eq('id', user.id)
                    .single();
                
                if (clientError || !clientData) {
                    return;
                }
                
                whereValue = clientData.serial_number;
            } else {
                notificationTable = 'practitioner_notifications';
                whereField = 'practitioner_serial';
                
                // Get practitioner serial from practitioners table - MUST fetch from DB
                const { data: practData, error: practError } = await window.supabaseClient
                    .from('practitioners')
                    .select('serial_number')
                    .eq('id', user.id)
                    .single();
                
                if (practError || !practData) {
                    console.error('[Rooted Vitality] Error fetching practitioner serial in loadNotifications:', practError);
                    return;
                }
                
                whereValue = practData.serial_number;
            }

            if (!whereValue) {
                return;
            }

            const { data, error } = await window.supabaseClient
                .from(notificationTable)
                .select('*')
                .eq(whereField, whereValue)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('[Rooted Vitality] Error loading notifications:', error);
                return;
            }



            // Update bell color based on unread count
            const unreadCount = data?.filter(n => !n.is_read).length || 0;
            const bellIcon = document.querySelector('.rv-bell-icon');
            const badge = document.querySelector('.rv-notification-badge');
            
            if (badge) {
                if (unreadCount > 0) {
                    badge.textContent = unreadCount;
                    badge.classList.add('active');
                    // CSS handles display via .active class
                } else {
                    badge.textContent = '0';
                    badge.classList.remove('active');
                    // CSS hides on .active removal
                }
            }
            
            if (bellIcon && unreadCount > 0) {
                bellIcon.style.color = '#d4c47c'; // Gold for unread
            } else if (bellIcon) {
                bellIcon.style.color = 'currentColor'; // Normal color
            }

            // Render notifications list
            const notificationsList = document.querySelector('.rv-notifications-list');
            if (!notificationsList) return;

            if (!data || data.length === 0) {
                notificationsList.innerHTML = '<p class="rv-notifications-empty">No notifications yet</p>';
                return;
            }

            notificationsList.innerHTML = data.map(notif => `
                <a href="${notif.link || '#'}" class="rv-notifications-item ${notif.is_read ? 'read' : 'unread'}" data-notif-id="${notif.id}">
                    <p class="rv-notifications-title">${notif.title}</p>
                    <p class="rv-notifications-message">${notif.message}</p>
                    <span class="rv-notifications-time">${new Date(notif.created_at).toLocaleDateString()}</span>
                </a>
            `).join('');

            // Add click handler to mark notifications as read
            document.querySelectorAll('.rv-notifications-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    const notifId = item.dataset.notifId;
                    if (notifId && !item.classList.contains('read')) {
                        this.markNotificationAsRead(notifId);
                        item.classList.remove('unread');
                        item.classList.add('read');
                    }
                });
            });

        } catch (error) {
            console.error('[Rooted Vitality] Error loading notifications:', error);
        }
    },

    /**
     * Initialize real-time notification subscriptions
     * Sets up Supabase realtime listeners for instant notification updates
     */
    initializeRealtimeNotifications: async function() {
        if (!window.supabaseClient) {
            return;
        }

        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) {
                return;
            }

            const currentUser = window.authManager?.getCurrentUser?.();
            const userRole = currentUser?.role || localStorage.getItem('rvUserRole') || 'practitioner';

            let notificationTable, whereField, whereValue;

            if (userRole === 'client') {
                notificationTable = 'client_notifications';
                whereField = 'client_serial';
                
                const { data: clientData } = await window.supabaseClient
                    .from('clients')
                    .select('serial_number')
                    .eq('id', user.id)
                    .single();
                
                if (clientData) {
                    whereValue = clientData.serial_number;
                }
            } else {
                notificationTable = 'practitioner_notifications';
                whereField = 'practitioner_serial';
                
                // Get practitioner serial from practitioners table
                const { data: practData } = await window.supabaseClient
                    .from('practitioners')
                    .select('serial_number')
                    .eq('id', user.id)
                    .single();
                
                if (practData) {
                    whereValue = practData.serial_number;
                }
            }

            if (!whereValue) {
                return;
            }

            // Create channel name with user role and serial for isolation
            const channelName = `${notificationTable}:${whereValue}`;
            
            // Subscribe to table changes
            const channel = window.supabaseClient
                .channel(channelName, {
                    config: {
                        broadcast: { self: true },
                        presence: { key: whereValue }
                    }
                })
                .on('postgres_changes', 
                    {
                        event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
                        schema: 'public',
                        table: notificationTable,
                        filter: `${whereField}=eq.${whereValue}`
                    },
                    (payload) => {
                        console.log(`[Realtime] ${notificationTable} change detected:`, payload);
                        
                        // Reload notifications to reflect changes in real-time
                        this.loadNotifications();
                        
                        // Show toast notification for new unread notifications
                        if (payload.eventType === 'INSERT' && payload.new && !payload.new.is_read) {
                            this.showNotificationToast(payload.new);
                        }
                    }
                )
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        // Subscribed to realtime channel
                    } else if (status === 'CLOSED') {
                        console.warn(`[Realtime] Channel ${channelName} closed`);
                    } else if (status === 'CHANNEL_ERROR') {
                        console.error(`[Realtime] Channel ${channelName} error`);
                    }
                });

            // Store channel reference for cleanup if needed
            if (!window._rvNotificationChannels) {
                window._rvNotificationChannels = [];
            }
            window._rvNotificationChannels.push(channel);

        } catch (error) {
            console.error('[Realtime] Error initializing real-time notifications:', error);
        }
    },

    /**
     * Show a toast notification for new notifications
     */
    showNotificationToast: function(notification) {
        try {
            // Create toast element
            const toast = document.createElement('div');
            toast.className = 'rv-notification-toast';
            toast.innerHTML = `
                <div class="rv-notification-toast-content">
                    <p class="rv-notification-toast-title">${notification.title || 'New Notification'}</p>
                    <p class="rv-notification-toast-message">${notification.message || ''}</p>
                </div>
                <button class="rv-notification-toast-close">&times;</button>
            `;

            // Add toast to page
            document.body.appendChild(toast);

            // Animate in
            setTimeout(() => {
                toast.classList.add('show');
            }, 10);

            // Close button handler
            toast.querySelector('.rv-notification-toast-close').addEventListener('click', () => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            });

            // Auto-dismiss after 5 seconds
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.classList.remove('show');
                    setTimeout(() => toast.remove(), 300);
                }
            }, 5000);

        } catch (error) {
            console.error('[Realtime] Error showing notification toast:', error);
        }
    },

    initNotificationsMenu: function() {
        const notificationsBtn = document.querySelector('.rv-notifications-btn');
        const notificationsDropdown = document.querySelector('.rv-notifications-dropdown');
        
        if (!notificationsBtn || !notificationsDropdown) {
            return;
        }
        
        // Toggle dropdown on button click AND load notifications
        notificationsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = notificationsDropdown.classList.toggle('show');
            notificationsBtn.setAttribute('aria-expanded', isOpen);
            
            // When opening, immediately clear the bell badge and mark all as read
            if (isOpen) {
                // Immediately hide badge and reset bell color for instant feedback
                const bellIcon = document.querySelector('.rv-bell-icon');
                const badge = document.querySelector('.rv-notification-badge');
                if (bellIcon) {
                    bellIcon.style.color = 'currentColor'; // Reset to normal color
                }
                if (badge) {
                    badge.classList.remove('active');
                    badge.textContent = '0';
                    // CSS handles display via .active class
                }
                
                // Mark all as read (which will reload notifications when complete)
                this.markAllNotificationsAsRead();
            }
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!notificationsBtn.contains(e.target) && !notificationsDropdown.contains(e.target)) {
                notificationsDropdown.classList.remove('show');
                notificationsBtn.setAttribute('aria-expanded', 'false');
            }
        });
        
        // Close dropdown on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && notificationsDropdown.classList.contains('show')) {
                notificationsDropdown.classList.remove('show');
                notificationsBtn.setAttribute('aria-expanded', 'false');
                notificationsBtn.focus();
            }
        });
    },

    /**
     * Initialize logout handler for avatar dropdown
     * Handles click event to call authManager.logout()
     */
    initLogoutButtons: function() {
        // Handle Logout link in avatar dropdown
        const logoutLink = document.querySelector('.rv-logout-item');
        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof window.authManager !== 'undefined') {
                    window.authManager.logout();
                } else {
                }
            });
        }
    },
    
    // ======================================================
    // 4. INITIALIZATION
    // ======================================================
    /**
     * Inject Rooted Vitality Header
     * Inserts premium navigation header with scroll shrink & mobile toggle
     * Usage: RootedVitality.injectHeader();
     */
    injectHeader: function() {
        
        
        // Prevent double injection
        if (document.getElementById('rvHeader')) {
            return;
        }
        
        // Ensure we have a body to inject into
        if (!document.body) {
            return;
        }
        // Detect if we're in a subdirectory and adjust paths accordingly
        const currentPath = window.location.pathname;
        const isSubdirectory = currentPath.includes('/articles/') || currentPath.includes('/policies/') || currentPath.includes('/dashboard/') || currentPath.includes('/help-center/');
        const pathPrefix = isSubdirectory ? '../' : './';
        
        const headerHTML = `
        <header id="rvHeader" class="rv-header">
            <div class="rv-header-inner">
                <a href="${pathPrefix}index.html" class="rv-logo-container" aria-label="Rooted Vitality Home">
                    <img src="${pathPrefix}assets/logo_trimmed.png" alt="Rooted Vitality logo" class="rv-logo-image">
                    <div class="rv-brand-text">
                        <span class="rv-brand-name">Rooted</span>
                        <span class="rv-brand-name">Vitality</span>
                    </div>
                </a>
                <nav class="rv-nav" aria-label="Primary Navigation">
                    <a href="${pathPrefix}products/">Products</a>
                    <button id="rvLoginBtn" class="rv-nav-btn rv-login-btn" aria-label="Open login modal">Login</button>
                    <a href="${pathPrefix}booking.html" class="cta">Book Consultation</a>
                </nav>
                <button class="rv-menu-toggle" aria-label="Toggle Menu" aria-expanded="false">☰</button>
            </div>
        </header>
        `;
        
        // Inject at top of body (before main content)
        document.body.insertAdjacentHTML('afterbegin', headerHTML);
        
        // Get references to header elements
        const header = document.getElementById('rvHeader');
        const toggle = header.querySelector('.rv-menu-toggle');
        const nav = header.querySelector('.rv-nav');
        
        // Scroll shrink effect
        window.addEventListener('scroll', () => {
            if (window.scrollY > 80) {
                header.classList.add('rv-header-scrolled');
            } else {
                header.classList.remove('rv-header-scrolled');
            }
        });
        
        // Mobile menu toggle with keyboard support
        toggle.addEventListener('click', () => {
            nav.classList.toggle('open');
            const isOpen = nav.classList.contains('open');
            toggle.setAttribute('aria-expanded', isOpen);
        });
        
        // Close mobile menu when link is clicked
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
            });
        });
        
        // Close mobile menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && nav.classList.contains('open')) {
                nav.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });
        this.log('Rooted Vitality Header injected successfully');
        
        // Attach login modal trigger to Login button
        const loginBtn = document.getElementById('rvLoginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof openLoginModal === 'function') {
                    openLoginModal('client');
                }
            });
        }
        
        // Check auth state and update header if user is logged in
        this.updatePublicHeaderForAuthState();
    },
    
    /**
     * Update public header for authenticated users
     * Changes "Login" button to "Dashboard" and adds "Logout" button
     */
    updatePublicHeaderForAuthState: function() {
        try {
            if (typeof window.authManager === 'undefined') {
                return;
            }
            
            const userData = window.authManager.getCurrentUser();
            if (!userData || !userData.role) {
                return;
            }
            const loginBtn = document.getElementById('rvLoginBtn');
            if (!loginBtn) {
                return;
            }
            
            // Detect path prefix
            const currentPath = window.location.pathname;
            const isSubdirectory = currentPath.includes('/articles/') || currentPath.includes('/policies/') || currentPath.includes('/dashboard/') || currentPath.includes('/help-center/');
            const pathPrefix = isSubdirectory ? '../' : './';
            
            // Replace Login button with Dashboard link
            let dashboardUrl = pathPrefix + 'dashboard/client/pages/client-profile.html';
            if (userData.role === 'practitioner') {
                dashboardUrl = pathPrefix + 'dashboard/pro/pages/index.html';
            }
            
            loginBtn.textContent = 'Dashboard';
            loginBtn.classList.remove('rv-login-btn');
            loginBtn.style.backgroundColor = 'transparent';
            loginBtn.style.color = 'inherit';
            loginBtn.style.border = 'none';
            loginBtn.style.cursor = 'pointer';
            loginBtn.onclick = (e) => {
                e.preventDefault();
                window.location.href = dashboardUrl;
            };
        } catch (error) {
            console.error('[Rooted Vitality] Error updating header for auth state:', error);
        }
    },
    
    // ======================================================
    // LOGIN MODAL INJECTION
    // ======================================================
    /**
     * Inject Rooted Auth Modal (Login/Register)
     * Actual implementation moved to authModal.js for separation of concerns
     * This function kept for backward compatibility
     */
    injectLoginModal: function() {
        // Modal auto-initializes in authModal.js
    },
    
    // ======================================================
    // FOOTER INJECTION
    // ======================================================
    /**
     * Inject Rooted Vitality Footer
     * Universal footer with branding, contact, links, services
     * Usage: RootedVitality.injectFooter();
     */
    injectFooter: function() {
        
        
        // Prevent double injection
        if (document.getElementById('rvFooter')) {
            return;
        }
        
        if (!document.body) {
            return;
        }
        
        // Find the footer-inject element (if it exists on the page)
        const footerContainer = document.getElementById('footer-inject');
        
        // Detect if we're in a subdirectory and adjust paths for links and images
        const currentPath = window.location.pathname;
        
        // Calculate path depth by counting slashes after /rooted-vitality/
        const baseIndex = currentPath.indexOf('/rooted-vitality/');
        const pathAfterBase = baseIndex !== -1 ? currentPath.substring(baseIndex + '/rooted-vitality/'.length) : currentPath;
        const slashCount = (pathAfterBase.match(/\//g) || []).length;
        
        // Build pathPrefix based on depth, but prefer window.ARTICLE_PATH_PREFIX if set
        let pathPrefix = window.ARTICLE_PATH_PREFIX || './';
        if (!window.ARTICLE_PATH_PREFIX) {
            if (slashCount >= 3) {
                pathPrefix = '../../../';
            } else if (slashCount >= 2) {
                pathPrefix = '../../';
            } else if (slashCount >= 1) {
                pathPrefix = '../';
            }
        }
        const logoPath = `${pathPrefix}assets/logo_trimmed.png`;
        
        const footerHTML = `
        <footer id="rvFooter" class="rv-footer">
            <div class="rv-footer-inner">
                <!-- Left Section: Branding & Contact -->
                <div class="rv-footer-section rv-footer-brand">
                    <div class="rv-footer-logo">
                        <img src="${logoPath}" alt="Rooted Vitality logo" class="rv-footer-logo-img">
                    </div>
                    <div class="rv-footer-branding">
                        <h3 class="rv-footer-title">Rooted<br>Vitality</h3>
                    </div>
                </div>
                
                <!-- Center Section: Links -->
                <div class="rv-footer-section">
                    <h4 class="rv-footer-heading">Links</h4>
                    <nav class="rv-footer-nav">
                        <a href="${pathPrefix}index.html">Home</a>
                        <a href="${pathPrefix}help-center/">Help Center</a>
                        <button id="report-concern-btn" class="rv-footer-link-btn" title="Report a technical issue or concern with the website">Report a Concern</button>
                        <button id="contact-us-btn" class="rv-footer-link-btn" title="Contact Rooted Vitality">Contact Us</button>
                    </nav>
                </div>
                
                <!-- Right Section: Core Services -->
                <div class="rv-footer-section">
                    <h4 class="rv-footer-heading">Follow Us</h4>
                    <nav class="rv-footer-socials-nav">
                        <a href="https://www.facebook.com/profile.php?id=61583674127724&sk=about" target="_blank" rel="noopener noreferrer" aria-label="Facebook" class="rv-footer-social-btn">
                            <img src="${pathPrefix}assets/facebook.png" alt="Facebook" class="rv-footer-social-icon">
                        </a>
                        <a href="https://www.instagram.com/rootedvitality.health/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" class="rv-footer-social-btn">
                            <img src="${pathPrefix}assets/instagram.logo.png" alt="Instagram" class="rv-footer-social-icon">
                        </a>
                    </nav>
                </div>
            </div>
            
            <!-- Bottom: Copyright -->
            <div class="rv-footer-bottom">
                <p class="rv-footer-copyright">Rooted Vitality © 2025 · All rights reserved</p>
            </div>
            
            <!-- Decorative Plant SVG (positioned absolutely) -->
            <svg class="rv-footer-plant" viewBox="0 0 200 400" preserveAspectRatio="xMaxYMid slice" aria-hidden="true" focusable="false">
                <!-- Stem -->
                <line x1="100" y1="200" x2="100" y2="350" stroke="#a8b8a8" stroke-width="8" stroke-linecap="round"/>
                <!-- Roots -->
                <path d="M 100 350 Q 70 380 50 400" stroke="#a8b8a8" stroke-width="6" fill="none" stroke-linecap="round"/>
                <path d="M 100 350 Q 130 380 150 400" stroke="#a8b8a8" stroke-width="6" fill="none" stroke-linecap="round"/>
                <path d="M 100 350 Q 100 390 100 410" stroke="#a8b8a8" stroke-width="5" fill="none" stroke-linecap="round"/>
                <!-- Leaves -->
                <ellipse cx="75" cy="250" rx="15" ry="30" fill="#77883e" opacity="0.8" transform="rotate(-35 75 250)"/>
                <ellipse cx="125" cy="250" rx="15" ry="30" fill="#6ba87f" opacity="0.8" transform="rotate(35 125 250)"/>
                <ellipse cx="70" cy="200" rx="12" ry="28" fill="#77883e" opacity="0.7" transform="rotate(-45 70 200)"/>
                <ellipse cx="130" cy="200" rx="12" ry="28" fill="#6ba87f" opacity="0.7" transform="rotate(45 130 200)"/>
                <ellipse cx="60" cy="140" rx="13" ry="26" fill="#77883e" opacity="0.9" transform="rotate(-55 60 140)"/>
                <ellipse cx="140" cy="140" rx="13" ry="26" fill="#6ba87f" opacity="0.9" transform="rotate(55 140 140)"/>
                <!-- Flower -->
                <circle cx="100" cy="100" r="12" fill="#d4c47c" opacity="0.9"/>
                <ellipse cx="100" cy="70" rx="6" ry="12" fill="#d4c47c" opacity="0.85"/>
            </svg>
        </footer>
        `;
        
        // Inject footer into footer-inject container if it exists, otherwise at end of body
        if (footerContainer) {
            footerContainer.innerHTML = footerHTML;
        } else {
            document.body.insertAdjacentHTML('beforeend', footerHTML);
        }
        this.log('Rooted Vitality Footer injected successfully');
    },

    /**
     * Inject Report a Concern Modal (ONLY the modal, button is in footer)
     * Universal modal for reporting issues/concerns on all pages
     * Usage: RootedVitality.injectReportConcernModal();
     */
    injectReportConcernModal: function() {
        
        
        // Prevent double injection
        if (document.getElementById('report-concern-modal')) {
            return;
        }
        
        if (!document.body) {
            return;
        }
        
        // Only inject the modal HTML, NOT the button (button is now in footer)
        const reportConcernHTML = `
        <!-- Report Concern Modal -->
        <div id="report-concern-modal" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Report a Concern</h2>
                    <button class="modal-close-btn" id="report-concern-close-btn">×</button>
                </div>
                
                <div class="modal-body">
                <form id="report-concern-form">
                    
                    <!-- Category Selection -->
                    <div class="form-group">
                        <label for="report-category">Category *</label>
                        <select id="report-category" name="category" required>
                            <option value="">Select a category...</option>
                            <option value="technical-issue">Technical Issue / Bug</option>
                            <option value="malfunction">Feature Malfunction</option>
                            <option value="performance">Performance Issue</option>
                            <option value="ui-problem">UI/UX Problem</option>
                            <option value="content-issue">Content Error</option>
                            <option value="security-concern">Security Concern</option>
                            <option value="other">Other Concern</option>
                        </select>
                    </div>

                    <!-- Title -->
                    <div class="form-group">
                        <label for="report-title">Title of Issue *</label>
                        <input 
                            type="text" 
                            id="report-title" 
                            name="title" 
                            placeholder="Brief description of the problem"
                            maxlength="100"
                            required
                        >
                    </div>

                    <!-- Page/Section -->
                    <div class="form-group">
                        <label for="report-section">Page/Section *</label>
                        <input 
                            type="text" 
                            id="report-section" 
                            name="section" 
                            placeholder="e.g., Practitioner Dashboard, Search Page"
                            value=""
                            required
                        >
                    </div>

                    <!-- Description -->
                    <div class="form-group">
                        <label for="report-description">Description of Issue *</label>
                        <textarea 
                            id="report-description" 
                            name="description" 
                            placeholder="Please describe what happened, what you expected to happen, and any error messages you saw"
                            rows="5"
                            maxlength="1000"
                            required
                        ></textarea>
                    </div>

                    <!-- Priority -->
                    <div class="form-group">
                        <label for="report-priority">Priority Level *</label>
                        <select id="report-priority" name="priority" required>
                            <option value="">Select priority...</option>
                            <option value="low">Low - Minor inconvenience</option>
                            <option value="medium">Medium - Affects functionality</option>
                            <option value="high">High - Prevents key features</option>
                            <option value="critical">Critical - Website not usable</option>
                        </select>
                    </div>

                    <!-- Contact Email -->
                    <div class="form-group">
                        <label for="report-email">Your Email *</label>
                        <input 
                            type="email" 
                            id="report-email" 
                            name="email" 
                            placeholder="your@email.com"
                            required
                        >
                    </div>

                    <!-- Browser/Device Info (auto-filled) -->
                    <div class="form-group">
                        <label for="report-device">Device/Browser</label>
                        <input 
                            type="text" 
                            id="report-device" 
                            name="device" 
                            placeholder="Auto-detected"
                            readonly
                        >
                        <small>Auto-detected for troubleshooting purposes</small>
                    </div>

                    <!-- Form Actions -->
                    <div class="form-actions">
                        <button type="button" class="btn-modal btn-modal-secondary" id="report-concern-cancel-btn">Cancel</button>
                        <button type="submit" class="btn-modal btn-modal-primary" id="report-concern-submit-btn">Submit Report</button>
                    </div>
                </form>
                </div>
            </div>
        </div>
        `;
        
        // Insert modal at end of body
        document.body.insertAdjacentHTML('beforeend', reportConcernHTML);
        this.log('Report concern modal injected successfully');
        
        // Load and initialize the report concern system
        this.initializeReportConcernSystem();
    },
    
    /**
     * Load report concern script and initialize system
     */
    initializeReportConcernSystem: function() {
        // Ensure modal-system.css is loaded (required for .modal-overlay and .modal-content classes)
        const modalCssPath = '/rooted-vitality/styles/modal-system.css';
        if (!document.querySelector(`link[href="${modalCssPath}"]`)) {
            const modalLink = document.createElement('link');
            modalLink.rel = 'stylesheet';
            modalLink.href = modalCssPath;
            document.head.appendChild(modalLink);
        }
        
        // Ensure CSS is loaded (as fallback if not in HTML head)
        const cssPath = '/rooted-vitality/styles/report-concern-widget.css';
        if (!document.querySelector(`link[href="${cssPath}"]`)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = cssPath;
            document.head.appendChild(link);
        }
        
        // Check if script already loaded
        if (window.initializeReportConcernSystem) {
            window.initializeReportConcernSystem();
            return;
        }
        
        // Load script dynamically
        const scriptPath = '/rooted-vitality/scripts/report-concern-universal.js';
        const script = document.createElement('script');
        script.src = scriptPath;
        script.async = true;
        
        script.onload = () => {
            // Initialize the system
            if (window.initializeReportConcernSystem) {
                window.initializeReportConcernSystem();
            }
        };
        
        script.onerror = () => {
            console.error('[Rooted Vitality] Failed to load report concern script:', scriptPath);
        };
        
        document.head.appendChild(script);
    },

    /**
     * Inject Contact Us Modal
     * Universal modal for contact information
     * Usage: RootedVitality.injectContactModal();
     */
    injectContactModal: function() {
        
        // Prevent double injection
        if (document.getElementById('contact-us-modal')) {
            return;
        }
        
        if (!document.body) {
            return;
        }
        
        // Contact modal HTML
        const contactModalHTML = `
        <!-- Contact Us Modal -->
        <div id="contact-us-modal" class="modal-overlay">
            <div class="modal-content modal-sm">
                <div class="modal-header">
                    <h2>Contact Us</h2>
                    <button class="modal-close-btn" id="contact-us-close-btn">×</button>
                </div>
                
                <div class="modal-body">
                    <div class="contact-info">
                        <h3>Get in Touch</h3>
                        <p class="contact-info__subtitle">We're here to help. Reach out to us anytime.</p>
                        
                        <div class="contact-method">
                            <h4>Email</h4>
                            <a href="mailto:support@rootedvitality.health" class="contact-link">
                                support@rootedvitality.health
                            </a>
                        </div>
                        
                        <div class="contact-method">
                            <h4>Phone & Chat Support</h4>
                            <p class="contact-text">Coming soon</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
        
        // Insert modal at end of body
        document.body.insertAdjacentHTML('beforeend', contactModalHTML);
        this.log('Contact modal injected successfully');
        
        // Initialize contact modal event listeners
        this.initializeContactModal();
    },

    /**
     * Initialize Contact Modal Event Listeners
     */
    initializeContactModal: function() {
        // Prevent duplicate initialization
        if (window.contactModalInitialized) {
            return;
        }
        window.contactModalInitialized = true;
        
        // Contact button listener
        const contactBtn = document.getElementById('contact-us-btn');
        if (contactBtn) {
            contactBtn.addEventListener('click', openContactModal);
        }
        
        // Close button (X) listener
        const closeBtn = document.getElementById('contact-us-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeContactModal);
        }
        
        // Close modal when clicking outside
        const modal = document.getElementById('contact-us-modal');
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    closeContactModal();
                }
            });
        }
    },
    
    /**
     * Initialize all common functionality
     * Usage: RootedVitality.init();
     */
    init: async function() {
        this.log('Initializing Rooted Vitality utilities');
        
        // Auto-initialize common components
        // Phase 1: Check if user is authenticated and render appropriate header
        let headerRole = 'public';
        let headerView = null;
        
        try {
            // Check if this is practitioner profile page with pre-detected role
            if (window.PRACTITIONER_PROFILE_PAGE && window.DETECTED_USER_ROLE) {
                headerRole = window.DETECTED_USER_ROLE;
                // For practitioners, load view from localStorage
                if (headerRole === 'practitioner') {
                    headerView = localStorage.getItem('active_view') || 'client';
                }
            } 
            // Check for authenticated user via authManager
            else if (typeof window.authManager !== 'undefined') {
                const userData = window.authManager.getCurrentUser();
                if (userData && userData.role) {
                    headerRole = userData.role;
                    // For practitioners, load view from localStorage
                    if (headerRole === 'practitioner') {
                        headerView = localStorage.getItem('active_view') || 'client';
                    }
                }
            }
        } catch (error) {
        }
        
        // Render header with appropriate role and view
        await this.renderHeader(headerRole, headerView);
        
        this.injectLoginModal();
        this.injectFooter();
        this.injectReportConcernModal();
        this.injectContactModal();
        this.injectBackButton();
        this.trackPageView();
        
        // Log successful initialization
        this.log('Utilities loaded successfully');
    }
};

// Auto-initialize on script load if document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        RootedVitality.init();
    });
} else {
    // Document already loaded
    RootedVitality.init();
}

// Export for use in other modules (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RootedVitality;
}

// End of injections.js — Rooted Vitality Global Utilities