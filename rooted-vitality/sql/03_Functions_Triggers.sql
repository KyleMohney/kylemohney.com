-- ============================================================================
-- ROOTED VITALITY - FUNCTIONS, TRIGGERS & UTILITIES
-- ============================================================================
-- Matching algorithms, serial generation, timestamp management, and RPC functions
-- ============================================================================

-- ============================================================================
-- SECTION 1: SERIAL NUMBER GENERATION
-- ============================================================================

CREATE SEQUENCE IF NOT EXISTS client_serial_seq START 1;
CREATE SEQUENCE IF NOT EXISTS practitioner_serial_seq START 1;
CREATE SEQUENCE IF NOT EXISTS project_serial_seq START 1;

DROP TRIGGER IF EXISTS clients_serial_number ON clients;
DROP FUNCTION IF EXISTS generate_client_serial();

CREATE FUNCTION generate_client_serial()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.serial_number IS NULL THEN
    NEW.serial_number := 'C' || NEXTVAL('client_serial_seq')::TEXT;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_serial_number
BEFORE INSERT ON clients FOR EACH ROW
EXECUTE FUNCTION generate_client_serial();

DROP TRIGGER IF EXISTS practitioners_serial_number ON practitioners;
DROP FUNCTION IF EXISTS generate_practitioner_serial();

CREATE FUNCTION generate_practitioner_serial()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.serial_number IS NULL THEN
    NEW.serial_number := 'P' || NEXTVAL('practitioner_serial_seq')::TEXT;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER practitioners_serial_number
BEFORE INSERT ON practitioners FOR EACH ROW
EXECUTE FUNCTION generate_practitioner_serial();

DROP TRIGGER IF EXISTS projects_serial_number ON projects;
DROP FUNCTION IF EXISTS generate_project_serial();

CREATE FUNCTION generate_project_serial()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.project_id IS NULL THEN
    NEW.project_id := NEXTVAL('project_serial_seq')::INTEGER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_serial_number
BEFORE INSERT ON projects FOR EACH ROW
EXECUTE FUNCTION generate_project_serial();

-- ============================================================================
-- SECTION 2: TIMESTAMP MANAGEMENT
-- ============================================================================

DROP TRIGGER IF EXISTS update_clients_timestamps ON clients;
DROP FUNCTION IF EXISTS update_clients_timestamps();

CREATE FUNCTION update_clients_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  IF NEW.created_at IS NULL THEN
    NEW.created_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clients_timestamps
BEFORE INSERT OR UPDATE ON clients FOR EACH ROW
EXECUTE FUNCTION update_clients_timestamps();

DROP TRIGGER IF EXISTS update_practitioners_timestamps ON practitioners;
DROP FUNCTION IF EXISTS update_practitioners_timestamps();

CREATE FUNCTION update_practitioners_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  IF NEW.created_at IS NULL THEN
    NEW.created_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_practitioners_timestamps
BEFORE INSERT OR UPDATE ON practitioners FOR EACH ROW
EXECUTE FUNCTION update_practitioners_timestamps();

DROP TRIGGER IF EXISTS update_projects_timestamps ON projects;
DROP FUNCTION IF EXISTS update_projects_timestamps();

CREATE FUNCTION update_projects_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  IF NEW.created_at IS NULL THEN
    NEW.created_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_timestamps
BEFORE INSERT OR UPDATE ON projects FOR EACH ROW
EXECUTE FUNCTION update_projects_timestamps();

DROP TRIGGER IF EXISTS update_matches_timestamps ON project_practitioner_matches;
DROP FUNCTION IF EXISTS update_matches_timestamps();

CREATE FUNCTION update_matches_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  IF NEW.created_at IS NULL THEN
    NEW.created_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_matches_timestamps
BEFORE INSERT OR UPDATE ON project_practitioner_matches FOR EACH ROW
EXECUTE FUNCTION update_matches_timestamps();

DROP TRIGGER IF EXISTS update_reviews_timestamps ON reviews;
DROP FUNCTION IF EXISTS update_reviews_timestamps();

CREATE FUNCTION update_reviews_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  IF NEW.created_at IS NULL THEN
    NEW.created_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reviews_timestamps
BEFORE INSERT OR UPDATE ON reviews FOR EACH ROW
EXECUTE FUNCTION update_reviews_timestamps();

-- ============================================================================
-- SECTION 3: MATCHING ALGORITHM
-- ============================================================================

DROP FUNCTION IF EXISTS match_practitioners(UUID) CASCADE;

CREATE OR REPLACE FUNCTION match_practitioners(
  p_project_id UUID
)
RETURNS TABLE (
  id UUID,
  serial_number TEXT,
  legal_name TEXT,
  dba_name TEXT,
  modalities TEXT[],
  conditions_treated TEXT[],
  email TEXT,
  phone TEXT,
  match_score INTEGER
) AS $$
DECLARE
  v_project_id UUID;
  v_category_name TEXT;
  v_subcategory_name TEXT[];
  v_travel_preference TEXT;
  v_client_zipcode TEXT;
  v_client_state TEXT;
  v_project_integer INTEGER;
BEGIN
  SELECT 
    proj.id,
    proj.category_name,
    string_to_array(COALESCE(proj.subcategory_name, ''), ','),
    proj.travel_preference,
    proj.zipcode,
    proj.state,
    proj.project_serial
  INTO 
    v_project_id,
    v_category_name,
    v_subcategory_name,
    v_travel_preference,
    v_client_zipcode,
    v_client_state,
    v_project_integer
  FROM projects proj
  WHERE proj.id = p_project_id;

  IF v_project_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.serial_number,
    p.legal_name,
    COALESCE(p.dba_name, p.legal_name) AS dba_name,
    COALESCE(pp.modalities, ARRAY[]::TEXT[]) AS modalities,
    COALESCE(pp.conditions_treated, ARRAY[]::TEXT[]) AS conditions_treated,
    p.email,
    p.phone,
    LEAST(100, GREATEST(2, 1 + COALESCE(pp.profile_completeness_percent, 1)))::INTEGER AS match_score
  FROM practitioners p
  LEFT JOIN practitioner_profiles pp ON p.id = pp.id
  WHERE 
    p.deleted_at IS NULL
    AND COALESCE(p.matching_enabled, true) = true
    AND COALESCE(p.matching_paused, false) = false
    AND v_category_name = ANY(p.service_category_names)
    AND (
      v_subcategory_name IS NULL 
      OR array_length(v_subcategory_name, 1) IS NULL
      OR EXISTS (
        SELECT 1 FROM unnest(v_subcategory_name) AS sub 
        WHERE sub = ANY(p.service_subcategory_names)
      )
    )
    AND (
      (v_travel_preference = 'in-person' AND p.in_person_enabled = true)
      OR (v_travel_preference = 'housecalls' AND p.housecalls_enabled = true)
      OR (v_travel_preference = 'virtual' AND p.virtual_enabled = true)
      OR (v_travel_preference = 'flexible' AND (p.in_person_enabled = true OR p.housecalls_enabled = true OR p.virtual_enabled = true))
    )
    AND (
      (v_travel_preference = 'in-person' AND (
        v_client_zipcode = p.in_person_base_zipcode
        OR v_client_zipcode = ANY(COALESCE(p.in_person_zipcodes, ARRAY[]::TEXT[]))
      ))
      OR
      (v_travel_preference = 'housecalls' AND (
        v_client_zipcode = p.housecalls_base_zipcode
        OR v_client_zipcode = ANY(COALESCE(p.housecalls_zipcodes, ARRAY[]::TEXT[]))
      ))
      OR
      (v_travel_preference = 'virtual' AND p.virtual_states IS NULL)
      OR
      (v_travel_preference = 'virtual' AND v_client_state = ANY(COALESCE(p.virtual_states, ARRAY[]::TEXT[])))
      OR
      (v_travel_preference = 'flexible' AND (
        (p.in_person_enabled = true AND (
          v_client_zipcode = p.in_person_base_zipcode
          OR v_client_zipcode = ANY(COALESCE(p.in_person_zipcodes, ARRAY[]::TEXT[]))
        ))
        OR
        (p.housecalls_enabled = true AND (
          v_client_zipcode = p.housecalls_base_zipcode
          OR v_client_zipcode = ANY(COALESCE(p.housecalls_zipcodes, ARRAY[]::TEXT[]))
        ))
        OR
        (p.virtual_enabled = true AND p.virtual_states IS NULL)
        OR
        (p.virtual_enabled = true AND v_client_state = ANY(COALESCE(p.virtual_states, ARRAY[]::TEXT[])))
      ))
    )
  ORDER BY match_score DESC;
  
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 4: MATCH STATUS COLUMNS & CONSTRAINTS
-- ============================================================================

ALTER TABLE project_practitioner_matches
ADD COLUMN IF NOT EXISTS match_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS distance_miles NUMERIC(8,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS practitioner_response TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS practitioner_response_reason TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS practitioner_responded_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS match_status TEXT DEFAULT 'pending';

ALTER TABLE project_practitioner_matches
DROP CONSTRAINT IF EXISTS valid_match_status;

ALTER TABLE project_practitioner_matches
ADD CONSTRAINT valid_match_status 
CHECK (match_status IN ('pending', 'active', 'in-progress', 'hired', 'completed', 'closed'));

ALTER TABLE project_practitioner_matches
DROP CONSTRAINT IF EXISTS valid_practitioner_response;

ALTER TABLE project_practitioner_matches
ADD CONSTRAINT valid_practitioner_response 
CHECK (practitioner_response IS NULL OR practitioner_response IN ('accepted', 'declined', 'declined_with_message'));

-- ============================================================================
-- SECTION 5: INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_project_practitioner_matches_status_created 
ON project_practitioner_matches(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_project_practitioner_matches_practitioner_status
ON project_practitioner_matches(practitioner_serial, status);

CREATE INDEX IF NOT EXISTS idx_ppm_match_status 
ON project_practitioner_matches(match_status);

CREATE INDEX IF NOT EXISTS idx_ppm_practitioner_response 
ON project_practitioner_matches(practitioner_response);

CREATE INDEX IF NOT EXISTS idx_ppm_client_match_status 
ON project_practitioner_matches(client_serial, match_status);

CREATE INDEX IF NOT EXISTS idx_ppm_practitioner_response_status 
ON project_practitioner_matches(practitioner_serial, practitioner_response);

CREATE INDEX IF NOT EXISTS idx_ppm_project_serial_match_status 
ON project_practitioner_matches(project_serial, match_status);

CREATE INDEX IF NOT EXISTS idx_projects_client_serial ON projects(client_serial);
CREATE INDEX IF NOT EXISTS idx_projects_category_id ON projects(category_id);
CREATE INDEX IF NOT EXISTS idx_projects_subcategory_id ON projects(subcategory_id);

CREATE INDEX IF NOT EXISTS idx_project_practitioner_matches_project_serial 
ON project_practitioner_matches(project_serial);

CREATE INDEX IF NOT EXISTS idx_project_practitioner_matches_practitioner_serial 
ON project_practitioner_matches(practitioner_serial);

CREATE INDEX IF NOT EXISTS idx_project_practitioner_matches_client_serial 
ON project_practitioner_matches(client_serial);

CREATE INDEX IF NOT EXISTS idx_reviews_project_serial ON reviews(project_serial);
CREATE INDEX IF NOT EXISTS idx_reviews_client_serial ON reviews(client_serial);
CREATE INDEX IF NOT EXISTS idx_reviews_practitioner_serial ON reviews(practitioner_serial);

CREATE INDEX IF NOT EXISTS idx_project_messages_project_id 
ON project_messages(project_id);

-- ============================================================================
-- SECTION 6: RPC FUNCTIONS
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
    'pending',
    p_match_score,
    true,
    NOW()
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

CREATE OR REPLACE FUNCTION create_project_message(
  p_project_id uuid,
  p_practitioner_id uuid,
  p_client_id uuid,
  p_sender_id uuid,
  p_sender_type text,
  p_message text
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO project_messages (
    project_id,
    practitioner_id,
    client_id,
    sender_id,
    sender_type,
    message,
    is_read
  )
  VALUES (
    p_project_id,
    p_practitioner_id,
    p_client_id,
    p_sender_id,
    p_sender_type,
    p_message,
    false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
