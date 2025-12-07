/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: membershipFunctions.sql                                     ║
║  Purpose: Stripe membership integration - backend functions        ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

TABLE OF CONTENTS
  1. CREATE_CHECKOUT_SESSION
  2. CANCEL_SUBSCRIPTION
  3. UPDATE_PAYMENT_METHOD_SESSION
  4. HANDLE_STRIPE_WEBHOOK
*/

-- ======================================================
-- 1. CREATE_CHECKOUT_SESSION
-- ======================================================
/*
  Purpose: Create a Stripe checkout session for practitioner membership
  Membership: $0 first month, then $222/month recurring
  Returns: checkout_url for redirecting practitioner to Stripe
  
  Usage:
    SELECT * FROM create_checkout_session('practitioner-uuid-here');
*/

CREATE OR REPLACE FUNCTION create_checkout_session(p_practitioner_id UUID)
RETURNS TABLE (
  success BOOLEAN,
  checkout_url TEXT,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_practitioner_serial TEXT;
  v_practitioner_email TEXT;
  v_stripe_customer_id TEXT;
  v_existing_membership_id UUID;
BEGIN
  -- Get practitioner details
  SELECT serial_number, email INTO v_practitioner_serial, v_practitioner_email
  FROM practitioners
  WHERE id = p_practitioner_id;
  
  IF v_practitioner_serial IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, 'Practitioner not found'::TEXT;
    RETURN;
  END IF;
  
  -- Check if practitioner already has active membership
  SELECT id, stripe_customer_id INTO v_existing_membership_id, v_stripe_customer_id
  FROM memberships
  WHERE practitioner_id = p_practitioner_id
    AND status = 'active'
    AND deleted_at IS NULL;
  
  IF v_existing_membership_id IS NOT NULL THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, 'Practitioner already has active membership'::TEXT;
    RETURN;
  END IF;
  
  -- Create or retrieve Stripe customer
  -- NOTE: This will be called via Edge Function that interacts with Stripe API
  -- For now, return success flag indicating checkout should be initiated
  
  -- Return success with checkout URL structure
  -- (The actual Stripe API call happens in the Edge Function)
  RETURN QUERY SELECT 
    TRUE,
    'checkout_session_pending'::TEXT,
    'Checkout session initiated - awaiting Stripe API response'::TEXT;

END $$;


-- ======================================================
-- 2. CANCEL_SUBSCRIPTION
-- ======================================================
/*
  Purpose: Cancel a practitioner's active membership subscription
  Called when practitioner clicks "Cancel Membership"
  Updates memberships table immediately, Stripe cancellation handled via Edge Function
  
  Usage:
    SELECT * FROM cancel_subscription('practitioner-uuid-here');
*/

CREATE OR REPLACE FUNCTION cancel_subscription(p_practitioner_id UUID)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stripe_subscription_id TEXT;
  v_membership_id UUID;
BEGIN
  -- Find active membership
  SELECT id, stripe_subscription_id INTO v_membership_id, v_stripe_subscription_id
  FROM memberships
  WHERE practitioner_id = p_practitioner_id
    AND status = 'active'
    AND deleted_at IS NULL;
  
  IF v_membership_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'No active membership found'::TEXT;
    RETURN;
  END IF;
  
  IF v_stripe_subscription_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Stripe subscription ID not found'::TEXT;
    RETURN;
  END IF;
  
  -- Update membership status to cancelled
  UPDATE memberships
  SET status = 'cancelled',
      canceled_at = NOW(),
      updated_at = NOW()
  WHERE id = v_membership_id;
  
  -- Turn off matching if it was enabled
  UPDATE practitioners
  SET matching_enabled = FALSE
  WHERE id = p_practitioner_id;
  
  RETURN QUERY SELECT TRUE, 'Membership cancelled successfully'::TEXT;

END $$;


-- ======================================================
-- 3. UPDATE_PAYMENT_METHOD_SESSION
-- ======================================================
/*
  Purpose: Create a Stripe billing portal session for updating payment method
  Called when practitioner clicks "Update Payment Method"
  
  Usage:
    SELECT * FROM update_payment_method_session('practitioner-uuid-here');
*/

CREATE OR REPLACE FUNCTION update_payment_method_session(p_practitioner_id UUID)
RETURNS TABLE (
  success BOOLEAN,
  portal_url TEXT,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stripe_customer_id TEXT;
  v_membership_id UUID;
BEGIN
  -- Find active membership
  SELECT id, stripe_customer_id INTO v_membership_id, v_stripe_customer_id
  FROM memberships
  WHERE practitioner_id = p_practitioner_id
    AND status = 'active'
    AND deleted_at IS NULL;
  
  IF v_membership_id IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, 'No active membership found'::TEXT;
    RETURN;
  END IF;
  
  IF v_stripe_customer_id IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, 'Stripe customer ID not found'::TEXT;
    RETURN;
  END IF;
  
  -- Return success - actual portal URL created via Edge Function
  RETURN QUERY SELECT 
    TRUE,
    'portal_session_pending'::TEXT,
    'Portal session initiated - awaiting Stripe API response'::TEXT;

END $$;


-- ======================================================
-- 4. HANDLE_STRIPE_WEBHOOK
-- ======================================================
/*
  Purpose: Process incoming Stripe webhooks for subscription events
  Events handled:
    - customer.subscription.created → status = 'active'
    - customer.subscription.updated → update current_period_end
    - invoice.payment_succeeded → update current_period_end
    - customer.subscription.deleted → status = 'cancelled'
  
  NOTE: This is called via Webhook Edge Function when Stripe sends events
  
  Usage (called by webhook handler):
    SELECT * FROM handle_stripe_webhook(
      p_event_type := 'customer.subscription.created',
      p_stripe_customer_id := 'cus_xxxxx',
      p_stripe_subscription_id := 'sub_xxxxx',
      p_current_period_end := '2025-01-07T00:00:00Z'
    );
*/

CREATE OR REPLACE FUNCTION handle_stripe_webhook(
  p_event_type TEXT,
  p_stripe_customer_id TEXT,
  p_stripe_subscription_id TEXT,
  p_current_period_end TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_practitioner_id UUID;
  v_membership_id UUID;
BEGIN
  -- Find practitioner by stripe_customer_id
  SELECT id INTO v_practitioner_id
  FROM practitioners
  WHERE id = (
    SELECT practitioner_id FROM memberships
    WHERE stripe_customer_id = p_stripe_customer_id
    LIMIT 1
  );
  
  IF v_practitioner_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Practitioner not found for customer: ' || p_stripe_customer_id;
    RETURN;
  END IF;
  
  -- Find or create membership record
  SELECT id INTO v_membership_id
  FROM memberships
  WHERE practitioner_id = v_practitioner_id
    AND deleted_at IS NULL
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Handle different event types
  CASE p_event_type
    WHEN 'customer.subscription.created' THEN
      -- New subscription - first month is free, will charge on next period
      IF v_membership_id IS NULL THEN
        INSERT INTO memberships (
          practitioner_id,
          stripe_customer_id,
          stripe_subscription_id,
          current_period_end,
          status,
          created_at,
          updated_at
        ) VALUES (
          v_practitioner_id,
          p_stripe_customer_id,
          p_stripe_subscription_id,
          p_current_period_end,
          'active',
          NOW(),
          NOW()
        );
      ELSE
        UPDATE memberships
        SET stripe_customer_id = p_stripe_customer_id,
            stripe_subscription_id = p_stripe_subscription_id,
            current_period_end = p_current_period_end,
            status = 'active',
            updated_at = NOW()
        WHERE id = v_membership_id;
      END IF;
      RETURN QUERY SELECT TRUE, 'Subscription created successfully'::TEXT;
    
    WHEN 'customer.subscription.updated' THEN
      -- Subscription updated - update period end
      UPDATE memberships
      SET current_period_end = p_current_period_end,
          updated_at = NOW()
      WHERE id = v_membership_id;
      RETURN QUERY SELECT TRUE, 'Subscription updated successfully'::TEXT;
    
    WHEN 'invoice.payment_succeeded' THEN
      -- Payment succeeded - update period end
      UPDATE memberships
      SET current_period_end = p_current_period_end,
          status = 'active',
          updated_at = NOW()
      WHERE id = v_membership_id;
      RETURN QUERY SELECT TRUE, 'Payment recorded successfully'::TEXT;
    
    WHEN 'customer.subscription.deleted' THEN
      -- Subscription cancelled
      UPDATE memberships
      SET status = 'cancelled',
          canceled_at = NOW(),
          updated_at = NOW()
      WHERE id = v_membership_id;
      
      -- Turn off matching
      UPDATE practitioners
      SET matching_enabled = FALSE
      WHERE id = v_practitioner_id;
      
      RETURN QUERY SELECT TRUE, 'Subscription cancelled successfully'::TEXT;
    
    WHEN 'invoice.payment_failed' THEN
      -- Payment failed - mark as inactive
      UPDATE memberships
      SET status = 'inactive',
          updated_at = NOW()
      WHERE id = v_membership_id;
      RETURN QUERY SELECT TRUE, 'Subscription marked as inactive'::TEXT;
    
    ELSE
      RETURN QUERY SELECT FALSE, 'Unknown event type: ' || p_event_type;
  END CASE;

END $$;
