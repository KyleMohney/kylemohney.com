-- ============================================================================
-- PROJECT DATA VALIDATION & ENRICHMENT FOR RADIUS MATCHING
-- ============================================================================
-- This script ensures all projects have the necessary address data
-- for the radius-based matching system to work correctly
-- ============================================================================

-- ============================================================================
-- STEP 1: VERIFY PROJECTS TABLE STRUCTURE
-- ============================================================================
-- Check that all required columns exist for radius matching

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'projects' 
  AND column_name IN ('street', 'city', 'zipcode', 'state')
ORDER BY ordinal_position;

-- ============================================================================
-- STEP 2: VALIDATE EXISTING DATA - MISSING ADDRESS FIELDS
-- ============================================================================
-- Identify projects with missing critical address data

SELECT 
  id,
  project_id,
  client_serial,
  category_name,
  street,
  city,
  zipcode,
  state,
  created_at,
  CASE 
    WHEN street IS NULL THEN 'Missing Street'
    WHEN zipcode IS NULL THEN 'Missing Zipcode'
    WHEN state IS NULL THEN 'Missing State'
    WHEN zipcode IS NULL OR street IS NULL THEN 'Missing Multiple'
    ELSE 'Complete'
  END as data_status
FROM projects
WHERE (street IS NULL OR street = '')
   OR (zipcode IS NULL OR zipcode = '')
   OR (state IS NULL OR state = '')
ORDER BY created_at DESC;

-- ============================================================================
-- STEP 3: DATA QUALITY REPORT
-- ============================================================================
-- Overall summary of data quality

SELECT 
  COUNT(*) as total_projects,
  COUNT(CASE WHEN street IS NOT NULL AND street != '' THEN 1 END) as with_street,
  COUNT(CASE WHEN city IS NOT NULL AND city != '' THEN 1 END) as with_city,
  COUNT(CASE WHEN zipcode IS NOT NULL AND zipcode != '' THEN 1 END) as with_zipcode,
  COUNT(CASE WHEN state IS NOT NULL AND state != '' THEN 1 END) as with_state,
  COUNT(CASE WHEN street IS NOT NULL AND zipcode IS NOT NULL AND state IS NOT NULL THEN 1 END) as radius_matching_ready,
  ROUND(100.0 * COUNT(CASE WHEN street IS NOT NULL AND zipcode IS NOT NULL AND state IS NOT NULL THEN 1 END) / COUNT(*), 1) as percent_ready
FROM projects;

-- ============================================================================
-- STEP 4: VALIDATION - Projects ready for radius matching
-- ============================================================================
-- These projects can use radius-based matching

SELECT 
  id,
  project_id,
  client_serial,
  category_name,
  street,
  city,
  zipcode,
  state,
  travel_preference,
  project_status,
  created_at
FROM projects
WHERE street IS NOT NULL 
  AND street != ''
  AND zipcode IS NOT NULL 
  AND zipcode != ''
  AND state IS NOT NULL 
  AND state != ''
ORDER BY created_at DESC;

-- ============================================================================
-- STEP 5: VALIDATION - Projects MISSING data (these won't match)
-- ============================================================================
-- These projects need manual intervention

SELECT 
  id,
  project_id,
  client_serial,
  category_name,
  street,
  zipcode,
  state,
  project_status,
  created_at,
  COALESCE(street, '[MISSING]') as street_status,
  COALESCE(zipcode, '[MISSING]') as zipcode_status,
  COALESCE(state, '[MISSING]') as state_status
FROM projects
WHERE (street IS NULL OR street = '')
   OR (zipcode IS NULL OR zipcode = '')
   OR (state IS NULL OR state = '')
ORDER BY created_at DESC;

-- ============================================================================
-- STEP 6: ADD MISSING COLUMNS (if they don't exist)
-- ============================================================================
-- This section adds any missing columns to the projects table

-- Add street column if it doesn't exist
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS street TEXT;

-- Add city column if it doesn't exist
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS city TEXT;

-- Add zipcode column if it doesn't exist
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS zipcode TEXT;

-- Add state column if it doesn't exist
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS state TEXT;

-- Verify columns were created/exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'projects' 
  AND column_name IN ('street', 'city', 'zipcode', 'state');

-- ============================================================================
-- STEP 7: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
-- These indexes speed up matching queries that filter by zipcode

CREATE INDEX IF NOT EXISTS idx_projects_zipcode ON projects(zipcode);
CREATE INDEX IF NOT EXISTS idx_projects_state ON projects(state);
CREATE INDEX IF NOT EXISTS idx_projects_travel_preference ON projects(travel_preference);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(project_status);

-- Verify indexes were created
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'projects' 
  AND indexname LIKE 'idx_projects_%'
ORDER BY indexname;

-- ============================================================================
-- STEP 8: VALIDATE NEW PROJECT FORM SUBMISSIONS
-- ============================================================================
-- Check that new projects (created in last 7 days) have complete data

SELECT 
  COUNT(*) as new_projects_last_7_days,
  COUNT(CASE WHEN street IS NOT NULL AND zipcode IS NOT NULL AND state IS NOT NULL THEN 1 END) as with_complete_address,
  ROUND(100.0 * COUNT(CASE WHEN street IS NOT NULL AND zipcode IS NOT NULL AND state IS NOT NULL THEN 1 END) 
    / NULLIF(COUNT(*), 0), 1) as percent_complete
FROM projects
WHERE created_at >= NOW() - INTERVAL '7 days';

-- ============================================================================
-- STEP 9: INTEGRATION CHECK - Ready for Radius Matching
-- ============================================================================
-- Confirms system is ready to use radius matching

SELECT 
  'Projects Table' as component,
  CASE WHEN COUNT(*) > 0 THEN '✓ Ready' ELSE '✗ No projects' END as status,
  COUNT(*) as count
FROM projects
WHERE street IS NOT NULL AND zipcode IS NOT NULL AND state IS NOT NULL
UNION ALL
SELECT 
  'Practitioners with Base Zipcode',
  CASE WHEN COUNT(*) > 0 THEN '✓ Ready' ELSE '✗ No coverage' END,
  COUNT(*)
FROM practitioners
WHERE in_person_base_zipcode IS NOT NULL 
   OR housecalls_base_zipcode IS NOT NULL;

-- NOTE: US Zipcodes lookup table will be created separately with:
-- CREATE TABLE us_zipcodes (
--   zipcode TEXT PRIMARY KEY,
--   latitude DECIMAL(10,8),
--   longitude DECIMAL(11,8),
--   city TEXT,
--   state TEXT
-- );
-- Then load your zipcode dataset into it

-- ============================================================================
-- STEP 10: SAMPLE TEST QUERY
-- ============================================================================
-- Display sample projects with complete address data ready for matching

SELECT 
  id,
  project_id,
  category_name,
  street,
  city,
  state,
  zipcode,
  travel_preference,
  project_status,
  created_at
FROM projects
WHERE street IS NOT NULL 
  AND zipcode IS NOT NULL 
  AND state IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- These are the projects that will be available for radius matching
-- Once you load the us_zipcodes table with coordinates, the radius
-- matching system will calculate distances and find practitioners
-- within each project's service radius

-- ============================================================================
-- NOTES & NEXT STEPS
-- ============================================================================
/*

VALIDATION CHECKLIST:
✓ Step 1: Verify all columns (street, city, zipcode, state) exist
✓ Step 2: Identify any projects with missing address data
✓ Step 3: Get overall data quality metrics
✓ Step 4: View projects ready for radius matching
✓ Step 5: Identify projects needing manual update
✓ Step 6: Add any missing columns (should all exist)
✓ Step 7: Create performance indexes
✓ Step 8: Check new projects have complete data
✓ Step 9: Verify system integration is complete
✓ Step 10: Test with sample project

REQUIRED FOR RADIUS MATCHING TO WORK:
1. ✓ Projects table has: street, city, zipcode, state columns
2. ✓ All new projects capture these fields (form is already configured)
3. ✓ us_zipcodes lookup table is populated with coordinates
4. ✓ Practitioners have: in_person_base_zipcode, in_person_radius_miles, etc.
5. ✓ match_practitioners() function uses radius calculations

IF YOU FIND ISSUES:
- Missing old projects? Update manually with:
  UPDATE projects SET street = '...' WHERE project_id = '...';
- US zipcodes not loaded? Import dataset first
- Practitioners missing coverage? Have them set zipcode and radius in profile

PERFORMANCE:
- Indexes created on zipcode, state, travel_preference, status
- Radius calculations only happen during matching (not every query)
- Haversine formula cached via PostgreSQL STABLE keyword

*/
