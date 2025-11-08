-- ============================================================================
-- LOAD US ZIPCODES DATA
-- ============================================================================
-- This script loads US zipcode data with coordinates into the us_zipcodes table
-- The data is needed for the radius-based matching system to calculate distances

-- ============================================================================
-- OPTION 1: INSERT SAMPLE DATA (for testing)
-- ============================================================================
-- Insert a few sample zipcodes to test the system

INSERT INTO us_zipcodes (zipcode, latitude, longitude, city, state)
VALUES
  ('44446', 41.4505, -81.4169, 'Niles', 'OH'),
  ('84501', 39.6837, -109.5503, 'Pricefield', 'UT'),
  ('44240', 41.2538, -81.4040, 'Peninsula', 'OH'),
  ('43235', 39.9612, -82.7649, 'Columbus', 'OH'),
  ('84602', 40.2338, -111.6585, 'Provo', 'UT'),
  ('84604', 40.2234, -111.5728, 'Provo', 'UT'),
  ('85001', 33.4484, -112.0740, 'Phoenix', 'AZ'),
  ('90210', 34.0901, -118.4065, 'Beverly Hills', 'CA')
ON CONFLICT (zipcode) DO NOTHING;

-- Verify data was inserted
SELECT COUNT(*) as total_zipcodes FROM us_zipcodes;
SELECT * FROM us_zipcodes LIMIT 10;

-- ============================================================================
-- OPTION 2: BULK LOAD FROM CSV FILE (recommended for production)
-- ============================================================================
-- Once you have a complete US zipcodes CSV file with columns:
-- zipcode, latitude, longitude, city, state
--
-- You can load it using Supabase's SQL editor or via psql:
--
-- COPY us_zipcodes (zipcode, latitude, longitude, city, state)
-- FROM '/path/to/us_zipcodes.csv'
-- WITH (FORMAT csv, HEADER true, DELIMITER ',');
--
-- Or via Supabase dashboard:
-- 1. Go to SQL Editor
-- 2. Click "New Query"
-- 3. Use the COPY command above with your file path
-- 4. Or upload directly from CSV in the Table Editor

-- ============================================================================
-- FREE ZIPCODE DATA SOURCES
-- ============================================================================
/*

RECOMMENDED SOURCES:

1. SimpleMaps (Free Basic Version)
   - https://simplemaps.com/data/us-zips
   - Download: uszips.csv
   - Format: zip, lat, lng, city, state_id, state_name, population, density, etc.
   - Coverage: All US zipcodes with coordinates

2. OpenDataSoft (Public Dataset)
   - https://public.opendatasoft.com/explore/dataset/us-zipcode-boundaries/
   - Format: Multiple formats including CSV, GeoJSON
   - Coverage: Comprehensive US zipcode data

3. US Census Bureau
   - https://www.census.gov/cgi-bin/geo/shapefiles/index.php
   - Format: Shapefiles, requires conversion to CSV
   - Coverage: Official government data

4. GeoNames (Worldwide)
   - https://www.geonames.org/postal-codes/
   - Format: CSV, TSV
   - Coverage: International including US zipcodes

STEPS TO LOAD:
1. Download the CSV file with columns: zipcode, latitude, longitude, city, state
2. Prepare CSV format:
   - Ensure header row: zipcode,latitude,longitude,city,state
   - Ensure zipcode is 5 digits (format: "12345")
   - Ensure latitude/longitude are decimals (format: 40.1234, -111.5678)
3. Upload to Supabase:
   - Method A: Supabase SQL Editor → paste COPY command with file path
   - Method B: Supabase Table Editor → Import CSV directly
   - Method C: Use psql command line if you have local access

*/

-- ============================================================================
-- VERIFY ZIPCODES FOR YOUR PROJECTS
-- ============================================================================
-- Check if the zipcodes in your projects are in the lookup table

SELECT 
  'Projects with Zipcodes in Lookup' as check_type,
  COUNT(DISTINCT p.zipcode) as zipcodes_found,
  COUNT(DISTINCT z.zipcode) as lookup_zipcodes
FROM projects p
LEFT JOIN us_zipcodes z ON p.zipcode = z.zipcode
WHERE p.street IS NOT NULL AND p.zipcode IS NOT NULL;

-- List project zipcodes that are NOT in the lookup table (need to add)
SELECT DISTINCT
  p.zipcode,
  p.state,
  COUNT(*) as project_count
FROM projects p
LEFT JOIN us_zipcodes z ON p.zipcode = z.zipcode
WHERE p.street IS NOT NULL 
  AND p.zipcode IS NOT NULL
  AND z.zipcode IS NULL
GROUP BY p.zipcode, p.state
ORDER BY project_count DESC;

-- ============================================================================
-- VERIFY PRACTITIONERS COVERAGE SETUP
-- ============================================================================
-- Check if practitioners have set their base zipcodes for matching

SELECT 
  COUNT(*) as total_practitioners,
  COUNT(CASE WHEN in_person_base_zipcode IS NOT NULL THEN 1 END) as with_in_person_base,
  COUNT(CASE WHEN housecalls_base_zipcode IS NOT NULL THEN 1 END) as with_housecalls_base,
  COUNT(CASE WHEN in_person_radius_miles IS NOT NULL THEN 1 END) as with_in_person_radius,
  COUNT(CASE WHEN housecalls_radius_miles IS NOT NULL THEN 1 END) as with_housecalls_radius
FROM practitioners;

-- List practitioners who haven't set up coverage areas yet
SELECT 
  id,
  email,
  in_person_enabled,
  in_person_base_zipcode,
  in_person_radius_miles,
  housecalls_enabled,
  housecalls_base_zipcode,
  housecalls_radius_miles
FROM practitioners
WHERE (in_person_enabled = true AND in_person_base_zipcode IS NULL)
   OR (housecalls_enabled = true AND housecalls_base_zipcode IS NULL)
ORDER BY created_at DESC;

-- ============================================================================
-- SYSTEM READINESS CHECK
-- ============================================================================
-- This shows if all components are ready for radius matching

SELECT 
  'US Zipcodes Data' as component,
  CASE 
    WHEN COUNT(*) > 100 THEN '✓ Ready - ' || COUNT(*) || ' zipcodes'
    WHEN COUNT(*) > 0 THEN '⚠ Partial - ' || COUNT(*) || ' zipcodes (need more data)'
    ELSE '✗ Not ready - no zipcodes loaded'
  END as status
FROM us_zipcodes
UNION ALL
SELECT 
  'Projects Ready for Matching',
  CASE 
    WHEN COUNT(*) > 0 THEN '✓ Ready - ' || COUNT(*) || ' projects'
    ELSE '✗ No projects with complete address'
  END
FROM projects
WHERE street IS NOT NULL AND zipcode IS NOT NULL AND state IS NOT NULL
UNION ALL
SELECT 
  'Practitioners with Coverage',
  CASE 
    WHEN COUNT(*) > 0 THEN '✓ Ready - ' || COUNT(*) || ' practitioners'
    ELSE '✗ No practitioners set up coverage'
  END
FROM practitioners
WHERE in_person_base_zipcode IS NOT NULL OR housecalls_base_zipcode IS NOT NULL
UNION ALL
SELECT 
  'Radius Matching Functions',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc WHERE proname = 'calculate_distance_miles'
    ) THEN '✓ Ready - functions exist'
    ELSE '✗ Not deployed - run RADIUS_MATCHING_IMPLEMENTATION.sql'
  END as status;

-- ============================================================================
-- AFTER LOADING ZIPCODES
-- ============================================================================
/*

NEXT STEPS:

1. Load Complete Zipcode Dataset
   - Download US zipcodes CSV from SimpleMaps or OpenDataSoft
   - Use COPY command or Supabase import to load data
   - Verify with: SELECT COUNT(*) FROM us_zipcodes;
   
2. Have Practitioners Set Coverage Areas
   - Practitioners log in to their dashboard
   - Go to Settings → Service Coverage
   - Set "Base Zipcode" for in-person and/or housecalls
   - Set "Coverage Radius" in miles (e.g., 15 miles, 30 miles)
   - Save settings
   
3. Deploy Radius Matching Functions
   - Run: RADIUS_MATCHING_IMPLEMENTATION.sql
   - This creates the haversine distance calculation
   - Updates the match_practitioners() function
   
4. Test the System
   - Create a test project with a complete address
   - Verify practitioners within radius are matched
   - Check distance_miles field shows calculated distance
   
5. Monitor Performance
   - Indexes are created on zipcode/state for fast lookups
   - Distance calculations are cached by PostgreSQL
   - Monitor query performance as you scale

*/
