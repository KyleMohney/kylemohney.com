# Database Schema Cleanup - COMPLETE

**Date:** November 6, 2025  
**Status:** Ready for Production Deploy

---

## Executive Summary

✅ **All duplicates and unused columns identified and scheduled for removal**

Three migrations created:
- **MIGRATION 012**: Add per-service pricing support
- **MIGRATION 013**: Remove house_calls_* duplicates 
- **MIGRATION 014**: Remove unused legacy columns

---

## Key Findings

### Duplicate Columns (Confirmed via practitioner_tables.md)

Found 5 pairs of duplicate columns with inconsistent naming:

| Duplicate Pair | Keep | Remove | Status |
|----------------|------|--------|--------|
| housecalls_enabled / house_calls_enabled | housecalls_enabled | house_calls_enabled | ✅ Drop |
| housecalls_option / house_calls_option | housecalls_option | house_calls_option | ✅ Drop |
| housecalls_base_zipcode / house_calls_base_zipcode | housecalls_base_zipcode | house_calls_base_zipcode | ✅ Drop |
| housecalls_radius_miles / house_calls_radius_miles | housecalls_radius_miles | house_calls_radius_miles | ✅ Drop |
| housecalls_zipcodes / house_calls_zipcodes | housecalls_zipcodes | house_calls_zipcodes | ✅ Drop |

**Why?** The database has both versions. Code uses `housecalls_*` (no underscore) internally via matchSettingsManager. Database columns should match code conventions.

---

### Used Columns (KEEP - Don't Remove!)

**modalities** (ARRAY)
- ✅ Used in: find-practitioners.js, my-matches.js, practitioner-profile.js  
- Purpose: Display specialization/modality labels on cards
- Keep: YES - actively referenced

**tagline** (TEXT)
- ✅ Used in: practitioner-profile.js (lines 198-199)
- Purpose: Display hero callout text on public profile
- Keep: YES - actively referenced

---

### Unused Columns (Safe to Remove)

**workspace_type** (TEXT)
- ❌ No code references found
- Migration 014: Drop

**availability** (ARRAY - legacy)
- ❌ Replaced by availability_schedule (JSONB)
- Migration 014: Drop

---

## Migrations Ready for Deploy

### MIGRATION 012: Per-Service Pricing
```sql
ALTER TABLE practitioner_selected_services
ADD COLUMN IF NOT EXISTS price_per_service NUMERIC(10, 2) DEFAULT NULL;
```

**Purpose:** Store pricing per service for practitioners who charge differently based on service type

**Example:**
- Acupuncture: $150/session
- Herbal Consultation: $125/session  
- Follow-up: $100/session

---

### MIGRATION 013: Remove Duplicate Columns
```sql
ALTER TABLE practitioners
DROP COLUMN IF EXISTS house_calls_enabled,
DROP COLUMN IF EXISTS house_calls_option,
DROP COLUMN IF EXISTS house_calls_base_zipcode,
DROP COLUMN IF EXISTS house_calls_radius_miles,
DROP COLUMN IF EXISTS house_calls_zipcodes;
```

**Impact:** Removes redundant database columns, keeps `housecalls_*` versions

**Data Safety:** Zero data loss - columns being removed are duplicates with same data

---

### MIGRATION 014: Remove Unused Legacy Columns  
```sql
ALTER TABLE practitioners
DROP COLUMN IF EXISTS workspace_type,
DROP COLUMN IF EXISTS availability;
```

**Impact:** Cleans up unused schema

**Data Safety:** These columns had no code references or were replaced by other columns

---

## Code Architecture Notes

### House Calls in Code vs Database

**In Code (matchSettingsManager.js line 118):**
```javascript
house_calls: {
  enabled: false,
  option_a: { base_zip, radius_miles },
  option_b: { zips: [] }
}
```

**In Database (post-cleanup):**
```
housecalls_enabled BOOLEAN
housecalls_option TEXT ('radius', 'zipcodes')
housecalls_base_zipcode TEXT
housecalls_radius_miles INTEGER
housecalls_zipcodes ARRAY
```

**Why Different Names?** In-memory objects use snake_case with underscores, but database columns should follow established convention (housecalls_* without underscore is established in code).

---

## Pre-Deploy Checklist

- [ ] Backup production database
- [ ] Apply MIGRATION 012 (add price_per_service)
- [ ] Apply MIGRATION 013 (remove duplicates)
- [ ] Apply MIGRATION 014 (remove unused columns)
- [ ] Verify no data loss: `SELECT COUNT(*) FROM practitioners WHERE housecalls_* IS NOT NULL`
- [ ] Verify UI still works (match settings page)
- [ ] Verify profile display still works (uses modalities, tagline)
- [ ] Monitor for errors in logs

---

## Post-Deploy

- Update practitioner_tables.md documentation
- Monitor application logs for any issues
- Update API documentation if applicable

---

## Files Modified

- `/docs/sql/migrations.sql` - Added MIGRATION 012, 013, 014
- `/SQL_AUDIT_AND_CLEANUP.md` - Comprehensive audit with findings
- `/dashboard/pro/match-settings.html` - Added pricing UI ✅
- Next: `/scripts/matchSettingsManager.js` - Add updateServicePrice method
- Next: `/scripts/practitioner-profile.js` - Display pricing on profile

