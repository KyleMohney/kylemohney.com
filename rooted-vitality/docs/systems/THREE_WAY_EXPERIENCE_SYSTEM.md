




# Rooted Vitality: Three-Way Experience Architecture

## Overview
Rooted Vitality supports three distinct user experiences:
- **Public View**: Unauthenticated users can browse, view articles, and access the help center.
- **Client View**: Authenticated clients access their dashboard, track wellness, and interact with practitioners.
- **Practitioner View**: Authenticated practitioners can switch between client and pro dashboards, manage their practice, and access professional tools.

---

## High-Level Flow Diagram
```
┌─────────────┐
│   PUBLIC    │
│ (Not logged in)
│ Browse, Help Center, Articles
└─────┬───────┘
      │
      ▼
┌─────────────┐
│   LOGIN     │
└─────┬───────┘
      │
      ▼
┌─────────────┐      ┌─────────────────┐
│   CLIENT    │      │ PRACTITIONER    │
│ Dashboard   │      │ Dashboard       │
│ header_client.html │ header_client.html (default)
│ logo: /index.html  │ logo: /index.html
│ No switcher │      │ Switcher: "Practitioner View"
└─────┬───────┘      └───────┬─────────┘
      │                      │
      ▼                      ▼
┌─────────────┐      ┌─────────────────┐
│ Practitioner│      │ Practitioner    │
│ switches to │      │ Pro Dashboard   │
│ Pro View    │      │ header_practitioner.html
│ logo: /dashboard/pro/index.html
│ Switcher: "Client View"
└─────────────┘      └─────────────────┘
```

---

## Component & Data Flow
- **authManager.js**: Handles login, sets user role, sets localStorage.active_view
- **injections.js**: Initializes app, loads view from localStorage, renders appropriate header
- **Header Components**:
  - `header_public.html`: For public users
  - `header_client.html`: For clients and practitioners in client view
  - `header_practitioner.html`: For practitioners in pro view
- **View Switcher**: Only visible for practitioners, allows toggling between client and pro views
- **Logo Routing**: Logo href changes based on view and role

---

## Experience Logic
### Public View
- No authentication required
- Can browse articles, help center, and public pages
- Header: `header_public.html`
- Logo: `/index.html`
- No dashboard, no view switcher

### Client View
- Authenticated as client (role = 'client')
- Redirects to `/dashboard/client-dashboard.html` on login
- Header: `header_client.html`
- Logo: `/index.html`
- No view switcher
- localStorage.active_view = 'client'

### Practitioner View
- Authenticated as practitioner (role = 'practitioner')
- Starts in client view by default
- Can switch to pro view via avatar menu
- Header: `header_client.html` (default), `header_practitioner.html` (pro view)
- Logo: `/index.html` (client view), `/dashboard/pro/index.html` (pro view)
- View switcher toggles localStorage.active_view between 'client' and 'practitioner'

---

## Header Selection Logic
```javascript
if (not logged in) {
    Load header_public.html
    Logo → /index.html
} else if (role === 'client') {
    Load header_client.html
    Logo → /index.html
} else if (role === 'practitioner') {
    if (view === 'practitioner') {
        Load header_practitioner.html
        Logo → /dashboard/pro/index.html
    } else {
        Load header_client.html
        Logo → /index.html
    }
}
```

---

## Security Boundaries
- **Public View**: No access to dashboards or private data
- **Client/Practitioner Views**: Authenticated via Supabase; access controlled by role
- **View switching**: Cosmetic only, does not affect backend access
- **localStorage.active_view**: UI preference, not security
- **Server-side RLS**: Real access control enforced in database

---

## localStorage State Machine
- `active_view` key stores current view for practitioners
- Set to 'client' on login for all users
- Practitioners can toggle to 'practitioner' view
- Survives page reloads and navigation
- Reset to 'client' on new login

---

## UI Elements
- **Public**: No dashboard, public header, help center, articles
- **Client**: Dashboard, client header, logo to home, no switcher
- **Practitioner**: Dashboard, client header (default), switcher to pro view, pro header, logo to pro dashboard

---

## Testing Scenarios
- Public user can browse without login
- Client user sees only client dashboard and header
- Practitioner starts in client view, can switch to pro view and back
- View persists across reloads for practitioners
- Security boundaries maintained (no unauthorized access)

---

## File Map
```
components/
  header_public.html
  header_client.html
  header_practitioner.html
scripts/
  authManager.js
  injections.js
```

---

## Summary
Rooted Vitality now supports a robust three-way experience:
- **Public**: Browse and learn
- **Client**: Track wellness and interact
- **Practitioner**: Manage practice, toggle views

All logic, routing, and UI elements are documented here for future reference and onboarding.