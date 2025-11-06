# SQL Schema Audit & Cleanup Plan
**Date:** November 6, 2025  
**Status:** DRAFT - Ready for Review

---

## Executive Summary

The database has **REDUNDANT COLUMNS** that should be consolidated:

### 🔴 CRITICAL ISSUES FOUND

#### 1. **DUPLICATE HOUSE CALLS COLUMNS** (naming inconsistency)
- `housecalls_*` (current live columns)
- `house_calls_*` (duplicate/old columns)

**Conflict:**
```
house_calls_enabled          ← Appears in migrations.sql
housecalls_enabled           ← Appears in practitioners table metadata
```

**Resolution:** Use `housecalls_*` consistently (without underscore)
- Delete: `house_calls_enabled`, `house_calls_option`, `house_calls_base_zipcode`, `house_calls_radius_miles`, `house_calls_zipcodes`
- Keep: `housecalls_enabled`, `housecalls_option`, `housecalls_base_zipcode`, `housecalls_radius_miles`, `housecalls_zipcodes`

---

#### 2. **REDUNDANT GENERIC PRICING COLUMN**
- `pricing` (TEXT, currently on practitioners table)
- NEW: `price_per_service` (JSONB, on practitioner_selected_services)

**Problem:** Generic `pricing` column on practitioners table doesn't support per-service pricing  
**Solution:** 
- Keep `pricing` for legacy/reference (default/base pricing)
- Add `price_per_service` JSONB to `practitioner_selected_services` for granular per-service pricing

**Structure:**
```json
{
  "subcategory_uuid_1": 150.00,
  "subcategory_uuid_2": 175.00,
  "subcategory_uuid_3": 200.00
}
```

---

#### 3. **UNUSED TABLES** (Check these in production)

Table: `practitioner_match_pause_history`
- Created in schema docs but **NOT FOUND** in migrations.sql
- Status: **May not exist in production**
- Recommendation: Either create or remove from documentation

---

## Proposed Migrations

### MIGRATION 011: Normalize House Calls Naming
```sql
-- Drop old inconsistent column names
ALTER TABLE practitioners
DROP COLUMN IF EXISTS house_calls_enabled,
DROP COLUMN IF EXISTS house_calls_option,
DROP COLUMN IF EXISTS house_calls_base_zipcode,
DROP COLUMN IF EXISTS house_calls_radius_miles,
DROP COLUMN IF EXISTS house_calls_zipcodes;

-- Add comments to clarify correct columns
COMMENT ON COLUMN practitioners.housecalls_enabled IS 'Whether practitioner travels to client locations for sessions';
COMMENT ON COLUMN practitioners.housecalls_option IS 'Coverage type: radius (base zipcode + mileage) or zipcodes (specific list)';
COMMENT ON COLUMN practitioners.housecalls_base_zipcode IS 'Base ZIP code for house calls radius calculation';
COMMENT ON COLUMN practitioners.housecalls_radius_miles IS 'Travel radius in miles from base ZIP code';
COMMENT ON COLUMN practitioners.housecalls_zipcodes IS 'Array of specific ZIP codes for house calls coverage';
```

---

### MIGRATION 012: Add Per-Service Pricing
```sql
-- Add pricing support to practitioner_selected_services
ALTER TABLE practitioner_selected_services
ADD COLUMN IF NOT EXISTS price_per_service NUMERIC(10, 2) DEFAULT NULL;

-- Comment for clarity
COMMENT ON COLUMN practitioner_selected_services.price_per_service IS 'Price for this specific service. If NULL, uses practitioner''s default pricing.';

-- Index for performance if needed
CREATE INDEX IF NOT EXISTS idx_practitioner_selected_services_price 
ON practitioner_selected_services(practitioner_id, price_per_service);
```

**Note:** Alternative JSONB approach would store all prices in one column on the main row, but per-row storage is cleaner and easier to manage.

---

## Table Inventory

### ✅ TABLES IN USE (verified)

| Table | Purpose | Used By | Status |
|-------|---------|---------|--------|
| `practitioners` | Main practitioner profiles | signup, settings, profiles, matching | ✅ Active |
| `practitioner_selected_services` | Selected services per practitioner | match-settings, profiles | ✅ Active |
| `holistic_health_taxonomy` | Service categories | match-settings, profiles | ✅ Active |
| `taxonomy_subcategories` | Individual services | match-settings, profiles | ✅ Active |
| `clients` | Client profiles | client-side, matching | ✅ Active |
| `projects` | Client project requests | matching, reviews | ✅ Active |
| `project_practitioner_matches` | Match history | matching, leads | ✅ Active |

### ⚠️ TABLES REFERENCED IN DOCS (check existence)

| Table | Purpose | Status | Action |
|-------|---------|--------|--------|
| `practitioner_match_pause_history` | Historical pause/resume tracking | ❓ UNKNOWN | Check if exists; if not, create or remove from docs |
| `practitioner_reviews` | Client reviews | ❓ UNKNOWN | Verify existence |
| `practitioner_credentials` | Credentials/licenses | ❓ UNKNOWN | May be JSONB field in practitioners instead |

---

## Column Consolidation

### Practitioner Table - Unused/Redundant Columns

| Column | Type | Purpose | Status | Action |
|--------|------|---------|--------|--------|
| `pricing` | TEXT | Generic pricing text | Active | Keep - use as default/fallback |
| `payment_methods` | TEXT | Generic payment text | Active | Keep - legacy field |
| `custom_payment_methods` | TEXT | Custom payment text | Active | Keep - legacy field |
| `modalities` | ARRAY | Service modalities | Active | Keep |
| `availability` | ARRAY | Legacy availability | Active | Verify: use or remove? |
| `workspace_type` | TEXT | Type of workspace | Active | Keep |

---

## Recommendations

### Priority 1 (Do Now)
1. ✅ Add `price_per_service` column to `practitioner_selected_services`
2. ✅ Update UI to capture pricing per service in match-settings
3. ✅ Update pro settings manager to save pricing

### Priority 2 (Do Soon)  
1. Verify `practitioner_match_pause_history` exists; create if missing
2. Normalize `house_calls_*` → `housecalls_*` naming if possible
3. Add indexes on pricing columns

### Priority 3 (Consider)
1. Review unused columns like `availability`, `workspace_type`
2. Consider archiving old `pricing` column once per-service pricing is live
3. Document all JSONB structures (credentials, notification_preferences, etc.)

---

## Column Usage Analysis

### ✅ ACTIVELY USED COLUMNS (Keep)
- `modalities` - **USED** in find-practitioners.js (line 387, 436), my-matches.js, practitioner-profile.js
  - Display: "Various Modalities" fallback shown on cards
  - Used for: Card specialty display, modal info

- `tagline` - **USED** in practitioner-profile.js (line 198-199)
  - Display: Set in hero section as `#profile-tagline`
  - Used for: Public profile hero callout

### ⚠️ CODE STRUCTURE ISSUES (But Still Used)
- `house_calls` in matchSettingsManager.js (line 118) - **IN-MEMORY OBJECT** only
  - This is NOT a database column name
  - It's used in coverage settings nested object
  - Safe to have DB column as `housecalls_*` (no underscore)

### ❌ NOT ACTUALLY USED (Safe to Keep)
- `workspace_type` - Appears in migration but no code references found
- `availability` (legacy array) - Appears in migration but not used (replaced by availability_schedule JSONB)

---

## FINAL CLEANUP PLAN

### DO NOT DROP (Actively Used):
- ✅ `modalities` - Used extensively, keep as-is
- ✅ `tagline` - Used on public profile, keep as-is

### MUST DROP (Duplicate Columns):
- ❌ `house_calls_enabled` (keep `housecalls_enabled`)
- ❌ `house_calls_option` (keep `housecalls_option`)
- ❌ `house_calls_base_zipcode` (keep `housecalls_base_zipcode`)
- ❌ `house_calls_radius_miles` (keep `housecalls_radius_miles`)
- ❌ `house_calls_zipcodes` (keep `housecalls_zipcodes`)

### OPTIONAL CLEANUP (Unused but Harmless):
- `workspace_type` - No code references, safe to drop
- `availability` (legacy) - Replaced by availability_schedule, safe to drop

---

## Implementation Checklist

- [ ] Add MIGRATION 013 (drop duplicates) to migrations.sql
- [ ] Execute migration in Supabase console
- [ ] Verify no data loss: SELECT count(*) FROM practitioners WHERE housecalls_* IS NOT NULL
- [ ] Add price_per_service column (MIGRATION 012)
- [ ] Update HTML: Add price input fields in match-settings.html ✅ DONE
- [ ] Update JavaScript: Add price save logic to proSettings.js
- [ ] Update JavaScript: Add price display logic to practitioner-profile.js
- [ ] Test end-to-end: Set price → Save → Display on profile

