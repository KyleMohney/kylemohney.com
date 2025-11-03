-- ═══════════════════════════════════════════════════════════════════════════════════
-- PRACTITIONERS TABLE - FINAL RLS POLICIES (PRODUCTION READY)
-- These policies work with the UPDATE-then-INSERT pattern in the app
-- ═══════════════════════════════════════════════════════════════════════════════════

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read own practitioner data" ON practitioners;
DROP POLICY IF EXISTS "Allow authenticated users to insert own practitioner data" ON practitioners;
DROP POLICY IF EXISTS "Allow authenticated users to update own practitioner data" ON practitioners;
DROP POLICY IF EXISTS "Allow public read access to published practitioner profiles" ON practitioners;
DROP POLICY IF EXISTS "authenticated_select_own" ON practitioners;
DROP POLICY IF EXISTS "authenticated_insert_own" ON practitioners;
DROP POLICY IF EXISTS "authenticated_update_own" ON practitioners;
DROP POLICY IF EXISTS "public_select_all" ON practitioners;
DROP POLICY IF EXISTS "select_policy" ON practitioners;
DROP POLICY IF EXISTS "insert_policy" ON practitioners;
DROP POLICY IF EXISTS "update_policy" ON practitioners;

-- ─────────────────────────────────────────────────────────────────────────────────
-- FINAL POLICIES: Simple and working
-- ─────────────────────────────────────────────────────────────────────────────────

-- Policy 1: SELECT - Authenticated users can read their own
CREATE POLICY "practitioners_authenticated_select"
ON practitioners
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2: SELECT - Public can read all (for directory)
CREATE POLICY "practitioners_public_select"
ON practitioners
FOR SELECT
TO public
USING (true);

-- Policy 3: INSERT - Authenticated users can insert (checks user_id matches auth)
CREATE POLICY "practitioners_authenticated_insert"
ON practitioners
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy 4: UPDATE - Authenticated users can update their own
CREATE POLICY "practitioners_authenticated_update"
ON practitioners
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────────
-- Verify policies are in place
-- ─────────────────────────────────────────────────────────────────────────────────

SELECT 
    policyname,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'practitioners'
ORDER BY policyname;

-- ═══════════════════════════════════════════════════════════════════════════════════
-- IMPORTANT NOTES:
-- - These policies allow authenticated users to read, insert, and update their own records
-- - Public users can read all records (for client-facing practitioner directory)
-- - The app uses UPDATE-then-INSERT pattern, so both operations need to work
-- - If auth.uid() = user_id check is causing issues, it will show as 403 Forbidden
-- ═══════════════════════════════════════════════════════════════════════════════════
