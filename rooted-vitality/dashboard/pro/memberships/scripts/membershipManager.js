/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: membershipManager.js                                        ║
║  Purpose: Manage practitioner memberships, Stripe integration      ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

TABLE OF CONTENTS
  1. INITIALIZATION
  2. MEMBERSHIP STATE MANAGEMENT
  3. UI RENDERING
  4. STRIPE OPERATIONS
  5. BILLING HISTORY
  6. EVENT HANDLERS
*/

// ======================================================
// 1. INITIALIZATION
// ======================================================

const MembershipManager = {
  // Current practitioner context
  practitionerId: null,
  practitionerSerial: null,
  
  // Membership data
  membership: null,
  invoices: [],
  
  // UI state
  isLoading: false,
  billingHistoryExpanded: false,
  
  // DOM references
  domElements: {},
  
  /**
   * Initialize manager
   * Must be called on page load
   */
  async init() {
    // Get current user from Supabase auth (not authManager)
    if (!window.supabaseClient) {
      console.error('MembershipManager: supabaseClient not available');
      return false;
    }
    
    const { data: { user }, error: authError } = await window.supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.error('MembershipManager: Could not get authenticated user', authError);
      return false;
    }
    
    this.practitionerId = user.id;
    
    // Get practitioner serial from Supabase
    const practitioner = await this.fetchPractitioner();
    if (!practitioner) {
      console.error('MembershipManager: Practitioner not found');
      return false;
    }
    
    this.practitionerSerial = practitioner.serial_number;
    
    // Cache DOM elements
    this.cacheDOMElements();
    
    // Load membership data
    await this.loadMembership();
    
    // If past_due, set status to inactive
    if (this.membership && this.membership.status === 'past_due') {
      await window.supabaseClient
        .from('memberships')
        .update({ status: 'inactive' })
        .eq('id', this.membership.id);
      
      this.membership.status = 'inactive';
    }
    
    // Initialize Stripe
    await StripeConfig.init();
    
    // Render UI
    this.renderMembershipUI();
    
    // Attach event handlers
    this.attachEventHandlers();
    
    return true;
  },
  
  /**
   * Cache frequently used DOM elements
   */
  cacheDOMElements() {
    this.domElements = {
      statusBadge: document.getElementById('membership-status-badge'),
      statusText: document.getElementById('membership-status-text'),
      nextBillingDate: document.getElementById('membership-next-billing-date'),
      pricePerMonth: document.getElementById('membership-price-per-month'),
      
      activateBtn: document.getElementById('membership-activate-btn'),
      cancelBtn: document.getElementById('membership-cancel-btn'),
      updatePaymentBtn: document.getElementById('membership-update-payment-btn'),
      
      billingHistoryToggle: document.getElementById('membership-billing-history-toggle'),
      billingHistoryContent: document.getElementById('membership-billing-history-content'),
      billingHistoryList: document.getElementById('membership-billing-history-list'),
      billingHistoryEmpty: document.getElementById('membership-billing-history-empty')
    };
  },
  
  // ======================================================
  // 2. MEMBERSHIP STATE MANAGEMENT
  // ======================================================
  
  /**
   * Fetch practitioner details
   * Returns: practitioner object or null
   */
  async fetchPractitioner() {
    try {
      const { data, error } = await window.supabaseClient
        .from('practitioners')
        .select('id, serial_number')
        .eq('id', this.practitionerId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('MembershipManager: Error fetching practitioner', err);
      return null;
    }
  },
  
  /**
   * Load membership data from Supabase
   */
  async loadMembership() {
    try {
      this.isLoading = true;
      
      const { data, error } = await window.supabaseClient
        .from('memberships')
        .select('*')
        .eq('practitioner_id', this.practitionerId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned (expected for new practitioners)
        throw error;
      }
      
      this.membership = data || null;
      
      // If active, fetch billing history
      if (this.membership && this.membership.status === 'active') {
        await this.loadBillingHistory();
      }
      
      this.isLoading = false;
    } catch (err) {
      console.error('MembershipManager: Error loading membership', err);
      this.isLoading = false;
    }
  },
  
  /**
   * Load billing history (invoices) from Stripe via backend
   */
  async loadBillingHistory() {
    try {
      // Skip if manually-set membership (no Stripe customer)
      if (!this.membership.stripe_customer_id) {
        this.invoices = [];
        return;
      }
      
      // Call backend function to fetch invoices from Stripe
      const { data, error } = await window.supabaseClient
        .functions.invoke('get-invoices', {
          body: { 
            stripe_customer_id: this.membership.stripe_customer_id
          }
        });
      
      if (error) throw error;
      
      this.invoices = data.invoices || [];
    } catch (err) {
      console.error('MembershipManager: Error loading billing history', err);
      this.invoices = [];
    }
  },
  
  // ======================================================
  // 3. UI RENDERING
  // ======================================================
  
  /**
   * Render membership UI based on current status
   */
  renderMembershipUI() {
    if (!this.membership || this.membership.status === 'cancelled') {
      this.renderNoMembership();
    } else if (this.membership.status === 'active') {
      this.renderActiveMembership();
    } else if (this.membership.status === 'past_due') {
      this.renderPastDueMembership();
    }
    
    this.renderBillingHistory();
  },
  
  /**
   * Render "no membership" state
   */
  renderNoMembership() {
    if (this.domElements.statusBadge) {
      this.domElements.statusBadge.textContent = 'No Active Membership';
      this.domElements.statusBadge.className = 'membership-badge membership-badge--inactive';
    }
    
    if (this.domElements.nextBillingDate) {
      this.domElements.nextBillingDate.textContent = '—';
    }
    
    if (this.domElements.pricePerMonth) {
      this.domElements.pricePerMonth.textContent = StripeConfig.MEMBERSHIP_PRICE_DISPLAY;
    }
    
    // Show activate button
    if (this.domElements.activateBtn) this.domElements.activateBtn.style.display = 'block';
    if (this.domElements.cancelBtn) this.domElements.cancelBtn.style.display = 'none';
    if (this.domElements.updatePaymentBtn) this.domElements.updatePaymentBtn.style.display = 'none';
  },
  
  /**
   * Render "active membership" state
   */
  renderActiveMembership() {
    if (this.domElements.statusBadge) {
      this.domElements.statusBadge.textContent = 'Active';
      this.domElements.statusBadge.className = 'membership-badge membership-badge--active';
    }
    
    // Handle manually-set membership (no stripe_subscription_id)
    if (!this.membership.stripe_subscription_id) {
      if (this.domElements.nextBillingDate) {
        this.domElements.nextBillingDate.textContent = 'Manual (No Auto-Renew)';
      }
    } else {
      const nextBillingDate = new Date(this.membership.current_period_end);
      if (this.domElements.nextBillingDate) {
        this.domElements.nextBillingDate.textContent = nextBillingDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    }
    
    if (this.domElements.pricePerMonth) {
      this.domElements.pricePerMonth.textContent = StripeConfig.MEMBERSHIP_PRICE_DISPLAY;
    }
    
    // Show action buttons - but only show payment actions if Stripe-linked
    if (this.domElements.activateBtn) this.domElements.activateBtn.style.display = 'none';
    if (this.domElements.cancelBtn) this.domElements.cancelBtn.style.display = 'block';
    if (this.domElements.updatePaymentBtn) {
      // Only show if Stripe customer exists
      this.domElements.updatePaymentBtn.style.display = this.membership.stripe_customer_id ? 'block' : 'none';
    }
  },
  
  /**
   * Render "past due" state
   */
  renderPastDueMembership() {
    if (this.domElements.statusBadge) {
      this.domElements.statusBadge.textContent = 'Past Due - Payment Failed';
      this.domElements.statusBadge.className = 'membership-badge membership-badge--past-due';
    }
    
    // Show update payment button
    if (this.domElements.activateBtn) this.domElements.activateBtn.style.display = 'none';
    if (this.domElements.cancelBtn) this.domElements.cancelBtn.style.display = 'none';
    if (this.domElements.updatePaymentBtn) this.domElements.updatePaymentBtn.style.display = 'block';
  },
  
  /**
   * Render billing history
   */
  renderBillingHistory() {
    if (this.invoices.length === 0) {
      if (this.domElements.billingHistoryEmpty) {
        this.domElements.billingHistoryEmpty.style.display = 'block';
      }
      if (this.domElements.billingHistoryList) {
        this.domElements.billingHistoryList.innerHTML = '';
      }
      return;
    }
    
    if (this.domElements.billingHistoryEmpty) {
      this.domElements.billingHistoryEmpty.style.display = 'none';
    }
    
    const invoiceHTML = this.invoices.map(invoice => `
      <div class="billing-history-item">
        <div class="billing-history-date">${new Date(invoice.created * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
        <div class="billing-history-amount">${StripeConfig.formatPrice(invoice.total)}</div>
        <a href="${invoice.invoice_pdf}" target="_blank" rel="noopener noreferrer" class="billing-history-link">View PDF</a>
      </div>
    `).join('');
    
    if (this.domElements.billingHistoryList) {
      this.domElements.billingHistoryList.innerHTML = invoiceHTML;
    }
  },
  
  // ======================================================
  // 4. STRIPE OPERATIONS
  // ======================================================
  
  /**
   * Initiate Stripe checkout for new membership
   */
  async activateMembership() {
    try {
      this.isLoading = true;
      
      // Call backend function to create checkout session
      const { data, error } = await window.supabaseClient
        .functions.invoke('create-checkout-session', {
          body: { 
            practitioner_id: this.practitionerId
          }
        });
      
      if (error) throw error;
      
      // Redirect to Stripe checkout
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      console.error('MembershipManager: Error activating membership', err);
      alert('Failed to start checkout. Please try again.');
      this.isLoading = false;
    }
  },
  
  /**
   * Cancel membership
   */
  async cancelMembership() {
    const confirmed = confirm('Are you sure you want to cancel your membership? You will no longer receive new matches.');
    if (!confirmed) return;
    
    try {
      this.isLoading = true;
      
      // Call backend function to cancel subscription
      const { data, error } = await window.supabaseClient
        .functions.invoke('cancel-subscription', {
          body: { 
            practitioner_id: this.practitionerId
          }
        });
      
      if (error) throw error;
      
      alert('Membership cancelled successfully.');
      
      // Reload membership data
      await this.loadMembership();
      this.renderMembershipUI();
      
      this.isLoading = false;
    } catch (err) {
      console.error('MembershipManager: Error cancelling membership', err);
      alert('Failed to cancel membership. Please try again.');
      this.isLoading = false;
    }
  },
  
  /**
   * Update payment method
   */
  async updatePaymentMethod() {
    try {
      this.isLoading = true;
      
      // Call backend function to create portal session
      const { data, error } = await window.supabaseClient
        .functions.invoke('update-payment-method', {
          body: { 
            practitioner_id: this.practitionerId
          }
        });
      
      if (error) throw error;
      
      // Open portal in new window
      if (data.portal_url) {
        window.open(data.portal_url, '_blank', 'width=800,height=600');
      } else {
        throw new Error('No portal URL returned');
      }
      
      this.isLoading = false;
    } catch (err) {
      console.error('MembershipManager: Error updating payment method', err);
      alert('Failed to open payment method update. Please try again.');
      this.isLoading = false;
    }
  },
  
  // ======================================================
  // 5. BILLING HISTORY
  // ======================================================
  
  /**
   * Toggle billing history expansion
   */
  toggleBillingHistory() {
    this.billingHistoryExpanded = !this.billingHistoryExpanded;
    
    if (this.domElements.billingHistoryContent) {
      this.domElements.billingHistoryContent.style.display = this.billingHistoryExpanded ? 'block' : 'none';
    }
    
    if (this.domElements.billingHistoryToggle) {
      this.domElements.billingHistoryToggle.classList.toggle('expanded', this.billingHistoryExpanded);
    }
  },
  
  // ======================================================
  // 6. EVENT HANDLERS
  // ======================================================
  
  /**
   * Attach event listeners to buttons
   */
  attachEventHandlers() {
    if (this.domElements.activateBtn) {
      this.domElements.activateBtn.addEventListener('click', () => this.activateMembership());
    }
    
    if (this.domElements.cancelBtn) {
      this.domElements.cancelBtn.addEventListener('click', () => this.cancelMembership());
    }
    
    if (this.domElements.updatePaymentBtn) {
      this.domElements.updatePaymentBtn.addEventListener('click', () => this.updatePaymentMethod());
    }
    
    if (this.domElements.billingHistoryToggle) {
      this.domElements.billingHistoryToggle.addEventListener('click', () => this.toggleBillingHistory());
    }
  }
};

// Make available globally
window.MembershipManager = MembershipManager;

// Initialize when supabaseClient is ready
async function initMembershipManager() {
  // Check if supabaseClient is ready
  if (!window.supabaseClient) {
    setTimeout(initMembershipManager, 300);
    return;
  }
  
  // Everything is ready - go ahead
  await MembershipManager.init();
}

// Try to init immediately if page is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(initMembershipManager, 300);
} else {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initMembershipManager, 300);
  });
}
