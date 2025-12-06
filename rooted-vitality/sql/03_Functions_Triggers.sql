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
  v_category_id TEXT;
  v_category_uuid UUID;
  v_subcategory_name TEXT[];
  v_travel_preference TEXT;
  v_client_zipcode TEXT;
  v_client_state TEXT;
  v_project_integer INTEGER;
BEGIN
  SELECT 
    proj.id,
    proj.category_id,
    array_remove(array(SELECT trim(x) FROM unnest(string_to_array(TRIM(COALESCE(proj.subcategory_name, '')), ',')) as x), ''),
    proj.travel_preference,
    proj.zipcode,
    proj.state,
    proj.project_serial
  INTO 
    v_project_id,
    v_category_id,
    v_subcategory_name,
    v_travel_preference,
    v_client_zipcode,
    v_client_state,
    v_project_integer
  FROM projects proj
  WHERE proj.id = p_project_id;

  IF v_project_id IS NULL THEN
    RAISE NOTICE 'match_practitioners: Project not found for ID %', p_project_id;
    RETURN;
  END IF;

  -- Default to 'flexible' if travel_preference is not specified (matches practitioners with any delivery method)
  IF v_travel_preference IS NULL THEN
    v_travel_preference := 'flexible';
  END IF;

  -- Map category_id TEXT slug to UUID
  v_category_uuid := CASE v_category_id
    WHEN 'midwifery' THEN '900f680e-15e1-4ce1-95df-6c5e2cd10d6a'::UUID
    WHEN 'acupuncture' THEN '17d4d957-905e-411a-9b4d-1165a9940b4f'::UUID
    WHEN 'chiropractic' THEN '88e8ef68-ea5c-4ef5-af89-53f08502845a'::UUID
    ELSE (SELECT hht.id FROM holistic_health_taxonomy AS hht WHERE hht.name ILIKE '%' || v_category_id || '%' LIMIT 1)
  END;

  RAISE NOTICE '=== MATCH_PRACTITIONERS DEBUG ===';
  RAISE NOTICE 'Project ID: %', p_project_id;
  RAISE NOTICE 'Category ID: %', v_category_id;
  RAISE NOTICE 'Category UUID: %', v_category_uuid;
  RAISE NOTICE 'Subcategories: %', v_subcategory_name;
  RAISE NOTICE 'Travel Preference: %', v_travel_preference;
  RAISE NOTICE 'Client Zipcode: %', v_client_zipcode;
  RAISE NOTICE 'Client State: %', v_client_state;

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
  FROM practitioners AS p
  LEFT JOIN practitioner_profiles AS pp ON pp.practitioner_serial = p.serial_number
  WHERE 
    p.deleted_at IS NULL
    AND COALESCE(p.matching_enabled, true) = true
    AND COALESCE(p.matching_paused, false) = false
    AND EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.practitioner_id = p.id
      AND m.status = 'active'
    )
    AND v_category_uuid = ANY(p.service_category_ids)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- ============================================================================
-- UPDATE PRACTITIONER DENORMALIZED ARRAYS WHEN SERVICES CHANGE
-- ============================================================================

CREATE OR REPLACE FUNCTION update_practitioner_service_arrays()
RETURNS TRIGGER AS $$
DECLARE
  v_practitioner_serial TEXT;
  v_subcategory_names TEXT[];
  v_category_names TEXT[];
BEGIN
  -- Get the practitioner serial (works for INSERT, UPDATE, DELETE)
  v_practitioner_serial := COALESCE(NEW.practitioner_serial, OLD.practitioner_serial);
  
  -- Build service_category_ids array from selected services (what the matching algo needs)
  SELECT array_agg(DISTINCT hht.id ORDER BY hht.id)
  INTO v_category_ids
  FROM practitioner_selected_services pss
  INNER JOIN holistic_health_taxonomy hht ON hht.id = pss.taxonomy_id
  WHERE pss.practitioner_serial = v_practitioner_serial
  AND pss.is_active = true;
  
  -- Build category names array from selected services
  SELECT array_agg(DISTINCT hht.name ORDER BY hht.name)
  INTO v_category_names
  FROM practitioner_selected_services pss
  INNER JOIN holistic_health_taxonomy hht ON hht.id = pss.taxonomy_id
  WHERE pss.practitioner_serial = v_practitioner_serial
  AND pss.is_active = true;
  
  -- Build service_subcategory_ids array from selected services
  SELECT array_agg(DISTINCT ts.id ORDER BY ts.id)
  INTO v_subcategory_ids
  FROM practitioner_selected_services pss
  INNER JOIN taxonomy_subcategories ts ON ts.id = pss.subcategory_id
  WHERE pss.practitioner_serial = v_practitioner_serial
  AND pss.is_active = true;
  
  -- Build subcategory names array from selected services
  SELECT array_agg(DISTINCT ts.name ORDER BY ts.name)
  INTO v_subcategory_names
  FROM practitioner_selected_services pss
  INNER JOIN taxonomy_subcategories ts ON ts.id = pss.subcategory_id
  WHERE pss.practitioner_serial = v_practitioner_serial
  AND pss.is_active = true;
  
  -- Update practitioners table with all four arrays
  UPDATE practitioners
  SET 
    service_category_ids = COALESCE(v_category_ids, ARRAY[]::UUID[]),
    service_category_names = COALESCE(v_category_names, ARRAY[]::TEXT[]),
    service_subcategory_ids = COALESCE(v_subcategory_ids, ARRAY[]::UUID[]),
    service_subcategory_names = COALESCE(v_subcategory_names, ARRAY[]::TEXT[]),
    updated_at = NOW()
  WHERE serial_number = v_practitioner_serial;
  
  -- Log the update for debugging
  RAISE NOTICE 'Trigger: Updated practitioner % with % categories, % category IDs, % subcategories, % subcategory IDs', 
    v_practitioner_serial, 
    array_length(v_category_names, 1),
    array_length(v_category_ids, 1),
    array_length(v_subcategory_names, 1),
    array_length(v_subcategory_ids, 1);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_practitioner_arrays_on_service_change ON practitioner_selected_services;
CREATE TRIGGER update_practitioner_arrays_on_service_change
AFTER INSERT OR UPDATE OR DELETE ON practitioner_selected_services
FOR EACH ROW
EXECUTE FUNCTION update_practitioner_service_arrays();

-- ============================================================================
-- RPC FUNCTION TO MANUALLY UPDATE PRACTITIONER SERVICE ARRAYS
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_practitioner_service_arrays(p_practitioner_serial TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_category_ids TEXT[];
  v_category_names TEXT[];
  v_subcategory_ids TEXT[];
  v_subcategory_names TEXT[];
  v_rows_updated INT;
BEGIN
  -- Build service_category_ids array from selected services
  SELECT array_agg(DISTINCT hht.id ORDER BY hht.id)
  INTO v_category_ids
  FROM practitioner_selected_services pss
  INNER JOIN holistic_health_taxonomy hht ON hht.id = pss.taxonomy_id
  WHERE pss.practitioner_serial = p_practitioner_serial
  AND pss.is_active = true;
  
  -- Build category names array
  SELECT array_agg(DISTINCT hht.name ORDER BY hht.name)
  INTO v_category_names
  FROM practitioner_selected_services pss
  INNER JOIN holistic_health_taxonomy hht ON hht.id = pss.taxonomy_id
  WHERE pss.practitioner_serial = p_practitioner_serial
  AND pss.is_active = true;
  
  -- Build service_subcategory_ids array
  SELECT array_agg(DISTINCT ts.id ORDER BY ts.id)
  INTO v_subcategory_ids
  FROM practitioner_selected_services pss
  INNER JOIN taxonomy_subcategories ts ON ts.id = pss.subcategory_id
  WHERE pss.practitioner_serial = p_practitioner_serial
  AND pss.is_active = true;
  
  -- Build subcategory names array
  SELECT array_agg(DISTINCT ts.name ORDER BY ts.name)
  INTO v_subcategory_names
  FROM practitioner_selected_services pss
  INNER JOIN taxonomy_subcategories ts ON ts.id = pss.subcategory_id
  WHERE pss.practitioner_serial = p_practitioner_serial
  AND pss.is_active = true;
  
  -- Update practitioners table with all arrays
  UPDATE practitioners
  SET 
    service_category_ids = COALESCE(v_category_ids, ARRAY[]::UUID[]),
    service_category_names = COALESCE(v_category_names, ARRAY[]::TEXT[]),
    service_subcategory_ids = COALESCE(v_subcategory_ids, ARRAY[]::UUID[]),
    service_subcategory_names = COALESCE(v_subcategory_names, ARRAY[]::TEXT[]),
    updated_at = NOW()
  WHERE serial_number = p_practitioner_serial;
  
  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
  
  RAISE NOTICE 'sync_practitioner_service_arrays: Updated % rows for practitioner %. Cat IDs: %, Cat Names: %, SubCat IDs: %, SubCat Names: %', 
    v_rows_updated,
    p_practitioner_serial, 
    array_length(v_category_ids, 1),
    array_length(v_category_names, 1),
    array_length(v_subcategory_ids, 1),
    array_length(v_subcategory_names, 1);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SERVICE MANAGEMENT FUNCTIONS (SECURITY DEFINER - BYPASSES RLS)
-- ============================================================================

/**
 * Delete a practitioner service and sync arrays
 * SECURITY DEFINER bypasses RLS policies
 * Returns true if deletion was successful
 */
CREATE OR REPLACE FUNCTION delete_practitioner_service(
  p_service_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_practitioner_serial TEXT;
  v_rows_deleted INT;
BEGIN
  -- Get the practitioner_serial for this service
  SELECT practitioner_serial INTO v_practitioner_serial
  FROM practitioner_selected_services
  WHERE id = p_service_id
  LIMIT 1;

  IF v_practitioner_serial IS NULL THEN
    RAISE EXCEPTION 'Service not found: %', p_service_id;
  END IF;

  RAISE NOTICE 'Deleting service % for practitioner %', p_service_id, v_practitioner_serial;

  -- Delete the service
  DELETE FROM practitioner_selected_services
  WHERE id = p_service_id;

  GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;

  IF v_rows_deleted = 0 THEN
    RAISE EXCEPTION 'Failed to delete service: %', p_service_id;
  END IF;

  RAISE NOTICE 'Service deleted, rows affected: %', v_rows_deleted;

  -- Sync the practitioner's service arrays
  PERFORM sync_practitioner_service_arrays(v_practitioner_serial);

  RAISE NOTICE 'Service arrays synced for %', v_practitioner_serial;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SIGNUP HELPER FUNCTIONS (SECURITY DEFINER - BYPASSES RLS)
-- ============================================================================


/**
 * Create practitioner profile during signup
 * SECURITY DEFINER bypasses RLS policies
 * Returns the profile ID or throws error if it fails
 */
CREATE OR REPLACE FUNCTION create_practitioner_profile_signup(
  p_practitioner_serial TEXT,
  p_practitioner_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_profile_id UUID;
BEGIN
  -- First check if it already exists
  SELECT id INTO v_profile_id FROM practitioner_profiles WHERE id = p_practitioner_id LIMIT 1;
  
  IF v_profile_id IS NOT NULL THEN
    RAISE NOTICE 'Profile already exists: %', v_profile_id;
    RETURN v_profile_id;
  END IF;
  
  -- Insert new profile
  INSERT INTO practitioner_profiles (
    id,
    practitioner_serial,
    languages,
    modalities,
    conditions_treated,
    profile_completeness_percent,
    created_at,
    updated_at
  )
  VALUES (
    p_practitioner_id,
    p_practitioner_serial,
    ARRAY[]::TEXT[],
    ARRAY[]::TEXT[],
    ARRAY[]::TEXT[],
    10,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_profile_id;
  
  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Failed to create practitioner profile for %', p_practitioner_serial;
  END IF;
  
  RAISE NOTICE 'Created practitioner profile: %', v_profile_id;
  RETURN v_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Create practitioner notification settings during signup
 * SECURITY DEFINER bypasses RLS policies
 * Returns the settings ID or throws error if it fails
 */
CREATE OR REPLACE FUNCTION create_practitioner_notification_settings_signup(
  p_practitioner_serial TEXT
)
RETURNS UUID AS $$
DECLARE
  v_settings_id UUID;
BEGIN
  -- First check if it already exists
  SELECT id INTO v_settings_id FROM practitioner_notification_settings 
  WHERE practitioner_serial = p_practitioner_serial LIMIT 1;
  
  IF v_settings_id IS NOT NULL THEN
    RAISE NOTICE 'Notification settings already exist: %', v_settings_id;
    RETURN v_settings_id;
  END IF;
  
  -- Insert new settings
  INSERT INTO practitioner_notification_settings (
    practitioner_serial,
    messages_in_app, messages_sms, messages_email,
    matches_in_app, matches_sms, matches_email,
    reviews_in_app, reviews_sms, reviews_email,
    promotions_in_app, promotions_sms, promotions_email,
    system_in_app, system_sms, system_email,
    account_in_app,
    created_at,
    updated_at
  )
  VALUES (
    p_practitioner_serial,
    true, true, true,
    true, true, true,
    true, true, true,
    false, false, false,
    true, true, true,
    true,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_settings_id;
  
  IF v_settings_id IS NULL THEN
    RAISE EXCEPTION 'Failed to create notification settings for %', p_practitioner_serial;
  END IF;
  
  RAISE NOTICE 'Created practitioner notification settings: %', v_settings_id;
  RETURN v_settings_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Create practitioner membership during signup
 * SECURITY DEFINER bypasses RLS policies
 * Returns the membership ID or throws error if it fails
 */
CREATE OR REPLACE FUNCTION create_practitioner_membership_signup(
  p_practitioner_id UUID,
  p_practitioner_serial TEXT
)
RETURNS UUID AS $$
DECLARE
  v_membership_id UUID;
BEGIN
  -- First check if it already exists
  SELECT id INTO v_membership_id FROM memberships 
  WHERE practitioner_id = p_practitioner_id LIMIT 1;
  
  IF v_membership_id IS NOT NULL THEN
    RAISE NOTICE 'Membership already exists: %', v_membership_id;
    RETURN v_membership_id;
  END IF;
  
  -- Insert new membership
  INSERT INTO memberships (
    practitioner_id,
    practitioner_serial,
    status,
    started_at,
    created_at,
    updated_at
  )
  VALUES (
    p_practitioner_id,
    p_practitioner_serial,
    'inactive',
    NULL,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_membership_id;
  
  IF v_membership_id IS NULL THEN
    RAISE EXCEPTION 'Failed to create membership for %', p_practitioner_serial;
  END IF;
  
  RAISE NOTICE 'Created practitioner membership: %', v_membership_id;
  RETURN v_membership_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Create welcome notification for new practitioner
 * SECURITY DEFINER bypasses RLS policies
 * Returns the notification ID or throws error if it fails
 */
-- ============================================================================
-- CREATE CLIENT WELCOME NOTIFICATION (SECURITY DEFINER - BYPASSES RLS)
-- ============================================================================
/**
 * Creates a welcome notification for a newly registered client
 * SECURITY DEFINER bypasses RLS policies that restrict anon users
 * Returns the UUID of the created notification
 */
CREATE OR REPLACE FUNCTION create_client_welcome_notification_signup(
  p_client_serial TEXT
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  -- Insert welcome notification
  INSERT INTO client_notifications (
    client_serial,
    type,
    title,
    message,
    is_read,
    created_at
  )
  VALUES (
    p_client_serial,
    'welcome',
    'Welcome to Rooted Vitality!',
    'Thank you for joining our community! We''re excited to help you on your wellness journey. Get started by creating your first wellness project and connecting with trusted practitioners.',
    false,
    NOW()
  )
  RETURNING id INTO v_notification_id;
  
  IF v_notification_id IS NULL THEN
    RAISE EXCEPTION 'Failed to create welcome notification for client %', p_client_serial;
  END IF;
  
  RAISE NOTICE 'Created client welcome notification: %', v_notification_id;
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CREATE PRACTITIONER WELCOME NOTIFICATION (SECURITY DEFINER - BYPASSES RLS)
-- ============================================================================
/**
 * Creates a welcome notification for a newly registered practitioner
 * SECURITY DEFINER bypasses RLS policies that restrict anon users
 * Returns the UUID of the created notification
 */
CREATE OR REPLACE FUNCTION create_welcome_notification_signup(
  p_practitioner_serial TEXT
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  -- Insert welcome notification
  INSERT INTO practitioner_notifications (
    practitioner_serial,
    type,
    title,
    message,
    is_read,
    created_at
  )
  VALUES (
    p_practitioner_serial,
    'system',
    'Welcome to Rooted Vitality',
    'Your practitioner account has been created successfully. Complete your profile to start connecting with clients.',
    false,
    NOW()
  )
  RETURNING id INTO v_notification_id;
  
  IF v_notification_id IS NULL THEN
    RAISE EXCEPTION 'Failed to create welcome notification for %', p_practitioner_serial;
  END IF;
  
  RAISE NOTICE 'Created welcome notification: %', v_notification_id;
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MATCHING CONTROL FUNCTIONS (SECURITY DEFINER - BYPASSES RLS)
-- ============================================================================

/**
 * Enable matching for a practitioner after verifying active membership
 * SECURITY DEFINER bypasses RLS policies
 * Returns true if matching was successfully enabled
 */
CREATE OR REPLACE FUNCTION enable_matching(
  p_practitioner_serial TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_practitioner_id UUID;
  v_has_active_membership BOOLEAN;
BEGIN
  -- Get practitioner ID from serial number
  SELECT id INTO v_practitioner_id
  FROM practitioners
  WHERE serial_number = p_practitioner_serial
  LIMIT 1;
  
  IF v_practitioner_id IS NULL THEN
    RAISE EXCEPTION 'Practitioner not found: %', p_practitioner_serial;
  END IF;
  
  -- Check for active membership
  SELECT EXISTS (
    SELECT 1 FROM memberships
    WHERE practitioner_id = v_practitioner_id
    AND status = 'active'
  ) INTO v_has_active_membership;
  
  IF NOT v_has_active_membership THEN
    RAISE NOTICE 'No active membership for %', p_practitioner_serial;
    RETURN FALSE;
  END IF;
  
  -- Update matching_enabled flag
  UPDATE practitioners
  SET matching_enabled = true, matching_paused = false
  WHERE serial_number = p_practitioner_serial;
  
  RAISE NOTICE 'Matching enabled for %', p_practitioner_serial;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Disable matching for a practitioner
 * SECURITY DEFINER bypasses RLS policies
 * Returns true if matching was successfully disabled
 */
CREATE OR REPLACE FUNCTION disable_matching(
  p_practitioner_serial TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE practitioners
  SET matching_enabled = false, matching_paused = true
  WHERE serial_number = p_practitioner_serial;
  
  RAISE NOTICE 'Matching disabled for %', p_practitioner_serial;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CLIENT WELCOME NOTIFICATION FUNCTION (SECURITY DEFINER - BYPASSES RLS)
-- ============================================================================

/**
 * Create welcome notification for a newly registered client
 * SECURITY DEFINER bypasses RLS policies
 * Returns UUID of created notification
 */
CREATE OR REPLACE FUNCTION create_client_welcome_notification_signup(
  p_client_serial TEXT
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  -- Insert welcome notification
  INSERT INTO client_notifications (
    client_serial,
    type,
    title,
    message,
    is_read,
    created_at
  )
  VALUES (
    p_client_serial,
    'system',
    'Welcome to Rooted Vitality!',
    'Thank you for joining our community! We''re excited to help you on your wellness journey. Get started by creating your first wellness project and connecting with trusted practitioners.',
    false,
    NOW()
  )
  RETURNING id INTO v_notification_id;
  
  IF v_notification_id IS NULL THEN
    RAISE EXCEPTION 'Failed to create welcome notification for client %', p_client_serial;
  END IF;
  
  RAISE NOTICE 'Created welcome notification for client: %', v_notification_id;
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MATCH RESPONSE NOTIFICATION FUNCTION (SECURITY DEFINER - BYPASSES RLS)
-- ============================================================================

/**
 * Create notification when practitioner responds to a match request
 * SECURITY DEFINER bypasses RLS policies
 * Returns UUID of created notification
 * Called when practitioner accepts, declines, or blocks a match
 */
CREATE OR REPLACE FUNCTION create_match_response_notification(
  p_client_serial TEXT,
  p_action TEXT,
  p_practitioner_name TEXT,
  p_project_name TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
  v_title TEXT;
  v_message TEXT;
  v_type TEXT;
BEGIN
  -- Determine notification type and message based on action
  CASE p_action
    WHEN 'accepted' THEN
      v_type := 'match_accepted';
      v_title := 'Great News! Practitioner Accepted Your Request';
      v_message := p_practitioner_name || ' has accepted your request for ' || p_project_name || '! They will contact you shortly to get started.';
    WHEN 'declined' THEN
      v_type := 'match_declined';
      v_title := 'Update: Practitioner Not Available';
      v_message := p_practitioner_name || ' was not available at this time for your ' || p_project_name || ' request. Don''t worry, we''ll continue matching you with other practitioners.';
    WHEN 'blocked' THEN
      v_type := 'match_blocked';
      v_title := 'Match Request Update';
      v_message := 'A practitioner has declined your request for ' || p_project_name || '. Our matching system will connect you with other qualified practitioners.';
    ELSE
      v_type := 'match_update';
      v_title := 'Match Request Update';
      v_message := 'There''s an update on your ' || p_project_name || ' request.';
  END CASE;

  -- Insert match response notification
  INSERT INTO client_notifications (
    client_serial,
    type,
    title,
    message,
    is_read,
    created_at
  )
  VALUES (
    p_client_serial,
    v_type,
    v_title,
    v_message,
    false,
    NOW()
  )
  RETURNING id INTO v_notification_id;
  
  IF v_notification_id IS NULL THEN
    RAISE EXCEPTION 'Failed to create match response notification for client %', p_client_serial;
  END IF;
  
  RAISE NOTICE 'Created % notification for client: %', p_action, v_notification_id;
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PRACTITIONER NEW MATCH NOTIFICATION (SECURITY DEFINER - BYPASSES RLS)
-- ============================================================================

/**
 * Create notification when a new match is generated for a practitioner
 * SECURITY DEFINER bypasses RLS policies
 * Returns UUID of created notification
 * Called when client creates a project that matches practitioner
 */
DROP FUNCTION IF EXISTS create_practitioner_new_match_notification(TEXT, TEXT, TEXT, INTEGER) CASCADE;

CREATE OR REPLACE FUNCTION create_practitioner_new_match_notification(
  p_practitioner_serial TEXT,
  p_client_name TEXT,
  p_project_name TEXT,
  p_match_score INTEGER
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  -- Insert new match notification
  INSERT INTO practitioner_notifications (
    practitioner_serial,
    type,
    title,
    message,
    is_read,
    created_at
  )
  VALUES (
    p_practitioner_serial,
    'new_match',
    'New Match Request',
    p_client_name || ' has requested to connect with you for "' || p_project_name || '" (' || p_match_score || '% match)',
    false,
    NOW()
  )
  RETURNING id INTO v_notification_id;
  
  IF v_notification_id IS NULL THEN
    RAISE EXCEPTION 'Failed to create new match notification for practitioner %', p_practitioner_serial;
  END IF;
  
  RAISE NOTICE 'Created new match notification for practitioner: %', v_notification_id;
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_practitioner_new_match_notification(TEXT, TEXT, TEXT, INTEGER) TO authenticated;

-- ============================================================================
-- GET PRACTITIONER NOTIFICATION PREFERENCES (SECURITY DEFINER - BYPASSES RLS)
-- ============================================================================

/**
 * Get practitioner notification preferences by serial number
 * SECURITY DEFINER bypasses RLS policies
 * Used by notification system to determine how to notify practitioner
 * Returns row with matches_email and matches_sms flags
 */
DROP FUNCTION IF EXISTS get_practitioner_notification_preferences(TEXT) CASCADE;

CREATE OR REPLACE FUNCTION get_practitioner_notification_preferences(p_practitioner_serial TEXT)
RETURNS TABLE (
  matches_email BOOLEAN,
  matches_sms BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(pns.matches_email, true) AS matches_email,
    COALESCE(pns.matches_sms, true) AS matches_sms
  FROM practitioner_notification_settings pns
  WHERE pns.practitioner_serial = p_practitioner_serial;
  
  -- If no settings found, return defaults (both true)
  IF NOT FOUND THEN
    RETURN QUERY SELECT true, true;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_practitioner_notification_preferences(TEXT) TO authenticated;

-- ============================================================================
-- GET CLIENT NOTIFICATION PREFERENCES (SECURITY DEFINER - BYPASSES RLS)
-- ============================================================================

/**
 * Get client notification preferences by client serial
 * SECURITY DEFINER bypasses RLS policies
 * Used by notification system to determine how to notify client
 * Returns row with matches_email and matches_sms flags
 */
DROP FUNCTION IF EXISTS get_client_notification_preferences(TEXT) CASCADE;

CREATE OR REPLACE FUNCTION get_client_notification_preferences(p_client_serial TEXT)
RETURNS TABLE (
  matches_email BOOLEAN,
  matches_sms BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(cns.matches_email, true) AS matches_email,
    COALESCE(cns.matches_sms, true) AS matches_sms
  FROM client_notification_settings cns
  WHERE cns.client_serial = p_client_serial;
  
  -- If no settings found, return defaults (both true)
  IF NOT FOUND THEN
    RETURN QUERY SELECT true, true;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_client_notification_preferences(TEXT) TO authenticated;

-- ============================================================================
-- GET EXISTING REVIEW (SECURITY DEFINER - BYPASSES RLS)
-- ============================================================================

/**
 * Check if a client has already left a review for a practitioner on a project
 * SECURITY DEFINER bypasses RLS policies
 * Returns the existing review if found, or empty result if not
 */
DROP FUNCTION IF EXISTS get_existing_review(INTEGER, UUID, UUID) CASCADE;

CREATE OR REPLACE FUNCTION get_existing_review(
  p_project_serial INTEGER,
  p_practitioner_id UUID,
  p_client_id UUID
)
RETURNS TABLE (
  id UUID,
  rating INTEGER,
  review_text TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.rating,
    r.review_text
  FROM reviews r
  WHERE r.project_serial = p_project_serial
    AND r.practitioner_id = p_practitioner_id
    AND r.client_id = p_client_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_existing_review(INTEGER, UUID, UUID) TO authenticated;
