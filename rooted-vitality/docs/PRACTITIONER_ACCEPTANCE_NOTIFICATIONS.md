/*
╔════════════════════════════════════════════════════════════════════╗
║  PRACTITIONER MATCH ACCEPTANCE NOTIFICATIONS - IMPLEMENTATION      ║
║  Ensures practitioners only receive acceptance emails if enabled   ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝
*/

// ======================================================
// SUMMARY OF CHANGES
// ======================================================

OBJECTIVE:
  Ensure practitioners receive match acceptance notifications ONLY if they have
  email notifications enabled in their preferences (practitioner_notification_settings.matches_email)

CHANGES MADE:

1. notificationManager.js
   ├─ Added new function: notifyPractitionerOfMatchAcceptance()
   │  └─ Checks practitioner_notification_settings.matches_email BEFORE sending
   │  └─ Respects both in-app and email preferences
   │  └─ Sends in-app notification if matches_in_app = true
   │  └─ Sends email notification if matches_email = true
   │  └─ Defaults to ENABLED if no preferences exist
   │  └─ Full console logging for debugging
   ├─ Exported new function in module.exports
   └─ All preferences checked BEFORE email gateway call


2. emailTemplates.js
   ├─ Added new template: practitionerMatchAccepted()
   │  └─ Green gradient header (matches success state)
   │  └─ Shows client name and project name
   │  └─ Branded with sage green and cream colors
   │  └─ CTA button to inbox dashboard
   │  └─ Similar structure to other branded templates
   └─ 40 lines of HTML email template


3. inbox-manager.js (Client Side)
   ├─ Updated updateMatchStatus() function
   │  └─ When newStatus === 'in-progress', calls notifyPractitionerOfMatchAcceptance()
   │  └─ Passes: practitioner_serial, client_name, project_name
   │  └─ Fires AFTER database update succeeds
   │  └─ Uses existing selectedMatch object for data
   └─ Notification sent asynchronously (doesn't block UI)


// ======================================================
// NOTIFICATION FLOW - MATCH ACCEPTANCE
// ======================================================

CLIENT SIDE (Inbox):
  1. Client clicks "Accept" button on match
  2. Status changes from "pending" to "in-progress"
  3. updateMatchStatus() called with newStatus = 'in-progress'
  4. Database updated in project_practitioner_matches table
  5. Local selectedMatch updated
  6. notifyPractitionerOfMatchAcceptance() called

NOTIFICATION MANAGER:
  1. Function receives: practitioner_serial, client_name, project_name
  2. Fetches practitioner_notification_settings from database
  3. Checks: matches_email and matches_in_app preferences
  4. Default: true (enabled) if no preferences found
  5. Creates in-app notification (if matches_in_app = true)
  6. Sends email (if matches_email = true)
  7. Logs all steps to console

PRACTITIONER EMAIL (if enabled):
  1. Receives email to their registered email address
  2. Green gradient header (success state)
  3. Shows client name and project name
  4. CTA: "View Your Inbox" button
  5. Branded with Rooted Vitality colors
  6. Respects reply-to and footer preferences

// ======================================================
// PREFERENCE CHECKS - WHERE DECISIONS ARE MADE
// ======================================================

CHECKS BEFORE SENDING:

  1. notifyPractitionerOfMatchAcceptance() is called
     └─ Fetches from practitioner_notification_settings table
     └─ Using: .eq('practitioner_serial', practitionerSerial)

  2. In-app notification created IF:
     └─ preferences.matches_in_app !== false (defaults to true)
     └─ Creates record in 'notifications' table

  3. Email notification sent IF:
     └─ preferences.matches_email === true (defaults to true)
     └─ Sends via Edge Function to SMTP

  4. SMS notification would send IF:
     └─ preferences.matches_sms === true (not yet implemented)


// ======================================================
// DATABASE TABLES INVOLVED
// ======================================================

practitioner_notification_settings:
  ├─ practitioner_serial (key)
  ├─ matches_in_app (boolean)
  ├─ matches_email (boolean) ← KEY FOR THIS FEATURE
  └─ matches_sms (boolean)

project_practitioner_matches:
  ├─ id (match ID)
  ├─ practitioner_serial
  ├─ client_serial
  ├─ status (changes from 'pending' → 'in-progress')
  └─ updated_at

notifications (practitioner):
  ├─ practitioner_serial
  ├─ type: 'match_accepted'
  ├─ title
  ├─ message
  ├─ is_read
  └─ created_at


// ======================================================
// CONSOLE LOGGING FOR DEBUGGING
// ======================================================

When a client accepts a match, check browser console for:

  [Notifications] INITIATING MATCH ACCEPTANCE notification for practitioner P1
  [Notifications] Practitioner preferences - Email: true, SMS: false
  [Notifications] SENDING EMAIL to practitioner@example.com - Subject: "Jane Accepted Your Match!"
  [Notifications] ✓ Email successfully sent to practitioner@example.com


If email is DISABLED:
  [Notifications] INITIATING MATCH ACCEPTANCE notification for practitioner P1
  [Notifications] Practitioner preferences - Email: false, SMS: false
  [Notifications] ✓ In-app notification created for practitioner P1
  (No email sending attempt)


// ======================================================
// BACKWARD COMPATIBILITY
// ======================================================

Previous behavior:
  - No notifications sent to practitioner when client accepts

New behavior:
  - In-app notification created (default)
  - Email sent (if practitioner has matches_email = true)
  - Respects all preference settings
  - Defaults to ENABLED if no preferences exist


// ======================================================
// TESTING CHECKLIST
// ======================================================

☐ Create test account (practitioner & client)
☐ Set practitioner notification preferences:
  ☐ matches_email = true (test with email enabled)
  ☐ matches_email = false (test with email disabled)
☐ Client sends match request
☐ Practitioner accepts from their inbox
☐ Check browser console for logs
☐ Verify practitioner receives email only when enabled
☐ Check in-app notification is always created
☐ Test with no preferences (should default to enabled)


// ======================================================
// FUNCTION REFERENCE
// ======================================================

notifyPractitionerOfMatchAcceptance(options)
  Parameters:
    - practitionerSerial (string): Practitioner serial (P1, P2, etc.)
    - clientName (string): Display name of client
    - projectName (string): Display name of project

  Returns: Promise<void>

  Example usage:
    await notifyPractitionerOfMatchAcceptance({
      practitionerSerial: 'P1',
      clientName: 'Jane Smith',
      projectName: 'Stress Management Program'
    });


// ======================================================
// RELATED FUNCTIONS (FOR REFERENCE)
// ======================================================

notifyClientOfMatchResponse()
  └─ Notifies CLIENT when practitioner accepts/declines
  └─ Already checks client_notification_settings.matches_email

notifyPractitionerOfNewMatch()
  └─ Notifies PRACTITIONER when client sends match request
  └─ Already checks practitioner_notification_settings.matches_email

notifyPractitionerOfMatchAcceptance()
  └─ NEW: Notifies PRACTITIONER when client accepts their match
  └─ Checks practitioner_notification_settings.matches_email


// ======================================================
// FILES MODIFIED
// ======================================================

1. /rooted-vitality/scripts/notificationManager.js
   - Added notifyPractitionerOfMatchAcceptance() function
   - Updated module.exports
   - Full preference checking implemented

2. /rooted-vitality/scripts/emailTemplates.js
   - Added practitionerMatchAccepted() template
   - 40 lines of HTML email template
   - Green gradient header (success state)

3. /rooted-vitality/dashboard/client/scripts/inbox-manager.js
   - Updated updateMatchStatus() function
   - Added call to notifyPractitionerOfMatchAcceptance()
   - Fires only when status = 'in-progress'

*/
