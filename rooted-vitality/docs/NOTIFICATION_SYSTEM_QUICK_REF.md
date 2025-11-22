# Notification System - Quick Reference

## How It Works

When a practitioner accepts or declines a match on their dashboard (`/rooted-vitality/dashboard/pro/index.html`):

1. **Practitioner clicks Accept/Decline**
2. **RPC updates database** with `practitioner_response` = 'accepted' or 'declined'
3. **notificationManager.js fires** and:
   - Creates in-app notification in `client_notifications` table
   - Checks client's `client_notification_settings` for preferences
   - Fetches client's email/phone from `clients` table
   - Queues email/SMS (logs intent, awaits backend implementation)
   - Updates notification badge if UI is loaded

## Files Changed

### New Files:
- ✅ `/rooted-vitality/scripts/notificationManager.js` - Core notification logic
- ✅ `/rooted-vitality/docs/NOTIFICATION_SYSTEM.md` - Full documentation

### Modified Files:
- ✅ `/rooted-vitality/dashboard/pro/index.html` - Added notification calls to accept/decline handlers
- ✅ `/rooted-vitality/dashboard/client/pages/my-matches.html` - Added notificationManager.js script include

## Key Functions

### Client Notifications

```javascript
// When pro accepts
await notifyClientOfMatchResponse({
  clientSerial: 'C1',
  practitionerName: 'Dr. Jane Smith',
  projectName: 'Wellness Coaching',
  action: 'accepted'
});

// When pro declines
await notifyClientOfMatchResponse({
  clientSerial: 'C1',
  practitionerName: 'Dr. Jane Smith',
  projectName: 'Wellness Coaching',
  action: 'declined',
  reason: 'Not in my service area'  // Optional
});
```

## Testing

### Test Accept Flow:
1. Create project as Client (C1)
2. View match as Practitioner (P1)
3. Click "Accept" button
4. Check browser console - should see: `[Notifications] In-app notification created for C1`
5. Check database:
   ```sql
   SELECT * FROM client_notifications WHERE client_serial = 'C1' ORDER BY created_at DESC LIMIT 1;
   ```
   Should show notification with title "✓ Connection Accepted"

### Test Decline Flow:
1. Create project as Client (C1)
2. View match as Practitioner (P1)
3. Click "Decline" button
4. Check browser console - should see: `[Notifications] In-app notification created for C1`
5. Check database - should show notification with title "✗ Connection Declined"

### Test Decline with Message:
1. Create project as Client (C1)
2. View match as Practitioner (P1)
3. Click "Decline w/ Msg" button
4. Type a custom message
5. Click "Send & Decline"
6. Check database - notification should include the custom reason

## Notification Preferences

Client can control notifications via Settings → Notifications:

**Matches Section:**
- ☑ In-App notifications
- ☑ Email notifications
- ☑ SMS notifications

If any channel is disabled, notifications won't be sent via that channel.

## Database Schema

### `client_notifications` table
```sql
id UUID PRIMARY KEY
client_serial TEXT (e.g., 'C1')
type TEXT (e.g., 'match_response')
action TEXT ('accepted' or 'declined')
title TEXT
message TEXT
is_read BOOLEAN
read_at TIMESTAMP
created_at TIMESTAMP
```

### `client_notification_settings` table
```sql
client_serial TEXT PRIMARY KEY
matches_in_app BOOLEAN
matches_email BOOLEAN
matches_sms BOOLEAN
-- ... other notification types ...
updated_at TIMESTAMP
```

## Current Limitations (TODO)

1. **Email/SMS Not Implemented**
   - Currently logs intent: `console.log('[Notifications] Email would be sent to:', email)`
   - Needs backend webhook: `/api/send-notification`
   - Would use SendGrid for email, Twilio for SMS

2. **No Real-time Updates**
   - Notification badge doesn't auto-update without page refresh
   - Future: Add Supabase real-time subscriptions

3. **Limited Notification Types**
   - Currently: only match_response (accept/decline)
   - Future: messages, reviews, promotions, system alerts

## Common Issues

### Notification Not Creating
**Check:**
- Is Supabase client initialized? (Log: `[Notifications] Supabase client initialized`)
- Does `client_serial` exist in database?
- Are client preferences set? (Defaults to enabled)

### Email/SMS Not Sending
**Expected:**
- Current behavior: logs to console only
- "Email would be sent to: user@example.com"
- This is normal until backend integration

### Badge Not Updating
**Check:**
- Current page needs manual refresh
- Future feature: real-time subscriptions

## Next Steps

1. **Email Implementation**
   - Create backend API endpoint for `POST /api/send-notification`
   - Integrate SendGrid for HTML email templates
   - Test with actual email

2. **SMS Implementation**
   - Integrate Twilio SDK
   - Add phone number validation
   - Test with actual SMS

3. **Real-time Updates**
   - Add Supabase real-time subscription in `injections.js`
   - Update badge count on INSERT to `client_notifications`

4. **UI Enhancements**
   - Add notification center page
   - Notification history/archive
   - In-email action buttons

## Support

For questions or issues:
1. Check browser console for `[Notifications]` prefix logs
2. Review database tables for notification records
3. Check notification preferences in client settings
4. See full docs: `/rooted-vitality/docs/NOTIFICATION_SYSTEM.md`
