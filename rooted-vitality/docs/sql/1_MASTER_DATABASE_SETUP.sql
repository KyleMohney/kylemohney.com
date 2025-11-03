-- ═══════════════════════════════════════════════════════════════════════════
-- ROOTED VITALITY - MASTER DATABASE SETUP
-- Complete schema initialization and configuration
-- Run this file to set up the entire database from scratch
-- ═══════════════════════════════════════════════════════════════════════════

/*
IMPORTANT: This file contains the complete, production-ready database setup.
It is organized in logical sections and can be run start-to-finish.

If you already have tables created, use STEP-BY-STEP sections at the end
to add only the columns/tables you're missing.

SECTIONS:
  1. INITIAL SETUP - Extension enablement
  2. TABLE CREATION - All core tables
  3. SCHEMA ADDITIONS - New fields added over time
  4. SERIAL NUMBER SYSTEM - Client/Practitioner tracking
  5. VERIFICATION & DIAGNOSTICS - Check what was created
  6. BACKFILL MIGRATIONS - Populate serials for existing data
*/

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 1: INITIAL SETUP - EXTENSIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable UUID extension (for uuid_generate_v4())
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 2: TABLE CREATION - CORE TABLES
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- TABLE: profiles (Client accounts)
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text UNIQUE NOT NULL,
    full_name text,
    avatar_url text,
    role text CHECK (role IN ('client', 'practitioner')) DEFAULT 'client',
    
    -- Profile metadata
    serial_number text UNIQUE,
    bio text,
    preferences jsonb,
    
    -- Timestamps
    created_at timestamp with time zone DEFAULT NOW(),
    updated_at timestamp with time zone DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────
-- TABLE: practitioners (Practitioner accounts)
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS practitioners (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL,
    phone text,
    
    -- Business Identity
    legal_name text,
    legal_business_name text,
    dba_name text,
    pronouns text,
    serial_number text UNIQUE,
    
    -- Media
    profile_photo_url text,
    practice_logo_url text,
    gallery_urls text[],
    intro_video_url text,
    
    -- Workspace & Coverage
    workspace_type text CHECK (workspace_type IN ('home', 'office', 'mobile', 'shared')),
    coverage_type text CHECK (coverage_type IN ('in-person', 'virtual', 'both')),
    travel_radius integer,
    location text,
    
    -- Services
    languages text[],
    years_in_practice text,
    business_size text,
    year_established integer,
    
    -- Credentials
    license_type text,
    license_issuer text,
    certifications text,
    education text,
    modalities text[],
    
    -- Availability & Contact
    service_description text,
    availability text[],
    cancellation_policy text,
    accessibility_notes text,
    intake_process text,
    preferred_contact text,
    tagline text,
    
    -- Profile Content
    bio text,
    ethos_statement text,
    social_media jsonb DEFAULT '{}',
    faq jsonb DEFAULT '[]',
    
    -- Credentials Arrays (JSON)
    education_credentials jsonb DEFAULT '[]',
    license_credentials jsonb DEFAULT '[]',
    certification_credentials jsonb DEFAULT '[]',
    
    -- Status
    status text DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected')),
    background_check_status text,
    rejection_reason text,
    
    -- Timestamps
    submitted_at timestamp with time zone,
    approved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT NOW(),
    updated_at timestamp with time zone DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────
-- TABLE: background_checks
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS background_checks (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    practitioner_id uuid NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    check_date timestamp with time zone,
    expiry_date timestamp with time zone,
    result jsonb,
    created_at timestamp with time zone DEFAULT NOW(),
    updated_at timestamp with time zone DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────
-- TABLE: credentials
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS credentials (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    practitioner_id uuid NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
    credential_type text CHECK (credential_type IN ('education', 'license', 'certification')),
    name text NOT NULL,
    issuer text,
    issue_date date,
    expiry_date date,
    credential_number text,
    document_url text,
    verified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────
-- TABLE: memberships (Paid subscriptions)
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS memberships (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    membership_type text CHECK (membership_type IN ('free', 'pro', 'elite')),
    status text DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
    stripe_subscription_id text UNIQUE,
    billing_period_start timestamp with time zone,
    billing_period_end timestamp with time zone,
    created_at timestamp with time zone DEFAULT NOW(),
    updated_at timestamp with time zone DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 3: SERIAL NUMBER SYSTEM
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- TABLE: serial_number_registry
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS serial_number_registry (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    serial_number TEXT NOT NULL UNIQUE,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('CLIENT', 'PRACTITIONER')),
    entity_id uuid NOT NULL,
    email TEXT,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_serial_per_entity UNIQUE (entity_type, entity_id)
);

-- ─────────────────────────────────────────────────────────────────────────
-- TABLE: opportunities (Leads/bookings)
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS opportunities (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    serial_number TEXT NOT NULL UNIQUE,
    client_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    practitioner_id uuid REFERENCES practitioners(id) ON DELETE CASCADE,
    service_type TEXT,
    description TEXT,
    status TEXT CHECK (status IN ('new', 'open', 'contacted', 'in_progress', 'completed', 'cancelled')) DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT must_reference_either_client_or_practitioner CHECK (
        (client_id IS NOT NULL AND practitioner_id IS NULL) OR
        (client_id IS NULL AND practitioner_id IS NOT NULL) OR
        (client_id IS NOT NULL AND practitioner_id IS NOT NULL)
    )
);

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 4: SEQUENCES FOR SERIAL NUMBERS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE SEQUENCE IF NOT EXISTS client_serial_sequence START 10000;
CREATE SEQUENCE IF NOT EXISTS practitioner_serial_sequence START 20000;
CREATE SEQUENCE IF NOT EXISTS opportunity_serial_sequence START 30000;

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 5: INDEXES FOR PERFORMANCE
-- ═══════════════════════════════════════════════════════════════════════════

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_serial ON profiles(serial_number);

-- Practitioners indexes
CREATE INDEX IF NOT EXISTS idx_practitioners_email ON practitioners(email);
CREATE INDEX IF NOT EXISTS idx_practitioners_user_id ON practitioners(user_id);
CREATE INDEX IF NOT EXISTS idx_practitioners_status ON practitioners(status);
CREATE INDEX IF NOT EXISTS idx_practitioners_serial ON practitioners(serial_number);
CREATE INDEX IF NOT EXISTS idx_practitioners_workspace ON practitioners(workspace_type);
CREATE INDEX IF NOT EXISTS idx_practitioners_coverage ON practitioners(coverage_type);

-- Background checks indexes
CREATE INDEX IF NOT EXISTS idx_background_checks_practitioner ON background_checks(practitioner_id);
CREATE INDEX IF NOT EXISTS idx_background_checks_status ON background_checks(status);

-- Credentials indexes
CREATE INDEX IF NOT EXISTS idx_credentials_practitioner ON credentials(practitioner_id);
CREATE INDEX IF NOT EXISTS idx_credentials_type ON credentials(credential_type);

-- Memberships indexes
CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);

-- Serial number registry indexes
CREATE INDEX IF NOT EXISTS idx_serial_number ON serial_number_registry(serial_number);
CREATE INDEX IF NOT EXISTS idx_entity_type_id ON serial_number_registry(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_created_at ON serial_number_registry(created_at);

-- Opportunities indexes
CREATE INDEX IF NOT EXISTS idx_opportunity_serial ON opportunities(serial_number);
CREATE INDEX IF NOT EXISTS idx_opportunity_client ON opportunities(client_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_practitioner ON opportunities(practitioner_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_status ON opportunities(status);

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 6: SQL FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- FUNCTION: generate_serial_number
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION generate_serial_number(
    p_entity_type TEXT,
    p_entity_id uuid,
    p_email TEXT DEFAULT NULL,
    p_name TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_serial TEXT;
    v_sequence_id BIGINT;
BEGIN
    IF p_entity_type = 'CLIENT' THEN
        v_sequence_id := NEXTVAL('client_serial_sequence');
        v_serial := 'C' || LPAD(v_sequence_id::TEXT, 8, '0');
    ELSIF p_entity_type = 'PRACTITIONER' THEN
        v_sequence_id := NEXTVAL('practitioner_serial_sequence');
        v_serial := 'P' || LPAD(v_sequence_id::TEXT, 8, '0');
    ELSE
        RAISE EXCEPTION 'Invalid entity_type: %', p_entity_type;
    END IF;
    
    INSERT INTO serial_number_registry (serial_number, entity_type, entity_id, email, name)
    VALUES (v_serial, p_entity_type, p_entity_id, p_email, p_name)
    ON CONFLICT (entity_type, entity_id) DO UPDATE
    SET serial_number = v_serial, email = p_email, name = p_name;
    
    RETURN v_serial;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────────────────
-- FUNCTION: lookup_by_serial
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION lookup_by_serial(p_serial TEXT)
RETURNS TABLE (
    serial_number TEXT,
    entity_type TEXT,
    entity_id uuid,
    email TEXT,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sr.serial_number,
        sr.entity_type,
        sr.entity_id,
        sr.email,
        sr.name,
        sr.created_at
    FROM serial_number_registry sr
    WHERE sr.serial_number = p_serial;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────────────────
-- FUNCTION: generate_opportunity_serial
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION generate_opportunity_serial(
    p_client_id uuid DEFAULT NULL,
    p_practitioner_id uuid DEFAULT NULL,
    p_service_type TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_serial TEXT;
    v_sequence_id BIGINT;
BEGIN
    v_sequence_id := NEXTVAL('opportunity_serial_sequence');
    v_serial := 'O' || LPAD(v_sequence_id::TEXT, 8, '0');
    
    INSERT INTO opportunities (serial_number, client_id, practitioner_id, service_type, description)
    VALUES (v_serial, p_client_id, p_practitioner_id, p_service_type, p_description);
    
    RETURN v_serial;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 7: VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════════════════════

-- Run these to verify the setup is complete:

-- Check all tables were created:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('profiles', 'practitioners', 'background_checks', 'credentials', 'memberships', 'serial_number_registry', 'opportunities')
-- ORDER BY table_name;

-- Check practitioners columns:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'practitioners'
-- ORDER BY ordinal_position;

-- Check for duplicates:
-- SELECT column_name, COUNT(*) as count
-- FROM information_schema.columns WHERE table_name = 'practitioners'
-- GROUP BY column_name HAVING COUNT(*) > 1;

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 8: BACKFILL MIGRATIONS (Run only if you have existing data)
-- ═══════════════════════════════════════════════════════════════════════════

-- Uncomment and run these AFTER the main setup to populate serials for existing users:

/*
-- Generate serials for existing clients:
INSERT INTO serial_number_registry (serial_number, entity_type, entity_id, email, name)
SELECT 
    'C' || LPAD(ROW_NUMBER() OVER (ORDER BY p.created_at)::TEXT, 8, '0'),
    'CLIENT',
    p.id,
    p.email,
    p.full_name
FROM profiles p
WHERE p.id NOT IN (SELECT entity_id FROM serial_number_registry WHERE entity_type = 'CLIENT')
ON CONFLICT DO NOTHING;

-- Generate serials for existing practitioners:
INSERT INTO serial_number_registry (serial_number, entity_type, entity_id, email, name)
SELECT 
    'P' || LPAD(ROW_NUMBER() OVER (ORDER BY pr.created_at)::TEXT, 8, '0'),
    'PRACTITIONER',
    pr.id,
    pr.email,
    pr.legal_business_name
FROM practitioners pr
WHERE pr.id NOT IN (SELECT entity_id FROM serial_number_registry WHERE entity_type = 'PRACTITIONER')
ON CONFLICT DO NOTHING;

-- Update profiles table with generated serials:
UPDATE profiles p
SET serial_number = (SELECT serial_number FROM serial_number_registry WHERE entity_id = p.id AND entity_type = 'CLIENT')
WHERE serial_number IS NULL;

-- Update practitioners table with generated serials:
UPDATE practitioners pr
SET serial_number = (SELECT serial_number FROM serial_number_registry WHERE entity_id = pr.id AND entity_type = 'PRACTITIONER')
WHERE serial_number IS NULL;
*/

-- ═══════════════════════════════════════════════════════════════════════════
-- END OF MASTER SETUP FILE
-- ═══════════════════════════════════════════════════════════════════════════
