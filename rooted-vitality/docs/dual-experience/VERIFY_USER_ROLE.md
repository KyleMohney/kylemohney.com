# Verify User Role - kylejmohney@gmail.com

## Issue
User `kylejmohney@gmail.com` should be a practitioner but is defaulting to client experience.

## Root Cause
The role is read from the `profiles` table in Supabase during login. If the user's role is not set to "practitioner" in the database, the system will default to "client".

## Debugging Steps

### 1. Check Browser Console on Login
When `kylejmohney@gmail.com` logs in, check the browser console for this log:
```
[Rooted Vitality] User profile retrieved: {
  id: "...",
  email: "kylejmohney@gmail.com",
  profileRole: "???",  // <- This should be "practitioner"
  firstName: "...",
  finalRole: "???"     // <- This should be "practitioner"
}
```

### 2. If profileRole is "client"
The user's role in Supabase is incorrect. Update it:
- Go to Supabase Dashboard
- Navigate to `profiles` table
- Find row with `id` matching the user's auth ID
- Update the `role` column to `"practitioner"`

### 3. Login Flow
After correcting the database:
1. User logs in with `kylejmohney@gmail.com`
2. System fetches profile from database
3. System sees `role = "practitioner"`
4. User is redirected to `/dashboard/practitioner-dashboard.html`
5. Header renders practitioner nav with "Client View" switcher

## Solution Checklist
- [ ] Check console logs during login
- [ ] Verify `profileRole` in logs matches expected role
- [ ] If incorrect, update `profiles.role` in Supabase
- [ ] Clear localStorage and log in again
- [ ] Verify redirect to correct dashboard
