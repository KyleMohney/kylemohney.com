/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: scripts/products.js                                         ║
║  Purpose: Products Hub Logic & Tier-Based Access Control           ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

TABLE OF CONTENTS
  1. PRODUCT DEFINITIONS
  2. TIER SYSTEM
  3. PAGE INITIALIZATION
  4. PRODUCT RENDERING
  5. TIER LOGIC
*/

console.log('[Rooted Vitality] products.js loading...');

// ======================================================
// 1. PRODUCT DEFINITIONS
// ======================================================
/**
 * Product catalog with tier requirements
 * Tier levels: 0 = Free, 1 = Basic, 2 = Premium
 */
const productCatalog = [
    {
        id: 'lifestyles-library',
        name: 'Lifestyles Library',
        description: 'Daily wellness practices, routines, and lifestyle guides for balanced living.',
        icon: '🌿',
        tier: 0, // Free
        tierLabel: 'Free',
        link: './lifestyles-library.html',
        isComingSoon: false
    },
    {
        id: 'holistic-prompt-library',
        name: 'Holistic Prompt Library',
        description: 'Curated prompts for mindfulness, journaling, and practitioner communication.',
        icon: '📚',
        tier: 1, // Basic
        tierLabel: 'Basic',
        link: './holistic-prompt-library.html',
        isComingSoon: false
    },
    {
        id: 'guides-collection',
        name: 'Guides Collection',
        description: 'In-depth learning resources and expert insights from holistic practitioners.',
        icon: '📖',
        tier: 0, // Free
        tierLabel: 'Free',
        link: '../articles/',
        isComingSoon: false
    },
    {
        id: 'consultation-companion',
        name: 'Consultation Companion',
        description: 'Your personalized consultation prep and follow-up assistant (Coming Soon).',
        icon: '🎯',
        tier: 2, // Premium
        tierLabel: 'Premium',
        link: '#',
        isComingSoon: true
    }
];

// ======================================================
// 2. TIER SYSTEM
// ======================================================
/**
 * Tier hierarchy and access levels
 * User tier stored in localStorage as 'membershipTier'
 * 0 = Free (default)
 * 1 = Basic
 * 2 = Premium
 */
const tierSystem = {
    FREE: 0,
    BASIC: 1,
    PREMIUM: 2,
    
    labels: {
        0: 'Free',
        1: 'Basic',
        2: 'Premium'
    },
    
    /**
     * Get user's current membership tier
     * @return {number} User tier level
     */
    getUserTier() {
        const stored = localStorage.getItem('membershipTier');
        return stored ? parseInt(stored) : this.FREE;
    },
    
    /**
     * Set user's membership tier
     * @param {number} tier - Tier level to set
     */
    setUserTier(tier) {
        localStorage.setItem('membershipTier', tier.toString());
        console.log(`[Rooted Vitality Products] Membership tier set to: ${this.labels[tier]}`);
    },
    
    /**
     * Check if user has access to a product
     * @param {number} requiredTier - Product's required tier
     * @return {boolean} True if user can access
     */
    hasAccess(requiredTier) {
        const userTier = this.getUserTier();
        return userTier >= requiredTier;
    }
};

// ======================================================
// 3. PAGE INITIALIZATION
// ======================================================
/**
 * Initialize products page on DOMContentLoaded
 * Renders product grid based on user tier
 */
window.initializeProductsPage = async () => {
    console.log('[Rooted Vitality Products] Initializing products page...');
    
    try {
        // Wait for auth system to be ready
        if (typeof window.authManager === 'undefined') {
            console.warn('[Rooted Vitality Products] Auth system not ready, retrying...');
            setTimeout(window.initializeProductsPage, 100);
            return;
        }
        
        // Get current user tier (default to Free)
        const userTier = tierSystem.getUserTier();
        console.log(`[Rooted Vitality Products] User tier: ${tierSystem.labels[userTier]}`);
        
        // Render products grid
        window.renderProductsGrid(productCatalog, userTier);
        
        console.log('[Rooted Vitality Products] Page initialized successfully');
    } catch (error) {
        console.error('[Rooted Vitality Products] Initialization error:', error);
    }
};

// ======================================================
// 4. PRODUCT RENDERING
// ======================================================
/**
 * Render all products in grid
 * @param {array} products - Product catalog
 * @param {number} userTier - User's current tier
 */
window.renderProductsGrid = (products, userTier) => {
    const gridContainer = document.getElementById('productsGrid');
    
    if (!gridContainer) {
        console.error('[Rooted Vitality Products] Grid container not found');
        return;
    }
    
    // Clear existing products
    gridContainer.innerHTML = '';
    
    // Render each product
    products.forEach(product => {
        const productCard = window.createProductCard(product, userTier);
        gridContainer.appendChild(productCard);
    });
    
    console.log(`[Rooted Vitality Products] Rendered ${products.length} products`);
};

/**
 * Create a product card element
 * @param {object} product - Product object
 * @param {number} userTier - User's current tier
 * @return {HTMLElement} Product card DOM element
 */
window.createProductCard = (product, userTier) => {
    const card = document.createElement('article');
    const hasAccess = tierSystem.hasAccess(product.tier);
    const isLocked = !hasAccess && !product.isComingSoon;
    
    // Set card classes
    card.className = `product-card ${isLocked ? 'locked' : ''}`;
    card.setAttribute('aria-label', `${product.name} - ${product.tierLabel} tier`);
    
    // Build card HTML
    card.innerHTML = `
        ${isLocked ? `
            <div class="lock-overlay" aria-label="This product is locked">
                <span class="lock-icon">🔒</span>
            </div>
        ` : ''}
        
        <div class="product-card-icon" aria-hidden="true">
            ${product.icon}
        </div>
        
        <div class="product-card-header">
            <h3 class="product-card-title">${product.name}</h3>
            <span class="tier-badge ${getTierClass(product.tier)}" aria-label="Tier: ${product.tierLabel}">
                ${product.tierLabel}
            </span>
        </div>
        
        <p class="product-card-description">
            ${product.description}
        </p>
        
        <div class="product-card-footer">
            <a href="${product.link}" 
               class="product-card-link" 
               ${product.isComingSoon ? 'disabled aria-disabled="true"' : ''}
               aria-label="Learn more about ${product.name}">
                ${product.isComingSoon ? 'Coming Soon' : 'Learn More'}
            </a>
        </div>
    `;
    
    // Add event listeners for locked cards
    if (isLocked) {
        card.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.showUpgradePrompt(product, tierSystem.labels[userTier]);
        });
    }
    
    return card;
};

// ======================================================
// 5. TIER LOGIC
// ======================================================
/**
 * Get CSS class for tier badge based on tier level
 * @param {number} tier - Tier level
 * @return {string} CSS class name
 */
function getTierClass(tier) {
    const tierClasses = {
        0: 'free',
        1: 'basic',
        2: 'premium'
    };
    return tierClasses[tier] || 'free';
}

/**
 * Show upgrade prompt for locked products
 * Called when user clicks a locked product card
 * @param {object} product - Product object
 * @param {string} currentTier - User's current tier name
 */
window.showUpgradePrompt = (product, currentTier) => {
    const tierUpgradeMap = {
        0: 'Basic',
        1: 'Premium',
        2: 'Premium'
    };
    
    const requiredTierName = tierSystem.labels[product.tier];
    const message = `
    🔒 ${product.name}

    This product requires ${requiredTierName} membership.
    Your current tier: ${currentTier}

    Upgrade your membership to access this product and unlock exclusive benefits.
    `;
    
    console.log(`[Rooted Vitality Products] Upgrade prompt - ${product.name} requires ${requiredTierName}`);
    alert(message);
};

/**
 * Demo function: Upgrade user tier (for testing)
 * In production, this would be tied to payment system
 * @param {number} tier - New tier to upgrade to
 */
window.upgradeUserTier = (tier) => {
    tierSystem.setUserTier(tier);
    
    const currentUserTier = tierSystem.getUserTier();
    window.renderProductsGrid(productCatalog, currentUserTier);
    
    console.log(`[Rooted Vitality Products] User upgraded to ${tierSystem.labels[tier]}`);
    alert(`Congratulations! You've been upgraded to ${tierSystem.labels[tier]} membership. 🎉`);
};

/**
 * Demo function: Downgrade user tier (for testing)
 * @param {number} tier - Tier to downgrade to
 */
window.downgradeUserTier = (tier) => {
    tierSystem.setUserTier(tier);
    
    const currentUserTier = tierSystem.getUserTier();
    window.renderProductsGrid(productCatalog, currentUserTier);
    
    console.log(`[Rooted Vitality Products] User downgraded to ${tierSystem.labels[tier]}`);
};

// ======================================================
// PAGE INITIALIZATION
// ======================================================
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await window.initializeProductsPage();
    } catch (error) {
        console.error('[Rooted Vitality Products] DOMContentLoaded error:', error);
    }
});

console.log('[Rooted Vitality] products.js loaded successfully');
























































