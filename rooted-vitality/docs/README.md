<!--
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: assets/README.md                                            ║
║  Purpose: Documentation for styles.css and injections.js           ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝
-->

# Rooted Vitality — Assets Documentation

## Overview

The `assets/` folder contains centralized branding, styling, and utility files for consistent design and functionality across all Rooted Vitality pages.

## Files

### 1. `styles.css`
Comprehensive stylesheet with all branding, typography, and component styles.

**Includes:**
- **Color Palette**: Hero backgrounds (green, cream, peach), interactive colors, text colors
- **Typography**: Font families (Inter for headings, Lora for body), sizing scales
- **Components**: Buttons, cards, boxes, article styles
- **Layout**: Container utilities, responsive grid system
- **Responsive Design**: 4 breakpoints (desktop, tablet, mobile, small mobile)
- **Accessibility**: Reduced motion preferences

**How to Use:**
```html
<head>
    <link rel="stylesheet" href="../assets/styles.css">
</head>
```

**Design Tokens (CSS Variables):**
```css
--color-hero-green: #ebf6e8;
--color-hero-cream: #fbf7ec;
--color-hero-peach: #fae2ca;
--color-button: #5d6a3e;
--color-text: #000000;
--color-white: #ffffff;
--font-sans: 'Inter', sans-serif;
--font-serif: 'Lora', serif;
```

---

### 2. `injections.js`
Centralized JavaScript utilities and global configuration.

**Includes:**
- **Navigation**: Back button handling, header/footer injection
- **Utilities**: Date formatting, smooth scrolling, analytics tracking
- **Configuration**: Site name, colors, URLs
- **Performance**: Debounce function, media query detection
- **Logging**: Branded console logging

**How to Use:**
```html
<script src="../assets/injections.js"></script>
```

**Available Methods:**

```javascript
// Back button handling
RootedVitality.injectBackButton();

// Header injection
RootedVitality.injectHeader();

// Footer injection
RootedVitality.injectFooter();

// Utilities
RootedVitality.formatDate(new Date());
RootedVitality.generateMeta('5 min read', 'Customer Guide');
RootedVitality.smoothScroll('.target-element');
RootedVitality.trackPageView();
RootedVitality.prefersDarkMode();
RootedVitality.log('Custom message');

// Auto-initialization
RootedVitality.init();
```

---

## Integration Guide

### For Article Pages

Update all article pages to use the centralized styles and utilities:

**1. Replace the entire `<style>` section with a link to `styles.css`**

```html
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Article Title | Rooted Vitality</title>
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@700&family=Lora:wght@400&display=swap" rel="stylesheet">
    
    <!-- Rooted Vitality Styles -->
    <link rel="stylesheet" href="../assets/styles.css">
</head>
```

**2. Update article HTML structure to use centralized classes**

```html
<body>
    <div class="container-narrow">
        <a href="../index.html" class="back-button">← Back to Help Center</a>
        
        <div class="article-header">
            <h1 class="article-title">Article Title</h1>
            <p class="article-meta">5 min read • Customer Guide</p>
        </div>
        
        <div class="article-content">
            <!-- Article content here -->
        </div>
    </div>
    
    <!-- Rooted Vitality Utilities -->
    <script src="../assets/injections.js"></script>
</body>
```

**3. Remove all inline styles**

All styling is now handled by `styles.css` through class names:
- `.back-button` - Styled back button
- `.article-header` - Article header section
- `.article-title` - Article title with correct color
- `.article-meta` - Metadata styling (read time, category)
- `.article-content` - Article body with all typography rules
- `.highlight-box` - Highlighted information boxes
- `.plant-card` / `.season-card` - Themed card boxes

---

## Reusable Component Classes

### Buttons
```html
<button class="btn-primary">Primary Action</button>
<button class="btn-secondary">Secondary Action</button>
<a href="#" class="back-button">← Back</a>
```

### Cards & Boxes
```html
<div class="article-card">
    <a href="#">Article Title</a>
</div>

<div class="highlight-box">Important information</div>
<div class="plant-card"><h3>Plant Name</h3></div>
<div class="season-card"><h3>Season</h3></div>
```

### Containers
```html
<div class="container">Full-width (max 1200px)</div>
<div class="container-narrow">Narrow width (max 700px)</div>
```

---

## Color System

All colors are defined as CSS variables for easy customization:

| Token | Value | Use Case |
|-------|-------|----------|
| `--color-hero-green` | #ebf6e8 | Hero backgrounds, accents |
| `--color-hero-cream` | #fbf7ec | Card backgrounds |
| `--color-hero-peach` | #fae2ca | Borders, highlights |
| `--color-button` | #5d6a3e | Primary buttons, links |
| `--color-text` | #000000 | All text content |
| `--color-hover` | #fde8a9 | Hover states |

---

## Responsive Breakpoints

Styles automatically adapt to screen size:

- **Desktop**: 1024px and above (default)
- **Tablet**: 768px - 1024px
- **Mobile**: 480px - 768px
- **Small Mobile**: Below 480px

All typography scales automatically. Test on multiple devices!

---

## Future Integration

As more pages are added to Rooted Vitality, update them to use these centralized files:

1. **Landing page** → Link to `styles.css`, include `injections.js`
2. **Admin pages** → Extend `injections.js` with admin utilities
3. **Practitioner dashboard** → Use same color system and typography
4. **Customer portal** → Reference CSS variables for consistency

---

## Best Practices

1. **Always use class names** instead of inline styles
2. **Use CSS variables** for colors and spacing
3. **Test on multiple breakpoints** before publishing
4. **Keep semantic HTML** for accessibility
5. **Let injections.js handle common functionality** (avoid code duplication)

---

## Support

For questions about styling or functionality, refer to the relevant file comments or contact the development team.

**Last Updated**: October 28, 2025
