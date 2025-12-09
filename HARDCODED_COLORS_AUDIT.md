# Hardcoded Colors Audit - Message Bubbles & Related Components

## Summary
Found **8 JavaScript files** with hardcoded colors in inline styles and embedded CSS. Key colors found: `#fbf7ec`, `#77883e`, `#333`, `#2a2622`, `#666`, `#999`, `#e0d5c7`.

---

## Detailed Findings

### 1. **rooted-vitality/scripts/unifiedMessagingSystem.js**

**Line 240** - Hardcoded colors in embedded CSS style tag:
```javascript
style.textContent = `
    /* Unified Messaging Styles */
    .messages-empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      min-height: 300px;
      background: linear-gradient(135deg, #fbf7ec 0%, #c3cfe2 100%);
      border-radius: 12px;
      padding: 2rem;
    }
```

**Line 254** - Hardcoded color in CSS:
```javascript
    .empty-state-title {
      font-size: 1.3rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
      color: #333;
    }
```

**Issue**: Message bubble styling uses embedded CSS with hardcoded colors for empty state, but message bubbles themselves use CSS variables (`var(--rooted-primary)`, `var(--message-own-text)`, etc.) - which is correct.

---

### 2. **rooted-vitality/dashboard/client/scripts/inbox-ui.js**

**Line 256** - Inline style with hardcoded color:
```javascript
item.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; width: 100%;">
      <div class="thread-avatar-small">
        ${logoUrl ? `<img src="${logoUrl}" alt="${escapeHtml(displayName)}" style="width: 100%; height: 100%; object-fit: cover;">` : `<span style="color: #fbf7ec; font-weight: 700; font-size: 0.95rem;">${initials}</span>`}
      </div>
```
**Problem**: `color: #fbf7ec` hardcoded in avatar initials span

**Line 261** - Hardcoded color in opportunity badge:
```javascript
${isOpportunity ? `<p class="thread-opportunity-badge" style="font-size: 0.75rem; color: #77883e; font-weight: 600; margin-top: 2px;">⭐ OPPORTUNITY</p>` : ''}
```
**Problem**: `color: #77883e` hardcoded

**Line 293** - Hardcoded colors in inline styles:
```javascript
<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #ede9e2;">
  <p style="margin: 0 0 8px 0; font-size: 0.9rem; color: #666;">Message from Practitioner:</p>
  <p style="margin: 0 0 12px 0; font-size: 0.9rem; color: #333; line-height: 1.4; font-style: italic;">"${escapeHtml(match.opportunity_message_text)}"</p>
```
**Problems**: 
- `border-top: 1px solid #ede9e2` 
- `color: #666` in label
- `color: #333` in message text

---

### 3. **rooted-vitality/dashboard/client/scripts/clientSettings.js**

**Line 580** - Inline style with hardcoded colors:
```javascript
const bgColor = type === 'success' ? '#77883e' : '#d4534f';
notification.style.cssText = `position: fixed; top: 100px; right: 20px; padding: 1rem 1.5rem; background: ${bgColor}; color: #fbf7ec; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000; font-weight: 500; animation: slideIn 0.3s ease;`;
```
**Problems**: 
- `background: #77883e` (success color, hardcoded)
- `color: #fbf7ec` (hardcoded)

**Line 777** - Inline style for in-app notification:
```javascript
notifEl.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #77883e; color: #fbf7ec; padding: 1rem 1.5rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); z-index: 10000; max-width: 400px; animation: slideIn 0.3s ease-out;';
```
**Problems**: 
- `background: #77883e` (hardcoded)
- `color: #fbf7ec` (hardcoded)

---

### 4. **rooted-vitality/dashboard/client/scripts/my-wellness-ui.js**

**Line 216** - Inline style with hardcoded color:
```javascript
notificationDiv.style.cssText = `
  position: fixed;
  top: 20px;
  right: 20px;
  background: #fbf7ec;
  border-left: 4px solid #4CAF50;
  padding: 16px 20px;
  border-radius: 6px;
  ...
`;
```
**Problem**: `background: #fbf7ec` hardcoded

**Line 503** - Inline style with hardcoded color:
```javascript
${logoUrl ? `<img src="${logoUrl}" alt="${escapeHtml(displayName)}" style="width: 100%; height: 100%; object-fit: cover;">` : `<span style="color: #fbf7ec; font-weight: 700; font-size: 0.95rem;">${initials}</span>`}
```
**Problem**: `color: #fbf7ec` hardcoded in avatar initials

---

### 5. **rooted-vitality/dashboard/public/scripts/onboardingUI.js**

**Line 1413** - Inline style with hardcoded colors:
```javascript
background: linear-gradient(135deg, #fbf7ec 0%, #f5f0e6 100%);
```
**Problems**: `#fbf7ec` and `#f5f0e6` hardcoded in gradient

**Line 1485** - Inline style with hardcoded color:
```javascript
<div class="subcategory-card" style="
    padding: 12px 16px;
    border: 1px solid #e0d5c7;
    border-radius: 8px;
    margin-bottom: 12px;
    background: #fbf7ec;
    transition: all 0.2s ease;
    cursor: pointer;
" onmouseover="this.style.borderColor='#77883e'; this.style.backgroundColor='#f5f0e6'; this.style.boxShadow='0 2px 8px rgba(119,136,62,0.1)'" onmouseout="this.style.borderColor='#e0d5c7'; this.style.backgroundColor='#fbf7ec'; this.style.boxShadow='none'">
```
**Problems**: 
- `border: 1px solid #e0d5c7` (hardcoded)
- `background: #fbf7ec` (hardcoded)
- Inline `onmouseover`/`onmouseout` event handlers modifying styles:
  - `this.style.borderColor='#77883e'`
  - `this.style.backgroundColor='#f5f0e6'`
  - `this.style.backgroundColor='#fbf7ec'`
  - `this.style.borderColor='#e0d5c7'`

---

### 6. **rooted-vitality/dashboard/public/scripts/onboardingService.js**

**Line 119** - Inline style with hardcoded colors:
```javascript
<button id="login-error-retry-btn" class="btn-modal btn-modal-primary" style="background: #77883e; color: #fbf7ec; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;">
    Try Again
</button>
```
**Problems**: 
- `background: #77883e` (hardcoded)
- `color: #fbf7ec` (hardcoded)

---

## Summary Table

| File | Line | Color | Type | Context |
|------|------|-------|------|---------|
| unifiedMessagingSystem.js | 240 | `#fbf7ec`, `#c3cfe2` | CSS in JS | Empty state gradient |
| unifiedMessagingSystem.js | 254 | `#333` | CSS in JS | Empty state title |
| inbox-ui.js | 256 | `#fbf7ec` | Inline style | Avatar initials text |
| inbox-ui.js | 261 | `#77883e` | Inline style | Opportunity badge |
| inbox-ui.js | 293-294 | `#ede9e2`, `#666`, `#333` | Inline style | Message container borders & text |
| clientSettings.js | 580 | `#77883e`, `#fbf7ec` | cssText | Notification success/error |
| clientSettings.js | 777 | `#77883e`, `#fbf7ec` | cssText | In-app notification toast |
| my-wellness-ui.js | 216 | `#fbf7ec` | cssText | Notification background |
| my-wellness-ui.js | 503 | `#fbf7ec` | Inline style | Avatar initials text |
| onboardingUI.js | 1413 | `#fbf7ec`, `#f5f0e6` | Inline style | Category card gradient |
| onboardingUI.js | 1485-1488 | `#fbf7ec`, `#77883e`, `#e0d5c7`, `#f5f0e6` | Inline + onmouseover/out | Subcategory card with hover effects |
| onboardingService.js | 119 | `#77883e`, `#fbf7ec` | Inline style | Login error retry button |

---

## Recommendations

1. **Extract embedded CSS**: Move CSS from `unifiedMessagingSystem.js` line 230+ to a separate CSS file
2. **Replace inline styles with CSS variables**: Use `var(--rooted-light)`, `var(--rooted-primary)`, etc.
3. **Remove inline event handlers**: Convert `onmouseover`/`onmouseout` to CSS `:hover` states
4. **Centralize color definitions**: All colors should reference CSS custom properties defined in `base.css` or `dark-mode.css`
5. **Update notification styling**: Use CSS variables for notification backgrounds/text colors
6. **No direct `style=` attributes**: All styling should be class-based or use CSS variables

---

## Most Critical Issues

**High Priority** (Used in multiple files, multiple times):
- `#fbf7ec` - 8+ occurrences (light background)
- `#77883e` - 5+ occurrences (primary color)
- `#333` - 3+ occurrences (dark text)

**Medium Priority** (Single occurrences but direct style manipulation):
- Inline event handlers with `this.style.` manipulation (onboardingUI.js line 1488)
- cssText style assignments (clientSettings.js)
