/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  Database Migrations: Practitioner Schema Updates                  ║
║  Purpose: Add availability settings and payment/insurance columns  ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝
*/

-- ========================================== 
-- MIGRATION 1: Add Availability Settings
-- ==========================================
-- Adds JSONB column for day-by-day availability scheduling
-- Structure: { "monday": { "available": true, "open": "09:00", "close": "17:00", "notes": null }, ... }

ALTER TABLE public.practitioners
ADD COLUMN IF NOT EXISTS availability_schedule JSONB DEFAULT NULL;

COMMENT ON COLUMN public.practitioners.availability_schedule IS 
'Day-by-day availability schedule with open/close times and optional notes. JSONB format with keys: monday through sunday, each containing: available (boolean), open (time string), close (time string), notes (string or null)';

-- Create index for faster JSONB queries (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_practitioners_availability ON public.practitioners USING GIN (availability_schedule);

-- ========================================== 
-- MIGRATION 2: Add Payment & Insurance Columns
-- ==========================================

-- Insurance acceptance and provider tracking
ALTER TABLE public.practitioners
ADD COLUMN IF NOT EXISTS accepts_insurance BOOLEAN DEFAULT false;

ALTER TABLE public.practitioners
ADD COLUMN IF NOT EXISTS insurance_providers TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE public.practitioners
ADD COLUMN IF NOT EXISTS custom_insurance_providers TEXT DEFAULT NULL;

-- Payment methods tracking
ALTER TABLE public.practitioners
ADD COLUMN IF NOT EXISTS payment_methods TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE public.practitioners
ADD COLUMN IF NOT EXISTS custom_payment_methods TEXT DEFAULT NULL;

-- Add comments for clarity
COMMENT ON COLUMN public.practitioners.accepts_insurance IS 
'Boolean flag indicating if practitioner accepts insurance billing';

COMMENT ON COLUMN public.practitioners.insurance_providers IS 
'Array of insurance provider identifiers accepted (e.g., [''aetna'', ''anthem'', ''cigna''])';

COMMENT ON COLUMN public.practitioners.custom_insurance_providers IS 
'Comma-separated list of custom/non-standard insurance providers';

COMMENT ON COLUMN public.practitioners.payment_methods IS 
'Array of payment methods accepted (e.g., [''credit-card'', ''paypal'', ''venmo'', ''cash'', ''check'', ''fsa-hsa'', ''zelle'', ''square-cash''])';

COMMENT ON COLUMN public.practitioners.custom_payment_methods IS 
'Comma-separated list of custom payment methods (e.g., ''bank transfer, wire transfer'')';

-- ========================================== 
-- EXAMPLE DATA STRUCTURE
-- ==========================================
-- Availability Schedule Example:
-- {
--   "monday": { "available": true, "open": "09:00", "close": "17:00", "notes": "Lunch 12-1pm" },
--   "tuesday": { "available": true, "open": "09:00", "close": "17:00", "notes": null },
--   "wednesday": { "available": false, "open": null, "close": null, "notes": "No appointments" },
--   "thursday": { "available": true, "open": "09:00", "close": "17:00", "notes": null },
--   "friday": { "available": true, "open": "09:00", "close": "17:00", "notes": null },
--   "saturday": { "available": true, "open": "10:00", "close": "14:00", "notes": null },
--   "sunday": { "available": false, "open": null, "close": null, "notes": null }
-- }

-- Insurance Providers Example:
-- accepts_insurance: true
-- insurance_providers: ['aetna', 'anthem', 'cigna', 'humana', 'united', 'bcbs']
-- custom_insurance_providers: "State Health Plan, Regional Preferred"

-- Payment Methods Example:
-- payment_methods: ['credit-card', 'paypal', 'venmo', 'cash', 'check']
-- custom_payment_methods: "Bank transfer, Wire transfer, Crypto accepted"

-- ========================================== 
-- VERIFICATION QUERIES
-- ==========================================
-- Run these to verify the columns were added successfully:

-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'practitioners' 
-- AND column_name IN ('availability_schedule', 'accepts_insurance', 'insurance_providers', 
--                     'custom_insurance_providers', 'payment_methods', 'custom_payment_methods')
-- ORDER BY ordinal_position DESC;

-- ========================================== 
-- ROLLBACK QUERIES (if needed)
-- ==========================================
-- To remove these columns, run:

-- ALTER TABLE public.practitioners
-- DROP COLUMN IF EXISTS availability_schedule,
-- DROP COLUMN IF EXISTS accepts_insurance,
-- DROP COLUMN IF EXISTS insurance_providers,
-- DROP COLUMN IF EXISTS custom_insurance_providers,
-- DROP COLUMN IF EXISTS payment_methods,
-- DROP COLUMN IF EXISTS custom_payment_methods;
