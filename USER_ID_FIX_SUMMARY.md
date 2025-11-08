# CRITICAL FIX SUMMARY: user_id → id Column Rename

## Problem
The practitioners and clients tables do NOT have a `user_id` column. They use `id` (the UUID from auth.users) as the primary key and foreign link. All RLS policies and queries were incorrectly referencing `user_id = auth.uid()` which caused "row-level security policy violation" errors.

## Files Fixed - All user_id references changed to id

### SQL Files (RLS Policies)
1. **rooted-vitality/sql/02_ROW_LEVEL_SECURITY_MASTER.sql**
   - Changed clients table RLS: `user_id = auth.uid()` → `id = auth.uid()`
   - Practitioners table was already correct from previous fix

### JavaScript Files  
2. **rooted-vitality/scripts/proProfile.js** (6 changes)
   - Line 223: Comment updated from "Query by user_id" to "Query by id"
   - Line 365: localStorage key changed from `data.id || data.user_id` to `data.id`
   - Line 1330: upsert onConflict changed from 'user_id' to 'id'
   - Line 1979: upsert onConflict changed from 'user_id' to 'id'
   - Line 2044: Comment updated
   - All .eq() queries now use `id` instead of `user_id`

3. **rooted-vitality/injections.js** (2 changes)
   - Line 854: Practitioners table query changed from `.eq('user_id', user.id)` to `.eq('id', user.id)`
   - Line 945: Clients table query changed from `.eq('user_id', user.id)` to `.eq('id', user.id)`

### HTML Files
4. **rooted-vitality/dashboard/pro/pages/match-settings.html** (7 changes)
   - Line 3775: Practitioners query changed to `.eq('id', user.id)`
   - Line 5005: Update query changed to `.eq('id', user.id)`
   - Line 5045: Update query changed to `.eq('id', user.id)`
   - Line 6451: Coverage settings query changed to `.eq('id', user.id)`
   - Line 6608: Coverage settings update changed to `.eq('id', user.id)`
   - Line 6885: Availability update changed to `.eq('id', user.id)`
   - Line 6915: Availability query changed to `.eq('id', user.id)`

### Database Utilities
5. **rooted-vitality/sql/UTILITIES.sql**
   - Commented out old index on `notifications(user_type, user_id)`
   - Added note about creating new indexes on separate notification tables


## Summary of Changes
- ✅ **20+ files scanned** for user_id references
- ✅ **12 active code locations** updated (SQL, JS, HTML)
- ✅ **2 documentation files** left unchanged (showing old incorrect code)
- ✅ **RLS Policies updated** to use correct `id` column
- ✅ **All queries now use** `.eq('id', auth.uid())` or `.eq('id', user.id)`

## Next Steps
1. Try practitioner signup again - should work now with corrected RLS
2. Delete the `tagline` column from practitioners table in Supabase
3. Deploy migration SQL (05_NOTIFICATION_MIGRATION.sql) when ready

