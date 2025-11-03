# Phase 3: Quick Reference Guide
## Dual-Experience Logic Flow

---

## 🎯 User Journeys

### Client User
```
Login (Client)
     ↓
authManager.js sets role = 'client'
     ↓
localStorage.active_view = 'client'
     ↓
Redirect → /dashboard/client-dashboard.html
     ↓
injections.js init() detects role = 'client'
     ↓
renderHeader('client') → header_client.html loads
     ↓
Logo href = '/index.html'
     ↓
No view switcher shown
```

### Practitioner User - Initial Login
```
Login (Practitioner)
     ↓
authManager.js sets role = 'practitioner'
     ↓
localStorage.active_view = 'client' (default)
     ↓
Redirect → /dashboard/practitioner-dashboard.html
     ↓
injections.js init() detects role = 'practitioner'
     ↓
Gets view from localStorage = 'client'
     ↓
renderHeader('practitioner', 'client')
     ↓
header_client.html loads (NOT practitioner header!)
     ↓
Logo href = '/index.html'
     ↓
"Practitioner View" option shown in avatar menu
```

### Practitioner User - Switch to Practitioner View
```
User clicks "Practitioner View" in avatar menu
     ↓
attachViewSwitcher() event fires
     ↓
localStorage.active_view = 'practitioner'
     ↓
Navigate to /dashboard/pro/index.html
     ↓
Page reloads
     ↓
injections.js init() detects role = 'practitioner'
     ↓
Gets view from localStorage = 'practitioner'
     ↓
renderHeader('practitioner', 'practitioner')
     ↓
header_practitioner.html loads
     ↓
Logo href = '/dashboard/pro/index.html'
     ↓
attachLogoBehavior() confirms logo routing
     ↓
"Client View" option shown in avatar menu
```

### Practitioner User - Switch Back to Client View
```
User clicks "Client View" in avatar menu
     ↓
attachViewSwitcher() event fires
     ↓
localStorage.active_view = 'client'
     ↓
Navigate to /dashboard/client-dashboard.html
     ↓
Page reloads
     ↓
injections.js init() detects role = 'practitioner'
     ↓
Gets view from localStorage = 'client'
     ↓
renderHeader('practitioner', 'client')
     ↓
header_client.html loads (back to client view!)
     ↓
Logo href = '/index.html'
     ↓
"Practitioner View" option available again
```

---

## 📊 Header Selection Logic

### renderHeader(role, view)

```
if role === 'client':
    Load header_client.html
    Logo href → /index.html

else if role === 'practitioner':
    if view === 'practitioner':
        Load header_practitioner.html
        Logo href → /dashboard/pro/index.html
    else:
        Load header_client.html
        Logo href → /index.html

else (public):
    Load header_public.html
    Logo href → /index.html
```

---

## 🔧 Key Functions

### 1. renderHeader(role, view)
- **Purpose**: Fetches and injects appropriate header
- **Calls**: 
  - `attachLogoBehavior(role, view)`
  - `attachViewSwitcher()` (if practitioner)
  - `initAvatarMenu()`

### 2. attachLogoBehavior(role, view)
- **Purpose**: Sets logo.href based on role and view
- **Logic**:
  - If practitioner + view = 'practitioner' → `/dashboard/pro/index.html`
  - Otherwise → `/index.html`

### 3. attachViewSwitcher()
- **Purpose**: Handles view switching buttons
- **Triggers**: Clicks on elements with `[data-switch-view]`
- **Actions**:
  - Saves view to `localStorage.active_view`
  - Navigates to appropriate dashboard
  - Page reload preserves view

### 4. initAvatarMenu()
- **Purpose**: Setup avatar dropdown interactions
- **New**: Shows "Practitioner View" link only for practitioners

---

## 💾 localStorage Keys

```javascript
// Current active view for practitioners
localStorage.getItem('active_view')
// Values: 'client' or 'practitioner'
// Default: 'client' (set on login)

// Set by user's view choice
localStorage.setItem('active_view', 'client')
localStorage.setItem('active_view', 'practitioner')
```

---

## 🔀 Navigation Targets

### Client View Navigation
```
Logo clicks → /index.html
Sidebar links → /dashboard/client-dashboard.html
Switch to Pro → /dashboard/pro/index.html (+ localStorage update)
```

### Practitioner View Navigation
```
Logo clicks → /dashboard/pro/index.html
Sidebar links → /dashboard/pro/...
Switch to Client → /dashboard/client-dashboard.html (+ localStorage update)
```

---

## ✅ Verification Steps

### 1. Client Login
- [ ] Logs in successfully
- [ ] Redirects to /dashboard/client-dashboard.html
- [ ] Client header shows
- [ ] Logo links to /index.html
- [ ] No "Practitioner View" option in avatar menu

### 2. Practitioner Login (Initial)
- [ ] Logs in successfully
- [ ] Redirects to /dashboard/practitioner-dashboard.html
- [ ] Client header shows (NOT practitioner header yet)
- [ ] Logo links to /index.html
- [ ] "Practitioner View" option visible in avatar menu

### 3. Practitioner - Switch Views
- [ ] Click "Practitioner View"
- [ ] Navigates to /dashboard/pro/index.html
- [ ] Practitioner header loads
- [ ] Logo links to /dashboard/pro/index.html
- [ ] "Client View" option visible
- [ ] Refresh page → stays in practitioner view
- [ ] Click "Client View"
- [ ] Back to client header and /index.html logo

---

## 🐛 Debugging Commands (Browser Console)

```javascript
// Check current view
localStorage.getItem('active_view')

// Check user role
window.authManager.getCurrentUser()

// Manually switch views
localStorage.setItem('active_view', 'practitioner')
window.location.reload()

// Check header element
document.querySelector('.rv-logo')
document.querySelector('.rv-header')

// Check view switcher elements
document.querySelectorAll('[data-switch-view]')

// Manual header render
RootedVitality.renderHeader('practitioner', 'practitioner')
```

---

## 📝 Data Flow Diagram

```
┌─────────────────────────┐
│   User Login (form)     │
└────────────┬────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│   authManager.js                    │
│   1. Authenticate via Supabase      │
│   2. Get user role                  │
│   3. Set localStorage.active_view   │
│   4. Redirect to dashboard          │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────┐
│   Page Load             │
│   DOMContentLoaded      │
└────────────┬────────────┘
             │
             ↓
┌──────────────────────────────────────┐
│   RootedVitality.init()              │
│   1. Check user role                 │
│   2. Load view from localStorage     │
│   3. Call renderHeader(role, view)   │
└────────────┬─────────────────────────┘
             │
             ↓
┌────────────────────────────────────────┐
│   renderHeader(role, view)             │
│   1. Select header file               │
│   2. Fetch & inject HTML              │
│   3. Call attachLogoBehavior()         │
│   4. Call attachViewSwitcher()         │
│   5. Call initAvatarMenu()             │
└────────────┬─────────────────────────┘
             │
             ├─→ attachLogoBehavior()
             │   └─→ Set logo href
             │
             ├─→ attachViewSwitcher()
             │   └─→ Attach click handlers
             │
             └─→ initAvatarMenu()
                 └─→ Setup dropdown + show switcher
                     if practitioner
```

---

## 🎨 UI Elements

### Client Header (header_client.html)
```
Logo [Rooted Vitality] | Nav Links | Notifications | Avatar ▼
                                                         ├─ Profile
                                                         ├─ Billing
                                                         ├─ Reviews
                                                         ├─ ─────────
                                                         ├─ Practitioner View (if practitioner)
                                                         └─ Log out
```

### Practitioner Header (header_practitioner.html)
```
Logo [Rooted Vitality] | Dashboard | Messages | Calendar | Profile | Avatar ▼
                                                                      ├─ Analytics
                                                                      ├─ Billing & Payouts
                                                                      ├─ Settings
                                                                      ├─ Support
                                                                      ├─ ────────
                                                                      ├─ Client View
                                                                      └─ Sign Out
```

---

## 🚀 Ready for Testing!

All Phase 3 components are now integrated:
✓ Dual header system
✓ Dynamic logo routing
✓ View switcher functionality
✓ localStorage persistence
✓ Practitioner role detection

Follow the testing checklist in PHASE_3_IMPLEMENTATION.md

