# Bug Tracker - Rooted Vitality

## Active Issues

### 🔴 HIGH PRIORITY

**Email Rate Limit**
- **Issue:** Supabase free tier limits signup emails to 3-4 per hour
- **Impact:** Cannot test signup repeatedly, users may hit limit
- **Solution Options:**
  1. Disable email confirmations (testing only)
  2. Configure custom SMTP with Gmail (recommended)
  3. Upgrade to Supabase Pro ($25/mo)
- **Status:** Workaround available (disable confirmations)

### 🟡 MEDIUM PRIORITY

**No Email Verification Template**
- **Issue:** Default Supabase email template, not branded
- **Impact:** User experience not optimal
- **Solution:** Upload custom HTML template to Supabase
- **Status:** Template exists in `/docs/` but not uploaded

### 🟢 LOW PRIORITY

**Missing Favicon**
- **Issue:** 404 error for `/favicon.ico`
- **Impact:** Minor console error, no functional impact
- **Solution:** Add favicon.ico to root
- **Status:** Cosmetic only

## Resolved

✅ **Supabase URL Typo** - Fixed Oct 30
✅ **Profile Creation Foreign Key Error** - Fixed Oct 30 with database trigger
✅ **Universal Features Not Working on Subdirectories** - Fixed with path detection
