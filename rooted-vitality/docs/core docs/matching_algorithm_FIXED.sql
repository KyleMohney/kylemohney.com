-- ============================================================================
-- MATCHING ALGORITHM FUNCTION - FIXED VERSION WITH SUBCATEGORY MATCHING
-- Rooted Vitality Platform
-- ============================================================================
-- This function returns practitioners that match a project's requirements
-- Includes: service type, subcategory/conditions match, and skill scoring

DROP FUNCTION IF EXISTS match_practitioners(UUID) CASCADE;

CREATE OR REPLACE FUNCTION match_practitioners(
  p_project_id UUID
)
RETURNS TABLE (
  practitioner_id UUID,
  practitioner_serial TEXT,
  legal_name TEXT,
  legal_business_name TEXT,
  dba_name TEXT,
  modalities TEXT[],
  conditions_treated TEXT[],
  bio TEXT,
  email TEXT,
  phone TEXT,
  profile_photo_url TEXT,
  rating NUMERIC,
  reviews_count INTEGER,
  in_person_enabled BOOLEAN,
  housecalls_enabled BOOLEAN,
  virtual_enabled BOOLEAN,
  credentials_verified BOOLEAN,
  profile_completion_percent INTEGER,
  distance_miles INTEGER,
  match_score NUMERIC
) AS $$
DECLARE
  v_project_id UUID;
  v_travel_preference TEXT;
  v_client_zipcode TEXT;
  v_category_id TEXT;
  v_subcategory_text TEXT;
  v_start_date DATE;
BEGIN
  -- Get project details
  SELECT 
    proj.id,
    proj.travel_preference,
    proj.zipcode,
    proj.category_id,
    proj.subcategory_text,
    proj.start_date
  INTO 
    v_project_id,
    v_travel_preference,
    v_client_zipcode,
    v_category_id,
    v_subcategory_text,
    v_start_date
  FROM projects proj
  WHERE proj.id = p_project_id;

  -- Return matched practitioners ordered by score
  RETURN QUERY
  SELECT 
    p.id,
    p.serial_number,
    p.legal_name,
    p.legal_business_name,
    p.dba_name,
    p.modalities,
    p.conditions_treated,
    p.bio,
    p.email,
    p.phone,
    COALESCE(p.practice_logo_url, p.gallery_photos->0->>'url'),
    0::NUMERIC,
    0,
    p.in_person_enabled,
    p.housecalls_enabled,
    p.virtual_enabled,
    p.credentials_verified,
    p.profile_completion_percent,
    0::INTEGER,
    ROUND(
      (CASE WHEN p.credentials_verified THEN 30.0 ELSE 0.0 END) +
      (COALESCE(p.profile_completion_percent, 0)::NUMERIC / 100.0 * 70.0),
      2
    )::NUMERIC AS match_score
  FROM practitioners p
  WHERE 
    p.deleted_at IS NULL
    AND COALESCE(p.matching_enabled, true) = true
    AND COALESCE(p.matching_paused, false) = false
    
    -- STRICT MATCHING: Must have at least one service enabled for travel preference
    AND (
      (v_travel_preference = 'flexible' AND (COALESCE(p.in_person_enabled, false) OR COALESCE(p.housecalls_enabled, false) OR COALESCE(p.virtual_enabled, false))) OR
      (v_travel_preference = 'in-person' AND COALESCE(p.in_person_enabled, false) = true) OR
      (v_travel_preference = 'house-calls' AND COALESCE(p.housecalls_enabled, false) = true) OR
      (v_travel_preference = 'virtual' AND COALESCE(p.virtual_enabled, false) = true)
    )
    
    -- STRICT MATCHING: At least one subcategory must match conditions_treated
    AND (
      v_subcategory_text IS NULL OR 
      v_subcategory_text = '' OR
      EXISTS (
        SELECT 1 FROM UNNEST(STRING_TO_ARRAY(v_subcategory_text, ', ')) AS sub_item
        WHERE COALESCE(p.conditions_treated, ARRAY[]::TEXT[]) @> ARRAY[sub_item]
      )
    )
  ORDER BY 
    p.credentials_verified DESC,
    p.profile_completion_percent DESC;
END;
$$ LANGUAGE plpgsql;

