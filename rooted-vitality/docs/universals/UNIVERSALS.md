# Universal Features - Rooted Vitality

## Overview
Global features that work across all pages via injections.

## Files
- `/injections.js` - Header, footer, utilities
- `/styles.css` - Global styles

## Features

### Header Injection
- Logo with dynamic path detection
- Navigation menu
- "Book Consultation" button
- "Sign In" button (opens modal)
- Mobile hamburger menu

### Footer Injection
- Contact information
- Policy links
- Consistent branding

### Auth Modal
- Login form (email/password)
- Client/Practitioner tabs
- "Forgot Password" link
- "Sign Up" link with dynamic routing

## Path Detection
```javascript
const isSubdirectory = currentPath.includes('/articles/') || currentPath.includes('/policies/');
const pathPrefix = isSubdirectory ? '../' : './';
```

Automatically adjusts links for subdirectory pages.

## Implementation
All pages include at bottom:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="./scripts/config.js"></script>
<script src="./scripts/authManager.js"></script>
<script src="./injections.js"></script>
```

## Status
✅ Working on all 25 pages (root + articles + policies)
