-- ============================================================================
-- MIGRATION: Add Client First/Last Name to Reviews Table
-- ============================================================================
-- Description: Add client_first_name and client_last_name columns to reviews table
-- Purpose: Store client's actual name for intelligent display formatting
-- Allows: Display as "F. LastName" or fallback to other formats

-- Step 1: Add the new columns
ALTER TABLE reviews
ADD COLUMN client_first_name TEXT DEFAULT NULL,
ADD COLUMN client_last_name TEXT DEFAULT NULL;

-- Step 2: Add comments explaining the columns
COMMENT ON COLUMN reviews.client_first_name IS 'Client first name from clients table - used for formatted display (e.g., "John")';
COMMENT ON COLUMN reviews.client_last_name IS 'Client last name from clients table - used for formatted display (e.g., "Smith")';

-- Step 3: Create an index on client_last_name for sorting/filtering
CREATE INDEX idx_reviews_client_last_name ON reviews(client_last_name);

-- ============================================================================
-- NOTES FOR IMPLEMENTATION:
-- ============================================================================
-- 1. This migration adds the columns but does NOT migrate existing data
-- 2. New reviews submitted will populate these columns from the clients table
-- 3. For existing reviews, client_first_name and client_last_name will be NULL
-- 4. Display logic should handle NULL gracefully by falling back to client_name
-- 5. Optional: Run UPDATE to populate existing reviews if desired:
--
--    UPDATE reviews r
--    SET client_first_name = c.first_name,
--        client_last_name = c.last_name
--    FROM clients c
--    WHERE r.client_id_uuid = c.id;
--
-- ============================================================================
