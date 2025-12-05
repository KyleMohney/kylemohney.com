-- ============================================================================
-- ROOTED VITALITY - NOTIFICATION SYSTEM RELIABILITY FIX
-- ============================================================================
-- Creates automatic notification settings and backfill mechanisms
-- Ensures notifications are 100% reliable for all user types
-- ============================================================================

-- ============================================================================
-- SECTION 1: CLIENT NOTIFICATION SETTINGS CREATION FUNCTION
-- ============================================================================

DROP FUNCTION IF EXISTS create_client_notification_settings_signup(uuid);

CREATE OR REPLACE FUNCTION create_client_notification_settings_signup(user_id UUID)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  v_serial TEXT;
  v_exists BOOLEAN;
BEGIN
  -- Get client serial number
  SELECT serial_number INTO v_serial
  FROM clients
  WHERE id = user_id;

  IF v_serial IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Client not found for user ID: ' || user_id::TEXT;
    RETURN;
  END IF;

  -- Check if settings already exist
  SELECT EXISTS(
    SELECT 1 FROM client_notification_settings 
    WHERE client_serial = v_serial
  ) INTO v_exists;

  IF v_exists THEN
    RETURN QUERY SELECT TRUE, 'Notification settings already exist for ' || v_serial;
    RETURN;
  END IF;

  -- Create notification settings with ALL defaults ENABLED
  INSERT INTO client_notification_settings (
    client_serial,
    messages_in_app,
    messages_email,
    messages_sms,
    matches_in_app,
    matches_email,
    matches_sms,
    promotions_in_app,
    promotions_email,
    promotions_sms,
    system_in_app,
    system_email,
    system_sms,
    account_in_app,
    account_email,
    account_sms,
    created_at,
    updated_at
  ) VALUES (
    v_serial,
    TRUE,  -- messages_in_app
    TRUE,  -- messages_email
    TRUE,  -- messages_sms
    TRUE,  -- matches_in_app
    TRUE,  -- matches_email
    TRUE,  -- matches_sms
    TRUE,  -- promotions_in_app
    TRUE,  -- promotions_email
    TRUE,  -- promotions_sms
    TRUE,  -- system_in_app
    TRUE,  -- system_email
    TRUE,  -- system_sms
    TRUE,  -- account_in_app
    TRUE,  -- account_email
    TRUE,  -- account_sms
    NOW(),
    NOW()
  );

  RETURN QUERY SELECT TRUE, 'Notification settings created for client ' || v_serial || ' - ALL NOTIFICATIONS ENABLED';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_client_notification_settings_signup(uuid) TO authenticated, service_role;

-- ============================================================================
-- SECTION 2: PRACTITIONER NOTIFICATION SETTINGS CREATION FUNCTION (UPDATE)
-- ============================================================================
-- Update existing function to ensure ALL defaults are ENABLED

DROP FUNCTION IF EXISTS create_practitioner_notification_settings_signup(uuid);

CREATE OR REPLACE FUNCTION create_practitioner_notification_settings_signup(user_id UUID)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  v_serial TEXT;
  v_exists BOOLEAN;
BEGIN
  -- Get practitioner serial number
  SELECT serial_number INTO v_serial
  FROM practitioners
  WHERE id = user_id;

  IF v_serial IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Practitioner not found for user ID: ' || user_id::TEXT;
    RETURN;
  END IF;

  -- Check if settings already exist
  SELECT EXISTS(
    SELECT 1 FROM practitioner_notification_settings 
    WHERE practitioner_serial = v_serial
  ) INTO v_exists;

  IF v_exists THEN
    RETURN QUERY SELECT TRUE, 'Notification settings already exist for ' || v_serial;
    RETURN;
  END IF;

  -- Create notification settings with ALL defaults ENABLED
  INSERT INTO practitioner_notification_settings (
    practitioner_serial,
    messages_in_app,
    messages_email,
    messages_sms,
    matches_in_app,
    matches_email,
    matches_sms,
    reviews_in_app,
    reviews_email,
    reviews_sms,
    promotions_in_app,
    promotions_email,
    promotions_sms,
    system_in_app,
    system_email,
    system_sms,
    account_in_app,
    account_email,
    account_sms,
    created_at,
    updated_at
  ) VALUES (
    v_serial,
    TRUE,  -- messages_in_app
    TRUE,  -- messages_email
    TRUE,  -- messages_sms
    TRUE,  -- matches_in_app
    TRUE,  -- matches_email
    TRUE,  -- matches_sms
    TRUE,  -- reviews_in_app
    TRUE,  -- reviews_email
    TRUE,  -- reviews_sms
    TRUE,  -- promotions_in_app
    TRUE,  -- promotions_email
    TRUE,  -- promotions_sms
    TRUE,  -- system_in_app
    TRUE,  -- system_email
    TRUE,  -- system_sms
    TRUE,  -- account_in_app
    TRUE,  -- account_email
    TRUE,  -- account_sms
    NOW(),
    NOW()
  );

  RETURN QUERY SELECT TRUE, 'Notification settings created for practitioner ' || v_serial || ' - ALL NOTIFICATIONS ENABLED';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_practitioner_notification_settings_signup(uuid) TO authenticated, service_role;

-- ============================================================================
-- SECTION 3: AUTOMATIC TRIGGER FOR CLIENT NOTIFICATION SETTINGS
-- ============================================================================
-- Automatically creates notification settings when a client is created

DROP TRIGGER IF EXISTS create_client_notifications_on_signup ON clients;
DROP FUNCTION IF EXISTS trigger_create_client_notification_settings();

CREATE OR REPLACE FUNCTION trigger_create_client_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
  -- Only insert notification settings if they don't already exist
  INSERT INTO client_notification_settings (
    client_serial,
    messages_in_app,
    messages_email,
    messages_sms,
    matches_in_app,
    matches_email,
    matches_sms,
    promotions_in_app,
    promotions_email,
    promotions_sms,
    system_in_app,
    system_email,
    system_sms,
    account_in_app,
    account_email,
    account_sms,
    created_at,
    updated_at
  ) VALUES (
    NEW.serial_number,
    TRUE,  -- messages_in_app
    TRUE,  -- messages_email
    TRUE,  -- messages_sms
    TRUE,  -- matches_in_app
    TRUE,  -- matches_email
    TRUE,  -- matches_sms
    TRUE,  -- promotions_in_app
    TRUE,  -- promotions_email
    TRUE,  -- promotions_sms
    TRUE,  -- system_in_app
    TRUE,  -- system_email
    TRUE,  -- system_sms
    TRUE,  -- account_in_app
    TRUE,  -- account_email
    TRUE,  -- account_sms
    NOW(),
    NOW()
  )
  ON CONFLICT (client_serial) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER create_client_notifications_on_signup
AFTER INSERT ON clients
FOR EACH ROW
EXECUTE FUNCTION trigger_create_client_notification_settings();

-- ============================================================================
-- SECTION 4: AUTOMATIC TRIGGER FOR PRACTITIONER NOTIFICATION SETTINGS
-- ============================================================================
-- Automatically creates notification settings when a practitioner is created

DROP TRIGGER IF EXISTS create_practitioner_notifications_on_signup ON practitioners;
DROP FUNCTION IF EXISTS trigger_create_practitioner_notification_settings();

CREATE OR REPLACE FUNCTION trigger_create_practitioner_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
  -- Only insert notification settings if they don't already exist
  INSERT INTO practitioner_notification_settings (
    practitioner_serial,
    messages_in_app,
    messages_email,
    messages_sms,
    matches_in_app,
    matches_email,
    matches_sms,
    reviews_in_app,
    reviews_email,
    reviews_sms,
    promotions_in_app,
    promotions_email,
    promotions_sms,
    system_in_app,
    system_email,
    system_sms,
    account_in_app,
    account_email,
    account_sms,
    created_at,
    updated_at
  ) VALUES (
    NEW.serial_number,
    TRUE,  -- messages_in_app
    TRUE,  -- messages_email
    TRUE,  -- messages_sms
    TRUE,  -- matches_in_app
    TRUE,  -- matches_email
    TRUE,  -- matches_sms
    TRUE,  -- reviews_in_app
    TRUE,  -- reviews_email
    TRUE,  -- reviews_sms
    TRUE,  -- promotions_in_app
    TRUE,  -- promotions_email
    TRUE,  -- promotions_sms
    TRUE,  -- system_in_app
    TRUE,  -- system_email
    TRUE,  -- system_sms
    TRUE,  -- account_in_app
    TRUE,  -- account_email
    TRUE,  -- account_sms
    NOW(),
    NOW()
  )
  ON CONFLICT (practitioner_serial) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER create_practitioner_notifications_on_signup
AFTER INSERT ON practitioners
FOR EACH ROW
EXECUTE FUNCTION trigger_create_practitioner_notification_settings();

-- ============================================================================
-- SECTION 5: BACKFILL NOTIFICATION SETTINGS FOR EXISTING USERS
-- ============================================================================
-- Creates notification settings for all existing clients and practitioners
-- who don't have settings yet (sets ALL to DEFAULT ON)

-- Backfill clients
INSERT INTO client_notification_settings (
  client_serial,
  messages_in_app,
  messages_email,
  messages_sms,
  matches_in_app,
  matches_email,
  matches_sms,
  promotions_in_app,
  promotions_email,
  promotions_sms,
  system_in_app,
  system_email,
  system_sms,
  account_in_app,
  account_email,
  account_sms,
  created_at,
  updated_at
)
SELECT
  c.serial_number,
  TRUE,  -- messages_in_app
  TRUE,  -- messages_email
  TRUE,  -- messages_sms
  TRUE,  -- matches_in_app
  TRUE,  -- matches_email
  TRUE,  -- matches_sms
  TRUE,  -- promotions_in_app
  TRUE,  -- promotions_email
  TRUE,  -- promotions_sms
  TRUE,  -- system_in_app
  TRUE,  -- system_email
  TRUE,  -- system_sms
  TRUE,  -- account_in_app
  TRUE,  -- account_email
  TRUE,  -- account_sms
  NOW(),
  NOW()
FROM clients c
WHERE NOT EXISTS (
  SELECT 1 FROM client_notification_settings cns 
  WHERE cns.client_serial = c.serial_number
)
ON CONFLICT (client_serial) DO NOTHING;

-- Backfill practitioners
INSERT INTO practitioner_notification_settings (
  practitioner_serial,
  messages_in_app,
  messages_email,
  messages_sms,
  matches_in_app,
  matches_email,
  matches_sms,
  reviews_in_app,
  reviews_email,
  reviews_sms,
  promotions_in_app,
  promotions_email,
  promotions_sms,
  system_in_app,
  system_email,
  system_sms,
  account_in_app,
  account_email,
  account_sms,
  created_at,
  updated_at
)
SELECT
  p.serial_number,
  TRUE,  -- messages_in_app
  TRUE,  -- messages_email
  TRUE,  -- messages_sms
  TRUE,  -- matches_in_app
  TRUE,  -- matches_email
  TRUE,  -- matches_sms
  TRUE,  -- reviews_in_app
  TRUE,  -- reviews_email
  TRUE,  -- reviews_sms
  TRUE,  -- promotions_in_app
  TRUE,  -- promotions_email
  TRUE,  -- promotions_sms
  TRUE,  -- system_in_app
  TRUE,  -- system_email
  TRUE,  -- system_sms
  TRUE,  -- account_in_app
  TRUE,  -- account_email
  TRUE,  -- account_sms
  NOW(),
  NOW()
FROM practitioners p
WHERE NOT EXISTS (
  SELECT 1 FROM practitioner_notification_settings pns 
  WHERE pns.practitioner_serial = p.serial_number
)
ON CONFLICT (practitioner_serial) DO NOTHING;

-- ============================================================================
-- SECTION 6: REMOVE UNSAFE ALTER TABLE COMMANDS
-- ============================================================================
-- Skip alter table commands - tables should already have correct nullability

-- ============================================================================
-- END NOTIFICATION SYSTEM RELIABILITY FIX
-- ============================================================================
