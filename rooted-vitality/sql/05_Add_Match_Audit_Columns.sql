-- ============================================================================
-- MIGRATION: Add Audit Columns to project_practitioner_matches Table
-- ============================================================================
-- This migration adds tracking columns to identify and monitor automatic match
-- creation to help debug and prevent the auto-matching bug.
--
-- Date: 2025-12-06
-- Purpose: Track match creation source and identify auto-created matches
-- ============================================================================

-- ============================================================================
-- STEP 1: Add audit columns to track match creation source
-- ============================================================================
-- These columns allow us to distinguish between auto-created and manual matches

ALTER TABLE project_practitioner_matches
ADD COLUMN IF NOT EXISTS creation_source TEXT DEFAULT 'manual_unknown',
ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'client_or_practitioner',
ADD COLUMN IF NOT EXISTS is_auto_created BOOLEAN DEFAULT FALSE;

-- Create index on creation_source for faster queries
CREATE INDEX IF NOT EXISTS idx_ppm_creation_source ON project_practitioner_matches(creation_source);
CREATE INDEX IF NOT EXISTS idx_ppm_is_auto_created ON project_practitioner_matches(is_auto_created);

-- ============================================================================
-- STEP 2: Identify existing auto-created matches
-- ============================================================================
-- Matches created within 2-8 seconds of project creation are likely auto-created
-- This helps us understand the scope of the bug and clean up bad data

UPDATE project_practitioner_matches ppm
SET 
  is_auto_created = TRUE,
  creation_source = 'auto_unknown_source',
  created_by = 'system'
WHERE 
  ppm.status = 'pending'
  AND ppm.creation_source = 'manual_unknown'  -- Only update if not already set
  AND (SELECT COUNT(*) FROM project_practitioner_matches ppm2 
       WHERE ppm2.project_serial = ppm.project_serial) = 1
  AND EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.project_serial = ppm.project_serial
    AND EXTRACT(EPOCH FROM (ppm.created_at - p.created_at)) BETWEEN 2 AND 8
  );

-- ============================================================================
-- STEP 3: Clean up auto-created matches
-- ============================================================================
-- This removes the auto-matches and returns system to correct state
-- where matches only exist when client/practitioner explicitly connects

DELETE FROM project_practitioner_matches
WHERE is_auto_created = TRUE;

-- ============================================================================
-- STEP 4: Create index for timestamp-based queries
-- ============================================================================
-- This helps with monitoring and debugging

CREATE INDEX IF NOT EXISTS idx_ppm_created_at ON project_practitioner_matches(created_at DESC);

-- ============================================================================
-- STEP 5: Verification Query
-- ============================================================================
-- Run this to confirm no auto-matches remain:
--
-- SELECT COUNT(*) as auto_match_count
-- FROM project_practitioner_matches
-- WHERE is_auto_created = TRUE;
--
-- Should return: 0

-- ============================================================================
-- ONGOING MONITORING QUERY
-- ============================================================================
-- Run this daily to detect if auto-matching resumes:
--
-- SELECT 
--   DATE(created_at) as date,
--   COUNT(*) as match_count,
--   COUNT(CASE WHEN is_auto_created = TRUE THEN 1 END) as auto_created_count,
--   creation_source,
--   COUNT(CASE WHEN EXTRACT(EPOCH FROM (created_at - (SELECT created_at FROM projects p WHERE p.project_serial = project_practitioner_matches.project_serial))) BETWEEN 2 AND 8 THEN 1 END) as suspicious_timing_count
-- FROM project_practitioner_matches
-- WHERE created_at > NOW() - INTERVAL '7 days'
-- GROUP BY DATE(created_at), creation_source
-- ORDER BY DATE(created_at) DESC;
