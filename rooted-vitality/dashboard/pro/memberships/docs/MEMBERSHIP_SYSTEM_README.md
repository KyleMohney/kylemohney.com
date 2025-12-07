/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: MEMBERSHIP_SYSTEM_README.md                                 ║
║  Purpose: Documentation for Stripe membership integration          ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝
*/

# Stripe Membership System - Implementation Guide

## Overview
Complete Stripe integration for practitioner memberships ($222/month after free first month).

## Architecture

### Database Layer
**File:** `/sql/08_Membership_Functions.sql`

Functions:
- `create_checkout_session()` - Initiates checkout
- `cancel_subscription()` - Cancels membership
- `update_payment_method_session()` - Opens payment portal
- `handle_stripe_webhook()` - Processes Stripe events

**Memberships Table Columns (added):**
- `stripe_customer_id` (text) - Stripe customer ID
- `stripe_subscription_id` (text) - Active subscription ID
- `current_period_end` (timestamp) - Next billing date

### Frontend Layer

#### JavaScript Files
1. **`/memberships/scripts/stripeConfig.js`**
   - Initializes Stripe.js library
   - Provides global `StripeConfig` object
   - Helper functions for pricing display

2. **`/memberships/scripts/membershipManager.js`**
   - Loads practitioner membership status
   - Renders UI based on state (active/cancelled/no membership)
   - Handles button clicks
   - Manages billing history (collapsible)
   - Auto-initializes on page load

#### Stylesheets
1. **`/styles/settings.css`** (updated)
   - Membership status grid
   - Billing history styles
   - Responsive design

2. **`/memberships/styles/membershipStyles.css`**
   - Loading/error states
   - Stripe button styling
   - Badge variations

### HTML Integration
**File:** `/dashboard/pro/pages/settings.html`

Memberships tab contains:
- Status badge (Active/Cancelled/No Membership/Past Due)
- Membership details grid (Status, Price, Next Billing Date)
- Action buttons (Activate/Cancel/Update Payment Method)
- Collapsible billing history with PDF links
- Secure payment note

## Setup Instructions

### 1. Database Setup
Run `/sql/08_Membership_Functions.sql` in Supabase SQL editor:
```sql
-- Creates 4 functions for membership management
-- Adds support for webhook handling
```

### 2. Environment Configuration
Set these environment variables (your deployment/functions):
```
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx (test) or pk_live_xxxxx (prod)
STRIPE_SECRET_KEY=sk_test_xxxxx (test) or sk_live_xxxxx (prod)
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### 3. Global Initialization
Add to your function initialization (before page load):
```javascript
window.STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY;
```

## User Flows

### New Practitioner → Activate Membership
1. User clicks "Activate Membership" button
2. Calls `StripeConfig.init()` to load Stripe.js
3. Calls backend function `create-checkout-session`
4. Backend creates Stripe checkout session
5. User redirected to Stripe checkout (hosted)
6. After successful payment, webhook fires
7. `handle_stripe_webhook()` updates membership status to 'active'
8. Page reloads showing active membership

### Active Member → Cancel
1. User clicks "Cancel Membership" + confirms
2. Calls backend function `cancel-subscription`
3. Backend calls Stripe API to cancel subscription
4. Updates memberships table: `status = 'cancelled'`
5. Turns off matching (`practitioners.matching_enabled = false`)
6. MembershipManager reloads and renders cancelled state

### Active Member → Update Payment Method
1. User clicks "Update Payment Method"
2. Calls backend function `update-payment-method`
3. Backend creates Stripe billing portal session
4. Opens portal in new window (practitioner can update card)
5. No local update needed (Stripe handles it)

### View Billing History
1. Billing history starts collapsed
2. User clicks "Payment History" toggle
3. MembershipManager calls backend to fetch invoices from Stripe
4. Renders list of payments with dates, amounts, PDF links
5. User clicks "View PDF" → opens Stripe invoice in new tab

## Webhook Events Handled

**Event Types:** `customer.subscription.created`, `customer.subscription.updated`, `invoice.payment_succeeded`, `customer.subscription.deleted`, `invoice.payment_failed`

**Webhook Processing:**
- Authenticates webhook signature (prevents spoofing)
- Calls `handle_stripe_webhook()` function
- Updates membership status accordingly
- Manages practitioner matching status

## Security

### Payment Data
- No card information stored on our servers
- Stripe handles all PCI compliance
- Payment methods managed via Stripe portal
- Invoices accessed via Stripe-generated PDFs

### Webhook Verification
- Verify webhook signature against `STRIPE_WEBHOOK_SECRET`
- Reject unverified webhooks
- Log all webhook events for audit trail

### Row-Level Security (RLS)
Practitioners can only:
- View their own membership
- Modify their own membership status
- Access their own billing history

## Testing Checklist

### With Stripe Test Keys
- [ ] Activate membership (create checkout session)
- [ ] Complete test payment (use 4242 4242 4242 4242)
- [ ] Verify webhook fires and membership status updates
- [ ] View billing history
- [ ] Update payment method
- [ ] Cancel membership
- [ ] Verify matching is disabled on cancellation

### Edge Cases
- [ ] No membership → shows "Activate" button
- [ ] Active membership → shows "Cancel" and "Update Payment" buttons
- [ ] Cancelled membership → shows "Reactivate" button
- [ ] Payment failed → shows "Past Due" badge
- [ ] Billing history → empty state when no invoices
- [ ] Mobile responsive → buttons stack, grid adapts

## File Structure
```
/dashboard/pro/
├── pages/
│   └── settings.html (updated with membership section)
├── styles/
│   └── settings.css (updated with membership styles)
├── memberships/
│   ├── scripts/
│   │   ├── stripeConfig.js (Stripe library initialization)
│   │   └── membershipManager.js (UI & state management)
│   └── styles/
│       └── membershipStyles.css (membership UI styles)

/sql/
└── 08_Membership_Functions.sql (database functions & webhook handler)
```

## Future Enhancements
- [ ] Upgrade/downgrade to different tiers (when multi-tier is needed)
- [ ] Proration for mid-cycle changes
- [ ] Invoice email templates
- [ ] Payment method autofill
- [ ] Usage-based billing (future feature)

## Support & Debugging

### Common Issues

**Stripe not initializing:**
- Check `STRIPE_PUBLISHABLE_KEY` is injected
- Check Stripe.js loads from CDN
- Check browser console for errors

**Webhook not firing:**
- Verify webhook endpoint is configured in Stripe dashboard
- Verify webhook secret is correct
- Check webhook logs in Stripe dashboard
- Verify webhook signature verification logic

**Payment history not loading:**
- Check `stripe_customer_id` is saved in database
- Verify Stripe API key has read access to invoices
- Check network tab for API errors

### Debug Mode
Set in browser console:
```javascript
// Enable verbose logging
localStorage.setItem('DEBUG_STRIPE', 'true');
// Reload page
```

## References
- Stripe Checkout: https://stripe.com/docs/payments/checkout
- Stripe Billing Portal: https://stripe.com/docs/billing/subscriptions/customer-portal
- Stripe Webhooks: https://stripe.com/docs/webhooks
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
