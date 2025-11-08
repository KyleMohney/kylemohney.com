╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: 01_MATCHING_LOGIC_MASTER.sql                                ║
║  Purpose: All matching algorithms and related functions             ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

-- ============================================================================
-- MASTER: MATCHING LOGIC
-- ============================================================================
-- All matching algorithms, scoring, and related database functions
-- Last Updated: November 8, 2025
-- ============================================================================

-- ============================================================================
-- SECTION 1: MAIN MATCHING ALGORITHM
-- ============================================================================
-- Two-phase matching: FILTER (hard gates) → SCORE (by profile completion)
-- Input: Project UUID
-- Output: List of matching practitioners ordered by profile completion %

DROP FUNCTION IF EXISTS match_practitioners(UUID) CASCADE;

CREATE OR REPLACE FUNCTION match_practitioners(
  p_project_id UUID
)
RETURNS TABLE (
  practitioner_id UUID,
  practitioner_serial TEXT,
  legal_name TEXT,
  dba_name TEXT,
  modalities TEXT[],
  conditions_treated TEXT[],
  email TEXT,
  phone TEXT,
  match_score INTEGER
) AS $$
DECLARE
  v_project_id UUID;
  v_category_name TEXT;
  v_subcategory_name TEXT[];
  v_travel_preference TEXT;
  v_client_zipcode TEXT;
  v_client_state TEXT;
  v_project_integer INTEGER;
BEGIN
  -- Get project details
  SELECT 
    proj.id,
    proj.category_name,
    proj.subcategory_name,
    proj.travel_preference,
    proj.zipcode,
    proj.state,
    proj.project_id
  INTO 
    v_project_id,
    v_category_name,
    v_subcategory_name,
    v_travel_preference,
    v_client_zipcode,
    v_client_state,
    v_project_integer
  FROM projects proj
  WHERE proj.id = p_project_id;

  -- If project not found, return empty result
  IF v_project_id IS NULL THEN
    RETURN;
  END IF;

  -- Return only practitioners matching ALL filtering criteria
  -- Ordered by match_score (profile completion determines order)
  RETURN QUERY
  SELECT 
    p.id,
    p.serial_number,
    p.legal_name,
    p.dba_name,
    p.modalities,
    p.conditions_treated,
    p.email,
    p.phone,
    -- MATCH SCORE: 2-100 based on profile completion
    LEAST(100, GREATEST(2, 1 + COALESCE(p.profile_completion_percent, 1)))::INTEGER AS match_score
  FROM practitioners p
  WHERE 
    -- HARD FILTERS - ALL MUST BE TRUE OR NO MATCH
    
    -- 1. Practitioner not deleted
    p.deleted_at IS NULL
    
    -- 2. Practitioner has matching enabled globally
    AND COALESCE(p.matching_enabled, true) = true
    
    -- 3. Practitioner has not paused matching
    AND COALESCE(p.matching_paused, false) = false
    
    -- 4. CATEGORY MATCH - Exact match required
    AND v_category_name = ANY(p.service_category_names)
    
    -- 5. SUBCATEGORY MATCH - If specified, must match at least one
    AND (
      v_subcategory_name IS NULL 
      OR array_length(v_subcategory_name, 1) IS NULL
      OR EXISTS (
        SELECT 1 FROM unnest(v_subcategory_name) AS sub 
        WHERE sub = ANY(p.service_subcategory_names)
      )
    )
    
    -- 6. TRAVEL TYPE ENABLED - Practitioner offers requested travel type
    AND (
      (v_travel_preference = 'in-person' AND p.in_person_enabled = true)
      OR (v_travel_preference = 'housecalls' AND p.housecalls_enabled = true)
      OR (v_travel_preference = 'virtual' AND p.virtual_enabled = true)
    )
    
    -- 7. GEOGRAPHIC MATCH - Based on travel type
    AND (
      -- IN-PERSON: Client zipcode matches practitioner's in-person service area
      (v_travel_preference = 'in-person' AND (
        v_client_zipcode = p.in_person_base_zipcode
        OR v_client_zipcode = ANY(COALESCE(p.in_person_zipcodes, ARRAY[]::TEXT[]))
      ))
      OR
      -- HOUSECALLS: Client zipcode matches practitioner's housecalls service area
      (v_travel_preference = 'housecalls' AND (
        v_client_zipcode = p.housecalls_base_zipcode
        OR v_client_zipcode = ANY(COALESCE(p.housecalls_zipcodes, ARRAY[]::TEXT[]))
      ))
      OR
      -- VIRTUAL (Nationwide): Practitioner accepts clients nationwide
      (v_travel_preference = 'virtual' AND p.virtual_states IS NULL)
      OR
      -- VIRTUAL (State-specific): Client state in practitioner's service states
      (v_travel_preference = 'virtual' AND v_client_state = ANY(COALESCE(p.virtual_states, ARRAY[]::TEXT[])))
    )
    
  ORDER BY match_score DESC;
  
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION match_practitioners(UUID) IS 
'Matches practitioners to projects using strict filtering criteria, then orders by profile completion (score 2-100)';

-- ============================================================================
-- SECTION 2: VALIDATION & DIAGNOSTICS
-- ============================================================================

-- Test the matching algorithm
-- USAGE: SELECT * FROM match_practitioners('PROJECT_UUID'::UUID);
-- Expected: Returns practitioners matching all criteria, ordered by match_score

-- Check for practitioners with 0 match scores (should not happen)
-- SELECT COUNT(*) as zero_scores FROM project_practitioner_matches WHERE match_score = 0;

-- ============================================================================
-- END MASTER: MATCHING LOGIC
-- ============================================================================
