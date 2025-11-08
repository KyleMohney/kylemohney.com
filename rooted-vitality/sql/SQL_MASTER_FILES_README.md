╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: SQL_MASTER_FILES_README.md                                  ║
║  Purpose: Guide to consolidated SQL master files                   ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

# SQL Master Files Organization

This directory contains consolidated SQL master files organized by function. These replace scattered individual files.

---

## Master Files (Canonical)

### 1. `01_MATCHING_LOGIC_MASTER.sql`
**Purpose**: All matching algorithms and practitioner-to-project matching logic

**Contains**:
- `match_practitioners(UUID)` function - two-phase matching
  - PHASE 1: Hard filtering (all criteria must pass)
  - PHASE 2: Scoring by profile completion (2-100)
- Testing queries
- Validation diagnostics

**When to run**: When updating matching algorithm or troubleshooting matches

---

### 2. `02_ROW_LEVEL_SECURITY_MASTER.sql`
**Purpose**: All Row Level Security (RLS) policies for authentication and data access

**Contains**:
- Policies for CLIENTS table
- Policies for PRACTITIONERS table
- Policies for PROJECTS table
- Policies for PROJECT_PRACTITIONER_MATCHES table
- Policies for REVIEWS table
- Policies for NOTIFICATIONS table
- Policies for PROJECT_MESSAGES table

**When to run**: When setting up new database or resetting RLS policies

---

### 3. `03_SERIAL_NUMBERS_TRIGGERS_MASTER.sql`
**Purpose**: Serial number generation and timestamp management

**Contains**:
- Client serial generation (C1, C2, C3...)
- Practitioner serial generation (P1, P2, P3...)
- Project serial generation (1, 2, 3...)
- Timestamp auto-update triggers (created_at, updated_at)

**When to run**: When initializing database or after table modifications

---

## Deprecated Files (Archive)

These files have been consolidated into the master files. Keep for reference only.

- `matching_algorithm.sql` → Use `01_MATCHING_LOGIC_MASTER.sql`
- `RADIUS_MATCHING_IMPLEMENTATION.sql` → Use `01_MATCHING_LOGIC_MASTER.sql`
- `DEPRECATED_RADIUS_MATCHING_IMPLEMENTATION.sql` → Archive only
- `RLS_POLICIES_CURRENT.sql` → Use `02_ROW_LEVEL_SECURITY_MASTER.sql`
- `NOTIFICATIONS_RLS.sql` → Use `02_ROW_LEVEL_SECURITY_MASTER.sql`
- `REVIEWS_PRACTITIONER_VIEW_RLS.sql` → Use `02_ROW_LEVEL_SECURITY_MASTER.sql`
- `SERIAL_NUMBER_TRIGGERS.sql` → Use `03_SERIAL_NUMBERS_TRIGGERS_MASTER.sql`

---

## Individual Setup Files (Still Used)

These remain because they're one-time setup or reference documents:

- `1 - category_and_subcategory_tables.md` - Table structure docs
- `2 - clients_table.md` - Table structure docs
- `3 - reviews_table.md` - Table structure docs
- `4 - projects_table.md` - Table structure docs
- `5 - practitioners_table.md` - Table structure docs
- `SERIAL_NUMBER_SYSTEM.md` - Design documentation
- `diagnostics.sql` - Query utilities for debugging
- `migrations.sql` - Historical migrations

---

## How to Use Master Files

### Initial Database Setup
1. Run `03_SERIAL_NUMBERS_TRIGGERS_MASTER.sql` first (sequences, triggers)
2. Run `02_ROW_LEVEL_SECURITY_MASTER.sql` (security policies)
3. Run `01_MATCHING_LOGIC_MASTER.sql` (matching function)

### Update Matching Logic
- Edit `01_MATCHING_LOGIC_MASTER.sql` directly
- Run in Supabase SQL editor to update function

### Fix RLS Issues
- Edit `02_ROW_LEVEL_SECURITY_MASTER.sql` directly
- Run to reset all policies

### Troubleshoot Serial Numbers
- Check `03_SERIAL_NUMBERS_TRIGGERS_MASTER.sql`
- Verify sequences are running correctly

---

## Validation Queries

```sql
-- Check latest serial numbers
SELECT MAX(serial_number) FROM clients;
SELECT MAX(serial_number) FROM practitioners;
SELECT MAX(project_id) FROM projects;

-- Test matching function
SELECT * FROM match_practitioners('PROJECT_UUID'::UUID);

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Check trigger status
SELECT trigger_schema, trigger_name, trigger_table FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

---

## Important Notes

⚠️ **Do NOT**:
- Split master files into individual policies
- Create duplicate functions
- Run deprecated files in production

✅ **DO**:
- Keep master files as single source of truth
- Update master files when business logic changes
- Document why changes are made
- Test in dev environment first

---

**Last Updated**: November 8, 2025
**Version**: 2.0
**Status**: ACTIVE - All files consolidated and tested
