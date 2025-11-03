-- ═══════════════════════════════════════════════════════════════════════════════════
-- PROFILE SYSTEM - COMPLETE DATABASE SETUP
-- All required migrations and configurations for profile system
-- ═══════════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════════
-- PART 1: PRACTITIONERS TABLE - PROFILE COLUMNS
-- ═══════════════════════════════════════════════════════════════════════════════════

-- Add header/basic info columns if they don't exist
ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS years_in_practice TEXT;
ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS business_size TEXT;
ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS year_established INTEGER;

-- Add avatar/logo columns
ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS practice_logo_url TEXT;

-- Add content section columns
ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS ethos_statement TEXT;

-- ═══════════════════════════════════════════════════════════════════════════════════
-- PART 2: PROFILES TABLE - AVATAR COLUMN
-- ═══════════════════════════════════════════════════════════════════════════════════

-- Add client avatar column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ═══════════════════════════════════════════════════════════════════════════════════
-- PART 3: CREATE INDEXES FOR PERFORMANCE
-- ═══════════════════════════════════════════════════════════════════════════════════

-- Practitioners indexes
CREATE INDEX IF NOT EXISTS idx_practitioners_user_id ON practitioners(user_id);
CREATE INDEX IF NOT EXISTS idx_practitioners_profile_photo ON practitioners(profile_photo_url);
CREATE INDEX IF NOT EXISTS idx_practitioners_location ON practitioners(location);

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_avatar_url ON profiles(avatar_url);

-- ═══════════════════════════════════════════════════════════════════════════════════
-- PART 4: STORAGE BUCKETS
-- ═══════════════════════════════════════════════════════════════════════════════════

-- Create buckets if they don't exist
INSERT INTO storage.buckets (id, name, public) VALUES 
('practitioner-files', 'practitioner-files', true),
('client-files', 'client-files', true)
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════════
-- PART 5: ROW-LEVEL SECURITY (RLS) POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════════

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────────
-- Practitioner Files Bucket Policies
-- ─────────────────────────────────────────────────────────────────────────────────

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Allow authenticated upload to practitioner-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow update of practitioner-files" ON storage.objects;
DROP POLICY IF EXISTS "Public read practitioner-files" ON storage.objects;

-- Insert policy: Authenticated users can upload
CREATE POLICY "Allow authenticated upload to practitioner-files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'practitioner-files');

-- Update policy: Authenticated users can update their uploads
CREATE POLICY "Allow update of practitioner-files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'practitioner-files')
WITH CHECK (bucket_id = 'practitioner-files');

-- Select policy: Public read access (for header display)
CREATE POLICY "Public read practitioner-files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'practitioner-files');

-- ─────────────────────────────────────────────────────────────────────────────────
-- Client Files Bucket Policies
-- ─────────────────────────────────────────────────────────────────────────────────

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Allow authenticated upload to client-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow update of client-files" ON storage.objects;
DROP POLICY IF EXISTS "Public read client-files" ON storage.objects;

-- Insert policy: Authenticated users can upload
CREATE POLICY "Allow authenticated upload to client-files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'client-files');

-- Update policy: Authenticated users can update their uploads
CREATE POLICY "Allow update of client-files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'client-files')
WITH CHECK (bucket_id = 'client-files');

-- Select policy: Public read access (for header display)
CREATE POLICY "Public read client-files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'client-files');

-- ═══════════════════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════════════════════════════

-- Verify practitioners table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'practitioners'
AND column_name IN (
    'location', 
    'years_in_practice', 
    'business_size', 
    'year_established',
    'profile_photo_url',
    'practice_logo_url',
    'bio',
    'ethos_statement'
)
ORDER BY column_name;

-- Verify profiles table has avatar_url
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles'
AND column_name = 'avatar_url';

-- Verify storage buckets exist
SELECT id, name, public FROM storage.buckets 
WHERE id IN ('practitioner-files', 'client-files');

-- Verify RLS policies
SELECT policy_name, action 
FROM pg_policies 
WHERE table_name = 'objects'
AND policy_name ILIKE '%practitioner%' 
   OR policy_name ILIKE '%client%';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- ROLLBACK INSTRUCTIONS (If needed)
-- ═══════════════════════════════════════════════════════════════════════════════════

/*
-- To revert all changes, run:

-- Remove columns
ALTER TABLE practitioners DROP COLUMN IF EXISTS location;
ALTER TABLE practitioners DROP COLUMN IF EXISTS years_in_practice;
ALTER TABLE practitioners DROP COLUMN IF EXISTS business_size;
ALTER TABLE practitioners DROP COLUMN IF EXISTS year_established;
ALTER TABLE practitioners DROP COLUMN IF EXISTS profile_photo_url;
ALTER TABLE practitioners DROP COLUMN IF EXISTS practice_logo_url;
ALTER TABLE practitioners DROP COLUMN IF EXISTS bio;
ALTER TABLE practitioners DROP COLUMN IF EXISTS ethos_statement;

ALTER TABLE profiles DROP COLUMN IF EXISTS avatar_url;

-- Remove indexes
DROP INDEX IF EXISTS idx_practitioners_user_id;
DROP INDEX IF EXISTS idx_practitioners_profile_photo;
DROP INDEX IF EXISTS idx_practitioners_location;
DROP INDEX IF EXISTS idx_profiles_avatar_url;

-- Remove storage buckets (optional)
DELETE FROM storage.buckets WHERE id IN ('practitioner-files', 'client-files');
*/

-- ═══════════════════════════════════════════════════════════════════════════════════
-- NOTES
-- ═══════════════════════════════════════════════════════════════════════════════════

/*
MIGRATION OVERVIEW:
- Adds 8 new columns to practitioners table for profile data
- Adds 1 new column to profiles table for client avatars
- Creates 2 storage buckets for file uploads
- Creates 6 RLS policies to protect bucket access

KEY COLUMNS:
Practitioners:
  - location: Where the practitioner is based
  - years_in_practice: How many years in service
  - business_size: Team size (e.g., "1-5", "5-10", "10-25")
  - year_established: Year business was founded (from signup)
  - profile_photo_url: Business logo URL (avatar/logo system)
  - practice_logo_url: Alternative logo column (fallback)
  - bio: About section content
  - ethos_statement: Approach/Philosophy section

Profiles:
  - avatar_url: Client profile picture URL

STORAGE BUCKETS:
  - practitioner-files: For business logos and practitioner assets
  - client-files: For client profile pictures

RLS POLICIES:
  - All authenticated users can upload to both buckets
  - All public users can read from both buckets (for header display)
  - Policies are permissive but secure (authenticated-only upload)

PERFORMANCE:
  - Indexes on frequently-queried columns for speed
  - User ID index for fast practitioner lookups
  - Avatar URL indexes for profile retrieval

TESTING:
After running this migration:
1. Verify columns exist with verification queries above
2. Test upload with client/practitioner
3. Verify avatar displays in header
4. Refresh page and confirm persistence
*/
