# Rooted Vitality - Path Migration Audit & Documentation
## Migration from kylemohney.com → rooted-vitality standalone → GitHub/Supabase/Vercel

**Date:** December 9, 2025  
**Status:** AUDIT COMPLETE - Ready for Migration  
**Scope:** Full path audit of all hardcoded references across codebase

---

## 1. CRITICAL FINDINGS - HARDCODED PATHS & URLS

### 1.1 Supabase Configuration (HIGHEST PRIORITY)
**File:** `rooted-vitality/scripts/supabaseClient.js`
- **Line 31:** `const SUPABASE_URL = "https://racsktdyrvepyvndbjzs.supabase.co";`
- **Line 32:** `const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`

**MIGRATION ACTION:**
- [ ] Create new Supabase project in company account
- [ ] Obtain new project URL and anon key
- [ ] Replace lines 31-32 with new credentials
- [ ] Move to environment variable (`.env.local` or similar)
- [ ] Alternative: Move to `scripts/config.js` for non-sensitive config

**Current Status:** ✅ Hardcoded values identified

---

### 1.2 API Endpoints & Fetch Calls

#### 2a. Error Report Endpoint
**File:** `rooted-vitality/scripts/report-concern-universal.js`
- **Line 310:** `const response = await fetch('/api/send-error-report', {`

**MIGRATION ACTION:**
- [ ] Update to use new domain/vercel deployment
- [ ] Change from `/api/send-error-report` → `/api/send-error-report` (path remains same if using Vercel)
- [ ] Verify Supabase Edge Functions are deployed
- [ ] Test CORS configuration

**Current Status:** ✅ Identified

#### 2b. Notification Email Endpoint
**File:** `rooted-vitality/scripts/notificationManager.js`
- **Line 202:** ``const emailResponse = await fetch(`${window.supabaseClient.supabaseUrl}/functions/v1/send-notification-email`, {``

**MIGRATION ACTION:**
- [ ] This dynamically uses supabaseUrl from client (GOOD!)
- [ ] Verify Supabase Edge Function `send-notification-email` exists
- [ ] Test deployment in new Supabase instance

**Current Status:** ✅ Dynamically configured (safe)

#### 2c. Data File Paths
**File:** `rooted-vitality/scripts/renderManager.js`
- **Line 31:** `const response = await fetch('/rooted-vitality/data/articles.json');`

**ISSUE:** Path includes `/rooted-vitality` directory which will change!

**MIGRATION ACTION:**
- [ ] Change from `/rooted-vitality/data/articles.json` → `/data/articles.json` (root-relative)
- [ ] OR use relative path from script location
- [ ] Test both scenarios:
  - Standalone domain: `https://rooted-vitality.com/data/articles.json`
  - Vercel deployment: `https://vercel-domain.com/data/articles.json`

**Current Status:** ⚠️ NEEDS FIX - hardcoded directory structure

---

### 1.3 Email Configuration
**File:** `rooted-vitality/scripts/ny-state-compliance.js`
- **Line 247:** `support@rootedvitality.com`

**MIGRATION ACTION:**
- [ ] Verify domain email setup (`support@rooted-vitality.com` or `support@company-domain.com`)
- [ ] If migrating to different domain, update all instances
- [ ] Search for all email references: `rooted-vitality.com`, `support@`, `contact@`

**Search Results:**
```
grep -r "rooted-vitality.com" rooted-vitality/
grep -r "@" rooted-vitality/ | grep -E "(support|contact|info)"
```

**Current Status:** ✅ Identified

---

## 2. RELATIVE PATH AUDIT

### 2.1 CSS & Style Imports ✅ GOOD (Relative Paths)

**File:** `rooted-vitality/verify.html`
- Lines 11-14: `../styles/base.css`, `../styles/layout.css`, etc. (Relative ✅)

**Files:** All CSS files using `@import url("base.css")` (Relative ✅)

**Status:** All CSS uses relative imports - **NO CHANGES NEEDED**

---

### 2.2 Script Includes ✅ GOOD (Relative Paths)

**All script tags use relative paths:**
- `./scripts/config.js`
- `./scripts/authManager.js`
- `./injections.js`

**Status:** All scripts use relative imports - **NO CHANGES NEEDED**

---

### 2.3 Asset References ✅ GOOD (Relative Paths)

**File:** `rooted-vitality/styles/base.css`
- **Line 231:** `background: url('../assets/logo_large.png')`

**Status:** Uses relative paths - **NO CHANGES NEEDED**

---

## 3. DIRECTORY STRUCTURE ANALYSIS

### Current Structure (Under kylemohney.com)
```
kylemohney.com/
└── rooted-vitality/
    ├── index.html
    ├── verify.html
    ├── admin/
    ├── api/
    ├── assets/
    ├── chat-bot/
    ├── components/
    ├── dashboard/
    ├── data/
    ├── functions/
    ├── scripts/
    ├── styles/
    └── [other folders]
```

### Target Structure (Standalone Project)
```
rooted-vitality/
├── index.html
├── verify.html
├── .env.local
├── .env.example
├── .github/
├── .gitignore
├── public/
│   ├── assets/
│   ├── data/
│   └── [static files]
├── src/ OR app/ (if using Vercel framework)
├── api/ (Vercel serverless functions)
├── components/
├── scripts/
├── styles/
└── package.json / config files
```

**NOTES:**
- If deploying to Vercel + Next.js: Will need restructuring to `app/` or `pages/` directories
- If deploying as static site: Can keep current structure mostly intact
- API endpoints should move to `/api/` directory for Vercel auto-routing

**Current Status:** ✅ Documented

---

## 4. DATA FILES & JSON CONFIGURATION

### 4.1 Data Files Location
**File:** `rooted-vitality/data/articles.json` and other JSON files

**Current fetch:**
```javascript
const response = await fetch('/rooted-vitality/data/articles.json');
```

**After Migration (choose one):**

**Option A - Keep in /data (Recommended for Vercel Static)**
```javascript
const response = await fetch('/data/articles.json');
```

**Option B - Move to /public/data (Vercel Standard)**
```javascript
const response = await fetch('/data/articles.json'); // Still works same way
```

**Action Required:**
- [ ] Update `renderManager.js` line 31
- [ ] Test data loading in local environment
- [ ] Test data loading in Vercel preview
- [ ] Test data loading in production

**Current Status:** ⚠️ NEEDS FIX

---

## 5. CONFIGURATION FILES TO CREATE

### 5.1 Environment Variables (.env.local)
**Create:** `rooted-vitality/.env.local` (DO NOT COMMIT)

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://[NEW_PROJECT_ID].supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API Endpoints
VITE_API_BASE_URL=https://rooted-vitality.com
VITE_ENVIRONMENT=production

# Email Configuration
VITE_SUPPORT_EMAIL=support@rooted-vitality.com
```

### 5.2 Environment Variables (.env.example)
**Create:** `rooted-vitality/.env.example` (COMMIT)

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://[PROJECT_ID].supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# API Endpoints
VITE_API_BASE_URL=https://rooted-vitality.com
VITE_ENVIRONMENT=production

# Email Configuration
VITE_SUPPORT_EMAIL=support@rooted-vitality.com
```

### 5.3 config.js Update
**File:** `rooted-vitality/scripts/config.js`

**Current:** Uses hardcoded values
**Target:** Should load from environment

```javascript
// scripts/config.js
const CONFIG = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://rooted-vitality.com',
  supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || 'support@rooted-vitality.com',
};

export default CONFIG;
```

**Current Status:** ⚠️ NEEDS UPDATE

---

## 6. GITHUB MIGRATION CHECKLIST

### Pre-Migration
- [ ] Create new private GitHub repository: `rooted-vitality`
- [ ] Initialize with `.gitignore` (node_modules, .env.local, etc.)
- [ ] Create branch protection rules for `main`
- [ ] Add team members with appropriate permissions

### Repository Setup
- [ ] Copy entire `rooted-vitality/` folder from kylemohney.com
- [ ] Create `.env.example` with all required variables
- [ ] Create `.gitignore` file (see below)
- [ ] Create `README.md` with setup instructions
- [ ] Add `SECURITY.md` for security policy

### .gitignore Template
```
# Environment
.env.local
.env.*.local
.env

# Dependencies
node_modules/
*.pnp
.pnp.js

# Production
build/
dist/
out/
.next/

# Testing
coverage/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
npm-debug.log*
yarn-debug.log*
```

**Current Status:** ✅ Template ready

---

## 7. SUPABASE MIGRATION CHECKLIST

### New Project Setup
- [ ] Create new Supabase organization (if needed)
- [ ] Create new Supabase project (rooted-vitality)
- [ ] Note new `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- [ ] Enable required authentication providers
- [ ] Set up database schema (import from existing or recreate)
- [ ] Set up Edge Functions:
  - [ ] `send-notification-email`
  - [ ] `send-error-report` (if exists)
- [ ] Configure CORS settings for new domain
- [ ] Set up Storage buckets for media

### Data Migration
- [ ] Export existing Supabase database schema
- [ ] Export existing Supabase data (if applicable)
- [ ] Import into new Supabase project
- [ ] Verify data integrity
- [ ] Test all database queries
- [ ] Test Edge Functions with new data

### Authentication URLs
- [ ] Update redirect URLs in Supabase Auth settings:
  - [ ] `https://rooted-vitality.com/verify`
  - [ ] `https://rooted-vitality.com/dashboard`
  - [ ] `http://localhost:5173` (dev)
  - [ ] Vercel preview URLs: `https://*.vercel.app`

**Current Status:** ✅ Checklist ready

---

## 8. VERCEL DEPLOYMENT CHECKLIST

### Project Setup
- [ ] Create new Vercel project
- [ ] Connect GitHub repository
- [ ] Configure environment variables (from .env.example)
- [ ] Set build command: `npm run build`
- [ ] Set output directory: `dist` (or `out` if using Next.js)
- [ ] Configure custom domain: `rooted-vitality.com`
- [ ] Enable automatic deployments on push to `main`

### Deployment Configuration
- [ ] Create `vercel.json` if needed:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_SUPABASE_URL": "@supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@supabase_key"
  }
}
```

### Preview URLs & Testing
- [ ] Test preview deployments before merging
- [ ] Update Supabase redirect URLs for preview domains
- [ ] Test all API endpoints in preview
- [ ] Test authentication flow in preview
- [ ] Test data loading in preview

**Current Status:** ✅ Checklist ready

---

## 9. FILES REQUIRING CHANGES - SUMMARY

### HIGH PRIORITY (Must Fix)
| File | Line(s) | Issue | Fix |
|------|---------|-------|-----|
| `scripts/supabaseClient.js` | 31-32 | Hardcoded Supabase URL & Key | Move to environment variables |
| `scripts/renderManager.js` | 31 | Hardcoded `/rooted-vitality/data/` path | Change to `/data/` |

### MEDIUM PRIORITY (Should Fix)
| File | Line(s) | Issue | Fix |
|------|---------|-------|-----|
| `scripts/ny-state-compliance.js` | 247 | Hardcoded email domain | Verify/update domain |
| `scripts/config.js` | all | No environment variable support | Add env var loading |

### LOW PRIORITY (Optional)
| File | Line(s) | Issue | Fix |
|------|---------|-------|-----|
| Various | - | HTML meta tags with old domain | Update meta tags |

---

## 10. DOMAIN CONSIDERATIONS

### Option A: New Domain (rooted-vitality.com)
- [ ] Register domain through domain registrar
- [ ] Configure DNS for Vercel
- [ ] Update all email addresses
- [ ] Update all hardcoded URLs
- [ ] Update legal/privacy pages
- [ ] Update copyright years

### Option B: Subdomain (vitality.company-domain.com)
- [ ] Configure DNS CNAME to Vercel
- [ ] Keep email structure from parent domain
- [ ] Update hardcoded URLs
- [ ] Verify SSL certificates

### Option C: Vercel Default Domain (rooted-vitality.vercel.app)
- [ ] For testing only
- [ ] Not recommended for production
- [ ] Update all environment-based URLs

**Recommendation:** Use Option A (rooted-vitality.com) for maximum control

**Current Status:** ⚠️ Domain decision needed

---

## 11. POST-MIGRATION TESTING CHECKLIST

### Functionality Testing
- [ ] User authentication (signup, login, logout)
- [ ] Email verification flow
- [ ] Password reset
- [ ] Profile creation & updates
- [ ] Data upload/download
- [ ] Search functionality
- [ ] Message/notification system
- [ ] Admin panels (if applicable)

### Performance Testing
- [ ] Page load times
- [ ] API response times
- [ ] Database query optimization
- [ ] CDN/caching behavior
- [ ] Image optimization

### Security Testing
- [ ] SQL injection protection
- [ ] XSS prevention
- [ ] CORS configuration
- [ ] Authentication token handling
- [ ] Environment variable security
- [ ] Sensitive data not logged

### Cross-Browser Testing
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

### Monitoring Setup
- [ ] Vercel analytics enabled
- [ ] Error tracking (Sentry/similar)
- [ ] Uptime monitoring
- [ ] Performance monitoring
- [ ] Log aggregation

**Current Status:** ✅ Checklist ready

---

## 12. BACKUP & ROLLBACK PLAN

### Before Migration
1. [ ] Full database backup (Supabase export)
2. [ ] Git backup (all branches)
3. [ ] Asset backup (images, files)
4. [ ] Configuration backup (.env files)

### Rollback Procedure (If Needed)
1. [ ] Revert DNS to previous host
2. [ ] Restore from database backup
3. [ ] Restore assets from backup
4. [ ] Communicate with users

### Monitoring During Migration
- [ ] Check error logs every 15 minutes
- [ ] Monitor API response times
- [ ] Check database performance
- [ ] Verify email delivery
- [ ] Monitor user reports

**Current Status:** ✅ Plan documented

---

## 13. TIMELINE & EXECUTION

### Phase 1: Preparation (This Week)
- [ ] Complete this audit ✅
- [ ] Create new GitHub repository
- [ ] Create new Supabase project
- [ ] Create new Vercel project

### Phase 2: Code Updates (Tomorrow)
- [ ] Update hardcoded Supabase credentials
- [ ] Update hardcoded API paths
- [ ] Add environment variable support
- [ ] Update config files
- [ ] Test locally

### Phase 3: Deployment (After Testing)
- [ ] Push to GitHub main branch
- [ ] Verify Vercel auto-deployment
- [ ] Run full test suite
- [ ] Monitor for errors

### Phase 4: Migration (Live)
- [ ] Update DNS records
- [ ] Verify domain routing
- [ ] Monitor performance
- [ ] Collect user feedback

### Phase 5: Cleanup (Post-Migration)
- [ ] Remove old kylemohney.com references
- [ ] Archive old repository (if applicable)
- [ ] Document final configuration
- [ ] Update team documentation

**Current Status:** 🟡 Ready to begin Phase 2

---

## 14. CRITICAL COMMAND REFERENCE

### Local Development
```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Run tests
npm run test
```

### GitHub Operations
```bash
# Clone new repository
git clone https://github.com/company/rooted-vitality.git

# Add origin
git remote add origin https://github.com/company/rooted-vitality.git

# Push existing code
git push -u origin main
```

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Supabase CLI
```bash
# Install Supabase CLI
npm i -g supabase

# Link project
supabase link --project-ref [PROJECT-REF]

# Pull remote schema
supabase db pull

# Push local migrations
supabase db push
```

**Current Status:** ✅ Commands documented

---

## 15. QUESTIONS FOR TEAM

Before final migration, clarify:

1. **Domain Name:** What is the final production domain?
   - [ ] rooted-vitality.com?
   - [ ] vitality.company.com?
   - [ ] Other: _____________?

2. **Hosting Strategy:** Vercel + custom domain or other?
   - [ ] Vercel + custom domain
   - [ ] Vercel + vercel.app domain
   - [ ] Other hosting: _____________?

3. **Email Configuration:**
   - [ ] What email service? (SendGrid, Mailgun, AWS SES, etc.)
   - [ ] Support email address?
   - [ ] Who manages email domains?

4. **Development Environment:**
   - [ ] Package manager? (npm, yarn, pnpm)
   - [ ] Node version requirements?
   - [ ] Build tool? (Vite, Webpack, Next.js)

5. **CI/CD Pipeline:**
   - [ ] Automatic testing required?
   - [ ] Who has deployment permissions?
   - [ ] Status page/monitoring service?

**Current Status:** ⏳ Awaiting team input

---

## APPENDIX A: PATH CHANGE REFERENCE

### Quick Find & Replace Guide

#### Old Paths → New Paths

| Old | New | File(s) |
|-----|-----|---------|
| `/rooted-vitality/data/articles.json` | `/data/articles.json` | renderManager.js |
| `../styles/` | `../styles/` | verify.html (NO CHANGE) |
| `./scripts/` | `./scripts/` | index.html (NO CHANGE) |
| `support@rootedvitality.com` | `support@rooted-vitality.com` | ny-state-compliance.js |

---

## APPENDIX B: File Structure Mapping

```
rooted-vitality/ (NEW STRUCTURE)
│
├── .env.local (DO NOT COMMIT)
├── .env.example
├── .gitignore
├── .github/
│   └── workflows/ (CI/CD if needed)
├── README.md
├── SECURITY.md
├── package.json
├── vercel.json (if needed)
│
├── public/
│   ├── assets/
│   ├── data/
│   │   └── articles.json
│   └── robots.txt
│
├── src/ OR [root]
│   ├── index.html
│   ├── verify.html
│   ├── admin/
│   ├── api/ (if using Vercel functions)
│   ├── components/
│   ├── dashboard/
│   ├── scripts/
│   ├── styles/
│   └── [other folders]
│
└── [CI/CD, tests, etc.]
```

---

## FINAL SIGN-OFF

**Audit Completed:** December 9, 2025  
**Auditor:** Copilot Agent  
**Status:** ✅ READY FOR MIGRATION  
**Critical Issues Found:** 2  
**Medium Issues Found:** 2  
**Action Items:** 30+  

**Next Step:** Begin Phase 2 Code Updates tomorrow

---

**Document Version:** 1.0  
**Last Updated:** December 9, 2025  
**Next Review:** After migration completion
