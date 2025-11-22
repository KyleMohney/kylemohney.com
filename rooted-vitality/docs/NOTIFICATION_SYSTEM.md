# Rooted Vitality - Client Notification System

## Overview

The notification system sends clients real-time notifications when practitioners accept or decline their match requests. Notifications are sent through multiple channels based on client preferences:

- **In-app notifications** - Visible in the notification bell dropdown on the client dashboard
- **Email notifications** - Sent to client's email address
- **SMS notifications** - Sent to client's phone number

## Implementation Architecture

### 1. Notification Manager (`notificationManager.js`)

Central utility file that handles all notification operations:

**Key Functions:**

#### `notifyClientOfMatchResponse(options)`
Creates an in-app notification and sends external notifications when a practitioner accepts or declines.

```javascript
// Called when practitioner accepts
await notifyClientOfMatchResponse({
  clientSerial: 'C1',
  practitionerName: 'Dr. Jane Smith',
  projectName: 'Wellness Coaching',
  action: 'accepted'  // or 'declined'
});

// Called when practitioner declines with reason
await notifyClientOfMatchResponse({
  clientSerial: 'C1',
  practitionerName: 'Dr. Jane Smith',
  projectName: 'Wellness Coaching',
  action: 'declined',
  reason: 'Not in my service area'
});
```

**What happens:**
1. Creates in-app notification in `client_notifications` table
2. Checks client's notification preferences (`client_notification_settings`)
3. Fetches client contact info (email, phone)
4. Sends email/SMS if enabled in preferences
5. Updates notification badge if UI is loaded

#### `notifyPractitionerOfNewMatch(options)`
Creates practitioner notification when they receive a new match.

```javascript
await notifyPractitionerOfNewMatch({
  practitionerSerial: 'P1',
  clientName: 'Sarah Johnson',
  projectName: 'Yoga Classes',
  matchScore: 85
});
```

#### `markNotificationAsRead(notificationId, userType)`
Marks a notification as read with timestamp.

#### `deleteNotification(notificationId, userType)`
Deletes a notification.

### 2. Integration Points

#### Pro Dashboard (Practitioner Accept/Decline)

**File:** `/rooted-vitality/dashboard/pro/index.html`

**Accept Button Handler:**
```javascript
card.querySelector('[data-action="accept"]').addEventListener('click', async () => {
  const { data, error } = await window.supabaseClient
    .rpc('update_practitioner_response', {
      p_match_id: match.id,
      p_response: 'accepted'
    });

  if (!error) {
    // ✓ Notify client of acceptance
    if (window.notifyClientOfMatchResponse) {
      await notifyClientOfMatchResponse({
        clientSerial: match.client_serial,
        practitionerName: currentUser?.dba_name || currentUser?.legal_name,
        projectName: match.projectName || 'your project',
        action: 'accepted'
      });
    }
    showToast('Client Accepted', `You accepted ${clientName}...`);
  }
});
```

**Decline Button Handler:**
```javascript
card.querySelector('[data-action="decline"]').addEventListener('click', async () => {
  if (confirm('Are you sure you want to decline this client?')) {
    const { error } = await window.supabaseClient
      .rpc('update_practitioner_response', {
        p_match_id: match.id,
        p_response: 'declined'
      });

    if (!error) {
      // ✓ Notify client of decline
      if (window.notifyClientOfMatchResponse) {
        await notifyClientOfMatchResponse({
          clientSerial: match.client_serial,
          practitionerName: currentUser?.dba_name || currentUser?.legal_name,
          projectName: match.projectName || 'your project',
          action: 'declined',
          reason: 'Not available at this time'
        });
      }
      showToast('Declined', `You declined ${clientName}`);
    }
  }
});
```

**Decline with Message Handler:**
```javascript
document.getElementById('decline-message-send').addEventListener('click', async () => {
  // ... decline and send message to client ...
  
  // ✓ Notify client of decline with reason
  if (window.notifyClientOfMatchResponse) {
    const currentUser = window.authManager?.getCurrentUser();
    await notifyClientOfMatchResponse({
      clientSerial: currentMatchForDeclineMsg.client_serial,
      practitionerName: currentUser?.dba_name || currentUser?.legal_name,
      projectName: currentMatchForDeclineMsg.projectName || 'your project',
      action: 'declined',
      reason: messageText  // Use custom decline message as reason
    });
  }
  // ...
});
```

## Database Tables

### `client_notifications`
Stores in-app notifications for clients.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| client_serial | TEXT | Client serial number (C1, C2, etc.) |
| type | TEXT | Notification type (match_response, match_accepted, match_declined, etc.) |
| action | TEXT | Action that triggered notification (accepted, declined) |
| title | TEXT | Notification title |
| message | TEXT | Notification body |
| is_read | BOOLEAN | Read status |
| read_at | TIMESTAMP | When notification was read |
| created_at | TIMESTAMP | When notification was created |

### `client_notification_settings`
Stores client notification preferences.

| Column | Type | Description |
|--------|------|-------------|
| client_serial | TEXT | Client serial number (primary key) |
| matches_in_app | BOOLEAN | Show in-app notifications |
| matches_email | BOOLEAN | Send email notifications |
| matches_sms | BOOLEAN | Send SMS notifications |
| messages_in_app | BOOLEAN | Message notifications |
| messages_email | BOOLEAN | Message emails |
| messages_sms | BOOLEAN | Message SMS |
| reviews_in_app | BOOLEAN | Review notifications |
| reviews_email | BOOLEAN | Review emails |
| reviews_sms | BOOLEAN | Review SMS |
| updated_at | TIMESTAMP | Last preference update |

## Notification Preferences

Clients can manage their notification preferences in their account settings. Default is all enabled.

### Channel Types:
- **In-App** - Visible in notification bell dropdown
- **Email** - Sent to client's email address
- **SMS** - Sent to client's phone number (requires backend integration)

### Notification Types:
- **Matches** - When pro accepts/declines
- **Messages** - When pro sends a message
- **Reviews** - When a review is left
- **Promotions** - Marketing notifications
- **System** - System alerts

## External Notification Integration (TODO)

Currently, the notification manager logs what would be sent:

```javascript
console.log('[Notifications] Email would be sent to:', email);
console.log('[Notifications] SMS would be sent to:', phone);
```

### To implement email/SMS:

Create a backend webhook endpoint (`/api/send-notification`) that:

1. Receives notification payload
2. Sends email via service (SendGrid, Mailgun, etc.)
3. Sends SMS via service (Twilio, AWS SNS, etc.)
4. Logs all notifications for audit trail

Example implementation:
```javascript
async function sendExternalNotifications(options) {
  if (emailEnabled && email) {
    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'email',
        email: email,
        subject: title,
        body: message,
        template: 'match_accepted'  // Use HTML template
      })
    });
  }
}
```

## Testing the Notification System

### 1. Manual Testing:

**Accept Flow:**
1. Log in as client, create a project
2. Log in as practitioner, view the match
3. Click "Accept"
4. Check client's notification bell - should show message

**Decline Flow:**
1. Log in as client, create a project
2. Log in as practitioner, view the match
3. Click "Decline"
4. Check client's notification bell - should show message

**Decline with Message:**
1. Log in as client, create a project
2. Log in as practitioner, view the match
3. Click "Decline w/ Msg"
4. Enter message and send
5. Check client's notification bell - should show decline with custom reason

### 2. Check Database:

View client notifications:
```sql
SELECT * FROM client_notifications 
WHERE client_serial = 'C1' 
ORDER BY created_at DESC;
```

View client preferences:
```sql
SELECT * FROM client_notification_settings 
WHERE client_serial = 'C1';
```

## Flow Diagram

```
┌─────────────────────────┐
│  Practitioner Dashboard │
│   (pro/index.html)      │
└────────┬────────────────┘
         │
         ├─► Click "Accept" Button
         │
         ├─► Call RPC: update_practitioner_response()
         │
         ├─► If Success → notifyClientOfMatchResponse()
         │                        │
         │                        ├─► Check preferences
         │                        │
         │                        ├─► Create in-app notification
         │                        │   (client_notifications table)
         │                        │
         │                        ├─► Update notification badge
         │                        │
         │                        └─► Queue email/SMS (if enabled)
         │
         └─► Show success toast

        Similar flow for:
        - Decline button
        - Decline with message
```

## Notification Message Templates

### When Practitioner Accepts:
- **Title:** ✓ Connection Accepted
- **Message:** "{PractitionerName} has accepted your request for "{ProjectName}"! You can now start messaging them."
- **Action:** Should trigger badge update and appear in notification dropdown

### When Practitioner Declines:
- **Title:** ✗ Connection Declined  
- **Message:** "{PractitionerName} declined your request for "{ProjectName}"{reason}. You can search for other practitioners."
- **Action:** Should trigger badge update and appear in notification dropdown

### When Practitioner Declines with Reason:
- **Title:** ✗ Connection Declined
- **Message:** "{PractitionerName} declined your request for "{ProjectName}": {CustomMessage}. You can search for other practitioners."
- **Action:** Should trigger badge update with custom decline reason

## UI Integration

### Notification Bell Dropdown:

Located in client header (injections.js), displays:
1. List of unread notifications
2. Each notification shows:
   - Icon/badge (acceptance = green, decline = red)
   - Title and message
   - Time received
   - Click to mark as read
   - Swipe to delete

### Notification Badge:

Red badge on bell icon shows unread count:
- Updates in real-time as notifications arrive
- Clears when user views dropdown

## Error Handling

The notification system gracefully handles:
- Missing Supabase client
- No notification preferences found (defaults to enabled)
- Missing client contact info
- Failed email/SMS sending (logs warning, continues)
- Database errors (logs, continues without breaking UI)

All errors are logged with `[Notifications]` prefix for easy debugging.

## Future Enhancements

1. **Notification Center Page** - Dedicated page to view all notifications with filtering
2. **Real-time Updates** - Use Supabase real-time subscriptions for instant badge updates
3. **Push Notifications** - Browser push notifications and mobile app support
4. **Notification Scheduling** - Let users set quiet hours
5. **Notification History** - Archive and search past notifications
6. **Notification Actions** - Buttons in notifications (Reply, View, etc.)
7. **Batch Notifications** - Digest mode for multiple notifications
