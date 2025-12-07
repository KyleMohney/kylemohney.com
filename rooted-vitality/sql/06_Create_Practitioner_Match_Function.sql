-- Drop and recreate the create_practitioner_match RPC function with correct signature
-- This function creates a match between a project and a practitioner

-- Drop the old function if it exists with any signature
DROP FUNCTION IF EXISTS create_practitioner_match(INT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS create_practitioner_match(INT, TEXT, TEXT, INT) CASCADE;
DROP FUNCTION IF EXISTS create_practitioner_match(INT, TEXT, TEXT, INT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS create_practitioner_match(INT, TEXT, TEXT, INT, TEXT, TEXT) CASCADE;

-- Create the new function with correct signature
CREATE OR REPLACE FUNCTION create_practitioner_match(
  p_project_serial INT,
  p_client_serial TEXT,
  p_practitioner_serial TEXT,
  p_match_score INT DEFAULT 75,
  p_creation_source TEXT DEFAULT 'manual_unknown',
  p_created_by TEXT DEFAULT 'unknown'
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
    matched_at,
    creation_source,
    created_by
  )
  VALUES (
    p_project_serial,
    p_client_serial,
    p_practitioner_serial,
    'pending',
    p_match_score,
    true,
    NOW(),
    p_creation_source,
    p_created_by
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_match_id;
  
  IF v_match_id IS NULL THEN
    SELECT id INTO v_match_id FROM project_practitioner_matches 
    WHERE project_serial = p_project_serial 
      AND client_serial = p_client_serial 
      AND practitioner_serial = p_practitioner_serial;
  END IF;
  
  SELECT 
    ppm.id,
    ppm.status
  INTO 
    v_match_id,
    v_status
  FROM project_practitioner_matches ppm
  WHERE ppm.id = v_match_id;
  
  match_id := v_match_id;
  status := v_status;
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_practitioner_match(INT, TEXT, TEXT, INT, TEXT, TEXT) TO authenticated;
