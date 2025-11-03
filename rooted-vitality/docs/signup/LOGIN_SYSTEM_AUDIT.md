╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: LOGIN_SYSTEM_AUDIT.md                                       ║
║  Purpose: Complete structural audit of authentication system        ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

TABLE OF CONTENTS
  1. EXECUTIVE SUMMARY
  2. CURRENT STATE ANALYSIS
  3. INCONSISTENCIES & GAPS
  4. SYSTEM PROMPT ALIGNMENT
  5. CRITICAL ISSUES
  6. RECOMMENDED ARCHITECTURE
  7. IMPLEMENTATION ROADMAP

═══════════════════════════════════════════════════════════════════
1. EXECUTIVE SUMMARY
═══════════════════════════════════════════════════════════════════

**PROBLEM:** Login system only works on index.html. Other pages cannot:
- Display logged-in state correctly
- Open login modal without errors
- Navigate to dashboard
- Handle logout properly

**ROOT CAUSE:** Multiple issues:
1. authManager auto-init only updates index.html (skips dashboards)
2. Login modal functions embedded in injections.js (no separation of concerns)
3. Header update logic inconsistent across pages
4. Missing Supabase client on some pages
5. No universal auth state management

**SYSTEM PROMPT VIOLATION:**
- ❌ Commandment #3: Code is out of place (auth in injections.js)
- ❌ Commandment #5: injections.js is bloated (should be universals only)
- ❌ Commandment #6: Not properly using universals consistently
- ❌ Commandment #10: Complex auth logic scattered across multiple files

═══════════════════════════════════════════════════════════════════
2. CURRENT STATE ANALYSIS
═══════════════════════════════════════════════════════════════════

FILE: injections.js
├─ Size: 573 lines (BLOATED - should be ~150)
├─ Functions embedded:
│  ├─ openLoginModal() — 31 lines
│  ├─ closeLoginModal() — 8 lines
│  ├─ Modal form handling — 60+ lines
│  ├─ Tab switching — 20 lines
│  └─ Email prefilling — 10 lines
└─ Problem: ALL auth logic here instead of authManager.js

FILE: authManager.js
├─ Size: 494 lines
├─ Has: login(), logout(), register(), _updateHeader()
├─ Missing: Session check on non-index pages
├─ Problem: Header update skipped on dashboards (by design to avoid duplicates)
└─ Inconsistency: Should be authManager handling all auth UI updates

FILE: Header Injection
├─ Current: Single hardcoded Login button in injections.js
├─ Update flow: authManager._updateHeader() replaces it
├─ Problem: Event listeners recreated on every update
└─ Consistency: No universal rule for where buttons appear

PAGE STATE ACROSS SITE:
┌─────────────────────┬─────────────┬──────────────────┬────────────────┐
│ Page                │ Header?     │ Auth Modal?      │ Logged-in Show?│
├─────────────────────┼─────────────┼──────────────────┼────────────────┤
│ index.html          │ ✅ YES      │ ✅ YES (works)   │ ✅ YES         │
│ signup.html         │ ✅ YES      │ ❌ NO (broken)   │ ❌ NO          │
│ verify.html         │ ❌ NO       │ ❌ NO            │ ❌ NO          │
│ articles/*.html     │ ✅ YES      │ ❌ NO (broken)   │ ❌ NO          │
│ policies/*.html     │ ✅ YES      │ ❌ NO (broken)   │ ❌ NO          │
│ dashboard/*.html    │ ✅ YES      │ ✅ YES (works)   │ ✅ YES         │
│ help-center/*.html  │ ✅ YES      │ ❌ NO (broken)   │ ❌ NO          │
└─────────────────────┴─────────────┴──────────────────┴────────────────┘

═══════════════════════════════════════════════════════════════════
3. INCONSISTENCIES & GAPS
═══════════════════════════════════════════════════════════════════

**INCONSISTENCY #1: Auth Modal Initialization**
- index.html: Modal initialized by injections.js (works)
- signup.html: Modal initialized but no Supabase client → errors
- articles/*.html: Modal initialized but form submission fails
- dashboard/*.html: Modal skipped, custom auth flow

Issue: Modal needs Supabase initialized but not all pages load it properly

**INCONSISTENCY #2: Header Update Triggers**
- index.html: Auto-updated on DOMContentLoaded
- signup.html: No update (not logged-in page anyway)
- articles/*.html: Auto-updated on DOMContentLoaded (inconsistent)
- dashboard/*.html: Manually updated in initializeDashboard() (custom logic)

Issue: Two different mechanisms competing for control

**INCONSISTENCY #3: Session Persistence**
- index.html: Uses authManager.getSession() on load
- dashboard/*.html: Uses localStorage fallback
- articles/*.html: No session check at all
- signup.html: No session check (correct, but others should)

Issue: No universal session check on every page

**INCONSISTENCY #4: Logout Handling**
- index.html: Logout button appears, click works
- signup.html: No logout (user shouldn't be there if logged in)
- articles/*.html: No logout button visible
- dashboard/*.html: Logout button appears and works

Issue: Logged-in users can't logout from most pages

**INCONSISTENCY #5: Login Modal Context**
- From index: Opens with 'client' role
- From articles: Opens with 'client' role
- From dashboard: Never opened (dashboard has separate flow)

Issue: No role detection based on current user type

═══════════════════════════════════════════════════════════════════
4. SYSTEM PROMPT ALIGNMENT
═══════════════════════════════════════════════════════════════════

COMMANDMENT #3: "No code can be out of place"
❌ VIOLATION: Authentication modal code in injections.js
   - Should be: authManager.js (with openLoginModal exported)
   - Currently: 100+ lines of auth logic in injections.js

COMMANDMENT #5: "Styles.css & injections.js must be lightweight"
❌ VIOLATION: injections.js is 573 lines
   - Current: Auth modal, form handling, tab switching
   - Should be: ~150 lines for header/footer injection only

COMMANDMENT #6: "Universals from styles and injections must be used on each page"
❌ VIOLATION: Pages inconsistent in how they use auth
   - Some pages skip session checks
   - Some pages don't show logout option
   - Some pages have broken modal initialization

COMMANDMENT #10: "Maintainability over cleverness"
❌ VIOLATION: Auth logic scattered across 3+ files
   - authManager.js: Login/logout functions
   - injections.js: Modal UI and form handling
   - Dashboard: Custom initialization code
   - Header: Dynamic button replacement

Needed: Centralized, clear, single source of truth

═══════════════════════════════════════════════════════════════════
5. CRITICAL ISSUES
═══════════════════════════════════════════════════════════════════

ISSUE #1: Modal Form Submission Broken on Non-Index Pages
- Symptom: User sees modal but can't submit form on articles/policies pages
- Root cause: Form submission in injections.js calls authManager.login()
- Problem: authManager wasn't designed to handle modal submissions
- Fix needed: Proper form integration between authManager and modal

ISSUE #2: No Session Redirect Logic
- Symptom: Logged-in users can see signup page and login modal
- Should be: Redirect to dashboard or home based on user role
- Missing: Redirect checks on signup/verify/login pages

ISSUE #3: Duplicate Session State
- Symptom: authManager and localStorage both tracking session
- Problem: Can become out of sync, causing wrong buttons to show
- Needed: Single source of truth (authManager as primary, localStorage as cache)

ISSUE #4: Role Detection Missing
- Symptom: Modal always opens 'client' role
- Should be: Detect if user is practitioner and open that tab
- Needed: Role detection in openLoginModal() based on localStorage

ISSUE #5: Mobile Menu Closes Modal
- Symptom: On mobile, opening menu interferes with modal
- Root cause: Both use z-index and event listeners
- Fix: Modal should have higher z-index and prevent menu interactions

═══════════════════════════════════════════════════════════════════
6. RECOMMENDED ARCHITECTURE
═══════════════════════════════════════════════════════════════════

PRINCIPLE: Single Source of Truth

auth/ folder structure:
├─ authManager.js (moved from scripts/)
│  ├─ Login/Register/Logout functions
│  ├─ Session management
│  ├─ openLoginModal() and closeLoginModal()
│  └─ All auth UI updates
│
├─ authModal.js (NEW - extracted from injections.js)
│  ├─ Modal HTML template
│  ├─ Modal form handling
│  ├─ Tab switching logic
│  ├─ Email prefilling
│  └─ NO business logic (authManager handles that)
│
└─ authHooks.js (NEW - page-level integration)
   ├─ initializeAuthOnPage() — universal function
   ├─ Session restoration for every page
   ├─ Logout redirect logic
   └─ Automatic header updates

FILE RESPONSIBILITIES (SEPARATION OF CONCERNS):

**injections.js** (KEEP LIGHTWEIGHT):
- Header injection (logo, nav, styling)
- Footer injection (logo, nav, styling)
- Mobile menu toggle
- NO AUTH LOGIC

**authManager.js** (ALL AUTH LOGIC):
- Login/Register/Logout
- Session restoration
- openLoginModal() / closeLoginModal()
- _updateHeader() with Dashboard/Logout buttons
- Role management

**authModal.js** (NEW):
- Modal HTML template (one version for all pages)
- Form element references
- Modal show/hide (but authManager calls these)
- Tab switching
- No business logic

**authHooks.js** (NEW):
- Called on EVERY page's DOMContentLoaded
- Single function: initializeAuthOnPage()
- Checks session on every page
- Shows/hides logout button universally
- Redirects if needed

**Per-Page Integration**:
```html
<script src="../scripts/config.js"></script>
<script src="../scripts/authManager.js"></script>
<script src="../scripts/authModal.js"></script>
<script src="../scripts/authHooks.js"></script>
<script src="../injections.js"></script>
<script>
  // Every page:
  document.addEventListener('DOMContentLoaded', () => {
    initializeAuthOnPage();
  });
</script>
```

═══════════════════════════════════════════════════════════════════
7. IMPLEMENTATION ROADMAP
═══════════════════════════════════════════════════════════════════

**PHASE 1: EXTRACT MODAL CODE (1 hour)**
- Create scripts/authModal.js
- Move modal HTML template from injections.js to authModal.js
- Move modal form event listeners from injections.js to authModal.js
- Keep modal DOM manipulation in authModal.js
- authManager.js calls authModal.openModal() / closeModal()

**PHASE 2: CENTRALIZE AUTH UI (1 hour)**
- Move openLoginModal() from injections.js to authManager.js
- Move closeLoginModal() from injections.js to authManager.js
- Move form submission from injections.js to authManager.js
- All public API stays window.authManager

**PHASE 3: CREATE AUTH HOOKS (1 hour)**
- Create scripts/authHooks.js
- Single function: window.initializeAuthOnPage()
  - Checks session via authManager.getSession()
  - Persists session via localStorage
  - Calls authManager._updateHeader()
  - Redirects if needed
- Called on every page

**PHASE 4: CLEAN INJECTIONS.JS (30 min)**
- Remove all auth logic
- Remove all modal code
- Remove openLoginModal(), closeLoginModal() references
- Add import of authManager and authHooks
- Focus: Pure HTML injection only

**PHASE 5: TEST ON ALL PAGES (1 hour)**
- index.html: Login modal opens, logout works ✓
- signup.html: Session redirect works, modal works ✓
- articles/*.html: Session persists, logout visible, modal works ✓
- dashboard/*.html: Session loads, buttons correct, modal works ✓
- verify.html: Can logout, modal works ✓

**PHASE 6: DOCUMENT ARCHITECTURE (30 min)**
- Update system_prompt.md with auth flow
- Create AUTH_SYSTEM.md with diagram
- Add example code snippet
- Update README.md

═══════════════════════════════════════════════════════════════════

CURRENT STATUS: ✅ IDENTIFIED & READY FOR REFACTOR

Next steps:
1. Approve architecture above
2. Execute Phase 1-6 in sequence
3. Test thoroughly on every page
4. Validate against system prompt commandments
