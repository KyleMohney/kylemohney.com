/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: dashboard/pro/scripts/practitioner-profile.js               ║
║  Purpose: Practitioner profile page with inline editing & auto-save║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

TABLE OF CONTENTS:
  1. Quick Stats
  2. Languages
  3. FAQ
  4. Insurance Providers
  5. Payment Methods
  6. Practice Type & Setting
  7. Payments & Insurance Handling
  8. Reviews & Testimonials
  9. Profile.js Initialization Handler

ARCHITECTURE NOTES:
- ProfileState object (in utility.js) manages all component state
- Object.defineProperty creates window.* proxies for backwards compatibility
- Profile data flows: Database → ProfileState → UI Form Fields
- Auto-save triggered on user input with 1.5s debounce
- Reviews load before completeness calculation
- All database queries use proper indexes and row-level security

STATUS: Modular refactor in progress | Sections 4-10 migrated to utility.js, Section 12 (Avatar) migrated to media.js

*/

// ======================================================
// 1. QUICK STATS
// ======================================================

function setupPublicProfileLink() {
    const previewLink = document.getElementById('view-public-profile');
    if (previewLink && currentUser && window.practitionerData && window.practitionerData.serial_number) {
        previewLink.addEventListener('click', (e) => {
            e.preventDefault();
            // Navigate to public profile page with practitioner serial
            const publicProfileUrl = `/rooted-vitality/dashboard/pro/pages/practitioner-public-profile.html?id=${window.practitionerData.serial_number}`;
            window.open(publicProfileUrl, '_blank');
        });
    }
}

function populateQuickStats() {
    // Note: Verified status and preview cards removed - verified badge shown in hero, link moved there
    setupPublicProfileLink();
}

/**
 * UNIVERSAL MANUAL SAVE BUTTON SETUP
 * 
 * Connects all manual save buttons to the unified save system
 * Uses data-section attribute to route to correct handler
 * 
 * Button Types:
 * 1. Header Save: id="save-header-info" → saves to practitioners table
 * 2. Section Saves: class="section-save-btn[data-section]" → routes to section handler
 */
function setupManualSaveButtons() {
    // Header save button
    const headerSaveBtn = document.getElementById('save-header-info');
    if (headerSaveBtn) {
        headerSaveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            executeSave('header', false); // Manual save (not auto-save)
        });
    }
    
    // Section save buttons (About, Credentials, Photos, More Details)
    const sectionSaveButtons = document.querySelectorAll('.section-save-btn[data-section]');
    sectionSaveButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = btn.getAttribute('data-section');
            executeSave(sectionId, false); // Manual save (not auto-save)
        });
    });
    
    // Avatar/Logo upload handler
    const avatarInput = document.getElementById('avatar-input');
    if (avatarInput) {
        // Handle file selection
        avatarInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                // Show loading state
                showSaveStatus('Uploading photo...', 'saving');
                
                // Call upload function from media.js
                if (typeof uploadAvatar === 'function') {
                    await uploadAvatar(file);
                } else {
                    throw new Error('Upload function not available');
                }
                
            } catch (error) {
                console.error('[Profile] Avatar upload error:', error);
                showSaveStatus('Photo upload failed', 'error');
            }
        });
        
        // Also handle label click to open file picker
        const avatarLabel = document.querySelector('.avatar-upload-btn');
        if (avatarLabel) {
            avatarLabel.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                avatarInput.click();
            });
        }
    }
}

/**
 * SECTION SAVE ROUTER
 * Routes section saves to appropriate handlers
 * @param {string} section - Section name ('header', 'credentials', etc.)
 * @param {boolean} isAutoSave - Whether this is auto-save or manual save
 */
async function executeSave(section, isAutoSave = false) {
    try {
        switch(section) {
            case 'header':
                // Collect header data - only fields that exist in schema
                const headerData = {
                    updated_at: new Date().toISOString()
                };
                // Only save if there's actual data
                if (Object.keys(headerData).length > 1) {
                    await routeUpdateData(headerData);
                }
                break;
                
            case 'about':
                // About section save
                if (typeof saveSectionAbout === 'function') {
                    await saveSectionAbout();
                }
                break;
                
            case 'credentials':
                // Credentials section save
                if (typeof saveSectionCredentials === 'function') {
                    await saveSectionCredentials();
                }
                break;
                
            case 'photos':
            case 'video':
            case 'media':
                // Photos/video section save
                if (typeof saveSectionPhotosVideo === 'function') {
                    await saveSectionPhotosVideo();
                }
                break;
                
            case 'more-details':
                // More details section save
                if (typeof saveSectionMoreDetails === 'function') {
                    await saveSectionMoreDetails();
                }
                break;
                
            default:
                console.warn('[Profile] Unknown section:', section);
        }
        
        // SAVE SUCCESSFUL - clear unsaved changes flag
        ProfileState.hasUnsavedChanges = false;
        
        // Show success status only for manual saves (not auto-save)
        if (!isAutoSave && typeof showToast === 'function') {
            showToast('Saved successfully!', 'success', 2000);
        }
        
        // Update profile completeness
        if (typeof updateProfileCompleteness === 'function') {
            updateProfileCompleteness();
        }
        
    } catch (error) {
        console.error('[Profile] Save error:', section, error);
        // Show error toast for both manual and auto-save so user knows something went wrong
        if (typeof showToast === 'function') {
            showToast('Save failed: ' + (error.message || 'Unknown error'), 'error', 3000);
        }
    }
}

/**
 * DEBOUNCED AUTO-SAVE FUNCTION
 * 
     * Triggers auto-save after user stops typing/editing for 1.5 seconds
     * Prevents excessive database writes by debouncing rapid changes
     * 
     * @param {string} section - Section identifier ('more-details', etc.)
     */
let autoSaveTimeouts = {};

function debounceAutoSave(section = 'more-details') {
    // Clear existing timeout for this section
    if (autoSaveTimeouts[section]) {
        clearTimeout(autoSaveTimeouts[section]);
    }
    
    // Set new timeout - save after 1.5 seconds of inactivity
    autoSaveTimeouts[section] = setTimeout(() => {
        executeSave(section, true); // true = isAutoSave
    }, 1500);
}

/**
 * Save a specific section of the profile
 * @param {string} section - Section identifier
 */
async function saveProfileSection(section) {
    try {
        // Show saving status
        showSaveStatus('Saving...', 'saving');
        
        // Collect form data for this section
        const formData = {};
        
        if (section === 'more-details') {
            // Collect More Details section data
            formData.bio = document.getElementById('bio')?.value || null;
            formData.years_experience = document.getElementById('years-experience')?.value || null;
            formData.specializations = document.getElementById('specializations')?.value || null;
            formData.approach_philosophy = document.getElementById('approach-philosophy')?.value || null;
        }
        
        // Update ProfileState
        Object.assign(ProfileState.practitionerData, formData);
        
        // Save to database via ProfileState
        await ProfileState.save();
        
        showSaveStatus('Saved', 'success');
    } catch (error) {
        console.error('[Profile] Error auto-saving section:', section, error);
        showSaveStatus('Save failed', 'error');
    }
}

function loadLanguages() {

    if (!ProfileState.currentLanguages || ProfileState.currentLanguages.length === 0) {
        // Uncheck all checkboxes
        document.querySelectorAll('.language-checkbox').forEach(cb => cb.checked = false);
        document.getElementById('custom-language-input').value = '';
        renderLanguagesList([]);
        return;
    }
    // Uncheck all first
    document.querySelectorAll('.language-checkbox').forEach(cb => cb.checked = false);
    document.getElementById('custom-language-input').value = '';
    
    // Check the boxes that match
    const predefinedLanguages = ['English', 'Spanish', 'French', 'German', 'Mandarin', 'Japanese', 'Portuguese', 'Italian', 'Korean', 'Vietnamese'];
    let customLanguages = [];
    
    ProfileState.currentLanguages.forEach(lang => {
        if (predefinedLanguages.includes(lang)) {
            const checkbox = document.querySelector(`.language-checkbox[value="${lang}"]`);
            if (checkbox) checkbox.checked = true;
        } else {
            customLanguages.push(lang);
        }
    });
    
    // Handle custom languages
    if (customLanguages.length > 0) {
        const customCheckbox = document.getElementById('custom-language-checkbox');
        const customInput = document.getElementById('custom-language-input');
        customCheckbox.checked = true;
        // Set the custom input to the first custom language (user can edit)
        customInput.value = customLanguages[0];
    }
    
    renderLanguagesList(ProfileState.currentLanguages);
}

function setupLanguageListeners() {
    // Setup checkbox listeners for predefined languages
    const checkboxes = document.querySelectorAll('.language-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateLanguagesFromCheckboxes);
    });
    
    // Setup custom language input
    const customInput = document.getElementById('custom-language-input');
    if (customInput) {
        customInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const language = customInput.value.trim();
                if (language) {
                    addLanguage(language);
                    customInput.value = '';
                }
            }
        });
    }
}

// ======================================================
// 2. LANGUAGES
// ======================================================

function addLanguage(language) {

    if (!ProfileState.currentLanguages.includes(language)) {
        ProfileState.currentLanguages.push(language);
        renderLanguagesList(ProfileState.currentLanguages);
        debounceAutoSave('more-details');
    } else {
    }
}

function addLanguageFromButton() {
    const languageInput = document.getElementById('language-input');
    if (languageInput && languageInput.value.trim()) {
        addLanguage(languageInput.value.trim());
        languageInput.value = '';
        languageInput.focus();
    }
}

function updateLanguagesFromCheckboxes() {
    const languages = [];
    
    // Collect checked checkboxes (excluding the custom language checkbox)
    const checkboxes = document.querySelectorAll('.language-checkbox:not(#custom-language-checkbox):checked');
    checkboxes.forEach(checkbox => {
        languages.push(checkbox.value);
    });
    
    // Collect custom language if checkbox is checked AND text is entered
    const customCheckbox = document.getElementById('custom-language-checkbox');
    const customInput = document.getElementById('custom-language-input');
    if (customCheckbox && customCheckbox.checked && customInput && customInput.value.trim()) {
        const customLang = customInput.value.trim();
        if (!languages.includes(customLang)) {
            languages.push(customLang);
        }
    }
    
    ProfileState.currentLanguages = languages;
    renderLanguagesList(ProfileState.currentLanguages);
    debounceAutoSave('more-details');
}

function removeLanguage(language) {
    ProfileState.currentLanguages = ProfileState.currentLanguages.filter(lang => lang !== language);
    renderLanguagesList(ProfileState.currentLanguages);
    debounceAutoSave('more-details');
}

function renderLanguagesList(languages) {
    ProfileState.currentLanguages = languages;
    const list = document.getElementById('languages-list');
    if (!list) return;
    
    if (languages.length === 0) {
        list.innerHTML = '';
        return;
    }
    
    list.innerHTML = languages.map(lang => `
        <div class="language-tag">
            <span>${lang}</span>
            <span class="language-tag-remove" data-language="${lang}">×</span>
        </div>
    `).join('');
    
    // Attach event listeners to remove buttons
    list.querySelectorAll('.language-tag-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const lang = btn.getAttribute('data-language');
            removeLanguage(lang);
        });
    });
}

function getSelectedLanguages() {
    return ProfileState.currentLanguages;
}

// ======================================================
// 3. FAQ
// ======================================================

function loadFAQ() {
    if (!ProfileState.faqItems || ProfileState.faqItems.length === 0) {
        ProfileState.faqItems = [];
        ProfileState.faqNextId = 0;
        renderFAQItems();
        return;
    }
    
    renderFAQItems();
}

function renderFAQItems() {
    const faqList = document.getElementById('faq-list');
    const addBtn = document.getElementById('add-faq-btn');
    if (!faqList) return;
    
    // Render form fields for each FAQ item
    faqList.innerHTML = ProfileState.faqItems.map((item, index) => `
        <div class="faq-form-item" data-faq-id="${item.id}">
            <div class="faq-item-header">
                <div class="faq-item-number">Q${index + 1}</div>
                <button class="faq-delete-btn" data-faq-id="${item.id}" title="Remove this Q&A">Remove</button>
            </div>
            <div class="faq-form-group">
                <input 
                    type="text" 
                    class="faq-question-input" 
                    data-faq-id="${item.id}"
                    value="${item.question || ''}"
                    placeholder="What do clients commonly ask?"
                >
            </div>
            <div class="faq-form-group">
                <textarea 
                    class="faq-answer-input" 
                    data-faq-id="${item.id}"
                    placeholder="Provide a helpful answer..."
                    rows="3"
                >${item.answer || ''}</textarea>
            </div>
        </div>
    `).join('');
    
    // Show/hide add button based on max limit
    if (addBtn) {
        if (ProfileState.faqItems.length >= 10) {
            addBtn.classList.add('hidden');
        } else {
            addBtn.classList.remove('hidden');
        }
    }
    
    // Add event listener for delete buttons
    faqList.querySelectorAll('.faq-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const faqId = parseInt(btn.getAttribute('data-faq-id'));
            deleteFAQItem(faqId);
        });
    });
    
    // Add event listeners to all inputs
    faqList.querySelectorAll('.faq-question-input, .faq-answer-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const faqId = parseInt(e.target.getAttribute('data-faq-id'));
            const item = ProfileState.faqItems.find(faq => faq.id === faqId);
            if (item) {
                if (e.target.classList.contains('faq-question-input')) {
                    item.question = e.target.value;
                } else {
                    item.answer = e.target.value;
                }
                debounceAutoSave('more-details');
            }
        });
    });
}

function addFAQItem() {
    // Check if at max limit
    if (ProfileState.faqItems.length >= 10) {
        alert('Maximum 10 FAQ items allowed');
        return;
    }
    
    ProfileState.faqItems.push({
        id: ProfileState.faqNextId++,
        question: '',
        answer: ''
    });
    
    renderFAQItems();
    debounceAutoSave('more-details');
    
    // Focus on the new question field
    setTimeout(() => {
        const lastItem = document.querySelectorAll('.faq-form-item');
        if (lastItem.length > 0) {
            lastItem[lastItem.length - 1].querySelector('.faq-question-input').focus();
        }
    }, 0);
}

function deleteFAQItem(id) {
    ProfileState.faqItems = ProfileState.faqItems.filter(faq => faq.id !== id);
    renderFAQItems();
    debounceAutoSave('more-details');
}

function setupFAQListeners() {
    const addFAQBtn = document.getElementById('add-faq-btn');
    if (addFAQBtn) {
        addFAQBtn.addEventListener('click', addFAQItem);
    }
}

// ======================================================
// 4. INSURANCE PROVIDERS
// ======================================================

const INSURANCE_PROVIDERS = {
    aetna: 'Aetna',
    anthem: 'Anthem / BlueCross',
    cigna: 'Cigna',
    humana: 'Humana',
    united: 'UnitedHealth',
    bcbs: 'BCBS',
    tricare: 'TRICARE',
    medicaid: 'Medicaid',
    medicare: 'Medicare',
    workers_comp: 'Workers\' Compensation'
};

function loadInsurance(insuranceArray) {
    ProfileState.selectedInsurance = Array.isArray(insuranceArray) ? insuranceArray : [];
    
    // Give DOM time to render checkboxes before trying to check them
    setTimeout(() => {
        renderInsuranceCheckboxes();
        renderInsuranceDisplay();
    }, 100);
}

function renderInsuranceCheckboxes() {
    const checkboxes = document.querySelectorAll('input[name="insurance-provider"]');

    checkboxes.forEach(checkbox => {
        const shouldCheck = ProfileState.selectedInsurance.includes(checkbox.value);
        checkbox.checked = shouldCheck;
        checkbox.addEventListener('change', updateInsuranceSelection);
    });
    
    // Handle custom insurance checkbox + input
    const customCheckbox = document.getElementById('custom-insurance-checkbox');
    const customInput = document.getElementById('custom-insurance-input');
    
    if (customCheckbox && customInput && window.selectedInsurance) {
        // Find any value that doesn't match the predefined insurance codes
        const customValue = window.selectedInsurance.find(value => !['aetna', 'anthem', 'cigna', 'humana', 'united', 'medicaid', 'medicare', 'private-pay'].includes(value));
        
        if (customValue) {
            customCheckbox.checked = true;
            customInput.value = customValue;
        } else {
            customCheckbox.checked = false;
            customInput.value = '';
        }
        
        customCheckbox.addEventListener('change', updateInsuranceSelection);
        customInput.addEventListener('change', updateInsuranceSelection);
        customInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') updateInsuranceSelection();
        });
    }
}

function updateInsuranceSelection() {
    const insurance = [];
    
    // Collect checked named insurance provider checkboxes
    const checkboxes = document.querySelectorAll('input[name="insurance-provider"]:checked');
    checkboxes.forEach(checkbox => {
        insurance.push(checkbox.value);
    });
    
    // Collect custom insurance if checkbox is checked AND text is entered
    const customCheckbox = document.getElementById('custom-insurance-checkbox');
    const customInput = document.getElementById('custom-insurance-input');
    if (customCheckbox && customCheckbox.checked && customInput && customInput.value.trim()) {
        const customValue = customInput.value.trim();
        if (!insurance.includes(customValue)) {
            insurance.push(customValue);
        }
    }
    
    ProfileState.selectedInsurance = insurance;
    renderInsuranceDisplay();
    debounceAutoSave('more-details');
}

function renderInsuranceDisplay() {
    const display = document.getElementById('insurance-display');
    if (!display) return;
    
    if (!ProfileState.selectedInsurance || ProfileState.selectedInsurance.length === 0) {
        display.innerHTML = '<p class="placeholder-text">No insurance providers selected yet.</p>';
        return;
    }
    
    display.innerHTML = ProfileState.selectedInsurance.map(insuranceCode => `
        <div class="insurance-badge">${INSURANCE_PROVIDERS[insuranceCode] || insuranceCode}</div>
    `).join('');
}

function setupInsuranceListeners() {
    const checkboxes = document.querySelectorAll('.insurance-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateInsuranceSelection);
    });
}

// ======================================================
// 5. PAYMENT METHODS
// ======================================================

// Payment methods initialized in ProfileState

const PAYMENT_METHODS = {
    stripe: 'Stripe',
    square: 'Square',
    paypal: 'PayPal',
    cash: 'Cash',
    check: 'Check',
    venmo: 'Venmo',
    'bank-transfer': 'Bank Transfer',
    'credit-card': 'Credit Card'
};

function loadPaymentMethods(paymentMethodsArray) {
    ProfileState.selectedPaymentMethods = Array.isArray(paymentMethodsArray) ? paymentMethodsArray : [];
    
    // Give DOM time to render checkboxes before trying to check them
    setTimeout(() => {
        renderPaymentCheckboxes();
        renderPaymentDisplay();
    }, 100);
}

function renderPaymentCheckboxes() {
    const checkboxes = document.querySelectorAll('input[name="payment-method"]');

    checkboxes.forEach(checkbox => {
        const shouldCheck = ProfileState.selectedPaymentMethods.includes(checkbox.value);
        checkbox.checked = shouldCheck;
        checkbox.addEventListener('change', updatePaymentMethodSelection);
    });
    
    // Handle custom payment checkbox + input
    const customCheckbox = document.getElementById('custom-payment-checkbox');
    const customInput = document.getElementById('custom-payment-input');
    
    if (customCheckbox && customInput && ProfileState.selectedPaymentMethods) {
        // Find any value that doesn't match the predefined payment methods
        const customValue = ProfileState.selectedPaymentMethods.find(value => !['stripe', 'square', 'paypal', 'cash', 'check', 'venmo', 'bank-transfer', 'credit-card'].includes(value));
        
        if (customValue) {
            customCheckbox.checked = true;
            customInput.value = customValue;
        } else {
            customCheckbox.checked = false;
            customInput.value = '';
        }
        
        customCheckbox.addEventListener('change', updatePaymentMethodSelection);
        customInput.addEventListener('change', updatePaymentMethodSelection);
        customInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') updatePaymentMethodSelection();
        });
    }
}

function updatePaymentMethodSelection() {
    const paymentMethods = [];
    
    // Collect checked named payment method checkboxes
    const checkboxes = document.querySelectorAll('input[name="payment-method"]:checked');
    checkboxes.forEach(checkbox => {
        paymentMethods.push(checkbox.value);
    });
    
    // Collect custom payment method if checkbox is checked AND text is entered
    const customCheckbox = document.getElementById('custom-payment-checkbox');
    const customInput = document.getElementById('custom-payment-input');
    if (customCheckbox && customCheckbox.checked && customInput && customInput.value.trim()) {
        const customValue = customInput.value.trim();
        if (!paymentMethods.includes(customValue)) {
            paymentMethods.push(customValue);
        }
    }
    
    ProfileState.selectedPaymentMethods = paymentMethods;
    renderPaymentDisplay();
    debounceAutoSave('more-details');
}

function setupPaymentMethodListeners() {
    const checkboxes = document.querySelectorAll('.payment-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updatePaymentMethodSelection);
    });
}

// ======================================================
// 6. PRACTICE TYPE & SETTING
// ======================================================

ProfileState.practiceData = {
    structure: null,
    setting: null,
    delivery: []
};

function setupPracticeListeners() {
    const structureRadios = document.querySelectorAll('input[name="practice-structure"]');
    const settingRadios = document.querySelectorAll('input[name="practice-setting"]');
    const deliveryCheckboxes = document.querySelectorAll('#practice-in-person, #practice-virtual, #practice-hybrid');
    
    structureRadios.forEach(radio => radio.addEventListener('change', updatePracticeDisplay));
    settingRadios.forEach(radio => radio.addEventListener('change', updatePracticeDisplay));
    deliveryCheckboxes.forEach(checkbox => checkbox.addEventListener('change', updatePracticeDisplay));
}

function loadPractice(practiceType) {
    try {
        // Load practice_type (private, clinic, hospital) from database
        if (practiceType) {
            const radio = document.querySelector(`input[name="practice-setting"][value="${practiceType}"]`);
            if (radio) {
                radio.checked = true;
            }
        }
        
        renderPracticeDisplay();
    } catch (error) {
        console.error('[Rooted Vitality] Error loading practice:', error);
    }
}

function savePracticeData() {
    try {
        const structure = document.querySelector('input[name="practice-structure"]:checked')?.value || null;
        const setting = document.querySelector('input[name="practice-setting"]:checked')?.value || null;
        const delivery = [];
        
        const housecallsEl = document.getElementById('practice-housecalls');
        const inofficeEl = document.getElementById('practice-inoffice');
        const virtualEl = document.getElementById('practice-virtual');
        
        if (housecallsEl?.checked) delivery.push('house-calls');
        if (inofficeEl?.checked) delivery.push('in-office');
        if (virtualEl?.checked) delivery.push('virtual');
        
        ProfileState.practiceData = {
            structure: structure,
            setting: setting,
            delivery: delivery
        };
        
        return ProfileState.practiceData;
    } catch (error) {
        console.error('[Rooted Vitality] Error saving practice:', error);
        return null;
    }
}

function renderPracticeDisplay() {
    try {
        const displayDiv = document.getElementById('practice-display-content');
        if (!displayDiv) return;
        
        const settingRadio = document.querySelector('input[name="practice-setting"]:checked');
        let content = '';
        
        const settingLabels = { 
            private: 'Private Practice', 
            clinic: 'Clinic/Center', 
            hospital: 'Hospital/Medical Facility' 
        };
        
        if (settingRadio && settingRadio.value) {
            content += `<div class="practice-display-item"><span class="practice-badge">${settingLabels[settingRadio.value] || settingRadio.value}</span></div>`;
        }
        
        displayDiv.innerHTML = content || '<p class="placeholder-text">No practice type information provided.</p>';
    } catch (error) {
        console.error('[Rooted Vitality] Error rendering practice display:', error);
    }
}

function updatePracticeDisplay() {
    renderPracticeDisplay();
}

// ======================================================
// 7. PAYMENT & INSURANCE HANDLING
// ======================================================

function setupPaymentInsuranceSection() {
    const acceptsInsuranceCheckbox = document.getElementById('accepts-insurance');
    const insuranceProvidersList = document.getElementById('insurance-providers-list');
    
    if (acceptsInsuranceCheckbox) {
        // Show/hide insurance providers list based on checkbox
        acceptsInsuranceCheckbox.addEventListener('change', (e) => {
            if (insuranceProvidersList) {
                if (e.target.checked) {
                    insuranceProvidersList.classList.remove('hidden');
                } else {
                    insuranceProvidersList.classList.add('hidden');
                }
            }
        });
        
        // Initialize display state
        if (insuranceProvidersList) {
            if (acceptsInsuranceCheckbox.checked) {
                insuranceProvidersList.classList.remove('hidden');
            } else {
                insuranceProvidersList.classList.add('hidden');
            }
        }
    }
    
    // Setup payment section display mode rendering
    const paymentSection = document.querySelector('[data-section="payment"]');
    if (paymentSection) {
        // Monitor for edit/display mode changes
        const observer = new MutationObserver(() => {
            if (!paymentSection.classList.contains('section-edit')) {
                renderPaymentDisplay();
            }
        });
        
        observer.observe(paymentSection, { attributes: true, attributeFilter: ['class'] });
    }
}

function getPaymentCheckboxValues() {
    const paymentData = {
        insurance_providers: [],
        custom_insurance_providers: [],  // Changed to array
        payment_methods: [],
        custom_payment_methods: []  // Changed to array
    };
    
    // Collect selected insurance providers (excluding custom)
    const insuranceCheckboxes = document.querySelectorAll('input[name="insurance-provider"]:checked');
    insuranceCheckboxes.forEach(cb => {
        paymentData.insurance_providers.push(cb.value);
    });
    
    // Collect custom insurance if checkbox is checked AND text is entered
    const customInsuranceCheckbox = document.getElementById('custom-insurance-checkbox');
    const customInsuranceInput = document.getElementById('custom-insurance-input');
    if (customInsuranceCheckbox && customInsuranceCheckbox.checked && customInsuranceInput && customInsuranceInput.value.trim()) {
        const customInsurance = customInsuranceInput.value.trim();
        paymentData.insurance_providers.push(customInsurance);
        paymentData.custom_insurance_providers.push(customInsurance);  // Push to array
    }
    
    // Collect selected payment methods (excluding custom)
    const paymentCheckboxes = document.querySelectorAll('input[name="payment-method"]:checked');
    paymentCheckboxes.forEach(cb => {
        paymentData.payment_methods.push(cb.value);
    });
    
    // Collect custom payment method if checkbox is checked AND text is entered
    const customPaymentCheckbox = document.getElementById('custom-payment-checkbox');
    const customPaymentInput = document.getElementById('custom-payment-input');
    if (customPaymentCheckbox && customPaymentCheckbox.checked && customPaymentInput && customPaymentInput.value.trim()) {
        const customPayment = customPaymentInput.value.trim();
        paymentData.payment_methods.push(customPayment);
        paymentData.custom_payment_methods.push(customPayment);  // Push to array
    }
    return paymentData;
}

function renderPaymentDisplay() {
    const displayDiv = document.getElementById('payment-display');
    if (!displayDiv) return;
    
    const acceptsInsuranceCheckbox = document.getElementById('accepts-insurance');
    const insuranceProviders = document.querySelectorAll('input[name="insurance-provider"]:checked');
    const paymentMethods = document.querySelectorAll('input[name="payment-method"]:checked');
    const customInsurance = document.getElementById('custom-insurance-providers')?.value || '';
    const customPayment = document.getElementById('custom-payment-methods')?.value || '';
    
    let html = '';
    
    // Insurance section
    if (acceptsInsuranceCheckbox?.checked) {
        html += '<div class="payment-display-subsection">';
        html += '<h4>Insurance Accepted</h4>';
        html += '<div class="payment-display-badges">';
        
        insuranceProviders.forEach(provider => {
            const label = provider.parentElement.textContent.trim();
            html += `<span class="payment-display-badge">✓ ${label}</span>`;
        });
        
        if (customInsurance) {
            const customProviders = customInsurance.split(',').map(p => p.trim()).filter(p => p);
            customProviders.forEach(provider => {
                html += `<span class="payment-display-badge">✓ ${provider}</span>`;
            });
        }
        
        html += '</div></div>';
    } else {
        html += '<div class="payment-display-subsection"><p class="placeholder-text">No insurance currently accepted</p></div>';
    }
    
    // Payment methods section
    if (paymentMethods.length > 0 || customPayment) {
        html += '<div class="payment-display-subsection">';
        html += '<h4>Payment Methods Accepted</h4>';
        html += '<div class="payment-display-badges">';
        
        paymentMethods.forEach(method => {
            const label = method.parentElement.textContent.trim();
            html += `<span class="payment-display-badge">✓ ${label}</span>`;
        });
        
        if (customPayment) {
            const customMethods = customPayment.split(',').map(m => m.trim()).filter(m => m);
            customMethods.forEach(method => {
                html += `<span class="payment-display-badge">✓ ${method}</span>`;
            });
        }
        
        html += '</div></div>';
    } else {
        html += '<div class="payment-display-subsection"><p class="placeholder-text">No payment methods specified yet</p></div>';
    }
    
    displayDiv.innerHTML = html;
}

// ======================================================
// 8. REVIEWS & TESTIMONIALS
// ======================================================

// Reviews arrays managed via ProfileState (filteredReviews is in ProfileState)

//Initialize reviews when switching to reviews panel
async function initializeReviews() {
    try {
        // Load reviews data
        await loadReviews();
        
        // Render initial reviews
        renderReviews(ProfileState.allReviews);
        updateReviewsStats();
        
        // Attach review event listeners
        attachReviewEventListeners();
    } catch (error) {
        console.error('[Reviews] Error initializing reviews:', error);
        showToast('Error loading reviews', 'error');
    }
}

async function loadReviews() {
    try {
        // Get current practitioner
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) {
            window.allReviews = [];
            filteredReviews = [];
            return;
        }
        
        // Get practitioner ID
        const { data: practitionerData, error: practitionerError } = await window.supabaseClient
            .from('practitioners')
            .select('id, serial_number')
            .eq('id', user.id)
            .single();
        
        if (practitionerError || !practitionerData) {
            console.error('[Reviews] Error loading practitioner:', practitionerError);
            window.allReviews = [];
            filteredReviews = [];
            return;
        }
        
        // Fetch real reviews from database
        const { data: dbReviews, error: reviewsError } = await window.supabaseClient
            .from('reviews')
            .select('*')
            .eq('practitioner_serial', practitionerData.serial_number)  // Use serial_number for queries
            .eq('is_visible', true)
            .order('created_at', { ascending: false });
        
        if (reviewsError) {
            console.error('[Reviews] Error loading reviews:', reviewsError);
            window.allReviews = [];
        } else {
            // Transform database reviews to match our format
            window.allReviews = (dbReviews || []).map(review => {
                // Use stored client names from database
                let displayName = 'Client';
                const first = review.client_first_name?.trim();
                const last = review.client_last_name?.trim();
                
                if (first && last) {
                    displayName = `${first} ${last[0].toUpperCase()}`;
                } else if (last) {
                    displayName = last;
                } else if (first) {
                    displayName = first;
                } else if (review.client_name) {
                    displayName = review.client_name;
                }
                
                return {
                    id: review.id,
                    clientName: displayName,
                    rating: review.rating || 5,
                    text: review.review_text || '',
                    date: new Date(review.created_at),
                    source: 'platform',
                    verified: true,
                    photos: review.photos || []
                };
            });
        }
        filteredReviews = [...window.allReviews];
        
    } catch (error) {
        console.error('[Reviews] Error loading reviews:', error);
        throw error;
    }
}

// Render reviews to the page
function renderReviews(reviews) {
    const container = document.getElementById('reviews-container');
    const noReviewsState = document.getElementById('no-reviews-state');
    
    if (!container || !noReviewsState) {
        return;
    }
    
    if (reviews.length === 0) {
        container.classList.add('hidden');
        noReviewsState.classList.remove('hidden');
        return;
    }
    
    container.classList.remove('hidden');
    noReviewsState.classList.add('hidden');
    
    container.innerHTML = reviews.map(review => createReviewCard(review)).join('');
}

// Create a review card HTML element
function createReviewCard(review) {
    const stars = Array(5)
        .fill(0)
        .map((_, i) => `<span class="star ${i < review.rating ? 'filled' : 'empty'}">★</span>`)
        .join('');
    
    const formattedDate = formatRelativeDate(review.date);
    const source = review.source === 'platform' ? 'Platform' : 'External';
    
    // Build photos section if photos exist
    let photosHtml = '';
    if (review.photos && Array.isArray(review.photos) && review.photos.length > 0) {
        const photoThumbnails = review.photos
            .map((photoPath, idx) => {
                // Convert storage path to public URL
                let photoUrl = photoPath;
                if (typeof photoPath === 'string' && photoPath.includes('review-photos/')) {
                  const { data } = window.supabaseClient.storage
                    .from('review-files')
                    .getPublicUrl(photoPath);
                  photoUrl = data?.publicUrl || photoPath;
                }
                return `<img src="${photoUrl}" alt="Review photo ${idx + 1}" class="review-photo-thumbnail" loading="lazy">`;
            })
            .join('');
        photosHtml = `<div class="review-photos-gallery">${photoThumbnails}</div>`;
    }
    
    return `
        <div class="review-card" data-review-id="${review.id}" data-source="${review.source}" data-rating="${review.rating}">
            <div class="review-header">
                <div class="review-client-info">
                    <h3 class="review-client-name">${escapeHtml(review.clientName)}</h3>
                    <span class="review-source-badge ${review.source}">${source}</span>
                </div>
                <div class="review-stars">${stars}</div>
            </div>
            <p class="review-text">${escapeHtml(review.text)}</p>
            ${photosHtml}
            <div class="review-footer">
                <span class="review-date">${formattedDate}</span>
            </div>
        </div>
    `;
}

// Update statistics cards
function updateReviewsStats() {
    const totalReviews = window.allReviews.length;
    const platformReviews = window.allReviews.filter(r => r.source === 'platform').length;
    const externalReviews = window.allReviews.filter(r => r.source === 'external').length;
    
    const avgRating = totalReviews > 0 
        ? (window.allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
        : 5.0;
    
    // Update DOM elements if they exist
    const avgRatingEl = document.getElementById('avg-rating');
    const totalReviewsEl = document.getElementById('total-reviews');
    const platformReviewsEl = document.getElementById('platform-reviews');
    const externalReviewsEl = document.getElementById('external-reviews');
    const avgStarsEl = document.getElementById('avg-stars');
    
    if (avgRatingEl) avgRatingEl.textContent = avgRating;
    if (totalReviewsEl) totalReviewsEl.textContent = totalReviews;
    if (platformReviewsEl) platformReviewsEl.textContent = platformReviews;
    if (externalReviewsEl) externalReviewsEl.textContent = externalReviews;
    
    // Update stars
    if (avgStarsEl) {
        const avgStars = Math.round(avgRating);
        const starsHtml = Array(5)
            .fill(0)
            .map((_, i) => `<span class="star ${i < avgStars ? 'filled' : 'empty'}">★</span>`)
            .join('');
        avgStarsEl.innerHTML = starsHtml;
    }
}

//Apply filters to reviews
function applyReviewFilters() {
    const ratingFilter = document.getElementById('filter-rating')?.value;
    const sourceFilter = document.getElementById('filter-source')?.value;
    
    filteredReviews = window.allReviews.filter(review => {
        const matchRating = !ratingFilter || review.rating.toString() === ratingFilter;
        const matchSource = !sourceFilter || review.source === sourceFilter;
        return matchRating && matchSource;
    });
    
    renderReviews(filteredReviews);
}

//Show review link modal
function showReviewLinkModal() {
    const modal = document.getElementById('review-link-modal');
    if (!modal) {
        return;
    }
    
    const reviewLink = `${window.location.origin}/rooted-vitality/review?practitioner=${ProfileState.currentUser.id}`;
    const linkInput = document.getElementById('review-link-input');
    if (linkInput) {
        linkInput.value = reviewLink;
    }
    
    modal.classList.remove('hidden');
}

// Close review link modal
function closeReviewLinkModal() {
    const modal = document.getElementById('review-link-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

//Copy review link to clipboard
function copyReviewLink() {
    const input = document.getElementById('review-link-input');
    if (!input) return;
    
    input.select();
    document.execCommand('copy');
    showToast('Review link copied to clipboard!', 'success');
}

//Attach event listeners for reviews functionality
function attachReviewEventListeners() {
    // Review link button
    const getReviewLinkBtn = document.getElementById('get-review-link-btn');
    if (getReviewLinkBtn) {
        getReviewLinkBtn.addEventListener('click', showReviewLinkModal);
    } else {
    }
    
    // Empty state review link button
    const emptyStateBtn = document.getElementById('empty-state-review-link-btn');
    if (emptyStateBtn) {
        emptyStateBtn.addEventListener('click', showReviewLinkModal);
    } else {
    }
    
    // Copy review link button
    const copyBtn = document.getElementById('copy-review-link-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', copyReviewLink);
    }
    
    // Filter dropdowns
    const ratingFilter = document.getElementById('filter-rating');
    if (ratingFilter) {
        ratingFilter.addEventListener('change', applyReviewFilters);
    }
    
    const sourceFilter = document.getElementById('filter-source');
    if (sourceFilter) {
        sourceFilter.addEventListener('change', applyReviewFilters);
    }
}

// ======================================================
// 9. PROFILE.JS INITIALIZATION HANDLER
// ======================================================

async function initializeProfilePage() {
    try {
        // STEP 1: Populate form fields from loaded data BEFORE attaching listeners
        if (ProfileState.practitionerData) {
            await populateProfileFields(ProfileState.practitionerData);
        }
        
        // STEP 2: Render credentials into form (degrees, licenses, certifications)
        renderCredentials('degree');
        renderCredentials('license');
        renderCredentials('certification');
        
        // STEP 3: Load saved languages, FAQ, and practice type
        loadLanguages();
        loadFAQ();
        if (ProfileState.practitionerData?.practice_type) {
            loadPractice(ProfileState.practitionerData.practice_type);
        }
        
        // STEP 4: Load reviews
        await loadReviews();
        
        // STEP 5: Update completeness with current data
        updateProfileCompleteness();
        
        // STEP 6: NOW setup unsaved changes tracking and event listeners
        // This MUST happen AFTER all form fields are populated
        setupUnsavedChangesTracking();
        
        // STEP 7: Setup all event listeners for form inputs
        setupInputListeners();
        setupLanguageListeners();
        setupInsuranceListeners();
        setupFAQListeners();
        setupPracticeListeners();
        setupAvatarUpload();
        setupManualSaveButtons();
        
        // STEP 8: Setup media handlers
        setupVideoListeners();
        setupAlbumButton();
        setupVideoButton();
        setupPaymentInsuranceSection();
        
        // STEP 9: Setup public profile link
        setupPublicProfileLink();
        
        // STEP 10: Setup review event listeners
        attachReviewEventListeners();
        
        // STEP 11: Mark initialization as complete - NOW allow auto-save
        ProfileState.isInitializing = false;
        console.log('[Profile] Initialization complete - auto-save now enabled');
        
    } catch (error) {
        console.error('[Rooted Vitality] Error initializing profile page:', error);
    }
}

// Initialization is called from utility.js after loadProfile completes
// This ensures ProfileState.practitionerData is populated before we populate fields
// See: practitioner-profile-utility.js loadProfile() finally block