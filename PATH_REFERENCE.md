# Rooted Vitality - Path Reference & Variable Documentation
## Complete Guide to All Paths, URLs, and Configuration Variables

**Last Updated:** December 9, 2025  
**Scope:** All internal path references, hardcoded URLs, and environment variables

---

## SECTION 1: CRITICAL HARDCODED VALUES TO REPLACE

### 1.1 Supabase Credentials (CHANGE IMMEDIATELY)

**File:** `rooted-vitality/scripts/supabaseClient.js` (Lines 31-32)

```javascript
// ❌ CURRENT (OLD - KEEP FOR REFERENCE ONLY)
const SUPABASE_URL = "https://racsktdyrvepyvndbjzs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhY3NrdGR5cnZlcHl2bmRianpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3ODIyNDUsImV4cCI6MjA3NzM1ODI0NX0.5a0HksN7H1r5qBMExzKa9mPY-5uzTcJhffRuc5gNU2M";

// ✅ CORRECT (NEW - INSERT YOUR CREDENTIALS)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://YOUR_NEW_PROJECT_ID.supabase.co";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...YOUR_NEW_KEY";
```

**Action:**
1. [ ] Get new SUPABASE_URL from new project
2. [ ] Get new SUPABASE_ANON_KEY from new project
3. [ ] Create `.env.local` file with new values
4. [ ] Update `.env.example` (without actual key)
5. [ ] Replace in supabaseClient.js with env var references

**Priority:** 🔴 CRITICAL - App won't work without this

---

### 1.2 Hardcoded Data Path (CHANGE BEFORE DEPLOYMENT)

**File:** `rooted-vitality/scripts/renderManager.js` (Line 31)

```javascript
// ❌ CURRENT (WRONG - includes directory structure)
const response = await fetch('/rooted-vitality/data/articles.json');

// ✅ OPTION A - Root-relative (RECOMMENDED)
const response = await fetch('/data/articles.json');

// ✅ OPTION B - Relative to current location
const response = await fetch('../data/articles.json');

// ✅ OPTION C - Environment variable
const dataPath = process.env.VITE_DATA_PATH || '/data';
const response = await fetch(`${dataPath}/articles.json`);
```

**Decision:** Which option will you use?
- [ ] Option A (root-relative)
- [ ] Option B (relative)
- [ ] Option C (environment variable)

**Priority:** 🟡 HIGH - Will break on deployment

---

## SECTION 2: RELATIVE PATHS (ALREADY CORRECT ✅)

### 2.1 CSS Imports - All Relative ✅
**Status:** No changes needed

```
✅ ../styles/base.css
✅ ../styles/layout.css
✅ ../styles/components.css
✅ ../styles/pages.css
✅ @import url("base.css")
✅ @import url("layout.css")
```

### 2.2 Script Imports - All Relative ✅
**Status:** No changes needed

```
✅ ./scripts/config.js
✅ ./scripts/authManager.js
✅ ./scripts/authModal.js
✅ ./scripts/authHooks.js
✅ ./injections.js
✅ ./scripts/verifyHandler.js
```

### 2.3 Asset References - All Relative ✅
**Status:** No changes needed

```
✅ ../assets/logo_large.png
✅ ../assets/[other files]
```

---

## SECTION 3: API ENDPOINTS & FETCH CALLS

### 3.1 Error Report Endpoint (VERIFY AFTER DEPLOYMENT)

**File:** `rooted-vitality/scripts/report-concern-universal.js` (Line 310)

```javascript
// ❌ Current path
const response = await fetch('/api/send-error-report', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});

// ✅ For Vercel - same path works
// ✅ For custom hosting - adjust as needed
```

**Deployment Considerations:**
- **Vercel:** `/api/` routes auto-route to `vercel/` functions folder ✅
- **Custom Server:** May need full URL if CORS issues occur

**Update Path If Needed:**
```javascript
const apiBase = process.env.VITE_API_BASE_URL || '';
const response = await fetch(`${apiBase}/api/send-error-report`, {
  // ...
});
```

**Priority:** 🟡 HIGH - Test after deployment

---

### 3.2 Notification Email Endpoint (DYNAMIC ✅)

**File:** `rooted-vitality/scripts/notificationManager.js` (Line 202)

```javascript
// ✅ GOOD - Dynamically constructs from supabaseClient
const emailResponse = await fetch(
  `${window.supabaseClient.supabaseUrl}/functions/v1/send-notification-email`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  }
);
```

**Status:** This is dynamically configured - **NO CHANGES NEEDED**

**Verification:**
- [ ] Verify Edge Function exists in new Supabase project
- [ ] Verify function name is exactly `send-notification-email`
- [ ] Test function with sample data before deployment

**Priority:** 🟡 HIGH - Test after Supabase migration

---

## SECTION 4: EMAIL ADDRESSES & CONTACT POINTS

### 4.1 Support Email References

**File:** `rooted-vitality/scripts/ny-state-compliance.js` (Line 247)

```javascript
// ❌ Current
message: `...please contact support@rootedvitality.com...`

// ✅ Corrected to
message: `...please contact support@rooted-vitality.com...`

// ✅ Or use environment variable
const supportEmail = process.env.VITE_SUPPORT_EMAIL || 'support@rooted-vitality.com';
message: `...please contact ${supportEmail}...`
```

**All Email References to Check:**
```bash
grep -r "support@" rooted-vitality/
grep -r "contact@" rooted-vitality/
grep -r "@rooted" rooted-vitality/
grep -r "@kylemohney" rooted-vitality/
```

**Priority:** 🟡 MEDIUM - User communication

---

## SECTION 5: ENVIRONMENT VARIABLES SETUP

### 5.1 Create `.env.local` File (For Local Development)

**Location:** `rooted-vitality/.env.local` (DO NOT COMMIT TO GIT)

**Contents:**
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...YOUR_ACTUAL_KEY

# API Configuration  
VITE_API_BASE_URL=http://localhost:5173
VITE_ENVIRONMENT=development

# Email Configuration
VITE_SUPPORT_EMAIL=support@rooted-vitality.com
VITE_CONTACT_EMAIL=contact@rooted-vitality.com

# Data Paths
VITE_DATA_PATH=/data
VITE_ARTICLES_PATH=/data/articles.json
```

**How to Fill:**
1. Get SUPABASE_URL from new project dashboard
2. Get SUPABASE_ANON_KEY from new project dashboard → Settings → API Keys
3. Set API_BASE_URL to local dev server (http://localhost:5173)
4. For production, use full domain

---

### 5.2 Create `.env.example` File (Template for Team)

**Location:** `rooted-vitality/.env.example` (COMMIT TO GIT)

**Contents:**
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# API Configuration  
VITE_API_BASE_URL=https://rooted-vitality.com
VITE_ENVIRONMENT=production

# Email Configuration
VITE_SUPPORT_EMAIL=support@rooted-vitality.com
VITE_CONTACT_EMAIL=contact@rooted-vitality.com

# Data Paths
VITE_DATA_PATH=/data
VITE_ARTICLES_PATH=/data/articles.json
```

**Instructions for Team:**
1. Copy `.env.example` to `.env.local`
2. Fill in actual values (NOT in .env.example)
3. Never commit `.env.local`
4. Add `.env.local` to `.gitignore`

---

### 5.3 Update `scripts/config.js` to Use Environment Variables

**Current (Not Using Env Vars):**
```javascript
// OLD - hardcoded
const SUPABASE_URL = "https://racsktdyrvepyvndbjzs.supabase.co";
const CONFIG = { /* hardcoded values */ };
```

**Updated (Using Env Vars):**
```javascript
/**
 * Configuration loaded from environment variables
 * Falls back to defaults if not set
 */
const CONFIG = {
  // Supabase
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'https://DEFAULT.supabase.co',
  supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'default_key',
  
  // API
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://rooted-vitality.com',
  environment: import.meta.env.VITE_ENVIRONMENT || 'production',
  
  // Email
  supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || 'support@rooted-vitality.com',
  contactEmail: import.meta.env.VITE_CONTACT_EMAIL || 'contact@rooted-vitality.com',
  
  // Data
  dataPath: import.meta.env.VITE_DATA_PATH || '/data',
  articlesPath: import.meta.env.VITE_ARTICLES_PATH || '/data/articles.json',
};

export default CONFIG;
```

---

## SECTION 6: VERCEL ENVIRONMENT SETUP

### 6.1 Vercel Project Dashboard Settings

**Navigate to:** Vercel Dashboard → Project → Settings → Environment Variables

**Add These Variables:**

| Name | Value | Exposed |
|------|-------|---------|
| `VITE_SUPABASE_URL` | `https://YOUR_PROJECT_ID.supabase.co` | ✅ Yes |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...YOUR_KEY` | ✅ Yes (public key) |
| `VITE_API_BASE_URL` | `https://rooted-vitality.com` | ✅ Yes |
| `VITE_ENVIRONMENT` | `production` | ✅ Yes |
| `VITE_SUPPORT_EMAIL` | `support@rooted-vitality.com` | ✅ Yes |

**For Different Environments:**

**Development (Branch: develop)**
```
VITE_ENVIRONMENT=development
VITE_API_BASE_URL=https://dev-rooted-vitality.vercel.app
```

**Preview (Pull Requests)**
```
VITE_ENVIRONMENT=preview
VITE_API_BASE_URL=https://[pr-number]-rooted-vitality.vercel.app
```

**Production (Branch: main)**
```
VITE_ENVIRONMENT=production
VITE_API_BASE_URL=https://rooted-vitality.com
```

---

### 6.2 vercel.json Configuration (Optional)

**Location:** `rooted-vitality/vercel.json`

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "framework": "vite",
  "environment": [
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_ANON_KEY",
    "VITE_API_BASE_URL",
    "VITE_ENVIRONMENT",
    "VITE_SUPPORT_EMAIL"
  ]
}
```

---

## SECTION 7: SUPABASE CONFIGURATION

### 7.1 New Project Setup Checklist

**In New Supabase Dashboard:**

```
[ ] Note your Project ID: ___________________
[ ] Note your Project URL: ___________________
[ ] Copy your ANON KEY: ___________________

[ ] Go to Settings → API → Copy ANON KEY
[ ] Update supabaseClient.js with new URL & Key

[ ] Go to Authentication → Providers
    [ ] Enable Email/Password
    [ ] Email confirmation: Required or Optional?
    [ ] Verify redirect URLs are set:
        - Development: http://localhost:5173/verify
        - Production: https://rooted-vitality.com/verify
        - Vercel: https://rooted-vitality.vercel.app/verify

[ ] Go to Edge Functions
    [ ] Deploy send-notification-email
    [ ] Deploy send-error-report (if needed)
    [ ] Verify functions are accessible

[ ] Go to Storage
    [ ] Create buckets (if needed)
    [ ] Set privacy/public access rules
    [ ] Configure CORS if needed

[ ] Go to Database
    [ ] Verify schema imported correctly
    [ ] Run migrations if any
    [ ] Test queries

[ ] Go to Security → Realtime
    [ ] Enable Realtime for tables that need live updates
    [ ] Set permission rules for subscribers
```

---

### 7.2 CORS Configuration for Supabase

**If you get CORS errors, configure in Supabase:**

**Supabase Dashboard → Settings → CORS**

**Add allowed origins:**
```
http://localhost:5173
http://localhost:3000
https://rooted-vitality.com
https://*.vercel.app
https://rooted-vitality.vercel.app
```

---

## SECTION 8: DOMAIN & DNS CONFIGURATION

### 8.1 Domain Registration (If Using Custom Domain)

**Platform:** (Godaddy, Namecheap, Route53, etc.)

**What You'll Get:**
```
Domain: rooted-vitality.com
Nameservers from Vercel: (will be provided)
```

### 8.2 DNS Setup for Vercel

**In Your Domain Registrar, Add These Records:**

| Type | Name | Value |
|------|------|-------|
| `CNAME` | `rooted-vitality.com` | `cname.vercel.app` |
| `CNAME` | `www.rooted-vitality.com` | `cname.vercel.app` |

**Verification:**
```bash
# Verify DNS propagation
nslookup rooted-vitality.com
dig rooted-vitality.com

# Should show: points to Vercel
```

**Time to Propagate:** 24-48 hours

---

## SECTION 9: DATABASE SCHEMA & DATA

### 9.1 Tables to Migrate

```
Migration TODO List:

[ ] users
    - user_id (PK)
    - email
    - created_at
    - metadata

[ ] profiles
    - profile_id (PK)
    - user_id (FK)
    - display_name
    - bio
    - avatar_url

[ ] articles
    - article_id (PK)
    - title
    - content
    - created_at

[ ] [any other tables in current db]
```

### 9.2 Migration Command

```bash
# Export from old Supabase
supabase db push --linked

# Import to new Supabase
supabase link --project-ref new_project_ref
supabase db push
```

---

## SECTION 10: COMPLETE PATH REFERENCE TABLE

### All Paths in Project

| Type | Current | After Migration | Status |
|------|---------|-----------------|--------|
| Supabase URL | `racsktdyrvepyvndbjzs.supabase.co` | `[YOUR_NEW_PROJECT].supabase.co` | ❌ MUST CHANGE |
| Data Path | `/rooted-vitality/data/articles.json` | `/data/articles.json` | ❌ MUST CHANGE |
| API Endpoint | `/api/send-error-report` | `/api/send-error-report` | ✅ OK (same) |
| Email Function | `{supabaseUrl}/functions/v1/send-notification-email` | (dynamic) | ✅ OK |
| Support Email | `support@rootedvitality.com` | `support@rooted-vitality.com` | ⚠️ VERIFY |
| CSS Imports | `../styles/base.css` | `../styles/base.css` | ✅ OK |
| Script Imports | `./scripts/config.js` | `./scripts/config.js` | ✅ OK |
| Asset URLs | `../assets/logo.png` | `../assets/logo.png` | ✅ OK |

---

## SECTION 11: VERIFICATION CHECKLIST

### Post-Migration Verification

```bash
# 1. Check environment variables are loaded
console.log(import.meta.env.VITE_SUPABASE_URL) # Should show new URL

# 2. Verify Supabase connection
# In browser console:
console.log(window.supabaseClient.supabaseUrl) # Should show new URL

# 3. Test data loading
fetch('/data/articles.json')
  .then(r => r.json())
  .then(d => console.log(d)) # Should load successfully

# 4. Test API calls
fetch('/api/send-error-report', { method: 'POST', body: '{}' })
  # Should get proper response

# 5. Check Network tab
# All requests should use new domain/API endpoints
```

---

## SECTION 12: TROUBLESHOOTING

### "Cannot find module" Errors

**Problem:** Script paths are broken after migration

**Solution:**
1. Verify relative paths are correct
2. Check that `../` goes up to correct level
3. Use absolute paths (`/data/...`) for public assets

### "Supabase is undefined"

**Problem:** Supabase not initializing

**Solution:**
1. Check supabaseClient.js is loaded BEFORE other scripts
2. Verify `VITE_SUPABASE_URL` env var is set
3. Check browser console for specific error

### "Fetch failed" or CORS Errors

**Problem:** API calls failing

**Solution:**
1. Check domain is whitelisted in Supabase CORS settings
2. Verify API endpoint path is correct
3. Check `VITE_API_BASE_URL` env var
4. Test with curl: `curl -X POST https://api.endpoint...`

### 404 on /data/articles.json

**Problem:** Data files not found

**Solution:**
1. Verify files exist in `public/data/` or root `/data/`
2. Check path is correct: `/data/articles.json` NOT `/rooted-vitality/data/...`
3. Verify build output includes `/data/` directory
4. Test in Vercel: `https://rooted-vitality.com/data/articles.json`

---

## SECTION 13: QUICK REFERENCE COMMANDS

### Check Current Configuration

```bash
# Show all env vars being used
grep -r "process.env.VITE" rooted-vitality/src
grep -r "import.meta.env.VITE" rooted-vitality/src

# Find all hardcoded URLs
grep -r "http://" rooted-vitality/
grep -r "https://" rooted-vitality/
grep -r "/rooted-vitality/" rooted-vitality/
```

### Local Testing

```bash
# Start dev server
npm run dev

# Test with specific env vars
VITE_SUPABASE_URL=https://test.supabase.co npm run dev

# Build and preview production
npm run build
npm run preview
```

### Production Verification

```bash
# After deploying to Vercel, check:
curl https://rooted-vitality.com/api/send-error-report
curl https://rooted-vitality.com/data/articles.json

# Should return proper responses, not 404
```

---

## SUMMARY OF CHANGES REQUIRED

### 🔴 CRITICAL (Do Before Deployment)
- [ ] Update `supabaseClient.js` lines 31-32 with new credentials
- [ ] Update `renderManager.js` line 31 from `/rooted-vitality/data/` to `/data/`
- [ ] Create `.env.local` with all environment variables
- [ ] Create `.env.example` template
- [ ] Update `config.js` to load from environment variables

### 🟡 HIGH (Do Before Launch)
- [ ] Verify all email addresses updated
- [ ] Verify Supabase Edge Functions deployed
- [ ] Test API endpoints in new environment
- [ ] Configure Vercel environment variables
- [ ] Set up custom domain DNS

### 🟢 MEDIUM (Complete Post-Launch)
- [ ] Monitor error logs
- [ ] Collect user feedback
- [ ] Document final setup
- [ ] Archive old references

---

**Document Version:** 1.0  
**Last Updated:** December 9, 2025  
**Status:** ✅ Complete and ready for implementation
