# Quick Reference: Hardcoded Colors in JavaScript

## At a Glance

### Files with Hardcoded Colors (6 total)

| # | File | Lines | Color Count | Severity | Type |
|---|------|-------|-------------|----------|------|
| 1 | `unifiedMessagingSystem.js` | 240, 254, 350 | 4 colors | 🟡 Medium | CSS-in-JS |
| 2 | `inbox-ui.js` | 256, 261, 293-295 | 5 colors | 🔴 High | Inline styles |
| 3 | `clientSettings.js` | 580, 777 | 3 colors | 🔴 High | cssText |
| 4 | `my-wellness-ui.js` | 216, 503 | 3 colors | 🟡 Medium | cssText + inline |
| 5 | `onboardingUI.js` | 1413-1416, 1485-1488 | 6+ colors | 🔴 CRITICAL | Inline + event handlers |
| 6 | `onboardingService.js` | 119 | 2 colors | 🟡 Medium | Inline styles |

---

## Critical Issues to Fix First

### 🔴 CRITICAL: onboardingUI.js Line 1485-1488
- **Issue**: Inline event handlers (`onmouseover`, `onmouseout`) with hardcoded colors
- **Colors**: `#77883e`, `#fbf7ec`, `#e0d5c7`, `#f5f0e6`
- **Solution**: Convert to CSS `:hover` pseudo-class

### 🔴 HIGH: inbox-ui.js Lines 256, 261, 293-295
- **Issue**: Multiple inline styles for message-related UI
- **Colors**: `#fbf7ec`, `#77883e`, `#666`, `#333`, `#ede9e2`
- **Solution**: Extract to CSS classes or use CSS variables

### 🔴 HIGH: clientSettings.js Lines 580, 777
- **Issue**: Dynamic cssText assignments with hardcoded colors
- **Colors**: `#77883e`, `#fbf7ec`, `#d4534f`
- **Solution**: Use CSS variables in template literals

---

## Color Legend

```
#fbf7ec  = Light cream/off-white          → var(--rooted-light)
#77883e  = Primary green                   → var(--rooted-primary)
#333     = Dark text                       → var(--text-primary)
#2a2622  = Dark background                → var(--card-bg-primary)
#666     = Medium gray                     → var(--text-secondary)
#999     = Light gray                      → var(--text-tertiary)
#ede9e2  = Very light border               → var(--border-light)
#e0d5c7  = Medium border                   → var(--border-medium)
#f5f0e6  = Hover light bg                  → var(--rooted-light-hover)
#c3cfe2  = Blue secondary                  → var(--rooted-secondary-light)
#d4534f  = Error red                       → var(--color-error)
#4CAF50  = Success green                   → var(--color-success)
```

---

## Quick Fix Checklist

### Step 1: Verify CSS Variables Exist
- [ ] `--rooted-light` exists in `base.css` or `dark-mode.css`
- [ ] `--rooted-primary` exists
- [ ] `--text-primary`, `--text-secondary`, `--text-tertiary` exist
- [ ] `--border-light`, `--border-medium` exist
- [ ] `--color-error`, `--color-success` exist

### Step 2: Fix onboardingUI.js (CRITICAL)
- [ ] Convert onmouseover/onmouseout to CSS `:hover`
- [ ] Replace all 6+ hardcoded colors with variables
- [ ] Test hover states work correctly

### Step 3: Fix clientSettings.js (HIGH)
- [ ] Replace `#77883e` → `var(--rooted-primary)`
- [ ] Replace `#fbf7ec` → `var(--rooted-light)`
- [ ] Replace `#d4534f` → `var(--color-error)`

### Step 4: Fix inbox-ui.js (HIGH)
- [ ] Replace `#fbf7ec` in avatar span
- [ ] Replace `#77883e` in opportunity badge
- [ ] Extract message context box styles to CSS

### Step 5: Fix remaining files
- [ ] my-wellness-ui.js (2 locations)
- [ ] onboardingService.js (1 location)
- [ ] unifiedMessagingSystem.js (3 locations)

---

## Impact Analysis

### Message Bubble Components Affected
- ✅ `message-group--sent` - Using CSS variables (GOOD)
- ✅ `message-group--received` - Using CSS variables (GOOD)
- ⚠️ Empty state styling - Has hardcoded colors (NEEDS FIX)
- ⚠️ Avatar initials - Using hardcoded colors (NEEDS FIX)
- ⚠️ Opportunity badges - Using hardcoded colors (NEEDS FIX)

### Dark Mode Compatibility
- **Current state**: Message bubbles properly use CSS variables
- **Problem areas**: Helper components around messages use hardcoded colors
- **Risk**: Dark mode toggle won't affect these helper elements until fixed

---

## Code Examples

### ❌ BAD (Current)
```javascript
// In inbox-ui.js
<span style="color: #fbf7ec; font-weight: 700;">initials</span>

// In clientSettings.js
notification.style.cssText = `background: ${bgColor}; color: #fbf7ec;`;

// In onboardingUI.js
onmouseover="this.style.borderColor='#77883e'; this.style.backgroundColor='#f5f0e6';"
```

### ✅ GOOD (Target)
```javascript
// Use CSS variables
<span style="color: var(--rooted-light); font-weight: 700;">initials</span>

// Use variables in cssText
notification.style.cssText = `background: ${bgColor}; color: var(--rooted-light);`;

// Use CSS :hover instead of inline events
.subcategory-card:hover {
  border-color: var(--rooted-primary);
  background: var(--rooted-light-hover);
}
```

---

## Testing Plan

1. **Light Mode**: Verify all colors display correctly
2. **Dark Mode**: Toggle dark mode and verify:
   - Avatar initials remain visible
   - Opportunity badges readable
   - Message contexts have proper borders
   - Notifications have good contrast
3. **Hover States**: Test all interactive elements (onboardingUI.js cards)
4. **Message Thread**: Verify sent/received bubbles maintain proper contrast

---

## Files to Review

- [ ] `rooted-vitality/styles/base.css` - Verify CSS variable definitions
- [ ] `rooted-vitality/styles/dark-mode.css` - Verify dark mode overrides
- [ ] `rooted-vitality/dashboard/pro/styles/inbox.css` - Check message styling
- [ ] `rooted-vitality/dashboard/public/styles/` - Check onboarding styles

