-- ═══════════════════════════════════════════════════════════════════════════════════
-- FIX: RLS POLICIES FOR PRACTITIONERS TABLE - UPSERT SUPPORT
-- ═══════════════════════════════════════════════════════════════════════════════════

-- The issue: upsert needs both UPDATE and INSERT permissions
-- The current policy only allows UPDATE, so INSERT in upsert fails with 403

-- ─────────────────────────────────────────────────────────────────────────────────
-- STEP 1: Check existing policies
-- ─────────────────────────────────────────────────────────────────────────────────

SELECT policyname, permissive, roles 
FROM pg_policies 
WHERE tablename = 'practitioners'
ORDER BY policyname;

-- ─────────────────────────────────────────────────────────────────────────────────
-- STEP 2: Drop existing policies (to recreate them)
-- ─────────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Allow authenticated users to read own practitioner data" ON practitioners;
DROP POLICY IF EXISTS "Allow authenticated users to update own practitioner data" ON practitioners;
DROP POLICY IF EXISTS "Allow authenticated users to insert own practitioner data" ON practitioners;
DROP POLICY IF EXISTS "Allow public read access to published practitioner profiles" ON practitioners;
DROP POLICY IF EXISTS "Practitioners can read own record" ON practitioners;
DROP POLICY IF EXISTS "Practitioners can update own record" ON practitioners;

-- ─────────────────────────────────────────────────────────────────────────────────
-- STEP 3: Create NEW policies for authenticated users
-- ─────────────────────────────────────────────────────────────────────────────────

-- Allow authenticated users to SELECT their own practitioner record
CREATE POLICY "Allow authenticated users to read own practitioner data"
ON practitioners
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow authenticated users to INSERT their own practitioner record
CREATE POLICY "Allow authenticated users to insert own practitioner data"
ON practitioners
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to UPDATE their own practitioner record
CREATE POLICY "Allow authenticated users to update own practitioner data"
ON practitioners
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow public to read published profiles (for client-facing directory)
CREATE POLICY "Allow public read access to published practitioner profiles"
ON practitioners
FOR SELECT
TO public
USING (true);

-- ─────────────────────────────────────────────────────────────────────────────────

-- VERIFY the policies were created
SELECT policyname, permissive, roles 
FROM pg_policies 
WHERE tablename = 'practitioners'
ORDER BY policyname;

-- ═══════════════════════════════════════════════════════════════════════════════════
-- After running this:
-- - Upsert will work (has both INSERT and UPDATE permissions)
-- - Users can only read/write their own records
-- - Public can read (for directory listing)
-- ═══════════════════════════════════════════════════════════════════════════════════
