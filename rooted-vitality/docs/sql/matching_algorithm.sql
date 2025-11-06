-- ============================================================================
-- MATCHING ALGORITHM FUNCTION
-- Rooted Vitality Platform
-- ============================================================================
-- This file contains the matching function that compares project requirements
-- against practitioner profiles and returns scored, ordered results.
-- ============================================================================

CREATE OR REPLACE FUNCTION match_practitioners(
  p_project_id UUID
)
RETURNS TABLE (
  practitioner_id UUID,
  practitioner_serial TEXT,
  legal_name TEXT,
  modalities TEXT[],
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
  v_project_category TEXT;
  v_project_concerns TEXT[];
  v_travel_preference TEXT;
  v_client_zipcode TEXT;
  v_client_state TEXT;
  v_start_date DATE;
  v_client_lat NUMERIC;
  v_client_lon NUMERIC;
BEGIN
  -- Get project details
  SELECT 
    proj.category_id,
    (SELECT array_agg(DISTINCT tc.name) FROM project_client_concerns pcc 
     JOIN taxonomy_subcategories tc ON pcc.subcategory_id = tc.id 
     WHERE pcc.project_id = proj.id),
    proj.travel_preference,
    proj.zipcode,
    proj.state,
    proj.start_date
  INTO 
    v_project_category,
    v_project_concerns,
    v_travel_preference,
    v_client_zipcode,
    v_client_state,
    v_start_date
  FROM projects proj
  WHERE proj.id = p_project_id;

  -- Return matched practitioners ordered by score
  RETURN QUERY
  SELECT 
    p.id,
    p.serial_number,
    p.legal_name,
    p.modalities,
    p.bio,
    p.email,
    p.phone,
    p.profile_photo_url,
    COALESCE(p.rating, 0::NUMERIC),
    COALESCE(p.reviews_count, 0),
    p.in_person_enabled,
    p.housecalls_enabled,
    p.virtual_enabled,
    p.credentials_verified,
    p.profile_completion_percent,
    CASE 
      WHEN v_travel_preference = 'in-person' AND p.in_person_enabled THEN 
        CASE 
          WHEN p.in_person_option = 'radius' THEN 
            CAST(
              6371 * 2 * ASIN(SQRT(
                POWER(SIN(RADIANS((p.in_person_base_zipcode::NUMERIC - v_client_zipcode::NUMERIC) / 2)), 2)
              )) AS INTEGER
            )
          ELSE 999
        END
      WHEN v_travel_preference = 'house-calls' AND p.housecalls_enabled THEN 
        CASE 
          WHEN p.housecalls_option = 'radius' THEN 
            CAST(
              6371 * 2 * ASIN(SQRT(
                POWER(SIN(RADIANS((p.housecalls_base_zipcode::NUMERIC - v_client_zipcode::NUMERIC) / 2)), 2)
              )) AS INTEGER
            )
          ELSE 999
        END
      WHEN v_travel_preference = 'virtual' AND p.virtual_enabled THEN 0
      ELSE NULL
    END::INTEGER,
    -- Calculate match score (0-100)
    ROUND(
      (CASE WHEN p.credentials_verified THEN 30 ELSE 0 END) +
      (COALESCE(p.rating, 0) / 5 * 20) +
      (COALESCE(p.reviews_count, 0)::NUMERIC / 100 * 15) +
      (p.profile_completion_percent / 100 * 25) +
      (CASE 
        WHEN v_travel_preference = 'virtual' THEN 10
        WHEN v_travel_preference IN ('in-person', 'house-calls') AND (
          (v_travel_preference = 'in-person' AND p.in_person_enabled) OR
          (v_travel_preference = 'house-calls' AND p.housecalls_enabled)
        ) THEN 10
        ELSE 0
      END),
      2
    )::NUMERIC AS match_score
  FROM practitioners p
  WHERE 
    p.deleted_at IS NULL
    AND p.matching_enabled = true
    AND p.matching_paused = false
    -- Match travel preference
    AND (
      (v_travel_preference = 'flexible') OR
      (v_travel_preference = 'in-person' AND p.in_person_enabled) OR
      (v_travel_preference = 'house-calls' AND p.housecalls_enabled) OR
      (v_travel_preference = 'virtual' AND p.virtual_enabled)
    )
    -- Match location (if not virtual)
    AND (
      (v_travel_preference = 'virtual' AND p.virtual_enabled) OR
      (v_travel_preference = 'in-person' AND p.in_person_enabled AND (
        (p.in_person_option = 'radius' AND (
          v_client_zipcode = p.in_person_base_zipcode OR
          (p.in_person_radius_miles IS NOT NULL AND 
           ABS(v_client_zipcode::NUMERIC - p.in_person_base_zipcode::NUMERIC) <= p.in_person_radius_miles / 68.7)
        )) OR
        (p.in_person_option = 'zipcodes' AND v_client_zipcode = ANY(p.in_person_zipcodes))
      )) OR
      (v_travel_preference = 'house-calls' AND p.housecalls_enabled AND (
        (p.housecalls_option = 'radius' AND (
          v_client_zipcode = p.housecalls_base_zipcode OR
          (p.housecalls_radius_miles IS NOT NULL AND 
           ABS(v_client_zipcode::NUMERIC - p.housecalls_base_zipcode::NUMERIC) <= p.housecalls_radius_miles / 68.7)
        )) OR
        (p.housecalls_option = 'zipcodes' AND v_client_zipcode = ANY(p.housecalls_zipcodes))
      ))
    )
  ORDER BY 
    credentials_verified DESC,
    COALESCE(reviews_count, 0) DESC,
    COALESCE(rating, 0) DESC,
    profile_completion_percent DESC;
END;
$$ LANGUAGE plpgsql;
