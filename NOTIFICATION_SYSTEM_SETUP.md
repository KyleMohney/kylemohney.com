# Notification System Implementation Guide

**Date**: November 8, 2025  
**Status**: Phase 1 Complete - Client Settings Structure Ready

---

## Overview

The Rooted Vitality notification system has three components:
1. **notification_settings** table - User preferences (in-app, SMS, email) per notification type
2. **notifications** table - Actual notification records that users receive
3. **JavaScript handlers** - Save/load preferences and trigger notifications based on events

---

## Current Implementation Status

### ✅ COMPLETED: Notification Settings Table
**File**: `sql/04_NOTIFICATION_SETTINGS.sql`

#### Schema
```sql
notification_settings {
  id: UUID (links to auth.users)
  user_type: 'client' | 'practitioner'
  
  -- For each notification type: [type]_in_app, [type]_sms, [type]_email
  messages_in_app: boolean (default: true)
  messages_sms: boolean (default: true)
  messages_email: boolean (default: true)
  
  matches_in_app: boolean (default: true)
  matches_sms: boolean (default: true)
  matches_email: boolean (default: true)
  
  reviews_in_app: boolean (default: true)
  reviews_sms: boolean (default: true)
  reviews_email: boolean (default: true)
  
  promotions_in_app: boolean (default: true)
  promotions_sms: boolean (default: false)
  promotions_email: boolean (default: true)
  
  created_at: timestamp
  updated_at: timestamp
}
```

**Row Level Security**:
- Clients/practitioners can only read/update their own settings
- Service role can insert (for signup flow)
- Auto-trigger creates notification_settings on user creation

---

### ✅ COMPLETED: Client Settings UI
**File**: `rooted-vitality/dashboard/client/pages/settings.html`

#### Notification Sections
1. **Practitioner Messages** - in_app, email, sms (all checked by default)
2. **Practitioner Matches** - in_app, email, sms (all checked by default)
3. **Reviews** - in_app, email, sms (all checked by default)
4. **Promotions & News** - in_app (checked), email (checked), sms (checked)

#### HTML Structure
```html
<input type="checkbox" name="messages-in_app" checked class="notification-input">
<input type="checkbox" name="messages-email" checked class="notification-input">
<input type="checkbox" name="messages-sms" checked class="notification-input">
<!-- Similar pattern for matches, reviews, promotions -->
```

---

### ✅ COMPLETED: Client Settings JavaScript
**File**: `rooted-vitality/dashboard/client/scripts/clientSettings.js`

#### Functions

**`loadNotificationPreferences()`**
- Fetches settings from notification_settings table
- If not found, calls `defaultNotificationPreferences()`
- Applies saved preferences to all checkboxes

**`defaultNotificationPreferences()`**
- Sets all notification checkboxes to checked
- Called when:
  - No existing preferences found
  - User first visits settings
  - Error loading from database

**`saveNotificationPreferences(e)`**
- Reads all checkboxes with class `.notification-input`
- Builds object with proper field names (messages_in_app, etc.)
- Upserts to notification_settings table
- Shows success/error notification

**Field Name Mapping** (HTML name → database field)
```
messages-in_app → messages_in_app
messages-email → messages_email
messages-sms → messages_sms
matches-in_app → matches_in_app
matches-email → matches_email
matches-sms → matches_sms
reviews-in_app → reviews_in_app
reviews-email → reviews_email
reviews-sms → reviews_sms
promotions-in_app → promotions_in_app
promotions-email → promotions_email
promotions-sms → promotions_sms
```

---

## ⏳ TODO: Automated Notifications

### Phase 2: Notification Triggers

**Event 1: New Match Created**
- **Trigger**: When project_practitioner_matches record inserted
- **Notify**: Practitioner
- **Check**: practitioner's notification_settings.matches_in_app/sms/email
- **Action**: Insert into notifications table per enabled channels

**Event 2: Match Accepted**
- **Trigger**: When project_practitioner_matches.status = 'accepted'
- **Notify**: Client
- **Check**: client's notification_settings.matches_in_app/sms/email
- **Action**: Insert into notifications table per enabled channels

**Event 3: Review Posted** (Already exists)
- **Status**: Working in reviewsManager.js
- **Notify**: Practitioner
- **Check**: practitioner's notification_settings.reviews_in_app/sms/email
- **Location**: Line 465 in reviewsManager.js

---

## Implementation Notes

### Existing Notifications Table
The `notifications` table already captures:
- `user_type`: 'client' or 'practitioner'
- `user_id`: UUID of recipient
- `event_type`: 'match', 'review', 'message', etc.
- `title`, `message`: Notification content
- `read`: Boolean for read status
- RLS policies ensure users only see their own notifications

### SMS/Email Sending
Currently, settings are saved but actual SMS/email dispatch is not implemented.
For future phases:
1. Create notification queue table or use external service (SendGrid, Twilio)
2. Build job scheduler to process notifications based on preferences
3. Check notification_settings before dispatching each message

### Default Behavior
- **All channels checked by default** - Most users want to receive notifications
- **SMS promotions unchecked** - Reduce unsolicited text messages
- **Users can customize** - All toggles available in settings

---

## Testing Checklist

- [ ] 1. Client signs up → notification_settings created automatically
- [ ] 2. Client visits settings → all checkboxes default to checked (except promo SMS)
- [ ] 3. Client unchecks email → clicks Save → notification appears
- [ ] 4. Refresh page → unchecked state persists
- [ ] 5. Practitioner creates match → practitioner gets notification (if enabled)
- [ ] 6. Client accepts match → client gets notification (if enabled)
- [ ] 7. Practitioner receives review → notification created (existing, should work)

---

## Files Modified

- `sql/04_NOTIFICATION_SETTINGS.sql` - NEW notification_settings table
- `rooted-vitality/dashboard/client/pages/settings.html` - Updated checkbox names
- `rooted-vitality/dashboard/client/scripts/clientSettings.js` - Updated load/save logic
- `rooted-vitality/dashboard/signup.html` - Made zipcode & sex required (separate change)
- `rooted-vitality/scripts/signupHandler.js` - Updated validation for required fields

---

## Next Steps

1. **Apply notification_settings SQL** to Supabase
2. **Test client settings** - Verify checkboxes default to checked and save works
3. **Add auto-notification triggers** for matches and acceptances
4. **Repeat for practitioner settings** (proSettings.js)
5. **Add SMS/Email dispatch** (future phase)

---

## Questions for Implementation

1. Should notifications auto-create when user doesn't have settings yet? → **Yes**, trigger handles this
2. Default SMS to on or off? → **Off for promotions only**, on for matches/messages/reviews
3. Should there be a "Mute All" option? → Not yet, but easy to add
4. How to handle notification delivery? → Currently UI-only, need queue system
