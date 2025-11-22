# Multi-Device Testing Setup - P1 vs C18

## Quick Start for Testing

### Computer 1 (This one): Client C18
```
1. Login to kylemohney.com Rooted Vitality
2. Login as client with serial C18
3. Go to Find Practitioners
4. Create a project request
5. Select a practitioner (P1) and submit match
6. Watch for notification when P1 responds
```

### Computer 2: Practitioner P1
```
1. Pull latest changes: git pull origin main
2. Login to kylemohney.com Rooted Vitality
3. Login as practitioner with serial P1
4. Go to Clients dashboard (/rooted-vitality/dashboard/pro/index.html)
5. View new client request from C18
6. Click "Accept" or "Decline w/ Msg"
7. Check Client C18 dashboard for notification
```

## What to Test

### Test 1: Accept Flow
**Pro Side (P1):**
1. View match from C18
2. Click "Accept" button
3. See toast: "Client Accepted - You accepted {ClientName}..."

**Client Side (C18):**
1. Check notification bell (top right)
2. Should see: "✓ Connection Accepted"
3. Message: "{ProName} has accepted your request for {ProjectName}! You can now start messaging them."

### Test 2: Decline Flow
**Pro Side (P1):**
1. View new match from C18
2. Click "Decline" button
3. Confirm in dialog

**Client Side (C18):**
1. Check notification bell
2. Should see: "✗ Connection Declined"
3. Message about decline received

### Test 3: Decline with Message
**Pro Side (P1):**
1. View match from C18
2. Click "Decline w/ Msg" button
3. Modal pops up
4. Type custom message (e.g., "Not in my service area")
5. Click "Send & Decline"

**Client Side (C18):**
1. Check notification bell
2. Should see decline notification with your custom message included

### Test 4: Status Dropdown Lock/Unlock
**Client Side (C18):**
1. On My Matches page, select a match
2. Check dropdown at top:
   - If Pro hasn't responded: **LOCKED** (grayed out, can't change)
   - If Pro accepted/declined: **UNLOCKED** (can change to In-Progress, Hired, Not Hired)
3. When locked, text shows: "Waiting for practitioner response..."

## Expected Behavior

### Notifications Appear In:
1. ✅ Notification bell dropdown (top right of dashboard)
2. ✅ Notification badge (red dot with count)
3. 🔄 Email (backend not implemented - see console logs)
4. 🔄 SMS (backend not implemented - see console logs)

### Message Examples:

**Accept Notification:**
```
Title: ✓ Connection Accepted
Message: "Dr. Jane Smith has accepted your request for "Wellness Coaching"! You can now start messaging them."
```

**Decline Notification:**
```
Title: ✗ Connection Declined  
Message: "Dr. Jane Smith declined your request for "Wellness Coaching": Not in my service area. You can search for other practitioners."
```

## Debugging

### Check Browser Console (F12):
Look for `[Notifications]` logs:
```
[Notifications] Supabase client initialized
[Notifications] In-app notification created for C18
[Notifications] Email would be sent to: client@example.com
```

### Check Database:
```sql
-- View C18's notifications
SELECT * FROM client_notifications 
WHERE client_serial = 'C18' 
ORDER BY created_at DESC LIMIT 5;

-- Should show notifications with:
-- - title: "✓ Connection Accepted" or "✗ Connection Declined"
-- - action: 'accepted' or 'declined'
-- - message: Full notification text
```

### Check Preferences:
```sql
-- Verify C18 has notification settings
SELECT * FROM client_notification_settings 
WHERE client_serial = 'C18';

-- Should show matches_in_app = true by default
```

## Key Features to Verify

| Feature | Status | Test |
|---------|--------|------|
| Pro can accept match | ✅ | Click Accept button |
| Pro can decline match | ✅ | Click Decline button |
| Pro can decline with message | ✅ | Click "Decline w/ Msg" |
| Client gets notification | ✅ | Check notification bell |
| Notification shows correct text | ✅ | Read notification content |
| Status dropdown locks when pending | ✅ | Select match, check dropdown |
| Status dropdown unlocks after response | ✅ | Pro responds, check again |
| Message input disabled when pending | ✅ | Can't type when waiting |
| Message input enabled when accepted | ✅ | Can type after acceptance |

## Common Issues & Fixes

### Notification not appearing
- [ ] Pro dashboard properly accepted/declined
- [ ] Client C18 is refreshing page to see notification
- [ ] Check console for `[Notifications]` errors
- [ ] Verify database has notification record

### Dropdown still shows "Mark as" blank
- [ ] Pro hasn't responded yet (expected)
- [ ] Page needs refresh after pro responds
- [ ] Check `practitioner_response` in database

### Can't accept/decline match
- [ ] Are you logged in as practitioner P1?
- [ ] Is the match showing on your Clients dashboard?
- [ ] Check browser console for errors

### Getting database error
- [ ] Verify connection to Supabase is working
- [ ] Check user is properly authenticated
- [ ] Look for `[Notifications]` error logs

## Tips for Testing

1. **Open Two Browser Windows**
   - Window 1 (Client C18): `/rooted-vitality/dashboard/client/pages/my-matches.html`
   - Window 2 (Pro P1): `/rooted-vitality/dashboard/pro/index.html`
   - Side-by-side for easy comparison

2. **Use Browser DevTools**
   - F12 to open console
   - Watch Network tab for database calls
   - Use Elements tab to inspect notifications

3. **Check Database**
   - Open Supabase dashboard
   - Query `client_notifications` to see records
   - Verify `client_serial = 'C18'`

4. **Test Different Scenarios**
   - Multiple accepts/declines
   - Different decline messages
   - Different clients/practitioners

## Files Changed

**Core Notification Logic:**
- `/rooted-vitality/scripts/notificationManager.js` - New

**Pro Dashboard:**
- `/rooted-vitality/dashboard/pro/index.html` - Updated accept/decline handlers

**Client Pages:**
- `/rooted-vitality/dashboard/client/pages/my-matches.html` - Added script include

**Status Dropdown:**
- `/rooted-vitality/dashboard/client/pages/my-matches.html` - Updated options and defaults
- `/rooted-vitality/scripts/my-matches.js` - Added lock/unlock logic

## Next Steps After Testing

1. ✅ Verify all accept/decline flows work
2. 🔄 Implement backend email/SMS sending
3. 🔄 Add real-time notification updates
4. 🔄 Create notification center page
5. 🔄 Add notification history

## Support

**Questions or issues?**
- Check `/rooted-vitality/docs/NOTIFICATION_SYSTEM.md` for full docs
- Review `/rooted-vitality/docs/NOTIFICATION_SYSTEM_QUICK_REF.md` for quick reference
- Look at console logs for `[Notifications]` prefix debugging
