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

console.log('[Rooted Vitality] injections.js loading...');

// ======================================================
// GLOBAL NAVIGATION FUNCTIONS
// ======================================================
window.navigateToPage = function(page) {
  console.log('[Header] navigateToPage called with:', page);
  console.log('[Header] Current pathname:', window.location.pathname);
  
  // Construct the correct path from current location
  if (window.location.pathname.includes('/rooted-vitality/dashboard/pro/')) {
    const url = './pages/' + page + '.html';
    console.log('[Header] Navigating to relative URL:', url);
    window.location.href = url;
  } else if (window.location.pathname.includes('/rooted-vitality/dashboard/client/')) {
    const url = './pages/' + page + '.html';
    console.log('[Header] Navigating to relative URL:', url);
    window.location.href = url;
  } else {
    const url = '/rooted-vitality/dashboard/pro/pages/' + page + '.html';
    console.log('[Header] Navigating to absolute URL:', url);
    window.location.href = url;
  }
};

window.logout = function() {
  if (window.authManager && typeof window.authManager.logout === 'function') {
    window.authManager.logout();
  } else {
    window.location.href = '/rooted-vitality/index.html';
  }
};

// ======================================================
const RootedVitality = {
    config: {
        siteName: 'Rooted Vitality',
        siteUrl: '/rooted-vitality/',
        brandColor: '#5c9a72',
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
        console.log('[Analytics] Page viewed:', pagePath);
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
        const style = 'color: #5c9a72; font-weight: bold;';
        console.log(`%c[${this.config.siteName}] ${message}`, style);
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
            console.log('[Rooted Vitality] Header render already in progress, skipping');
            return;
        }
        
        // Check if header already rendered with the same role and view
        const existingHeader = document.getElementById('rvHeader');
        if (existingHeader) {
            const headerRole = existingHeader.dataset.role || 'public';
            const headerView = existingHeader.dataset.view || 'client';
            
            // If header exists with SAME role and view, skip render
            if (headerRole === role && headerView === (view || 'client')) {
                console.log(`[Rooted Vitality] Header already rendered with same role/view (${role}/${view}), skipping`);
                // But still load logo if practitioner view
                if (role === 'practitioner' && view === 'practitioner') {
                    console.log('[Rooted Vitality] Still loading logo for practitioner view...');
                    this.loadPractitionerLogo();
                }
                return;
            } else {
                // Different role or view - allow re-render
                console.log(`[Rooted Vitality] Header role/view mismatch (existing: ${headerRole}/${headerView}, requested: ${role}/${view}) - re-rendering`);
            }
        }
        
        this._headerRendering = true;
        
        try {
            // Determine view for practitioners
            if (role === 'practitioner' && !view) {
                view = localStorage.getItem('active_view') || 'client';
            }
            
            console.log(`[Rooted Vitality] renderHeader(${role}, view=${view}) called`);
        
            // Check if a correct header already exists
            const existingHeader = document.getElementById('rvHeader');
            if (existingHeader) {
                const headerRole = existingHeader.dataset.role || 'public';
                const headerView = existingHeader.dataset.view || 'client';
                
                if (headerRole === role && headerView === (view || 'client')) {
                    console.log('[Rooted Vitality] Correct header already exists, skipping render');
                    this._headerRendering = false;
                    return;
                }
                
                console.log('[Rooted Vitality] Header exists but wrong type, removing for replacement');
                existingHeader.remove();
            }
            
            // Detect if we're in a subdirectory and how deep
            const currentPath = window.location.pathname;
            let isSubdirectory = false;
            let pathPrefix = './';
            
            // Check if we're in /dashboard/pro/pages/ (three levels deep)
            if (currentPath.includes('/dashboard/pro/pages/')) {
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
            
            console.log(`[Rooted Vitality] Fetching header from: ${headerPath}`);
            
            // Fetch the header component
            const response = await fetch(headerPath);
            if (!response.ok) {
                throw new Error(`Failed to fetch header: ${response.status}`);
            }
            
            let headerHTML = await response.text();
            
            // Replace absolute paths with correct relative paths based on current location
            if (isSubdirectory) {
                // Determine correct path prefix for replacements
                let replacementPrefix = pathPrefix;
                
                // For /dashboard/pro/ we need ../../
                if (currentPath.includes('/dashboard/pro/')) {
                    replacementPrefix = '../../';
                } else {
                    replacementPrefix = '../';
                }
                
                // Replace absolute paths (/) with relative paths
                // BUT: Don't replace paths that already contain /rooted-vitality/ (they're already correct)
                // Keep all /rooted-vitality/ paths as absolute root paths
                headerHTML = headerHTML
                    .replace(/href="\/(?!rooted-vitality)([^"]+)"/g, `href="${replacementPrefix}$1"`)
                    .replace(/src="\/(?!rooted-vitality)([^"]+)"/g, `src="${replacementPrefix}$1"`);
                
                console.log(`[Rooted Vitality] Replaced paths with: ${replacementPrefix}`);
            }
            // In root: paths remain as-is (/)
            
            // Inject at top of body
            if (document.body) {
                document.body.insertAdjacentHTML('afterbegin', headerHTML);
                
                // Mark the header with role and view for future reference
                const injectedHeader = document.getElementById('rvHeader');
                if (injectedHeader) {
                    injectedHeader.dataset.role = role;
                    injectedHeader.dataset.view = view || 'client';
                }
                
                console.log(`[Rooted Vitality] ${role} header successfully injected`);
                this.log(`${role.charAt(0).toUpperCase() + role.slice(1)} header loaded successfully`);
                
                // Hide "Become a Practitioner" button if user is already a practitioner in client view
                if (role === 'practitioner' && view === 'client') {
                    const becomePractitionerBtn = document.getElementById('becomePractitionerBtn');
                    if (becomePractitionerBtn) {
                        becomePractitionerBtn.style.display = 'none';
                        console.log('[Rooted Vitality] Hidden "Become a Practitioner" button for practitioner in client view');
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
                            console.log('[Rooted Vitality] Attaching view switcher for practitioner user');
                            this.attachViewSwitcher();
                        }
                        
                        this.initAvatarMenu();
                        this.initNotificationsMenu();
                        this.initLogoutButtons();
                        
                        // Subscribe to real-time notifications for new matches
                        this.subscribeToNewMatches();
                        
                        // Update avatar initial with user's first name
                        let firstName = '';
                        
                        // Try multiple sources for firstName
                        try {
                            const userData = window.authManager?.getCurrentUser();
                            console.log('[Rooted Vitality] getCurrentUser() returned:', userData);
                            
                            if (userData?.firstName) {
                                firstName = userData.firstName;
                                console.log('[Rooted Vitality] Avatar initial from getCurrentUser():', firstName);
                            } else {
                                // Fallback: get from localStorage
                                const storedUser = localStorage.getItem('rvUser');
                                console.log('[Rooted Vitality] Raw localStorage rvUser:', storedUser);
                                
                                if (storedUser) {
                                    const user = JSON.parse(storedUser);
                                    console.log('[Rooted Vitality] Parsed localStorage user:', user);
                                    firstName = user.firstName || '';
                                    console.log('[Rooted Vitality] Avatar initial from localStorage:', firstName);
                                }
                            }
                        } catch (e) {
                            console.log('[Rooted Vitality] Could not get firstName:', e);
                        }
                        
                        if (firstName) {
                            console.log('[Rooted Vitality] Calling updateAvatarInitial with:', firstName);
                            this.updateAvatarInitial(firstName);
                        } else {
                            console.log('[Rooted Vitality] No firstName found, using default');
                            this.updateAvatarInitial('U');
                        }
                        
                        // Load appropriate avatar based on role and view
                        if (role === 'practitioner' && view === 'practitioner') {
                            // Practitioner in practitioner view - show business logo
                            console.log('[Rooted Vitality] Scheduling loadPractitionerLogo with 300ms delay');
                            this.loadPractitionerLogo();
                        } else if (role === 'practitioner' && view === 'client') {
                            // Practitioner in client view - show client avatar (not business logo)
                            console.log('[Rooted Vitality] Practitioner in client view - loading client avatar');
                            this.loadClientAvatar();
                        } else if (role === 'client') {
                            // Client - load client avatar
                            console.log('[Rooted Vitality] Scheduling loadClientAvatar');
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
                console.warn('[Rooted Vitality] Body not ready for header injection');
            }
        } catch (error) {
            console.error('[Rooted Vitality] Error rendering header:', error);
            // Fallback: inject basic public header
            console.log('[Rooted Vitality] Falling back to inline public header');
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
            console.log('[Rooted Vitality] Menu toggle or nav not found, skipping mobile menu init');
            return;
        }
        
        // Mobile menu toggle with keyboard support
        toggle.addEventListener('click', () => {
            nav.classList.toggle('open');
            const isOpen = nav.classList.contains('open');
            toggle.setAttribute('aria-expanded', isOpen);
            console.log(`[Rooted Vitality] Mobile menu ${isOpen ? 'opened' : 'closed'}`);
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
                console.log('[Rooted Vitality] Mobile menu closed by Escape key');
            }
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!toggle.contains(e.target) && !nav.contains(e.target) && nav.classList.contains('open')) {
                nav.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });
        
        console.log('[Rooted Vitality] Mobile menu toggle initialized');
    },
    
    /**
     * Attach logo behavior for dynamic routing based on view
     * @param {string} role - 'client' or 'practitioner'
     * @param {string} view - For practitioners: 'client' or 'practitioner'
     */
    attachLogoBehavior: function(role, view) {
        const logo = document.querySelector('.rv-logo');
        if (!logo) {
            console.warn('[Rooted Vitality] Logo element not found');
            return;
        }
        
        let targetHref = this.config.siteUrl + 'index.html';
        if (role === 'practitioner' && view === 'practitioner') {
            targetHref = this.config.siteUrl + 'dashboard/pro/index.html';
        }
        
        logo.setAttribute('href', targetHref);
        console.log(`[Rooted Vitality] Logo behavior attached - href set to: ${targetHref}`);
    },
    
    /**
     * Attach view switcher for practitioners to toggle between Client and Practitioner views
     * Looks for buttons with data-switch-view attribute and adds click handlers
     */
    attachViewSwitcher: function() {
        console.log('[Rooted Vitality] attachViewSwitcher called, searching for [data-switch-view] elements...');
        const elements = document.querySelectorAll('[data-switch-view]');
        console.log(`[Rooted Vitality] Found ${elements.length} view switcher element(s)`, elements);
        
        document.querySelectorAll('[data-switch-view]').forEach(btn => {
            const switchValue = btn.dataset.switchView;
            console.log(`[Rooted Vitality] Attaching click handler to view switcher:`, btn, `data-switch-view="${switchValue}"`);
            
            btn.addEventListener('click', (e) => {
                console.log('[Rooted Vitality] View switcher clicked!', btn);
                e.preventDefault();
                
                const newView = btn.dataset.switchView === 'practitioner' ? 'practitioner' : 'client';
                console.log(`[Rooted Vitality] newView determined as: ${newView} (btn.dataset.switchView="${btn.dataset.switchView}")`);
                
                console.log(`[Rooted Vitality] View switch clicked: ${newView}`);
                console.log(`[Rooted Vitality] Current pathname: ${window.location.pathname}`);
                
                // Persist active view
                localStorage.setItem('active_view', newView);
                console.log(`[Rooted Vitality] Saved active_view to localStorage: ${newView}`);
                
                // Navigate using absolute path from rooted-vitality root
                const currentPath = window.location.pathname;
                console.log('[Rooted Vitality] Current path:', currentPath);
                
                let targetUrl = '';
                if (newView === 'practitioner') {
                    targetUrl = '/rooted-vitality/dashboard/pro/index.html';
                    console.log('[Rooted Vitality] Practitioner view selected, targetUrl set to:', targetUrl);
                } else {
                    targetUrl = '/rooted-vitality/dashboard/client/pages/dashboard.html';
                    console.log('[Rooted Vitality] Client view selected, targetUrl set to:', targetUrl);
                }
                
                console.log(`[Rooted Vitality] About to redirect to: ${targetUrl}`);
                window.location.href = targetUrl;
            });
        });
        console.log('[Rooted Vitality] View switcher attached');
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
              <a href="${pathPrefix}dashboard/signup.html" class="rv-nav-link rv-btn-accent">Sign Up</a>
              <a href="${pathPrefix}login.html" class="rv-nav-link rv-nav-login">Log In</a>
            </nav>
          </div>
        </header>
        `;
        
        if (document.body) {
            document.body.insertAdjacentHTML('afterbegin', fallbackHTML);
            console.log('[Rooted Vitality] Fallback public header injected');
        }
    },
    
    /**
     * Initialize avatar menu interactions for client header
     * Handles click toggle, keyboard navigation, outside click close
     */
    initAvatarMenu: function() {
        console.log('[Rooted Vitality] Initializing avatar menu...');
        
        const avatarBtn = document.querySelector('.rv-avatar-btn');
        const avatarDropdown = document.querySelector('.rv-avatar-dropdown');
        const dropdownItems = document.querySelectorAll('.rv-avatar-dropdown .rv-dropdown-item');
        
        if (!avatarBtn || !avatarDropdown) {
            console.log('[Rooted Vitality] Avatar menu not found, skipping initialization');
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
        console.log('[Rooted Vitality] Checking practitioner view switcher button...');
        console.log('[Rooted Vitality] Button element found:', !!switchToPractitionerBtn);
        
        if (switchToPractitionerBtn) {
            try {
                // Get user data - try authManager first, fallback to localStorage
                let userData = null;
                if (typeof window.authManager !== 'undefined' && window.authManager.getCurrentUser) {
                    userData = window.authManager.getCurrentUser();
                    console.log('[Rooted Vitality] Got userData from authManager');
                } else {
                    // Fallback: check localStorage for user_role
                    const storedRole = localStorage.getItem('user_role');
                    if (storedRole) {
                        userData = { role: storedRole };
                        console.log('[Rooted Vitality] Got userData from localStorage - role:', storedRole);
                    }
                }
                
                const activeView = localStorage.getItem('active_view') || 'client';
                console.log('[Rooted Vitality] User role:', userData?.role, 'Active view:', activeView);
                
                // Show button if: user is practitioner AND they're viewing the client dashboard
                if (userData?.role === 'practitioner' && activeView === 'client') {
                    switchToPractitionerBtn.style.display = 'block';
                    console.log('[Rooted Vitality] ✓ Showing "Practitioner View" link for practitioner user in client view');
                } else {
                    switchToPractitionerBtn.style.display = 'none';
                    console.log('[Rooted Vitality] ✗ Hiding Practitioner View link - role:', userData?.role, 'view:', activeView);
                }
            } catch (error) {
                console.log('[Rooted Vitality] Could not check practitioner status:', error);
                switchToPractitionerBtn.style.display = 'none';
            }
        }
        
        console.log('[Rooted Vitality] Avatar menu initialized');
    },

    /**
     * Update avatar initial with user's first name
     * @param {string} firstName - User's first name
     */
    updateAvatarInitial: function(firstName = 'U') {
        const avatarInitial = document.getElementById('rvAvatarInitial');
        console.log(`[Rooted Vitality] updateAvatarInitial called with: "${firstName}"`);
        if (avatarInitial) {
            const initial = (firstName && firstName.length > 0) ? firstName.charAt(0).toUpperCase() : 'U';
            console.log(`[Rooted Vitality] Setting avatar initial to: "${initial}"`);
            avatarInitial.textContent = initial;
            console.log(`[Rooted Vitality] Avatar initial updated to: ${initial}`);
        } else {
            console.log('[Rooted Vitality] Avatar initial element not found - element ID: rvAvatarInitial');
        }
    },

    /**
     * Update header avatar with profile picture
     * Used when practitioner uploads business logo or client uploads profile picture
     * @param {string} imageUrl - The URL of the profile/logo image
     */
    updateHeaderAvatar: function(imageUrl) {
        if (!imageUrl) return;
        
        console.log('[Rooted Vitality] Updating header avatar with:', imageUrl);
        
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
            
            console.log('[Rooted Vitality] Header avatar image updated');
        } else {
            console.warn('[Rooted Vitality] Avatar button not found in header');
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
        
        console.log('[Rooted Vitality] Updating header logo/avatar with:', logoUrl);
        
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
                    console.log('[Rooted Vitality] Logo image loaded successfully:', logoUrl);
                };
                logoImg.onerror = () => {
                    console.error('[Rooted Vitality] Logo image failed to load:', logoUrl);
                };
                
                avatarBtn.appendChild(logoImg);
                
                console.log('[Rooted Vitality] Header logo image updated in avatar button');
            } else {
                console.warn('[Rooted Vitality] Avatar button not found for logo update');
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
                console.log('[Rooted Vitality] Logo cache cleared for user:', user.id);
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
                console.log('[Rooted Vitality] Client avatar cache cleared for user:', user.id);
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
        console.log(`[Rooted Vitality] loadPractitionerLogo() called (attempt ${retryCount + 1}/${maxRetries + 1})`);
        
        try {
            // Check if avatar button exists in DOM
            const avatarBtn = document.querySelector('.rv-avatar-btn');
            if (!avatarBtn) {
                console.warn(`[Rooted Vitality] [Attempt ${retryCount + 1}] Avatar button (.rv-avatar-btn) not found in DOM`);
                
                // Retry if we haven't exceeded max retries
                if (retryCount < maxRetries) {
                    console.log(`[Rooted Vitality] Retrying in 200ms (${maxRetries - retryCount} retries left)...`);
                    setTimeout(() => this.loadPractitionerLogo(retryCount + 1), 200);
                } else {
                    console.error('[Rooted Vitality] Max retries exceeded, avatar button never found');
                }
                return;
            }
            console.log(`[Rooted Vitality] [Attempt ${retryCount + 1}] Avatar button found in DOM`);
            
            // Only attempt if Supabase client is available
            if (!window.supabaseClient) {
                console.warn('[Rooted Vitality] Supabase client not available');
                
                if (retryCount < maxRetries) {
                    console.log(`[Rooted Vitality] Retrying in 200ms...`);
                    setTimeout(() => this.loadPractitionerLogo(retryCount + 1), 200);
                }
                return;
            }
            console.log('[Rooted Vitality] Supabase client available');
            
            // Get current user
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) {
                console.warn('[Rooted Vitality] No authenticated user');
                return;
            }
            console.log('[Rooted Vitality] Authenticated user:', user.id);
            
            // Check if already loaded for this user
            if (this._logoLoadedForUser[user.id]) {
                console.log('[Rooted Vitality] Logo already loaded for this user, skipping');
                return;
            }
            
            // Fetch practitioner data
            console.log('[Rooted Vitality] Querying practitioners table...');
            const { data: practitioner, error } = await window.supabaseClient
                .from('practitioners')
                .select('legal_business_name')
                .eq('id', user.id)
                .single();
            
            if (error) {
                console.error('[Rooted Vitality] Database query failed:', error);
                console.log('[Rooted Vitality] Error details - practitioners table may not be accessible or user has no record');
                return;
            }
            
            if (!practitioner) {
                console.warn('[Rooted Vitality] No practitioner record found');
                return;
            }
            
            // Fetch logo from practitioner_profiles table
            console.log('[Rooted Vitality] Querying practitioner_profiles table for logo...');
            const { data: profile, error: profileError } = await window.supabaseClient
                .from('practitioner_profiles')
                .select('practice_logo_url')
                .eq('id', user.id)
                .single();
            
            let logoUrl = null;
            if (!profileError && profile) {
                logoUrl = profile.practice_logo_url;
            }
            
            console.log('[Rooted Vitality] Logo URL determination:', {
                practice_logo_url: logoUrl,
                hasProfile: !!profile
            });
            
            if (logoUrl) {
                console.log('[Rooted Vitality] Logo URL found:', logoUrl.substring(0, 80) + '...');
                this.updateHeaderLogo(logoUrl, 'practitioner', 'practitioner');
                console.log('[Rooted Vitality] Logo loaded successfully');
            } else {
                console.log('[Rooted Vitality] No logo URL in database, updating initial with business name');
                // No logo - update initial with business name from database
                if (practitioner.legal_business_name) {
                    console.log('[Rooted Vitality] Updating avatar initial with business name:', practitioner.legal_business_name);
                    this.updateAvatarInitial(practitioner.legal_business_name);
                }
            }
            
            // Mark logo as loaded regardless of whether we found one
            // This prevents repeated database queries on every page load
            this._logoLoadedForUser[user.id] = true;
            console.log('[Rooted Vitality] Logo load completed for user:', user.id);
        } catch (error) {
            console.error('[Rooted Vitality] Exception in loadPractitionerLogo:', error.message);
            
            if (retryCount < maxRetries) {
                console.log(`[Rooted Vitality] Retrying after error in 200ms...`);
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
        console.log(`[Rooted Vitality] loadClientAvatar() called (attempt ${retryCount + 1}/${maxRetries + 1})`);
        
        try {
            const avatarBtn = document.querySelector('.rv-avatar-btn');
            if (!avatarBtn) {
                console.warn(`[Rooted Vitality] Avatar button not found`);
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
                console.log('[Rooted Vitality] Client avatar already loaded');
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
                console.log('[Rooted Vitality] Client avatar loaded');
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
            
            const { error } = await window.supabaseClient
                .from(table)
                .update({ is_read: true })
                .eq('id', notifId);
            
            if (error) {
                console.error('[Rooted Vitality] Error marking notification as read:', error);
                return;
            }
            
            console.log('[Rooted Vitality] Notification marked as read:', notifId, 'in table:', table);
            this.loadNotifications(); // Refresh to update bell state
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
                    console.warn('[Rooted Vitality] Could not fetch client serial for marking as read:', clientError);
                    return;
                }
                
                whereValue = clientData.serial_number;
            } else {
                notificationTable = 'practitioner_notifications';
                whereField = 'practitioner_serial';
                whereValue = user.user_metadata?.serial_number || currentUser?.serial_number;
            }

            if (!whereValue) {
                return;
            }

            // Update all unread notifications to read
            const { error } = await window.supabaseClient
                .from(notificationTable)
                .update({ is_read: true })
                .eq(whereField, whereValue)
                .eq('is_read', false);

            if (error) {
                console.error('[Rooted Vitality] Error marking all notifications as read:', error);
                return;
            }

            console.log('[Rooted Vitality] All notifications marked as read');
            // Reload to update UI
            this.loadNotifications();
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

            const practitionerSerial = user.user_metadata?.serial_number || currentUser?.serial_number;
            if (!practitionerSerial) {
                return;
            }

            console.log('[Rooted Vitality] Setting up real-time match listener...');

            // Subscribe to changes in project_practitioner_matches table
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
                        console.log('[Rooted Vitality] New match detected:', payload);
                        
                        // Get match details to create a notification
                        const { data: matchData } = await window.supabaseClient
                            .from('project_practitioner_matches')
                            .select('*, projects(*)')
                            .eq('id', payload.new.id)
                            .single();

                        if (matchData && matchData.projects) {
                            // Create a notification for the new match
                            const notificationTitle = `New Match: ${matchData.projects.title || 'Wellness Journey'}`;
                            const notificationMessage = `You've been matched with a new client. Review the project to get started.`;

                            const { error } = await window.supabaseClient
                                .from('practitioner_notifications')
                                .insert([{
                                    practitioner_serial: practitionerSerial,
                                    title: notificationTitle,
                                    message: notificationMessage,
                                    type: 'new_match',
                                    link: '/dashboard/pro/pages/inbox.html',
                                    is_read: false,
                                    created_at: new Date().toISOString()
                                }]);

                            if (error) {
                                console.error('[Rooted Vitality] Error creating match notification:', error);
                            } else {
                                console.log('[Rooted Vitality] Match notification created');
                                // Update the notification bell immediately
                                this.loadNotifications();
                            }
                        }
                    }
                )
                .subscribe();

            // Store subscription for cleanup if needed
            window.notificationSubscriptions = window.notificationSubscriptions || [];
            window.notificationSubscriptions.push(subscription);

        } catch (error) {
            console.error('[Rooted Vitality] Error setting up match listener:', error);
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
                    console.warn('[Rooted Vitality] Could not fetch client serial:', clientError);
                    return;
                }
                
                whereValue = clientData.serial_number;
            } else {
                notificationTable = 'practitioner_notifications';
                whereField = 'practitioner_serial';
                whereValue = user.user_metadata?.serial_number || currentUser?.serial_number;
            }

            if (!whereValue) {
                console.warn('[Rooted Vitality] Could not determine serial number for notifications');
                return;
            }

            const { data, error } = await window.supabaseClient
                .from(notificationTable)
                .select('*')
                .eq(whereField, whereValue)
                .order('created_at', { ascending: false });

            if (error) {
                console.warn('[Rooted Vitality] Notification query error:', error);
                return;
            }

            // Update bell color based on unread count
            const unreadCount = data?.filter(n => !n.is_read).length || 0;
            const bellIcon = document.querySelector('.rv-bell-icon');
            const badge = document.querySelector('.rv-notification-badge');
            
            if (bellIcon) {
                if (unreadCount > 0) {
                    bellIcon.style.color = '#d4c47c'; // Gold for unread
                    if (badge) {
                        badge.textContent = unreadCount;
                        badge.style.display = 'block';
                    }
                } else {
                    bellIcon.style.color = 'currentColor'; // White/normal
                    if (badge) {
                        badge.style.display = 'none';
                    }
                }
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
     * Initialize notifications menu interactions
     * Handles click toggle, outside click close
     */
    initNotificationsMenu: function() {
        console.log('[Rooted Vitality] Initializing notifications menu...');
        
        const notificationsBtn = document.querySelector('.rv-notifications-btn');
        const notificationsDropdown = document.querySelector('.rv-notifications-dropdown');
        
        if (!notificationsBtn || !notificationsDropdown) {
            console.log('[Rooted Vitality] Notifications menu not found, skipping initialization');
            return;
        }
        
        // Toggle dropdown on button click AND load notifications
        notificationsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = notificationsDropdown.classList.toggle('show');
            notificationsBtn.setAttribute('aria-expanded', isOpen);
            
            // When opening, immediately clear the bell badge and mark all as read
            if (isOpen) {
                console.log('[Rooted Vitality] Bell clicked, clearing badge and marking all as read...');
                
                // Immediately hide badge and reset bell color for instant feedback
                const bellIcon = document.querySelector('.rv-bell-icon');
                const badge = document.querySelector('.rv-notification-badge');
                if (bellIcon) {
                    bellIcon.style.color = 'currentColor'; // Reset to normal color
                }
                if (badge) {
                    badge.style.display = 'none';
                    badge.textContent = '';
                }
                
                // Then mark all as read and load notifications in background
                this.markAllNotificationsAsRead();
                this.loadNotifications();
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
        
        console.log('[Rooted Vitality] Notifications menu initialized');
    },

    /**
     * Initialize logout handler for avatar dropdown
     * Handles click event to call authManager.logout()
     */
    initLogoutButtons: function() {
        console.log('[Rooted Vitality] Initializing logout handler...');
        
        // Handle Logout link in avatar dropdown
        const logoutLink = document.querySelector('.rv-logout-item');
        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('[Rooted Vitality] Log out link clicked');
                if (typeof window.authManager !== 'undefined') {
                    window.authManager.logout();
                } else {
                    console.warn('[Rooted Vitality] authManager not available for logout');
                }
            });
        }
        
        console.log('[Rooted Vitality] Logout handler initialized');
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
        console.log('[Rooted Vitality] injectHeader() called');
        
        // Prevent double injection
        if (document.getElementById('rvHeader')) {
            console.log('[Rooted Vitality] Header already exists, skipping injection');
            return;
        }
        
        // Ensure we have a body to inject into
        if (!document.body) {
            console.warn('[Rooted Vitality] Body not ready for header injection');
            return;
        }
        
        console.log('[Rooted Vitality] Injecting header into body...');
        
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
        
        console.log('[Rooted Vitality] Header successfully injected!');
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
            console.log('[Rooted Vitality] Login modal trigger attached to Login button');
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
                console.log('[Rooted Vitality] authManager not ready, skipping header update');
                return;
            }
            
            const userData = window.authManager.getCurrentUser();
            if (!userData || !userData.role) {
                console.log('[Rooted Vitality] No authenticated user, keeping public header');
                return;
            }
            
            console.log('[Rooted Vitality] User authenticated as:', userData.role, '- Updating header');
            
            const loginBtn = document.getElementById('rvLoginBtn');
            if (!loginBtn) {
                console.warn('[Rooted Vitality] Login button not found in header');
                return;
            }
            
            // Detect path prefix
            const currentPath = window.location.pathname;
            const isSubdirectory = currentPath.includes('/articles/') || currentPath.includes('/policies/') || currentPath.includes('/dashboard/') || currentPath.includes('/help-center/');
            const pathPrefix = isSubdirectory ? '../' : './';
            
            // Replace Login button with Dashboard link
            let dashboardUrl = pathPrefix + 'dashboard/client/pages/dashboard.html';
            if (userData.role === 'practitioner') {
                dashboardUrl = pathPrefix + 'dashboard/pro/index.html';
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
            
            console.log('[Rooted Vitality] Header updated to show Dashboard button');
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
        console.log('[Rooted Vitality] Login modal managed by authModal.js');
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
        console.log('[Rooted Vitality] injectFooter() called');
        
        // Prevent double injection
        if (document.getElementById('rvFooter')) {
            console.log('[Rooted Vitality] Footer already exists, skipping injection');
            return;
        }
        
        if (!document.body) {
            console.warn('[Rooted Vitality] Body not ready for footer injection');
            return;
        }
        
        // Detect if we're in a subdirectory and adjust paths for links and images
        const currentPath = window.location.pathname;
        
        // Calculate path depth by counting slashes after /rooted-vitality/
        const baseIndex = currentPath.indexOf('/rooted-vitality/');
        const pathAfterBase = baseIndex !== -1 ? currentPath.substring(baseIndex + '/rooted-vitality/'.length) : currentPath;
        const slashCount = (pathAfterBase.match(/\//g) || []).length;
        
        // Build pathPrefix based on depth
        let pathPrefix = './';
        if (slashCount >= 3) {
            // 3+ levels deep (e.g., /dashboard/pro/pages/profile.html)
            pathPrefix = '../../../';
        } else if (slashCount >= 2) {
            // 2 levels deep (e.g., /dashboard/pro/index.html or /articles/page.html)
            pathPrefix = '../../';
        } else if (slashCount >= 1) {
            // 1 level deep (e.g., /dashboard/index.html)
            pathPrefix = '../';
        }
        
        console.log('[Rooted Vitality] Footer path calculation:', {currentPath, pathAfterBase, slashCount, pathPrefix});
        
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
                    <div class="rv-footer-contact">
                        <p class="rv-footer-phone">435.637.7625</p>
                        <p class="rv-footer-email">vitalityiswithin@gmail.com</p>
                        <div class="rv-footer-socials">
                            <a href="#" aria-label="Facebook" class="rv-social-link">f</a>
                            <a href="#" aria-label="Instagram" class="rv-social-link">📷</a>
                            <a href="#" aria-label="Twitter" class="rv-social-link">𝕏</a>
                        </div>
                    </div>
                </div>
                
                <!-- Center Section: Links -->
                <div class="rv-footer-section">
                    <h4 class="rv-footer-heading">Links</h4>
                    <nav class="rv-footer-nav">
                        <a href="${pathPrefix}index.html">Home</a>
                        <a href="${pathPrefix}help-center/">Help Center</a>
                    </nav>
                </div>
                
                <!-- Right Section: Core Services -->
                <div class="rv-footer-section">
                    <h4 class="rv-footer-heading">Core Services</h4>
                    <nav class="rv-footer-nav">
                        <a href="#">Holistic Wellness Consultations</a>
                        <a href="#">Nutritional & Lifestyle Guidance</a>
                        <a href="#">Herbal Remedies & Tinctures</a>
                        <a href="#">Practitioner Network</a>
                    </nav>
                </div>
            </div>
            
            <!-- Bottom: Copyright & Help -->
            <div class="rv-footer-bottom">
                <p class="rv-footer-copyright">Rooted Vitality © 2025 · All rights reserved</p>
                <a href="${pathPrefix}index.html" class="rv-footer-help-btn" aria-label="Need help? Go to Help Center">Need Help?</a>
            </div>
            
            <!-- Decorative Plant SVG (positioned absolutely) -->
            <svg class="rv-footer-plant" viewBox="0 0 200 400" preserveAspectRatio="xMaxYMid slice">
                <!-- Stem -->
                <line x1="100" y1="200" x2="100" y2="350" stroke="#a8b8a8" stroke-width="8" stroke-linecap="round"/>
                <!-- Roots -->
                <path d="M 100 350 Q 70 380 50 400" stroke="#a8b8a8" stroke-width="6" fill="none" stroke-linecap="round"/>
                <path d="M 100 350 Q 130 380 150 400" stroke="#a8b8a8" stroke-width="6" fill="none" stroke-linecap="round"/>
                <path d="M 100 350 Q 100 390 100 410" stroke="#a8b8a8" stroke-width="5" fill="none" stroke-linecap="round"/>
                <!-- Leaves -->
                <ellipse cx="75" cy="250" rx="15" ry="30" fill="#5c9a72" opacity="0.8" transform="rotate(-35 75 250)"/>
                <ellipse cx="125" cy="250" rx="15" ry="30" fill="#6ba87f" opacity="0.8" transform="rotate(35 125 250)"/>
                <ellipse cx="70" cy="200" rx="12" ry="28" fill="#5c9a72" opacity="0.7" transform="rotate(-45 70 200)"/>
                <ellipse cx="130" cy="200" rx="12" ry="28" fill="#6ba87f" opacity="0.7" transform="rotate(45 130 200)"/>
                <ellipse cx="60" cy="140" rx="13" ry="26" fill="#5c9a72" opacity="0.9" transform="rotate(-55 60 140)"/>
                <ellipse cx="140" cy="140" rx="13" ry="26" fill="#6ba87f" opacity="0.9" transform="rotate(55 140 140)"/>
                <!-- Flower -->
                <circle cx="100" cy="100" r="12" fill="#d4c47c" opacity="0.9"/>
                <ellipse cx="100" cy="70" rx="6" ry="12" fill="#d4c47c" opacity="0.85"/>
            </svg>
        </footer>
        `;
        
        // Inject footer at end of body
        document.body.insertAdjacentHTML('beforeend', footerHTML);
        
        console.log('[Rooted Vitality] Footer successfully injected!');
        this.log('Rooted Vitality Footer injected successfully');
    },

    /**
     * Inject Report a Concern Widget
     * Universal widget for reporting issues/concerns on all pages
     * Inserted before footer
     * Usage: RootedVitality.injectReportConcern();
     */
    injectReportConcern: function() {
        console.log('[Rooted Vitality] injectReportConcern() called');
        
        // Prevent double injection
        if (document.getElementById('report-concern-footer')) {
            console.log('[Rooted Vitality] Report concern widget already exists, skipping injection');
            return;
        }
        
        if (!document.body) {
            console.warn('[Rooted Vitality] Body not ready for report concern injection');
            return;
        }
        
        // The actual widget HTML will be loaded from external file
        // For now, inject a simple version
        const reportConcernHTML = `
        <div id="report-concern-footer" class="report-concern-footer">
            <button id="report-concern-btn" class="report-concern-link" title="Report a technical issue or concern with the website">
                Report a Concern
            </button>
        </div>

        <!-- Report Concern Modal -->
        <div id="report-concern-modal" class="modal" style="display: none;">
            <div class="modal-content report-concern-modal-content">
                <div class="modal-header">
                    <h2>Report a Concern</h2>
                    <button class="close-btn" onclick="closeReportConcernModal()">&times;</button>
                </div>
                
                <form id="report-concern-form" onsubmit="submitReportConcern(event)">
                    
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
                        <button type="button" class="btn-secondary" onclick="closeReportConcernModal()">Cancel</button>
                        <button type="submit" class="btn-primary">Submit Report</button>
                    </div>
                </form>
            </div>
        </div>
        `;
        
        // Insert at end of body (after all content, before footer which comes after)
        // This ensures it appears between main content and footer
        document.body.insertAdjacentHTML('beforeend', reportConcernHTML);
        
        console.log('[Rooted Vitality] Report concern widget successfully injected!');
        this.log('Report concern widget injected successfully');
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
                console.log('[Rooted Vitality] Using pre-detected role from practitioner profile:', headerRole);
                
                // For practitioners, load view from localStorage
                if (headerRole === 'practitioner') {
                    headerView = localStorage.getItem('active_view') || 'client';
                    console.log('[Rooted Vitality] Practitioner view:', headerView);
                }
            } 
            // Check for authenticated user via authManager
            else if (typeof window.authManager !== 'undefined') {
                const userData = window.authManager.getCurrentUser();
                if (userData && userData.role) {
                    headerRole = userData.role;
                    console.log('[Rooted Vitality] User authenticated as:', headerRole);
                    
                    // For practitioners, load view from localStorage
                    if (headerRole === 'practitioner') {
                        headerView = localStorage.getItem('active_view') || 'client';
                        console.log('[Rooted Vitality] Practitioner view:', headerView);
                    }
                }
            }
        } catch (error) {
            console.log('[Rooted Vitality] Auth check failed, defaulting to public header:', error);
        }
        
        // Render header with appropriate role and view
        await this.renderHeader(headerRole, headerView);
        
        this.injectLoginModal();
        this.injectReportConcern();
        this.injectFooter();
        this.injectBackButton();
        this.trackPageView();
        
        // Log successful initialization
        this.log('Utilities loaded successfully');
    }
};

// Auto-initialize on script load if document is ready
console.log('[Rooted Vitality] Document readyState:', document.readyState);

if (document.readyState === 'loading') {
    console.log('[Rooted Vitality] Waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', function() {
        console.log('[Rooted Vitality] DOMContentLoaded fired, initializing...');
        RootedVitality.init();
    });
} else {
    // Document already loaded
    console.log('[Rooted Vitality] Document already loaded, initializing immediately...');
    RootedVitality.init();
}

// Export for use in other modules (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RootedVitality;
}

// End of injections.js — Rooted Vitality Global Utilities
