-- ═══════════════════════════════════════════════════════════════════════════
-- ROOTED VITALITY - DIAGNOSTIC QUERIES
-- Run these to check database health and verify complete setup
-- ═══════════════════════════════════════════════════════════════════════════

/*
Use these queries to verify:
- All tables were created
- All columns exist
- No duplicate columns
- No data integrity issues
- Sequences are working
- Indexes are in place
*/

-- ═══════════════════════════════════════════════════════════════════════════
-- DIAGNOSTIC 1: VERIFY ALL REQUIRED TABLES EXIST
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    table_name,
    CASE WHEN table_name IS NOT NULL THEN '✓ EXISTS' ELSE '✗ MISSING' END as status
FROM (
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name IN (
        'profiles',
        'practitioners',
        'background_checks',
        'credentials',
        'memberships',
        'serial_number_registry',
        'opportunities'
    )
) t
ORDER BY table_name;

-- Expected: 7 rows, all with '✓ EXISTS'

-- ═══════════════════════════════════════════════════════════════════════════
-- DIAGNOSTIC 2: CHECK FOR DUPLICATE COLUMNS (Should be empty)
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    column_name,
    COUNT(*) as duplicate_count
FROM information_schema.columns 
WHERE table_name = 'practitioners'
GROUP BY column_name 
HAVING COUNT(*) > 1
ORDER BY column_name;

-- Expected: No rows (empty result set)

-- ═══════════════════════════════════════════════════════════════════════════
-- DIAGNOSTIC 3: LIST ALL PRACTITIONERS TABLE COLUMNS
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    ordinal_position as "Pos",
    column_name as "Column",
    data_type as "Type",
    is_nullable as "Nullable",
    column_default as "Default"
FROM information_schema.columns 
WHERE table_name = 'practitioners'
ORDER BY ordinal_position;

-- ═══════════════════════════════════════════════════════════════════════════
-- DIAGNOSTIC 4: VERIFY KEY PROFILE-RELATED COLUMNS IN PRACTITIONERS
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    column_name,
    data_type,
    CASE WHEN is_nullable = 'YES' THEN 'nullable' ELSE 'NOT NULL' END as nullable_status
FROM information_schema.columns 
WHERE table_name = 'practitioners' 
AND column_name IN (
    'bio',
    'ethos_statement',
    'social_media',
    'languages',
    'faq',
    'location',
    'years_in_practice',
    'business_size',
    'profile_photo_url',
    'serial_number',
    'email'
)
ORDER BY column_name;

-- Expected: All 11 columns present with correct types

-- ═══════════════════════════════════════════════════════════════════════════
-- DIAGNOSTIC 5: CHECK ROW COUNTS IN ALL TABLES
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    'profiles' as table_name, COUNT(*) as row_count FROM profiles
UNION ALL
SELECT 'practitioners', COUNT(*) FROM practitioners
UNION ALL
SELECT 'background_checks', COUNT(*) FROM background_checks
UNION ALL
SELECT 'credentials', COUNT(*) FROM credentials
UNION ALL
SELECT 'memberships', COUNT(*) FROM memberships
UNION ALL
SELECT 'serial_number_registry', COUNT(*) FROM serial_number_registry
UNION ALL
SELECT 'opportunities', COUNT(*) FROM opportunities
ORDER BY table_name;

-- ═══════════════════════════════════════════════════════════════════════════
-- DIAGNOSTIC 6: VERIFY SEQUENCES ARE WORKING
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    sequencename as "Sequence",
    last_value as "Current Value",
    increment_by as "Increment"
FROM pg_sequences 
WHERE sequencename IN (
    'client_serial_sequence',
    'practitioner_serial_sequence',
    'opportunity_serial_sequence'
)
ORDER BY sequencename;

-- Expected: 3 sequences with values >= start values (10000, 20000, 30000)

-- ═══════════════════════════════════════════════════════════════════════════
-- DIAGNOSTIC 7: CHECK INDEXES EXIST
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'practitioners', 'serial_number_registry', 'opportunities')
ORDER BY tablename, indexname;

-- Expected: ~25+ indexes across all tables

-- ═══════════════════════════════════════════════════════════════════════════
-- DIAGNOSTIC 8: VERIFY FUNCTIONS EXIST
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    p.proname as "Function",
    pg_get_functiondef(p.oid) as "Definition" 
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
    'generate_serial_number',
    'lookup_by_serial',
    'generate_opportunity_serial'
)
ORDER BY p.proname;

-- Expected: 3 functions defined

-- ═══════════════════════════════════════════════════════════════════════════
-- DIAGNOSTIC 9: CHECK DATA TYPES IN KEY COLUMNS
-- ═══════════════════════════════════════════════════════════════════════════

SELECT
    column_name,
    data_type,
    CASE 
        WHEN column_name = 'social_media' AND data_type = 'jsonb' THEN '✓ Correct'
        WHEN column_name = 'faq' AND data_type = 'jsonb' THEN '✓ Correct'
        WHEN column_name = 'languages' AND data_type = 'ARRAY' THEN '✓ Correct'
        WHEN column_name = 'bio' AND data_type = 'text' THEN '✓ Correct'
        WHEN column_name = 'ethos_statement' AND data_type = 'text' THEN '✓ Correct'
        ELSE '⚠ Check'
    END as status
FROM information_schema.columns
WHERE table_name = 'practitioners'
AND column_name IN ('bio', 'ethos_statement', 'social_media', 'languages', 'faq')
ORDER BY column_name;

-- ═══════════════════════════════════════════════════════════════════════════
-- DIAGNOSTIC 10: CHECK SERIAL NUMBER REGISTRY
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    entity_type,
    COUNT(*) as count,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
FROM serial_number_registry
GROUP BY entity_type
ORDER BY entity_type;

-- Shows distribution of serials by type

-- ═══════════════════════════════════════════════════════════════════════════
-- DIAGNOSTIC 11: CHECK FOR NULL SERIALS (Potential Issue)
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    'profiles' as table_name,
    COUNT(*) as rows_without_serial
FROM profiles
WHERE serial_number IS NULL
UNION ALL
SELECT 
    'practitioners',
    COUNT(*)
FROM practitioners
WHERE serial_number IS NULL
UNION ALL
SELECT 
    'opportunities',
    COUNT(*)
FROM opportunities
WHERE serial_number IS NULL;

-- If any rows > 0, run backfill migration from master setup

-- ═══════════════════════════════════════════════════════════════════════════
-- DIAGNOSTIC 12: CONSTRAINTS CHECK
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    constraint_name,
    table_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
AND table_name IN ('practitioners', 'opportunities', 'serial_number_registry')
ORDER BY table_name, constraint_name;

-- ═══════════════════════════════════════════════════════════════════════════
-- DIAGNOSTIC 13: SAMPLE DATA (If you have data)
-- ═══════════════════════════════════════════════════════════════════════════

-- View first 5 practitioners:
-- SELECT id, email, legal_business_name, serial_number, bio, ethos_statement 
-- FROM practitioners LIMIT 5;

-- View first 5 serial registries:
-- SELECT serial_number, entity_type, email, name, created_at 
-- FROM serial_number_registry LIMIT 5;

-- View opportunities by status:
-- SELECT status, COUNT(*) FROM opportunities GROUP BY status;

-- ═══════════════════════════════════════════════════════════════════════════
-- DIAGNOSTIC 14: QUICK HEALTH CHECK (Run this to get overview)
-- ═══════════════════════════════════════════════════════════════════════════

WITH health_check AS (
    SELECT 
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('profiles', 'practitioners', 'serial_number_registry', 'opportunities')) as tables_count,
        (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname IN ('generate_serial_number', 'lookup_by_serial', 'generate_opportunity_serial')) as functions_count,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'practitioners' AND column_name IN ('bio', 'ethos_statement', 'social_media', 'languages', 'faq', 'location', 'years_in_practice', 'serial_number')) as key_columns_count
)
SELECT 
    CASE WHEN tables_count = 4 THEN '✓' ELSE '✗' END || ' Core Tables (expected: 4)' as check_1,
    CASE WHEN functions_count = 3 THEN '✓' ELSE '✗' END || ' Serial Functions (expected: 3)' as check_2,
    CASE WHEN key_columns_count = 8 THEN '✓' ELSE '✗' END || ' Key Columns (expected: 8)' as check_3
FROM health_check;

-- ═══════════════════════════════════════════════════════════════════════════
-- END OF DIAGNOSTIC QUERIES
-- ═══════════════════════════════════════════════════════════════════════════
