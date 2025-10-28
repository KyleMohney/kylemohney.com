<!--
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: BRAND_STANDARDS.md                                          ║
║  Purpose: Complete Branding and Style Reference                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝
-->

# Rooted Vitality — Brand Standards & Guidelines

## Overview

Rooted Vitality is a holistic wellness platform connecting people with practitioners. Our visual identity reflects our values: nature, wellness, authenticity, and modern accessibility.

## Color Palette

### Primary Colors

| Color | Hex Value | Usage |
|-------|-----------|-------|
| Dark Sage (Primary) | `#5d6a3e` | Buttons, links, headings, CTAs |
| Pure Black | `#000000` | All body text, primary content |
| White | `#ffffff` | Backgrounds, card surfaces |

### Hero Background Colors

| Color | Hex Value | Usage |
|-------|-----------|-------|
| Hero Green | `#ebf6e8` | Featured content backgrounds, accents |
| Hero Cream | `#fbf7ec` | Card backgrounds, secondary sections |
| Hero Peach | `#fae2ca` | Tertiary backgrounds, highlight borders |

### Interactive States

| Color | Hex Value | Usage |
|-------|-----------|-------|
| Hover Yellow | `#fde8a9` | Hover states, active indicators |
| Text Muted | `#888888` | Secondary text, metadata, captions |
| Text Light | `#333333` | Disabled states, light text |

### Color Rules

1. **Always use pure black (#000000) for body text** - Never gray, never colored
2. **Hero colors are backgrounds, not text** - Use them for sections, never for text
3. **Dark sage (#5d6a3e) is for interactive elements** - Buttons, links, headings
4. **Maintain high contrast** - All text on colored backgrounds must be readable

---

## Typography

### Font Families

**Headings**: Inter (100% bold weight)
- Modern, clean, professional
- All h1, h2, h3 use this
- Always 700 weight

**Body**: Lora (100% regular weight)
- Elegant, readable serif
- All paragraphs and body content
- Always 400 weight

### Font Sizes

| Element | Size | Line Height | Weight |
|---------|------|-------------|--------|
| h1 | 2rem | 1.2 | Bold (700) |
| h2 | 1.5rem | 1.3 | Bold (700) |
| h3 | 1.2rem | 1.4 | Bold (700) |
| body/p | 1rem | 1.6-1.8 | Regular (400) |
| small/meta | 0.9rem | 1.4 | Regular (400) |

### Responsive Typography

Fonts automatically scale:
- **Desktop (1024px+)**: Full size
- **Tablet (768px-1024px)**: 95% of full
- **Mobile (480px-768px)**: 85% of full
- **Small Mobile (<480px)**: 75% of full

---

## Components & Patterns

### Buttons

**Primary Button**
- Background: Dark Sage (#5d6a3e)
- Text: White
- Padding: 0.8rem 1.5rem
- Border Radius: 8px
- Hover: Black background

**Secondary Button**
- Background: White
- Border: 2px Dark Sage
- Text: Dark Sage
- Padding: 0.8rem 1.5rem
- Hover: Dark Sage background + white text

**CTA Link**
- Color: Dark Sage
- Decoration: None
- Hover: Underline or darker shade

### Cards

**Article Card**
- Background: White
- Border Radius: 8px
- Shadow: Light (0 2px 12px rgba(0,0,0,0.08))
- Padding: 1rem
- Hover: Slight lift effect + medium shadow

**Information Box** (.highlight-box)
- Background: Hero Green at 50% opacity
- Border Left: 4px Hero Green
- Padding: 1rem 1.2rem
- Border Radius: 8px
- Font Style: Italic

**Plant/Season Card** (.plant-card / .season-card)
- Background: Hero Cream
- Border Left: 4px Hero Peach
- Padding: 1.2rem
- Border Radius: 8px
- Heading: Dark Sage color

### Spacing

| Token | Size | Usage |
|-------|------|-------|
| xs | 0.5rem | Small gaps, tight spacing |
| sm | 1rem | Standard paragraph margins |
| md | 1.5rem | Section spacing |
| lg | 2rem | Major section breaks |
| xl | 3rem | Page margins (rare) |

### Border Radius

- Small: 8px (buttons, small cards)
- Medium: 12px (larger cards, content boxes)
- Large: 16px (major containers, rare)

---

## Layout Rules

### Container Sizes

- **Full Width**: 1200px max-width (pages with grids)
- **Narrow Width**: 700px max-width (article pages)
- **Gutter**: 1rem on all sides (mobile: 0.75rem)

### Grid System

- **Desktop**: 2 or 3 columns (depends on content)
- **Tablet**: 2 columns stacked
- **Mobile**: 1 column, full width
- **Gaps**: 1.5rem between items

### Responsive Breakpoints

```css
Desktop:       1024px and above
Tablet:        768px - 1024px
Mobile:        480px - 768px
Small Mobile:  Below 480px
```

---

## Image Guidelines

### Hero Images

- **Aspect Ratio**: Full-width fills
- **Sizing**: 100% width, fixed height (300px+ mobile, 400px+ desktop)
- **Format**: PNG or high-quality JPG
- **Optimization**: Compress to <500KB when possible

### Logo Watermark

- **File**: `logo_large.png`
- **Size**: 1600x1600px
- **Opacity**: 8% (fixed position background)
- **Position**: Center of page, fixed layer
- **z-index**: 0 (behind all content)

### Favicons & Assets

Keep all images in `/assets/` folder:
- `logo.png` - Primary logo
- `logo_large.png` - Watermark
- `hero1.png` - Hero image 1
- `hero2.png` - Hero image 2

---

## Writing Guidelines

### Tone & Voice

- **Professional yet approachable** - Knowledgeable but not distant
- **Inclusive language** - Welcoming to all backgrounds
- **Clear and direct** - Avoid jargon where possible
- **Authentic** - Reflect genuine commitment to wellness

### Article Structure

1. **Short intro** - 1-2 sentences setting up the topic
2. **Clear headings** - Use h2 for major sections, h3 for subsections
3. **Short paragraphs** - 3-4 sentences max
4. **Highlight key points** - Use highlight boxes for important info
5. **Call to action** - End with next steps or practitioner referral

### Avoiding Medical Claims

- ✅ "Traditionally used for..."
- ✅ "Supports wellness..."
- ✅ "May help with..."
- ❌ "Treats disease..."
- ❌ "Cures condition..."
- ❌ "Replaces medical care..."

---

## Accessibility Standards

### Color Contrast

- Text on backgrounds must meet WCAG AA standards
- Dark Sage on White: ✅ 8.4:1 (exceeds AA)
- Black on Hero Green: ✅ 11.3:1 (exceeds AA)

### Font Sizes

- Minimum 16px for body text (mobile)
- Minimum 14px for secondary text
- Never smaller than 12px

### Interactive Elements

- All buttons/links have visible focus states
- Keyboard navigation fully supported
- Links clearly indicate they're clickable

### Motion

- Provides `prefers-reduced-motion` support
- Animations limited to 0.3s transitions
- No auto-playing videos

---

## Development Standards

### File Organization

```
Rooted Vitality/
├── index.html (main help center)
├── assets/
│   ├── styles.css (all styles)
│   ├── injections.js (utilities)
│   ├── logo.png
│   ├── logo_large.png
│   ├── hero1.png
│   └── hero2.png
├── articles/
│   ├── holistic-medicine-explained.html
│   ├── healing-plants-home.html
│   └── [more articles...]
├── docs/ (internal)
└── help/ (alternative pages)
```

### CSS Classes

**Always use** the centralized `styles.css` classes:
- `.container` / `.container-narrow`
- `.back-button` / `.btn-primary` / `.btn-secondary`
- `.article-header` / `.article-title` / `.article-meta`
- `.article-content`
- `.highlight-box` / `.plant-card` / `.season-card`

**Never write** inline styles. Use CSS classes instead.

### HTML Structure

- Semantic HTML (h1, h2, p, ul, li, etc.)
- Proper heading hierarchy (no skipping levels)
- Alt text on all images
- Descriptive link text (not "click here")

---

## Deployment Checklist

Before launching new pages:

- [ ] All colors match brand palette exactly
- [ ] Typography uses Inter (headings) + Lora (body)
- [ ] All text is pure black (#000000)
- [ ] Images optimized and compressed
- [ ] Logo watermark set to 8% opacity
- [ ] Responsive design tested at 4 breakpoints
- [ ] Mobile tested on actual devices (not just browser)
- [ ] No horizontal scrolling on any screen size
- [ ] All links work and go to correct destinations
- [ ] Accessibility features working (keyboard nav, focus states)
- [ ] Loading time under 3 seconds
- [ ] SEO tags populated (meta descriptions, titles)

---

## Quick Reference

### For New Pages

1. Link `assets/styles.css` in head
2. Link `assets/injections.js` before closing body
3. Use `.container` or `.container-narrow`
4. Use predefined classes (never inline styles)
5. Use only brand colors from this guide
6. Test at all 4 responsive breakpoints

### For Bug Fixes

1. Check CSS variables in `:root`
2. Look for conflicting inline styles
3. Verify element uses correct class name
4. Test on mobile (most issues appear there)
5. Check z-index if visibility is wrong

### For Design Changes

1. Update CSS variables in `assets/styles.css`
2. Changes apply to entire site automatically
3. Test thoroughly across all pages
4. Update this guide to reflect changes

---

## Support Resources

- **Styles Reference**: `assets/README.md`
- **Migration Guide**: `MIGRATION_GUIDE.md` (how to update pages)
- **Main Help Center**: `index.html`

**Last Updated**: October 28, 2025
**Maintained By**: Rooted Vitality Development Team
