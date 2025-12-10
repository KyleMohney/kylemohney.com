# ROOTED VITALITY MIGRATION - IMMEDIATE ACTION PLAN
## What to Do Tomorrow (Phase 2: Code Updates)

**Date Prepared:** December 9, 2025  
**Execution Date:** December 10, 2025  
**Status:** READY TO EXECUTE

---

## MORNING TASKS (30 minutes)

### 1. Gather New Credentials from Supabase ✅
**Time:** 5 minutes

```
NEEDED FROM NEW SUPABASE PROJECT:
[ ] Project ID: _____________________________
[ ] Project URL: _____________________________
[ ] Anon Key: _____________________________

WHERE TO GET THEM:
1. Log in to Supabase Dashboard
2. Click on new project
3. Go to Settings → API
4. Copy ANON KEY
5. Note the Project URL (appears in URL bar)
```

### 2. Create Environment Files ✅
**Time:** 5 minutes

**File 1:** Create `rooted-vitality/.env.local`
```env
VITE_SUPABASE_URL=https://[COPY_FROM_SUPABASE].supabase.co
VITE_SUPABASE_ANON_KEY=[COPY_FROM_SUPABASE]
VITE_API_BASE_URL=http://localhost:5173
VITE_ENVIRONMENT=development
VITE_SUPPORT_EMAIL=support@rooted-vitality.com
```

**File 2:** Create `rooted-vitality/.env.example`
```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_API_BASE_URL=https://rooted-vitality.com
VITE_ENVIRONMENT=production
VITE_SUPPORT_EMAIL=support@rooted-vitality.com
```

### 3. Create .gitignore ✅
**Time:** 2 minutes

**File:** Create `rooted-vitality/.gitignore`
```
.env.local
.env.*.local
node_modules/
dist/
build/
.DS_Store
*.log
```

---

## LATE MORNING - CODE UPDATES (45 minutes)

### 4. Update supabaseClient.js ⚠️
**Time:** 10 minutes
**File:** `rooted-vitality/scripts/supabaseClient.js`

**Find lines 31-32:**
```javascript
// CURRENT
const SUPABASE_URL = "https://racsktdyrvepyvndbjzs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```

**Replace with:**
```javascript
// NEW
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://YOUR_PROJECT_ID.supabase.co";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "YOUR_KEY_HERE";
```

### 5. Update renderManager.js ⚠️
**Time:** 5 minutes
**File:** `rooted-vitality/scripts/renderManager.js`

**Find line 31:**
```javascript
// CURRENT
const response = await fetch('/rooted-vitality/data/articles.json');
```

**Replace with:**
```javascript
// NEW
const response = await fetch('/data/articles.json');
```

### 6. Update config.js ⚠️
**Time:** 15 minutes
**File:** `rooted-vitality/scripts/config.js`

**Goal:** Make it load from environment variables

**Template:**
```javascript
const CONFIG = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'https://DEFAULT.supabase.co',
  supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'default',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://rooted-vitality.com',
  supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || 'support@rooted-vitality.com',
};

export default CONFIG;
```

### 7. Verify Email Addresses ⚠️
**Time:** 10 minutes

**Search for:**
```bash
grep -r "rootedvitality.com" rooted-vitality/
grep -r "support@" rooted-vitality/
```

**Update any instances found to:**
- `support@rooted-vitality.com` (or your final domain)
- `contact@rooted-vitality.com` (if needed)

---

## AFTERNOON - TESTING (30 minutes)

### 8. Test Local Development ✅
**Time:** 15 minutes

```bash
# 1. Install dependencies (if not done)
npm install

# 2. Start dev server
npm run dev

# 3. Check console for errors
# Should see something like:
# ✓ vite v4.x.x ready in 123 ms
# ➜  Local:   http://localhost:5173/

# 4. Open browser to http://localhost:5173
# 5. Check browser console (F12)
# Should see: ✓ Supabase connected successfully
```

### 9. Verify Environment Variables Loaded ✅
**Time:** 5 minutes

**In browser console (F12 → Console tab):**
```javascript
// Run this:
console.log(import.meta.env.VITE_SUPABASE_URL)

// Should show your new URL
// Example output: https://abcdefghij.supabase.co
```

### 10. Build for Production ✅
**Time:** 10 minutes

```bash
# Build production bundle
npm run build

# Check output
npm run preview

# Open http://localhost:4173
# Verify no console errors
```

---

## END OF DAY - PREPARATION (15 minutes)

### 11. Commit Changes to Git ✅
**Time:** 10 minutes

```bash
# Add files
git add .

# Commit with message
git commit -m "feat: Update paths and environment variables for migration

- Update Supabase credentials to use environment variables
- Change /rooted-vitality/data/ path to /data/
- Create environment variable configuration system
- Add .env.example and .gitignore templates"

# Verify
git log --oneline -3
```

### 12. Create GitHub Repository ✅
**Time:** 5 minutes

**Steps:**
1. Go to GitHub.com
2. Click "New Repository"
3. Name: `rooted-vitality`
4. Private: YES
5. Initialize with README: YES
6. Add .gitignore: Node
7. Create repository

**Get remote URL:**
```bash
# Copy the HTTPS URL from GitHub
# Usually looks like: https://github.com/username/rooted-vitality.git
```

### 13. Push to GitHub ✅
**Time:** (Do next day)

```bash
# Add remote
git remote add origin https://github.com/username/rooted-vitality.git

# Push
git push -u origin main
```

---

## VERIFICATION CHECKLIST

### Code Changes ✅
- [ ] supabaseClient.js updated (lines 31-32)
- [ ] renderManager.js updated (line 31)
- [ ] config.js updated to use env vars
- [ ] All email addresses verified
- [ ] .env.local created with new credentials
- [ ] .env.example created
- [ ] .gitignore created

### Testing ✅
- [ ] `npm install` runs without errors
- [ ] `npm run dev` starts successfully
- [ ] Browser console shows no errors
- [ ] `import.meta.env.VITE_SUPABASE_URL` returns new URL
- [ ] `npm run build` succeeds
- [ ] `npm run preview` works

### Git ✅
- [ ] Changes committed with good message
- [ ] GitHub repository created
- [ ] Ready to push

---

## COMMON PITFALLS TO AVOID

### ❌ Don't commit .env.local
```
# WRONG - Will expose your credentials
git add .env.local
git commit -m "add env vars"

# RIGHT - Add to .gitignore
echo ".env.local" >> .gitignore
git add .gitignore
```

### ❌ Don't use old Supabase credentials
```
# WRONG - Old credentials
VITE_SUPABASE_URL="https://racsktdyrvepyvndbjzs.supabase.co"

# RIGHT - New credentials
VITE_SUPABASE_URL="https://YOUR_NEW_PROJECT.supabase.co"
```

### ❌ Don't forget the data path change
```
# WRONG - Old path structure
fetch('/rooted-vitality/data/articles.json')

# RIGHT - New path
fetch('/data/articles.json')
```

### ❌ Don't mix environment variable formats
```
# WRONG - mixing different formats
const url = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;

# RIGHT - choose one format consistently
const url = import.meta.env.VITE_SUPABASE_URL || 'fallback_url';
```

---

## QUICK COMMAND REFERENCE

### Setup
```bash
npm install
npm run dev
npm run build
npm run preview
```

### Git
```bash
git status
git add .
git commit -m "message"
git log --oneline
```

### Verification
```bash
# Check env vars loaded
grep -r "VITE_" rooted-vitality/

# Find hardcoded paths
grep -r "/rooted-vitality/" rooted-vitality/
grep -r "https://" rooted-vitality/scripts/

# Test file exists
ls rooted-vitality/data/articles.json
```

---

## TIMELINE

```
08:00 - 08:15  : Gather Supabase credentials
08:15 - 08:30  : Create environment files
08:30 - 09:15  : Update code files (4 files)
09:15 - 09:45  : Local testing
09:45 - 10:00  : Commit to Git
10:00 - 10:15  : Create GitHub repo
10:15 - 10:30  : Buffer/troubleshooting
```

**Total Time:** ~2.5 hours

---

## IF YOU GET STUCK

### Error: "Module not found"
```
1. Check file paths are correct
2. Verify relative paths (../)
3. Check imports use correct file names
4. Try npm install again
```

### Error: "Supabase is undefined"
```
1. Check supabaseClient.js was updated
2. Verify script load order
3. Check env vars in .env.local
4. Restart dev server: npm run dev
```

### Error: "CORS error" when fetching
```
1. Check API path is correct (/api/send-error-report)
2. Verify domain in Supabase CORS settings
3. Test with simple GET first
4. Check browser Network tab for actual error
```

### Error: 404 on /data/articles.json
```
1. Verify file exists: ls rooted-vitality/data/articles.json
2. Check path is /data/ not /rooted-vitality/data/
3. Rebuild: npm run build
4. Clear browser cache (Ctrl+Shift+Delete)
```

---

## NEXT PHASE (Day After)

Once tomorrow's updates are complete and tested:

```
Day 3 (Phase 3 - Deployment Prep):
1. Set up new Vercel project
2. Configure environment variables in Vercel
3. Connect GitHub repository
4. Run deployment preview
5. Test preview deployment
```

---

## SIGN-OFF

**Prepared By:** Copilot Agent  
**Date:** December 9, 2025  
**Status:** ✅ Ready for execution  
**Expected Completion:** ~2.5 hours  
**Success Criteria:**
- [ ] All code files updated
- [ ] Local testing passes
- [ ] No console errors
- [ ] Changes committed to Git
- [ ] GitHub repo created

---

**Good luck tomorrow! You've got this. 🚀**
