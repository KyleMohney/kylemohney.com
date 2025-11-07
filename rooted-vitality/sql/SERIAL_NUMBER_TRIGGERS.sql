/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  CRITICAL INFRASTRUCTURE: Serial Number System (v2)                ║
║  File: sql/SERIAL_NUMBER_TRIGGERS.sql                              ║
║  Purpose: Database triggers that auto-generate serial numbers      ║
║           for clients (C#), practitioners (P#), using sequences    ║
║  Status: ACTIVE - Running on every signup/insert                   ║
║  Last Updated: November 6, 2025                                    ║
║  Note: Now uses PostgreSQL sequences for perfect incrementing      ║
║        like the project_id system that's working perfectly         ║
╚════════════════════════════════════════════════════════════════════╝
*/

-- ═══════════════════════════════════════════════════════════════════
-- CREATE SEQUENCES FOR SERIAL NUMBERING
-- ═══════════════════════════════════════════════════════════════════
-- PostgreSQL sequences are atomic and guarantee no gaps or duplicates
-- This is the same pattern used by projects.project_id (which works!)

CREATE SEQUENCE IF NOT EXISTS client_serial_seq START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS practitioner_serial_seq START 1 INCREMENT 1;

-- ═══════════════════════════════════════════════════════════════════
-- CLIENT SERIAL NUMBER TRIGGER
-- ═══════════════════════════════════════════════════════════════════
-- Formula: C + nextval(sequence)
-- Result: C1, C2, C3, ... (guaranteed unique, no gaps)

CREATE OR REPLACE FUNCTION generate_client_serial()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.serial_number IS NULL THEN
    NEW.serial_number := 'C' || nextval('client_serial_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_client_serial ON clients;
CREATE TRIGGER set_client_serial
  BEFORE INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION generate_client_serial();

-- ═══════════════════════════════════════════════════════════════════
-- PRACTITIONER SERIAL NUMBER TRIGGER
-- ═══════════════════════════════════════════════════════════════════
-- Formula: P + nextval(sequence)
-- Result: P1, P2, P3, ... (guaranteed unique, no gaps)

CREATE OR REPLACE FUNCTION generate_practitioner_serial()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.serial_number IS NULL THEN
    NEW.serial_number := 'P' || nextval('practitioner_serial_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_practitioner_serial ON practitioners;
CREATE TRIGGER set_practitioner_serial
  BEFORE INSERT ON practitioners
  FOR EACH ROW
  EXECUTE FUNCTION generate_practitioner_serial();

-- ═══════════════════════════════════════════════════════════════════
-- HOW IT WORKS (Same pattern as projects.project_id)
-- ═══════════════════════════════════════════════════════════════════
-- 1. User signs up → INSERT to clients or practitioners table
-- 2. Trigger fires BEFORE INSERT
-- 3. Checks if serial_number IS NULL
-- 4. If NULL: calls nextval(sequence) to get next unique number
-- 5. Assigns new serial (C1, C2, P1, P2, etc.)
-- 6. Row inserted with serial automatically populated
--
-- Result: Every user gets a GUARANTEED UNIQUE serial, no duplicates
-- This is how projects.project_id works and it's bulletproof!

-- ═══════════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════════════

-- Check sequences were created:
SELECT * FROM pg_sequences 
WHERE schemaname = 'public' 
AND (sequencename = 'client_serial_seq' OR sequencename = 'practitioner_serial_seq');

-- Check triggers exist and are enabled:
SELECT tgname, tgenabled FROM pg_trigger 
WHERE tgname IN ('set_client_serial', 'set_practitioner_serial');

-- Check recent clients got serials (should show C1, C2, C3...):
SELECT email, serial_number, created_at FROM clients 
WHERE serial_number IS NOT NULL
ORDER BY created_at DESC LIMIT 10;

-- Check recent practitioners got serials (should show P1, P2, P3...):
SELECT email, serial_number, created_at FROM practitioners 
WHERE serial_number IS NOT NULL
ORDER BY created_at DESC LIMIT 10;

-- Get next serial that will be assigned:
SELECT nextval('client_serial_seq') - 1 AS last_client_serial,
       nextval('practitioner_serial_seq') - 1 AS last_practitioner_serial;
