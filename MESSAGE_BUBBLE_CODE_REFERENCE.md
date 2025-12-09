# Message Bubble & Related Components - Code Reference

## CRITICAL FINDINGS - INLINE STYLES WITH HARDCODED COLORS

### FILE 1: rooted-vitality/scripts/unifiedMessagingSystem.js
**Type**: CSS-in-JS embedded in style tag

#### Line 240 - Empty State Gradient (HARDCODED COLORS)
```javascript
background: linear-gradient(135deg, #fbf7ec 0%, #c3cfe2 100%);
```
- `#fbf7ec` should be → `var(--rooted-light)`
- `#c3cfe2` should be → CSS variable or `var(--rooted-secondary-light)`

#### Line 254 - Empty State Title (HARDCODED COLOR)
```javascript
color: #333;
```
- Should be → `var(--text-primary)` or `var(--rooted-dark)`

#### Lines 282-350 - Message Bubble Styles (MIXED USAGE)
✅ **CORRECT**: Uses CSS variables
```javascript
.message-group--sent .message-bubble {
  background: linear-gradient(135deg, var(--rooted-primary) 0%, var(--rooted-primary-dark) 100%);
  color: var(--message-own-text);
}

.message-group--received .message-bubble {
  background: var(--message-other-bg);
  color: var(--message-other-text);
}
```

❌ **ISSUE**: Line 350 has a typo/artifact:
```javascript
#fbf7ec-space: pre-wrap;  /* This should be 'white-space' not '#fbf7ec-space' */
```

---

### FILE 2: rooted-vitality/dashboard/client/scripts/inbox-ui.js
**Type**: Inline styles in HTML template strings

#### Line 256 - Avatar Initials (HARDCODED COLOR)
```javascript
<span style="color: #fbf7ec; font-weight: 700; font-size: 0.95rem;">${initials}</span>
```
- `color: #fbf7ec` should be → `color: var(--rooted-light)` or `color: var(--text-on-primary)`

#### Line 261 - Opportunity Badge (HARDCODED COLOR)
```javascript
<p class="thread-opportunity-badge" style="font-size: 0.75rem; color: #77883e; font-weight: 600; margin-top: 2px;">⭐ OPPORTUNITY</p>
```
- `color: #77883e` should be → `color: var(--rooted-primary)`

#### Lines 292-295 - Message Context Box (MULTIPLE HARDCODED COLORS)
```javascript
<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #ede9e2;">
  <p style="margin: 0 0 8px 0; font-size: 0.9rem; color: #666;">Message from Practitioner:</p>
  <p style="margin: 0 0 12px 0; font-size: 0.9rem; color: #333; line-height: 1.4; font-style: italic;">"${escapeHtml(match.opportunity_message_text)}"</p>
  <div style="display: flex; gap: 8px;">
```
- `border-top: 1px solid #ede9e2` → `border-top: 1px solid var(--border-light)`
- `color: #666` → `color: var(--text-secondary)`
- `color: #333` → `color: var(--text-primary)` or `var(--rooted-dark)`

---

### FILE 3: rooted-vitality/dashboard/client/scripts/clientSettings.js
**Type**: Dynamic cssText style assignments

#### Line 580 - Notification Toast (HARDCODED COLORS)
```javascript
const bgColor = type === 'success' ? '#77883e' : '#d4534f';
notification.style.cssText = `position: fixed; top: 100px; right: 20px; padding: 1rem 1.5rem; background: ${bgColor}; color: #fbf7ec; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000; font-weight: 500; animation: slideIn 0.3s ease;`;
```
**Problems**:
- `#77883e` (success) → `var(--rooted-primary)` or `var(--color-success)`
- `#d4534f` (error) → `var(--color-error)`
- `#fbf7ec` → `var(--rooted-light)` or `var(--text-on-primary)`

#### Line 777 - In-App Notification (HARDCODED COLORS)
```javascript
notifEl.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #77883e; color: #fbf7ec; padding: 1rem 1.5rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); z-index: 10000; max-width: 400px; animation: slideIn 0.3s ease-out;';
```
**Problems**:
- `background: #77883e` → `background: var(--rooted-primary)`
- `color: #fbf7ec` → `color: var(--rooted-light)`

---

### FILE 4: rooted-vitality/dashboard/client/scripts/my-wellness-ui.js
**Type**: Inline styles in template strings and cssText

#### Line 216 - Notification Toast (HARDCODED COLOR)
```javascript
notificationDiv.style.cssText = `
  position: fixed;
  top: 20px;
  right: 20px;
  background: #fbf7ec;
  border-left: 4px solid #4CAF50;
  padding: 16px 20px;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 10000;
  font-size: 14px;
  max-width: 350px;
  animation: slideIn 0.3s ease-out;
`;
```
**Problems**:
- `background: #fbf7ec` → `background: var(--rooted-light)`
- `border-left: 4px solid #4CAF50` → `border-left: 4px solid var(--color-success)` (keep green for success indicator)

#### Line 503 - Avatar Initials (HARDCODED COLOR)
```javascript
<span style="color: #fbf7ec; font-weight: 700; font-size: 0.95rem;">${initials}</span>
```
- `color: #fbf7ec` → `color: var(--rooted-light)` or `color: var(--text-on-primary)`

---

### FILE 5: rooted-vitality/dashboard/public/scripts/onboardingUI.js
**Type**: Inline styles + inline event handlers

#### Line 1413-1416 - Category Card Gradient (HARDCODED COLORS)
```javascript
style="
  border: 2px solid #e0d5c7;
  border-radius: 12px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #fbf7ec 0%, #f5f0e6 100%);
  transition: all 0.3s ease;
  cursor: pointer;
"
```
**Problems**:
- `border: 2px solid #e0d5c7` → `border: 2px solid var(--border-light)`
- `background: linear-gradient(135deg, #fbf7ec 0%, #f5f0e6 100%)` → gradient with CSS variables

#### Line 1417-1422 - Category Card Heading (HARDCODED COLORS)
```javascript
style="
  margin: 0 0 8px 0;
  color: #77883e;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.5px;
"
```
- `color: #77883e` → `color: var(--rooted-primary)`

#### Lines 1485-1488 - Subcategory Card with Inline Event Handlers (CRITICAL ISSUE)
```html
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
**CRITICAL PROBLEMS**:
1. **Inline event handlers** - Should use CSS `:hover` state instead
2. **Hardcoded colors in HTML attributes**:
   - `border: 1px solid #e0d5c7` → `border: 1px solid var(--border-light)`
   - `background: #fbf7ec` → `background: var(--rooted-light)`
3. **Hardcoded colors in event handlers**:
   - `this.style.borderColor='#77883e'` → CSS variable needed
   - `this.style.backgroundColor='#f5f0e6'` → CSS variable needed
   - `this.style.backgroundColor='#fbf7ec'` → CSS variable needed
   - `this.style.borderColor='#e0d5c7'` → CSS variable needed

**Recommended Fix**: Convert to CSS with `:hover` pseudo-class
```css
.subcategory-card {
  padding: 12px 16px;
  border: 1px solid var(--border-light);
  border-radius: 8px;
  margin-bottom: 12px;
  background: var(--rooted-light);
  transition: all 0.2s ease;
  cursor: pointer;
}

.subcategory-card:hover {
  border-color: var(--rooted-primary);
  background: var(--rooted-light-hover);
  box-shadow: 0 2px 8px rgba(119,136,62,0.1);
}
```

---

### FILE 6: rooted-vitality/dashboard/public/scripts/onboardingService.js
**Type**: Inline styles in HTML template strings

#### Line 119 - Login Error Button (HARDCODED COLORS)
```html
<button id="login-error-retry-btn" class="btn-modal btn-modal-primary" style="background: #77883e; color: #fbf7ec; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;">
  Try Again
</button>
```
**Problems**:
- `background: #77883e` → `background: var(--rooted-primary)`
- `color: #fbf7ec` → `color: var(--rooted-light)` or `color: var(--text-on-primary)`

---

## SUMMARY: COLOR MAPPINGS NEEDED

### Colors Found & Their Likely CSS Variable Equivalents:

| Hardcoded Color | Current Use | Should Map To |
|---|---|---|
| `#fbf7ec` | Light backgrounds, text on dark | `var(--rooted-light)` or `var(--text-on-primary)` |
| `#77883e` | Primary color (buttons, badges) | `var(--rooted-primary)` |
| `#333` | Dark text | `var(--text-primary)` or `var(--rooted-dark)` |
| `#2a2622` | Dark backgrounds | `var(--card-bg-primary)` or existing variable |
| `#666` | Medium text | `var(--text-secondary)` |
| `#999` | Light text | `var(--text-tertiary)` |
| `#ede9e2` | Light borders | `var(--border-light)` |
| `#e0d5c7` | Medium borders | `var(--border-medium)` |
| `#f5f0e6` | Very light bg (hover state) | `var(--rooted-light-hover)` or similar |
| `#c3cfe2` | Blue accent (gradient) | `var(--rooted-secondary-light)` |

---

## FILES AFFECTED (In Order of Priority)

1. **onboardingUI.js** - Line 1485-1488 (inline event handlers with hardcoded colors) ⚠️ CRITICAL
2. **clientSettings.js** - Lines 580, 777 (cssText assignments with hardcoded colors)
3. **inbox-ui.js** - Lines 256, 261, 292-295 (multiple inline styles)
4. **my-wellness-ui.js** - Lines 216, 503 (cssText and inline styles)
5. **onboardingService.js** - Line 119 (inline styles)
6. **unifiedMessagingSystem.js** - Lines 240, 254, 350 (embedded CSS with hardcoded colors)

