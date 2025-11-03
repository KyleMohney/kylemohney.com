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
        legal_business_name: '',
        dba_name: '',
        year_established: '',
        business_size: '',
        phone: '',
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
        if (!window.supabaseClient) {
            console.error('[Signup] supabaseClient not available');
            return false;
        }
        
        const { data: { user }, error } = await window.supabaseClient.auth.getUser();
        
        if (error || !user) {
            console.warn('[Signup] No active session, redirecting');
            window.location.href = '../index.html';
            return false;
        }
        
        state.session = user;
        document.getElementById('email').value = user.email || '';
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
            state.formData = { ...state.formData, ...draft };
            
            Object.keys(draft).forEach(key => {
                const field = document.getElementById(key);
                if (field) field.value = draft[key];
            });
            
            console.log('[Signup] Draft loaded');
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
    const percent = (state.currentStep / state.totalSteps) * 100;
    const bar = document.getElementById('progressBar');
    if (bar) bar.style.width = percent + '%';
    
    const pct = document.getElementById('progressPercentage');
    if (pct) pct.textContent = Math.round(percent) + '%';
    
    document.querySelectorAll('.step').forEach(step => {
        const stepNum = parseInt(step.getAttribute('data-step'));
        step.classList.remove('active', 'completed');
        
        if (stepNum === state.currentStep) {
            step.classList.add('active');
        } else if (stepNum < state.currentStep) {
            step.classList.add('completed');
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
    if (!state.formData.legal_business_name || !state.formData.dba_name || 
        !state.formData.year_established || !state.formData.business_size || 
        !state.formData.phone) {
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
            user_id: state.session.id,
            email: state.session.email,
            legal_business_name: state.formData.legal_business_name,
            dba_name: state.formData.dba_name,
            year_established: parseInt(state.formData.year_established),
            business_size: state.formData.business_size,
            phone: state.formData.phone,
            status: 'registered',
            submitted_at: new Date().toISOString(),
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
        
        // Update profile to set role as practitioner
        const { error: profileError } = await window.supabaseClient
            .from('profiles')
            .update({ 
                role: 'practitioner',
                is_practitioner: true 
            })
            .eq('id', state.session.id);
        
        if (profileError) {
            console.error('[Signup] Warning: Could not update profile role:', profileError);
        } else {
            console.log('[Signup] Profile updated with practitioner role');
        }
        
        // Hide form and show success modal
        document.getElementById('practitionerForm').style.display = 'none';
        const modal = document.getElementById('successModal');
        modal.classList.remove('hidden');
        
        // Clear draft
        clearDraft();
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
            window.location.href = '/dashboard/pro/';
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
    
    document.getElementById('step1Next').addEventListener('click', nextStep);
    document.getElementById('step2Prev').addEventListener('click', prevStep);
    
    showStep(1);
    console.log('[Signup] Ready');
});

window.addEventListener('beforeunload', () => {
    updateFormData();
    saveDraft();
});
