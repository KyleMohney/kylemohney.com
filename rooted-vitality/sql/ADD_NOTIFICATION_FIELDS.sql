-- ============================================================================
-- ADD NOTIFICATION FIELDS TO project_practitioner_matches TABLE
-- ============================================================================
-- This migration ensures that the project_practitioner_matches table has
-- all necessary fields for the enhanced notification system

BEGIN;

-- Add match_score if it doesn't exist
ALTER TABLE project_practitioner_matches
ADD COLUMN IF NOT EXISTS match_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS distance_miles NUMERIC(8,2) DEFAULT NULL;

-- Add comment explaining these fields
COMMENT ON COLUMN project_practitioner_matches.match_score IS 'Quality score (0-100) from matching algorithm based on category, distance, payment, insurance, credentials, reviews';
COMMENT ON COLUMN project_practitioner_matches.distance_miles IS 'Distance in miles between practitioner base zipcode and project zipcode';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_project_practitioner_matches_status_created 
ON project_practitioner_matches(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_project_practitioner_matches_practitioner_status
ON project_practitioner_matches(practitioner_id, status);

-- Verify columns exist
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'project_practitioner_matches'
  AND column_name IN ('match_score', 'distance_miles', 'status', 'created_at')
ORDER BY ordinal_position;

COMMIT;
