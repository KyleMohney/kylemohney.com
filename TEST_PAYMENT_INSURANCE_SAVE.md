# Payment & Insurance Save Flow Test

## What We Fixed

1. ✅ Added `custom_insurance_providers` textarea with `onchange` listener
2. ✅ Added `custom_payment_methods` textarea (was missing completely)
3. ✅ CSS fixes for padding (max-height, margin-bottom)
4. ✅ Added loading of custom fields in `populateProfileFields()`
5. ✅ Verified database schema has all required fields
6. ✅ Verified RLS policies allow updates to these fields

## Complete Data Flow

```
USER ACTION (Check checkbox or type text)
    ↓
onchange="debounceAutoSave('more-details')" fires
    ↓
Waits 1000ms for more changes (debounce)
    ↓
saveSectionData('more-details') called
    ↓
saveMoreDetailsSection() called
    ↓
getPaymentCheckboxValues() collects:
  - insurance_providers (array of checked boxes)
  - custom_insurance_providers (textarea value)
  - payment_methods (array of checked boxes)
  - custom_payment_methods (textarea value)
    ↓
safePractitionerUpdate(updateData) sends to database
    ↓
Supabase updates practitioners table
    ↓
Database returns result
    ↓
populateProfileFields(result) loads data on next page load
    ↓
Loads checkboxes from insurance_providers and payment_methods arrays
Loads textareas from custom_insurance_providers and custom_payment_methods fields
```

## How to Test

### Step 1: Open Console
- Press **F12** to open Developer Tools
- Click the **Console** tab
- Clear any previous logs

### Step 2: Test Insurance Providers
1. Scroll to "Insurance Providers Accepted" section
2. Check **3-4 insurance provider checkboxes** (e.g., Aetna, Anthem, Cigna)
3. **Watch the console** - you should see:
   - `[DEBUG] Found insurance checkboxes (checked): X` (should match number you selected)
   - `[DEBUG] Adding insurance provider: aetna` (for each checked)
   - `[SAVE] Insurance Providers being saved: ["aetna", "anthem", ...]`
   - `[SAVE] Insurance Providers in result: ["aetna", "anthem", ...]` (from database)

### Step 3: Test Custom Insurance
1. In "Other Insurance Providers" textarea, type: `Blue Shield, Cigna Direct`
2. Press Tab or click elsewhere to trigger save
3. **Watch the console** - you should see:
   - `[SAVE] Payment Methods being saved:` section includes `custom_insurance_providers`
   - `[SAVE] paymentCheckboxData: {..., custom_insurance_providers: "Blue Shield, Cigna Direct", ...}`

### Step 4: Test Payment Methods
1. Scroll to "Payment Methods Accepted" section
2. Check **3-4 payment methods** (e.g., Stripe, PayPal, Cash)
3. **Watch the console** - you should see:
   - `[DEBUG] Found payment checkboxes (checked): X` (should match number you selected)
   - `[DEBUG] Adding payment method: stripe` (for each checked)
   - `[SAVE] Payment Methods being saved: ["stripe", "paypal", ...]`
   - `[SAVE] Payment Methods in result: ["stripe", "paypal", ...]` (from database)

### Step 5: Test Custom Payment Methods
1. In "Other Payment Methods" textarea, type: `Crypto, Apple Pay`
2. Press Tab or click elsewhere to trigger save
3. **Watch the console** - you should see custom_payment_methods in the output

### Step 6: The Real Test - Reload Page
1. **Note all values you entered**
2. Press **Ctrl+Shift+R** (full page reload with cache clear)
3. **Wait for page to fully load**
4. Scroll back to Insurance/Payment sections
5. **Verify ALL of these are still checked/filled:**
   - Insurance checkboxes you selected
   - Custom insurance text
   - Payment method checkboxes you selected
   - Custom payment methods text

## What Success Looks Like

✅ After reload:
- All checked boxes are **still checked**
- Custom text fields **still have the text you typed**
- Console shows `✓ Loaded payment_methods: [...]`
- Console shows `✓ Loaded insurance_providers: [...]`
- Console shows `✓ Loaded custom_insurance_providers: ...`
- Console shows `✓ Loaded custom_payment_methods: ...`

## Console Log Reference

### When SAVING:
```
[DEBUG] Found insurance checkboxes (checked): 3
[DEBUG] Adding insurance provider: aetna
[DEBUG] Adding insurance provider: anthem
[DEBUG] Adding insurance provider: cigna
[DEBUG] Found payment checkboxes (checked): 2
[DEBUG] Adding payment method: stripe
[DEBUG] Adding payment method: paypal
[SAVE] paymentCheckboxData: {accepts_insurance: false, insurance_providers: Array(3), custom_insurance_providers: "Blue Shield", payment_methods: Array(2), custom_payment_methods: "Apple Pay"}
[SAVE] Insurance providers from checkboxes: (3) ["aetna", "anthem", "cigna"]
[SAVE] Payment methods from checkboxes: (2) ["stripe", "paypal"]
[SAVE] Insurance Providers being saved: ["aetna", "anthem", "cigna"]
[SAVE] Payment Methods being saved: ["stripe", "paypal"]
[SAVE] ✓ More Details section saved successfully
[SAVE] Insurance Providers in result: ["aetna", "anthem", "cigna"]
[SAVE] Payment Methods in result: ["stripe", "paypal"]
```

### When LOADING (reload page):
```
[Rooted Vitality] ✓ Loaded insurance_providers: ["aetna", "anthem", "cigna"]
[Rooted Vitality] ✓ Loaded payment_methods: ["stripe", "paypal"]
[Rooted Vitality] ✓ Loaded custom_insurance_providers: Blue Shield
[Rooted Vitality] ✓ Loaded custom_payment_methods: Apple Pay
[DEBUG] renderInsuranceCheckboxes called
[DEBUG] Found insurance checkboxes with .insurance-checkbox class: 8
[DEBUG] Checkbox aetna - should be checked: true ✓
[DEBUG] Checkbox anthem - should be checked: true ✓
[DEBUG] Checkbox cigna - should be checked: true ✓
```

## Troubleshooting

### If checkboxes don't stay checked after reload:

1. **Check console for errors** - Look for red error messages in console
2. **Verify fields are being saved** - Look for `[SAVE] Payment Methods being saved:` in console
3. **Check database fields** - The fields might not exist in database schema
4. **Check RLS policies** - Your user might not have permission to update these fields

### If custom text fields don't persist:

1. **Check if field IDs match**:
   - HTML IDs: `custom-insurance-providers`, `custom-payment-methods`
   - JavaScript lookup uses these same IDs
   
2. **Verify fields are loading**:
   - Look for `[Rooted Vitality] ✓ Loaded custom_insurance_providers:`
   - Look for `[Rooted Vitality] ✓ Loaded custom_payment_methods:`

### If you see errors in console:

**Copy the full error message and provide it** - it will show exactly what's failing

## Next Steps

After testing:
1. **If it works**: Celebrate! Move to next section
2. **If it doesn't work**: Open console, reproduce the issue, copy all console output, and share with me
3. **If partially works**: Note which parts work and which don't

---

**Date Updated**: Nov 7, 2025
**Last Modified**: Added custom field loading in populateProfileFields()
