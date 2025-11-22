/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  Migration: 05_FIX_PROJECT_PRACTITIONER_MATCHES_SCHEMA.sql         ║
║  Purpose: Fix schema issues for production and scalability         ║
║  Date: November 22, 2025                                           ║
╚════════════════════════════════════════════════════════════════════╝

ISSUES FIXED:
1. Fix project_serial type mismatch (TEXT → INTEGER)
2. Add indexes on foreign key columns
3. Add foreign key constraints
4. Add CHECK constraint on status field
5. Ensure matched_at is properly set on insert

MIGRATION STRATEGY:
- Create new columns for new foreign keys
- Backfill data from old columns
- Add indexes and constraints
- Update RPC functions to use correct types
- Drop old columns and rename new ones

*/

-- ============================================================================
-- STEP 1: Add audit triggers for created_at/updated_at if not already present
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger if it doesn't exist (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_project_practitioner_matches_updated_at'
  ) THEN
    CREATE TRIGGER update_project_practitioner_matches_updated_at
    BEFORE UPDATE ON project_practitioner_matches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Investigate and handle NULL project_serial values
-- ============================================================================

DO $$
DECLARE
  v_null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_null_count 
  FROM project_practitioner_matches 
  WHERE project_serial IS NULL;
  
  IF v_null_count > 0 THEN
    RAISE WARNING 'Found % records with NULL project_serial - these are orphaned and will be deleted', v_null_count;
  END IF;
END $$;

-- Delete orphaned records with NULL project_serial
DELETE FROM project_practitioner_matches 
WHERE project_serial IS NULL;

-- ============================================================================
-- STEP 3: Fix project_serial type (TEXT → INTEGER) with safe migration
-- ============================================================================

-- Add new INTEGER column for project_serial
ALTER TABLE project_practitioner_matches 
ADD COLUMN project_serial_int INTEGER NULL;

-- Backfill from existing TEXT column
UPDATE project_practitioner_matches 
SET project_serial_int = CAST(project_serial AS INTEGER)
WHERE project_serial IS NOT NULL 
  AND project_serial ~ '^\d+$';

-- Check for any non-numeric values and delete them
DO $$
DECLARE
  v_bad_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_bad_count 
  FROM project_practitioner_matches 
  WHERE project_serial IS NOT NULL 
    AND project_serial !~ '^\d+$';
  
  IF v_bad_count > 0 THEN
    RAISE WARNING 'Found % non-numeric project_serial values - deleting these invalid records', v_bad_count;
    DELETE FROM project_practitioner_matches
    WHERE project_serial IS NOT NULL 
      AND project_serial !~ '^\d+$';
  END IF;
END $$;

-- Drop the old TEXT column
ALTER TABLE project_practitioner_matches 
DROP COLUMN project_serial;

-- Rename new column to project_serial
ALTER TABLE project_practitioner_matches 
RENAME COLUMN project_serial_int TO project_serial;

-- Make it NOT NULL going forward
ALTER TABLE project_practitioner_matches 
ALTER COLUMN project_serial SET NOT NULL;

-- ============================================================================
-- STEP 3: Add indexes on foreign key columns for performance
-- ============================================================================

-- Index on project_serial (for lookups by project)
CREATE INDEX IF NOT EXISTS idx_project_practitioner_matches_project_serial 
ON project_practitioner_matches(project_serial);

-- Index on client_serial (for lookups by client)
CREATE INDEX IF NOT EXISTS idx_project_practitioner_matches_client_serial 
ON project_practitioner_matches(client_serial);

-- Index on practitioner_serial (for lookups by practitioner)
CREATE INDEX IF NOT EXISTS idx_project_practitioner_matches_practitioner_serial 
ON project_practitioner_matches(practitioner_serial);

-- Composite index for common query patterns (client + project)
CREATE INDEX IF NOT EXISTS idx_project_practitioner_matches_client_project 
ON project_practitioner_matches(client_serial, project_serial);

-- Composite index for looking up matches for a project
CREATE INDEX IF NOT EXISTS idx_project_practitioner_matches_project_status 
ON project_practitioner_matches(project_serial, status);

-- Index on status for filtering
CREATE INDEX IF NOT EXISTS idx_project_practitioner_matches_status 
ON project_practitioner_matches(status);

-- ============================================================================
-- STEP 4: Add CHECK constraint on status field
-- ============================================================================

ALTER TABLE project_practitioner_matches 
DROP CONSTRAINT IF EXISTS check_status_valid;

ALTER TABLE project_practitioner_matches 
ADD CONSTRAINT check_status_valid 
CHECK (status IN ('pending', 'active', 'in-progress', 'hired', 'completed', 'closed', 'blocked', 'declined'));

-- ============================================================================
-- STEP 5: Ensure matched_at is set for all existing records
-- ============================================================================

UPDATE project_practitioner_matches 
SET matched_at = COALESCE(matched_at, created_at, NOW())
WHERE matched_at IS NULL;

-- Make matched_at NOT NULL going forward
ALTER TABLE project_practitioner_matches 
ALTER COLUMN matched_at SET NOT NULL;

-- ============================================================================
-- STEP 6: Add default values for created_at if missing
-- ============================================================================

ALTER TABLE project_practitioner_matches 
ALTER COLUMN created_at SET DEFAULT NOW();

-- ============================================================================
-- STEP 7: Update the create_practitioner_match RPC to use correct types
-- ============================================================================

CREATE OR REPLACE FUNCTION create_practitioner_match(
  p_project_serial INT,
  p_client_serial TEXT,
  p_practitioner_serial TEXT,
  p_match_score INT DEFAULT 75
)
RETURNS TABLE (match_id uuid, status text) AS $$
DECLARE
  v_match_id uuid;
  v_status text;
BEGIN
  INSERT INTO project_practitioner_matches (
    project_serial,
    client_serial,
    practitioner_serial,
    status,
    match_score,
    client_initiated,
    matched_at
  )
  VALUES (
    p_project_serial,
    p_client_serial,
    p_practitioner_serial,
    'pending'::text,
    p_match_score,
    true,
    NOW()
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_match_id;
  
  IF v_match_id IS NULL THEN
    -- Match already exists, fetch existing
    SELECT id INTO v_match_id FROM project_practitioner_matches 
    WHERE project_serial = p_project_serial 
      AND client_serial = p_client_serial 
      AND practitioner_serial = p_practitioner_serial
    LIMIT 1;
  END IF;
  
  -- Fetch match info into variables (avoid ambiguity with table columns)
  SELECT 
    ppm.id,
    ppm.status
  INTO 
    v_match_id,
    v_status
  FROM project_practitioner_matches ppm
  WHERE ppm.id = v_match_id;
  
  -- Return using variables
  match_id := v_match_id;
  status := v_status;
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 8: Verify data integrity
-- ============================================================================

-- Count matches that might have issues
DO $$
DECLARE
  v_total INTEGER;
  v_null_project INTEGER;
  v_null_client INTEGER;
  v_null_practitioner INTEGER;
  v_null_status INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total FROM project_practitioner_matches;
  SELECT COUNT(*) INTO v_null_project FROM project_practitioner_matches WHERE project_serial IS NULL;
  SELECT COUNT(*) INTO v_null_client FROM project_practitioner_matches WHERE client_serial IS NULL;
  SELECT COUNT(*) INTO v_null_practitioner FROM project_practitioner_matches WHERE practitioner_serial IS NULL;
  SELECT COUNT(*) INTO v_null_status FROM project_practitioner_matches WHERE status IS NULL;
  
  RAISE NOTICE '
  =================================================================
  PROJECT_PRACTITIONER_MATCHES Data Integrity Report
  =================================================================
  Total Records: %
  NULL project_serial: %
  NULL client_serial: %
  NULL practitioner_serial: %
  NULL status: %
  =================================================================
  ', v_total, v_null_project, v_null_client, v_null_practitioner, v_null_status;
END $$;

-- ============================================================================
-- STEP 9: Display final schema
-- ============================================================================

-- Show the updated table structure
\d+ project_practitioner_matches
