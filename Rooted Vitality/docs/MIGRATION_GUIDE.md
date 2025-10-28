<!--
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: MIGRATION_GUIDE.md                                          ║
║  Purpose: How to migrate existing articles to centralized styles   ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝
-->

# Migration Guide: Centralizing Styles

## Overview

All article pages should now use the centralized `styles.css` and `injections.js` files instead of inline styles. This reduces code duplication, ensures consistency, and makes future updates much easier.

## Quick Migration Steps

### For Each Article File:

**1. Replace the entire `<style>` block with this link:**

```html
<!-- OLD: Remove entire <style>...</style> section -->
<style>
    /* All 100+ lines of CSS */
</style>

<!-- NEW: Add single line -->
<link rel="stylesheet" href="../assets/styles.css">
```

**2. Update container class:**

```html
<!-- OLD -->
<div class="container">

<!-- NEW -->
<div class="container-narrow">
```

**3. Add script before closing `</body>`:**

```html
<!-- NEW: Add this before </body> -->
<script src="../assets/injections.js"></script>
```

---

## Files to Update

All of these files should be migrated:

- ✅ `articles/holistic-medicine-explained.html` (Already done)
- ⏳ `articles/healing-plants-home.html`
- ⏳ `articles/finding-right-practitioner.html`
- ⏳ `articles/nutrition-holistic-wellness.html`
- ⏳ `articles/mindfulness-stress-relief.html`
- ⏳ `articles/seasonal-wellness.html`
- ⏳ `articles/pay-per-lead-basics.html`
- ⏳ `articles/building-your-profile.html`
- ⏳ `articles/lead-followup-practices.html`
- ⏳ `articles/measuring-roi.html`

---

## Before & After Example

### BEFORE (Inline Styles)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Article | Rooted Vitality</title>
    <link href="...fonts...">
    <style>
        :root { --color-hero-green: #ebf6e8; ... }
        html { background: var(--color-white); ... }
        body { font-family: 'Lora', serif; ... }
        h1, h2, h3 { font-family: 'Inter', sans-serif; ... }
        .container { max-width: 700px; ... }
        .back-button { ... 50 lines ... }
        .article-header { ... }
        .article-title { ... }
        .article-meta { ... }
        .article-content { ... 100+ lines total ... }
    </style>
</head>
<body>
    <div class="container">...</div>
</body>
</html>
```

### AFTER (Centralized Styles)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Article | Rooted Vitality</title>
    <link href="...fonts...">
    <link rel="stylesheet" href="../assets/styles.css">
</head>
<body>
    <div class="container-narrow">...</div>
    <script src="../assets/injections.js"></script>
</body>
</html>
```

**Result**: 
- 100+ lines of CSS removed from each article
- Consistent styling across all pages
- Single source of truth for branding
- Easier maintenance and updates

---

## CSS Classes Now Available

Use these pre-defined classes instead of inline styles:

### Layout
- `.container` - Full-width container (max 1200px)
- `.container-narrow` - Narrow article container (max 700px)

### Typography
- `h1, h2, h3, h4, h5, h6` - Auto-styled with correct font/size
- `p` - Paragraph with correct margins
- `a` - Links with hover effects

### Components
- `.back-button` - Styled back button
- `.article-header` - Header wrapper
- `.article-title` - Article heading
- `.article-meta` - Read time / category
- `.article-content` - Main content area
- `.highlight-box` - Information highlight
- `.plant-card` - Plant information card
- `.season-card` - Seasonal information card
- `.article-card` - Article preview card

### Buttons
- `.btn-primary` - Primary action button
- `.btn-secondary` - Secondary action button

---

## No More Inline Styles!

Remove this type of code:

```html
<!-- ❌ OLD: Inline styles -->
<div style="background: #ebf6e8; padding: 1rem; border-radius: 8px;">
<button style="background: #5d6a3e; color: white; padding: 0.8rem;">
<h2 style="color: #5d6a3e; font-size: 1.5rem;">

<!-- ✅ NEW: Use classes -->
<div class="plant-card">
<button class="btn-primary">
<h2> (auto-styled)
```

---

## Responsive Design is Built-In

No need to write media queries! `styles.css` handles:

- Desktop layout (1024px+)
- Tablet layout (768px-1024px)
- Mobile layout (480px-768px)
- Small mobile (<480px)

All typography and spacing automatically scale.

---

## Customization

To change colors/fonts globally, edit `assets/styles.css` CSS variables:

```css
:root {
    --color-button: #5d6a3e;        /* Change all buttons */
    --color-hero-green: #ebf6e8;    /* Change all green accents */
    --font-sans: 'Inter', sans-serif; /* Change heading font */
}
```

One change updates the entire site!

---

## Testing Checklist

After migrating an article, verify:

- [ ] Back button styled correctly and links work
- [ ] Article title displays in correct color (#5d6a3e)
- [ ] Content readable with correct line height
- [ ] Highlight boxes styled correctly
- [ ] Plant/season cards styled correctly
- [ ] Mobile view responds properly (test at 480px, 768px, 1024px)
- [ ] No horizontal scrolling on mobile

---

## Questions?

Refer to `assets/README.md` for detailed documentation.

**Last Updated**: October 28, 2025
