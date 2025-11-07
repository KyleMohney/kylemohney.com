-- ============================================================================
-- DIAGNOSTIC QUERIES
-- Rooted Vitality Platform
-- ============================================================================
-- Common queries for debugging and checking database state
-- Created: 2025-11-05
-- ============================================================================


-- ============================================================================
-- CHECK TABLE STRUCTURES
-- ============================================================================

-- List all columns for a specific table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'YOUR_TABLE_NAME'
ORDER BY ordinal_position;


-- List all tables in schema
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;


-- ============================================================================
-- CHECK RLS POLICIES
-- ============================================================================

-- View all RLS policies for a table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'YOUR_TABLE_NAME'
ORDER BY cmd, policyname;


-- Check if RLS is enabled on tables
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;


-- ============================================================================
-- CHECK FOREIGN KEYS
-- ============================================================================

-- List all foreign key constraints
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;


-- ============================================================================
-- CHECK INDEXES
-- ============================================================================

-- List all indexes on a table
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'YOUR_TABLE_NAME'
ORDER BY indexname;


-- ============================================================================
-- DATA CHECKS
-- ============================================================================

-- Count records in all main tables
SELECT 'clients' AS table_name, COUNT(*) AS count FROM clients
UNION ALL
SELECT 'practitioners', COUNT(*) FROM practitioners
UNION ALL
SELECT 'projects', COUNT(*) FROM projects
UNION ALL
SELECT 'project_practitioner_matches', COUNT(*) FROM project_practitioner_matches
UNION ALL
SELECT 'reviews', COUNT(*) FROM reviews;


-- Check serial number sequences
SELECT 
  'clients' AS table_name,
  MAX(CAST(SUBSTRING(serial_number FROM 2) AS INTEGER)) AS max_serial
FROM clients
WHERE serial_number ~ '^C[0-9]+$'
UNION ALL
SELECT 
  'practitioners',
  MAX(CAST(SUBSTRING(serial_number FROM 2) AS INTEGER))
FROM practitioners
WHERE serial_number ~ '^P[0-9]+$';


-- Check projects by status
SELECT 
  project_status,
  COUNT(*) AS count
FROM projects
GROUP BY project_status
ORDER BY count DESC;


-- Check practitioner coverage settings
SELECT 
  serial_number,
  in_person_enabled,
  housecalls_enabled,
  virtual_enabled,
  timezone
FROM practitioners
ORDER BY serial_number;


-- ============================================================================
-- USER & AUTHENTICATION CHECKS
-- ============================================================================

-- Find client by user_id
SELECT 
  serial_number,
  email,
  first_name,
  last_name,
  open_to_contact
FROM clients
WHERE user_id = 'YOUR_USER_UUID';


-- Find practitioner by user_id
SELECT 
  serial_number,
  email,
  first_name,
  last_name,
  business_name,
  timezone
FROM practitioners
WHERE user_id = 'YOUR_USER_UUID';


-- ============================================================================
-- PROJECT & MATCH QUERIES
-- ============================================================================

-- Get projects for a specific client
SELECT 
  project_id,
  project_status,
  travel_preference,
  zipcode,
  state,
  start_date,
  created_at
FROM projects
WHERE client_serial = 'C1'
ORDER BY created_at DESC;


-- Get matches for a specific project
SELECT 
  practitioner_serial,
  client_serial,
  status,
  match_score,
  created_at
FROM project_practitioner_matches
WHERE project_id = (SELECT id FROM projects WHERE project_id = 1)
ORDER BY match_score DESC;


-- ============================================================================
-- PERFORMANCE CHECKS
-- ============================================================================

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;


-- Check slow queries (if pg_stat_statements extension enabled)
-- SELECT
--   query,
--   calls,
--   mean_exec_time,
--   total_exec_time
-- FROM pg_stat_statements
-- ORDER BY mean_exec_time DESC
-- LIMIT 10;


-- ============================================================================
-- END OF DIAGNOSTIC QUERIES
-- ============================================================================
