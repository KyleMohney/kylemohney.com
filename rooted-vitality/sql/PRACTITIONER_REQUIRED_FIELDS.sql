/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  SQL: PRACTITIONER_REQUIRED_FIELDS.sql                             ║
║  Purpose: Enforce NOT NULL constraints on all required            ║
║           practitioner signup fields to prevent incomplete         ║
║           practitioner records in the database                     ║
║  Date: November 6, 2025                                            ║
╚════════════════════════════════════════════════════════════════════╝
*/

-- ═══════════════════════════════════════════════════════════════════
-- ADD NOT NULL CONSTRAINTS TO PRACTITIONERS TABLE
-- ═══════════════════════════════════════════════════════════════════

-- 1. LEGAL NAME (Individual practitioner's name)
ALTER TABLE practitioners
ALTER COLUMN legal_name SET NOT NULL;

-- 2. LEGAL BUSINESS NAME
ALTER TABLE practitioners
ALTER COLUMN legal_business_name SET NOT NULL;

-- 3. DBA NAME (Doing Business As)
ALTER TABLE practitioners
ALTER COLUMN dba_name SET NOT NULL;

-- 4. PHONE
ALTER TABLE practitioners
ALTER COLUMN phone SET NOT NULL;

-- 5. PHYSICAL ADDRESS
ALTER TABLE practitioners
ALTER COLUMN physical_address SET NOT NULL;

-- 6. PRACTICE CITY
ALTER TABLE practitioners
ALTER COLUMN practice_city SET NOT NULL;

-- 7. PRACTICE STATE
ALTER TABLE practitioners
ALTER COLUMN practice_state SET NOT NULL;

-- 8. ZIPCODE
ALTER TABLE practitioners
ALTER COLUMN zipcode SET NOT NULL;

-- 9. YEAR ESTABLISHED
ALTER TABLE practitioners
ALTER COLUMN year_established SET NOT NULL;

-- 10. BUSINESS SIZE
ALTER TABLE practitioners
ALTER COLUMN business_size SET NOT NULL;

-- ═══════════════════════════════════════════════════════════════════
-- FIX EXISTING PRACTITIONERS WITH NULL REQUIRED FIELDS
-- ═══════════════════════════════════════════════════════════════════

-- Find practitioners with NULL legal_name (the 2 Kyle mentioned)
SELECT id, user_id, email, legal_name, legal_business_name, created_at 
FROM practitioners 
WHERE legal_name IS NULL 
ORDER BY created_at DESC;

-- If you need to delete or fix these practitioners, do it manually after 
-- reviewing which ones are incomplete:
-- DELETE FROM practitioners WHERE legal_name IS NULL;
-- OR update them with data and re-enable constraints

-- ═══════════════════════════════════════════════════════════════════
-- VERIFY CONSTRAINTS
-- ═══════════════════════════════════════════════════════════════════

-- After running this migration, verify all NOT NULL constraints exist:
SELECT 
    column_name, 
    is_nullable, 
    data_type
FROM information_schema.columns 
WHERE table_name = 'practitioners' 
  AND column_name IN (
    'legal_name', 
    'legal_business_name', 
    'dba_name', 
    'phone', 
    'physical_address', 
    'practice_city', 
    'practice_state', 
    'zipcode', 
    'year_established', 
    'business_size'
  )
ORDER BY column_name;

-- Should show all with is_nullable = 'NO'

-- ═══════════════════════════════════════════════════════════════════
-- NOTES
-- ═══════════════════════════════════════════════════════════════════
-- • These constraints work with the frontend validation in 
--   practitioner-signup.html and practitioner-signup.js
-- • The database will now REJECT any INSERT/UPDATE that has NULL 
--   in these critical fields
-- • This prevents the problem Kyle experienced where 2 practitioners 
--   signed up without legal_name
-- • If constraints fail on existing data, you'll need to clean up 
--   incomplete records first
