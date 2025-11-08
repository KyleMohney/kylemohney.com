╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: 03_SERIAL_NUMBERS_TRIGGERS_MASTER.sql                       ║
║  Purpose: All serial number generation and database triggers        ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

-- ============================================================================
-- MASTER: SERIAL NUMBERS & TRIGGERS
-- ============================================================================
-- Auto-generate serial numbers (C1, P1, 1...) on record creation
-- Update timestamps, manage related fields
-- Last Updated: November 8, 2025
-- ============================================================================

-- ============================================================================
-- SECTION 1: CLIENTS TABLE - SERIAL GENERATION
-- ============================================================================
-- Auto-generate C1, C2, C3... serial numbers

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
BEFORE INSERT ON clients
FOR EACH ROW
EXECUTE FUNCTION generate_client_serial();

-- Create sequence if not exists
CREATE SEQUENCE IF NOT EXISTS client_serial_seq START 1;

-- ============================================================================
-- SECTION 2: PRACTITIONERS TABLE - SERIAL GENERATION
-- ============================================================================
-- Auto-generate P1, P2, P3... serial numbers

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
BEFORE INSERT ON practitioners
FOR EACH ROW
EXECUTE FUNCTION generate_practitioner_serial();

-- Create sequence if not exists
CREATE SEQUENCE IF NOT EXISTS practitioner_serial_seq START 1;

-- ============================================================================
-- SECTION 3: PROJECTS TABLE - SERIAL GENERATION
-- ============================================================================
-- Auto-generate 1, 2, 3... integer serial numbers

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
BEFORE INSERT ON projects
FOR EACH ROW
EXECUTE FUNCTION generate_project_serial();

-- Create sequence if not exists
CREATE SEQUENCE IF NOT EXISTS project_serial_seq START 1;

-- ============================================================================
-- SECTION 4: TIMESTAMP MANAGEMENT
-- ============================================================================
-- Auto-update created_at and updated_at on all tables

-- CLIENTS
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
BEFORE INSERT OR UPDATE ON clients
FOR EACH ROW
EXECUTE FUNCTION update_clients_timestamps();

-- PRACTITIONERS
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
BEFORE INSERT OR UPDATE ON practitioners
FOR EACH ROW
EXECUTE FUNCTION update_practitioners_timestamps();

-- PROJECTS
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
BEFORE INSERT OR UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_projects_timestamps();

-- PROJECT_PRACTITIONER_MATCHES
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
BEFORE INSERT OR UPDATE ON project_practitioner_matches
FOR EACH ROW
EXECUTE FUNCTION update_matches_timestamps();

-- REVIEWS
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
BEFORE INSERT OR UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_reviews_timestamps();

-- ============================================================================
-- END MASTER: SERIAL NUMBERS & TRIGGERS
-- ============================================================================
