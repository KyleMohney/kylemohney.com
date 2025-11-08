-- ============================================================================
-- MIGRATION: Update Pricing Column to Store Service Pricing Array
-- ============================================================================
-- Description: Convert practitioners.pricing from TEXT to JSONB to store 
--              array of service pricing with structure:
--              [{service_id, category_name, subcategory_name, price_per_service}, ...]
-- ============================================================================

-- Step 1: Backup existing data (if any)
-- SELECT id, pricing FROM practitioners WHERE pricing IS NOT NULL;

-- Step 2: Drop the old TEXT column and create new JSONB column
ALTER TABLE practitioners
DROP COLUMN IF EXISTS pricing;

ALTER TABLE practitioners
ADD COLUMN IF NOT EXISTS pricing JSONB DEFAULT NULL;

-- Add comment explaining the new structure
COMMENT ON COLUMN practitioners.pricing IS 'JSONB array storing service pricing. Structure: [{service_id: UUID, category_name: TEXT, subcategory_name: TEXT, price_per_service: NUMERIC}, ...]. If NULL or empty, practitioner uses default pricing.';

-- Step 3: Create index for performance
CREATE INDEX IF NOT EXISTS idx_practitioners_pricing ON practitioners USING gin(pricing);

-- Step 4: Verify the column exists and is JSONB
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'practitioners' AND column_name = 'pricing';

-- ============================================================================
-- DONE: practitioners.pricing is now JSONB and ready to store service arrays
-- ============================================================================
