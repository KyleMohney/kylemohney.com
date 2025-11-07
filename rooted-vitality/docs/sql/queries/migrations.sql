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
-- MIGRATION 007: Soft Delete System
-- ============================================================================
-- Description: Add soft delete timestamps for audit trail and testing

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

ALTER TABLE practitioners
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

COMMENT ON COLUMN clients.deleted_at IS 'Soft delete timestamp - NULL if active, timestamp if deleted';
COMMENT ON COLUMN practitioners.deleted_at IS 'Soft delete timestamp - NULL if active, timestamp if deleted';


-- ============================================================================
-- MIGRATION 008: Matching System
-- ============================================================================
-- Description: Add matching toggle and credentials verification fields

ALTER TABLE practitioners
ADD COLUMN IF NOT EXISTS matching_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS matching_paused BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS credentials_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS profile_completion_percent INTEGER DEFAULT 0;

COMMENT ON COLUMN practitioners.matching_enabled IS 'Whether practitioner wants to receive new match opportunities';
COMMENT ON COLUMN practitioners.matching_paused IS 'Whether practitioner has temporarily paused matching';
COMMENT ON COLUMN practitioners.credentials_verified IS 'Whether practitioner credentials have been verified by admin';
COMMENT ON COLUMN practitioners.profile_completion_percent IS 'Percentage of profile fields filled (0-100)';


-- ============================================================================
-- MIGRATION 009: Add Subcategory Text Field to Projects
-- ============================================================================
-- Description: Store subcategory text/label directly in projects table for easier matching

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS subcategory_text TEXT;

COMMENT ON COLUMN projects.subcategory_text IS 'User-selected subcategory text (e.g., "Pregnancy Support", "Labor Support") - stored for easier filtering in matching queries';


-- ============================================================================
-- MIGRATION 010: Add Indexes for Performance
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
-- MIGRATION 011: Normalize House Calls Naming
-- ============================================================================
-- Description: Remove duplicate house_calls_* columns and standardize to housecalls_*
-- This fixes naming inconsistency in the schema (some columns use underscore, some don't)

ALTER TABLE practitioners
DROP COLUMN IF EXISTS house_calls_enabled,
DROP COLUMN IF EXISTS house_calls_option,
DROP COLUMN IF EXISTS house_calls_base_zipcode,
DROP COLUMN IF EXISTS house_calls_radius_miles,
DROP COLUMN IF EXISTS house_calls_zipcodes;

-- Update comments on the correct columns
COMMENT ON COLUMN practitioners.housecalls_enabled IS 'Whether practitioner travels to client locations for sessions';
COMMENT ON COLUMN practitioners.housecalls_option IS 'Coverage type: radius (base zipcode + mileage) or zipcodes (specific list)';
COMMENT ON COLUMN practitioners.housecalls_base_zipcode IS 'Base ZIP code for house calls radius calculation';
COMMENT ON COLUMN practitioners.housecalls_radius_miles IS 'Travel radius in miles from base ZIP code';
COMMENT ON COLUMN practitioners.housecalls_zipcodes IS 'Array of specific ZIP codes for house calls coverage';


-- ============================================================================
-- MIGRATION 012: Add Per-Service Pricing
-- ============================================================================
-- Description: Add ability to set different prices for different services per practitioner
-- This enables practitioners to charge varying rates based on service complexity/type

ALTER TABLE practitioner_selected_services
ADD COLUMN IF NOT EXISTS price_per_service NUMERIC(10, 2) DEFAULT NULL;

COMMENT ON COLUMN practitioner_selected_services.price_per_service IS 'Price for this specific service (e.g., 150.00). If NULL, practitioner uses their default pricing from practitioners.pricing field.';

-- Create index for performance when filtering/sorting by price
CREATE INDEX IF NOT EXISTS idx_practitioner_selected_services_price 
ON practitioner_selected_services(practitioner_id, price_per_service) 
WHERE price_per_service IS NOT NULL;


-- ============================================================================
-- MIGRATION 013: Remove Duplicate House Calls Columns
-- ============================================================================
-- Description: Remove duplicate house_calls_* columns (with underscore)
-- Keep housecalls_* versions (without underscore) for consistency
-- These columns contained identical data and were creating schema confusion

ALTER TABLE practitioners
DROP COLUMN IF EXISTS house_calls_enabled,
DROP COLUMN IF EXISTS house_calls_option,
DROP COLUMN IF EXISTS house_calls_base_zipcode,
DROP COLUMN IF EXISTS house_calls_radius_miles,
DROP COLUMN IF EXISTS house_calls_zipcodes;

-- Clarify the correct columns
COMMENT ON COLUMN practitioners.housecalls_enabled IS 'Whether practitioner travels to client locations for sessions';
COMMENT ON COLUMN practitioners.housecalls_option IS 'Coverage type: radius (base zipcode + mileage) or zipcodes (specific list)';
COMMENT ON COLUMN practitioners.housecalls_base_zipcode IS 'Base ZIP code for house calls radius calculation';
COMMENT ON COLUMN practitioners.housecalls_radius_miles IS 'Travel radius in miles from base ZIP code';
COMMENT ON COLUMN practitioners.housecalls_zipcodes IS 'Array of specific ZIP codes for house calls coverage';


-- ============================================================================
-- MIGRATION 014: Remove Unused Columns (Optional Cleanup)
-- ============================================================================
-- Description: Remove unused legacy columns that have no code references
-- These columns consume space and add schema confusion

ALTER TABLE practitioners
DROP COLUMN IF EXISTS workspace_type,
DROP COLUMN IF EXISTS availability;

COMMENT ON TABLE practitioners IS 'Main practitioner profile data. Coverage area, services, and pricing managed through relationships to dedicated tables.';

-- ============================================================================
-- END OF MIGRATIONS
-- ============================================================================
