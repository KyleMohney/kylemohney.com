# Match Notifications - Default OFF with Membership Requirement

## Overview

Match notifications now default to **OFF** for all practitioners. Practitioners CANNOT enable match notifications unless they have an **active membership**.

## Changes Made

### 1. Notification Settings Initialization (`practitioner-signup.js`)

Both signup paths (with and without membership) now initialize notification settings with:
- `matches_in_app`: `false` (default OFF)
- `matches_email`: `false` (default OFF)
- `matches_sms`: `false` (unchanged)

**Location**: `/rooted-vitality/dashboard/pro/scripts/practitioner-signup.js`
- Line ~423-444 (skipMembership function)
- Line ~660-681 (registerPractitioner function)

### 2. Match Toggle Membership Verification

The match settings page (`match-settings.html`) already has logic to:
1. Check if practitioner has an active membership when enabling match status
2. Prevent enabling match notifications without active membership
3. Show error alert directing practitioners to the Memberships tab

**Location**: `/rooted-vitality/dashboard/pro/pages/match-settings.html`
- Lines 5225-5270 (saveMatchingEnabledToDatabase function)

This function:
```javascript
// If enabling matching, check for active membership
if (isEnabled) {
  const hasActiveMembership = membershipData && membershipData.length > 0 
    && membershipData[0].status === 'active';
  
  if (!hasActiveMembership) {
    alert('⚠️  Membership Required\n\nClient matching is only available with an active membership.');
    matchingToggle.checked = false; // Reset toggle
    return;
  }
}
```

### 3. Database Backfill

Run the backfill script to update existing practitioners:

```sql
-- File: /rooted-vitality/sql/04_backfill_match_notifications_default_off.sql
UPDATE practitioner_notification_settings
SET 
  matches_in_app = false,
  matches_email = false,
  updated_at = NOW()
WHERE matches_in_app = true OR matches_email = true;
```

## User Experience Flow

### New Practitioner (After Signup)
1. Completes practitioner signup (with or without membership)
2. Notification settings created with matches OFF
3. Profile page shows no match notifications enabled
4. If they want to enable matches:
   - Navigate to Match Settings
   - Try to toggle "Matching Status" ON
   - If no active membership: See error and toggle resets to OFF
   - If active membership: Toggle enables, can receive match notifications

### Existing Practitioner
1. Existing settings updated via backfill script
2. Match notifications turned OFF
3. Can re-enable by:
   - Ensuring they have active membership
   - Navigating to Match Settings
   - Toggling "Matching Status" ON

## Technical Details

### Affected Tables
- `practitioner_notification_settings` - matches_in_app, matches_email

### Affected Functions
- `skipMembership()` - Creates notification settings with matches OFF
- `registerPractitioner()` - Creates notification settings with matches OFF
- `saveMatchingEnabledToDatabase()` - Validates membership before allowing matches ON

### Default Notification Preferences
```javascript
{
  messages_in_app: true,        // On - practitioners want to receive messages
  messages_email: true,         // On - email messages
  messages_sms: false,          // Off - optional SMS
  matches_in_app: false,        // ⬅️ OFF by default
  matches_email: false,         // ⬅️ OFF by default
  matches_sms: false,           // Off - optional SMS
  reviews_in_app: true,         // On - want to see reviews
  reviews_email: true,          // On - email for reviews
  reviews_sms: false,           // Off - optional SMS
  promotions_in_app: true,      // On - see promotions
  promotions_email: false,      // Off - don't email promotions
  promotions_sms: false,        // Off - no SMS promotions
  system_in_app: true,          // On - system notifications
  system_email: true,           // On - email system alerts
  system_sms: false,            // Off - no SMS for system
  account_in_app: true          // On - account notifications
}
```

## Testing Checklist

- [ ] New practitioner signup creates notification settings with matches OFF
- [ ] Existing practitioner can see their matches_in_app/email are now OFF
- [ ] Match Settings page toggle shows OFF by default
- [ ] Attempting to toggle ON without membership shows error
- [ ] Error message directs to Memberships settings tab
- [ ] With active membership, toggle can be enabled
- [ ] Toggle properly saves matching_enabled to practitioners table
- [ ] Backfill script successfully updates existing records

## Rollback Plan

If needed to revert to matches ON by default:

```sql
UPDATE practitioner_notification_settings
SET 
  matches_in_app = true,
  matches_email = true,
  updated_at = NOW()
WHERE matches_in_app = false AND matches_email = false;
```

Then update both functions in `dashboard/pro/scripts/practitioner-signup.js` to set `matches_in_app: true` and `matches_email: true`.
