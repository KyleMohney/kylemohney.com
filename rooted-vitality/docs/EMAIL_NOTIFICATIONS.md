# Client Email Notifications Implementation

## Overview
Clients now receive professional, on-brand email notifications whenever they get in-app notifications IF email is enabled in their notification settings.

## How It Works

### 1. **Notification Created**
When a notification is created (match accepted/declined, promotion, etc.), the system checks the client's preferences.

### 2. **Email Preference Check**
The notification system queries `client_notification_settings` to determine if emails should be sent:
- `matches_email` - for match acceptance/decline
- `promotions_email` - for promotions
- `system_email` - for system notifications

### 3. **Email Template Selection**
Based on the notification type, the appropriate HTML template from `emailTemplates.js` is used:
- **matchAccepted** - Practitioner accepted client's match
- **matchDeclined** - Practitioner declined with optional reason
- **promotion** - Marketing/special offers
- **system** - General system notifications

### 4. **Email Delivery via Supabase Edge Function**
The `send-notification-email` Edge Function sends emails using Resend API:
```
POST /functions/v1/send-notification-email
{
  "to": "client@example.com",
  "subject": "✓ Connection Accepted!",
  "html": "<html>...</html>",
  "type": "client_notification"
}
```

### 5. **Email Logging**
All sent emails are logged to the `email_logs` table for audit trail and debugging.

## File Changes Made

### Frontend Files Modified
1. **`scripts/emailTemplates.js`** (NEW)
   - Professional HTML email templates
   - On-brand styling with Rooted Vitality colors
   - Support for different notification types

2. **`scripts/notificationManager.js`** (UPDATED)
   - `sendExternalNotifications()` - Now sends emails via Edge Function
   - `sendPromotionNotification()` - Sends promotional emails to opted-in clients
   - Integrated with `EmailTemplates` for rendering

3. **`dashboard/client/scripts/clientSettings.js`** (UPDATED)
   - Removed 'reviews' notification type
   - Now only shows 'promotions_in_app' checkbox (no email/SMS for now - can be added later)
   - Added real-time notification listener

4. **`dashboard/client/pages/settings.html`** (UPDATED)
   - Removed Reviews section
   - Updated Promotions section with cleaner description

### Backend Files Created
1. **`functions/send-notification-email.ts`** (NEW)
   - Supabase Edge Function
   - Sends emails via Resend API
   - Handles CORS, logging, error handling

### Database Changes
1. **New table: `email_logs`** (needs to be created)
   ```sql
   CREATE TABLE email_logs (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     recipient TEXT NOT NULL,
     subject TEXT NOT NULL,
     type TEXT,
     status TEXT DEFAULT 'sent',
     resend_id TEXT,
     sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     error_message TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

## Configuration Required

### 1. Supabase Project Setup
1. Go to Supabase Dashboard → Settings → Secrets
2. Add environment variable: `RESEND_API_KEY`
3. Get key from Resend account (https://resend.com)

### 2. HTML File Includes
Add to any page that sends notifications:
```html
<script src="path/to/emailTemplates.js"></script>
<script src="path/to/notificationManager.js"></script>
```

### 3. Email Domain Configuration
The emails come from: `support@rootedvitality.health` (via Resend)

To configure this domain:
1. In Resend dashboard, add domain: `rootedvitality.health`
2. Follow Resend's DNS setup instructions
3. Verify domain ownership
4. Update `emailTemplates.js` footer if needed

## Usage Examples

### Send Match Acceptance Email
```javascript
await notifyClientOfMatchResponse({
  clientSerial: 'C1',
  practitionerName: 'Dr. Jane Smith',
  projectName: 'Wellness Coaching',
  action: 'accepted'
});
```

### Send Promotion Email to All Clients
```javascript
await sendPromotionNotification({
  title: '20% Off First Session',
  message: 'Celebrate our 1-year anniversary with 20% off your first session with any practitioner on Rooted Vitality!',
  promotionType: 'discount',
  buttonUrl: 'https://rootedvitality.com/rooted-vitality/dashboard/client/pages/find-practitioners.html',
  buttonText: 'Browse Practitioners'
});
```

## Testing

### Test Email Sending
1. Enable email notifications in client settings
2. Have practitioner accept/decline a match
3. Check client's email inbox
4. View `email_logs` table to verify delivery

### Test Promotion Emails
1. Call `sendPromotionNotification()` from browser console (or backend)
2. Check client emails
3. Verify in `email_logs` table

### Resend Dashboard
View all sent emails and delivery status at: https://resend.com/emails

## Email Templates

All templates include:
- Rooted Vitality branding (green gradient header)
- Professional layout
- Clear call-to-action buttons
- Footer with contact info
- Note about notification preferences
- Responsive design for mobile

### Template Colors
- Primary: `#5c9a72` (Rooted Vitality green)
- Dark: `#4a8b62` (darker green)
- Accent: Various based on notification type
- Text: `#2e2b28` (dark brown)

## Fallback Behavior

If Resend API fails:
1. Error logged to console
2. System falls back to logging "Email would be sent"
3. In-app notification still sent to client
4. Email is NOT retried automatically
5. Admin should check `email_logs` for failures

## Future Enhancements

1. **SMS Notifications** - Can be added similar to emails
2. **Email Scheduling** - Send emails at specific times
3. **Email Analytics** - Track opens and clicks
4. **Unsubscribe** - Add unsubscribe links to emails
5. **Template Customization** - Allow admins to customize email templates
6. **Retry Logic** - Automatic retry for failed emails

## Security Considerations

1. All emails are logged for audit trail
2. Email address only used for notifications
3. Resend API key stored as environment secret
4. Edge Function uses Supabase auth for validation
5. No sensitive data included in email bodies

## Troubleshooting

### Emails Not Sending
- Check `RESEND_API_KEY` is set in Supabase secrets
- Verify client has email notification enabled in settings
- Check `email_logs` table for error messages
- Check browser console for error logs

### Emails Sent But Not Received
- Check recipient email address spelling
- Look in spam/junk folder
- Verify domain SPF/DKIM records in Resend
- Check Resend dashboard for bounces

### Can't See Emails in Resend Dashboard
- Verify `RESEND_API_KEY` is correct
- Ensure Edge Function is deployed
- Check Edge Function logs in Supabase

## References

- **Resend API Docs**: https://resend.com/docs
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions
- **Email Templates Best Practices**: https://www.mailgun.com/blog/email/email-template-best-practices/
