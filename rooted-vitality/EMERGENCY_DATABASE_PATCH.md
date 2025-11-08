╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: EMERGENCY_DATABASE_PATCH.md                                 ║
║  Purpose: Critical UUID vs Integer type mismatches across codebase  ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

# EMERGENCY DATABASE PATCH — Critical Type Mismatches

## OVERVIEW

The codebase has mixed UUID and INTEGER handling for `project_id`:
- **Database**: `project_practitioner_matches.project_id` = INTEGER (1, 2, 3...)
- **Database**: `projects.id` = UUID (actual record ID)
- **Database**: `projects.project_id` = INTEGER (serial number)

Multiple JavaScript files are still passing UUIDs where integers are expected, causing:
- RPC matching algorithm failures
- Query mismatches in joins
- Match records not being found

---

## CRITICAL ISSUES IDENTIFIED

### Issue 1: find-practitioners.js Line 192
**File**: `scripts/find-practitioners.js`
**Current**: Calls RPC with UUID
```javascript
.rpc('match_practitioners', { p_project_id: project.id });  // ❌ UUID
```
**Should Be**: Pass UUID but RPC converts to integer internally
```javascript
.rpc('match_practitioners', { p_project_id: project.id });  // ✓ UUID OK (RPC handles)
```
**Status**: RPC needs to accept UUID and look up the integer

---

### Issue 2: find-practitioners.js Line 182
**File**: `scripts/find-practitioners.js`
**Current**: Storing UUID in sessionStorage
```javascript
sessionStorage.setItem('selectedProjectId', project.id);  // UUID
```
**Problem**: Later code expects integer
**Fix**: Store both or convert appropriately

---

### Issue 3: find-practitioners.js Line 713
**File**: `scripts/find-practitioners.js`
**Current**: Using UUID for project_messages insert
```javascript
const { error: messageError } = await supabaseClient
  .from('project_messages')
  .insert({
    project_id: selectedProject.id,  // ❌ UUID - wrong table?
```
**Problem**: Unclear what `project_messages.project_id` type is
**Action**: Verify table schema and fix type

---

### Issue 4: my-matches.js Line 405
**File**: `scripts/my-matches.js`
**Current**: Querying projects table with integer from matches
```javascript
.eq('id', selectedMatch.project_id);  // ❌ project_id is integer, id is UUID
```
**Should Be**: Use UUID from join or lookup
```javascript
// Need to get the UUID first, then query by id
```

---

### Issue 5: practitioner-profile.js Lines 466, 508
**File**: `scripts/practitioner-profile.js`
**Current**: Creating matches with UUID
```javascript
project_id: project.id,  // UUID - should be integer
```
**Should Be**:
```javascript
project_id: project.project_id,  // Integer serial number
```

---

### Issue 6: practitioner-profile.js Line 522
**File**: `scripts/practitioner-profile.js`
**Current**: URL with UUID
```javascript
const redirectUrl = `/rooted-vitality/dashboard/client/pages/my-matches.html?project_id=${project.id}`;
```
**Problem**: URL passes UUID but code expects integer
**Fix**: Pass integer from `project.project_id` instead

---

## SQL FUNCTION ISSUES

### Issue 7: match_practitioners() Function ✅ FIXED
**File**: `sql/matching_algorithm.sql` (UPDATED)

**Previous State**: 
- Complex radius calculations
- Incorrect scoring logic
- Multiple return columns

**Current State** (CORRECT):
- Simple exact-match geographic filtering
- Two-phase matching (filter → score)
- Returns only needed columns: practitioner_id, serial, name, modalities, conditions, email, phone, match_score
- match_score = 2-100 based on profile_completion_percent
- ORDER BY match_score DESC (highest first)

**Status**: ✅ UPDATED & LIVE IN DATABASE

---

## SCHEMA CLARIFICATION

### projects table
- `id` = UUID (primary key)
- `project_id` = INTEGER (serial: 1, 2, 3...)

### project_practitioner_matches table
- `id` = UUID (primary key)
- `project_id` = INTEGER (matches projects.project_id, NOT projects.id)
- `practitioner_id` = UUID
- `match_score` = INTEGER (2-100, based on profile completion)

### Database Relationships
```
projects (id: UUID, project_id: INT)
    ↓ project_id joins on
project_practitioner_matches (project_id: INT)
    ↓ project_id
projects (project_id: INT)  ← CIRCULAR BUT CORRECT
```

---

## IMPLEMENTATION PRIORITY

### Phase 1: Fix SQL Matching Algorithm (CRITICAL) ✅ COMPLETE
- [x] Update `match_practitioners()` to handle both UUID input and INTEGER filtering
- [x] Implement strict filtering based on user's criteria
- [x] Calculate match_score from profile_completion_percent (2-100 range)
- [x] Test with existing test data
- [x] Updated workspace SQL file: `sql/matching_algorithm.sql`
- [x] Archived old version: `sql/DEPRECATED_RADIUS_MATCHING_IMPLEMENTATION.sql`

### Phase 2: Fix JavaScript RPC Calls (HIGH)
- [ ] find-practitioners.js Line 192 (RPC call handling)
- [ ] find-practitioners.js Line 713 (project_messages insertion)
- [ ] Ensure RPC receives UUID but queries work correctly

### Phase 3: Fix Project ID References (HIGH)
- [ ] my-matches.js Line 405 (project lookup)
- [ ] practitioner-profile.js Lines 466, 508 (match creation)
- [ ] practitioner-profile.js Line 522 (URL redirect)
- [ ] Ensure all use `project.project_id` or proper UUID lookup

### Phase 4: Session & URL Handling (MEDIUM)
- [ ] find-practitioners.js Line 182 (sessionStorage)
- [ ] Standardize whether URLs pass UUID or integer
- [ ] Update all references accordingly

---

## VALIDATION QUERIES

Run these to verify the fix:

```sql
-- 1. Verify project_practitioner_matches has correct project_id (integer)
SELECT project_id, COUNT(*) 
FROM project_practitioner_matches 
GROUP BY project_id;

-- 2. Verify projects table structure
SELECT id, project_id FROM projects LIMIT 5;

-- 3. Test matching algorithm
SELECT * FROM match_practitioners('ff0c08d4-2a93-4eec-a386-3f21bd47c047'::UUID);

-- 4. Verify match_score populated
SELECT id, project_id, match_score FROM project_practitioner_matches;

-- 5. Check for any NULL match_scores
SELECT COUNT(*) as null_scores 
FROM project_practitioner_matches 
WHERE match_score IS NULL OR match_score = 0;
```

---

## SUCCESS CRITERIA

✅ Matching algorithm returns practitioners (not empty result)
✅ match_score is 2-100 (not 0)
✅ match_score correlates with practitioner's profile_completion_percent
✅ Filtering works: only practitioners matching all criteria appear
✅ Filtering works: practitioners not matching criteria do not appear
✅ UI displays practitioners sorted by match_score (highest first)
✅ No JavaScript errors in browser console
✅ No SQL errors in Supabase logs

---

**Status**: OPEN - WAITING FOR SQL FUNCTION FIX
**Priority**: CRITICAL
**Blocks**: Entire practitioner search and matching flow
