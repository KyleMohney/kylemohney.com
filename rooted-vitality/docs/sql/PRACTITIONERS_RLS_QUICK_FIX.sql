-- ═══════════════════════════════════════════════════════════════════════════════════
-- QUICK FIX: RLS POLICIES FOR PRACTITIONERS TABLE
-- Copy and paste this entire script into Supabase SQL Editor and run it
-- ═══════════════════════════════════════════════════════════════════════════════════

-- Step 1: Enable RLS on practitioners table
ALTER TABLE practitioners ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read own practitioner data" ON practitioners;
DROP POLICY IF EXISTS "Allow authenticated users to update own practitioner data" ON practitioners;
DROP POLICY IF EXISTS "Allow authenticated users to insert own practitioner data" ON practitioners;
DROP POLICY IF EXISTS "Allow public read access to published practitioner profiles" ON practitioners;
DROP POLICY IF EXISTS "Practitioners can read own record" ON practitioners;
DROP POLICY IF EXISTS "Practitioners can update own record" ON practitioners;
DROP POLICY IF EXISTS "Allow users to read their own profile" ON practitioners;
DROP POLICY IF EXISTS "Allow users to create their own profile" ON practitioners;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON practitioners;
DROP POLICY IF EXISTS "Public profiles are readable" ON practitioners;

-- Step 3: Create new permissive policies for authenticated users

-- Policy 1: Authenticated users can SELECT (read) their own record
CREATE POLICY "authenticated_select_own"
ON practitioners
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2: Authenticated users can INSERT (create) their own record
CREATE POLICY "authenticated_insert_own"
ON practitioners
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Authenticated users can UPDATE (modify) their own record
CREATE POLICY "authenticated_update_own"
ON practitioners
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Public can SELECT (read) all records
CREATE POLICY "public_select_all"
ON practitioners
FOR SELECT
TO public
USING (true);

-- Step 4: Verify policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'practitioners'
ORDER BY policyname;

-- ═══════════════════════════════════════════════════════════════════════════════════
-- That's it! The policies are now set up to allow:
-- ✓ Authenticated users INSERT their own records (needed for upsert)
-- ✓ Authenticated users UPDATE their own records (needed for upsert)
-- ✓ Authenticated users SELECT their own records
-- ✓ Public users SELECT all records (for directory)
-- ═══════════════════════════════════════════════════════════════════════════════════
