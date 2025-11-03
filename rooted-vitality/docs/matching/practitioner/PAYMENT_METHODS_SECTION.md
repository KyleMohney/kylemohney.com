# Payment Methods Section - Practitioner Profile

## Overview
Added a new "Payment Methods" section to the practitioner profile page (`/dashboard/pro/profile.html`) that allows practitioners to specify payment methods they accept and whether they accept insurance.

## Implementation Details

### HTML Structure (`profile.html`)
- **Location**: Lines 262-307 (between FAQ and Background Check sections)
- **Data Section**: `data-section="payment"` for consistent save/load handling
- **Components**:
  1. **Section Header**: Title + Save button
  2. **Section Tooltip**: Educational message explaining the importance of payment info
  3. **Insurance Checkbox**: Yes/no toggle for accepting insurance
  4. **Payment Methods Textarea**: Free-form text input for listing accepted payment methods
  5. **Pro Tip**: Green-highlighted tip box encouraging specific payment details

### CSS Styling (`styles/profile.css`)
- **New Classes**:
  - `.payment-types-container` - Main flex container with vertical layout
  - `.payment-checkbox-group` - Groups checkbox with hint text
  - `.payment-checkbox-label` - Styled label with checkbox alignment
  - `.payment-checkbox-hint` - Gray hint text below checkbox
  - `.payment-methods-field` - Field group for textarea
  - `.payment-methods-textarea` - Textarea with green focus state matching primary theme
  - `.payment-methods-hint` - Descriptive text below label
  - `.payment-methods-example` - Green-highlighted pro tip box with left border
  
- **Mobile Responsive**: Adjusted spacing and font sizes for screens ≤640px

### JavaScript Functionality (`proProfile.js`)

#### Save Handler (lines 913-914)
```javascript
} else if (sectionId === 'payment') {
    practitionerData.payment_methods = document.getElementById('payment-methods')?.value || '';
    practitionerData.accepts_insurance = document.getElementById('accepts-insurance')?.checked || false;
}
```
- Collects textarea value and checkbox status
- Sends to Supabase practitioners table

#### Load Handler (lines 308-319)
```javascript
// Payment information - from practitioners table
if (data.payment_methods) {
    document.getElementById('payment-methods').value = data.payment_methods;
}

if (data.accepts_insurance !== null && data.accepts_insurance !== undefined) {
    document.getElementById('accepts-insurance').checked = data.accepts_insurance;
}
```
- Populates form fields from database on page load
- Preserves data across sessions

### Database Fields Required
To store payment information, add these columns to the `practitioners` table:

```sql
ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS payment_methods TEXT;
ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS accepts_insurance BOOLEAN DEFAULT FALSE;
```

## Features

✅ **Checkbox for Insurance Acceptance**
- Clear boolean toggle
- Helpful hint explaining purpose
- Proper alignment and sizing

✅ **Open-Ended Payment Methods Input**
- Textarea allows practitioners to list any payment methods
- Placeholder example shows expected format
- Pro tip encourages specificity

✅ **Consistent Section Pattern**
- Follows existing profile section structure
- Uses same save/load infrastructure
- Integrates with auto-save system
- Will be included in profile completeness meter

✅ **Professional Styling**
- Green focus state matches primary theme
- Green pro-tip box with left border accent
- Mobile-responsive with proper spacing
- Clear visual hierarchy

## User Experience

### For Practitioners:
1. Open Profile page
2. Navigate to "Payment Methods" section
3. Check "I accept insurance" if applicable
4. Enter payment methods accepted (e.g., "Credit cards, PayPal, Venmo, Cash")
5. Click "Save" button
6. Data persists to database and loads on next visit

### Messaging:
- **Section Tooltip**: "Tell clients what payment methods you accept. This builds confidence and reduces friction during booking."
- **Insurance Hint**: "Check if you bill clients' insurance plans directly"
- **Payment Hint**: "Type the payment methods you accept. Examples: Credit cards, PayPal, Venmo, Cash, Check, FSA/HSA, etc."
- **Pro Tip**: "Tip: Be specific about which payment apps or card types you accept. More options = more bookings."

## Technical Notes

- Section uses existing `.section-save-btn` and `.section-edit-field` classes for consistency
- Data persistence handled by `saveSectionData()` function in proProfile.js
- No additional JavaScript event listeners needed (covered by existing save button handler)
- Mobile breakpoint: 640px for responsive adjustments
- Insurance boolean stored as checkbox `checked` property

## Future Enhancements

- Add payment processing integration (Stripe, Square)
- Track payment method analytics
- Show payment method options in client-facing booking flow
- Add automatic insurance verification workflow
- Payment terms/policies field

## Files Modified

1. **`/dashboard/pro/profile.html`** (Lines 262-307)
   - Added payment section HTML

2. **`/styles/profile.css`** (Added ~125 lines of CSS)
   - Added `.payment-types-container` and related classes
   - Added mobile responsive styles

3. **`/scripts/proProfile.js`**
   - Added save handler (2 lines in saveSectionData function)
   - Added load handler (8 lines in populateProfileFields function)
   - Total addition: ~10 lines of code

## Testing Checklist

- [ ] Section displays correctly between FAQ and Background Check
- [ ] Checkbox toggles properly
- [ ] Textarea accepts text input
- [ ] Save button is clickable
- [ ] Data persists after page refresh
- [ ] Mobile layout looks good on small screens
- [ ] Focus states show green highlight
- [ ] Pro tip box displays correctly
- [ ] All text content is readable
