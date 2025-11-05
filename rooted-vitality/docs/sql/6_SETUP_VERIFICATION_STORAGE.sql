-- ═══════════════════════════════════════════════════════════════════════════
-- ROOTED VITALITY - SUPABASE STORAGE SETUP
-- Create storage bucket for business verification documents
-- ═══════════════════════════════════════════════════════════════════════════

/*
IMPORTANT: This is configuration guidance for the Supabase dashboard.
Do NOT run this in the SQL editor. Instead, follow the steps below in 
the Supabase dashboard UI.

STEPS:
1. Go to Supabase Dashboard → Storage section
2. Create a new bucket called "verification-documents"
3. Set it to PRIVATE (not public)
4. Update the RLS policies as shown below

After creating the bucket, run the SQL policy code below to restrict access.
*/

-- ═══════════════════════════════════════════════════════════════════════════
-- SQL: Run these policies in the SQL Editor after creating the bucket
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable RLS on verification-documents bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow practitioners to upload their own verification documents
CREATE POLICY "Practitioners can upload verification docs" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'verification-documents' 
        AND auth.uid() IS NOT NULL
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Policy 2: Allow practitioners to view their own verification documents
CREATE POLICY "Practitioners can view own verification docs" ON storage.objects
    FOR SELECT
    WITH CHECK (
        bucket_id = 'verification-documents'
        AND auth.uid() IS NOT NULL
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Policy 3: Allow admins to view all verification documents
CREATE POLICY "Admins can view all verification docs" ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'verification-documents'
        AND EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.role = 'admin'
        )
    );

-- ═══════════════════════════════════════════════════════════════════════════
-- FILE STRUCTURE
-- ═══════════════════════════════════════════════════════════════════════════

/*
Verification documents are stored in this structure:
verification-documents/
├── {user_id}/
│   ├── verification-id-front-{user_id}-{timestamp}
│   ├── verification-id-back-{user_id}-{timestamp}
│   └── ... (other doc uploads)

This ensures:
- User isolation (user_id in folder path)
- Multiple submissions allowed (timestamp in filename)
- Easy retrieval and admin review
*/

-- ═══════════════════════════════════════════════════════════════════════════
-- TESTING - Check bucket exists and policies applied
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    name,
    owner,
    public 
FROM storage.buckets 
WHERE name = 'verification-documents';

SELECT 
    name,
    definition
FROM pg_policies
WHERE tablename = 'objects'
AND definition LIKE '%verification-documents%'
ORDER BY policyname;
