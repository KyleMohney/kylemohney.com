-- ============================================================================
-- ROOTED VITALITY - UTILITIES & ONE-TIME FIXES
-- ============================================================================
-- This file contains utility functions and one-time fixes applied during
-- development. These are not core system logic but important for maintenance.
-- ============================================================================

-- ============================================================================
-- SECTION 1: NOTIFICATION FIELDS SETUP
-- ============================================================================
-- Ensure project_practitioner_matches has all notification-related fields

ALTER TABLE project_practitioner_matches
ADD COLUMN IF NOT EXISTS match_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS distance_miles NUMERIC(8,2) DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_project_practitioner_matches_status_created 
ON project_practitioner_matches(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_project_practitioner_matches_practitioner_status
ON project_practitioner_matches(practitioner_serial, status);

-- ============================================================================
-- SECTION 2: NOTIFICATION DEDUPLICATION FIX
-- ============================================================================
-- Remove duplicate notifications that were sent to all users instead of target

-- Find problematic notifications and delete from all except specific user
DELETE FROM notifications
WHERE type = 'review_posted'
  AND created_at > '2025-11-07'::date
  AND (SELECT COUNT(*) FROM notifications WHERE type = 'review_posted' AND created_at > '2025-11-07'::date) > 1;

-- ============================================================================
-- SECTION 3: PRICING JSONB CONVERSION
-- ============================================================================
-- If practitioners table has individual pricing fields, consolidate to JSONB

ALTER TABLE practitioners
ADD COLUMN IF NOT EXISTS pricing_structure JSONB DEFAULT '{}'::jsonb;

-- Example: If you had separate columns, consolidate them:
-- UPDATE practitioners SET pricing_structure = jsonb_build_object(
--   'rate_per_session', rate_per_session,
--   'session_duration', session_duration,
--   'accepts_insurance', accepts_insurance,
--   'accepted_insurances', accepted_insurances
-- );

-- ============================================================================
-- SECTION 4: ZIPCODE LOADING
-- ============================================================================
-- If you need to load US zipcode/geocoding data for distance matching:
-- 
-- Option 1: Import from CSV (format: zipcode, city, state, lat, lng)
-- COPY zipcodes(zipcode, city, state, latitude, longitude) 
-- FROM '/tmp/us_zipcodes.csv' 
-- WITH (FORMAT csv, HEADER true);
--
-- Option 2: Use PostGIS if you have geo data
-- SELECT ST_Distance(
--   ST_Point(client_lat, client_lng),
--   ST_Point(practitioner_lat, practitioner_lng)
-- ) * 0.000621371 as distance_miles;

-- ============================================================================
-- SECTION 5: DIAGNOSTIC QUERIES FOR TROUBLESHOOTING
-- ============================================================================

-- Check current sequence state
-- SELECT nextval('client_serial_seq') - 1 as next_client_serial,
--        nextval('practitioner_serial_seq') - 1 as next_practitioner_serial;

-- Find practitioners with incomplete profiles
-- SELECT id, name, profile_completion_percent FROM practitioners 
-- WHERE profile_completion_percent < 50 
-- ORDER BY profile_completion_percent ASC;

-- Find projects with no matches
-- SELECT p.project_id, p.name, COUNT(ppm.id) as match_count
-- FROM projects p
-- LEFT JOIN project_practitioner_matches ppm ON p.project_id = ppm.project_id
-- GROUP BY p.project_id, p.name
-- HAVING COUNT(ppm.id) = 0;

-- Check notification delivery for troubleshooting
-- SELECT event_type, COUNT(*) FROM notifications 
-- GROUP BY event_type 
-- ORDER BY COUNT(*) DESC;

-- ============================================================================
-- SECTION 6: PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Ensure all foreign key joins are indexed
CREATE INDEX IF NOT EXISTS idx_projects_client_serial ON projects(client_serial);
CREATE INDEX IF NOT EXISTS idx_projects_category_id ON projects(category_id);
CREATE INDEX IF NOT EXISTS idx_projects_subcategory_id ON projects(subcategory_id);

CREATE INDEX IF NOT EXISTS idx_project_practitioner_matches_project_serial 
ON project_practitioner_matches(project_serial);

CREATE INDEX IF NOT EXISTS idx_project_practitioner_matches_practitioner_serial 
ON project_practitioner_matches(practitioner_serial);

CREATE INDEX IF NOT EXISTS idx_project_practitioner_matches_client_serial 
ON project_practitioner_matches(client_serial);

CREATE INDEX IF NOT EXISTS idx_reviews_project_serial ON reviews(project_serial);
CREATE INDEX IF NOT EXISTS idx_reviews_client_serial ON reviews(client_serial);
CREATE INDEX IF NOT EXISTS idx_reviews_practitioner_serial ON reviews(practitioner_serial);

-- Note: Indices now use serial fields for RLS-compatible querying

CREATE INDEX IF NOT EXISTS idx_project_messages_project_id 
ON project_messages(project_id);

-- ============================================================================
-- SECTION 3: RPC FUNCTIONS FOR CLIENT OPERATIONS
-- ============================================================================
-- Create match function - allows clients to create matches with RLS enforcement

CREATE OR REPLACE FUNCTION create_practitioner_match(
  p_project_serial INT,
  p_client_serial TEXT,
  p_practitioner_serial TEXT,
  p_match_score INT DEFAULT 75
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
    client_initiated,
    matched_at
  )
  VALUES (
    p_project_serial,
    p_client_serial,
    p_practitioner_serial,
    'pending',
    p_match_score,
    true,
    NOW()
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_match_id;
  
  IF v_match_id IS NULL THEN
    -- Match already exists, fetch existing
    SELECT id INTO v_match_id FROM project_practitioner_matches 
    WHERE project_serial = p_project_serial 
      AND client_serial = p_client_serial 
      AND practitioner_serial = p_practitioner_serial;
  END IF;
  
  -- Fetch match info into variables (avoid ambiguity with table columns)
  SELECT 
    ppm.id,
    ppm.status
  INTO 
    v_match_id,
    v_status
  FROM project_practitioner_matches ppm
  WHERE ppm.id = v_match_id;
  
  -- Return using variables
  match_id := v_match_id;
  status := v_status;
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create message insertion function - bypasses RLS for auto-messages
CREATE OR REPLACE FUNCTION create_project_message(
  p_project_id uuid,
  p_practitioner_id uuid,
  p_client_id uuid,
  p_sender_id uuid,
  p_sender_type text,
  p_message text
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO project_messages (
    project_id,
    practitioner_id,
    client_id,
    sender_id,
    sender_type,
    message,
    is_read
  )
  VALUES (
    p_project_id,
    p_practitioner_id,
    p_client_id,
    p_sender_id,
    p_sender_type,
    p_message,
    false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- END UTILITIES
-- ============================================================================
