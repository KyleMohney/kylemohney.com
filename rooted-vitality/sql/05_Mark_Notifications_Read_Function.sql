/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: 05_Mark_Notifications_Read_Function.sql                    ║
║  Purpose: Create functions to mark notifications as read           ║
║           Bypasses RLS policies with SECURITY DEFINER              ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝
*/

-- ============================================================================
-- MARK PRACTITIONER NOTIFICATION AS READ (SECURITY DEFINER - BYPASSES RLS)
-- ============================================================================

/**
 * Mark a practitioner notification as read
 * SECURITY DEFINER bypasses RLS policies
 * Used when practitioner marks notification as read from UI
 * Returns the updated notification record
 */
DROP FUNCTION IF EXISTS mark_practitioner_notification_read(uuid) CASCADE;

CREATE OR REPLACE FUNCTION mark_practitioner_notification_read(
  p_notification_id uuid
)
RETURNS TABLE (
  result_id uuid,
  result_practitioner_serial text,
  result_is_read boolean,
  result_updated_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  UPDATE practitioner_notifications
  SET is_read = true, updated_at = NOW()
  WHERE practitioner_notifications.id = p_notification_id
  RETURNING 
    practitioner_notifications.id,
    practitioner_notifications.practitioner_serial,
    practitioner_notifications.is_read,
    practitioner_notifications.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION mark_practitioner_notification_read(uuid) TO authenticated;

-- ============================================================================
-- MARK ALL PRACTITIONER NOTIFICATIONS AS READ (SECURITY DEFINER - BYPASSES RLS)
-- ============================================================================

/**
 * Mark all unread practitioner notifications as read
 * SECURITY DEFINER bypasses RLS policies
 * Used when practitioner opens notification dropdown
 * Returns count of updated notifications
 */
DROP FUNCTION IF EXISTS mark_all_practitioner_notifications_read(text) CASCADE;

CREATE OR REPLACE FUNCTION mark_all_practitioner_notifications_read(
  p_practitioner_serial text
)
RETURNS TABLE (
  updated_count integer
) AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE practitioner_notifications
  SET is_read = true, updated_at = NOW()
  WHERE practitioner_serial = p_practitioner_serial
    AND is_read = false;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION mark_all_practitioner_notifications_read(text) TO authenticated;

-- ============================================================================
-- MARK CLIENT NOTIFICATION AS READ (SECURITY DEFINER - BYPASSES RLS)
-- ============================================================================

/**
 * Mark a client notification as read
 * SECURITY DEFINER bypasses RLS policies
 * Used when client marks notification as read from UI
 * Returns the updated notification record
 */
DROP FUNCTION IF EXISTS mark_client_notification_read(uuid) CASCADE;

CREATE OR REPLACE FUNCTION mark_client_notification_read(
  p_notification_id uuid
)
RETURNS TABLE (
  result_id uuid,
  result_client_serial text,
  result_is_read boolean,
  result_updated_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  UPDATE client_notifications
  SET is_read = true, updated_at = NOW()
  WHERE client_notifications.id = p_notification_id
  RETURNING 
    client_notifications.id,
    client_notifications.client_serial,
    client_notifications.is_read,
    client_notifications.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION mark_client_notification_read(uuid) TO authenticated;

-- ============================================================================
-- MARK ALL CLIENT NOTIFICATIONS AS READ (SECURITY DEFINER - BYPASSES RLS)
-- ============================================================================

/**
 * Mark all unread client notifications as read
 * SECURITY DEFINER bypasses RLS policies
 * Used when client opens notification dropdown
 * Returns count of updated notifications
 */
DROP FUNCTION IF EXISTS mark_all_client_notifications_read(text) CASCADE;

CREATE OR REPLACE FUNCTION mark_all_client_notifications_read(
  p_client_serial text
)
RETURNS TABLE (
  updated_count integer
) AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE client_notifications
  SET is_read = true, updated_at = NOW()
  WHERE client_serial = p_client_serial
    AND is_read = false;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION mark_all_client_notifications_read(text) TO authenticated;
