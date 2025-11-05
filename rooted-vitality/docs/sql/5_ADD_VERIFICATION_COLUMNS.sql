-- ═══════════════════════════════════════════════════════════════════════════
-- ROOTED VITALITY - ADD BUSINESS VERIFICATION COLUMNS
-- Adds columns to support business verification submission and tracking
-- ═══════════════════════════════════════════════════════════════════════════

/*
This migration adds the following columns to the practitioners table:
- verification_submitted: BOOLEAN - Whether practitioner submitted verification docs
- verification_ein_ssn: TEXT - Encrypted EIN or SSN (stored by admin only)
- verification_id_front_url: TEXT - URL to front of ID photo in storage
- verification_id_back_url: TEXT - URL to back of ID photo in storage
- verification_submitted_at: TIMESTAMP - When verification was submitted
- verification_approved_at: TIMESTAMP - When admin approved (future)
- verification_status: TEXT - Status of verification (pending, approved, rejected)

Run this SQL in Supabase SQL Editor to add the columns.
*/

-- Add verification columns to practitioners table
ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS verification_submitted BOOLEAN DEFAULT false;
ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS verification_ein_ssn TEXT;
ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS verification_id_front_url TEXT;
ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS verification_id_back_url TEXT;
ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS verification_submitted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS verification_approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected'));

-- Create index for faster verification status queries
CREATE INDEX IF NOT EXISTS idx_practitioners_verification_status ON practitioners(verification_status);
CREATE INDEX IF NOT EXISTS idx_practitioners_verification_submitted ON practitioners(verification_submitted);

-- Add comment to verification columns for documentation
COMMENT ON COLUMN practitioners.verification_submitted IS 'Whether the practitioner has submitted business verification documents';
COMMENT ON COLUMN practitioners.verification_ein_ssn IS 'Encrypted EIN or SSN for business verification (admin only)';
COMMENT ON COLUMN practitioners.verification_id_front_url IS 'URL to front of ID photo stored in verification-documents bucket';
COMMENT ON COLUMN practitioners.verification_id_back_url IS 'URL to back of ID photo stored in verification-documents bucket';
COMMENT ON COLUMN practitioners.verification_submitted_at IS 'Timestamp when verification documents were submitted';
COMMENT ON COLUMN practitioners.verification_approved_at IS 'Timestamp when admin approved the verification';
COMMENT ON COLUMN practitioners.verification_status IS 'Current status of verification: pending, approved, or rejected';

-- Verify columns were created
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'practitioners' 
AND column_name LIKE 'verification%'
ORDER BY ordinal_position DESC
LIMIT 7;
