// ═══════════════════════════════════════════════════════════════════════════
// ROOTED VITALITY, INC.
// File: scripts/practitioner-signup.js
// Purpose: 2-step practitioner registration wizard with auto-approval
// Holistic Wellness · Modern Connection Platform
// rootedvitality.com | 2025
// ═══════════════════════════════════════════════════════════════════════════

// Global error suppression (extensions only)
window.onerror = (msg, src, line, col, err) => {
    if (msg && (msg.includes('content.js') || msg.includes('Extension'))) return true;
    console.error('[Rooted Vitality Error]', msg);
};

// ═══════════════════════════════════════════════════════════════════════════
// 1. STATE & CONFIG
// ═══════════════════════════════════════════════════════════════════════════

const state = {
    currentStep: 1,
    totalSteps: 2,
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
            console.error('[Signup] supabaseClient not available');
            return false;
        }
        
        // Get the current authenticated user
        const { data: { user }, error } = await window.supabaseClient.auth.getUser();
        
        console.log('[Signup] Auth check - user:', user?.email || 'none', 'error:', error?.message || 'none');
        
        if (error || !user) {
            console.warn('[Signup] No active session, redirecting to index');
            window.location.href = '/rooted-vitality/index.html';
            return false;
        }
        
        // Store the authenticated user info
        state.session = user;
        
        // Populate the email field with the current user's email
        const emailElement = document.getElementById('email');
        if (emailElement) {
            emailElement.value = user.email || '';
            console.log('[Signup] Email field populated with:', user.email);
        } else {
            console.error('[Signup] Email element not found');
        }
        
        state.formData.email = user.email || '';
        
        loadDraft();
        return true;
    } catch (error) {
        console.error('[Signup] Init error:', error);
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
        console.log('[Signup] Draft saved');
    } catch (e) {
        console.warn('[Signup] Could not save draft');
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
            
            console.log('[Signup] Draft loaded (email preserved from current session)');
        }
    } catch (e) {
        console.warn('[Signup] Could not load draft');
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
    
    // Step 2: Legal agreement checkboxes (required for submission)
    const agreeTerms = document.getElementById('agreeTerms');
    const confirmAccuracy = document.getElementById('confirmAccuracy');
    const step2CheckboxesFilled = (agreeTerms && agreeTerms.checked ? 1 : 0) + (confirmAccuracy && confirmAccuracy.checked ? 1 : 0);
    const step2CheckboxesTotal = 2;
    const step2Complete = agreeTerms && agreeTerms.checked && confirmAccuracy && confirmAccuracy.checked;
    
    // Calculate overall progress percentage
    // Total: 7 (step 1 fields) + 2 (step 2 checkboxes) = 9
    const totalRequiredFields = step1Fields.length + step2CheckboxesTotal;
    const totalFilledFields = step1Filled + step2CheckboxesFilled;
    const percent = totalRequiredFields > 0 ? (totalFilledFields / totalRequiredFields) * 100 : 0;
    
    const bar = document.getElementById('progressBar');
    if (bar) {
        bar.style.width = percent + '%';
    }
    
    const pct = document.getElementById('progressPercentage');
    if (pct) pct.textContent = Math.round(percent) + '%';
    
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
        console.warn('[Signup] Validation failed for step', state.currentStep);
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
// 6. FORM SUBMISSION (AUTO-REGISTERED)
// ═══════════════════════════════════════════════════════════════════════════

async function registerPractitioner(event) {
    event.preventDefault();
    
    if (!validateStep(state.currentStep)) {
        console.warn('[Signup] Final validation failed');
        return;
    }
    
    updateFormData();
    
    // Check required fields
    if (!state.formData.legal_name || !state.formData.legal_business_name || !state.formData.dba_name || 
        !state.formData.year_established || !state.formData.business_size || 
        !state.formData.phone || !state.formData.physical_address || !state.formData.practice_city || 
        !state.formData.practice_state || !state.formData.zipcode) {
        alert('Please complete all required fields.');
        return;
    }
    
    // Check checkboxes
    if (!document.getElementById('agreeTerms').checked || 
        !document.getElementById('confirmAccuracy').checked) {
        alert('Please agree to the terms.');
        return;
    }
    
    try {
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Registering...';
        
        const payload = {
            id: state.session.id,  // Use 'id' not 'user_id' - id is the auth.users link
            email: state.session.email,
            legal_name: state.formData.legal_name,
            legal_business_name: state.formData.legal_business_name,
            dba_name: state.formData.dba_name,
            year_established: parseInt(state.formData.year_established),
            business_size: state.formData.business_size,
            phone: state.formData.phone,
            physical_address: state.formData.physical_address,
            practice_city: state.formData.practice_city,
            practice_state: state.formData.practice_state,
            zipcode: state.formData.zipcode,
            status: 'registered',
            submitted_at: new Date().toISOString(),
            // Capture all practitioner table fields with proper types
            bio: null,
            ethos_statement: null,
            modalities: [], // TEXT[] array
            conditions_treated: [], // TEXT[] array
            languages: ['English'], // TEXT[] array
            credentials: JSON.stringify([]), // JSONB
            credentials_verified: false,
            badge_verified: false,
            badge_certified: false,
            badge_licensed: false,
            badge_background_check: null,  // TEXT: null | 'pending' | 'passed' | 'failed'
            accepts_insurance: false,
            insurance_accepted: [], // TEXT[] array
            insurance_providers: [], // TEXT[] array
            custom_insurance_providers: [], // TEXT[] array
            payment_methods: [], // TEXT[] array
            custom_payment_methods: [], // TEXT[] array
            pricing: null,
            practice_type: null,
            practice_logo_url: null,
            intro_video_url: null,
            gallery_photos: JSON.stringify([]), // JSONB
            service_category_ids: [], // TEXT[] array
            service_category_names: [], // TEXT[] array
            service_subcategory_ids: [], // TEXT[] array
            service_subcategory_names: [], // TEXT[] array
            social_media: JSON.stringify({}), // JSONB
            notification_preferences: JSON.stringify({
                email_matches: true,
                email_messages: true,
                email_reviews: true
            }), // JSONB
            // Availability defaults
            in_person_enabled: false,
            in_person_option: null,
            in_person_base_zipcode: null,
            in_person_radius_miles: null,
            in_person_zipcodes: [], // TEXT[] array
            housecalls_enabled: false,
            housecalls_option: null,
            housecalls_base_zipcode: null,
            housecalls_radius_miles: null,
            housecalls_zipcodes: [], // TEXT[] array
            virtual_enabled: false,
            virtual_option: null,
            virtual_states: [], // TEXT[] array
            timezone: 'America/Denver',
            availability_schedule: JSON.stringify({}), // JSONB
            availability_last_updated: null,
            // Matching settings
            matching_enabled: true,
            matching_paused: false,
            profile_completion_percent: 10,
            faq: null,
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
        
        console.log('[Signup] Registered successfully');
        
        // Update practitioners table to mark as practitioner
        const { error: practError } = await window.supabaseClient
            .from('practitioners')
            .update({ 
                updated_at: new Date().toISOString()
            })
            .eq('id', state.session.id);  // Use 'id' not 'user_id'
        
        if (practError) {
            console.error('[Signup] Warning: Could not update practitioner record:', practError);
        } else {
            console.log('[Signup] Practitioner record updated');
        }

        // Create welcome notification for practitioner
        const welcomeNotification = {
            practitioner_id: state.session.id,
            type: 'welcome',
            title: 'Welcome to Rooted Vitality!',
            message: 'Thank you for signing up to help others on their wellness journey! Complete your profile and set your match preferences to start connecting with clients who need your expertise.',
            is_read: false,
            created_at: new Date().toISOString()
        };

        const { error: notifError } = await window.supabaseClient
            .from('practitioner_notifications')
            .insert([welcomeNotification]);
        
        if (notifError) {
            console.warn('[Signup] Welcome notification insertion warning:', notifError);
        } else {
            console.log('[Signup] Welcome notification created');
        }
        
        // Hide form and show success modal
        document.getElementById('practitionerForm').style.display = 'none';
        const modal = document.getElementById('successModal');
        modal.classList.remove('hidden');
        
        // Update user role in localStorage to reflect practitioner status
        const currentUser = window.authManager.getCurrentUser();
        if (currentUser) {
            currentUser.role = 'practitioner';
            localStorage.setItem('rvUser', JSON.stringify(currentUser));
            console.log('[Signup] Updated user role to practitioner in localStorage');
        }
        
        // Clear draft
        clearDraft();
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
            const baseUrl = (typeof RootedVitality !== 'undefined' && RootedVitality.config.siteUrl) ? RootedVitality.config.siteUrl : '/rooted-vitality/';
            window.location.href = baseUrl + 'dashboard/pro/';
        }, 3000);
        
        
    } catch (error) {
        console.error('[Signup] Error:', error);
        alert('Error: ' + error.message);
        
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Registration';
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Signup] Initializing...');
    
    const authOk = await initializeAuth();
    if (!authOk) {
        console.error('[Signup] Auth failed');
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
    
    showStep(1);
    updateProgress(); // Initialize progress on page load
    console.log('[Signup] Ready');
});

window.addEventListener('beforeunload', () => {
    updateFormData();
    saveDraft();
});
