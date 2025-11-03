# Phase 3: System Architecture Diagram

## High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER LOGIN                              │
│                                                                 │
│  Client Email:Pass  OR  Practitioner Email:Pass                │
└────────────┬────────────────────┬─────────────────────────────┘
             │                    │
             ↓                    ↓
    ┌───────────────┐    ┌──────────────────┐
    │  authManager  │    │  authManager     │
    │  role:'client'│    │ role:'practitioner'
    └───────────────┘    └──────────────────┘
             │                    │
             ├─ active_view='c'   ├─ active_view='client'
             │                    │
             ↓                    ↓
    ┌──────────────────┐ ┌────────────────────────┐
    │  /dashboard/     │ │  /dashboard/           │
    │  client-dash.html│ │  practitioner-dash.html│
    └──────────────────┘ └────────────────────────┘
             │                    │
             ↓                    ↓
    ┌──────────────────┐ ┌────────────────────────┐
    │  PAGE LOAD       │ │  PAGE LOAD             │
    │ DOMContentLoaded │ │  DOMContentLoaded      │
    └────────┬─────────┘ └──────────┬─────────────┘
             │                      │
             ↓                      ↓
    ┌─────────────────┐   ┌──────────────────────┐
    │ RootedVitality  │   │ RootedVitality       │
    │ .init()         │   │ .init()              │
    └────────┬────────┘   └──────────┬───────────┘
             │                       │
    role='client'          role='practitioner'
    view=null              view='client'(from LS)
             │                       │
             ↓                       ↓
    ┌─────────────────────┐ ┌─────────────────────────────┐
    │renderHeader(        │ │renderHeader(                │
    │'client', null)      │ │'practitioner', 'client')    │
    └────────┬────────────┘ └──────────┬──────────────────┘
             │                         │
    Load header_client.html  Load header_client.html
    (same headers!)          (starts in client view)
             │                         │
             ├─ attachLogoBehavior     ├─ attachLogoBehavior
             │  href=/index.html       │  href=/index.html
             │                         │
             ├─ (no switcher)          ├─ attachViewSwitcher()
             │                         │  (attach to btns)
             ↓                         ↓
    ┌─────────────────┐      ┌────────────────────────┐
    │  CLIENT VIEW    │      │  CLIENT VIEW (PRO)     │
    │  Logo→Home      │      │  Logo→Home             │
    │  No switcher    │      │  "Pro View" available  │
    └─────────────────┘      └──────────┬─────────────┘
                                        │
                        User clicks "Practitioner View"
                                        │
                                        ↓
                    ┌────────────────────────────────────┐
                    │  attachViewSwitcher() fires        │
                    │  1. Set active_view='practitioner'│
                    │  2. Navigate /dashboard/pro/       │
                    │  3. Page reload                    │
                    └────────────┬─────────────────────┘
                                 │
                                 ↓
                    ┌────────────────────────────────────┐
                    │  renderHeader(                     │
                    │  'practitioner', 'practitioner')   │
                    └────────────┬─────────────────────┘
                                 │
                    Load header_practitioner.html
                                 │
                    ┌────────────────────────────────────┐
                    │ attachLogoBehavior                 │
                    │ href=/dashboard/pro/index.html     │
                    └────────────┬─────────────────────┘
                                 │
                                 ↓
                    ┌────────────────────────────────────┐
                    │  PRACTITIONER VIEW (PRO)           │
                    │  Logo→Pro Dashboard                │
                    │  "Client View" available           │
                    └────────────┬─────────────────────┘
                                 │
                        User clicks "Client View"
                                 │
                                 ↓
                    ┌────────────────────────────────────┐
                    │  attachViewSwitcher() fires        │
                    │  1. Set active_view='client'       │
                    │  2. Navigate /dashboard/client/    │
                    │  3. Page reload                    │
                    └────────────┬─────────────────────┘
                                 │
                                 ↓
                    ┌────────────────────────────────────┐
                    │  Back to CLIENT VIEW (PRO)         │
                    │  (same as before switching)        │
                    └────────────────────────────────────┘
```

---

## Component Interaction Diagram

```
                    ┌──────────────────┐
                    │  authManager.js  │
                    │  (Login Handler) │
                    └────────┬─────────┘
                             │
                    ┌────────▼──────────┐
                    │ Set user role     │
                    │ Set active_view   │
                    │ Redirect          │
                    └────────┬──────────┘
                             │
                    ┌────────▼──────────────┐
                    │  Dashboard Pages     │
                    │  (load + execute)    │
                    └────────┬──────────────┘
                             │
         ┌───────────────────▼────────────────────┐
         │  injections.js - RootedVitality.init() │
         │  1. Check user role                    │
         │  2. Load localStorage.active_view      │
         │  3. Call renderHeader(role, view)      │
         └───────────────────┬────────────────────┘
                             │
         ┌───────────────────▼──────────────────┐
         │  injections.js - renderHeader()      │
         │  1. Select header file               │
         │  2. Fetch & inject HTML              │
         │  3. Call attachLogoBehavior()         │
         │  4. Call attachViewSwitcher()         │
         │  5. Call initAvatarMenu()             │
         └───┬────────────┬───────────────┬──────┘
             │            │               │
    ┌────────▼─┐  ┌───────▼──┐  ┌──────▼────┐
    │ Attach   │  │ Attach   │  │ Init      │
    │ Logo     │  │ View     │  │ Avatar    │
    │ Behavior │  │ Switcher │  │ Menu      │
    └──────────┘  └───┬──────┘  └────┬──────┘
                      │             │
                      │ Attach      │
                      │ Click       │
                      │ Handlers    │
                      │             │
                      ↓             ↓
                  ┌──────────────────┐
                  │ User Interaction │
                  │ (Click Links)    │
                  └────────┬─────────┘
                           │
                ┌──────────▼──────────┐
                │ attachViewSwitcher  │
                │ Handler Fires       │
                │ 1. Update LS        │
                │ 2. Navigate         │
                │ 3. Reload page      │
                └────────┬────────────┘
                         │
                         ↓
              (Loop back to renderHeader)
```

---

## localStorage State Machine

```
                    ┌──────────────────┐
                    │   LOGIN PHASE    │
                    └────────┬─────────┘
                             │
        ┌────────────────────▼────────────────────┐
        │ Set active_view = 'client' (all users)  │
        └────────────────────┬────────────────────┘
                             │
               ┌─────────────▼──────────────┐
               │  Redirect to dashboard     │
               │  Page reloads              │
               └─────────────┬──────────────┘
                             │
              ┌──────────────▼────────────┐
              │ IDLE STATE                │
              │ active_view = 'client'    │
              │ (All users in view)       │
              └──────────────┬────────────┘
                             │
         ┌───────────────────┴──────────────────┐
         │                                      │
    Client User:                    Practitioner User:
    │                               │
    ├─ No switch option             ├─ Has "Pro View" btn
    │                               │
    └─ IDLE (client only)           ├─ Click "Pro View"
       active_view='client'         │
                                    ↓
                          ┌────────────────────┐
                          │ Set active_view    │
                          │ = 'practitioner'   │
                          └────────┬───────────┘
                                   │
                          ┌────────▼──────────┐
                          │ Navigate to /pro/  │
                          │ Page reloads       │
                          └────────┬───────────┘
                                   │
                          ┌────────▼──────────┐
                          │ PRO VIEW STATE    │
                          │ active_view=      │
                          │ 'practitioner'    │
                          └────────┬───────────┘
                                   │
                          Click "Client View"
                                   │
                          ┌────────▼──────────┐
                          │ Set active_view   │
                          │ = 'client'        │
                          └────────┬───────────┘
                                   │
                          ┌────────▼──────────┐
                          │ Navigate to /dash/ │
                          │ Page reloads       │
                          └────────┬───────────┘
                                   │
                          ┌────────▼──────────┐
                          │ Back to IDLE      │
                          │ active_view=      │
                          │ 'client'          │
                          └───────────────────┘
                                   │
                                   └─ Can toggle again...
```

---

## Logo Routing Logic Tree

```
                    START
                     │
                     ↓
         ┌──────────────────────┐
         │ User clicks logo     │
         │ document.href called │
         └──────────┬───────────┘
                    │
         ┌──────────▼────────────┐
         │ Check user role       │
         └──────────┬────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
   role='client'          role='practitioner'
        │                       │
        ↓                       ↓
   Logo href          ┌─────────────────┐
   /index.html        │ Check active_view
                      └────────┬────────┘
                               │
                   ┌───────────┴───────────┐
                   │                       │
         view='client'          view='practitioner'
                   │                       │
                   ↓                       ↓
                Logo href             Logo href
              /index.html          /dashboard/pro/
                                   index.html
```

---

## Data Flow: User Role to Header Selection

```
Supabase:
│
├─ users table
│  └─ role: 'client' | 'practitioner'
│
└─ profiles table
   └─ [linked to user]

        │
        ↓ (on login)
        
authManager.getCurrentUser()
        │
        ├─ Returns: { id, email, role: 'client'|'practitioner', ... }
        │
        ↓
        
localStorage.rvUser = JSON.stringify(user)
        │
        ├─ Cached locally
        │
        ↓
        
On page load:
authManager.getCurrentUser()
        │
        ├─ Returns user object with role
        │
        ↓
        
RootedVitality.init()
        │
        ├─ userData.role = 'client' | 'practitioner'
        │
        ↓
        
renderHeader(role, view)
        │
        ├─ Select header_client.html or header_practitioner.html
        │
        ↓
        
Header renders with:
├─ Logo href: /index.html or /dashboard/pro/index.html
├─ Navigation menus
└─ View switcher (practitioner only)
```

---

## Security Boundary

```
┌─────────────────────────────────────────────┐
│         CLIENT-SIDE (Browser)               │
│                                             │
│  localStorage.active_view = 'client'|'pro'  │
│  (User preference - NOT access control)     │
│                                             │
│  ⚠️  Could be manually changed by user      │
│  ⚠️  Does NOT grant access to resources     │
│                                             │
│  Only affects:                              │
│  - Which header displays                    │
│  - Logo redirect URL                        │
│  - UI appearance                            │
└─────────────────────────────────────────────┘
                    │
          (Network boundary)
                    │
                    ↓
┌─────────────────────────────────────────────┐
│         SERVER-SIDE (Auth)                  │
│                                             │
│  Supabase Auth:                             │
│  ├─ user.id                                 │
│  ├─ user.role (source of truth)             │
│  └─ Access tokens                           │
│                                             │
│  Database Layer:                            │
│  ├─ Row-Level Security (RLS)                │
│  ├─ Column-Level Security                   │
│  └─ Role-based queries                      │
│                                             │
│  ✅ Real access control enforced here       │
│  ✅ Client-side preference cannot bypass    │
│  ✅ API validates every request             │
└─────────────────────────────────────────────┘
```

---

**Note**: This architecture prioritizes UX for practitioners while maintaining strict security boundaries. View switching affects UI only; real data access control happens server-side.

