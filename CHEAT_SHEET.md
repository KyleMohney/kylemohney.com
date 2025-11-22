# Rooted Vitality - Match Status Implementation CHEAT SHEET

## 🚀 QUICK START - Deploy in 3 Steps

### Step 1: Execute SQL (1 minute)
```
File: rooted-vitality/sql/04_MATCH_STATUS_REDESIGN_EXECUTE_NOW.sql
→ Copy ENTIRE file
→ Paste into Supabase SQL Editor
→ Click "Run"
→ Verify: Should show SUCCESS messages
```

### Step 2: Deploy JavaScript (Already Done!)
```
✅ find-practitioners.js - Updated
✅ my-matches.js - Updated
✅ matchMessagingManager.js - Updated
→ Just commit these changes
```

### Step 3: Test
```
1. Create new match between client and practitioner
2. Go to My Team page
3. Verify status shows "Pending Review"
4. Verify message input is disabled
```

---

## 📊 Database Schema

### New Columns (Added)
```
match_status TEXT                          → pending, active, hired, etc.
practitioner_response TEXT                 → accepted, declined, null
practitioner_response_reason TEXT          → Why they declined
practitioner_responded_at TIMESTAMP        → When they responded
```

### Preserved Columns (NOT Changed - Human Tracking)
```
project_serial TEXT                        → Integer stored as text
practitioner_serial TEXT                   → Person identifier
client_serial TEXT                         → Person identifier
```
⚠️ These MUST stay TEXT

---

## 🔄 Status Flow

```
MATCH_STATUS Column:
┌─────────────────────────────────────────┐
│ pending → active → in-progress → hired  │
└─────────────────────────────────────────┘

PRACTITIONER_RESPONSE Column:
┌────────────────────────────────┐
│ NULL → accepted                │
│      → declined                │
│      → declined_with_message   │
└────────────────────────────────┘

Both columns are INDEPENDENT
```

---

## 🔧 RPC Functions

### Create Match
```sql
SELECT create_practitioner_match(
  101,                      -- project_serial (INT)
  'client_xyz',             -- client_serial (TEXT)
  'prac_abc',               -- practitioner_serial (TEXT)
  85                        -- match_score (INT)
);
-- Returns: match_id, match_status='pending', practitioner_response=null
```

### Update Response (NEW)
```sql
-- Practitioner accepts
SELECT update_practitioner_response(
  'match-uuid',
  'accepted'
);
-- Result: match_status → 'active', response → 'accepted'

-- Practitioner declines
SELECT update_practitioner_response(
  'match-uuid',
  'declined',
  'Not in service area'  -- optional
);
-- Result: match_status stays 'pending', response → 'declined'
```

---

## 📋 Common Queries

### Pending Matches (Waiting for Response)
```sql
SELECT * FROM project_practitioner_matches
WHERE match_status = 'pending' 
  AND practitioner_response IS NULL;
```

### Declined Matches
```sql
SELECT * FROM project_practitioner_matches
WHERE practitioner_response = 'declined';
```

### Active Engagements
```sql
SELECT * FROM project_practitioner_matches
WHERE match_status IN ('active', 'in-progress', 'hired')
  AND practitioner_response = 'accepted';
```

### Client's All Matches
```sql
SELECT * FROM project_practitioner_matches
WHERE client_serial = 'CLIENT_XYZ'
ORDER BY created_at DESC;
```

---

## 🎯 JavaScript Integration

### In find-practitioners.js
```javascript
// RPC returns match data now
const { data, error } = await supabaseClient.rpc('create_practitioner_match', {...});
console.log(data[0].match_status);  // 'pending'
```

### In my-matches.js
```javascript
// Select new columns
.select('id, match_status, practitioner_response, ...')

// Use in logic
if (match.match_status === 'pending' && !match.practitioner_response) {
  // Message input disabled
  messageInputEl.disabled = true;
}
```

### In matchMessagingManager.js
```javascript
// Store response
selectedMatchResponse = matchData?.practitioner_response;

// Use in display
if (selectedMatchStatus === 'pending' && !selectedMatchResponse) {
  // Show "Awaiting Response" message
}
```

---

## ✅ Verification Checklist

After SQL migration, verify:
- [ ] All matches have `match_status` (not NULL)
- [ ] `practitioner_response` is null for old pending matches
- [ ] `practitioner_response` is 'accepted' for old active matches
- [ ] Indexes created successfully
- [ ] RPC functions return data

```sql
-- Run these to verify
SELECT COUNT(*) FROM project_practitioner_matches 
WHERE match_status IS NULL;  -- Should be 0

SELECT match_status, COUNT(*) FROM project_practitioner_matches 
GROUP BY match_status;  -- Should show distribution
```

---

## 🐛 Troubleshooting

| Issue | Check |
|-------|-------|
| Match shows wrong status | Query `match_status` column directly |
| Message input still locked | Check both `match_status` AND `practitioner_response` |
| RPC returns error | Verify all 4 parameters are correct |
| Old data not migrated | Run backfill UPDATE statement from SQL file |
| Messaging disabled when should be enabled | Check: `response='accepted' AND status IN (active, hired)` |

---

## 📁 Files Reference

### SQL Files
```
04_MATCH_STATUS_REDESIGN.sql                    ← Full doc with all steps
04_MATCH_STATUS_REDESIGN_EXECUTE_NOW.sql        ← Copy-paste into Supabase
```

### JavaScript Files
```
find-practitioners.js                           ← Updated (match creation)
my-matches.js                                   ← Updated (match display)
matchMessagingManager.js                        ← Updated (messaging)
```

### Documentation
```
MATCH_STATUS_DESIGN.md                          ← Design details
SQL_QUICK_REFERENCE.md                          ← Admin queries
IMPLEMENTATION_COMPLETE.md                      ← Full guide
```

---

## 🚨 IMPORTANT

### DO NOT DELETE
```
- status column (kept for backward compatibility)
- Serial number columns (text, not uuid)
```

### DO NOT CHANGE
```
- project_serial from TEXT to UUID
- practitioner_serial from TEXT to UUID
- client_serial from TEXT to UUID
(They're for human tracking, not FK references)
```

### DO USE
```
- match_status for engagement state
- practitioner_response for acceptance/decline
- Together, not separately
```

---

## 🎓 Examples

### New Match Flow
```
1. Client clicks "Connect"
2. create_practitioner_match() called
3. Database: match_status='pending', response=NULL
4. Client redirected to My Team
5. Status shows "Pending Review"
6. Message input disabled

Result: ✅ Correct behavior shown
```

### Practitioner Accepts
```
1. Practitioner view shows match (future feature)
2. Practitioner clicks "Accept"
3. update_practitioner_response('accepted') called
4. Database: match_status='active', response='accepted'
5. Client sees "Connected" status
6. Message input enabled

Result: ✅ Full engagement ready
```

### Practitioner Declines
```
1. Practitioner clicks "Decline"
2. update_practitioner_response('declined', reason) called
3. Database: match_status='pending', response='declined'
4. Client sees "Declined" status
5. Client can connect with different practitioner

Result: ✅ Can retry with others
```

---

## 🔐 Security Notes

### RLS Still Works
- Serial number columns used (not UUID)
- No RLS policy changes needed
- Existing policies apply to new columns

### User Roles
- Clients: Can see their matches, cannot update response
- Practitioners: Can see their matches, CAN update response
- Admin: Full access

---

## 📞 Support

**Issue with SQL?**
→ Check file: `04_MATCH_STATUS_REDESIGN_EXECUTE_NOW.sql`
→ Run queries one section at a time
→ Check verification queries at end

**Issue with JavaScript?**
→ Check browser console logs starting with `[Messaging]` or `[My Matches]`
→ Verify both columns exist in database

**Need to test locally?**
```javascript
// Browser console
await supabaseClient.rpc('create_practitioner_match', {
  p_project_serial: 101,
  p_client_serial: 'test_client',
  p_practitioner_serial: 'test_prac',
  p_match_score: 85
});
```

---

## 🎉 Done!

You now have:
✅ Separate match status and practitioner response tracking
✅ Updated database with backfill
✅ Updated RPC functions with returns
✅ Updated JavaScript code
✅ Proper messaging enable/disable logic
✅ Complete documentation

Deploy and test!
