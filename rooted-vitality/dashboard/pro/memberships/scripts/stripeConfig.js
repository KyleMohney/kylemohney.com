/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: stripeConfig.js                                             ║
║  Purpose: Stripe configuration and initialization                  ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

TABLE OF CONTENTS
  1. STRIPE CONFIGURATION
  2. INITIALIZATION
  3. HELPER FUNCTIONS
*/

// ======================================================
// 1. STRIPE CONFIGURATION
// ======================================================

const StripeConfig = {
  // Stripe publishable key - injected at runtime from environment
  PUBLISHABLE_KEY: window.STRIPE_PUBLISHABLE_KEY || null,
  
  // Stripe instance - initialized on first use
  stripe: null,
  
  // Configuration constants
  MEMBERSHIP_PRICE: 22200, // $222.00 in cents
  MEMBERSHIP_PRICE_DISPLAY: '$222/month',
  FIRST_MONTH_FREE: true,
  
  // ======================================================
  // 2. INITIALIZATION
  // ======================================================
  
  /**
   * Initialize Stripe.js library
   * Must be called before any Stripe operations
   * Returns: Promise<stripe instance>
   */
  async init() {
    if (this.stripe) {
      return this.stripe;
    }
    
    if (!this.PUBLISHABLE_KEY) {
      console.error('StripeConfig: STRIPE_PUBLISHABLE_KEY not set');
      return null;
    }
    
    // Load Stripe.js library if not already loaded
    if (!window.Stripe) {
      await this.loadStripeScript();
    }
    
    this.stripe = window.Stripe(this.PUBLISHABLE_KEY);
    return this.stripe;
  },
  
  /**
   * Load Stripe.js script dynamically
   * Returns: Promise
   */
  loadStripeScript() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Stripe.js'));
      document.head.appendChild(script);
    });
  },
  
  // ======================================================
  // 3. HELPER FUNCTIONS
  // ======================================================
  
  /**
   * Format price for display
   * Input: cents (number)
   * Returns: formatted string ($X.XX)
   */
  formatPrice(cents) {
    return '$' + (cents / 100).toFixed(2);
  },
  
  /**
   * Check if Stripe is initialized
   * Returns: boolean
   */
  isInitialized() {
    return this.stripe !== null;
  },
  
  /**
   * Check if publishable key is set
   * Returns: boolean
   */
  hasPublishableKey() {
    return this.PUBLISHABLE_KEY !== null;
  },
  
  /**
   * Get Stripe instance
   * Returns: stripe instance or null
   */
  getInstance() {
    return this.stripe;
  }
};

// Make available globally
window.StripeConfig = StripeConfig;
