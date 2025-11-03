# Phase 3: Dual-Experience Logic (Client ↔ Practitioner)
## Implementation Summary

### Overview
Phase 3 implements role-aware header rendering and logo routing for Rooted Vitality's dual experience system. Users can now seamlessly switch between Client View and Practitioner View with dynamic header updates and appropriate navigation.

---

## Changes Made

### 1. **injections.js - Enhanced renderHeader() Function**
- **Location**: Lines 136-152
- **Changes**:
  - Added `view` parameter to distinguish between client and practitioner views
  - Added localStorage support for `active_view` persistence
  - For practitioners, determines header based on active view setting
  - Calls new `attachLogoBehavior()` and `attachViewSwitcher()` functions

```javascript
renderHeader: async function(role = 'public', view = null) {
    // Determine view for practitioners
    if (role === 'practitioner' && !view) {
        view = localStorage.getItem('active_view') || 'client';
    }
    // ... rest of logic
}
```

### 2. **injections.js - New attachLogoBehavior() Function**
- **Location**: Lines 260-278
- **Purpose**: Dynamically sets logo href based on user role and view
- **Behavior**:
  - Client View: Logo links to `/index.html`
  - Practitioner View: Logo links to `/dashboard/pro/index.html`

```javascript
attachLogoBehavior: function(role, view) {
    const logo = document.querySelector('.rv-logo');
    let targetHref = '/index.html';
    if (role === 'practitioner' && view === 'practitioner') {
        targetHref = '/dashboard/pro/index.html';
    }
    logo.setAttribute('href', targetHref);
}
```

### 3. **injections.js - New attachViewSwitcher() Function**
- **Location**: Lines 280-302
- **Purpose**: Handles view switching buttons in avatar dropdowns
- **Behavior**:
  - Detects clicks on `[data-switch-view]` elements
  - Persists view choice to `localStorage.active_view`
  - Navigates to appropriate dashboard

```javascript
attachViewSwitcher: function() {
    document.querySelectorAll('[data-switch-view]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const newView = btn.dataset.switchView === 'practitioner' ? 'practitioner' : 'client';
            localStorage.setItem('active_view', newView);
            const targetUrl = newView === 'practitioner' 
                ? '/dashboard/pro/index.html' 
                : '/dashboard/client-dashboard.html';
            window.location.href = targetUrl;
        });
    });
}
```

### 4. **injections.js - Updated init() Function**
- **Location**: Lines 752-786
- **Changes**:
  - Now detects user role and loads view from localStorage
  - Passes both role and view to renderHeader()
  - For practitioners, loads persisted view preference

```javascript
init: async function() {
    // ... check user
    if (headerRole === 'practitioner') {
        headerView = localStorage.getItem('active_view') || 'client';
    }
    await this.renderHeader(headerRole, headerView);
}
```

### 5. **injections.js - Enhanced initAvatarMenu() Function**
- **Location**: Lines 428-445
- **Changes**:
  - Added logic to show "Practitioner View" link only for practitioners
  - Checks user role via `window.authManager.getCurrentUser()`
  - Conditionally displays switcher link

```javascript
const switchToPractitionerBtn = document.getElementById('switchToPractitioner');
if (switchToPractitionerBtn) {
    const userData = window.authManager.getCurrentUser();
    if (userData && userData.role === 'practitioner') {
        switchToPractitionerBtn.style.display = 'block';
    }
}
```

### 6. **header_client.html - Added View Switcher**
- **Location**: Avatar dropdown section
- **Change**: Added link with `data-switch-view="practitioner"` attribute
- **Visibility**: Only shown for practitioners (via JavaScript)

```html
<!-- View Switcher for Practitioners -->
<a href="#" data-switch-view="practitioner" role="menuitem" 
   class="rv-dropdown-item" style="display: none;" 
   id="switchToPractitioner">Practitioner View</a>
```

### 7. **header_practitioner.html - Added View Switcher**
- **Location**: Avatar dropdown section
- **Change**: Added link with `data-switch-view="client"` attribute
- **Always Visible**: Shown to all practitioners

```html
<!-- View Switcher for Client Experience -->
<a href="#" data-switch-view="client" role="menuitem" 
   class="rv-dropdown-item">Client View</a>
```

### 8. **authManager.js - Login Updates**
- **Location**: Lines 117-147
- **Changes**:
  - Sets `localStorage.active_view = 'client'` on successful login
  - Default view for all users is "Client View"
  - Maintains role-based redirects

```javascript
// Set default view for all users (client)
localStorage.setItem('active_view', 'client');
console.log('[Rooted Vitality] Default view set to: client');
```

---

## Behavior Rules

### Login Flow
1. User logs in as client → redirects to `/dashboard/client-dashboard.html`
2. User logs in as practitioner → redirects to `/dashboard/practitioner-dashboard.html`
3. On login, `localStorage.active_view` is set to `'client'`
4. For practitioners, client view shows client header initially

### View Switching (Practitioners Only)
1. Practitioner clicks "Practitioner View" → switches to practitioner header
   - Logo href: `/dashboard/pro/index.html`
   - Navigation: Practitioner-specific menus
   - Persisted in localStorage

2. Practitioner clicks "Client View" → switches to client header
   - Logo href: `/index.html`
   - Navigation: Client-specific menus
   - Persisted in localStorage

### Header Logo Behavior
- **Client View**: Logo always links to `/index.html` (home)
- **Practitioner View**: Logo links to `/dashboard/pro/index.html` (pro dashboard)
- **Public (Not Logged In)**: Logo links to `/index.html` (home)

### localStorage Usage
```javascript
// Stores current active view preference
localStorage.setItem('active_view', 'client' | 'practitioner')
localStorage.getItem('active_view') // Returns current view
```

---

## Testing Checklist

### Client User Flow
- [ ] Log in as client
- [ ] Logo should link to `/index.html`
- [ ] No "Practitioner View" option in avatar menu
- [ ] Can access `/dashboard/client-dashboard.html`
- [ ] Logout returns to home

### Practitioner User Flow (Part 1: Client View)
- [ ] Log in as practitioner
- [ ] Redirects to `/dashboard/practitioner-dashboard.html`
- [ ] Header shows client header by default
- [ ] Logo links to `/index.html`
- [ ] "Practitioner View" option visible in avatar menu

### Practitioner User Flow (Part 2: View Switch)
- [ ] Click "Practitioner View" in avatar menu
- [ ] Header switches to practitioner header
- [ ] Logo now links to `/dashboard/pro/index.html`
- [ ] Navigation shows practitioner menus (Dashboard, Messages, Calendar, etc.)
- [ ] "Client View" option visible in avatar menu
- [ ] localStorage.active_view = "practitioner"

### Practitioner User Flow (Part 3: Switch Back)
- [ ] Click "Client View" in avatar menu
- [ ] Header switches back to client header
- [ ] Logo back to `/index.html`
- [ ] Navigation shows client menus
- [ ] "Practitioner View" option visible again
- [ ] localStorage.active_view = "client"

### Page Reload Persistence
- [ ] Practitioner switches to practitioner view
- [ ] Page reload maintains practitioner view
- [ ] View persists even after navigation
- [ ] Logout clears view preference

---

## File Modifications Summary

| File | Lines | Changes |
|------|-------|---------|
| `injections.js` | Multiple | Enhanced renderHeader, added attachLogoBehavior, attachViewSwitcher, updated init, enhanced initAvatarMenu |
| `header_client.html` | ~48 | Added practitioner view switcher link |
| `header_practitioner.html` | ~33 | Added client view switcher link |
| `authManager.js` | ~117-147 | Set active_view on login |

---

## Architecture

```
User Login
    ↓
authManager.js
├─ Sets localStorage.active_view = 'client'
├─ Determines user role
└─ Redirects to appropriate dashboard
    ↓
Page Load
    ↓
injections.js init()
├─ Detects user role
├─ Loads active_view from localStorage
└─ Calls renderHeader(role, view)
    ↓
renderHeader(role, view)
├─ Selects appropriate header component
├─ Fetches and injects header HTML
├─ Calls attachLogoBehavior(role, view)
├─ Calls attachViewSwitcher() [if practitioner]
└─ Initializes menus
    ↓
attachLogoBehavior()
├─ Sets logo href based on view
└─ Ensures navigation routing works
    ↓
attachViewSwitcher()
├─ Attaches click handlers to switcher links
├─ Persists view to localStorage
└─ Navigates to appropriate dashboard
    ↓
User Interaction
├─ Click "Practitioner View" → Navigate & reload
├─ Click "Client View" → Navigate & reload
└─ Page reload maintains view preference
```

---

## Key Implementation Details

1. **View Parameter in renderHeader**
   - Defaults to localStorage value for practitioners
   - Determines which header component loads (client vs practitioner)
   - Passed to attachLogoBehavior for logo routing

2. **Logo Behavior**
   - Dynamically set via attachLogoBehavior()
   - Changes based on user role AND active view
   - Essential for navigation consistency

3. **View Switcher**
   - Only attached for practitioner-role users
   - Uses data-switch-view attribute for view selection
   - Updates localStorage before navigation
   - Ensures view persists across page reloads

4. **Header Components**
   - header_client.html: Loads for clients and practitioners in client view
   - header_practitioner.html: Loads for practitioners in practitioner view
   - header_public.html: Loads for non-authenticated users

5. **localStorage Persistence**
   - active_view: Tracks current view preference
   - Loaded on page init
   - Survives across page reloads and navigation
   - Reset to 'client' on new login

---

## Notes

- Phase 2 redirects are preserved (practitioner dashboard defaults to pro)
- No changes to authentication logic required
- Header switching is seamless with no page flickering
- View switcher is JavaScript-based for dynamic control
- Practitioners can toggle views instantly without re-authentication

