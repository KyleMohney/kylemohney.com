-- ============================================================================
-- FIX: AUTO-MATCHING BUG - Disable Automatic Match Creation
-- ============================================================================
-- This fix addresses the bug where matches are automatically created when clients
-- create projects from My Wellness, instead of only being created when the client
-- explicitly clicks "connect".
--
-- Root Cause: Unknown source creating matches via create_practitioner_match RPC
-- 2-6 seconds after project INSERT
--
-- Solution: Add audit columns and remove auto-created matches
-- ============================================================================

-- ============================================================================
-- STEP 1: Add audit columns to track match creation source
-- ============================================================================
-- This allows us to distinguish between auto-created and manual matches

ALTER TABLE project_practitioner_matches
ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS creation_source TEXT DEFAULT 'unknown', 
ADD COLUMN IF NOT EXISTS is_auto_created BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- STEP 2: Identify and mark existing auto-created matches
-- ============================================================================
-- Matches created within 3-8 seconds of project creation are likely auto-created

UPDATE project_practitioner_matches ppm
SET 
  is_auto_created = TRUE,
  creation_source = 'auto_unknown_source',
  created_by = 'system'
WHERE 
  ppm.status = 'pending'
  AND (SELECT COUNT(*) FROM project_practitioner_matches ppm2 
       WHERE ppm2.project_serial = ppm.project_serial) = 1
  AND EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.project_serial = ppm.project_serial
    AND EXTRACT(EPOCH FROM (ppm.created_at - p.created_at)) BETWEEN 2 AND 8
  );

-- ============================================================================
-- STEP 3: Delete auto-created matches to restore clean state
-- ============================================================================
-- This removes the auto-matches and returns system to correct state
-- where matches only exist when client/practitioner explicitly connects

DELETE FROM project_practitioner_matches
WHERE is_auto_created = TRUE;

-- ============================================================================
-- STEP 4: Update create_practitioner_match RPC to track source
-- ============================================================================
-- Add parameter to track where match is created from

CREATE OR REPLACE FUNCTION create_practitioner_match(
  p_project_serial INTEGER,
  p_client_serial TEXT,
  p_practitioner_serial TEXT,
  p_match_score INTEGER DEFAULT 75,
  p_creation_source TEXT DEFAULT 'manual_unknown'
)
RETURNS TABLE (match_id uuid, status text) AS $$
DECLARE
  v_match_id uuid;
  v_status text;
BEGIN
  INSERT INTO project_practitioner_matches (
    project_serial,
    client_serial,
    practitioner_serial,
    status,
    match_score,
    created_by,
    creation_source,
    is_auto_created
  )
  VALUES (
    p_project_serial,
    p_client_serial,
    p_practitioner_serial,
    'pending',
    p_match_score,
    'client_or_practitioner',  -- Track as manual user action
    p_creation_source,         -- Will show where called from (find-practitioners, opportunities, etc)
    FALSE
  )
  RETURNING id, status INTO v_match_id, v_status;

  -- Create a notification for the new match
  PERFORM create_practitioner_new_match_notification(
    p_practitioner_serial,
    (SELECT first_name || ' ' || last_name FROM clients WHERE serial_number = p_client_serial),
    (SELECT custom_name OR category_name FROM projects WHERE project_serial = p_project_serial LIMIT 1),
    p_match_score
  );

  RETURN QUERY SELECT v_match_id, v_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 5: Update JavaScript calls to include creation source
-- ============================================================================
-- Update these calls to track origin:
--
-- find-practitioners.js (line 745):
--   .rpc('create_practitioner_match', {
--     p_project_serial: parseInt(selectedProject.project_serial),
--     p_client_serial: selectedProject.client_serial,
--     p_practitioner_serial: practitionerSerial,
--     p_match_score: matchScore,
--     p_creation_source: 'client_find_practitioners'  // ADD THIS
--   })
--
-- proOpportunitiesManager.js (line 490):
--   .rpc('create_practitioner_match', {
--     p_project_serial: project.project_serial,
--     p_client_serial: project.client_serial,
--     p_practitioner_serial: currentPractitioner.serial_number,
--     p_match_score: 75,
--     p_creation_source: 'practitioner_opportunities'  // ADD THIS
--   })
--
-- onboardingService.js (line 584):
--   .rpc('create_practitioner_match', {
--     p_project_serial: onboardingData.projectSerial,
--     p_client_serial: onboardingData.clientSerial,
--     p_practitioner_serial: practitionerSerial,
--     p_match_score: matchScore,
--     p_creation_source: 'onboarding_signup'  // ADD THIS
--   })
--
-- practitioner-public-profile.js (line 746):
--   .rpc('create_practitioner_match', {
--     p_project_serial: matchData[0].project_serial,
--     p_client_serial: matchData[0].client_serial,
--     p_practitioner_serial: currentPractitioner.serial_number,
--     p_match_score: matchScore,
--     p_creation_source: 'practitioner_public_profile'  // ADD THIS
--   })

-- ============================================================================
-- STEP 6: Verify the fix
-- ============================================================================
-- After running this fix, run this query to confirm no auto-matches exist:

SELECT COUNT(*) as auto_match_count
FROM project_practitioner_matches
WHERE is_auto_created = TRUE;

-- Should return: 0

-- ============================================================================
-- ONGOING MONITORING
-- ============================================================================
-- Run this daily to detect if auto-matching resumes:

SELECT 
  DATE(created_at) as date,
  COUNT(*) as match_count,
  COUNT(CASE WHEN is_auto_created = TRUE THEN 1 END) as auto_created_count,
  creation_source,
  COUNT(CASE WHEN EXTRACT(EPOCH FROM (created_at - (SELECT created_at FROM projects p WHERE p.project_serial = project_serial))) BETWEEN 2 AND 8 THEN 1 END) as suspicious_timing_count
FROM project_practitioner_matches| pg_get_functiondef                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CREATE OR REPLACE FUNCTION public.trigger_create_client_notification_settings()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
 |
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at), creation_source
ORDER BY DATE(created_at) DESC;

-- ============================================================================
-- IF ISSUE PERSISTS
-- ============================================================================
-- If auto-matches continue to appear, check:
--
-- 1. Supabase Dashboard > Edge Functions > Logs
--    Look for any function triggered on projects INSERT that calls create_practitioner_match
--
-- 2. Supabase Dashboard > Webhooks
--    Check if there's a webhook triggered on projects table
--
-- 3. Check if there's a scheduled function or job:
--    SELECT * FROM pg_stat_user_functions WHERE funcname ILIKE '%match%' ORDER BY calls DESC;
--
-- 4. Monitor application logs for RPC calls from unexpected sources
--
-- 5. Add logging to create_practitioner_match to see call stack:
--    RAISE LOG 'create_practitioner_match called from %', pg_catalog.current_query();
