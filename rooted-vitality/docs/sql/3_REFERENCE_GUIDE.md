# Rooted Vitality - SQL & Database Master Reference

## 📋 Quick Start

### New Setup (From Scratch)
1. Open Supabase SQL Editor
2. Copy entire content from `1_MASTER_DATABASE_SETUP.sql`
3. Paste and run
4. Done! All tables, functions, and indexes are created

### Existing Setup (Add Missing Pieces)
See SECTION 8 of `1_MASTER_DATABASE_SETUP.sql` for step-by-step additions.

---

## 📁 File Organization

### Active Files (USE THESE)
- **`1_MASTER_DATABASE_SETUP.sql`** - Complete schema setup (all-in-one)
- **`2_DIAGNOSTIC_QUERIES.sql`** - Check database status and health
- **`3_REFERENCE_GUIDE.md`** - This file

### Archive Files (Historical - Can be deleted)
These files are now consolidated into the master files above:
- `SQL_SETUP.md` - See Master Setup
- `SQL_SETUP_READY_TO_RUN.sql` - See Master Setup
- `SQL_SETUP_FINAL_FIXED.sql` - See Master Setup
- `MIGRATION_ADD_PROFILE_FIELDS.sql` - See Master Setup
- `UPDATE_PRACTITIONERS_SCHEMA.sql` - See Master Setup
- `SERIAL_NUMBER_SYSTEM.sql` - See Master Setup
- `VERIFY_NO_DUPLICATES.sql` - See Diagnostic Queries
- `STEP_BY_STEP_CREATE_TABLES.sql` - For reference only
- `SQL_SIMPLEST_NO_CONSTRAINTS.sql` - For reference only
- `SQL_MINIMAL_ONE_LINER.sql` - For reference only
- `DIAGNOSTIC_QUERIES.sql` - See Diagnostic Queries v2
- `SQL_CORRECTIONS_SUMMARY.md` - Historical
- `SQL_FINAL_SOLUTION.md` - Historical
- `ERROR_SOLUTION_STATUS_COLUMN.md` - Historical
- `SQL_LINE_BREAK_FIX_EXPLAINED.md` - Historical
- `RESOLUTION_GUIDE_COMPLETE.md` - Historical
- Other `.md` files - Historical

---

## 🗄️ Database Schema

### Tables

#### `profiles` (Client Accounts)
- **id** (uuid, FK auth.users)
- **email** (text, unique)
- **full_name** (text)
- **avatar_url** (text)
- **role** (text: client, practitioner)
- **serial_number** (text, unique) - Support team reference
- **bio** (text)
- **preferences** (jsonb)
- **created_at, updated_at** (timestamps)

#### `practitioners` (Practitioner Accounts)
- **id** (uuid, PK)
- **user_id** (uuid, FK auth.users)
- **email** (text)
- **serial_number** (text, unique) - Support team reference
- **legal_business_name, dba_name** (text)
- **profile_photo_url, practice_logo_url** (text)
- **location** (text)
- **years_in_practice** (text)
- **business_size** (text)
- **workspace_type** (text: home, office, mobile, shared)
- **coverage_type** (text: in-person, virtual, both)
- **bio** (text)
- **ethos_statement** (text)
- **social_media** (jsonb) - {facebook, instagram, twitter, linkedin, youtube, tiktok, pinterest, website}
- **faq** (jsonb) - Array of FAQ items
- **languages** (text[]) - Array of language codes
- **modalities** (text[]) - Array of service types
- **education_credentials** (jsonb) - Array of education entries
- **license_credentials** (jsonb) - Array of license entries
- **certification_credentials** (jsonb) - Array of certification entries
- **status** (text: draft, pending_review, approved, rejected)
- **background_check_status** (text)
- **created_at, updated_at** (timestamps)

#### `background_checks`
- **id** (uuid, PK)
- **practitioner_id** (uuid, FK)
- **status** (text)
- **check_date, expiry_date** (timestamps)

#### `credentials`
- **id** (uuid, PK)
- **practitioner_id** (uuid, FK)
- **credential_type** (text: education, license, certification)
- **name, issuer** (text)
- **issue_date, expiry_date** (date)

#### `memberships`
- **id** (uuid, PK)
- **user_id** (uuid, FK)
- **membership_type** (text: free, pro, elite)
- **status** (text: active, cancelled, expired)
- **stripe_subscription_id** (text)

#### `serial_number_registry` (Master Lookup)
- **id** (uuid, PK)
- **serial_number** (text, unique) - "C00010001", "P00020001", etc.
- **entity_type** (text: CLIENT, PRACTITIONER)
- **entity_id** (uuid) - FK to profiles or practitioners
- **email, name** (text) - Cache for quick lookup
- **created_at** (timestamp)

#### `opportunities` (Leads/Bookings)
- **id** (uuid, PK)
- **serial_number** (text, unique) - "O00030001", etc.
- **client_id** (uuid, FK to profiles)
- **practitioner_id** (uuid, FK to practitioners)
- **service_type** (text)
- **description** (text)
- **status** (text: new, open, contacted, in_progress, completed, cancelled)
- **created_at, updated_at** (timestamps)

---

## 🔢 Serial Number System

### Format
- **Client**: `C` + 8 digits → C00010001, C00010002, ...
- **Practitioner**: `P` + 8 digits → P00020001, P00020002, ...
- **Opportunity**: `O` + 8 digits → O00030001, O00030002, ...

### Usage
```sql
-- Create new client serial
SELECT generate_serial_number('CLIENT', user_uuid, email, full_name);

-- Create new practitioner serial
SELECT generate_serial_number('PRACTITIONER', practitioner_uuid, email, legal_business_name);

-- Create new opportunity/lead
SELECT generate_opportunity_serial(client_id, practitioner_id, service_type, description);

-- Lookup any account
SELECT * FROM lookup_by_serial('C00010001');
```

---

## 🚀 Common Tasks

### Check Database Health
```sql
-- Run all diagnostics from 2_DIAGNOSTIC_QUERIES.sql
-- Checks for:
-- - Missing tables
-- - Missing columns
-- - Duplicate columns
-- - Row counts
-- - Sequence values
```

### Add New Column to Practitioners
```sql
ALTER TABLE practitioners
ADD COLUMN IF NOT EXISTS new_column_name data_type;
```

### Generate Serial for Existing User
```sql
SELECT generate_serial_number(
    'CLIENT',
    user_id_uuid,
    'email@example.com',
    'Full Name'
);
```

### Find Account by Serial (Support Team)
```sql
SELECT * FROM lookup_by_serial('C00010042');
```

### Update Practitioner Profile
```sql
UPDATE practitioners
SET bio = 'New bio text',
    social_media = jsonb_set(social_media, '{facebook}', '"https://facebook.com/..."')
WHERE user_id = user_uuid;
```

### Track Opportunity Status
```sql
SELECT * FROM opportunities 
WHERE status = 'new' 
ORDER BY created_at DESC;
```

---

## 🔍 Diagnostic Queries

Run these to check system health:

```sql
-- See all tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- See all columns in practitioners
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'practitioners'
ORDER BY ordinal_position;

-- Check for duplicate columns
SELECT column_name, COUNT(*) 
FROM information_schema.columns 
WHERE table_name = 'practitioners'
GROUP BY column_name 
HAVING COUNT(*) > 1;

-- Row counts
SELECT 
    'profiles' as table_name, COUNT(*) as rows FROM profiles
UNION ALL
SELECT 'practitioners', COUNT(*) FROM practitioners
UNION ALL
SELECT 'serial_number_registry', COUNT(*) FROM serial_number_registry
UNION ALL
SELECT 'opportunities', COUNT(*) FROM opportunities;

-- Current sequence values
SELECT sequencename, last_value 
FROM pg_sequences 
WHERE sequencename LIKE '%serial%';
```

---

## 🛠️ Troubleshooting

### Problem: "Table already exists"
**Solution:** That's OK! The `IF NOT EXISTS` clause prevents errors. The file is safe to run multiple times.

### Problem: "Column already exists"
**Solution:** Same as above. Idempotent setup - safe to re-run.

### Problem: "Missing column X in practitioners"
**Solution:** Add it manually:
```sql
ALTER TABLE practitioners
ADD COLUMN IF NOT EXISTS column_name data_type;
```

### Problem: "Serial numbers missing for existing users"
**Solution:** Run backfill migration in SECTION 8 of Master Setup file.

### Problem: "Can't find account by serial"
**Solution:** Run diagnostic queries to check:
- Does serial exist in serial_number_registry?
- Is it spelled correctly?
- Use: `SELECT * FROM serial_number_registry WHERE serial_number = 'C00010001';`

---

## 📊 Index Strategy

Fast lookups are optimized for:
- Serial number lookup (by serial)
- Practitioner lookup (by status, email, user_id)
- Opportunity lookup (by client, practitioner, status)
- Date-based queries

All indexes are created automatically in Master Setup.

---

## 🔐 Row-Level Security (RLS)

RLS policies should be configured in Supabase Auth settings:
- Users can only see their own profile
- Practitioners can only edit their own profile
- Support team has special read-only access to all serials

Configure in Supabase dashboard under "Authentication → Policies"

---

## 🗑️ Cleanup (Optional)

If you have old files in `/docs/sql/` and want to clean up:

**Safe to Delete:**
- All `.md` files except this one
- All old SQL files listed in "Archive Files" section above
- Anything with "OLD", "BACKUP", "TEST" in the name

**Keep:**
- `1_MASTER_DATABASE_SETUP.sql`
- `2_DIAGNOSTIC_QUERIES.sql`
- `3_REFERENCE_GUIDE.md` (this file)

---

## 📞 Support

For issues or questions:
1. Run diagnostic queries (see above)
2. Check table structure in Supabase UI
3. Review error messages in logs
4. Verify serial number format matches expected pattern

---

## Version History

- **v1.0** - Nov 2, 2025: Consolidated master setup with serial number system
- Master setup replaces all individual migration files
- Diagnostic queries provide complete health check
- Reference guide centralizes all documentation
