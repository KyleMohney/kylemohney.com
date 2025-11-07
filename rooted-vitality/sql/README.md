# SQL Documentation

This folder contains all SQL files for the Rooted Vitality platform database.

## Core Files (Industry Standard)

### 1. `migrations.sql`
**Purpose:** All database schema migrations in chronological order  
**When to use:** Setting up new database or updating schema  
**Contains:**
- Serial number system (C1, C2, P1, P2)
- Projects table structure
- Practitioner coverage schema (in-person, house-calls, virtual)
- Availability & timezone fields
- Client settings
- Indexes for performance

### 2. `rls_policies.sql`
**Purpose:** Row Level Security policies for data access control  
**When to use:** Setting up RLS or troubleshooting access issues  
**Contains:**
- Projects table policies
- Matches table policies
- Concerns table policies
- Reviews table policies

### 3. `diagnostics.sql`
**Purpose:** Common diagnostic and debugging queries  
**When to use:** Troubleshooting, checking data, performance analysis  
**Contains:**
- Table structure checks
- RLS policy checks
- Foreign key checks
- Index checks
- Data counts and analysis queries
- Performance queries

### 4. `schema_tables.md`
**Purpose:** Complete table schema documentation  
**When to use:** Reference for table structures, relationships, and field meanings  
**Note:** Manually maintained - update when schema changes

## How to Use

### Initial Setup
1. Run `migrations.sql` on fresh database
2. Run `rls_policies.sql` to enable security
3. Use `diagnostics.sql` queries to verify setup

### Making Schema Changes
1. Add new migration to `migrations.sql` with clear comments
2. Update `rls_policies.sql` if security rules change
3. Update `schema_tables.md` with new fields/tables
4. Test with queries from `diagnostics.sql`

### Troubleshooting
1. Check `diagnostics.sql` for relevant query
2. Verify RLS policies in `rls_policies.sql`
3. Review migration history in `migrations.sql`

## File Organization

```
/sql/
├── migrations.sql        # All schema changes (chronological)
├── rls_policies.sql      # Security policies
├── diagnostics.sql       # Debug & check queries
└── schema_tables.md      # Documentation (manual)
```

## Migration Naming Convention

Each migration in `migrations.sql` follows this format:
```sql
-- ============================================================================
-- MIGRATION XXX: Brief Description
-- ============================================================================
-- Description: Detailed explanation
-- Date: YYYY-MM-DD
-- [SQL statements...]
```

## Best Practices

1. **Never delete migrations** - Only add new ones
2. **Test migrations** on dev before production
3. **Document changes** in migration comments
4. **Update schema docs** when tables change
5. **Keep policies in sync** with table changes
6. **Use diagnostics** to verify changes

## Legacy Files

All previous SQL files have been consolidated. If you need historical context, check git history.
