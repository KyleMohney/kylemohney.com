/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: assets/injections.js                                        ║
║  Purpose: Centralized Functionality (Navigation, Utilities)        ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝
*/

/**
 * ROOTED VITALITY GLOBAL UTILITIES
 * Provides common functionality for all pages
 */

const RootedVitality = {
    
    // ========== BRANDING & CONFIG ==========
    config: {
        siteName: 'Rooted Vitality',
        siteUrl: '/',
        brandColor: '#5d6a3e',
        accentGreen: '#ebf6e8',
        accentCream: '#fbf7ec',
        accentPeach: '#fae2ca'
    },
    
    // ========== NAVIGATION ==========
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
    
    /**
     * Inject header/navigation bar across all pages
     * Usage: RootedVitality.injectHeader();
     */
    injectHeader: function() {
        const header = document.createElement('header');
        header.className = 'rv-header';
        header.innerHTML = `
            <div class="container">
                <a href="/" class="rv-logo">
                    <span class="rv-logo-text">${this.config.siteName}</span>
                </a>
                <nav class="rv-nav">
                    <a href="/" class="nav-link">Help Center</a>
                    <a href="/" class="nav-link">Back to Main</a>
                </nav>
            </div>
        `;
        document.body.insertBefore(header, document.body.firstChild);
    },
    
    /**
     * Inject footer across all pages
     * Usage: RootedVitality.injectFooter();
     */
    injectFooter: function() {
        const footer = document.createElement('footer');
        footer.className = 'rv-footer';
        footer.innerHTML = `
            <div class="container">
                <p>&copy; 2025 ${this.config.siteName}. All rights reserved.</p>
                <nav class="footer-nav">
                    <a href="#privacy">Privacy Policy</a>
                    <a href="#terms">Terms of Service</a>
                    <a href="#contact">Contact</a>
                </nav>
            </div>
        `;
        document.body.appendChild(footer);
    },
    
    // ========== UTILITIES ==========
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
        const style = 'color: #5d6a3e; font-weight: bold;';
        console.log(`%c[${this.config.siteName}] ${message}`, style);
    },
    
    // ========== INITIALIZATION ==========
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
