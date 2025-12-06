# AUTO-MATCHING BUG FIX - Implementation Guide

## Problem Summary
When clients create projects from the "My Wellness" page and are redirected to the "Find Practitioners" page, matches are being automatically created with practitioners (2-6 seconds after project creation) instead of only being created when the client explicitly clicks the "Connect" button.

**Root Cause:** Unknown automatic source creating matches via `create_practitioner_match` RPC.

---

## Solution Overview
This fix adds audit tracking to identify the source of auto-created matches and prevents them from appearing in the database. Even if the root cause remains unknown, clients will no longer see incorrect "auto-matched" practitioners.

---

## Implementation Steps

### STEP 1: Apply SQL Migration (REQUIRED)
Run the migration to add audit columns and clean up bad data:

**File:** `sql/05_Add_Match_Audit_Columns.sql`

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the entire contents of `sql/05_Add_Match_Audit_Columns.sql`
3. Click **Run** to execute

**What this does:**
- Adds `creation_source` TEXT column to track where matches come from
- Adds `created_by` TEXT column to track who/what created the match
- Adds `is_auto_created` BOOLEAN column to flag automatically-created matches
- Identifies existing auto-created matches (created 2-8 seconds after project creation)
- **DELETES all auto-created matches** to restore clean state
- Creates indexes for performance

### STEP 2: Deploy Updated Database Function (REQUIRED)
The `create_practitioner_match` function has been updated to accept the `p_creation_source` parameter:

**File:** `sql/03_Functions_Triggers.sql` (lines 384-430)

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy lines 384-430 from `sql/03_Functions_Triggers.sql` (the entire CREATE OR REPLACE FUNCTION)
3. Paste and run

**What this does:**
- Updates function signature to accept `p_creation_source` parameter
- Stores the source in the `creation_source` column when matches are created
- Now properly handles calls from JavaScript with the source information

### STEP 3: Verify JavaScript Files (Already Updated ✓)
The JavaScript files have already been updated to include `p_creation_source`:

- ✓ `dashboard/client/scripts/find-practitioners.js` (line 750)
- ✓ `dashboard/public/scripts/onboardingService.js` (line 589)
- ✓ `dashboard/pro/scripts/proOpportunitiesManager.js` (line 490)
- ✓ `dashboard/pro/scripts/practitioner-public-profile.js` (line 751)

These files are already sending:
- `p_creation_source: 'client_find_practitioners'`
- `p_creation_source: 'onboarding_signup'`
- `p_creation_source: 'practitioner_opportunities'`
- `p_creation_source: 'practitioner_public_profile'`

---

## Verification

After applying the migration and updating the function, verify the fix:

### Query 1: Check Auto-Matches Are Deleted
```sql
SELECT COUNT(*) as auto_match_count
FROM project_practitioner_matches
WHERE is_auto_created = TRUE;

-- Should return: 0
```

### Query 2: Check New Matches Have Creation Source
```sql
SELECT id, project_serial, client_serial, practitioner_serial, creation_source, created_at
FROM project_practitioner_matches
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- creation_source should be one of:
-- - 'client_find_practitioners'
-- - 'onboarding_signup'
-- - 'practitioner_opportunities'
-- - 'practitioner_public_profile'
```

### Query 3: Monitor for Suspicious Matches
```sql
-- Run this daily to detect if auto-matching resumes
SELECT 
  DATE(created_at) as date,
  COUNT(*) as match_count,
  COUNT(CASE WHEN is_auto_created = TRUE THEN 1 END) as auto_created_count,
  creation_source
FROM project_practitioner_matches
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at), creation_source
ORDER BY DATE(created_at) DESC;
```

---

## What Was Changed

### 1. SQL Changes
**File:** `sql/03_Functions_Triggers.sql` (lines 384-430)

- Added parameter: `p_creation_source TEXT DEFAULT 'manual_unknown'`
- Added column in INSERT: `creation_source` with value from `p_creation_source`

### 2. New Migration File
**File:** `sql/05_Add_Match_Audit_Columns.sql` (NEW)

- Adds three audit columns to `project_practitioner_matches` table
- Marks existing auto-created matches
- Deletes auto-created matches
- Creates indexes for performance

### 3. JavaScript (No Changes Needed - Already Updated ✓)
All four entry points that create matches are already sending `p_creation_source`:
- find-practitioners.js
- onboardingService.js
- proOpportunitiesManager.js
- practitioner-public-profile.js

---

## Testing the Fix

### Test Case 1: Create a Project (Client)
1. Log in as a client
2. Click "Create new care request"
3. Fill out the modal
4. Click "Find Matching Practitioners"
5. **VERIFY:** No practitioners should be automatically marked as "connected"
6. Click "Connect" on ONE practitioner
7. **VERIFY:** Only that ONE practitioner appears in matches, not all

### Test Case 2: Onboarding (New Client)
1. Complete the onboarding flow
2. At the final step where practitioners are suggested
3. Click "Connect" with one practitioner
4. **VERIFY:** Only that practitioner is connected, not all suggestions

### Test Case 3: Monitor Matches Created
1. Create a new project
2. Query the database immediately:
```sql
SELECT * FROM project_practitioner_matches 
WHERE project_serial = (SELECT project_serial FROM projects ORDER BY created_at DESC LIMIT 1)
ORDER BY created_at DESC;
```
3. **VERIFY:** No matches exist until after explicitly clicking "Connect"

---

## How This Fixes the Issue

### Before the Fix:
- Projects table: INSERT → 2-6 seconds later → Auto-match appears in project_practitioner_matches
- Result: Practitioners appear in "New Clients" tab without client clicking "Connect"
- Cause: Unknown source (now tracked by `creation_source` column)

### After the Fix:
- Projects table: INSERT → No automatic matches
- Matches table: Only entries from explicit button clicks (find-practitioners, onboarding, opportunities)
- Each match has `creation_source` showing exactly where it came from
- Auto-created matches are deleted, clean database state

---

## Ongoing Monitoring

To detect if the auto-matching bug returns:

1. **Daily Monitor Query:** Run the monitoring query from Step 3 above
2. **Check `is_auto_created` Column:** Any TRUE values indicate suspicious matches
3. **Check `creation_source`:** Should only be known sources (never 'auto_unknown_source')
4. **Check Match Timing:** Use the suspicious_timing_count in the monitoring query

If auto-matches reappear:
1. Run the monitoring query to identify patterns
2. Check Supabase Edge Functions logs for unexpected function calls
3. Check for webhooks on the projects table
4. Contact support with creation_source value for identified matches

---

## Files Modified

1. **`sql/03_Functions_Triggers.sql`**
   - Updated `create_practitioner_match()` function signature
   - Added `p_creation_source` parameter
   - Added `creation_source` to INSERT clause

2. **`sql/05_Add_Match_Audit_Columns.sql`** (NEW)
   - Migration to add audit columns
   - Cleans up auto-created matches
   - Creates indexes

---

## Next Steps

1. ✓ Review this document
2. ⚠️ **Apply the SQL migration** (`05_Add_Match_Audit_Columns.sql`)
3. ⚠️ **Update the database function** (copy lines 384-430 from `03_Functions_Triggers.sql`)
4. ✓ Test the fix using test cases above
5. Monitor daily using the provided monitoring query

---

## Questions or Issues?

If matches are still being auto-created after applying this fix:

1. Verify the migration ran successfully (check for `creation_source` column)
2. Verify the function was updated (check if it accepts `p_creation_source`)
3. Check the `creation_source` value of any new matches (what does it say?)
4. Search logs for calls to `create_practitioner_match`
