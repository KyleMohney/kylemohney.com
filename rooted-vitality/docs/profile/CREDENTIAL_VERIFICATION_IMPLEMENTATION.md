# License Verification & Credential Gating - Implementation Guide

**Status:** Design Complete, Ready for Phase 2 Implementation  
**Priority:** High (Prevents unqualified practitioners from offering restricted services)  
**Estimated Effort:** 2-3 hours

---

## Overview

This document outlines how to implement credential verification to ensure practitioners can only add license-required service categories if they have uploaded valid credentials for their state/location.

---

## Current State

✅ **Completed:**
- Browse modal shows all 22 categories
- Categories marked with 🔐 License Required or ✓ No License Needed
- Add button works for both licensed and non-licensed categories
- No validation gates exist yet

❌ **Missing:**
- Credential verification before adding licensed categories
- State-based license requirement validation
- Integration with profile.html credential uploads
- Credential gate modal triggering

---

## Architecture

### Data Flow

```
User clicks [+ Add] on licensed category
              ↓
addCategoryFromBrowse(categoryId, name)
              ↓
Check: category.requiresLicense || category.requiresCertification?
              ↓
YES → verifyCredentialsForCategory(categoryId, practitionerState)
              ↓
checkCredentials query:
  - Get practitioner's uploaded credentials from Supabase
  - Match category against credentials
  - Check state license requirements
              ↓
If credentials found → Allow add, continue
If credentials missing → Show credential gate modal, block add
              ↓
NO (non-licensed) → Allow add immediately
```

### Credential Sources

**Primary:** `profile.html` - "Credentials & Licenses" section
- Practitioners upload diploma/license images
- Stored in Supabase `practitioners.credentials` JSONB column
- Format: Array of credential objects

**Structure:**
```json
{
  "credentials": [
    {
      "id": "cred-001",
      "type": "license",
      "category": "acupuncture",
      "state": "CA",
      "licenseNumber": "AC123456",
      "issuedDate": "2020-01-15",
      "expiryDate": "2025-12-31",
      "documentUrl": "s3://bucket/credential-001.pdf",
      "verificationStatus": "verified" // "pending", "verified", "rejected"
    },
    {
      "id": "cred-002",
      "type": "certification",
      "category": "yoga",
      "certificationBody": "Yoga Alliance",
      "certNumber": "YA654321",
      "documentUrl": "s3://bucket/credential-002.pdf",
      "verificationStatus": "verified"
    }
  ]
}
```

---

## Implementation Steps

### Step 1: Create Credential Database Schema

**Table:** `practitioner_credentials`

```sql
CREATE TABLE practitioner_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id UUID NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  credential_type TEXT NOT NULL, -- 'license', 'certification', 'degree'
  category_id TEXT NOT NULL,     -- References category ID (e.g., 'acupuncture')
  state_or_region TEXT,          -- US state code or country
  credential_number TEXT,        -- License/cert number
  issue_date DATE,
  expiry_date DATE,
  document_url TEXT,             -- S3 URL
  verification_status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
  rejection_reason TEXT,
  verified_by TEXT,              -- Admin email
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  CONSTRAINT expiry_check CHECK (expiry_date > issue_date)
);

CREATE INDEX idx_practitioner_credentials 
  ON practitioner_credentials(practitioner_id);
CREATE INDEX idx_credentials_category_state 
  ON practitioner_credentials(category_id, state_or_region);
```

### Step 2: Implement Verification Functions

**File:** `dashboard/pro/match-settings.html` (add to script section)

```javascript
// ======================================================
// CREDENTIAL VERIFICATION SYSTEM
// ======================================================

/**
 * Check if practitioner has verified credentials for a category
 * @param {string} categoryId - Category ID (e.g., 'acupuncture')
 * @param {string} state - Practitioner's state (e.g., 'CA')
 * @returns {Promise<boolean>} - True if credentials exist and verified
 */
async function verifyCredentialsForCategory(categoryId, state) {
  try {
    // Get current user's credentials from Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Query credentials table
    const { data: credentials, error } = await supabase
      .from('practitioner_credentials')
      .select('*')
      .eq('practitioner_id', user.id)
      .eq('category_id', categoryId)
      .eq('verification_status', 'verified')
      .gte('expiry_date', new Date().toISOString());

    if (error) {
      console.error('[Rooted Vitality] Credential verification error:', error);
      return false;
    }

    // For state-specific credentials, match state
    if (credentials && credentials.length > 0) {
      // If state is specified and required, check state match
      const stateSpecificCategories = [
        'acupuncture', 'massage-therapy', 'mental-health-counseling',
        'naturopathy', 'physical-therapy', 'chiropractic'
      ];

      if (stateSpecificCategories.includes(categoryId)) {
        // Must have credential for specific state
        return credentials.some(cred => cred.state_or_region === state);
      } else {
        // No state requirement, any credential valid
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('[Rooted Vitality] Credential check error:', error);
    return false;
  }
}

/**
 * Check if category requires license in practitioner's state
 * @param {string} categoryId - Category ID
 * @param {string} state - Practitioner's state
 * @returns {boolean} - True if license required
 */
function doesCategoryRequireLicense(categoryId, state) {
  // Categories requiring licenses by state
  const stateLicensedCategories = {
    'acupuncture': ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'CO', 'WA', 'MA', 'NM'],
    'massage-therapy': ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'NJ', 'OH', 'GA', 'NC'],
    'naturopathy': ['AZ', 'CT', 'DC', 'HI', 'ME', 'MT', 'NH', 'OR', 'UT', 'VT'],
    'mental-health-counseling': ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI'],
    'chiropractic': ['US'], // All US states
    'physical-therapy': ['US'], // All US states
  };

  const licensed = stateLicensedCategories[categoryId];
  if (!licensed) return false;

  return licensed.includes('US') || licensed.includes(state);
}

/**
 * Modified addCategoryFromBrowse with credential checking
 */
async function addCategoryFromBrowse(categoryId, categoryName) {
  // Check if already added
  if (activeCategories.some(ac => ac.id === categoryId)) {
    showToast('This category is already added.', 'error');
    return;
  }

  const fullCategory = allCategories.find(c => c.id === categoryId);
  if (!fullCategory) return;

  // Check for license requirement
  if (fullCategory.requiresLicense || fullCategory.requiresCertification) {
    // Get practitioner's state from profile
    const userState = await getPractitionerState();
    
    // Check if this category requires license in their state
    if (doesCategoryRequireLicense(categoryId, userState)) {
      // Verify credentials
      const hasCredentials = await verifyCredentialsForCategory(categoryId, userState);
      
      if (!hasCredentials) {
        // Show credential gate modal
        showCredentialGateModal(categoryId, categoryName, userState);
        return;
      }
    }
  }

  // All checks passed - add category
  activeCategories.push({
    id: categoryId,
    name: categoryName,
    subcategories: [],
    active: true,
    requiresLicense: fullCategory.requiresLicense,
    requiresCert: fullCategory.requiresCertification
  });

  saveActiveCategories();
  renderActiveCategories();
  renderBrowseCategoryCards();

  showToast(`${categoryName} added to your categories.`, 'success');
  console.log('[Rooted Vitality] Category added:', categoryId);
}

/**
 * Get practitioner's state from profile
 */
async function getPractitionerState() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('practitioners')
      .select('state')
      .eq('id', user.id)
      .single();

    return profile?.state || null;
  } catch (error) {
    console.error('[Rooted Vitality] Error getting practitioner state:', error);
    return null;
  }
}

/**
 * Show credential gate modal with call-to-action
 */
function showCredentialGateModal(categoryId, categoryName, state) {
  const modal = document.getElementById('credential-gate-modal');
  const message = document.getElementById('credential-gate-message');

  if (!modal || !message) return;

  const category = allCategories.find(c => c.id === categoryId);
  const licenseType = category?.requiresLicense ? 'license' : 'certification';

  message.innerHTML = `
    <p style="font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem;">
      ${categoryName} Requires Verification
    </p>
    <p style="font-size: 0.9rem; line-height: 1.6;">
      To offer <strong>${categoryName}</strong> in <strong>${state}</strong>, 
      we need you to upload your <strong>${licenseType}</strong> for verification.
    </p>
    <p style="font-size: 0.85rem; color: #6b6b6b; margin-top: 1rem;">
      We verify credentials to ensure client safety and maintain community trust. 
      Upload takes less than 2 minutes.
    </p>
  `;

  modal.classList.add('active');
  console.log('[Rooted Vitality] Credential gate modal shown for:', categoryId);
}

/**
 * Close credential gate modal
 */
function closeCredentialGateModal() {
  document.getElementById('credential-gate-modal').classList.remove('active');
}
```

### Step 3: Update Existing Functions

Modify existing `addCategoryFromBrowse` to use async/await:

```javascript
// BEFORE
function addCategoryFromBrowse(categoryId, categoryName) {
  // ... synchronous code ...
}

// AFTER
async function addCategoryFromBrowse(categoryId, categoryName) {
  // ... with credential checks ...
}
```

### Step 4: Update HTML Modal

**File:** `dashboard/pro/match-settings.html` (credential gate modal)

Current (update to be more specific):

```html
<div id="credential-gate-modal" class="modal-overlay credential-gate-modal">
  <div class="modal-content">
    <div class="modal-header">
      <h2>Verification Required</h2>
      <button class="modal-close-btn" onclick="closeCredentialGateModal()">×</button>
    </div>

    <div class="modal-body">
      <div class="credential-gate-icon">🔐</div>
      <p class="credential-gate-message" id="credential-gate-message">
        This category requires credential verification.
      </p>
      <div class="credential-gate-hint">
        Upload your credentials in your profile to activate this category.
      </div>
    </div>

    <div class="modal-footer">
      <button class="btn-modal btn-modal-secondary" onclick="closeCredentialGateModal()">
        Close
      </button>
      <a href="./profile.html#credentials-section" class="btn-modal btn-modal-primary" 
         style="text-decoration: none; display: flex; align-items: center; justify-content: center;">
        Upload Credentials
      </a>
    </div>
  </div>
</div>
```

### Step 5: Add to Profile Credentials Section

**File:** `dashboard/pro/profile.html` (update credentials section)

Add UI to upload and manage credentials:

```html
<!-- Credentials & Licenses Section (new) -->
<section class="profile-section" data-section="credentials" id="credentials-section">
  <div class="section-header">
    <h2>Credentials & Licenses</h2>
    <button class="section-edit-btn" onclick="enableSectionEdit('credentials')">Edit</button>
  </div>

  <div class="section-instruction">
    Upload your professional credentials to unlock restricted categories and build client trust.
  </div>

  <div id="credentials-display" class="credentials-display">
    <!-- Populated with uploaded credentials -->
  </div>

  <div id="credentials-edit" class="credentials-edit" style="display: none;">
    <div class="credentials-uploader">
      <div class="upload-area" onclick="document.getElementById('credential-file').click()">
        <p>📄 Click to upload credential / license</p>
        <p style="font-size: 0.85rem;">PDF, JPG, PNG (max 10MB)</p>
      </div>
      <input type="file" id="credential-file" style="display: none;" accept=".pdf,.jpg,.jpeg,.png">

      <!-- Form for credential details -->
      <div class="form-group">
        <label>Category</label>
        <select id="credential-category">
          <option>-- Select Category --</option>
          <option value="acupuncture">Acupuncture & TCM</option>
          <option value="massage-therapy">Massage Therapy</option>
          <!-- ... more categories ... -->
        </select>
      </div>

      <div class="form-group">
        <label>License/Certificate Number</label>
        <input type="text" id="credential-number" placeholder="e.g., AC123456">
      </div>

      <div class="form-group">
        <label>State (if applicable)</label>
        <input type="text" id="credential-state" placeholder="e.g., CA, NY, TX">
      </div>

      <div class="form-group">
        <label>Expiry Date</label>
        <input type="date" id="credential-expiry">
      </div>

      <button onclick="uploadCredential()" class="btn-primary">Upload Credential</button>
    </div>
  </div>
</section>
```

---

## State License Requirement Matrix

### Acupuncture & TCM 🧬
- **Regulated States:** CA, CO, CT, DC, DE, FL, GA, HI, IL, MA, MD, ME, MN, MO, NE, NM, NV, NY, OR, PA, RI, TX, UT, VT, WA
- **Unregulated:** AR, LA, MA, MI, NC, SC, WV
- **Type:** State License Required (LAc - Licensed Acupuncturist)
- **Hours:** 2,200-3,000 hours (varies by state)

### Massage Therapy 💆
- **Regulated States:** All 50 states + DC
- **Type:** State License (LMT - Licensed Massage Therapist)
- **Hours:** 600-1,500 hours (varies by state)

### Mental Health Counseling 🧠
- **Regulated States:** All 50 states + DC (but titles vary)
- **Types:** LPC, LMHC, LCPC
- **Education:** Master's degree minimum + 2-3 years supervised hours

### Naturopathic Medicine 🌿
- **Licensed States:** AZ, CT, DC, HI, ME, MT, NH, OR, UT, VT
- **Unregulated:** Majority of states
- **Type:** State License (ND - Doctor of Naturopathic Medicine)

### Chiropractic Care 🔧
- **Regulated States:** All 50 states + DC
- **Type:** State License (DC - Doctor of Chiropractic)
- **Education:** 4-year Doctor of Chiropractic degree

### Physical Therapy 🏥
- **Regulated States:** All 50 states + DC
- **Type:** State License (PT - Physical Therapist)
- **Education:** Doctor of Physical Therapy (DPT) degree

---

## Testing Plan

### Unit Tests

```javascript
// Test: Credential verification for licensed category
test('verifyCredentialsForCategory returns true with valid credentials', async () => {
  // Mock Supabase response with valid credential
  const result = await verifyCredentialsForCategory('acupuncture', 'CA');
  expect(result).toBe(true);
});

// Test: Credential verification blocks without credentials
test('verifyCredentialsForCategory returns false without credentials', async () => {
  // Mock Supabase response with no credentials
  const result = await verifyCredentialsForCategory('acupuncture', 'CA');
  expect(result).toBe(false);
});

// Test: Non-licensed category always passes
test('Non-licensed category bypasses credential check', async () => {
  const result = addCategoryFromBrowse('yoga', 'Yoga & Pilates');
  expect(result).toAdd(); // Adds without checking credentials
});
```

### Integration Tests

```javascript
// Test: Full flow with licensed category and credentials
test('User can add licensed category with valid credentials', async () => {
  // 1. Upload credential to profile
  // 2. Verify credential in database
  // 3. Click Add on licensed category
  // 4. Verify category adds successfully
  // 5. Check "Your Active Categories" list
});

// Test: Credential gate modal appears without credentials
test('Credential gate modal shows when adding unlicensed category', async () => {
  // 1. Don't upload credentials
  // 2. Click Add on licensed category
  // 3. Verify credential-gate-modal has .active class
  // 4. Verify message content
  // 5. Click "Upload Credentials" link
  // 6. Verify navigation to profile.html#credentials-section
});
```

### Manual Testing Checklist

- [ ] Add non-licensed category (Yoga) → Adds immediately ✓
- [ ] Add licensed category without credentials → Shows credential gate modal ✓
- [ ] Upload credential for category/state → Credential appears in profile ✓
- [ ] Add licensed category with valid credential → Adds successfully ✓
- [ ] Add licensed category from different state → Shows appropriate error ✓
- [ ] Credential expires soon → Warning message or re-verification required ✓
- [ ] Modal "Upload Credentials" button links to profile ✓
- [ ] Modal "Close" button dismisses without adding category ✓

---

## Security Considerations

### 1. Credential Verification
- ✅ **Manual Review:** Admin verifies documents before marking "verified"
- ✅ **Expiry Checking:** Automatic check for expired credentials
- ✅ **State Validation:** Ensures credentials match practitioner location

### 2. Data Privacy
- ✅ **Document Storage:** S3 with encryption at rest
- ✅ **Access Control:** Only practitioner + admin can view own credentials
- ✅ **GDPR Compliance:** Can be deleted on request

### 3. Fraud Prevention
- ✅ **Document Requirements:** Multiple credential types (diploma + license)
- ✅ **License Number Validation:** Cross-reference with state boards (future)
- ✅ **Admin Review:** Human verification before approval

---

## Future Enhancements

### Phase 3A: Automated License Verification
```javascript
// Integration with state license boards
async function verifyLicenseWithStateBoard(licenseNumber, state, category) {
  // Query state board API for license verification
  // Update verification_status to 'auto_verified' or 'invalid'
}
```

### Phase 3B: Multi-Document Support
```
// Support uploading multiple credential types:
- Professional License
- Diploma/Degree
- Certifications
- Insurance Verification
- Liability Insurance
```

### Phase 3C: Credential Reminders
```javascript
// Email reminders before credential expiry
async function checkExpiringCredentials() {
  // Query credentials expiring in 30 days
  // Send email: "Your [License] expires on [date]"
}
```

---

## Rollout Plan

### Week 1: Infrastructure
- [ ] Create `practitioner_credentials` table
- [ ] Create Supabase policies for data access
- [ ] Add S3 bucket for credential documents

### Week 2: Implementation
- [ ] Implement verification functions
- [ ] Add credential upload UI to profile.html
- [ ] Implement credential gate modal

### Week 3: Testing & Launch
- [ ] Unit and integration testing
- [ ] Manual QA with test categories
- [ ] Security audit
- [ ] Launch to production

### Post-Launch: Monitoring
- [ ] Track credential upload rates
- [ ] Monitor false positives/negatives
- [ ] Gather practitioner feedback

---

## Reference Materials

### Related Files
- `/dashboard/pro/match-settings.html` - Browse modal implementation
- `/dashboard/pro/profile.html` - Credentials section (to be added)
- `/data/practitioner-categories.json` - Category definitions

### Documentation
- `ADD_SERVICE_CATEGORY_MODERNIZATION.md` - Browse modal guide
- `CATEGORY_BROWSER_VISUAL_GUIDE.md` - UI reference

### External References
- [State License Board Database](https://www.fsmb.org/) (medical boards)
- [Yoga Alliance Verification](https://www.yogaalliance.org/directory)
- [Naturopathic Licensing By State](https://www.aanp.net/licensing-by-state)

---

**Status:** Ready for Phase 2 Development  
**Estimated Effort:** 2-3 weeks (including testing)  
**Priority:** High (Critical for platform trust & compliance)
