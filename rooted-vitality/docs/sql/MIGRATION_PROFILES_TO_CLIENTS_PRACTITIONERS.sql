-- ============================================================
-- MIGRATION: Consolidate profiles table into clients & practitioners
-- ============================================================
-- This migration moves all user data from the generic 'profiles' table
-- into role-specific 'clients' and 'practitioners' tables.
-- ============================================================

-- STEP 1: Backup the profiles table (just in case)
-- CREATE TABLE profiles_backup AS SELECT * FROM profiles;

-- STEP 2: Update clients table with data from profiles (for client records)
-- Get email, first_name, last_name, phone, age, sex, avatar_url from profiles
UPDATE clients c
SET 
  email = p.email,
  first_name = p.first_name,
  last_name = p.last_name,
  phone = p.phone,
  age = p.age,
  sex = p.sex,
  avatar_url = p.avatar_url,
  updated_at = p.updated_at
FROM profiles p
WHERE c.user_id = p.id
  AND p.role = 'client';

-- STEP 3: Update practitioners table with data from profiles (for practitioner records)
UPDATE practitioners pr
SET 
  email = p.email,
  first_name = p.first_name,
  last_name = p.last_name,
  phone = p.phone,
  avatar_url = p.avatar_url,
  updated_at = p.updated_at
FROM profiles p
WHERE pr.user_id = p.id
  AND p.role = 'practitioner';

-- STEP 4: Verify the migration
-- SELECT 'Clients updated:' as check, COUNT(*) FROM clients WHERE email IS NOT NULL;
-- SELECT 'Practitioners updated:' as check, COUNT(*) FROM practitioners WHERE email IS NOT NULL;

-- STEP 5: After verification, drop the profiles table
-- DROP TABLE profiles CASCADE;
