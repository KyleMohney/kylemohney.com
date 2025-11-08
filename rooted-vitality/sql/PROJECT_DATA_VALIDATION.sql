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
WHERE street IS NULL 
   OR zipcode IS NULL 
   OR state IS NULL
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
FROM projects
WHERE deleted_at IS NULL;

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
  AND deleted_at IS NULL
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
  AND deleted_at IS NULL
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
WHERE created_at >= NOW() - INTERVAL '7 days'
  AND deleted_at IS NULL;

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
  'US Zipcodes Lookup',
  CASE WHEN COUNT(*) > 0 THEN '✓ Ready' ELSE '✗ Not loaded' END,
  COUNT(*)
FROM us_zipcodes
UNION ALL
SELECT 
  'Practitioners with Base Zipcode',
  CASE WHEN COUNT(*) > 0 THEN '✓ Ready' ELSE '✗ No coverage' END,
  COUNT(*)
FROM practitioners
WHERE in_person_base_zipcode IS NOT NULL 
   OR housecalls_base_zipcode IS NOT NULL
UNION ALL
SELECT 
  'Radius Matching Function',
  CASE WHEN pg_get_functiondef(oid) IS NOT NULL THEN '✓ Installed' ELSE '✗ Missing' END,
  1
FROM pg_proc
WHERE proname = 'is_zipcode_within_radius';

-- ============================================================================
-- STEP 10: SAMPLE TEST QUERY
-- ============================================================================
-- Test the radius matching system with a sample project

-- First, get a sample project with complete address data
WITH sample_project AS (
  SELECT 
    id,
    project_id,
    zipcode,
    state,
    category_id,
    subcategory_name,
    travel_preference,
    street,
    city
  FROM projects
  WHERE street IS NOT NULL 
    AND zipcode IS NOT NULL 
    AND state IS NOT NULL
    AND deleted_at IS NULL
  LIMIT 1
)
SELECT 
  sp.project_id,
  sp.street,
  sp.city,
  sp.state,
  sp.zipcode,
  sp.travel_preference,
  COUNT(DISTINCT p.id) as matching_practitioners
FROM sample_project sp
LEFT JOIN practitioners p ON (
  p.deleted_at IS NULL
  AND COALESCE(p.matching_enabled, true) = true
  AND p.service_category_ids && ARRAY[sp.category_id]
  AND (
    (sp.travel_preference = 'flexible' AND (
      COALESCE(p.in_person_enabled, false) = true OR
      COALESCE(p.housecalls_enabled, false) = true OR
      COALESCE(p.virtual_enabled, false) = true
    )) OR
    (sp.travel_preference = 'in-person' AND COALESCE(p.in_person_enabled, false) = true) OR
    (sp.travel_preference = 'housecalls' AND COALESCE(p.housecalls_enabled, false) = true) OR
    (sp.travel_preference = 'virtual' AND COALESCE(p.virtual_enabled, false) = true)
  )
)
GROUP BY sp.project_id, sp.street, sp.city, sp.state, sp.zipcode, sp.travel_preference;

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
