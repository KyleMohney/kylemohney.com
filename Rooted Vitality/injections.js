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
// 1. BRANDING & CONFIG
// ======================================================
const RootedVitality = {
    config: {
        siteName: 'Rooted Vitality',
        siteUrl: '/',
        brandColor: '#5c9a72',
        accentGold: '#d4c47c',
        accentGreen: '#ebf6e8',
        accentCream: '#fbf7ec',
        accentPeach: '#fae2ca',
        year: 2025
    },
    
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
    // 4. INITIALIZATION
    // ======================================================
    /**
     * Initialize all common functionality
     * Usage: RootedVitality.init();
     */
    init: function() {
        this.log('Initializing Rooted Vitality utilities');
        
        // Auto-initialize common components
        document.addEventListener('DOMContentLoaded', () => {
            this.injectBackButton();
            this.trackPageView();
            
            // Log successful initialization
            this.log('Utilities loaded successfully');
        });
    }
};

// Auto-initialize on script load if document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        RootedVitality.init();
    });
} else {
    RootedVitality.init();
}

// Export for use in other modules (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RootedVitality;
}

// End of injections.js — Rooted Vitality Global Utilities
