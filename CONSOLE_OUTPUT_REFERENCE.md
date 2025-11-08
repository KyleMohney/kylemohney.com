# CONSOLE OUTPUT REFERENCE - Payment & Insurance Save Test

Copy this reference while testing. Compare your console output with what's shown below.

---

## EXPECTED CONSOLE OUTPUT - WHEN SAVING

### Step 1: Check Insurance Checkboxes

**USER ACTION**: Check "Aetna", "Anthem", and "Cigna"

**EXPECTED CONSOLE OUTPUT**:

```
[DEBUG] Found insurance checkboxes (checked): 3
[DEBUG] Adding insurance provider: aetna
[DEBUG] Adding insurance provider: anthem
[DEBUG] Adding insurance provider: cigna
```

### Step 2: Type Custom Insurance

**USER ACTION**: Click "Other Insurance Providers" textarea, type: `United MyChoice, Custom HMO`

**EXPECTED CONSOLE OUTPUT** (when you tab out or click elsewhere):

```
[DEBUG] Found insurance checkboxes (checked): 3
[DEBUG] Adding insurance provider: aetna
[DEBUG] Adding insurance provider: anthem
[DEBUG] Adding insurance provider: cigna
[DEBUG] Found payment checkboxes (checked): 0
[SAVE] paymentCheckboxData: {
  accepts_insurance: false,
  insurance_providers: Array(3) [ "aetna", "anthem", "cigna" ],
  custom_insurance_providers: "United MyChoice, Custom HMO",
  payment_methods: Array(0),
  custom_payment_methods: ""
}
```

### Step 3: Check Payment Methods

**USER ACTION**: Check "Stripe", "PayPal", "Cash"

**EXPECTED CONSOLE OUTPUT**:

```
[DEBUG] Found insurance checkboxes (checked): 3
[DEBUG] Adding insurance provider: aetna
[DEBUG] Adding insurance provider: anthem
[DEBUG] Adding insurance provider: cigna
[DEBUG] Found payment checkboxes (checked): 3
[DEBUG] Adding payment method: stripe
[DEBUG] Adding payment method: paypal
[DEBUG] Adding payment method: cash
[SAVE] paymentCheckboxData: {
  accepts_insurance: false,
  insurance_providers: Array(3) [ "aetna", "anthem", "cigna" ],
  custom_insurance_providers: "United MyChoice, Custom HMO",
  payment_methods: Array(3) [ "stripe", "paypal", "cash" ],
  custom_payment_methods: ""
}
```

### Step 4: Type Custom Payment Methods

**USER ACTION**: Click "Other Payment Methods" textarea, type: `Crypto Wallet, Apple Pay, Google Pay`

**EXPECTED CONSOLE OUTPUT** (when you tab out):

```
[SAVE] ========== saveMoreDetailsSection STARTED ==========
[SAVE] window.currentLanguages: Array(0)
[SAVE] window.faqItems: Array(0)
[SAVE] paymentCheckboxData: {
  accepts_insurance: false,
  insurance_providers: Array(3),
  custom_insurance_providers: "United MyChoice, Custom HMO",
  payment_methods: Array(3),
  custom_payment_methods: "Crypto Wallet, Apple Pay, Google Pay"
}
[SAVE] paymentCheckboxData: Object { ... }
[SAVE] Insurance providers from checkboxes: Array(3) [ "aetna", "anthem", "cigna" ]
[SAVE] Payment methods from checkboxes: Array(3) [ "stripe", "paypal", "cash" ]
[SAVE] selectedLanguages from getSelectedLanguages(): Array(0)
[SAVE] selectedLanguages type: object isArray: true
[SAVE] languagesToSave (after formatting): Array(0)
[SAVE] faqToSave (after formatting): Array(0)
[SAVE] More Details section data: {
  languages: Array(0),
  faq: Array(0),
  social_media: { facebook: "", instagram: "", twitter: "", ... },
  accepts_insurance: false,
  insurance_providers: [ "aetna", "anthem", "cigna" ],
  custom_insurance_providers: "United MyChoice, Custom HMO",
  payment_methods: [ "stripe", "paypal", "cash" ],
  custom_payment_methods: "Crypto Wallet, Apple Pay, Google Pay",
  updated_at: "2025-11-07T14:23:45.123Z"
}
[SAVE] Languages being saved: Array(0) Type: object
[SAVE] FAQ being saved: Array(0) Type: object
[SAVE] Payment Methods being saved: [ "stripe", "paypal", "cash" ] Type: object
[SAVE] Insurance Providers being saved: [ "aetna", "anthem", "cigna" ] Type: object
[DB] ====== safePractitionerUpdate CALLED ======
[DB] Updating user_id: 12345678-1234-1234-1234-123456789012
[DB] Update data keys: (9) [ "languages", "faq", "social_media", "accepts_insurance", "insurance_providers", "custom_insurance_providers", "payment_methods", "custom_payment_methods", "updated_at" ]
[DB] languages in updateData: Array(0)
[DB] faq in updateData: Array(0)
[DB] Full update data: {
  "languages": [],
  "faq": [],
  "social_media": { ... },
  "accepts_insurance": false,
  "insurance_providers": [ "aetna", "anthem", "cigna" ],
  "custom_insurance_providers": "United MyChoice, Custom HMO",
  "payment_methods": [ "stripe", "paypal", "cash" ],
  "custom_payment_methods": "Crypto Wallet, Apple Pay, Google Pay",
  "updated_at": "2025-11-07T14:23:45.123Z"
}
[DB] Update response - data: {...}, error: null
[SAVE] ✓ More Details section saved successfully
[SAVE] Result from database: {...}
[SAVE] Languages in result: Array(0) Type: object
[SAVE] Payment Methods in result: [ "stripe", "paypal", "cash" ] Type: object
[SAVE] Insurance Providers in result: [ "aetna", "anthem", "cigna" ] Type: object
```

### SUCCESS INDICATORS ✅

- ✅ No errors (no red lines)
- ✅ `[SAVE] Payment Methods being saved:` shows your array
- ✅ `[SAVE] Insurance Providers being saved:` shows your array
- ✅ `[SAVE] custom_insurance_providers:` shows your text
- ✅ `[SAVE] custom_payment_methods:` shows your text
- ✅ `[SAVE] ✓ More Details section saved successfully` appears
- ✅ `[DB] Update response - data: {...}, error: null` (no error)

---

## EXPECTED CONSOLE OUTPUT - WHEN LOADING (AFTER RELOAD)

**USER ACTION**: Press Ctrl+Shift+R to reload page

**EXPECTED CONSOLE OUTPUT** (scroll to find these):

```
[Rooted Vitality] populateProfileFields called with data: {...}
[Rooted Vitality] Full data object keys: (68) [ "id", "user_id", "email", ..., "insurance_providers", "custom_insurance_providers", "payment_methods", "custom_payment_methods", ... ]
[Rooted Vitality] ✓ Loaded insurance_providers: [ "aetna", "anthem", "cigna" ]
[Rooted Vitality] ✓ Loaded payment_methods: [ "stripe", "paypal", "cash" ]
[Rooted Vitality] ✓ Loaded custom_insurance_providers: United MyChoice, Custom HMO
[Rooted Vitality] ✓ Loaded custom_payment_methods: Crypto Wallet, Apple Pay, Google Pay
[DEBUG] renderInsuranceCheckboxes called
[DEBUG] Found insurance checkboxes with .insurance-checkbox class: 8
[DEBUG] window.selectedInsurance: [ "aetna", "anthem", "cigna" ]
[DEBUG] Checkbox aetna - should be checked: true
[DEBUG] Checkbox anthem - should be checked: true
[DEBUG] Checkbox cigna - should be checked: true
[DEBUG] Checkbox humana - should be checked: false
[DEBUG] Checkbox united - should be checked: false
[DEBUG] Checkbox medicaid - should be checked: false
[DEBUG] Checkbox medicare - should be checked: false
[DEBUG] Checkbox private-pay - should be checked: false
```

### SUCCESS INDICATORS ✅

- ✅ `[Rooted Vitality] ✓ Loaded insurance_providers: [ "aetna", "anthem", "cigna" ]`
- ✅ `[Rooted Vitality] ✓ Loaded payment_methods: [ "stripe", "paypal", "cash" ]`
- ✅ `[Rooted Vitality] ✓ Loaded custom_insurance_providers: ...` with YOUR text
- ✅ `[Rooted Vitality] ✓ Loaded custom_payment_methods: ...` with YOUR text
- ✅ `[DEBUG] Checkbox aetna - should be checked: true` (for each checked box)
- ✅ `[DEBUG] Checkbox <unchecked> - should be checked: false` (for others)

---

## VISUAL UI VERIFICATION

After reload, you should see:

✅ **Insurance Section:**
- [ ] Aetna - **CHECKED** ✓
- [ ] Anthem / BlueCross - **CHECKED** ✓
- [ ] Cigna - **CHECKED** ✓
- [ ] Humana - **UNCHECKED** ✓
- [ ] United Healthcare - **UNCHECKED** ✓
- [ ] Medicaid - **UNCHECKED** ✓
- [ ] Medicare - **UNCHECKED** ✓
- [ ] Private Pay - **UNCHECKED** ✓
- **Other Insurance Providers**: "United MyChoice, Custom HMO" ← TEXT VISIBLE ✓

✅ **Payment Methods Section:**
- [ ] Stripe - **CHECKED** ✓
- [ ] Square - **UNCHECKED** ✓
- [ ] PayPal - **CHECKED** ✓
- [ ] Cash - **CHECKED** ✓
- [ ] Check - **UNCHECKED** ✓
- [ ] Venmo - **UNCHECKED** ✓
- [ ] Bank Transfer - **UNCHECKED** ✓
- [ ] Credit Card - **UNCHECKED** ✓
- **Other Payment Methods**: "Crypto Wallet, Apple Pay, Google Pay" ← TEXT VISIBLE ✓

---

## TROUBLESHOOTING GUIDE

### Problem: No [SAVE] logs appear in console

**Solution:**
1. Make sure you're changing a field (checking box or typing text)
2. Wait 1+ second after making change (debounce delay)
3. Press Tab or click elsewhere to trigger the `onchange` event
4. Check that the element has the correct `onchange` handler

**Debug Check:**
- Open browser DevTools
- Click on a checkbox
- In the Elements/Inspector, right-click the checkbox
- Select "Break on" → "change events"
- The debugger will pause when the event fires

### Problem: [SAVE] logs show data but nothing is saved

**Solution:**
1. Check for errors in the console (red text)
2. Look for `[DB] Update response - data: {...}, error: null`
3. If error exists, it will show there

**Common Errors:**
- `Auth error: User not authenticated` - Log in again
- `RLS policy denied` - Check database permissions
- `Column not found` - Database schema is missing field

### Problem: Data saves but doesn't reload

**Solution:**
1. Check for `[Rooted Vitality] ✓ Loaded` logs
2. If not present, the data might not be saved to database
3. If present but UI not updated, the element IDs might be wrong

**Debug Check:**
- Manually query database in Supabase to verify data was saved
- Check that textarea IDs match: `custom-insurance-providers`, `custom-payment-methods`

### Problem: Only some checkboxes persist

**Solution:**
1. Check each checkbox's `value` attribute matches the value in database array
2. Example: checkbox `value="aetna"` should match string "aetna" in array
3. Case must match exactly (aetna ≠ AETNA)

**Debug Check:**
- Look at `[DEBUG] Checkbox <name> - should be checked: <true/false>`
- Compare with actual checkbox state after reload

---

## Console Filter Tips

### To see ONLY save-related logs:
```
In console filter box, type: [SAVE]
```

### To see ONLY load-related logs:
```
In console filter box, type: Loaded
```

### To see ONLY debug logs:
```
In console filter box, type: [DEBUG]
```

### To see errors:
```
In console, click "Errors" button in top right
```

---

**Document Version**: 1.0
**Last Updated**: Nov 7, 2025
**Applicable To**: Payment & Insurance save flow
