// ╔════════════════════════════════════════════════════════════════════════════╗
// ║  ROOTED VITALITY, INC.                                                     ║
// ║  File: dashboard/pro/scripts/practitioner-signup.js                        ║
// ║  Purpose: Multi-step practitioner registration wizard with auto-approval   ║
// ║  Holistic Wellness · Modern Connection Platform                            ║
// ║  rootedvitality.com | 2025                                                 ║
// ╚════════════════════════════════════════════════════════════════════════════╝
//
// TABLE OF CONTENTS
//   1. STATE & CONFIG
//   2. INITIALIZATION
//   3. FORM STATE MANAGEMENT
//   4. FORM VALIDATION
//   5. STEP NAVIGATION
//   6. SKIP MEMBERSHIP (Without Activation)
//   7. FORM SUBMISSION (AUTO-REGISTERED)
//   8. EVENT LISTENERS
//
// ═══════════════════════════════════════════════════════════════════════════

// Global error suppression (extensions only)
window.onerror = (msg, src, line, col, err) => {
    if (msg && (msg.includes('content.js') || msg.includes('Extension'))) return true;
    return false;
};

// ═══════════════════════════════════════════════════════════════════════════
// 1. STATE & CONFIG
// ═══════════════════════════════════════════════════════════════════════════

const state = {
    currentStep: 1,
    totalSteps: 3,
    session: null,
    formData: {
        legal_name: '',
        legal_business_name: '',
        dba_name: '',
        year_established: '',
        business_size: '',
        phone: '',
        physical_address: '',
        practice_city: '',
        practice_state: '',
        zipcode: '',
        email: '',
    },
};

const STORAGE_KEY = 'practitioner_registration_draft';
let autoSaveTimeout;

// ═══════════════════════════════════════════════════════════════════════════
// 2. INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

async function initializeAuth() {
    try {
        // Wait a moment to ensure Supabase is fully initialized
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (!window.supabaseClient) {
            return false;
        }
        
        // Get the current authenticated user
        const { data: { user }, error } = await window.supabaseClient.auth.getUser();
        
        if (error || !user) {
            window.location.href = '/rooted-vitality/index.html';
            return false;
        }
        
        // Store the authenticated user info
        state.session = user;
        
        // Get email from clients table (the primary source)
        let userEmail = '';
        
        try {
            const { data: clientData, error: clientError } = await window.supabaseClient
                .from('clients')
                .select('email')
                .eq('id', user.id)
                .single();
            
            if (clientData && clientData.email) {
                userEmail = clientData.email;
            }
        } catch (e) {
            // Email fetch error - continue with auth email
        }
        
        // Populate the email field with the user's email
        const emailElement = document.getElementById('email');
        
        if (emailElement) {
            emailElement.value = userEmail;
        }
        
        state.formData.email = userEmail;
        
        loadDraft();
        return true;
    } catch (error) {
        return false;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. FORM STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

function updateFormData() {
    const form = document.getElementById('practitionerForm');
    const formData = new FormData(form);
    
    for (let [key, value] of formData) {
        if (key in state.formData) {
            state.formData[key] = value;
        }
    }
    
    autoSave();
}

function autoSave() {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
        saveDraft();
    }, 1000);
}

function saveDraft() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.formData));
    } catch (e) {
        // Draft save error - continue silently
    }
}

function loadDraft() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const draft = JSON.parse(saved);
            // Don't restore email from draft - it should always be the current user's email
            const { email, ...draftWithoutEmail } = draft;
            state.formData = { ...state.formData, ...draftWithoutEmail };
            
            Object.keys(draftWithoutEmail).forEach(key => {
                const field = document.getElementById(key);
                if (field) field.value = draftWithoutEmail[key];
            });
        }
    } catch (e) {
        // Draft load error - continue with fresh form
    }
}

function clearDraft() {
    localStorage.removeItem(STORAGE_KEY);
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. FORM VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

function validateStep(stepNum) {
    const step = document.querySelector(`.form-step[data-step="${stepNum}"]`);
    if (!step) return true;
    
    const inputs = step.querySelectorAll('input[required], select[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        // Skip readonly fields (like email) in validation
        if (input.readOnly) return;
        
        if (!input.value.trim()) {
            isValid = false;
            input.classList.add('error');
        } else {
            input.classList.remove('error');
        }
    });
    
    return isValid;
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. STEP NAVIGATION
// ═══════════════════════════════════════════════════════════════════════════

function updateProgress() {
    // Step 1: Business info fields (legal name, legal business name, dba, year, size, phone, address, zipcode)
    const step1Fields = document.querySelectorAll('[name="legal_name"], [name="legal_business_name"], [name="dba_name"], [name="year_established"], [name="business_size"], [name="phone"], [name="physical_address"], [name="zipcode"]');
    let step1Filled = 0;
    step1Fields.forEach(field => {
        if (field.value && field.value.trim()) step1Filled++;
    });
    const step1Complete = step1Filled === step1Fields.length;
    
    // Step 2: Legal agreement checkboxes
    const agreeTerms = document.getElementById('agreeTerms');
    const confirmAccuracy = document.getElementById('confirmAccuracy');
    const step2CheckboxesFilled = (agreeTerms && agreeTerms.checked ? 1 : 0) + (confirmAccuracy && confirmAccuracy.checked ? 1 : 0);
    const step2CheckboxesTotal = 2;
    const step2Complete = agreeTerms && agreeTerms.checked && confirmAccuracy && confirmAccuracy.checked;
    
    // Step 3: Membership checkbox
    const agreeMembership = document.getElementById('agreeMembership');
    const step3CheckboxesFilled = agreeMembership && agreeMembership.checked ? 1 : 0;
    const step3CheckboxesTotal = 1;
    const step3Complete = agreeMembership && agreeMembership.checked;
    
    // Calculate overall progress percentage
    // Total: 8 (step 1 fields) + 2 (step 2 checkboxes) + 1 (step 3 checkbox) = 11
    const totalRequiredFields = step1Fields.length + step2CheckboxesTotal + step3CheckboxesTotal;
    const totalFilledFields = step1Filled + step2CheckboxesFilled + step3CheckboxesFilled;
    const percent = totalRequiredFields > 0 ? (totalFilledFields / totalRequiredFields) * 100 : 0;
    
    const bar = document.getElementById('progressBar');
    if (bar) {
        bar.style.setProperty('--progress-width', percent + '%');
    }
    
    // Update step indicator styles
    document.querySelectorAll('.step').forEach(step => {
        const stepNum = parseInt(step.getAttribute('data-step'));
        step.classList.remove('active', 'completed');
        
        if (stepNum === 1) {
            if (step1Complete) {
                step.classList.add('completed');
            } else {
                step.classList.add('active');
            }
        } else if (stepNum === 2) {
            if (step2Complete) {
                step.classList.add('completed');
            } else if (step1Complete) {
                step.classList.add('active');
            }
        } else if (stepNum === 3) {
            if (step3Complete) {
                step.classList.add('completed');
            } else if (step2Complete) {
                step.classList.add('active');
            }
        }
    });
}

function showStep(stepNum) {
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
    });
    
    const step = document.querySelector(`.form-step[data-step="${stepNum}"]`);
    if (step) {
        step.classList.add('active');
    }
    
    updateProgress();
    window.scrollTo(0, 0);
}

function nextStep() {
    if (!validateStep(state.currentStep)) {
        return;
    }
    
    updateFormData();
    
    if (state.currentStep < state.totalSteps) {
        state.currentStep++;
        showStep(state.currentStep);
    }
}

function prevStep() {
    updateFormData();
    
    if (state.currentStep > 1) {
        state.currentStep--;
        showStep(state.currentStep);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. SKIP MEMBERSHIP (Without Activation)
// ═══════════════════════════════════════════════════════════════════════════

async function skipMembership(event) {
    event.preventDefault();
    
    try {
        const skipBtn = document.getElementById('skipMembershipBtn');
        skipBtn.disabled = true;
        skipBtn.textContent = 'Finishing setup...';
        
        // Validate all steps first
        if (!validateStep(1) || !validateStep(2)) {
            skipBtn.disabled = false;
            skipBtn.textContent = 'Skip for Now';
            return;
        }
        
        updateFormData();
        
        // Check required fields
        if (!state.formData.legal_name || !state.formData.legal_business_name || !state.formData.dba_name || 
            !state.formData.business_size || !state.formData.phone || !state.formData.physical_address || 
            !state.formData.practice_city || !state.formData.practice_state || !state.formData.zipcode) {
            skipBtn.disabled = false;
            skipBtn.textContent = 'Skip for Now';
            return;
        }
        
        // Check legal agreement checkboxes
        if (!document.getElementById('agreeTerms').checked || 
            !document.getElementById('confirmAccuracy').checked) {
            skipBtn.disabled = false;
            skipBtn.textContent = 'Skip for Now';
            return;
        }
        
        // Save practitioner to database (without membership)
        const payload = {
            id: state.session.id,
            email: state.formData.email || state.session.email,
            legal_name: state.formData.legal_name,
            legal_business_name: state.formData.legal_business_name,
            dba_name: state.formData.dba_name,
            phone: state.formData.phone,
            physical_address: state.formData.physical_address,
            practice_city: state.formData.practice_city,
            practice_state: state.formData.practice_state,
            zipcode: state.formData.zipcode,
            business_size: state.formData.business_size,
            status: 'registered',
            submitted_at: new Date().toISOString(),
            // Default values for availability
            in_person_enabled: false,
            virtual_enabled: false,
            housecalls_enabled: false,
            timezone: 'America/Denver',
            // Default settings
            matching_enabled: true,
            matching_paused: false,
            notification_preferences: JSON.stringify({
                email_matches: true,
                email_messages: true,
                email_reviews: true
            }),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        // First check if practitioner already exists
        const { data: existingPractitioner, error: checkError } = await window.supabaseClient
            .from('practitioners')
            .select('id')
            .eq('id', state.session.id)
            .single();
        
        let error;
        if (checkError && checkError.code !== 'PGRST116') {
            // PGRST116 means no rows found, which is expected for new practitioners
            throw new Error('Error checking for existing practitioner: ' + checkError.message);
        }
        
        if (existingPractitioner) {
            // Practitioner exists - UPDATE instead of INSERT
            const { error: updateError } = await window.supabaseClient
                .from('practitioners')
                .update({
                    email: payload.email,
                    legal_name: payload.legal_name,
                    legal_business_name: payload.legal_business_name,
                    dba_name: payload.dba_name,
                    phone: payload.phone,
                    physical_address: payload.physical_address,
                    practice_city: payload.practice_city,
                    practice_state: payload.practice_state,
                    zipcode: payload.zipcode,
                    business_size: payload.business_size,
                    status: payload.status,
                    submitted_at: payload.submitted_at,
                    in_person_enabled: payload.in_person_enabled,
                    virtual_enabled: payload.virtual_enabled,
                    housecalls_enabled: payload.housecalls_enabled,
                    timezone: payload.timezone,
                    matching_enabled: payload.matching_enabled,
                    matching_paused: payload.matching_paused,
                    notification_preferences: payload.notification_preferences,
                    updated_at: payload.updated_at
                })
                .eq('id', state.session.id);
            
            error = updateError;
        } else {
            // New practitioner - INSERT
            const { error: insertError } = await window.supabaseClient
                .from('practitioners')
                .insert([payload])
                .select()
                .single();
            
            error = insertError;
        }
        
        if (error) {
            throw new Error(error.message);
        }
        
        // Fetch the practitioner serial number and id
        // Add small delay to ensure INSERT has propagated
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { data: practitionerData, error: fetchError } = await window.supabaseClient
            .from('practitioners')
            .select('id, serial_number')
            .eq('id', state.session.id)
            .single();
        
        if (fetchError) {
            // Continue anyway - related tables will be created later if needed
            console.warn('[Practitioner Signup] Warning fetching practitioner data:', fetchError.message);
        } else if (!practitionerData) {
            // Continue anyway
            console.warn('[Practitioner Signup] No practitioner data returned');
        } else {
            const practitionerSerial = practitionerData.serial_number;
            const practitionerId = practitionerData.id;
            
            // Create practitioner profile record via RPC (SECURITY DEFINER bypasses RLS)
            const { data: profileData, error: profileError } = await window.supabaseClient
                .rpc('create_practitioner_profile_signup', {
                    p_practitioner_serial: practitionerSerial,
                    p_practitioner_id: practitionerId,
                    p_year_established: state.formData.year_established ? parseInt(state.formData.year_established) : null
                });
            
            if (profileError) {
                throw new Error(`Profile creation failed: ${profileError.message}`);
            }
            
            if (!profileData) {
                throw new Error('Profile creation returned no ID');
            }
            
            // Create notification settings record via RPC (SECURITY DEFINER bypasses RLS)
            const { data: notifSettingsData, error: notifSettingsError } = await window.supabaseClient
                .rpc('create_practitioner_notification_settings_signup', {
                    p_practitioner_serial: practitionerSerial
                });
            
            if (notifSettingsError) {
                throw new Error(`Notification settings creation failed: ${notifSettingsError.message}`);
            }
            
            if (!notifSettingsData) {
                throw new Error('Notification settings creation returned no ID');
            }
            
            // Create welcome notification for practitioner via RPC (SECURITY DEFINER bypasses RLS)
            const { data: notifData, error: notifError } = await window.supabaseClient
                .rpc('create_welcome_notification_signup', {
                    p_practitioner_serial: practitionerSerial
                });
            
            if (notifError) {
                throw new Error(`Welcome notification creation failed: ${notifError.message}`);
            }
            
            if (!notifData) {
                throw new Error('Welcome notification creation returned no ID');
            }
            
            // Create membership record via RPC (SECURITY DEFINER bypasses RLS)
            const { data: membershipData, error: membershipError } = await window.supabaseClient
                .rpc('create_practitioner_membership_signup', {
                    p_practitioner_id: practitionerId,
                    p_practitioner_serial: practitionerSerial
                });

            if (membershipError) {
                throw new Error(`Membership creation failed: ${membershipError.message}`);
            }
            
            if (!membershipData) {
                throw new Error('Membership creation returned no ID');
            }
        }
        
        // Update user role in localStorage
        const currentUser = window.authManager.getCurrentUser();
        if (currentUser) {
            currentUser.role = 'practitioner';
            localStorage.setItem('rvUser', JSON.stringify(currentUser));
        }
        
        // Clear draft
        clearDraft();
        
        // Complete the registration flow
        completeRegistrationFlow(false);
        
    } catch (error) {
        const skipBtn = document.getElementById('skipMembershipBtn');
        skipBtn.disabled = false;
        skipBtn.textContent = 'Skip for Now';
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. FORM SUBMISSION (AUTO-REGISTERED)
// ═══════════════════════════════════════════════════════════════════════════

async function registerPractitioner(event) {
    event.preventDefault();
    
    if (!validateStep(state.currentStep)) {
        return;
    }
    
    updateFormData();
    
    // Check required fields
    if (!state.formData.legal_name || !state.formData.legal_business_name || !state.formData.dba_name || 
        !state.formData.year_established || !state.formData.business_size || 
        !state.formData.phone || !state.formData.physical_address || !state.formData.practice_city || 
        !state.formData.practice_state || !state.formData.zipcode) {
        return;
    }
    
    // Check checkboxes
    if (!document.getElementById('agreeTerms').checked || 
        !document.getElementById('confirmAccuracy').checked) {
        return;
    }
    
    // Check membership agreement
    if (!document.getElementById('agreeMembership').checked) {
        return;
    }
    
    try {
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Registering...';
        
        const payload = {
            id: state.session.id,
            email: state.formData.email || state.session.email,
            legal_name: state.formData.legal_name,
            legal_business_name: state.formData.legal_business_name,
            dba_name: state.formData.dba_name,
            phone: state.formData.phone,
            physical_address: state.formData.physical_address,
            practice_city: state.formData.practice_city,
            practice_state: state.formData.practice_state,
            zipcode: state.formData.zipcode,
            business_size: state.formData.business_size,
            status: 'registered',
            submitted_at: new Date().toISOString(),
            // Default values for availability
            in_person_enabled: false,
            virtual_enabled: false,
            housecalls_enabled: false,
            timezone: 'America/Denver',
            // Default settings
            matching_enabled: true,
            matching_paused: false,
            notification_preferences: JSON.stringify({
                email_matches: true,
                email_messages: true,
                email_reviews: true
            }),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        const { error } = await window.supabaseClient
            .from('practitioners')
            .upsert([payload])
            .select()
            .single();
        
        if (error) {
            throw new Error(error.message);
        }
        
        // Update practitioners table to mark as practitioner
        const { error: practError } = await window.supabaseClient
            .from('practitioners')
            .update({ 
                updated_at: new Date().toISOString()
            })
            .eq('id', state.session.id);  // Use 'id' not 'user_id'
        
        if (practError) {
            // Warning: Could not update practitioner record - continue anyway
        } else {
            // Practitioner record updated
        }

        // Fetch the practitioner serial number for membership creation
        const { data: practitionerData, error: fetchError } = await window.supabaseClient
            .from('practitioners')
            .select('serial_number')
            .eq('id', state.session.id)
            .single();
        
        const practitionerSerial = practitionerData?.serial_number || null;
        
        if (fetchError) {
            // Warning: Could not fetch practitioner serial - continue anyway
        }

        // Create membership record
        if (practitionerSerial) {
            const membershipRecord = {
                practitioner_id: state.session.id,
                practitioner_serial: practitionerSerial,
                status: 'inactive',  // Start as inactive until payment succeeds
                started_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            const { error: membershipError } = await window.supabaseClient
                .from('memberships')
                .insert([membershipRecord]);
            
            if (membershipError) {
                // Warning: Could not create membership record - continue anyway
            }

            // Create practitioner profile record
            const profileRecord = {
                practitioner_serial: practitionerSerial,
                profile_completeness_percent: 10,
                languages: ['English'],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            const { error: profileError } = await window.supabaseClient
                .from('practitioner_profiles')
                .insert([profileRecord]);
            
            if (profileError) {
                // Warning: Could not create practitioner profile record - continue anyway
            }

            // Create notification settings record
            // Note: matches_in_app and matches_email default to OFF
            // Practitioners must have an active membership to enable matches
            const notifSettingsRecord = {
                practitioner_serial: practitionerSerial,
                messages_in_app: true,
                messages_email: true,
                messages_sms: false,
                matches_in_app: false,
                matches_email: false,
                matches_sms: false,
                reviews_in_app: true,
                reviews_email: true,
                reviews_sms: false,
                promotions_in_app: true,
                promotions_email: false,
                promotions_sms: false,
                system_in_app: true,
                system_sms: false,
                system_email: true,
                account_in_app: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            const { error: notifSettingsError } = await window.supabaseClient
                .from('practitioner_notification_settings')
                .insert([notifSettingsRecord]);
            
            if (notifSettingsError) {
                // Warning: Could not create notification settings record - continue anyway
            }
        }

        // Create welcome notification for practitioner via RPC (SECURITY DEFINER bypasses RLS)
        const { data: notifData, error: notifError } = await window.supabaseClient
            .rpc('create_welcome_notification_signup', {
                p_practitioner_serial: practitionerSerial
            });
        
        if (notifError) {
            throw new Error(`Welcome notification creation failed: ${notifError.message}`);
        }
        
        if (!notifData) {
            throw new Error('Welcome notification creation returned no ID');
        }
        
        // Hide form and show success modal
        document.getElementById('practitionerForm').classList.add('hidden');
        const modal = document.getElementById('successModal');
        modal.classList.remove('hidden');
        
        // Update user role in localStorage to reflect practitioner status
        const currentUser = window.authManager.getCurrentUser();
        if (currentUser) {
            currentUser.role = 'practitioner';
            localStorage.setItem('rvUser', JSON.stringify(currentUser));
        }
        
        // Clear draft
        clearDraft();
        
        // Launch Stripe checkout for membership activation
        try {
            // Call the Edge Function to create checkout session
            const checkoutResponse = await fetch(
                'https://racktdyrveypyvmdbzs.supabase.co/functions/v1/create-checkout-session',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${state.session.access_token}`
                    },
                    body: JSON.stringify({
                        practitioner_id: state.session.id
                    })
                }
            );
            
            if (!checkoutResponse.ok) {
                throw new Error('Failed to create checkout session');
            }
            
            const checkoutData = await checkoutResponse.json();
            
            if (checkoutData.checkout_url) {
                // Redirect to Stripe checkout
                window.location.href = checkoutData.checkout_url;
            } else {
                // Fallback if checkout URL not returned
                completeRegistrationFlow(true);
            }
        } catch (stripeError) {
            // If Stripe fails, still complete registration
            completeRegistrationFlow(true);
        }
        
    } catch (error) {
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Activate Membership';
    }
}

/**
 * Complete the registration flow and redirect to dashboard
 * @param {boolean} withMembership - Whether membership was activated
 */
function completeRegistrationFlow(withMembership) {
    try {
        // Hide form and show success modal
        document.getElementById('practitionerForm').classList.add('hidden');
        const modal = document.getElementById('successModal');
        modal.classList.remove('hidden');
        
        // Redirect to practitioner profile page after 3 seconds
        setTimeout(() => {
            window.location.href = '/rooted-vitality/dashboard/pro/pages/profile.html';
        }, 3000);
    } catch (error) {
        // Silent error handling
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 8. EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {
    const authOk = await initializeAuth();
    if (!authOk) {
        return;
    }
    
    const form = document.getElementById('practitionerForm');
    form.addEventListener('submit', registerPractitioner);
    form.addEventListener('input', updateFormData);
    
    // Add event listeners to update progress on any field change
    const allInputs = document.querySelectorAll('input[required], select[required], textarea[required], input[type="checkbox"]');
    allInputs.forEach(input => {
        input.addEventListener('input', updateProgress);
        input.addEventListener('change', updateProgress);
    });
    
    document.getElementById('step1Next').addEventListener('click', nextStep);
    document.getElementById('step2Prev').addEventListener('click', prevStep);
    document.getElementById('step2Next').addEventListener('click', nextStep);
    document.getElementById('step3Prev').addEventListener('click', prevStep);
    document.getElementById('skipMembershipBtn').addEventListener('click', skipMembership);
    
    showStep(1);
    updateProgress(); // Initialize progress on page load
});

window.addEventListener('beforeunload', () => {
    updateFormData();
    saveDraft();
});
