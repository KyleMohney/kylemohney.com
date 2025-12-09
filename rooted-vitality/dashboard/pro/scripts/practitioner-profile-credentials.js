/*
╔═════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                              ║
║  File: dashboard/pro/scripts/practitioner-profile-credentials.js    ║
║  Purpose: Credentials management module for degrees, licenses, certs║
║  Holistic Wellness · Modern Connection Platform                     ║
║  rootedvitality.com | 2025                                          ║
╚═════════════════════════════════════════════════════════════════════╝

TABLE OF CONTENTS:
  0. Credential Form Initialization
  1. Credential Management
  2. Credential Rendering
  3. Credential Display
  4. Background Check Setup
  5. Business Verification Setup

NOTE: Section 0 handles form element setup; sections 1-5 follow standard credential management

ARCHITECTURE NOTES:
- Modular service file for credential handling (degrees, licenses, certifications)
- Accesses ProfileState from main practitioner_profile.js
- Manages form items and display modes for credentials
- Triggers updateProfileCompleteness() and updateCredentialsBadge() on changes
- Integrates with credential form event listeners
- Manages background check button and business verification forms

*/

document.addEventListener('DOMContentLoaded', () => {
    setupAddCredentialButtons();
    setupBackgroundCheckButton();
    setupBusinessVerification();
});

// ======================================================
// 0. CREDENTIAL BUTTON SETUP
// ======================================================

function setupAddCredentialButtons() {
    const addDegreeBtn = document.getElementById('add-degree-btn');
    const addLicenseBtn = document.getElementById('add-license-btn');
    const addCertificationBtn = document.getElementById('add-certification-btn');
    
    if (addDegreeBtn) {
        addDegreeBtn.addEventListener('click', () => addCredential('degree'));
    }
    if (addLicenseBtn) {
        addLicenseBtn.addEventListener('click', () => addCredential('license'));
    }
    if (addCertificationBtn) {
        addCertificationBtn.addEventListener('click', () => addCredential('certification'));
    }
    
    // Show credentials edit sections by default
    const degreesEdit = document.getElementById('degrees-edit');
    const licensesEdit = document.getElementById('licenses-edit');
    const certificationsEdit = document.getElementById('certifications-edit');
    
    if (degreesEdit) degreesEdit.style.display = 'block';
    if (licensesEdit) licensesEdit.style.display = 'block';
    if (certificationsEdit) certificationsEdit.style.display = 'block';
    
    // Setup listeners for credential inputs
    setupCredentialInputListeners();
}

// ======================================================
// 1. CREDENTIAL MANAGEMENT
// ======================================================

function addCredential(type) {
    const credentialArray = getCredentialArray(type);
    const newCredential = {
        id: Date.now(),
        ...getEmptyCredentialTemplate(type)
    };
    credentialArray.push(newCredential);
    renderCredentials(type);
    updateProfileCompleteness();
    updateCredentialsBadge();
    // Attach listeners to newly rendered inputs
    setupCredentialInputListeners();
    // Trigger auto-save after credential addition
    if (typeof saveSectionCredentials === 'function') {
        saveSectionCredentials();
    }
}

function removeCredential(type, id) {
    const credentialArray = getCredentialArray(type);
    const index = credentialArray.findIndex(c => c.id === id);
    if (index > -1) {
        credentialArray.splice(index, 1);
        renderCredentials(type);
        updateProfileCompleteness();
        updateCredentialsBadge();
        // Trigger auto-save after credential removal
        if (typeof saveSectionCredentials === 'function') {
            saveSectionCredentials();
        }
    }
}

function getCredentialArray(type) {
    switch(type) {
        case 'degree': return ProfileState.educationCredentials || [];
        case 'license': return ProfileState.licenseCredentials || [];
        case 'certification': return ProfileState.certificationCredentials || [];
        default: return [];
    }
}

function getEmptyCredentialTemplate(type) {
    switch(type) {
        case 'degree':
            return {
                title: '',
                issuer: '',
                issue_date: null,
                expiration_date: null
            };
        case 'license':
            return {
                title: '',
                issuer: '',
                issue_date: null,
                expiration_date: null
            };
        case 'certification':
            return {
                title: '',
                issuer: '',
                issue_date: null,
                expiration_date: null
            };
        default: return {};
    }
}

// ======================================================
// 2. CREDENTIAL RENDERING
// ======================================================

function renderCredentials(type) {
    const credentialArray = getCredentialArray(type);
    const listId = `${type === 'degree' ? 'degrees' : type === 'license' ? 'licenses' : 'certifications'}-list`;
    const listElement = document.getElementById(listId);
    if (!listElement) {
        console.error(`[Rooted Vitality] List element not found for ${type}`);
        return;
    }
    
    // Ensure the edit section is visible
    const editSectionId = `${type === 'degree' ? 'degrees' : type === 'license' ? 'licenses' : 'certifications'}-edit`;
    const editSection = document.getElementById(editSectionId);
    if (editSection) {
        editSection.style.display = 'block';
    }
    
    listElement.innerHTML = '';
    
    credentialArray.forEach(credential => {
        const item = createCredentialFormItem(type, credential);
        listElement.appendChild(item);
    });
}

function createCredentialFormItem(type, credential) {
    const div = document.createElement('div');
    div.className = 'credential-item';
    div.setAttribute('data-id', credential.id);
    
    let titleField = credential.title || 'New Credential';
    let fieldsHTML = `
        <div class="credential-field">
            <label>Title</label>
            <input type="text" class="credential-input" data-field="title" placeholder="e.g., Bachelor of Science in Nutrition" value="${credential.title || ''}">
        </div>
        <div class="credential-field">
            <label>Issuer / Institution</label>
            <input type="text" class="credential-input" data-field="issuer" placeholder="School, organization, or authority" value="${credential.issuer || ''}">
        </div>
        <div class="credential-field">
            <label>Issue Date</label>
            <input type="date" class="credential-input" data-field="issue_date" value="${credential.issue_date || ''}">
        </div>
        <div class="credential-field">
            <label>Expiration Date</label>
            <input type="date" class="credential-input" data-field="expiration_date" value="${credential.expiration_date || ''}">
        </div>
    `;
    
    div.innerHTML = `
        <div class="credential-item-header">
            <div class="credential-item-title">${titleField}</div>
            <button class="credential-item-remove" data-type="${type}" data-id="${credential.id}" title="Remove">×</button>
        </div>
        <div class="credential-fields-grid">
            ${fieldsHTML}
        </div>
    `;
    
    // Add event listener to remove button
    div.querySelector('.credential-item-remove').addEventListener('click', (e) => {
        e.preventDefault();
        removeCredential(type, credential.id);
    });
    
    // Add event listeners to track changes
    div.querySelectorAll('.credential-input').forEach(input => {
        input.addEventListener('change', () => {
            updateCredentialField(type, credential.id, input.getAttribute('data-field'), input.value);
            // Don't re-render here - just update the data
            // renderCredentials(type) causes jumpiness
        });
    });
    
    return div;
}

function updateCredentialField(type, id, field, value) {
    const credentialArray = getCredentialArray(type);
    const credential = credentialArray.find(c => c.id === id);
    if (credential) {
        credential[field] = value;
    }
}

// ======================================================
// 3. CREDENTIAL DISPLAY
// ======================================================

function displayCredentials(type) {
    const credentialArray = getCredentialArray(type);
    const displaySection = document.getElementById(`${type === 'degree' ? 'degrees' : type === 'license' ? 'licenses' : 'certifications'}-display`);
    
    if (!displaySection) return;
    
    displaySection.innerHTML = '';
    
    credentialArray.forEach(credential => {
        const item = createCredentialDisplayItem(type, credential);
        displaySection.appendChild(item);
    });
}

function createCredentialDisplayItem(type, credential) {
    const div = document.createElement('div');
    div.className = 'credential-display-item';
    
    let title = credential.title || 'Credential';
    let details = [
        credential.issuer && `<strong>Issuer:</strong> ${credential.issuer}`,
        credential.issue_date && `<strong>Issued:</strong> ${credential.issue_date}`,
        credential.expiration_date && `<strong>Expires:</strong> ${credential.expiration_date}`
    ].filter(Boolean).join(' • ');
    
    div.innerHTML = `
        <div class="credential-display-item-title">${title}</div>
        <div class="credential-display-item-details">${details}</div>
    `;
    
    return div;
}

// ======================================================
// 4. BACKGROUND CHECK STATUS UPDATE
// ======================================================

function updateBackgroundCheckStatus(status) {
    const statusContainer = document.getElementById('background-check-status');
    const button = document.getElementById('start-background-check');
    
    if (status === 'passed') {
        statusContainer.innerHTML = `
            <div class="background-check-status passed">
                <span class="status-icon">✓</span>
                <div>
                    <p>Background Check Passed</p>
                    <p class="status-date">Your background check has been verified</p>
                </div>
            </div>
        `;
        if (button) button.style.display = 'none';
    } else if (status === 'pending') {
        statusContainer.innerHTML = `
            <div class="background-check-status pending">
                <div>
                    <p>Background Check Pending</p>
                    <p class="status-date">Your background check is being reviewed</p>
                </div>
            </div>
        `;
        if (button) button.style.display = 'none';
    } else if (status === 'failed') {
        statusContainer.innerHTML = `
            <div class="background-check-status failed">
                <span class="status-icon">✗</span>
                <div>
                    <p>Background Check Failed</p>
                    <p class="status-date">Please contact support for more information</p>
                </div>
            </div>
        `;
        if (button) button.style.display = 'block';
    } else {
        // null or undefined - show start button
        statusContainer.innerHTML = `
            <div class="background-check-status not-started">
                <span class="status-icon">—</span>
                <div>
                    <p>Background Check Not Started</p>
                    <p class="status-date">Click the button below to begin the verification process</p>
                </div>
            </div>
        `;
        if (button) button.style.display = 'block';
    }
}

function setupBackgroundCheckButton() {
    const btn = document.getElementById('start-background-check');
    if (btn) {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            alert('Background check process coming soon! This will verify your credentials securely.');
            // TODO: Implement background check flow with third-party service
        });
    }
}

function updateVerificationStatus(status) {
    const statusDisplay = document.getElementById('verification-status-display');
    const formContainer = document.getElementById('verification-form-container');
    
    if (status === 'approved') {
        formContainer.style.display = 'none';
        statusDisplay.innerHTML = `
            <div class="verification-status submitted">
                <span class="status-icon">✓</span>
                <div>
                    <p>Business Verification Approved</p>
                    <p class="status-date">Your verification documents have been reviewed and approved</p>
                </div>
            </div>
        `;
        statusDisplay.classList.add('submitted');
    } else if (status === 'pending') {
        formContainer.style.display = 'none';
        statusDisplay.innerHTML = `
            <div class="verification-status pending">
                <span class="status-icon">⏳</span>
                <div>
                    <p>Business Verification Pending</p>
                    <p class="status-date">Your documents are being reviewed by our admin team</p>
                </div>
            </div>
        `;
        statusDisplay.classList.add('pending');
        statusDisplay.classList.remove('submitted');
    } else if (status === 'rejected') {
        formContainer.style.display = 'block';
        const rejectionReason = ProfileState.practitionerData?.verification_rejection_reason || 'Please resubmit your documents';
        statusDisplay.innerHTML = `
            <div class="verification-status rejected">
                <span class="status-icon">✗</span>
                <div>
                    <p>Verification Rejected</p>
                    <p class="status-date">${rejectionReason}</p>
                </div>
            </div>
        `;
        statusDisplay.classList.add('rejected');
        statusDisplay.classList.remove('submitted', 'pending');
    } else {
        // No submission yet
        formContainer.style.display = 'block';
        statusDisplay.innerHTML = '';
        statusDisplay.classList.remove('submitted', 'pending', 'rejected');
    }
}

// ======================================================
// 5. BUSINESS VERIFICATION SETUP
// ======================================================

function setupBusinessVerification() {
    const formContainer = document.getElementById('verification-form-container');
    const statusDisplay = document.getElementById('verification-status-display');
    const form = document.getElementById('business-verification-form');
    const cancelBtn = document.getElementById('cancel-verification-btn');
    
    if (!form || !formContainer) {
        return;
    }

    // Check if verification already submitted
    const checkVerificationStatus = () => {
        const status = ProfileState.practitionerData?.verification_status || null;
        if (status) {
            updateVerificationStatus(status);
        } else {
            updateVerificationStatus(null);
        }
    };

    // Initial status check (may be called before data loads)
    checkVerificationStatus();
    
    // Re-check after a short delay to ensure ProfileState is populated
    setTimeout(checkVerificationStatus, 500);

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const einSsn = document.getElementById('verification-ein-ssn').value.trim();
            const idFront = document.getElementById('verification-id-front').files[0];
            const idBack = document.getElementById('verification-id-back').files[0];

            if (!einSsn || !idFront || !idBack) {
                showAutoSaveIndicator('error');
                alert('Please fill in all required fields');
                return;
            }

            // Validate EIN/SSN format
            const einSsnRegex = /^(\d{2}-\d{7}|\d{3}-\d{2}-\d{4})$/;
            if (!einSsnRegex.test(einSsn)) {
                showAutoSaveIndicator('error');
                alert('Please enter a valid EIN (12-3456789) or SSN (123-45-6789)');
                return;
            }

            showAutoSaveIndicator('saving');

            // Upload front ID to Supabase Storage
            const frontFileName = `verification-id-front-${ProfileState.currentUser.id}-${Date.now()}`;
            const { data: frontData, error: frontError } = await window.supabaseClient.storage
                .from('practitioner-files')
                .upload(`verification/${ProfileState.currentUser.id}/${frontFileName}`, idFront);

            if (frontError) {
                console.error('[Rooted Vitality] Error uploading front ID:', frontError);
                showAutoSaveIndicator('error');
                alert('Error uploading front ID. Please try again.');
                return;
            }

            // Upload back ID to Supabase Storage
            const backFileName = `verification-id-back-${ProfileState.currentUser.id}-${Date.now()}`;
            const { data: backData, error: backError } = await window.supabaseClient.storage
                .from('practitioner-files')
                .upload(`verification/${ProfileState.currentUser.id}/${backFileName}`, idBack);

            if (backError) {
                console.error('[Rooted Vitality] Error uploading back ID:', backError);
                showAutoSaveIndicator('error');
                alert('Error uploading back ID. Please try again.');
                return;
            }

            // Get public URLs for the uploaded files
            const frontUrl = window.supabaseClient.storage
                .from('practitioner-files')
                .getPublicUrl(`verification/${ProfileState.currentUser.id}/${frontFileName}`).data.publicUrl;

            const backUrl = window.supabaseClient.storage
                .from('practitioner-files')
                .getPublicUrl(`verification/${ProfileState.currentUser.id}/${backFileName}`).data.publicUrl;

            // Update practitioner_credentials record with verification data
            const submissionTime = new Date().toISOString();
            const { error: updateError } = await window.supabaseClient
                .from('practitioner_credentials')
                .update({
                    verification_status: 'pending',
                    verification_ein_ssn_last4: einSsn.slice(-4),
                    verification_id_front_url: frontUrl,
                    verification_id_back_url: backUrl,
                    verification_submitted_at: submissionTime,
                    verification_updated_at: submissionTime,
                    verification_audit_trail: {
                        ein_ssn_last4: einSsn.slice(-4),
                        id_front_url: frontUrl,
                        id_back_url: backUrl,
                        submitted_at: submissionTime
                    }
                })
                .eq('id', ProfileState.practitionerData.id || ProfileState.currentUser.id);

            if (updateError) {
                console.error('[Rooted Vitality] Error saving verification data:', updateError);
                showAutoSaveIndicator('error');
                alert('Error saving verification data. Please try again.');
                return;
            }

            // Update local data
            ProfileState.practitionerData.verification_status = 'pending';
            ProfileState.practitionerData.verification_ein_ssn_last4 = einSsn.slice(-4);
            ProfileState.practitionerData.verification_id_front_url = frontUrl;
            ProfileState.practitionerData.verification_id_back_url = backUrl;
            ProfileState.practitionerData.verification_submitted_at = submissionTime;
            ProfileState.practitionerData.verification_updated_at = submissionTime;
            ProfileState.practitionerData.verification_audit_trail = {
                ein_ssn_last4: einSsn.slice(-4),
                id_front_url: frontUrl,
                id_back_url: backUrl,
                submitted_at: submissionTime
            };
            showAutoSaveIndicator('success');

            // Reset form and update display
            form.reset();
            checkVerificationStatus();
        } catch (error) {
            console.error('[Rooted Vitality] Error submitting verification:', error);
            showAutoSaveIndicator('error');
            alert('An unexpected error occurred. Please try again.');
        }
    });

    // Handle cancel button
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            form.reset();
            formContainer.style.display = 'none';
        });
    }
}

// ======================================================
// CREDENTIAL INPUT LISTENERS FOR AUTO-SAVE
// ======================================================

function setupCredentialInputListeners() {
    // Find all credential input fields and badge checkboxes
    const credentialInputs = document.querySelectorAll('.credential-input');
    const badgeCheckboxes = document.querySelectorAll('input[id^="badge-"]');
    
    const allFields = [...credentialInputs, ...badgeCheckboxes];
    
    allFields.forEach(field => {
        // Remove old listener to avoid duplicates
        field.removeEventListener('change', handleCredentialInputChange);
        field.removeEventListener('input', handleCredentialInputChange);
        
        // Add new listener based on field type
        if (field.type === 'checkbox') {
            field.addEventListener('change', handleCredentialInputChange);
        } else {
            field.addEventListener('input', handleCredentialInputChange);
        }
    });
}

function handleCredentialInputChange() {
    // Debounce auto-save
    if (ProfileState.autoSaveTimeout) {
        clearTimeout(ProfileState.autoSaveTimeout);
    }
    
    ProfileState.autoSaveTimeout = setTimeout(() => {
        if (typeof executeSave === 'function') {
            executeSave('credentials', true);
        }
    }, ProfileState.AUTO_SAVE_DELAY || 1500);
}

// ======================================================
// SAVE CREDENTIALS TO DATABASE
// ======================================================

/**
 * Save all credentials (education, licenses, certifications) to database
 * Persists ProfileState credential arrays to practitioner_credentials table
 * All credentials are combined into a single JSONB 'credentials' array with type field
 */
async function saveSectionCredentials() {
    try {
        // Get current practitioner ID and serial number
        const userId = window.currentPractitionerId || ProfileState.practitionerData?.id;
        const serialNumber = ProfileState.practitionerData?.serial_number;
        
        if (!userId) {
            console.error('[Credentials] Cannot save: no user ID');
            return;
        }
        
        // Combine all credential types into a single array with type field
        const allCredentials = [
            ...(ProfileState.educationCredentials || []).map(c => ({ 
                ...c, 
                credential_type: 'degree',
                id: c.id || Date.now()
            })),
            ...(ProfileState.licenseCredentials || []).map(c => ({ 
                ...c, 
                credential_type: 'license',
                id: c.id || Date.now()
            })),
            ...(ProfileState.certificationCredentials || []).map(c => ({ 
                ...c, 
                credential_type: 'certification',
                id: c.id || Date.now()
            }))
        ];
        
        // Build credentials object for practitioner_credentials table
        const credentialsToSave = {
            credentials: allCredentials,
            updated_at: new Date().toISOString()
        };
        
        // AUTOMATICALLY set badges based on credentials saved
        // Pro accepts all responsibility for accurate information
        // Only set badge to true if there are actual filled-in credentials
        const filledEducation = (ProfileState.educationCredentials || []).filter(c => c.institution || c.field_of_study);
        const filledLicenses = (ProfileState.licenseCredentials || []).filter(c => c.license_number || c.license_type);
        const filledCertifications = (ProfileState.certificationCredentials || []).filter(c => c.certification_name || c.issuing_organization);
        
        if (filledEducation.length > 0) {
            credentialsToSave.badge_certified = true; // Has education/degrees
        }
        if (filledLicenses.length > 0) {
            credentialsToSave.badge_licensed = true; // Has licenses
        }
        if (filledCertifications.length > 0) {
            credentialsToSave.badge_certified = true; // Has certifications
        }
        
        // Add practitioner_serial if available (helps with lookups and RLS)
        if (serialNumber) {
            credentialsToSave.practitioner_serial = serialNumber;
        }
        
        // Update or insert into practitioner_credentials table
        // Using upsert with onConflict on 'id' column
        const { error } = await window.supabaseClient
            .from('practitioner_credentials')
            .upsert({
                id: userId,
                ...credentialsToSave
            }, {
                onConflict: 'id'
            });
        
        if (error) {
            console.error('[Credentials] Save failed:', error);
            throw error;
        }
        
        // Update ProfileState with new badge values so completeness calculation sees them
        if (credentialsToSave.badge_certified !== undefined) {
            ProfileState.practitionerData.badge_certified = credentialsToSave.badge_certified;
        }
        if (credentialsToSave.badge_licensed !== undefined) {
            ProfileState.practitionerData.badge_licensed = credentialsToSave.badge_licensed;
        }
        
        // Update completeness after successful save
        if (typeof updateProfileCompleteness === 'function') {
            updateProfileCompleteness();
        }
        
        return true;
        
    } catch (error) {
        console.error('[Credentials] Error saving credentials:', error);
        throw error;
    }
}

// Make function globally available
window.saveSectionCredentials = saveSectionCredentials;

