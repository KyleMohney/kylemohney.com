-- ═══════════════════════════════════════════════════════════════════════════════════
-- FIX: Drop foreign key pointing to non-existent users table
-- ═══════════════════════════════════════════════════════════════════════════════════

-- Step 1: Find the constraint name
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'practitioners' AND constraint_type = 'FOREIGN KEY';

-- Step 2: Drop the problematic foreign key (replace CONSTRAINT_NAME with actual name)
-- ALTER TABLE practitioners DROP CONSTRAINT practitioners_user_id_fkey;

-- Step 3: Create new foreign key pointing to auth.users (Supabase built-in)
-- ALTER TABLE practitioners 
-- ADD CONSTRAINT practitioners_user_id_fkey 
-- FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 4: If you want to remove the FK constraint entirely (less restrictive):
-- ALTER TABLE practitioners DROP CONSTRAINT practitioners_user_id_fkey;
