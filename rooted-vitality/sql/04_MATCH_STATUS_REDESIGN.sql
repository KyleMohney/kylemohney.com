-- ============================================================================
-- ROOTED VITALITY - MATCH STATUS REDESIGN
-- ============================================================================
-- Purpose: Separate match project status from practitioner acceptance status
-- 
-- MATCH_STATUS (project engagement):
--   - pending: Client sent request, awaiting practitioner response
--   - active: Practitioner accepted, project ongoing
--   - in-progress: Project actively happening
--   - hired: Practitioner hired (project/engagement confirmed)
--   - completed: Project finished
--   - closed: Project closed/cancelled
-- 
-- PRACTITIONER_RESPONSE (practitioner action):
--   - null: No response yet
--   - accepted: Practitioner accepted the match
--   - declined: Practitioner declined
--   - declined_with_message: Practitioner declined with reason
--
-- These are independent to allow tracking:
--   - Pending client request → practitioner declines → match_status=pending, response=declined
--   - Active engagement where practitioner later declines → match_status=active, response=declined
--   - etc.
-- ============================================================================

-- ============================================================================
-- STEP 1: ADD NEW COLUMNS
-- ============================================================================

ALTER TABLE project_practitioner_matches
ADD COLUMN IF NOT EXISTS practitioner_response TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS practitioner_response_reason TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS practitioner_responded_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS match_status TEXT DEFAULT 'pending';

-- Add constraint to ensure valid status values
ALTER TABLE project_practitioner_matches
DROP CONSTRAINT IF EXISTS valid_match_status;

ALTER TABLE project_practitioner_matches
ADD CONSTRAINT valid_match_status 
CHECK (match_status IN ('pending', 'active', 'in-progress', 'hired', 'completed', 'closed'));

-- Add constraint for practitioner response
ALTER TABLE project_practitioner_matches
DROP CONSTRAINT IF EXISTS valid_practitioner_response;

ALTER TABLE project_practitioner_matches
ADD CONSTRAINT valid_practitioner_response 
CHECK (practitioner_response IS NULL OR practitioner_response IN ('accepted', 'declined', 'declined_with_message'));

-- ============================================================================
-- STEP 2: VERIFY COLUMN DATA TYPES
-- ============================================================================
-- Columns that MUST stay TEXT for human tracking (not UUID):
--   - project_serial (TEXT - stores INTEGER as string for human tracking)
--   - practitioner_serial (TEXT - human-readable identifier, NOT UUID)
--   - client_serial (TEXT - human-readable identifier, NOT UUID)
--
-- These are indexed and used heavily in queries. DO NOT change to UUID.

-- Verify they're TEXT
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'project_practitioner_matches'
  AND column_name IN ('project_serial', 'practitioner_serial', 'client_serial')
ORDER BY ordinal_position;

-- ============================================================================
-- STEP 3: CREATE INDEXES FOR COMMON QUERIES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_ppm_match_status 
ON project_practitioner_matches(match_status);

CREATE INDEX IF NOT EXISTS idx_ppm_practitioner_response 
ON project_practitioner_matches(practitioner_response);

CREATE INDEX IF NOT EXISTS idx_ppm_client_match_status 
ON project_practitioner_matches(client_serial, match_status);

CREATE INDEX IF NOT EXISTS idx_ppm_practitioner_response_status 
ON project_practitioner_matches(practitioner_serial, practitioner_response);

CREATE INDEX IF NOT EXISTS idx_ppm_project_serial_match_status 
ON project_practitioner_matches(project_serial, match_status);

-- ============================================================================
-- STEP 4: BACKFILL EXISTING DATA
-- ============================================================================
-- Strategy:
--   - If status = 'pending' → match_status='pending', response=NULL
--   - If status = 'active' → match_status='active', response='accepted'
--   - If status = 'in-progress' → match_status='in-progress', response='accepted'
--   - If status = 'hired' → match_status='hired', response='accepted'
--   - If status = 'not-hired' → match_status='closed', response='declined'
--   - If status = 'declined' → match_status='pending', response='declined'

UPDATE project_practitioner_matches
SET 
  match_status = CASE 
    WHEN status = 'pending' THEN 'pending'
    WHEN status = 'active' THEN 'active'
    WHEN status = 'in-progress' THEN 'in-progress'
    WHEN status = 'hired' THEN 'hired'
    WHEN status = 'not-hired' THEN 'closed'
    WHEN status = 'declined' THEN 'pending'
    ELSE 'pending'
  END,
  practitioner_response = CASE
    WHEN status = 'pending' THEN NULL
    WHEN status = 'active' THEN 'accepted'
    WHEN status = 'in-progress' THEN 'accepted'
    WHEN status = 'hired' THEN 'accepted'
    WHEN status = 'not-hired' THEN 'declined'
    WHEN status = 'declined' THEN 'declined'
    ELSE NULL
  END,
  practitioner_responded_at = CASE
    WHEN status IN ('active', 'in-progress', 'hired', 'not-hired', 'declined') THEN updated_at
    ELSE NULL
  END
WHERE match_status IS NULL OR match_status = 'pending'; -- Only update if not already migrated

-- ============================================================================
-- STEP 5: UPDATE RPC FUNCTION
-- ============================================================================
-- The RPC now returns both columns for confirmation

DROP FUNCTION IF EXISTS create_practitioner_match(INT, TEXT, TEXT, INT);

CREATE OR REPLACE FUNCTION create_practitioner_match(
  p_project_serial INT,
  p_client_serial TEXT,
  p_practitioner_serial TEXT,
  p_match_score INT DEFAULT 75
)
RETURNS TABLE (
  match_id UUID,
  match_status TEXT,
  practitioner_response TEXT
) AS $$
DECLARE
  v_match_id UUID;
  v_match_status TEXT;
  v_response TEXT;
BEGIN
  -- Try to insert new match
  INSERT INTO project_practitioner_matches (
    project_serial,
    client_serial,
    practitioner_serial,
    status,
    match_status,
    match_score,
    practitioner_response,
    practitioner_responded_at
  )
  VALUES (
    p_project_serial,
    p_client_serial,
    p_practitioner_serial,
    'pending',        -- Keep for backward compatibility
    'pending',        -- NEW: explicit match_status
    p_match_score,
    NULL,             -- NEW: no response yet
    NULL              -- NEW: not responded yet
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_match_id;
  
  -- If duplicate, fetch existing
  IF v_match_id IS NULL THEN
    SELECT id INTO v_match_id FROM project_practitioner_matches 
    WHERE project_serial = p_project_serial 
      AND client_serial = p_client_serial 
      AND practitioner_serial = p_practitioner_serial;
  END IF;
  
  -- Return match info
  SELECT 
    v_match_id,
    match_status,
    practitioner_response
  INTO 
    match_id,
    v_match_status,
    v_response
  FROM project_practitioner_matches 
  WHERE id = v_match_id;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 6: UPDATE RPC FOR PRACTITIONER RESPONSES
-- ============================================================================

CREATE OR REPLACE FUNCTION update_practitioner_response(
  p_match_id UUID,
  p_response TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS TABLE (
  match_id UUID,
  match_status TEXT,
  practitioner_response TEXT
) AS $$
BEGIN
  -- Validate response value
  IF p_response NOT IN ('accepted', 'declined', 'declined_with_message') THEN
    RAISE EXCEPTION 'Invalid response value: %', p_response;
  END IF;
  
  -- If declined_with_message but no reason, use 'declined'
  IF p_response = 'declined_with_message' AND p_reason IS NULL THEN
    p_response := 'declined';
  END IF;
  
  -- Update match
  UPDATE project_practitioner_matches
  SET
    practitioner_response = p_response,
    practitioner_response_reason = p_reason,
    practitioner_responded_at = NOW(),
    match_status = CASE
      WHEN p_response = 'accepted' AND match_status = 'pending' THEN 'active'
      WHEN p_response = 'declined' THEN 'pending'  -- Keep pending so can try new practitioner
      ELSE match_status
    END,
    updated_at = NOW()
  WHERE id = p_match_id;
  
  -- Return updated match info
  SELECT 
    p_match_id,
    match_status,
    practitioner_response
  INTO 
    match_id,
    match_status,
    practitioner_response
  FROM project_practitioner_matches 
  WHERE id = p_match_id;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 7: UPDATE RLS POLICIES
-- ============================================================================
-- No changes needed - existing policies use serial numbers which are preserved

-- ============================================================================
-- STEP 8: VERIFY DATA INTEGRITY
-- ============================================================================

-- Check for any matches still without match_status
SELECT COUNT(*) as unset_match_status
FROM project_practitioner_matches
WHERE match_status IS NULL OR match_status = '';

-- Show distribution of statuses before deprecating 'status' column
SELECT 
  'MATCH_STATUS' as field,
  match_status as value,
  COUNT(*) as count
FROM project_practitioner_matches
GROUP BY match_status

UNION ALL

SELECT 
  'PRACTITIONER_RESPONSE' as field,
  COALESCE(practitioner_response, 'NULL') as value,
  COUNT(*) as count
FROM project_practitioner_matches
GROUP BY practitioner_response

ORDER BY field, value;

-- ============================================================================
-- STEP 9: DEPRECATION NOTES
-- ============================================================================
-- The 'status' column on project_practitioner_matches is now DEPRECATED
-- New code should use:
--   - match_status: for project engagement state
--   - practitioner_response: for practitioner's acceptance/decline
--
-- Keep 'status' column for backward compatibility during transition
-- but all NEW code must use match_status + practitioner_response
--
-- Timeline: Remove 'status' column after 2-3 releases when no code depends on it

-- ============================================================================
-- STEP 10: DOCUMENTATION & EXAMPLES
-- ============================================================================
/*

WORKFLOW EXAMPLES:

1. NEW MATCH CREATED:
   - match_status = 'pending'
   - practitioner_response = NULL
   - Use query: WHERE match_status='pending' AND practitioner_response IS NULL

2. PRACTITIONER ACCEPTS:
   - CALL: SELECT update_practitioner_response(match_id, 'accepted');
   - Result: match_status='active', practitioner_response='accepted'

3. PRACTITIONER DECLINES:
   - CALL: SELECT update_practitioner_response(match_id, 'declined', 'Not in my service area');
   - Result: match_status='pending', practitioner_response='declined'
   - Now client can send to another practitioner while tracking this one declined

4. PROJECT MOVES TO IN-PROGRESS:
   - UPDATE project_practitioner_matches SET match_status='in-progress' WHERE id=match_id;

5. PROJECT HIRED/COMPLETED:
   - UPDATE project_practitioner_matches SET match_status='hired' WHERE id=match_id;

DATABASE QUERIES:

-- All pending matches waiting for practitioner response
SELECT * FROM project_practitioner_matches
WHERE match_status = 'pending' AND practitioner_response IS NULL;

-- Matches where practitioner declined
SELECT * FROM project_practitioner_matches
WHERE practitioner_response = 'declined';

-- Active matches (practitioner accepted, project ongoing)
SELECT * FROM project_practitioner_matches
WHERE match_status = 'active' AND practitioner_response = 'accepted';

-- Client view: All their matches with details
SELECT 
  ppm.id,
  ppm.project_serial,
  ppm.practitioner_serial,
  ppm.match_status,
  ppm.practitioner_response,
  ppm.practitioner_responded_at,
  ppm.created_at
FROM project_practitioner_matches ppm
WHERE ppm.client_serial = $1
ORDER BY ppm.created_at DESC;

-- Practitioner view: Matches pending their response
SELECT 
  ppm.id,
  ppm.project_serial,
  ppm.client_serial,
  ppm.match_status,
  ppm.created_at
FROM project_practitioner_matches ppm
WHERE ppm.practitioner_serial = $1
  AND ppm.match_status = 'pending'
  AND ppm.practitioner_response IS NULL
ORDER BY ppm.created_at DESC;

*/
