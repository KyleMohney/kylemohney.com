-- ============================================================================
-- MASTER MIGRATIONS
-- Rooted Vitality Platform
-- ============================================================================
-- This file contains all critical database migrations in chronological order.
-- Run these migrations to set up or update the database schema.
-- Created: 2025-11-05
-- ============================================================================

-- ============================================================================
-- MIGRATION 001: Add Serial Number System
-- ============================================================================
-- Description: Add serial_number columns to clients and practitioners tables
-- for human-readable identifiers (C1, C2, P1, P2, etc.)

-- Clients serial numbers
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS serial_number TEXT UNIQUE;

CREATE OR REPLACE FUNCTION generate_client_serial()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.serial_number IS NULL THEN
    NEW.serial_number := 'C' || COALESCE(
      (SELECT MAX(CAST(SUBSTRING(serial_number, 2) AS INTEGER)) FROM clients WHERE serial_number ~ '^C[0-9]+$'),
      0
    ) + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_client_serial ON clients;
CREATE TRIGGER set_client_serial
  BEFORE INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION generate_client_serial();

-- Practitioners serial numbers
ALTER TABLE practitioners 
ADD COLUMN IF NOT EXISTS serial_number TEXT UNIQUE;

CREATE OR REPLACE FUNCTION generate_practitioner_serial()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.serial_number IS NULL THEN
    NEW.serial_number := 'P' || COALESCE(
      (SELECT MAX(CAST(SUBSTRING(serial_number, 2) AS INTEGER)) FROM practitioners WHERE serial_number ~ '^P[0-9]+$'),
      0
    ) + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_practitioner_serial ON practitioners;
CREATE TRIGGER set_practitioner_serial
  BEFORE INSERT ON practitioners
  FOR EACH ROW
  EXECUTE FUNCTION generate_practitioner_serial();

-- Backfill existing records
UPDATE clients SET serial_number = generate_client_serial() WHERE serial_number IS NULL;
UPDATE practitioners SET serial_number = generate_practitioner_serial() WHERE serial_number IS NULL;

COMMENT ON COLUMN clients.serial_number IS 'Human-readable client identifier (C1, C2, C3...)';
COMMENT ON COLUMN practitioners.serial_number IS 'Human-readable practitioner identifier (P1, P2, P3...)';


-- ============================================================================
-- MIGRATION 002: Projects Table Structure
-- ============================================================================
-- Description: Update projects table with proper serial number linking and status fields

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS client_serial TEXT,
ADD COLUMN IF NOT EXISTS project_status TEXT DEFAULT 'pending' CHECK (project_status IN ('pending', 'matched', 'hired', 'canceled')),
ADD COLUMN IF NOT EXISTS review_left BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS client_open_to_contact BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS travel_preference TEXT DEFAULT 'in-person' CHECK (travel_preference IN ('in-person', 'house-calls', 'virtual'));

-- Add foreign key constraint
ALTER TABLE projects
DROP CONSTRAINT IF EXISTS fk_client_serial,
ADD CONSTRAINT fk_client_serial 
  FOREIGN KEY (client_serial) 
  REFERENCES clients(serial_number) 
  ON DELETE CASCADE;

COMMENT ON COLUMN projects.client_serial IS 'Client serial number (C1, C2, etc.) - foreign key to clients.serial_number';
COMMENT ON COLUMN projects.project_status IS 'Current status: pending (created but not matched), matched (practitioner matched), hired (hired), canceled (closed/hidden from customer view)';
COMMENT ON COLUMN projects.review_left IS 'Whether client has left a review for this project';
COMMENT ON COLUMN projects.client_open_to_contact IS 'Whether client allows practitioners to contact them about this project';
COMMENT ON COLUMN projects.travel_preference IS 'Type of service delivery: in-person (client visits practitioner), house-calls (practitioner visits client), virtual (remote session)';


-- ============================================================================
-- MIGRATION 003: Practitioner Coverage Schema
-- ============================================================================
-- Description: Comprehensive coverage options for practitioners (in-person, house-calls, virtual)

-- IN-PERSON COVERAGE
ALTER TABLE practitioners
ADD COLUMN IF NOT EXISTS in_person_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS in_person_option TEXT CHECK (in_person_option IN ('radius', 'zipcodes')),
ADD COLUMN IF NOT EXISTS in_person_base_zipcode TEXT,
ADD COLUMN IF NOT EXISTS in_person_radius_miles INTEGER CHECK (in_person_radius_miles >= 0 AND in_person_radius_miles <= 500),
ADD COLUMN IF NOT EXISTS in_person_zipcodes TEXT[];

-- HOUSE-CALLS COVERAGE
ALTER TABLE practitioners
ADD COLUMN IF NOT EXISTS housecalls_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS housecalls_option TEXT CHECK (housecalls_option IN ('radius', 'zipcodes')),
ADD COLUMN IF NOT EXISTS housecalls_base_zipcode TEXT,
ADD COLUMN IF NOT EXISTS housecalls_radius_miles INTEGER CHECK (housecalls_radius_miles >= 0 AND housecalls_radius_miles <= 500),
ADD COLUMN IF NOT EXISTS housecalls_zipcodes TEXT[];

-- VIRTUAL COVERAGE
ALTER TABLE practitioners
ADD COLUMN IF NOT EXISTS virtual_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS virtual_option TEXT CHECK (virtual_option IN ('nationwide', 'states')),
ADD COLUMN IF NOT EXISTS virtual_states TEXT[];

COMMENT ON COLUMN practitioners.in_person_enabled IS 'Whether practitioner offers in-person sessions at their office/location';
COMMENT ON COLUMN practitioners.in_person_option IS 'Coverage type: radius (base zipcode + mileage) or zipcodes (specific list)';
COMMENT ON COLUMN practitioners.housecalls_enabled IS 'Whether practitioner travels to client locations for sessions';
COMMENT ON COLUMN practitioners.housecalls_option IS 'Coverage type: radius (base zipcode + mileage) or zipcodes (specific list)';
COMMENT ON COLUMN practitioners.virtual_enabled IS 'Whether practitioner offers remote/virtual sessions';
COMMENT ON COLUMN practitioners.virtual_option IS 'Coverage type: nationwide (all US) or states (specific list)';


-- ============================================================================
-- MIGRATION 004: Availability & Timezone
-- ============================================================================
-- Description: Add practitioner availability schedule and timezone

ALTER TABLE practitioners 
ADD COLUMN IF NOT EXISTS availability_schedule JSONB,
ADD COLUMN IF NOT EXISTS timezone TEXT,
ADD COLUMN IF NOT EXISTS availability_last_updated TIMESTAMPTZ;

COMMENT ON COLUMN practitioners.timezone IS 'Practitioner timezone (e.g., America/New_York, America/Denver)';
COMMENT ON COLUMN practitioners.availability_schedule IS 'JSON object containing weekly schedule with open/close times per day';
COMMENT ON COLUMN practitioners.availability_last_updated IS 'Timestamp of last availability schedule update';


-- ============================================================================
-- MIGRATION 005: Client Settings
-- ============================================================================
-- Description: Add client preference settings

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS open_to_contact BOOLEAN DEFAULT true;

COMMENT ON COLUMN clients.open_to_contact IS 'Whether client allows practitioners to contact them about their projects';


-- ============================================================================
-- MIGRATION 006: Project Practitioner Matches Serial Numbers
-- ============================================================================
-- Description: Add serial number columns to matches table

ALTER TABLE project_practitioner_matches 
ADD COLUMN IF NOT EXISTS practitioner_serial TEXT,
ADD COLUMN IF NOT EXISTS client_serial TEXT;

ALTER TABLE project_practitioner_matches
DROP CONSTRAINT IF EXISTS fk_practitioner_serial,
ADD CONSTRAINT fk_practitioner_serial 
  FOREIGN KEY (practitioner_serial) 
  REFERENCES practitioners(serial_number) 
  ON DELETE CASCADE;

ALTER TABLE project_practitioner_matches
DROP CONSTRAINT IF EXISTS fk_client_serial,
ADD CONSTRAINT fk_client_serial 
  FOREIGN KEY (client_serial) 
  REFERENCES clients(serial_number) 
  ON DELETE CASCADE;

COMMENT ON COLUMN project_practitioner_matches.practitioner_serial IS 'Practitioner serial number (P1, P2, etc.)';
COMMENT ON COLUMN project_practitioner_matches.client_serial IS 'Client serial number (C1, C2, etc.) - denormalized from project';


-- ============================================================================
-- MIGRATION 007: Indexes for Performance
-- ============================================================================
-- Description: Add indexes for common query patterns

-- Serial number indexes
CREATE INDEX IF NOT EXISTS idx_clients_serial_number ON clients(serial_number);
CREATE INDEX IF NOT EXISTS idx_practitioners_serial_number ON practitioners(serial_number);
CREATE INDEX IF NOT EXISTS idx_projects_client_serial ON projects(client_serial);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(project_status);

-- Coverage indexes
CREATE INDEX IF NOT EXISTS idx_practitioners_in_person_enabled ON practitioners(in_person_enabled) WHERE in_person_enabled = true;
CREATE INDEX IF NOT EXISTS idx_practitioners_housecalls_enabled ON practitioners(housecalls_enabled) WHERE housecalls_enabled = true;
CREATE INDEX IF NOT EXISTS idx_practitioners_virtual_enabled ON practitioners(virtual_enabled) WHERE virtual_enabled = true;

-- GIN indexes for array searches
CREATE INDEX IF NOT EXISTS idx_practitioners_in_person_zipcodes ON practitioners USING GIN(in_person_zipcodes);
CREATE INDEX IF NOT EXISTS idx_practitioners_housecalls_zipcodes ON practitioners USING GIN(housecalls_zipcodes);
CREATE INDEX IF NOT EXISTS idx_practitioners_virtual_states ON practitioners USING GIN(virtual_states);

-- Matches indexes
CREATE INDEX IF NOT EXISTS idx_matches_practitioner_serial ON project_practitioner_matches(practitioner_serial);
CREATE INDEX IF NOT EXISTS idx_matches_client_serial ON project_practitioner_matches(client_serial);
CREATE INDEX IF NOT EXISTS idx_matches_status ON project_practitioner_matches(status);


-- ============================================================================
-- END OF MIGRATIONS
-- ============================================================================
