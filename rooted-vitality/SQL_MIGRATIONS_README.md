# SQL Migrations - Quick Reference

## To Apply These Migrations:

1. **Open Supabase Console**
   - Go to https://supabase.com
   - Select your Rooted Vitality project
   - Click "SQL Editor" in left sidebar

2. **Copy & Execute MIGRATION 011**
   
   ```sql
   -- ============================================================================
   -- MIGRATION 011: Normalize House Calls Naming
   -- ============================================================================
   -- Description: Remove duplicate house_calls_* columns and standardize to housecalls_*
   
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
   ```

3. **Copy & Execute MIGRATION 012**
   
   ```sql
   -- ============================================================================
   -- MIGRATION 012: Add Per-Service Pricing
   -- ============================================================================
   -- Description: Add ability to set different prices for different services per practitioner
   
   ALTER TABLE practitioner_selected_services
   ADD COLUMN IF NOT EXISTS price_per_service NUMERIC(10, 2) DEFAULT NULL;
   
   COMMENT ON COLUMN practitioner_selected_services.price_per_service IS 'Price for this specific service (e.g., 150.00). If NULL, practitioner uses their default pricing from practitioners.pricing field.';
   
   -- Create index for performance when filtering/sorting by price
   CREATE INDEX IF NOT EXISTS idx_practitioner_selected_services_price 
   ON practitioner_selected_services(practitioner_id, price_per_service) 
   WHERE price_per_service IS NOT NULL;
   ```

4. **Verify Success**
   
   ```sql
   -- Check the new column exists:
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'practitioner_selected_services'
   AND column_name = 'price_per_service';
   
   -- Should return:
   -- column_name         | data_type | is_nullable
   -- price_per_service   | numeric   | YES
   ```

## Status: ✅ Ready to Apply

Both migrations are production-ready and include:
- Proper error handling (IF NOT EXISTS / IF EXISTS)
- Documentation (COMMENTs)
- Performance indexes
- Data validation constraints

