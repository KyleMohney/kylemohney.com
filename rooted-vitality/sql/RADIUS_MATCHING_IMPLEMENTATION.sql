-- ============================================================================
-- RADIUS-BASED MATCHING IMPLEMENTATION
-- ============================================================================
-- This implementation adds zipcode-based distance calculation for radius matching
-- Requires: us_zipcodes table with latitude and longitude coordinates
-- ============================================================================

-- ============================================================================
-- STEP 1: Create US Zipcodes Lookup Table (if not exists)
-- ============================================================================
-- This table stores zipcode coordinates for distance calculations
-- Data source: you can import from free US Census Bureau data or similar

CREATE TABLE IF NOT EXISTS us_zipcodes (
    zipcode TEXT PRIMARY KEY,
    latitude NUMERIC(9,6),
    longitude NUMERIC(9,6),
    city TEXT,
    state TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_us_zipcodes_state ON us_zipcodes(state);
COMMENT ON TABLE us_zipcodes IS 'US zipcode coordinates for distance calculations in radius-based matching';

-- ============================================================================
-- STEP 2: Haversine Distance Function
-- ============================================================================
-- Calculates distance in miles between two lat/long coordinates
-- Formula: haversine distance = 2 * R * asin(sqrt(sin²((lat2-lat1)/2) + cos(lat1)*cos(lat2)*sin²((lon2-lon1)/2)))
-- Where R = Earth radius in miles (3959 miles)

CREATE OR REPLACE FUNCTION calculate_distance_miles(
    lat1 NUMERIC,
    lon1 NUMERIC,
    lat2 NUMERIC,
    lon2 NUMERIC
) RETURNS NUMERIC AS $$
DECLARE
    earth_radius_miles NUMERIC := 3959;
    lat1_rad NUMERIC;
    lat2_rad NUMERIC;
    dlat_rad NUMERIC;
    dlon_rad NUMERIC;
    a NUMERIC;
    c NUMERIC;
    distance NUMERIC;
BEGIN
    -- Convert degrees to radians
    lat1_rad := RADIANS(lat1);
    lat2_rad := RADIANS(lat2);
    dlat_rad := RADIANS(lat2 - lat1);
    dlon_rad := RADIANS(lon2 - lon1);
    
    -- Haversine formula
    a := SIN(dlat_rad / 2) * SIN(dlat_rad / 2) +
         COS(lat1_rad) * COS(lat2_rad) *
         SIN(dlon_rad / 2) * SIN(dlon_rad / 2);
    
    c := 2 * ASIN(SQRT(a));
    distance := earth_radius_miles * c;
    
    RETURN ROUND(distance::NUMERIC, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_distance_miles(NUMERIC, NUMERIC, NUMERIC, NUMERIC) IS 
'Calculate distance in miles between two lat/long coordinates using haversine formula';

-- ============================================================================
-- STEP 3: Helper Function - Check if Zipcode is Within Radius
-- ============================================================================
-- Returns TRUE if the practitioner's zipcode is within their specified radius
-- of the client's zipcode

CREATE OR REPLACE FUNCTION is_zipcode_within_radius(
    p_practitioner_zipcode TEXT,
    p_practitioner_radius_miles INTEGER,
    p_client_zipcode TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_practitioner_lat NUMERIC;
    v_practitioner_lon NUMERIC;
    v_client_lat NUMERIC;
    v_client_lon NUMERIC;
    v_distance NUMERIC;
BEGIN
    -- Get coordinates for practitioner's base zipcode
    SELECT latitude, longitude INTO v_practitioner_lat, v_practitioner_lon
    FROM us_zipcodes
    WHERE zipcode = p_practitioner_zipcode;
    
    -- Get coordinates for client's zipcode
    SELECT latitude, longitude INTO v_client_lat, v_client_lon
    FROM us_zipcodes
    WHERE zipcode = p_client_zipcode;
    
    -- If either zipcode not found, return FALSE (no match)
    IF v_practitioner_lat IS NULL OR v_client_lat IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Calculate distance
    v_distance := calculate_distance_miles(
        v_practitioner_lat,
        v_practitioner_lon,
        v_client_lat,
        v_client_lon
    );
    
    -- Return TRUE if distance is within radius
    RETURN v_distance <= p_practitioner_radius_miles;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION is_zipcode_within_radius(TEXT, INTEGER, TEXT) IS
'Check if client zipcode is within practitioner radius miles from practitioner base zipcode';

-- ============================================================================
-- STEP 4: Updated Matching Algorithm with Radius Support
-- ============================================================================
-- This replaces the previous match_practitioners function with radius support

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
  v_client_state TEXT;
  v_category_id TEXT;
  v_subcategory_name TEXT;
  v_start_date DATE;
  v_payment_methods TEXT[];
  v_insurance_providers TEXT[];
BEGIN
  -- Get project details INCLUDING payment methods and insurance requirements
  SELECT 
    proj.id,
    proj.travel_preference,
    proj.zipcode,
    proj.state,
    proj.category_id,
    proj.subcategory_name,
    proj.start_date,
    COALESCE(proj.accepted_payment_methods, ARRAY[]::TEXT[]),
    COALESCE(proj.accepted_insurance_providers, ARRAY[]::TEXT[])
  INTO 
    v_project_id,
    v_travel_preference,
    v_client_zipcode,
    v_client_state,
    v_category_id,
    v_subcategory_name,
    v_start_date,
    v_payment_methods,
    v_insurance_providers
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
    CASE 
      WHEN p.in_person_base_zipcode IS NOT NULL AND v_client_zipcode IS NOT NULL THEN
        ROUND(calculate_distance_miles(
          (SELECT latitude FROM us_zipcodes WHERE zipcode = p.in_person_base_zipcode LIMIT 1),
          (SELECT longitude FROM us_zipcodes WHERE zipcode = p.in_person_base_zipcode LIMIT 1),
          (SELECT latitude FROM us_zipcodes WHERE zipcode = v_client_zipcode LIMIT 1),
          (SELECT longitude FROM us_zipcodes WHERE zipcode = v_client_zipcode LIMIT 1)
        ))::INTEGER
      ELSE NULL
    END AS distance_miles,
    ROUND(
      (CASE WHEN p.credentials_verified THEN 20.0 ELSE 0.0 END) +
      (COALESCE(p.profile_completion_percent, 0)::NUMERIC / 100.0 * 20.0) +
      (CASE WHEN COALESCE(array_length(p.accepted_payment_methods, 1), 0) > 0 AND 
              (v_payment_methods IS NULL OR array_length(v_payment_methods, 1) = 0 OR 
               p.accepted_payment_methods && v_payment_methods) THEN 15.0 ELSE 0.0 END) +
      (CASE WHEN COALESCE(array_length(p.accepted_insurance_providers, 1), 0) > 0 AND 
              (v_insurance_providers IS NULL OR array_length(v_insurance_providers, 1) = 0 OR 
               p.accepted_insurance_providers && v_insurance_providers) THEN 15.0 ELSE 0.0 END) +
      (CASE WHEN COALESCE(p.avg_rating, 0) >= 4.5 THEN 15.0 
            WHEN COALESCE(p.avg_rating, 0) >= 4.0 THEN 12.0 
            WHEN COALESCE(p.avg_rating, 0) >= 3.5 THEN 8.0 
            ELSE 0.0 END) +
      (CASE WHEN COALESCE(p.review_count, 0) >= 20 THEN 15.0 
            WHEN COALESCE(p.review_count, 0) >= 10 THEN 10.0 
            WHEN COALESCE(p.review_count, 0) >= 5 THEN 5.0 
            ELSE 0.0 END),
      2
    )::NUMERIC AS match_score
  FROM practitioners p
  WHERE 
    p.deleted_at IS NULL
    AND COALESCE(p.matching_enabled, true) = true
    AND COALESCE(p.matching_paused, false) = false
    
    -- Category must match - compare TEXT arrays
    AND v_category_id::TEXT = ANY(p.service_category_names)
    
    -- Subcategory must match service_subcategory_names
    AND (
      v_subcategory_name IS NULL OR 
      v_subcategory_name = '' OR
      v_subcategory_name::TEXT = ANY(p.service_subcategory_names)
    )
    
    -- Payment methods must match (if project requires specific payment methods)
    AND (
      v_payment_methods IS NULL OR 
      array_length(v_payment_methods, 1) IS NULL OR
      p.accepted_payment_methods && v_payment_methods
    )
    
    -- Insurance providers must match (if project requires specific insurance)
    AND (
      v_insurance_providers IS NULL OR 
      array_length(v_insurance_providers, 1) IS NULL OR
      p.accepted_insurance_providers && v_insurance_providers
    )
    
    -- Travel preference must be supported AND location must match
    AND (
      -- FLEXIBLE: Any of the three options work
      (v_travel_preference = 'flexible' AND (
        -- In-person with radius or exact zipcode
        (COALESCE(p.in_person_enabled, false) = true AND (
          p.in_person_base_zipcode = v_client_zipcode OR
          (p.in_person_base_zipcode IS NOT NULL AND p.in_person_radius_miles > 0 AND
           is_zipcode_within_radius(p.in_person_base_zipcode, p.in_person_radius_miles, v_client_zipcode))
        )) OR
        -- Housecalls with radius or exact zipcode
        (COALESCE(p.housecalls_enabled, false) = true AND (
          p.housecalls_base_zipcode = v_client_zipcode OR
          (p.housecalls_base_zipcode IS NOT NULL AND p.housecalls_radius_miles > 0 AND
           is_zipcode_within_radius(p.housecalls_base_zipcode, p.housecalls_radius_miles, v_client_zipcode))
        )) OR
        -- Virtual nationwide or for the client's state
        (COALESCE(p.virtual_enabled, false) = true AND (
          p.virtual_option = 'nationwide' OR
          v_client_state::TEXT = ANY(p.virtual_states)
        ))
      )) OR
      
      -- IN-PERSON: Must have in-person enabled and location must match
      (v_travel_preference = 'in-person' AND COALESCE(p.in_person_enabled, false) = true AND (
        p.in_person_base_zipcode = v_client_zipcode OR
        (p.in_person_base_zipcode IS NOT NULL AND p.in_person_radius_miles > 0 AND
         is_zipcode_within_radius(p.in_person_base_zipcode, p.in_person_radius_miles, v_client_zipcode))
      )) OR
      
      -- HOUSECALLS: Must have housecalls enabled and location must match
      (v_travel_preference = 'housecalls' AND COALESCE(p.housecalls_enabled, false) = true AND (
        p.housecalls_base_zipcode = v_client_zipcode OR
        (p.housecalls_base_zipcode IS NOT NULL AND p.housecalls_radius_miles > 0 AND
         is_zipcode_within_radius(p.housecalls_base_zipcode, p.housecalls_radius_miles, v_client_zipcode))
      )) OR
      
      -- VIRTUAL: Must have virtual enabled and either nationwide or client state in list
      (v_travel_preference = 'virtual' AND COALESCE(p.virtual_enabled, false) = true AND (
        p.virtual_option = 'nationwide' OR
        v_client_state::TEXT = ANY(p.virtual_states)
      ))
    )
  ORDER BY 
    p.credentials_verified DESC,
    p.profile_completion_percent DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION match_practitioners(UUID) IS 
'Match practitioners to projects with radius-based distance calculations for in-person and housecalls services';

-- ============================================================================
-- STEP 5: Verification Query
-- ============================================================================
-- Use this to test the matching system

-- First, get a real project with complete address data
WITH test_project AS (
  SELECT id FROM projects 
  WHERE street IS NOT NULL AND zipcode IS NOT NULL AND state IS NOT NULL
  LIMIT 1
)
SELECT * FROM match_practitioners((SELECT id FROM test_project)::UUID);

-- Example: Test distance calculation between two NYC zip codes
-- SELECT calculate_distance_miles(40.7128, -74.0060, 40.7580, -73.9855) as distance_blocks_manhattan;

-- Example: Test radius matching - is OH 44446 (Niles) within 50 miles of UT 84501 (Pricefield)?
-- SELECT is_zipcode_within_radius('44446', 50, '84501') as within_50_miles;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. You must populate the us_zipcodes table with coordinates before using this
-- 2. Sources for free zipcode data:
--    - US Census Bureau: https://www.census.gov/geographies/reference-files/2010/geo/cong-dist-natl.html
--    - OpenDataSoft: https://data.opendatasoft.com/explore/dataset/us-zip-code-latitude-and-longitude/
--    - MaxMind: https://www.maxmind.com/ (free tier available)
-- 3. The haversine formula is accurate to within ~0.5% for Earth distances
-- 4. For better accuracy over 100+ miles, consider PostGIS extension
-- 5. Performance: Indexes on us_zipcodes(zipcode) and practitioners(in_person_base_zipcode) 
--    are critical for query performance
-- ============================================================================
