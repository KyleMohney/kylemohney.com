<!--
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  Mobile & Responsive Scaling Guide                                 ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝
-->

# Universal Mobile Scaling Architecture

## Overview

All pages (index.html and all article pages) use a **centralized, universal mobile scaling system** defined in `/styles.css`. This eliminates the need to build responsive design on individual pages.

## Viewport Configuration

**All HTML pages include:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

This ensures:
- Proper width scaling on mobile devices
- Prevents zoom issues
- Enables responsive design media queries

## Global Mobile Enhancements

**HTML & Body (Universal):**
- `overflow-x: hidden` - Prevents horizontal scrolling on all devices
- `-webkit-text-size-adjust: 100%` - Prevents iOS automatic text sizing
- `-webkit-tap-highlight-color: transparent` - Removes tap highlight on mobile
- `-webkit-font-smoothing: antialiased` - Smooth fonts on mobile browsers

**Images (Universal):**
- `max-width: 100%` - Images scale down on smaller screens
- `height: auto` - Maintains aspect ratio
- `display: block` - Removes inline spacing issues

## Responsive Breakpoints

All scaling is handled universally in `styles.css` at three breakpoints:

### Desktop (1024px+)
- Full size typography
- Full container widths
- Standard spacing and padding
- Logo watermark at full opacity (0.08)

### Tablet (768px - 1024px)
```css
@media (max-width: 1024px)
```
- Reduced typography: h1 1.75rem, h2 1.3rem, h3 1.1rem
- Standard container padding
- Maintains full readability

### Mobile (480px - 768px)
```css
@media (max-width: 768px)
```
- HTML font-size: 15px (scales all rem-based sizes)
- Typography: h1 1.5rem, h2 1.2rem, h3 1rem, p 0.95rem
- Container-narrow: 95% width, 1.5rem vertical padding, 1rem horizontal
- Optimized button and card padding
- Reduced article content padding

### Small Mobile (<480px)
```css
@media (max-width: 480px)
```
- HTML font-size: 14px (further scales all dimensions)
- Typography: h1 1.25rem, h2 1.1rem, h3 0.95rem, p 0.9rem
- Container-narrow: 100% width, 1rem vertical padding, 0.75rem horizontal
- Reduced button and card padding
- Minimal article content margins
- Optimized list spacing

## Element Scaling

**Container Classes (Universal):**
- `.container`: Max 1200px, auto margins, responsive padding
- `.container-narrow`: Max 700px (95% on tablet, 100% on mobile)
  - Semi-transparent white background (0.85 opacity)
  - Shows logo watermark through transparency
  - Scales padding automatically per breakpoint

**Card Elements (Universal):**
- `.highlight-box`: 70% opacity background
- `.plant-card`, `.season-card`: 70% opacity background
- `.checklist-box`: 70% opacity background
- All cards scale padding automatically based on device

**Typography (Universal):**
- All headings and body text scale via media queries
- Font sizes use rem units (responsive to html font-size)
- Line heights adjusted for mobile readability

**Buttons & Links (Universal):**
- Padding and font-size scale at each breakpoint
- Minimum touch target: 44px (mobile standard)
- Proper spacing for finger tapping

## How It Works

1. **No Inline Styles**: Articles use only `<link rel="../styles.css">` - zero inline CSS
2. **Single Source of Truth**: `/styles.css` controls all responsive behavior
3. **Automatic Scaling**: Add any page with `container-narrow` and it scales perfectly
4. **Future-Proof**: Update media queries in one place, all pages benefit

## Example Usage

Any new article page automatically gets universal mobile scaling:

```html
<link rel="stylesheet" href="../styles.css">
<body>
    <div class="container-narrow">
        <!-- Content automatically scales based on breakpoint -->
    </div>
</body>
```

No additional responsive CSS needed!

## Testing Responsive Design

Test at these breakpoints:
- **Desktop**: 1200px+ (full experience)
- **Tablet**: 768-1024px (iPad, medium tablets)
- **Mobile**: 480-768px (iPhone, Android phones)
- **Small Mobile**: <480px (small phones, very narrow screens)

All pages scale smoothly across all breakpoints.

## Performance Notes

- Single 10.2KB stylesheet serves all pages
- No duplicate CSS in individual files
- Mobile users get optimized file sizes
- Reflow/repaint optimized via centralized media queries

## Accessibility

- Text remains readable at all sizes
- Touch targets minimum 44x44px on mobile
- No horizontal scroll on mobile devices
- Proper contrast maintained across themes
- Support for `prefers-reduced-motion` for animations

---

**Last Updated**: October 28, 2025  
**Maintained by**: Rooted Vitality Development Team
