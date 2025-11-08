/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: scripts/proProfile.js                                       ║
║  Purpose: Practitioner profile page with inline editing & auto-save║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝
*/

console.log('[Rooted Vitality] proProfile.js loading...');

let currentUser = null;
let autoSaveTimeout = null;
const AUTO_SAVE_DELAY = 1500; // 1.5 seconds
let hasUnsavedChanges = false; // Track if page has unsaved changes

// Initialize credential arrays (use window object for access from functions)
window.educationCredentials = [];
window.licenseCredentials = [];
window.certificationCredentials = [];
window.continuingEducationCredentials = [];

/**
 * Safe update/insert for practitioners table
 * Tries UPDATE first, then INSERT if record doesn't exist
 */
async function safePractitionerUpdate(updateData) {
    if (!currentUser) {
        throw new Error('No current user');
    }
    
    try {
        console.log('[DB] ====== safePractitionerUpdate CALLED ======');
        console.log('[DB] Updating user_id:', currentUser.id);
        console.log('[DB] Update data keys:', Object.keys(updateData));
        console.log('[DB] languages in updateData:', updateData.languages);
        console.log('[DB] faq in updateData:', updateData.faq);
        console.log('[DB] Full update data:', JSON.stringify(updateData, null, 2));
        
        // Try UPDATE first
        const { data: updated, error: updateError } = await window.supabaseClient
            .from('practitioners')
            .update(updateData)
            .eq('user_id', currentUser.id)
            .select()
            .single();
        
        console.log('[DB] Update response - data:', updated, 'error:', updateError);
        
        if (updateError && updateError.code === 'PGRST116') {
            // Record doesn't exist, INSERT it
            const insertData = {
                user_id: currentUser.id,
                email: currentUser.email || '',
                status: 'draft',
                created_at: new Date().toISOString(),
                ...updateData
            };
            
            const { data: inserted, error: insertError } = await window.supabaseClient
                .from('practitioners')
                .insert([insertData])
                .select()
                .single();
            
            if (insertError) {
                throw insertError;
            }
            
            return inserted;
        } else if (updateError) {
            throw updateError;
        }
        
        return updated;
    } catch (error) {
        console.error('[Rooted Vitality] Error in safePractitionerUpdate:', error);
        throw error;
    }
}

/**
 * Warn user if they try to leave page with unsaved changes
 */
window.addEventListener('beforeunload', (event) => {
    if (hasUnsavedChanges) {
        console.warn('[SAVE] ⚠️ User attempting to leave page with unsaved changes');
        // Standard beforeunload message (browsers show their own warning)
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return event.returnValue;
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Rooted Vitality] Initializing practitioner profile...');
    
    // Set active view to practitioner
    localStorage.setItem('active_view', 'practitioner');
    
    // Wait for header to be injected, then load logo
    let headerWaitAttempts = 0;
    const waitForHeaderLogo = () => {
        headerWaitAttempts++;
        const header = document.getElementById('rvHeader');
        const logoImg = document.querySelector('.rv-logo-img');
        
        if (header && logoImg && typeof RootedVitality !== 'undefined' && typeof RootedVitality.loadPractitionerLogo === 'function') {
            console.log('[Rooted Vitality] Header found on profile (attempt ' + headerWaitAttempts + '), loading practitioner logo');
            RootedVitality.loadPractitionerLogo();
            return true;
        }
        
        // Retry up to 30 times (3 seconds total)
        if (headerWaitAttempts < 30) {
            setTimeout(waitForHeaderLogo, 100);
        } else {
            console.warn('[Rooted Vitality] Header not found after 30 attempts on profile');
        }
        return false;
    };
    
    // Start waiting for header
    waitForHeaderLogo();
    
    // Wait for header to be rendered, then set Profile as active
    const setProfileAsActive = () => {
        const allNavLinks = document.querySelectorAll('.rv-nav-link');
        console.log('[Rooted Vitality] Found nav links:', allNavLinks.length);
        
        let profileLinkFound = false;
        allNavLinks.forEach(link => {
            link.classList.remove('active');
            // If this is the Profile link (an <a> tag), mark it as active
            if (link.tagName === 'A' && link.href.includes('/dashboard/pro/pages/profile.html')) {
                link.classList.add('active');
                console.log('[Rooted Vitality] ✓ Profile button marked as active');
                profileLinkFound = true;
            }
        });
        return profileLinkFound;
    };
    
    // Try immediately first
    if (!setProfileAsActive()) {
        // If not found, wait for header to be injected using MutationObserver
        const observer = new MutationObserver(() => {
            if (setProfileAsActive()) {
                observer.disconnect();
            }
        });
        
        // Watch for changes to the body
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Timeout after 3 seconds to disconnect observer
        setTimeout(() => {
            observer.disconnect();
            console.warn('[Rooted Vitality] Header not found after 3 seconds');
        }, 3000);
    }
    
    
    // Get current user
    try {
        console.log('[Rooted Vitality] About to call supabaseClient.auth.getUser()...');
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        
        if (!user) {
            console.log('[Rooted Vitality] No user logged in, redirecting to signup');
            const baseUrl = (typeof RootedVitality !== 'undefined' && RootedVitality.config.siteUrl) ? RootedVitality.config.siteUrl : '/rooted-vitality/';
            window.location.href = baseUrl + 'dashboard/signup.html';
            return;
        }
        currentUser = user;
        console.log(`[Rooted Vitality] Loaded profile for user: ${user.id}`);
        
        // Initialize conditions manager with Supabase client
        console.log('[Rooted Vitality] Initializing conditions manager...');
        await window.conditionsManager.init(window.supabaseClient);
        
        // Load profile data from Supabase
        await loadProfile(user.id);
        
    } catch (error) {
        console.error('[Rooted Vitality] Error initializing profile:', error);
    }
    
    // Setup change tracking for unsaved changes warning
    setupUnsavedChangesTracking();
    
    // Setup event listeners for all input fields
    setupInputListeners();
    setupLanguageListeners();
    setupInsuranceListeners();
    setupFAQListeners();
    setupPricingListeners();
    setupPracticeListeners();
    setupConditionsListeners();
    setupVideoListeners();
    setupContinuingEducationListeners();
    setupAvatarUpload();
    setupBackgroundCheckButton();
    setupBusinessVerification();
    setupAlbumButton();
    setupVideoButton();
    setupHeaderSaveButton();
    setupReportConcernListeners();
    
    // Setup review event listeners
    attachReviewEventListeners();
    
    console.log('[Rooted Vitality] Practitioner profile initialized');
});

async function loadProfile(userId) {
    try {
        console.log(`[Rooted Vitality] Loading profile for userId: ${userId}`);
        
        
        // Fetch from practitioners table (main profile data)
        // Query by user_id, not id
        const { data: practitioner, error: practError } = await window.supabaseClient
            .from('practitioners')
            .select('*')
            .eq('user_id', userId)
            .single();
        
        console.log('[Rooted Vitality] Practitioners query result:', { 
            practitioner,
            practError,
            hasData: !!practitioner,
            errorCode: practError?.code,
            errorMessage: practError?.message
        });
        
        if (practError && practError.code !== 'PGRST116') {
            console.error('[Rooted Vitality] Error loading practitioner data:', practError);
        }
        
        // All practitioner data is now in practitioners table, profiles table is deprecated
        if (practitioner) {
            console.log('[Rooted Vitality] Practitioner data loaded from database:', practitioner);
            // Store practitioner data globally for badge system and form logic
            window.practitionerData = practitioner;
            console.log('[Rooted Vitality] ✓ Practitioner data stored in window.practitionerData');
        }
        
        // Render dynamic conditions checkboxes from taxonomy FIRST (before loading conditions data)
        console.log('[Rooted Vitality] Rendering conditions checkboxes before loading profile...');
        window.conditionsManager.render();
        
        // Then populate profile fields (which will set selected conditions)
        if (practitioner) {
            console.log('[Rooted Vitality] Practitioner profile found, populating fields...');
            await populateProfileFields(practitioner);
        } else {
            // Try to get name from auth user metadata
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (user && user.user_metadata && user.user_metadata.full_name) {
                console.log('[Rooted Vitality] Using name from auth metadata:', user.user_metadata.full_name);
                document.getElementById('profile-name').value = user.user_metadata.full_name;
            }
            console.log('[Rooted Vitality] New profile - showing blank form');
            // Initialize empty practitionerData for new profiles
            window.practitionerData = {};
            initializeCredentialSections();
        }
        
        // Update completeness meter after loading profile
        updateProfileCompleteness();
        
        // Load Phase 1 data (Quick Stats, Languages, FAQ)
        populateQuickStats();
        loadLanguages();
        loadFAQ();
        
    } catch (error) {
        console.error('[Rooted Vitality] Error in loadProfile:', error);
    }
}

async function populateProfileFields(data) {
    console.log('[Rooted Vitality] populateProfileFields called with data:', data);
    console.log('[Rooted Vitality] Full data object keys:', Object.keys(data));
    console.log('[Rooted Vitality] conditions_treated field present:', 'conditions_treated' in data);
    console.log('[Rooted Vitality] conditions_treated value:', data.conditions_treated);
    console.log('[Rooted Vitality] conditions_treated type:', typeof data.conditions_treated);
    console.log('[Rooted Vitality] conditions_treated is array:', Array.isArray(data.conditions_treated));
    
    // Try to populate from practitioners table fields first, then fallback to profiles table fields
    
    // Header fields - from practitioners table 
    // The schema defines legal_name, but signup saves legal_business_name
    // Try both field names
    const fullName = data.legal_business_name || data.legal_name || data.dba_name || data.full_name || '';
    console.log('[Rooted Vitality] Resolved fullName:', { 
        fullName, 
        legal_business_name: data.legal_business_name,
        legal_name: data.legal_name, 
        dba_name: data.dba_name, 
        full_name: data.full_name 
    });
    
    if (fullName) {
        const nameField = document.getElementById('profile-name');
        nameField.value = fullName;
        nameField.title = fullName; // Show full name on hover
        console.log('[Rooted Vitality] ✓ Set profile-name to:', fullName);
    } else {
        console.warn('[Rooted Vitality] ⚠ No name field found in data');
    }
    
    // DBA Name - display name for practitioners
    const dbaName = data.dba_name || '';
    if (dbaName) {
        document.getElementById('profile-dba-name').value = dbaName;
        console.log('[Rooted Vitality] ✓ Set DBA name to:', dbaName);
    }
    
    // Team Size - try business_size (from signup) first
    const teamSize = data.business_size || data.team_size || '';
    if (teamSize) {
        document.getElementById('profile-teamsize').value = teamSize;
        console.log('[Rooted Vitality] ✓ Set team_size to:', teamSize);
    }
    
    // Location fields - pull from address_city and address_state if available
    console.log('[Rooted Vitality] Location and address fields:', { 
        location: data.location,
        address_city: data.address_city,
        address_state: data.address_state,
        type: typeof data.location
    });
    
    // Years in Service - calculate from year_established
    let yearsValue = data.years_in_practice || data.years_in_service || null;
    
    // If no stored years value, calculate from year_established
    if (!yearsValue && data.year_established) {
        const established = parseInt(data.year_established);
        const currentYear = new Date().getFullYear();
        yearsValue = Math.max(1, currentYear - established); // At least 1 year
        console.log(`[Rooted Vitality] Calculated years: ${currentYear} - ${established} = ${yearsValue} years`);
    }
    
    if (yearsValue) {
        document.getElementById('profile-years').value = yearsValue;
        console.log('[Rooted Vitality] ✓ Set years to:', yearsValue);
    }
    
    // Avatar - from practitioners table (display only in profile form)
    // Use practice_logo_url for practitioner logo
    let avatarUrl = null;
    const avatarDiv = document.getElementById('profile-avatar');
    
    if (data.practice_logo_url) {
        avatarUrl = data.practice_logo_url;
        // Show image
        avatarDiv.innerHTML = `<img src="${avatarUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: inherit;">`;
        console.log('[Rooted Vitality] ✓ Set profile avatar preview to:', avatarUrl);
    } else {
        // Check local storage as fallback
        const localStorageAvatar = localStorage.getItem(`practice_logo_url_${data.id || data.user_id}`);
        if (localStorageAvatar) {
            avatarUrl = localStorageAvatar;
            avatarDiv.innerHTML = `<img src="${localStorageAvatar}" style="width: 100%; height: 100%; object-fit: cover; border-radius: inherit;">`;
            console.log('[Rooted Vitality] ✓ Set profile avatar preview (from local storage):', avatarUrl);
        } else {
            // Show initial from business name
            const initial = fullName ? fullName.charAt(0).toUpperCase() : 'P';
            avatarDiv.innerHTML = initial;
            avatarDiv.style.display = 'flex';
            avatarDiv.style.alignItems = 'center';
            avatarDiv.style.justifyContent = 'center';
            console.log('[Rooted Vitality] ✓ Set profile avatar to initial:', initial);
        }
    }
    
    // NOTE: Header avatar is now managed UNIVERSALLY by injections.js
    // Do NOT update header here - let the universal system handle it
    console.log('[Rooted Vitality] Profile avatar loaded. Header will be updated by injections.js');
    
    // Text sections - from practitioners table
    if (data.bio) {
        document.getElementById('about-content').value = data.bio;
        // Populate display text and lock section
        const aboutDisplay = document.getElementById('about-display');
        if (aboutDisplay) {
            aboutDisplay.textContent = data.bio;
            aboutDisplay.style.display = 'block';
        }
        // Hide textarea and swap buttons
        lockSectionEdit('about');
        console.log('[Rooted Vitality] ✓ Set bio');
    }
    if (data.ethos_statement) {
        document.getElementById('approach-content').value = data.ethos_statement;
        // Populate display text and lock section
        const approachDisplay = document.getElementById('approach-display');
        if (approachDisplay) {
            approachDisplay.textContent = data.ethos_statement;
            approachDisplay.style.display = 'block';
        }
        // Hide textarea and swap buttons
        lockSectionEdit('approach');
        console.log('[Rooted Vitality] ✓ Set ethos_statement');
    }
    
    // Credentials - now stored in practitioners.credentials JSONB array
    if (data.credentials && Array.isArray(data.credentials)) {
        console.log('[Rooted Vitality] ✓ Loading credentials from JSONB:', data.credentials);
        
        // Clear all credential arrays first
        window.educationCredentials = [];
        window.licenseCredentials = [];
        window.certificationCredentials = [];
        window.continuingEducationCredentials = [];
        
        // Separate credentials by type
        data.credentials.forEach(cred => {
            if (cred.credential_type === 'degree') {
                window.educationCredentials.push(cred);
            } else if (cred.credential_type === 'license') {
                window.licenseCredentials.push(cred);
            } else if (cred.credential_type === 'certification') {
                window.certificationCredentials.push(cred);
            } else if (cred.credential_type === 'continuing_education') {
                window.continuingEducationCredentials.push(cred);
            }
        });
        
        console.log('[Rooted Vitality] ✓ Credentials separated by type:', {
            degrees: window.educationCredentials.length,
            licenses: window.licenseCredentials.length,
            certifications: window.certificationCredentials.length,
            continuingEducation: window.continuingEducationCredentials.length
        });
    } else {
        // Fallback to legacy field names for backward compatibility
        console.log('[Rooted Vitality] ✓ Loading credentials from legacy fields (not JSONB)');
        if (data.education_credentials && Array.isArray(data.education_credentials)) {
            window.educationCredentials = data.education_credentials;
        } else {
            window.educationCredentials = [];
        }
        
        if (data.license_credentials && Array.isArray(data.license_credentials)) {
            window.licenseCredentials = data.license_credentials;
            console.log('[Rooted Vitality] ✓ Loaded license_credentials:', window.licenseCredentials.length, window.licenseCredentials);
        } else {
            window.licenseCredentials = [];
        }
        
        if (data.certification_credentials && Array.isArray(data.certification_credentials)) {
            window.certificationCredentials = data.certification_credentials;
            console.log('[Rooted Vitality] ✓ Loaded certification_credentials:', window.certificationCredentials.length, window.certificationCredentials);
        } else {
            window.certificationCredentials = [];
        }
        
        if (data.continuing_education && Array.isArray(data.continuing_education)) {
            window.continuingEducationCredentials = data.continuing_education;
        } else {
            window.continuingEducationCredentials = [];
        }
    }
    
    // Social media fields
    if (data.social_media) {
        const social = data.social_media;
        console.log('[Rooted Vitality] ✓ Processing social_media:', social);
        if (social.facebook) document.getElementById('social-facebook').value = social.facebook;
        if (social.instagram) document.getElementById('social-instagram').value = social.instagram;
        if (social.twitter) document.getElementById('social-x').value = social.twitter;
        if (social.linkedin) document.getElementById('social-linkedin').value = social.linkedin;
        if (social.youtube) document.getElementById('social-youtube').value = social.youtube;
        if (social.tiktok) document.getElementById('social-tiktok').value = social.tiktok;
        if (social.pinterest) document.getElementById('social-pinterest').value = social.pinterest;
        if (social.website) document.getElementById('social-website').value = social.website;
    }
    
    // Modalities/Specialties removed - managed in Match Settings
    
    // Load photos from gallery
    if (data.gallery_photos && Array.isArray(data.gallery_photos)) {
        loadPhotos(data.gallery_photos);
        console.log('[Rooted Vitality] ✓ Loaded gallery photos:', data.gallery_photos);
    } else {
        loadPhotos([]);
    }
    
    // Background check status - from practitioners table
    if (data.background_check_status) {
        console.log('[Rooted Vitality] ✓ Setting background check status:', data.background_check_status);
        updateBackgroundCheckStatus(data.background_check_status);
    }
    
    // Payment information - from practitioners table
    if (data.payment_methods) {
        const paymentEl = document.getElementById('payment-methods');
        if (paymentEl) {
            paymentEl.value = data.payment_methods;
            console.log('[Rooted Vitality] ✓ Set payment methods');
        }
    }
    
    // Load insurance providers list - check both insurance_providers and insurance_accepted for backwards compatibility
    let insuranceData = [];
    if (data.insurance_providers && Array.isArray(data.insurance_providers)) {
        insuranceData = data.insurance_providers;
        console.log('[Rooted Vitality] ✓ Loaded insurance_providers:', insuranceData);
    } else if (data.insurance_accepted && Array.isArray(data.insurance_accepted)) {
        insuranceData = data.insurance_accepted;
        console.log('[Rooted Vitality] ✓ Loaded insurance_accepted (legacy):', insuranceData);
    }
    window.selectedInsurance = insuranceData;
    loadInsurance(insuranceData);
    
    // Load payment methods
    if (data.payment_methods && Array.isArray(data.payment_methods)) {
        window.selectedPaymentMethods = data.payment_methods;
        console.log('[Rooted Vitality] ✓ Loaded payment_methods:', window.selectedPaymentMethods);
        // Check the appropriate checkboxes
        document.querySelectorAll('input[name="payment-method"]').forEach(cb => {
            cb.checked = window.selectedPaymentMethods.includes(cb.value);
        });
    } else {
        window.selectedPaymentMethods = [];
    }
    
    // Load custom insurance providers text
    if (data.custom_insurance_providers) {
        const customInsuranceEl = document.getElementById('custom-insurance-providers');
        if (customInsuranceEl) {
            customInsuranceEl.value = data.custom_insurance_providers;
            console.log('[Rooted Vitality] ✓ Loaded custom_insurance_providers:', data.custom_insurance_providers);
        }
    }
    
    // Load custom payment methods text
    if (data.custom_payment_methods) {
        const customPaymentEl = document.getElementById('custom-payment-methods');
        if (customPaymentEl) {
            customPaymentEl.value = data.custom_payment_methods;
            console.log('[Rooted Vitality] ✓ Loaded custom_payment_methods:', data.custom_payment_methods);
        }
    }
    
    // Load pricing information
    if (data.pricing) {
        loadPricing(data.pricing);
        console.log('[Rooted Vitality] ✓ Loaded pricing:', data.pricing);
    }
    
    // Load practice type information
    if (data.practice_type) {
        loadPractice(data.practice_type);
        console.log('[Rooted Vitality] ✓ Loaded practice type:', data.practice_type);
    }
    
    // Load conditions treated
    if (data.conditions_treated) {
        loadConditions(data.conditions_treated);
        console.log('[Rooted Vitality] ✓ Loaded conditions treated:', data.conditions_treated);
    }
    
    // Load video introduction
    console.log('[Rooted Vitality] Video URL from database:', data.intro_video_url);
    if (data.intro_video_url) {
        loadVideo(data.intro_video_url);
        console.log('[Rooted Vitality] ✓ Loaded intro video:', data.intro_video_url);
    } else {
        console.log('[Rooted Vitality] No video URL found in database');
    }
    
    // Continuing education credentials are loaded above from data.credentials array
    // (filtered by credential_type === 'continuing_education')
    // No need to load from a separate field
    console.log('[Rooted Vitality] ✓ Continuing education already loaded from credentials array:', window.continuingEducationCredentials.length, 'items');
    
    // Load languages from database
    // Languages are stored as text[] array in database
    if (data.languages) {
        console.log('[Rooted Vitality] Raw languages from DB:', data.languages, 'type:', typeof data.languages, 'isArray:', Array.isArray(data.languages));
        
        // Handle different formats that might come from database
        let languagesArray = [];
        if (Array.isArray(data.languages)) {
            languagesArray = data.languages;
        } else if (typeof data.languages === 'string') {
            // If it comes back as a string, try to parse it
            try {
                languagesArray = JSON.parse(data.languages);
            } catch (e) {
                // If parsing fails, treat as single language
                languagesArray = [data.languages];
            }
        }
        
        window.currentLanguages = languagesArray;
        console.log('[Rooted Vitality] ✓ Loaded languages from database:', window.currentLanguages);
    } else {
        window.currentLanguages = [];
        console.log('[Rooted Vitality] No languages found in database');
    }
    
    // Load FAQ from database
    if (data.faq && Array.isArray(data.faq)) {
        window.faqItems = data.faq;
        // Set nextId to max id + 1
        window.faqNextId = Math.max(...window.faqItems.map(item => item.id || 0), 0) + 1;
        console.log('[Rooted Vitality] ✓ Loaded FAQ from database:', window.faqItems.length, 'items');
    } else {
        window.faqItems = [];
        window.faqNextId = 0;
        console.log('[Rooted Vitality] No FAQ found in database');
    }
    
    // Legacy support: accepts_insurance boolean (will be migrated)
    if (data.accepts_insurance !== null && data.accepts_insurance !== undefined) {
        console.log('[Rooted Vitality] Legacy accepts_insurance found:', data.accepts_insurance);
    }
    
    console.log('[Rooted Vitality] ✓ Profile fields populated from database');
    
    // Initialize credential sections to show edit mode if they have content
    initializeCredentialSections();
    
    // Update credentials badge based on loaded data
    updateCredentialsBadge();
}

function initializeCredentialSections() {
    console.log('[Rooted Vitality] 🔧 initializeCredentialSections starting...');
    
    // For degrees, licenses, and certifications - show edit mode to allow adding/editing
    const credentialSections = ['degrees', 'licenses', 'certifications'];
    
    credentialSections.forEach(sectionId => {
        console.log(`[Rooted Vitality] 🔧 Processing section: ${sectionId}`);
        
        const editDiv = document.getElementById(`${sectionId}-edit`);
        const displayDiv = document.getElementById(`${sectionId}-display`);
        const credType = sectionId === 'degrees' ? 'degree' : sectionId === 'licenses' ? 'license' : 'certification';
        
        console.log(`[Rooted Vitality] 🔧 Found elements: editDiv=${!!editDiv}, displayDiv=${!!displayDiv}, credType=${credType}`);
        
        if (editDiv) {
            editDiv.style.display = 'flex';
            console.log(`[Rooted Vitality] 🔧 Set ${sectionId}-edit display = flex`);
        } else {
            console.error(`[Rooted Vitality] ❌ Could not find ${sectionId}-edit element!`);
        }
        
        if (displayDiv) {
            displayDiv.style.display = 'none';
            console.log(`[Rooted Vitality] 🔧 Set ${sectionId}-display display = none`);
        }
        
        // Render any existing credentials
        console.log(`[Rooted Vitality] 🔧 Calling renderCredentials for type: ${credType}`);
        renderCredentials(credType);
        
        // NOTE: Removed auto-template creation on page load
        // It was causing the badge to light up even with no real credentials
        // Users can click "+ Add License" to add credentials manually
        const credentialArray = getCredentialArray(credType);
        console.log(`[Rooted Vitality] 🔧 Credential array length: ${credentialArray.length}`);
    });
    
    // Initialize continuing education section
    console.log(`[Rooted Vitality] 🔧 Processing section: continuing-education`);
    const ceEditDiv = document.getElementById('continuing-education-edit');
    const ceDisplayDiv = document.getElementById('continuing-education-display');
    
    if (ceEditDiv) {
        ceEditDiv.style.display = 'flex';
        console.log(`[Rooted Vitality] 🔧 Set continuing-education-edit display = flex`);
    }
    
    if (ceDisplayDiv) {
        ceDisplayDiv.style.display = 'none';
        console.log(`[Rooted Vitality] 🔧 Set continuing-education-display display = none`);
    }
    
    // Render any existing continuing education credentials
    console.log(`[Rooted Vitality] 🔧 Rendering continuing education list`);
    renderContinuingEducationList();
    
    console.log(`[Rooted Vitality] 🔧 Credential array length: ${(window.continuingEducationCredentials || []).length}`);
    console.log('[Rooted Vitality] 🔧 initializeCredentialSections completed');
}

// Debounce timer for completeness updates
let completenessTimeout = null;

function setupInputListeners() {
    const inputFields = [
        'profile-name', 'profile-years', 'profile-teamsize', 'profile-dba-name',
        'about-content', 'approach-content', 'degrees-content', 'licenses-content',
        'certifications-content', 'social-facebook', 'social-instagram', 'social-x',
        'social-linkedin', 'social-youtube', 'social-tiktok', 'social-pinterest', 'social-website'
    ];
    
    inputFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', () => {
                clearTimeout(autoSaveTimeout);
                
                // Debounce completeness update (update after 500ms of no input)
                clearTimeout(completenessTimeout);
                completenessTimeout = setTimeout(() => {
                    updateProfileCompleteness();
                }, 500);
            });
        }
    });
    
    // Setup section save buttons
    setupSectionSaveButtons();
    
    // Setup payment and insurance checkboxes
    setupPaymentInsuranceSection();
}

/**
 * Calculate and update profile completeness meter
 * Covers all profile sections: About, Credentials, Photos/Video, Reviews, Additional Details
 * Total: 18 sections for comprehensive profile tracking
 */
function updateProfileCompleteness() {
    try {
        // Define what needs to be filled for each section
        // 17 total sections tracked across all profile panels (location removed)
        const sections = {
            // About & Specializations Panel (5 sections)
            'name': () => !!document.getElementById('profile-name')?.value?.trim(),
            'years': () => {
                const val = document.getElementById('profile-years')?.value;
                return val !== null && val !== undefined && val !== '';
            },
            'about': () => !!document.getElementById('about-content')?.value?.trim(),
            'approach': () => !!document.getElementById('approach-content')?.value?.trim(),
            'conditions': () => {
                // Complete if at least 1 condition checkbox is checked
                const checkedConditions = document.querySelectorAll('input[name="condition"]:checked');
                return checkedConditions && checkedConditions.length > 0;
            },
            
            // Credentials Panel (3 sections)
            'education': () => window.educationCredentials && window.educationCredentials.length > 0,
            'licenses': () => window.licenseCredentials && window.licenseCredentials.length > 0,
            'certifications': () => window.certificationCredentials && window.certificationCredentials.length > 0,
            
            // Photos & Video Panel (2 sections)
            'photos': () => window.currentPhotos && window.currentPhotos.length > 0,
            'video': () => window.videoData && window.videoData.url,
            
            // Reviews Panel (1 section)
            'reviews': () => {
                // Complete if they have any reviews (mock data counts for now)
                return allReviews && allReviews.length > 0;
            },
            
            // Additional Details Panel (6 sections)
            'languages': () => {
                const langsList = document.getElementById('languages-list');
                return langsList && langsList.querySelectorAll('.language-tag').length > 0;
            },
            'faq': () => {
                const faqList = document.getElementById('faq-list');
                return faqList && faqList.querySelectorAll('.faq-item').length > 0;
            },
            'practice': () => {
                // Complete if structure or setting selected
                const hasStructure = window.practiceData && window.practiceData.structure;
                return !!hasStructure;
            },
            'pricing': () => {
                // Complete if any pricing info provided
                const hasPrice = window.pricingData && (
                    window.pricingData.fixedRate || 
                    (window.pricingData.minRate && window.pricingData.maxRate) ||
                    (window.pricingData.tiers && window.pricingData.tiers.length > 0)
                );
                return !!hasPrice;
            },
            'payment': () => {
                // Complete if at least 1 payment method checkbox is checked OR custom text provided
                const paymentMethodsSelected = document.querySelectorAll('input[name="payment-method"]:checked').length > 0;
                const customPayment = document.getElementById('custom-payment-methods')?.value?.trim() || '';
                return paymentMethodsSelected || !!customPayment;
            },
            'insurance': () => {
                // Complete if insurance checkbox selected OR at least 1 provider checkbox checked OR custom text
                const acceptsInsurance = document.getElementById('accepts-insurance')?.checked || false;
                const insuranceSelected = document.querySelectorAll('input[name="insurance-provider"]:checked').length > 0;
                const customInsurance = document.getElementById('custom-insurance-providers')?.value?.trim() || '';
                return acceptsInsurance || insuranceSelected || !!customInsurance;
            },
            'social': () => {
                // Complete if at least 1 social media field is filled
                const socialFields = ['social-facebook', 'social-instagram', 'social-x', 'social-linkedin', 
                                    'social-youtube', 'social-tiktok', 'social-pinterest', 'social-website'];
                return socialFields.some(fieldId => !!document.getElementById(fieldId)?.value?.trim());
            },
            'continuing-education': () => window.continuingEducationCredentials && window.continuingEducationCredentials.length > 0
        };
        
        // Calculate completed sections
        let completedCount = 0;
        const totalSections = Object.keys(sections).length;
        
        for (const [sectionName, checkFn] of Object.entries(sections)) {
            if (checkFn()) {
                completedCount++;
            }
        }
        
        // Calculate percentage
        const percentage = Math.round((completedCount / totalSections) * 100);
        
        // Update UI
        const progressEl = document.getElementById('completeness-progress');
        const percentageEl = document.getElementById('completeness-percentage');
        const labelEl = document.getElementById('completeness-label');
        
        if (progressEl) {
            progressEl.style.width = percentage + '%';
        }
        if (percentageEl) {
            percentageEl.textContent = percentage + '%';
        }
        if (labelEl) {
            if (percentage === 100) {
                labelEl.textContent = '✓ Profile complete!';
                labelEl.style.color = '#5c9a72';
            } else {
                const remaining = totalSections - completedCount;
                labelEl.textContent = `${remaining} section${remaining !== 1 ? 's' : ''} to go`;
                labelEl.style.color = 'var(--placeholder)';
            }
        }
        
        console.log(`[Rooted Vitality] Profile completeness: ${completedCount}/${totalSections} (${percentage}%)`);
        
        // Update credentials badge
        updateCredentialsBadge();
    } catch (error) {
        console.error('[Rooted Vitality] Error calculating profile completeness:', error);
    }
}

/**
 * Update credentials badge based on background check status, license credentials, certification credentials, and verification status
 */
function updateCredentialsBadge() {
    try {
        const badgeBackgroundCheck = document.getElementById('badge-background-check');
        const badgeLicense = document.getElementById('badge-license');
        const badgeCertified = document.getElementById('badge-certified');
        const badgeVerified = document.getElementById('badge-verified');
        
        if (!badgeBackgroundCheck) {
            console.warn('[Rooted Vitality] Background check badge element not found!');
        }
        
        if (!badgeLicense) {
            console.warn('[Rooted Vitality] License badge element not found!');
        }
        
        if (!badgeCertified) {
            console.warn('[Rooted Vitality] Certified badge element not found!');
        }
        
        if (!badgeVerified) {
            console.warn('[Rooted Vitality] Verified badge element not found!');
        }
        
        const hasBackgroundCheck = window.practitionerData && window.practitionerData.badge_background_check;
        const hasLicense = window.practitionerData && window.practitionerData.badge_licensed;
        const hasCertified = window.practitionerData && window.practitionerData.badge_certified;
        const isVerified = window.practitionerData && window.practitionerData.badge_verified;
        
        console.log('[Rooted Vitality] updateCredentialsBadge - Status:', {
            hasBackgroundCheck,
            hasLicense,
            hasCertified,
            isVerified,
            badgeBackgroundCheck: window.practitionerData?.badge_background_check,
            badgeLicensed: window.practitionerData?.badge_licensed,
            badgeCertified: window.practitionerData?.badge_certified,
            badgeVerified: window.practitionerData?.badge_verified
        });
        
        // Background Check Badge - ALWAYS reset to locked state first
        if (badgeBackgroundCheck) {
            badgeBackgroundCheck.classList.add('badge-locked');
            badgeBackgroundCheck.classList.remove('background-check');
            
            if (hasBackgroundCheck) {
                badgeBackgroundCheck.classList.remove('badge-locked');
                badgeBackgroundCheck.classList.add('background-check');
                console.log('[Rooted Vitality] ⭐ Badge activated: Background Check');
            } else {
                console.log('[Rooted Vitality] ✓ Background Check badge stays locked', { hasBackgroundCheck });
            }
        }
        
        // License Badge - ALWAYS reset to locked state first
        if (badgeLicense) {
            badgeLicense.classList.add('badge-locked');
            badgeLicense.classList.remove('license');
            
            if (hasLicense) {
                badgeLicense.classList.remove('badge-locked');
                badgeLicense.classList.add('license');
                console.log('[Rooted Vitality] ⭐ Badge activated: License');
            } else {
                console.log('[Rooted Vitality] ✓ License badge stays locked', { hasLicense });
            }
        }
        
        // Certified Badge - ALWAYS reset to locked state first
        if (badgeCertified) {
            badgeCertified.classList.add('badge-locked');
            badgeCertified.classList.remove('certified');
            
            if (hasCertified) {
                badgeCertified.classList.remove('badge-locked');
                badgeCertified.classList.add('certified');
                console.log('[Rooted Vitality] ⭐ Badge activated: Certified');
            } else {
                console.log('[Rooted Vitality] ✓ Certified badge stays locked', { hasCertified });
            }
        }
        
        // Verified Badge - ALWAYS reset to locked state first
        if (badgeVerified) {
            badgeVerified.classList.add('badge-locked');
            badgeVerified.classList.remove('verified');
            
            if (isVerified) {
                badgeVerified.classList.remove('badge-locked');
                badgeVerified.classList.add('verified');
                console.log('[Rooted Vitality] ⭐ Badge activated: Verified');
            } else {
                console.log('[Rooted Vitality] ✓ Verified badge stays locked', { isVerified });
            }
        }
    } catch (error) {
        console.error('[Rooted Vitality] Error updating credentials badge:', error);
    }
}

function setupHeaderSaveButton() {
    const saveBtn = document.getElementById('save-header-info');
    if (saveBtn) {
        saveBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await saveHeaderInfo();
        });
    }

    // Add auto-save event listener for DBA name field
    const dbaNameInput = document.getElementById('profile-dba-name');
    if (dbaNameInput) {
        dbaNameInput.addEventListener('blur', () => {
            debounceAutoSave.call({ target: dbaNameInput });
        });
        dbaNameInput.addEventListener('change', () => {
            debounceAutoSave.call({ target: dbaNameInput });
        });
    }
}

async function saveHeaderInfo() {
    if (!currentUser) {
        console.warn('[Rooted Vitality] No current user for header info save');
        return;
    }
    
    try {
        showAutoSaveIndicator('saving');
        
        const updateData = {
            legal_name: document.getElementById('profile-name')?.value || '',
            dba_name: document.getElementById('profile-dba-name')?.value || '',
            business_size: document.getElementById('profile-teamsize')?.value || '',
            year_established: document.getElementById('profile-years')?.value || null,
            updated_at: new Date().toISOString()
        };
        
        console.log('[Rooted Vitality] Saving header info:', updateData);
        const result = await safePractitionerUpdate(updateData);
        
        console.log('[Rooted Vitality] Header info saved successfully:', result);
        window.practitionerData = result;
        showAutoSaveIndicator('success');
        updateProfileCompleteness();
        
    } catch (error) {
        console.error('[Rooted Vitality] Error in saveHeaderInfo:', error);
        showAutoSaveIndicator('error');
    }
}

function setupSectionSaveButtons() {
    const saveBtns = document.querySelectorAll('.section-save-btn');
    saveBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const sectionId = btn.getAttribute('data-section');
            await saveSectionData(sectionId);
        });
    });
    
    // Setup edit buttons for sections that were already saved
    const editBtns = document.querySelectorAll('.section-edit-btn');
    editBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const sectionId = btn.getAttribute('data-section');
            enableSectionEdit(sectionId);
        });
    });
    
    // Setup credential management buttons
    setupCredentialButtons();
}

function setupCredentialButtons() {
    const addDegreBtn = document.getElementById('add-degree-btn');
    const addLicenseBtn = document.getElementById('add-license-btn');
    const addCertBtn = document.getElementById('add-certification-btn');
    
    if (addDegreBtn) addDegreBtn.addEventListener('click', () => addCredential('degree'));
    if (addLicenseBtn) addLicenseBtn.addEventListener('click', () => addCredential('license'));
    if (addCertBtn) addCertBtn.addEventListener('click', () => addCredential('certification'));
}

/**
 * Setup tracking for unsaved changes
 * Monitors all form inputs and marks page as having unsaved changes
 * Clears the flag when a successful save completes
 */
function setupUnsavedChangesTracking() {
    console.log('[UNSAVED] Setting up unsaved changes tracking...');
    
    // Helper function to mark changes
    window.markAsChanged = function() {
        if (!hasUnsavedChanges) {
            hasUnsavedChanges = true;
            console.log('[UNSAVED] ✏️ Page has unsaved changes');
        }
    };
    
    // Helper function to clear changes flag after successful save
    window.clearUnsavedChanges = function() {
        hasUnsavedChanges = false;
        console.log('[UNSAVED] ✓ Unsaved changes cleared (save successful)');
    };
    
    // Monitor text inputs and textareas
    document.addEventListener('input', (e) => {
        if (e.target.matches('input[type="text"], input[type="email"], input[type="url"], textarea')) {
            window.markAsChanged();
        }
    }, { capture: true });
    
    // Monitor checkboxes and radio buttons
    document.addEventListener('change', (e) => {
        if (e.target.matches('input[type="checkbox"], input[type="radio"], select')) {
            window.markAsChanged();
        }
    }, { capture: true });
    
    console.log('[UNSAVED] ✓ Unsaved changes tracking initialized');
}

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
}


function removeCredential(type, id) {
    const credentialArray = getCredentialArray(type);
    const index = credentialArray.findIndex(c => c.id === id);
    if (index > -1) {
        credentialArray.splice(index, 1);
        renderCredentials(type);
        updateProfileCompleteness();
        updateCredentialsBadge();
    }
}

function getCredentialArray(type) {
    switch(type) {
        case 'degree': return window.educationCredentials || [];
        case 'license': return window.licenseCredentials || [];
        case 'certification': return window.certificationCredentials || [];
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

function renderCredentials(type) {
    const credentialArray = getCredentialArray(type);
    const listId = `${type === 'degree' ? 'degrees' : type === 'license' ? 'licenses' : 'certifications'}-list`;
    const listElement = document.getElementById(listId);
    
    console.log(`[Rooted Vitality] renderCredentials for type ${type}:`, {credentialArray, listElement});
    
    if (!listElement) {
        console.error(`[Rooted Vitality] List element not found for ${type}`);
        return;
    }
    
    listElement.innerHTML = '';
    
    credentialArray.forEach(credential => {
        console.log(`[Rooted Vitality] Creating form for credential:`, credential);
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
            <button class="credential-item-remove" onclick="removeCredential('${type}', ${credential.id})" title="Remove">×</button>
        </div>
        <div class="credential-fields-grid">
            ${fieldsHTML}
        </div>
    `;
    
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

/* Debounce auto-save for Phase 1 sections (Languages, FAQ) */
function debounceAutoSave(sectionOverride = null) {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
        // If section is explicitly provided, use it
        if (sectionOverride) {
            saveSectionData(sectionOverride);
            return;
        }
        
        // Check if this is a header field edit and save immediately
        if (event && event.target) {
            const fieldId = event.target.id;
            if (['profile-name', 'profile-years', 'profile-teamsize', 'profile-dba-name'].includes(fieldId)) {
                saveHeaderFields();
                return;
            }
            
            // Otherwise, determine which section was modified
            const section = event.target.closest('[data-section]');
            if (section) {
                const sectionId = section.getAttribute('data-section');
                saveSectionData(sectionId);
            }
        }
    }, AUTO_SAVE_DELAY);
}

/**
 * Save header metadata fields (name, location, years, team size)
 */
async function saveHeaderFields() {
    if (!currentUser) return;
    
    try {
        showAutoSaveIndicator('saving');
        
        const headerData = {
            user_id: currentUser.id,
            email: currentUser.email || '',
            legal_name: document.getElementById('profile-name')?.value || '',
            dba_name: document.getElementById('profile-dba-name')?.value || '',
            business_size: document.getElementById('profile-teamsize')?.value || '',
            updated_at: new Date().toISOString()
        };
        
        console.log('[Rooted Vitality] Saving header fields with UPSERT:', headerData);
        
        // Use UPSERT to handle both insert and update
        const { error: upsertError } = await window.supabaseClient
            .from('practitioners')
            .upsert(headerData, { onConflict: 'user_id' });
        
        if (upsertError) {
            console.error('[Rooted Vitality] Error saving header fields:', upsertError);
            showAutoSaveIndicator('error');
            return;
        }
        
        console.log('[Rooted Vitality] Header fields saved successfully with UPSERT');
        showAutoSaveIndicator('success');
        
        // Update completeness meter
        updateProfileCompleteness();
        window.clearUnsavedChanges();
        
    } catch (error) {
        console.error('[Rooted Vitality] Error in saveHeaderFields:', error);
        showAutoSaveIndicator('error');
    }
}

async function saveSectionData(sectionId) {
    console.log('═══════════════════════════════════════════════════');
    console.log(`[SAVE] STARTING SAVE FOR SECTION: ${sectionId.toUpperCase()}`);
    console.log('═══════════════════════════════════════════════════');
    
    if (!currentUser) {
        console.error('[SAVE] ❌ NO CURRENT USER - CANNOT SAVE');
        showAutoSaveIndicator('error');
        return;
    }
    
    console.log(`[SAVE] Current User ID: ${currentUser.id}`);
    
    try {
        showAutoSaveIndicator('saving');
        
        // Handle master sections that contain multiple subsections
        if (sectionId === 'about') {
            // About & Specializations section saves: About You + Your Approach & Philosophy + Conditions & Specializations
            await saveAboutSection();
        } else if (sectionId === 'credentials') {
            // Credentials section saves: Degrees + Licenses + Certifications + Background Check + Continuing Education
            await saveCredentialsSection('all');
        } else if (sectionId === 'photos') {
            // Photos & Video section saves: Professional Photos + Professional Video Introduction
            await savePhotosAndVideoSection();
        } else if (sectionId === 'more-details') {
            // More Details section saves: Languages + FAQ + Social Media + Practice Type + Payment & Insurance
            await saveMoreDetailsSection();
        } else {
            // Fallback for individual sections (shouldn't normally reach here)
            console.warn(`[SAVE] ⚠️ Unknown section: ${sectionId}`);
            showAutoSaveIndicator('error');
            return;
        }
        
        // After section is saved, update profile_completion_percent in database
        const percentageEl = document.getElementById('completeness-percentage');
        const profileCompletionPercent = percentageEl ? parseInt(percentageEl.textContent) : 0;
        
        console.log(`[SAVE] Saving profile_completion_percent: ${profileCompletionPercent}%`);
        
        const { error: updateError } = await window.supabaseClient
            .from('practitioners')
            .update({ 
                profile_completion_percent: profileCompletionPercent,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', currentUser.id);
        
        if (updateError) {
            console.error('[SAVE] ❌ Error updating profile_completion_percent:', updateError);
        } else {
            console.log(`[SAVE] ✓ profile_completion_percent updated to ${profileCompletionPercent}%`);
        }
        
        showAutoSaveIndicator('success');
        
    } catch (error) {
        console.error(`[SAVE] ❌ Error in saveSectionData for ${sectionId}:`, error);
        showAutoSaveIndicator('error');
    }
}

/**
 * Save About & Specializations section (About You + Approach + Conditions)
 */
async function saveAboutSection() {
    try {
        const conditionsData = saveConditionsData();
        
        const updateData = {
            bio: document.getElementById('about-content')?.value || '',
            ethos_statement: document.getElementById('approach-content')?.value || '',
            conditions_treated: Array.isArray(conditionsData) ? conditionsData : [],
            updated_at: new Date().toISOString()
        };
        
        console.log('[SAVE] About section data:', updateData);
        console.log('[SAVE] Conditions type:', typeof updateData.conditions_treated, 'value:', updateData.conditions_treated);
        
        const result = await safePractitionerUpdate(updateData);
        
        console.log('[SAVE] ✓ About section saved successfully');
        console.log('[SAVE] Result conditions:', result?.conditions_treated);
        window.practitionerData = result;
        showAutoSaveIndicator('success');
        lockSectionEdit('about');
        updateProfileCompleteness();
        window.clearUnsavedChanges();
        
    } catch (error) {
        console.error('[SAVE] ❌ Error in saveAboutSection:', error);
        showAutoSaveIndicator('error');
    }
}

/**
 * Save Credentials section (Degrees + Licenses + Certifications + Background Check + Continuing Education)
 */
async function saveCredentialsSection(type = 'all') {
    try {
        // Combine all credentials into one array
        const allCredentials = [];
        
        // Add degrees
        if (window.educationCredentials && window.educationCredentials.length > 0) {
            window.educationCredentials.forEach(cred => {
                allCredentials.push({
                    ...cred,
                    credential_type: 'degree'
                });
            });
        }
        
        // Add licenses
        if (window.licenseCredentials && window.licenseCredentials.length > 0) {
            window.licenseCredentials.forEach(cred => {
                allCredentials.push({
                    ...cred,
                    credential_type: 'license'
                });
            });
        }
        
        // Add certifications
        if (window.certificationCredentials && window.certificationCredentials.length > 0) {
            window.certificationCredentials.forEach(cred => {
                allCredentials.push({
                    ...cred,
                    credential_type: 'certification'
                });
            });
        }
        
        // Add continuing education
        if (window.continuingEducationCredentials && window.continuingEducationCredentials.length > 0) {
            window.continuingEducationCredentials.forEach(cred => {
                allCredentials.push({
                    ...cred,
                    credential_type: 'continuing_education'
                });
            });
        }
        
        console.log('[SAVE] All credentials to save:', allCredentials);
        
        // Save to practitioners.credentials JSONB column
        const updateData = {
            credentials: allCredentials,
            updated_at: new Date().toISOString()
        };
        
        const result = await safePractitionerUpdate(updateData);
        
        console.log('[SAVE] ✓ Credentials saved successfully');
        window.practitionerData = result;
        showAutoSaveIndicator('success');
        lockSectionEdit('credentials');
        updateProfileCompleteness();
        updateCredentialsBadge();
        window.clearUnsavedChanges();
        
    } catch (error) {
        console.error('[SAVE] ❌ Error in saveCredentialsSection:', error);
        showAutoSaveIndicator('error');
    }
}

/**
 * Save Photos & Video section (Professional Photos + Professional Video Introduction)
 */
async function savePhotosAndVideoSection() {
    try {
        const photosData = getPhotosForSave();
        const updateData = {
            gallery_photos: photosData,
            intro_video_url: window.videoData?.url || null,
            updated_at: new Date().toISOString()
        };
        
        console.log('[SAVE] Photos & Video section data:', updateData);
        console.log('[SAVE] Photos data size:', JSON.stringify(photosData).length, 'characters');
        
        const result = await safePractitionerUpdate(updateData);
        
        console.log('[SAVE] ✓ Photos & Video section saved successfully');
        window.practitionerData = result;
        showAutoSaveIndicator('success');
        lockSectionEdit('photos');
        updateProfileCompleteness();
        window.clearUnsavedChanges();
        
    } catch (error) {
        console.error('[SAVE] ❌ Error in savePhotosAndVideoSection:', error);
        console.error('[SAVE] ❌ Error details:', error);
        showAutoSaveIndicator('error');
    }
}

/**
 * Save More Details section (Languages + FAQ + Social Media + Practice Type + Payment & Insurance)
 */
async function saveMoreDetailsSection() {
    try {
        console.log('[SAVE] ========== saveMoreDetailsSection STARTED ==========');
        console.log('[SAVE] window.currentLanguages:', window.currentLanguages);
        console.log('[SAVE] window.faqItems:', window.faqItems);
        
        const paymentCheckboxData = getPaymentCheckboxValues();
        
        console.log('[SAVE] paymentCheckboxData:', paymentCheckboxData);
        console.log('[SAVE] Insurance providers from checkboxes:', paymentCheckboxData.insurance_providers);
        console.log('[SAVE] Payment methods from checkboxes:', paymentCheckboxData.payment_methods);
        
        const selectedLanguages = getSelectedLanguages();
        console.log('[SAVE] selectedLanguages from getSelectedLanguages():', selectedLanguages);
        console.log('[SAVE] selectedLanguages type:', typeof selectedLanguages, 'isArray:', Array.isArray(selectedLanguages));
        
        // Ensure languages is properly formatted as an array
        const languagesToSave = Array.isArray(selectedLanguages) ? selectedLanguages : [];
        console.log('[SAVE] languagesToSave (after formatting):', languagesToSave);
        
        // Ensure FAQ is properly formatted as an array
        const faqToSave = Array.isArray(window.faqItems) ? window.faqItems : [];
        console.log('[SAVE] faqToSave (after formatting):', faqToSave);
        
        const updateData = {
            languages: languagesToSave,
            faq: faqToSave,
            social_media: {
                facebook: document.getElementById('social-facebook')?.value || '',
                instagram: document.getElementById('social-instagram')?.value || '',
                twitter: document.getElementById('social-x')?.value || '',
                linkedin: document.getElementById('social-linkedin')?.value || '',
                youtube: document.getElementById('social-youtube')?.value || '',
                tiktok: document.getElementById('social-tiktok')?.value || '',
                pinterest: document.getElementById('social-pinterest')?.value || '',
                website: document.getElementById('social-website')?.value || ''
            },
            accepts_insurance: paymentCheckboxData.accepts_insurance === true,
            insurance_providers: Array.isArray(paymentCheckboxData.insurance_providers) ? paymentCheckboxData.insurance_providers : [],
            custom_insurance_providers: paymentCheckboxData.custom_insurance_providers || '',
            payment_methods: Array.isArray(paymentCheckboxData.payment_methods) ? paymentCheckboxData.payment_methods : [],
            custom_payment_methods: paymentCheckboxData.custom_payment_methods || '',
            updated_at: new Date().toISOString()
        };
        
        // Remove practice_type from here (redundant - already captured in signup/hero)
        
        console.log('[SAVE] More Details section data:', updateData);
        console.log('[SAVE] Languages being saved:', updateData.languages, 'Type:', typeof updateData.languages);
        console.log('[SAVE] FAQ being saved:', updateData.faq, 'Type:', typeof updateData.faq);
        console.log('[SAVE] Payment Methods being saved:', updateData.payment_methods, 'Type:', typeof updateData.payment_methods);
        console.log('[SAVE] Insurance Providers being saved:', updateData.insurance_providers, 'Type:', typeof updateData.insurance_providers);
        
        const result = await safePractitionerUpdate(updateData);
        
        console.log('[SAVE] ✓ More Details section saved successfully');
        console.log('[SAVE] Result from database:', result);
        console.log('[SAVE] Languages in result:', result?.languages, 'Type:', typeof result?.languages);
        console.log('[SAVE] Payment Methods in result:', result?.payment_methods, 'Type:', typeof result?.payment_methods);
        console.log('[SAVE] Insurance Providers in result:', result?.insurance_providers, 'Type:', typeof result?.insurance_providers);
        window.practitionerData = result;
        showAutoSaveIndicator('success');
        lockSectionEdit('more-details');
        updateProfileCompleteness();
        window.clearUnsavedChanges();
        
    } catch (error) {
        console.error('[SAVE] ❌ Error in saveMoreDetailsSection:', error);
        showAutoSaveIndicator('error');
    }
}

function convertToReadOnlyDisplay(sectionId) {
    const section = document.querySelector(`[data-section="${sectionId}"]`);
    if (!section) return;
    
    section.classList.add('section-readonly');
    section.classList.remove('section-edit');
    
    // Handle credential sections (degrees, licenses, certifications)
    if (['degrees', 'licenses', 'certifications'].includes(sectionId)) {
        const editDiv = document.getElementById(`${sectionId}-edit`);
        const displayDiv = document.getElementById(`${sectionId}-display`);
        
        if (editDiv) editDiv.style.display = 'none';
        if (displayDiv) {
            displayDiv.style.display = 'block';
            displayCredentials(sectionId === 'degrees' ? 'degree' : sectionId === 'licenses' ? 'license' : 'certification');
        }
    } else {
        // Handle regular text sections
        const fieldIds = {
            'about': 'about-content',
            'approach': 'approach-content'
        };
        
        const fieldId = fieldIds[sectionId];
        if (fieldId) {
            const textarea = document.getElementById(fieldId);
            if (textarea && !textarea.nextElementSibling?.classList.contains('section-display-text')) {
                const displayDiv = document.createElement('div');
                displayDiv.className = 'section-display-text';
                displayDiv.textContent = textarea.value;
                textarea.parentNode.insertBefore(displayDiv, textarea.nextSibling);
            } else if (textarea && textarea.nextElementSibling?.classList.contains('section-display-text')) {
                textarea.nextElementSibling.textContent = textarea.value;
            }
        }
        
        // For social section, create display divs for each field
        if (sectionId === 'social') {
            const socialFields = ['facebook', 'instagram', 'x', 'linkedin', 'youtube', 'tiktok', 'pinterest', 'website'];
            socialFields.forEach(platform => {
                const fieldId = `social-${platform}`;
                const input = document.getElementById(fieldId);
                if (input && input.value && !input.parentNode.querySelector('.section-display-text')) {
                    const displayDiv = document.createElement('div');
                    displayDiv.className = 'section-display-text';
                    displayDiv.innerHTML = `<strong>${platform.charAt(0).toUpperCase() + platform.slice(1)}:</strong> <a href="${input.value}" target="_blank">${input.value}</a>`;
                    input.parentNode.appendChild(displayDiv);
                } else if (input && input.value) {
                    const displayDiv = input.parentNode.querySelector('.section-display-text');
                    if (displayDiv) {
                        displayDiv.innerHTML = `<strong>${platform.charAt(0).toUpperCase() + platform.slice(1)}:</strong> <a href="${input.value}" target="_blank">${input.value}</a>`;
                    }
                }
            });
        }
    }
    
    // Change save button to edit button
    const saveBtn = section.querySelector('.section-save-btn');
    const header = section.querySelector('.section-header');
    if (saveBtn) {
        saveBtn.style.display = 'none';
        
        // Create edit button if it doesn't exist
        if (!header.querySelector('.section-edit-btn')) {
            const editBtn = document.createElement('button');
            editBtn.className = 'section-edit-btn';
            editBtn.setAttribute('data-section', sectionId);
            editBtn.innerHTML = '✎ Edit';
            editBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                enableSectionEdit(sectionId);
            });
            header.appendChild(editBtn);
        } else {
            header.querySelector('.section-edit-btn').style.display = 'inline-block';
        }
    }
}

function enableSectionEdit(sectionId) {
    const section = document.querySelector(`[data-section="${sectionId}"]`);
    if (!section) return;
    
    section.classList.remove('section-readonly');
    section.classList.add('section-edit');
    
    // Handle credential sections
    if (['degrees', 'licenses', 'certifications'].includes(sectionId)) {
        const editDiv = document.getElementById(`${sectionId}-edit`);
        const displayDiv = document.getElementById(`${sectionId}-display`);
        
        if (editDiv) editDiv.style.display = 'flex';
        if (displayDiv) displayDiv.style.display = 'none';
        
        // Re-render credential fields
        const credType = sectionId === 'degrees' ? 'degree' : sectionId === 'licenses' ? 'license' : 'certification';
        renderCredentials(credType);
    } else if (sectionId === 'languages') {
        // Handle languages section
        const editDiv = document.getElementById('languages-edit');
        const displayDiv = document.getElementById('languages-display');
        
        if (editDiv) editDiv.style.display = 'block';
        if (displayDiv) displayDiv.style.display = 'none';
    } else if (sectionId === 'payment') {
        // Handle payment/insurance section
        const editDiv = document.getElementById('insurance-edit');
        const displayDiv = document.getElementById('insurance-display');
        
        if (editDiv) editDiv.style.display = 'grid';
        if (displayDiv) displayDiv.style.display = 'none';
        renderInsuranceCheckboxes();
    } else if (sectionId === 'pricing') {
        // Handle pricing section
        const editDiv = document.getElementById('pricing-edit');
        const displayDiv = document.getElementById('pricing-display');
        
        if (editDiv) editDiv.style.display = 'block';
        if (displayDiv) displayDiv.style.display = 'none';
    } else if (sectionId === 'practice') {
        // Handle practice type section
        const editDiv = document.getElementById('practice-edit');
        const displayDiv = document.getElementById('practice-display');
        
        if (editDiv) editDiv.style.display = 'block';
        if (displayDiv) displayDiv.style.display = 'none';
    } else if (sectionId === 'conditions') {
        // Handle conditions section
        const editDiv = document.getElementById('conditions-edit');
        const displayDiv = document.getElementById('conditions-display');
        
        if (editDiv) editDiv.style.display = 'block';
        if (displayDiv) displayDiv.style.display = 'none';
    } else if (sectionId === 'video') {
        // Handle video section
        const editDiv = document.getElementById('video-edit');
        const displayDiv = document.getElementById('video-display');
        
        if (editDiv) editDiv.style.display = 'block';
        if (displayDiv) displayDiv.style.display = 'none';
    } else if (sectionId === 'continuing-education') {
        // Handle continuing education section
        const editDiv = document.getElementById('continuing-education-edit');
        const displayDiv = document.getElementById('continuing-education-display');
        
        if (editDiv) editDiv.style.display = 'flex';
        if (displayDiv) displayDiv.style.display = 'none';
        renderContinuingEducationList();
    } else if (sectionId === 'photos') {
        // Handle photo gallery section
        const editDiv = document.getElementById('photos-edit');
        const displayDiv = document.getElementById('photos-display');
        
        if (editDiv) editDiv.style.display = 'block';
        if (displayDiv) displayDiv.style.display = 'none';
        renderPhotosList();
    } else {
        // Show the textarea for regular text sections
        const textarea = section.querySelector('.section-edit-field');
        if (textarea) {
            textarea.style.display = '';
            textarea.readOnly = false;
        }
        
        // Hide display text
        const displayText = section.querySelector('.section-display-text');
        if (displayText) {
            displayText.style.display = 'none';
        }
    }
    
    // Show save button, hide edit button
    const saveBtn = section.querySelector('.section-save-btn');
    const editBtn = section.querySelector('.section-edit-btn');
    if (saveBtn) saveBtn.style.display = 'inline-block';
    if (editBtn) editBtn.style.display = 'none';
}

function lockSectionEdit(sectionId) {
    const section = document.querySelector(`[data-section="${sectionId}"]`);
    if (!section) return;
    
    section.classList.add('section-readonly');
    section.classList.remove('section-edit');
    
    // Handle credential sections
    if (['degrees', 'licenses', 'certifications'].includes(sectionId)) {
        const editDiv = document.getElementById(`${sectionId}-edit`);
        const displayDiv = document.getElementById(`${sectionId}-display`);
        
        if (editDiv) editDiv.style.display = 'none';
        if (displayDiv) displayDiv.style.display = 'block';
    } else if (['modalities', 'languages'].includes(sectionId)) {
        // Handle tag-based sections (modalities, languages)
        const editDiv = document.getElementById(`${sectionId}-edit`);
        const displayDiv = document.getElementById(`${sectionId}-display`);
        
        if (editDiv) editDiv.style.display = 'none';
        if (displayDiv) {
            displayDiv.style.display = 'block';
            // Re-render display version
            if (sectionId === 'languages') {
                // Languages already handled differently, render display if needed
                const langsList = window.currentLanguages || [];
                if (langsList.length === 0) {
                    displayDiv.innerHTML = '<p class="placeholder-text">No languages added yet.</p>';
                } else {
                    displayDiv.innerHTML = langsList.map(lang => `<span class="language-tag-display">${lang}</span>`).join('');
                }
            }
        }
    } else if (sectionId === 'payment') {
        // Handle payment/insurance section
        const editDiv = document.getElementById('insurance-edit');
        const displayDiv = document.getElementById('insurance-display');
        
        if (editDiv) editDiv.style.display = 'none';
        if (displayDiv) {
            displayDiv.style.display = 'block';
            renderInsuranceDisplay();
        }
    } else if (sectionId === 'pricing') {
        // Handle pricing section
        const editDiv = document.getElementById('pricing-edit');
        const displayDiv = document.getElementById('pricing-display');
        
        if (editDiv) editDiv.style.display = 'none';
        if (displayDiv) {
            displayDiv.style.display = 'block';
            renderPricingDisplay();
        }
    } else if (sectionId === 'practice') {
        // Handle practice type section
        const editDiv = document.getElementById('practice-edit');
        const displayDiv = document.getElementById('practice-display');
        
        if (editDiv) editDiv.style.display = 'none';
        if (displayDiv) {
            displayDiv.style.display = 'block';
            renderPracticeDisplay();
        }
    } else if (sectionId === 'conditions') {
        // Handle conditions section
        const editDiv = document.getElementById('conditions-edit');
        const displayDiv = document.getElementById('conditions-display');
        
        if (editDiv) editDiv.style.display = 'none';
        if (displayDiv) {
            displayDiv.style.display = 'block';
            renderConditionsDisplay();
        }
    } else if (sectionId === 'video') {
        // Handle video section
        const editDiv = document.getElementById('video-edit');
        const displayDiv = document.getElementById('video-display');
        
        if (editDiv) editDiv.style.display = 'none';
        if (displayDiv) displayDiv.style.display = 'block';
    } else if (sectionId === 'continuing-education') {
        // Handle continuing education section
        const editDiv = document.getElementById('continuing-education-edit');
        const displayDiv = document.getElementById('continuing-education-display');
        
        if (editDiv) editDiv.style.display = 'none';
        if (displayDiv) {
            displayDiv.style.display = 'block';
            renderContinuingEducationDisplay();
        }
    } else if (sectionId === 'photos') {
        // Handle photo gallery section - keep in edit mode for profile page
        const editDiv = document.getElementById('photos-edit');
        const displayDiv = document.getElementById('photos-display');
        
        if (editDiv) editDiv.style.display = 'block';
        if (displayDiv) displayDiv.style.display = 'none';
        // Stay in edit mode, just refresh the photos list
        renderPhotosList();
    } else {
        // Hide the textarea and show display text for regular text sections
        const textarea = section.querySelector('.section-edit-field');
        if (textarea) {
            textarea.style.display = 'none';
            textarea.readOnly = true;
            
            // Get textarea value and populate display div
            const displayText = section.querySelector('.section-display-text');
            if (displayText && textarea.value.trim()) {
                displayText.textContent = textarea.value;
                displayText.style.display = 'block';
            }
        }
    }
    
    // Hide save button, show edit button
    const saveBtn = section.querySelector('.section-save-btn');
    const editBtn = section.querySelector('.section-edit-btn');
    if (saveBtn) saveBtn.style.display = 'none';
    if (editBtn) editBtn.style.display = 'inline-block';
}

async function saveProfile() {
    if (!currentUser) return;
    
    try {
        showSaveStatus('Saving...', 'saving');
        
        // Get the profile completion percentage that's already being calculated
        const percentageEl = document.getElementById('completeness-percentage');
        const profileCompletionPercent = percentageEl ? parseInt(percentageEl.textContent) : 0;
        
        console.log('[Rooted Vitality] Attempting to save profile with completion:', profileCompletionPercent + '%');
        console.log('[Rooted Vitality] Completeness element found:', !!percentageEl);
        console.log('[Rooted Vitality] Completeness text content:', percentageEl?.textContent);
        
        // Prepare data for practitioners table (primary practitioner profile)
        // Support both field name conventions - schema uses legal_name, signup uses legal_business_name
        const practitionerData = {
            user_id: currentUser.id,
            legal_name: document.getElementById('profile-name')?.value || '',
            legal_business_name: document.getElementById('profile-name')?.value || '',
            business_size: document.getElementById('profile-teamsize')?.value || '',
            bio: document.getElementById('about-content')?.value || '',
            ethos_statement: document.getElementById('approach-content')?.value || '',
            profile_completion_percent: profileCompletionPercent,
            updated_at: new Date().toISOString()
        };
        
        // Social media as JSON
        const socialData = {
            facebook: document.getElementById('social-facebook')?.value || '',
            instagram: document.getElementById('social-instagram')?.value || '',
            twitter: document.getElementById('social-x')?.value || '',
            linkedin: document.getElementById('social-linkedin')?.value || '',
            youtube: document.getElementById('social-youtube')?.value || '',
            tiktok: document.getElementById('social-tiktok')?.value || '',
            pinterest: document.getElementById('social-pinterest')?.value || '',
            website: document.getElementById('social-website')?.value || ''
        };
        practitionerData.social_media = socialData;
        
        console.log('[Rooted Vitality] Full practitioner data being saved:', practitionerData);
        
        // Save to practitioners table
        const { data: upsertData, error: practError } = await window.supabaseClient
            .from('practitioners')
            .upsert(practitionerData, { onConflict: 'user_id' });
        
        console.log('[Rooted Vitality] Upsert response - Data:', upsertData, 'Error:', practError);
        
        if (practError) {
            console.error('[Rooted Vitality] Error saving to practitioners table:', practError);
            console.error('[Rooted Vitality] Error details:', {
                code: practError?.code,
                message: practError?.message,
                details: practError?.details,
                hint: practError?.hint
            });
            showSaveStatus('Save failed', 'error');
            return;
        }
        
        console.log('[Rooted Vitality] Profile saved successfully');
        console.log('[Rooted Vitality] Saved profile_completion_percent:', profileCompletionPercent + '%');
        showSaveStatus('Saved', 'success');
    } catch (error) {
        console.error('[Rooted Vitality] Error in saveProfile:', error);
        console.error('[Rooted Vitality] Error stack:', error.stack);
        showSaveStatus('Save failed', 'error');
    }
}

function setupAvatarUpload() {
    const avatarUploadBtn = document.querySelector('.avatar-upload-btn');
    
    if (avatarUploadBtn) {
        avatarUploadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openProfilePictureModal();
        });
    }

    // Setup file input for modal
    const fileInput = document.getElementById('profile-picture-input');
    if (fileInput) {
        fileInput.addEventListener('change', handleProfilePictureSelect);
    }

    // Setup dropzone for modal
    const dropzone = document.getElementById('upload-dropzone');
    if (dropzone) {
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('drag-active');
        });
        dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-active'));
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('drag-active');
            if (e.dataTransfer.files.length > 0) {
                const file = e.dataTransfer.files[0];
                previewProfilePicture(file);
            }
        });
    }
}

async function uploadAvatar(file) {
    try {
        showSaveStatus('Uploading photo...', 'saving');
        
        // Get the auth user_id (not the practitioner id)
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) {
            throw new Error('Not authenticated');
        }
        const authUserId = user.id;
        console.log('[Rooted Vitality] Uploading avatar for user:', authUserId);
        
        const fileExt = file.name.split('.').pop();
        const fileName = `avatars/${authUserId}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await window.supabaseClient.storage
            .from('practitioner-files')
            .upload(fileName, file, { upsert: true });
        
        if (uploadError) throw uploadError;
        
        const { data } = window.supabaseClient.storage
            .from('practitioner-files')
            .getPublicUrl(fileName);
        
        const avatarUrl = data.publicUrl;
        console.log('[Rooted Vitality] Avatar uploaded to storage:', avatarUrl);
        
        // Update practitioners table with new practice logo URL
        try {
            const { data: updateData, error: practitionerError } = await window.supabaseClient
                .from('practitioners')
                .update({ 
                    practice_logo_url: avatarUrl, 
                    updated_at: new Date().toISOString() 
                })
                .eq('user_id', authUserId);
            
            if (practitionerError) {
                console.error('[Rooted Vitality] Database update error:', practitionerError);
                throw practitionerError;
            } else {
                console.log('[Rooted Vitality] Successfully updated practitioners table:', updateData);
            }
        } catch (tableError) {
            console.error('[Rooted Vitality] Error updating practitioners table:', tableError);
            throw tableError;
        }
        
        // Update local currentUser object so it persists
        if (currentUser) {
            currentUser.practice_logo_url = avatarUrl;
        }
        
        // Update preview in avatar div
        const avatarDiv = document.getElementById('profile-avatar');
        avatarDiv.innerHTML = `<img src="${avatarUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: inherit;">`;
        console.log('[Rooted Vitality] Updated profile avatar image after upload');
        
    // Update header with avatar using the universal avatar system
    const activeView = localStorage.getItem('active_view') || 'client';
    const userRole = currentUser?.role || 'practitioner';
    
    if (userRole === 'practitioner' && activeView === 'practitioner') {
        // Update as business logo using RootedVitality
        if (typeof RootedVitality !== 'undefined') {
            console.log('[Rooted Vitality] Updating logo via RootedVitality');
            RootedVitality.updateHeaderLogo(avatarUrl, 'practitioner', 'practitioner');
            // Clear the logo cache so other pages reload it when visited
            RootedVitality.clearLogoCacheForUser();
        }
    } else {
        // Update as avatar
        if (typeof RootedVitality !== 'undefined') {
            RootedVitality.updateHeaderAvatar(avatarUrl);
        }
    }        // Trigger auto-save to ensure everything is synchronized
        if (typeof debounceAutoSave === 'function') {
            debounceAutoSave();
        }
        
        showSaveStatus('Photo updated', 'success');
        console.log('[Rooted Vitality] Avatar uploaded successfully and saved');
        
    } catch (error) {
        console.error('[Rooted Vitality] Error uploading avatar:', error);
        showSaveStatus('Photo upload failed', 'error');
    }
}

function setupBackgroundCheckButton() {
    const btn = document.getElementById('start-background-check');
    if (btn) {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            console.log('[Rooted Vitality] Background check initiated');
            alert('Background check process coming soon! This will verify your credentials securely.');
            // TODO: Implement background check flow with third-party service
        });
    }
}

function setupBusinessVerification() {
    const formContainer = document.getElementById('verification-form-container');
    const statusDisplay = document.getElementById('verification-status-display');
    const form = document.getElementById('business-verification-form');
    const cancelBtn = document.getElementById('cancel-verification-btn');
    
    if (!form || !formContainer) {
        console.warn('[Rooted Vitality] Business verification form elements not found');
        return;
    }

    // Check if verification already submitted
    const checkVerificationStatus = () => {
        if (window.practitionerData && window.practitionerData.verification_submitted) {
            formContainer.style.display = 'none';
            statusDisplay.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.5rem; justify-content: center;">
                    <span style="font-size: 1.5rem;">✓</span>
                    <span>Your verification documents have been submitted and are pending admin review.</span>
                </div>
            `;
            statusDisplay.classList.add('submitted');
        } else {
            statusDisplay.innerHTML = `
                <button class="btn-accent" style="cursor: pointer;" onclick="document.getElementById('verification-form-container').style.display = document.getElementById('verification-form-container').style.display === 'none' ? 'block' : 'none'">
                    + Submit Verification Documents
                </button>
            `;
            statusDisplay.classList.remove('submitted');
        }
    };

    // Initial status check
    checkVerificationStatus();

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('[Rooted Vitality] Submitting business verification form');

        try {
            const einSsn = document.getElementById('verification-ein-ssn').value.trim();
            const idFront = document.getElementById('verification-id-front').files[0];
            const idBack = document.getElementById('verification-id-back').files[0];

            if (!einSsn || !idFront || !idBack) {
                showSaveStatus('Please fill in all required fields', 'error');
                return;
            }

            // Validate EIN/SSN format
            const einSsnRegex = /^(\d{2}-\d{7}|\d{3}-\d{2}-\d{4})$/;
            if (!einSsnRegex.test(einSsn)) {
                showSaveStatus('Please enter a valid EIN (12-3456789) or SSN (123-45-6789)', 'error');
                return;
            }

            showSaveStatus('Uploading verification documents...', 'saving');

            // Upload front ID to Supabase Storage
            const frontFileName = `verification-id-front-${currentUser.id}-${Date.now()}`;
            const { data: frontData, error: frontError } = await window.supabaseClient.storage
                .from('verification-documents')
                .upload(`${currentUser.id}/${frontFileName}`, idFront);

            if (frontError) {
                console.error('[Rooted Vitality] Error uploading front ID:', frontError);
                showSaveStatus('Error uploading front ID. Please try again.', 'error');
                return;
            }

            // Upload back ID to Supabase Storage
            const backFileName = `verification-id-back-${currentUser.id}-${Date.now()}`;
            const { data: backData, error: backError } = await window.supabaseClient.storage
                .from('verification-documents')
                .upload(`${currentUser.id}/${backFileName}`, idBack);

            if (backError) {
                console.error('[Rooted Vitality] Error uploading back ID:', backError);
                showSaveStatus('Error uploading back ID. Please try again.', 'error');
                return;
            }

            // Get public URLs for the uploaded files
            const frontUrl = window.supabaseClient.storage
                .from('verification-documents')
                .getPublicUrl(`${currentUser.id}/${frontFileName}`).data.publicUrl;

            const backUrl = window.supabaseClient.storage
                .from('verification-documents')
                .getPublicUrl(`${currentUser.id}/${backFileName}`).data.publicUrl;

            // Update practitioner record with verification data
            const { error: updateError } = await window.supabaseClient
                .from('practitioners')
                .update({
                    verification_submitted: true,
                    verification_ein_ssn: einSsn,
                    verification_id_front_url: frontUrl,
                    verification_id_back_url: backUrl,
                    verification_submitted_at: new Date().toISOString()
                })
                .eq('user_id', currentUser.id);

            if (updateError) {
                console.error('[Rooted Vitality] Error saving verification data:', updateError);
                showSaveStatus('Error saving verification data. Please try again.', 'error');
                return;
            }

            // Update local data
            window.practitionerData.verification_submitted = true;
            window.practitionerData.verification_ein_ssn = einSsn;
            window.practitionerData.verification_id_front_url = frontUrl;
            window.practitionerData.verification_id_back_url = backUrl;

            console.log('[Rooted Vitality] ✓ Verification documents submitted successfully');
            showSaveStatus('✓ Verification documents submitted! Admin review pending.', 'success');

            // Reset form and update display
            form.reset();
            checkVerificationStatus();
        } catch (error) {
            console.error('[Rooted Vitality] Error submitting verification:', error);
            showSaveStatus('An unexpected error occurred. Please try again.', 'error');
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

/* ========================================== */
/* PROFESSIONAL PHOTO GALLERY FUNCTIONS */
/* ========================================== */

window.currentPhotos = [];
let photoIdCounter = 0;

function loadPhotos(photos) {
    console.log('[Rooted Vitality] Loading photos:', photos);
    window.currentPhotos = Array.isArray(photos) ? photos : [];
    renderPhotosList();
    // Only render display mode when not in edit mode
    // renderPhotosDisplay();
}

function addPhotoToGallery() {
    if (window.currentPhotos.length >= 6) {
        alert('Maximum 6 photos allowed');
        return;
    }
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/jpeg,image/png,image/webp';
    
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > 5 * 1024 * 1024) {
            alert('File must be smaller than 5MB');
            return;
        }
        
        try {
            showSaveStatus('Uploading photo...', 'saving');
            
            // Upload to Supabase Storage
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) throw new Error('Not authenticated');
            
            const fileExt = file.name.split('.').pop();
            const fileName = `photos/${user.id}-${Date.now()}.${fileExt}`;
            
            const { error: uploadError } = await window.supabaseClient.storage
                .from('practitioner-files')
                .upload(fileName, file, { upsert: true });
            
            if (uploadError) throw uploadError;
            
            const { data } = window.supabaseClient.storage
                .from('practitioner-files')
                .getPublicUrl(fileName);
            
            const photoData = {
                id: Date.now(),
                url: data.publicUrl,
                caption: 'Photo'
            };
            
            window.currentPhotos.push(photoData);
            renderPhotosList();
            showSaveStatus('Photo uploaded successfully', 'success');
            debounceAutoSave();
            
        } catch (error) {
            console.error('Error uploading photo:', error);
            showSaveStatus('Photo upload failed', 'error');
        }
    });
    
    fileInput.click();
}

function removePhoto(photoId) {
    window.currentPhotos = window.currentPhotos.filter(p => p.id !== photoId);
    renderPhotosList();
    debounceAutoSave();
}

function updatePhotoCaption(photoId, caption) {
    const photo = window.currentPhotos.find(p => p.id === photoId);
    if (photo) {
        photo.caption = caption;
        debounceAutoSave();
    }
}

function renderPhotosList() {
    const list = document.getElementById('photos-list');
    if (!list) return;
    
    if (window.currentPhotos.length === 0) {
        list.innerHTML = '';
        return;
    }
    
    list.innerHTML = window.currentPhotos.map(photo => `
        <div class="photo-card" data-photo-id="${photo.id}">
            <img src="${photo.url || photo.data}" alt="Gallery photo" class="photo-card-image">
            <div class="photo-card-actions">
                <button class="photo-card-btn" onclick="removePhoto(${photo.id})" title="Remove photo">×</button>
            </div>
            <div class="photo-card-caption">
                <input 
                    type="text" 
                    value="${photo.caption || ''}"
                    placeholder="Add caption..."
                    onblur="updatePhotoCaption(${photo.id}, this.value)"
                    maxlength="30"
                >
            </div>
        </div>
    `).join('');
}

function renderPhotosDisplay() {
    const display = document.getElementById('photos-display');
    if (!display) return;
    
    if (!window.currentPhotos || window.currentPhotos.length === 0) {
        display.innerHTML = '<p class="placeholder-text">No professional photos yet.</p>';
        return;
    }
    
    display.innerHTML = window.currentPhotos.map(photo => `
        <div class="photo-display-card">
            <img src="${photo.url || photo.data}" alt="Gallery photo" class="photo-display-image">
            <div class="photo-display-caption">${photo.caption || 'Photo'}</div>
        </div>
    `).join('');
}

function getPhotosForSave() {
    // Return photo URLs for database storage (much smaller than base64)
    return window.currentPhotos.map(p => ({
        id: p.id,
        caption: p.caption,
        url: p.url || p.data // Use URL if available, fallback to data for old photos
    }));
}

function setupAlbumButton() {
    const btn = document.getElementById('add-photo-btn');
    if (btn) {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            addPhotoToGallery();
        });
    }
}

/* ========================================== */
/* PROFESSIONAL VIDEO FUNCTIONS */
/* ========================================== */

window.videoData = null;

function setupVideoButton() {
    const btn = document.getElementById('add-video-btn');
    if (btn) {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            addVideoToProfile();
        });
    }
}

async function addVideoToProfile() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'video/mp4,video/webm,video/mov,video/quicktime';
    
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > 50 * 1024 * 1024) { // 50MB limit
            alert('Video file must be smaller than 50MB');
            return;
        }
        
        try {
            showSaveStatus('Uploading video...', 'saving');
            
            // Upload to Supabase Storage
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) throw new Error('Not authenticated');
            
            const fileExt = file.name.split('.').pop();
            const fileName = `videos/${user.id}-${Date.now()}.${fileExt}`;
            
            const { error: uploadError } = await window.supabaseClient.storage
                .from('practitioner-files')
                .upload(fileName, file, { upsert: true });
            
            if (uploadError) throw uploadError;
            
            const { data } = window.supabaseClient.storage
                .from('practitioner-files')
                .getPublicUrl(fileName);
            
            window.videoData = {
                url: data.publicUrl,
                name: file.name,
                size: file.size
            };
            
            renderVideoPreview();
            showSaveStatus('Video uploaded successfully', 'success');
            debounceAutoSave();
            
        } catch (error) {
            console.error('Error uploading video:', error);
            showSaveStatus('Video upload failed', 'error');
        }
    });
    
    fileInput.click();
}

function renderVideoPreview() {
    const videoList = document.getElementById('video-list');
    if (!videoList) return;
    
    if (!window.videoData) {
        videoList.innerHTML = '';
        return;
    }
    
    videoList.innerHTML = `
        <div class="video-preview-card">
            <video class="video-preview" controls>
                <source src="${window.videoData.url}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
            <div class="video-info">
                <p class="video-name">${window.videoData.name}</p>
                <p class="video-size">${(window.videoData.size / (1024 * 1024)).toFixed(1)} MB</p>
            </div>
            <button class="video-remove-btn" onclick="removeVideo()" title="Remove video">×</button>
        </div>
    `;
}

function removeVideo() {
    window.videoData = null;
    renderVideoPreview();
    debounceAutoSave();
}

function loadVideo(videoUrl) {
    console.log('[Rooted Vitality] loadVideo called with:', videoUrl);
    if (videoUrl) {
        window.videoData = {
            url: videoUrl,
            name: 'Intro Video',
            size: 0
        };
        console.log('[Rooted Vitality] Setting window.videoData:', window.videoData);
        renderVideoPreview();
        console.log('[Rooted Vitality] renderVideoPreview called');
    } else {
        console.log('[Rooted Vitality] loadVideo: No video URL provided');
    }
}

function updateBackgroundCheckStatus(status) {
    const statusContainer = document.getElementById('background-check-status');
    const button = document.getElementById('start-background-check');
    
    if (status === 'completed') {
        statusContainer.innerHTML = `
            <div class="background-check-status completed">
                <span class="status-icon">✓</span>
                <div>
                    <p>Background Check Completed</p>
                    <p class="status-date">Your credentials have been verified</p>
                </div>
            </div>
        `;
        if (button) button.style.display = 'none';
    }
}

function showSaveStatus(message, type) {
    const statusEl = document.getElementById('save-status');
    if (!statusEl) return;
    
    statusEl.textContent = message;
    statusEl.className = `save-status ${type}`;
    statusEl.style.display = 'block';
    
    if (type !== 'saving') {
        setTimeout(() => {
            statusEl.style.display = 'none';
        }, 3000);
    }
}

/* ========================================== */
/* PHASE 1: Quick Stats Dashboard Functions */
/* ========================================== */

/* Removed: Modalities functions moved to Match Settings */

function setupPublicProfileLink() {
    console.log('[Rooted Vitality] Setting up public profile link');
    
    const previewLink = document.getElementById('view-public-profile');
    if (previewLink && currentUser && window.practitionerData && window.practitionerData.id) {
        previewLink.addEventListener('click', (e) => {
            e.preventDefault();
            // Navigate to public profile page with practitioner ID
            const publicProfileUrl = `./practitioner-profile.html?practitioner_id=${window.practitionerData.id}`;
            window.open(publicProfileUrl, '_blank');
            console.log('[Rooted Vitality] Opening public profile:', publicProfileUrl);
        });
    }
}

function populateQuickStats() {
    console.log('[Rooted Vitality] Populating Quick Stats Dashboard');
    // Note: Verified status and preview cards removed - verified badge shown in hero, link moved there
    setupPublicProfileLink();
}

/* ========================================== */
/* PHASE 1: Languages Section Functions */
/* ========================================== */

function loadLanguages() {
    console.log('[Rooted Vitality] Loading languages from window.currentLanguages');
    console.log('[Rooted Vitality] window.currentLanguages value:', window.currentLanguages);
    
    if (!window.currentLanguages || window.currentLanguages.length === 0) {
        console.log('[Rooted Vitality] No languages data found, clearing all checkboxes');
        // Uncheck all checkboxes
        document.querySelectorAll('.language-checkbox').forEach(cb => cb.checked = false);
        document.getElementById('custom-language-input').value = '';
        renderLanguagesList([]);
        return;
    }
    
    console.log('[Rooted Vitality] Rendering languages:', window.currentLanguages);
    
    // Uncheck all first
    document.querySelectorAll('.language-checkbox').forEach(cb => cb.checked = false);
    document.getElementById('custom-language-input').value = '';
    
    // Check the boxes that match
    const predefinedLanguages = ['English', 'Spanish', 'French', 'German', 'Mandarin', 'Japanese', 'Portuguese', 'Italian', 'Korean', 'Vietnamese'];
    let customLanguages = [];
    
    window.currentLanguages.forEach(lang => {
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
    
    renderLanguagesList(window.currentLanguages);
    console.log('[Rooted Vitality] ✓ Loaded languages:', window.currentLanguages);
}

function setupLanguageListeners() {
    console.log('[Rooted Vitality] Setting up language listeners');
    
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

window.currentLanguages = [];

function addLanguage(language) {
    console.log('[Rooted Vitality] Adding language:', language);
    console.log('[Rooted Vitality] window.currentLanguages BEFORE add:', window.currentLanguages);
    
    if (!window.currentLanguages.includes(language)) {
        window.currentLanguages.push(language);
        console.log('[Rooted Vitality] window.currentLanguages AFTER add:', window.currentLanguages);
        renderLanguagesList(window.currentLanguages);
        console.log('[Rooted Vitality] renderLanguagesList called');
        debounceAutoSave('more-details');
        console.log('[Rooted Vitality] debounceAutoSave called');
    } else {
        console.log('[Rooted Vitality] Language already exists, not adding');
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
    console.log('[Rooted Vitality] Updating languages from checkboxes');
    
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
    
    window.currentLanguages = languages;
    console.log('[Rooted Vitality] Languages updated:', window.currentLanguages);
    renderLanguagesList(window.currentLanguages);
    debounceAutoSave('more-details');
}

function removeLanguage(language) {
    console.log('[Rooted Vitality] Removing language:', language);
    
    window.currentLanguages = window.currentLanguages.filter(lang => lang !== language);
    renderLanguagesList(window.currentLanguages);
    debounceAutoSave('more-details');
}

function renderLanguagesList(languages) {
    window.currentLanguages = languages;
    const list = document.getElementById('languages-list');
    if (!list) return;
    
    if (languages.length === 0) {
        list.innerHTML = '';
        return;
    }
    
    list.innerHTML = languages.map(lang => `
        <div class="language-tag">
            <span>${lang}</span>
            <span class="language-tag-remove" onclick="removeLanguage('${lang}')">×</span>
        </div>
    `).join('');
}

function getSelectedLanguages() {
    return window.currentLanguages;
}

/* ========================================== */
/* PHASE 1: FAQ Section Functions */
/* ========================================== */

window.faqItems = [];
window.faqNextId = 0;

function loadFAQ() {
    console.log('[Rooted Vitality] Loading FAQ from window.faqItems');
    
    if (!window.faqItems || window.faqItems.length === 0) {
        console.log('[Rooted Vitality] No FAQ data found');
        window.faqItems = [];
        window.faqNextId = 0;
        renderFAQItems();
        return;
    }
    
    renderFAQItems();
    console.log('[Rooted Vitality] Loaded FAQ items:', window.faqItems);
}

function renderFAQItems() {
    const faqList = document.getElementById('faq-list');
    const addBtn = document.getElementById('add-faq-btn');
    if (!faqList) return;
    
    // Render form fields for each FAQ item
    faqList.innerHTML = window.faqItems.map((item, index) => `
        <div class="faq-form-item" data-faq-id="${item.id}">
            <div class="faq-item-header">
                <div class="faq-item-number">Q${index + 1}</div>
                <button class="faq-delete-btn" onclick="deleteFAQItem(${item.id})" title="Remove this Q&A">Remove</button>
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
        if (window.faqItems.length >= 10) {
            addBtn.style.display = 'none';
        } else {
            addBtn.style.display = 'inline-block';
        }
    }
    
    // Add event listeners to all inputs
    faqList.querySelectorAll('.faq-question-input, .faq-answer-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const faqId = parseInt(e.target.getAttribute('data-faq-id'));
            const item = window.faqItems.find(faq => faq.id === faqId);
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
    console.log('[Rooted Vitality] Adding new FAQ item');
    
    // Check if at max limit
    if (window.faqItems.length >= 10) {
        alert('Maximum 10 FAQ items allowed');
        return;
    }
    
    window.faqItems.push({
        id: window.faqNextId++,
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
    console.log('[Rooted Vitality] Deleting FAQ item:', id);
    
    window.faqItems = window.faqItems.filter(faq => faq.id !== id);
    renderFAQItems();
    debounceAutoSave('more-details');
}

function setupFAQListeners() {
    console.log('[Rooted Vitality] Setting up FAQ listeners');
    
    const addFAQBtn = document.getElementById('add-faq-btn');
    if (addFAQBtn) {
        addFAQBtn.addEventListener('click', addFAQItem);
    }
}

/* ========================================== */
/* PHASE 1: Auto-save Indicator Functions */
/* ========================================== */

function showAutoSaveIndicator(status = 'saving') {
    const indicator = document.getElementById('auto-save-indicator') || createAutoSaveIndicator();
    
    indicator.className = `auto-save-indicator visible ${status}`;
    
    if (status === 'saving') {
        indicator.innerHTML = `
            <div class="save-spinner"></div>
            <span>Saving...</span>
        `;
    } else if (status === 'success') {
        indicator.innerHTML = `
            <div class="save-checkmark">✓</div>
            <span>Saved</span>
        `;
        setTimeout(() => {
            indicator.classList.remove('visible');
        }, 2000);
    } else if (status === 'error') {
        indicator.innerHTML = `
            <div class="save-checkmark">!</div>
            <span>Save failed</span>
        `;
        setTimeout(() => {
            indicator.classList.remove('visible');
        }, 3000);
    }
}

/* ========================================== */
/* INSURANCE PROVIDERS FUNCTIONS */
/* ========================================== */

window.selectedInsurance = [];

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
    console.log('[Rooted Vitality] Loading insurance:', insuranceArray);
    window.selectedInsurance = Array.isArray(insuranceArray) ? insuranceArray : [];
    renderInsuranceCheckboxes();
    renderInsuranceDisplay();
}

function renderInsuranceCheckboxes() {
    console.log('[DEBUG] renderInsuranceCheckboxes called');
    const checkboxes = document.querySelectorAll('.insurance-checkbox');
    console.log('[DEBUG] Found insurance checkboxes with .insurance-checkbox class:', checkboxes.length);
    console.log('[DEBUG] window.selectedInsurance:', window.selectedInsurance);
    
    checkboxes.forEach(checkbox => {
        const shouldCheck = window.selectedInsurance.includes(checkbox.value);
        console.log('[DEBUG] Checkbox', checkbox.value, '- should be checked:', shouldCheck);
        checkbox.checked = shouldCheck;
        checkbox.addEventListener('change', updateInsuranceSelection);
    });
}

function updateInsuranceSelection() {
    const checkboxes = document.querySelectorAll('.insurance-checkbox:checked');
    window.selectedInsurance = Array.from(checkboxes).map(cb => cb.value);
    renderInsuranceDisplay();
    debounceAutoSave('more-details');
}

function renderInsuranceDisplay() {
    const display = document.getElementById('insurance-display');
    if (!display) return;
    
    if (!window.selectedInsurance || window.selectedInsurance.length === 0) {
        display.innerHTML = '<p class="placeholder-text">No insurance providers selected yet.</p>';
        return;
    }
    
    display.innerHTML = window.selectedInsurance.map(insuranceCode => `
        <div class="insurance-badge">${INSURANCE_PROVIDERS[insuranceCode] || insuranceCode}</div>
    `).join('');
}

function setupInsuranceListeners() {
    console.log('[Rooted Vitality] Setting up insurance listeners');
    const checkboxes = document.querySelectorAll('.insurance-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateInsuranceSelection);
    });
}
function createAutoSaveIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'auto-save-indicator';
    indicator.className = 'auto-save-indicator';
    document.body.appendChild(indicator);
    return indicator;
}

/* ==================== PROFILE PICTURE MODAL ==================== */

let selectedProfilePictureFile = null;

function openProfilePictureModal() {
    const modal = document.getElementById('profile-picture-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeProfilePictureModal() {
    const modal = document.getElementById('profile-picture-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    // Reset form
    selectedProfilePictureFile = null;
    document.getElementById('profile-picture-input').value = '';
    document.getElementById('preview-section').style.display = 'none';
    document.getElementById('upload-dropzone').style.display = 'block';
    document.getElementById('upload-progress-section').style.display = 'none';
    document.getElementById('confirm-upload-btn').style.display = 'none';
}

function handleProfilePictureSelect(e) {
    const file = e.target.files[0];
    if (file) {
        previewProfilePicture(file);
    }
}

function previewProfilePicture(file) {
    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
        alert('Please select a JPG, PNG or WebP image');
        return;
    }
    
    if (file.size > maxSize) {
        alert('File size must be less than 5MB');
        return;
    }
    
    selectedProfilePictureFile = file;
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('preview-image').src = e.target.result;
        document.getElementById('preview-filename').textContent = file.name;
        document.getElementById('preview-size').textContent = formatFileSize(file.size);
        
        document.getElementById('upload-dropzone').style.display = 'none';
        document.getElementById('preview-section').style.display = 'block';
        document.getElementById('confirm-upload-btn').style.display = 'block';
    };
    reader.readAsDataURL(file);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

async function confirmProfilePictureUpload() {
    if (!selectedProfilePictureFile || !currentUser) {
        alert('Please select a file first');
        return;
    }
    
    try {
        document.getElementById('preview-section').style.display = 'none';
        document.getElementById('upload-progress-section').style.display = 'block';
        document.getElementById('confirm-upload-btn').disabled = true;
        
        await uploadAvatar(selectedProfilePictureFile);
        
        // Close modal on success
        setTimeout(() => {
            closeProfilePictureModal();
        }, 500);
        
    } catch (error) {
        console.error('[Rooted Vitality] Upload error:', error);
        alert('Upload failed. Please try again.');
        
        // Reset UI
        document.getElementById('upload-progress-section').style.display = 'none';
        document.getElementById('preview-section').style.display = 'block';
        document.getElementById('confirm-upload-btn').disabled = false;
    }
}

/**
 * Pricing & Rates Functions
 */
window.pricingData = {
    type: 'fixed',
    fixedRate: null,
    minRate: null,
    maxRate: null,
    tiers: [],
    slidingScale: false,
    notes: ''
};

function setupPricingListeners() {
    const radios = document.querySelectorAll('input[name="pricing-type"]');
    radios.forEach(radio => {
        radio.addEventListener('change', () => {
            updatePricingDisplay();
        });
    });
}

function loadPricing(pricingJson) {
    try {
        if (typeof pricingJson === 'string') {
            window.pricingData = JSON.parse(pricingJson);
        } else {
            window.pricingData = pricingJson || window.pricingData;
        }
        
        // Set form values
        if (window.pricingData.type) {
            const radio = document.querySelector(`input[name="pricing-type"][value="${window.pricingData.type}"]`);
            if (radio) radio.checked = true;
        }
        
        if (window.pricingData.fixedRate) {
            document.getElementById('pricing-fixed-rate').value = window.pricingData.fixedRate;
        }
        
        if (window.pricingData.minRate) {
            document.getElementById('pricing-min-rate').value = window.pricingData.minRate;
        }
        
        if (window.pricingData.maxRate) {
            document.getElementById('pricing-max-rate').value = window.pricingData.maxRate;
        }
        
        if (window.pricingData.tiers && Array.isArray(window.pricingData.tiers)) {
            document.querySelectorAll('.tier-check').forEach(checkbox => {
                checkbox.checked = window.pricingData.tiers.includes(checkbox.value);
            });
        }
        
        if (window.pricingData.slidingScale) {
            document.getElementById('pricing-offer-sliding').checked = true;
        }
        
        if (window.pricingData.notes) {
            document.getElementById('pricing-notes-text').value = window.pricingData.notes;
        }
        
        renderPricingDisplay();
        console.log('[Rooted Vitality] ✓ Pricing loaded');
    } catch (error) {
        console.error('[Rooted Vitality] Error loading pricing:', error);
    }
}

function savePricingData() {
    try {
        const type = document.querySelector('input[name="pricing-type"]:checked').value;
        
        window.pricingData = {
            type: type,
            fixedRate: type === 'fixed' ? parseFloat(document.getElementById('pricing-fixed-rate').value) || null : null,
            minRate: type === 'range' ? parseFloat(document.getElementById('pricing-min-rate').value) || null : null,
            maxRate: type === 'range' ? parseFloat(document.getElementById('pricing-max-rate').value) || null : null,
            tiers: type === 'tiers' ? Array.from(document.querySelectorAll('.tier-check:checked')).map(cb => cb.value) : [],
            slidingScale: document.getElementById('pricing-offer-sliding').checked,
            notes: document.getElementById('pricing-notes-text').value
        };
        
        return window.pricingData;
    } catch (error) {
        console.error('[Rooted Vitality] Error saving pricing:', error);
        return null;
    }
}

function renderPricingDisplay() {
    try {
        const displayDiv = document.getElementById('pricing-display-content');
        if (!displayDiv) return;
        
        const data = window.pricingData;
        let content = '';
        
        if (data.type === 'fixed' && data.fixedRate) {
            content = `$${data.fixedRate.toFixed(2)} per session`;
        } else if (data.type === 'range' && data.minRate && data.maxRate) {
            content = `$${data.minRate.toFixed(2)} – $${data.maxRate.toFixed(2)} per session`;
        } else if (data.type === 'tiers' && data.tiers.length > 0) {
            const tierLabels = {
                budget: 'Budget: $50–75/session',
                standard: 'Standard: $75–125/session',
                premium: 'Premium: $125+/session'
            };
            content = data.tiers.map(t => tierLabels[t] || t).join('\n');
        }
        
        if (data.slidingScale) {
            content += '\n\nSliding scale available for those with financial constraints';
        }
        
        if (data.notes) {
            content += '\n\n' + data.notes;
        }
        
        displayDiv.textContent = content || 'No pricing information provided';
    } catch (error) {
        console.error('[Rooted Vitality] Error rendering pricing display:', error);
    }
}

function updatePricingDisplay() {
    renderPricingDisplay();
}

/**
 * Practice Type & Setting Functions
 */
window.practiceData = {
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

function loadPractice(practiceJson) {
    try {
        if (typeof practiceJson === 'string') {
            window.practiceData = JSON.parse(practiceJson);
        } else {
            window.practiceData = practiceJson || window.practiceData;
        }
        
        if (window.practiceData.structure) {
            const radio = document.querySelector(`input[name="practice-structure"][value="${window.practiceData.structure}"]`);
            if (radio) radio.checked = true;
        }
        
        if (window.practiceData.setting) {
            const radio = document.querySelector(`input[name="practice-setting"][value="${window.practiceData.setting}"]`);
            if (radio) radio.checked = true;
        }
        
        if (window.practiceData.delivery && Array.isArray(window.practiceData.delivery)) {
            document.getElementById('practice-in-person').checked = window.practiceData.delivery.includes('in-person');
            document.getElementById('practice-virtual').checked = window.practiceData.delivery.includes('virtual');
            document.getElementById('practice-hybrid').checked = window.practiceData.delivery.includes('hybrid');
        }
        
        renderPracticeDisplay();
        console.log('[Rooted Vitality] ✓ Practice type loaded');
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
        
        window.practiceData = {
            structure: structure,
            setting: setting,
            delivery: delivery
        };
        
        return window.practiceData;
    } catch (error) {
        console.error('[Rooted Vitality] Error saving practice:', error);
        return null;
    }
}

function renderPracticeDisplay() {
    try {
        const displayDiv = document.getElementById('practice-display-content');
        if (!displayDiv) return;
        
        const data = window.practiceData;
        let content = '';
        
        const structureLabels = { solo: 'Solo Practice', group: 'Group Practice' };
        const settingLabels = { private: 'Private Practice', clinic: 'Clinic/Center', hospital: 'Hospital/Medical Facility' };
        const deliveryLabels = { 'in-person': 'In-Person Sessions', virtual: 'Virtual/Telehealth', hybrid: 'Hybrid' };
        
        if (data.structure) {
            content += `<div class="practice-display-item"><span class="practice-badge">${structureLabels[data.structure] || data.structure}</span></div>`;
        }
        
        if (data.setting) {
            content += `<div class="practice-display-item"><span class="practice-badge">${settingLabels[data.setting] || data.setting}</span></div>`;
        }
        
        if (data.delivery && data.delivery.length > 0) {
            data.delivery.forEach(d => {
                content += `<div class="practice-display-item"><span class="practice-badge">${deliveryLabels[d] || d}</span></div>`;
            });
        }
        
        displayDiv.innerHTML = content || '<p class="placeholder-text">No practice type information provided.</p>';
    } catch (error) {
        console.error('[Rooted Vitality] Error rendering practice display:', error);
    }
}

function updatePracticeDisplay() {
    renderPracticeDisplay();
}

/**
 * Video Introduction Functions
 */
window.videoData = {
    url: null,
    duration: null,
    fileName: null
};

function setupVideoListeners() {
    const uploadBtn = document.getElementById('upload-video-btn');
    const videoInput = document.getElementById('video-input');
    const removeBtn = document.getElementById('remove-video-btn');
    
    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => videoInput.click());
    }
    
    if (videoInput) {
        videoInput.addEventListener('change', handleVideoUpload);
    }
    
    if (removeBtn) {
        removeBtn.addEventListener('click', removeVideo);
    }
}

function handleVideoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
        alert('Invalid video format. Please use MP4, WebM, or MOV.');
        return;
    }
    
    // Validate file size (100 MB)
    if (file.size > 100 * 1024 * 1024) {
        alert('Video file too large. Maximum size is 100 MB.');
        return;
    }
    
    // Create video preview
    const videoPreview = document.getElementById('video-preview');
    const url = URL.createObjectURL(file);
    videoPreview.src = url;
    
    // Get duration
    videoPreview.addEventListener('loadedmetadata', () => {
        const duration = videoPreview.duration;
        
        // Validate duration (30-60 seconds)
        if (duration < 30 || duration > 60) {
            alert(`Video must be 30-60 seconds. Your video is ${Math.round(duration)} seconds.`);
            removeVideo();
            return;
        }
        
        // Store video data
        window.videoData = {
            url: url,
            duration: duration,
            fileName: file.name
        };
        
        // Update UI
        document.getElementById('video-filename-display').textContent = `Selected: ${file.name}`;
        document.getElementById('video-file-info').style.display = 'flex';
        document.getElementById('video-preview-container').style.display = 'flex';
        
        console.log('[Rooted Vitality] Video loaded:', { fileName: file.name, duration: duration });
    }, { once: true });
}

function removeVideo() {
    window.videoData = { url: null, duration: null, fileName: null };
    document.getElementById('video-input').value = '';
    document.getElementById('video-filename-display').textContent = '';
    document.getElementById('video-preview').src = '';
    document.getElementById('video-file-info').style.display = 'none';
    document.getElementById('video-preview-container').style.display = 'none';
    console.log('[Rooted Vitality] Video removed');
}

/**
 * Conditions Treated Functions
 */
window.conditionsData = [];

function setupConditionsListeners() {
    try {
        const checkboxes = document.querySelectorAll('input[name="condition"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                updateConditionsData();
            });
        });
        console.log('[Rooted Vitality] ✓ Conditions listeners attached');
    } catch (error) {
        console.error('[Rooted Vitality] Error setting up conditions listeners:', error);
    }
}

function updateConditionsData() {
    try {
        // Get selected conditions from the conditions manager
        window.conditionsData = window.conditionsManager.getSelected();
        console.log('[Rooted Vitality] Updated conditions data:', window.conditionsData);
    } catch (error) {
        console.error('[Rooted Vitality] Error updating conditions data:', error);
    }
}

function saveConditionsData() {
    try {
        updateConditionsData();
        const conditions = window.conditionsData || [];
        console.log('[Rooted Vitality] Saved conditions data type:', typeof conditions);
        console.log('[Rooted Vitality] Saved conditions data is array:', Array.isArray(conditions));
        console.log('[Rooted Vitality] Saved conditions data:', conditions);
        console.log('[Rooted Vitality] Saved conditions length:', conditions.length);
        return conditions;
    } catch (error) {
        console.error('[Rooted Vitality] Error saving conditions data:', error);
        return [];
    }
}

function loadConditions(conditionsArray) {
    try {
        if (!Array.isArray(conditionsArray)) {
            console.warn('[Rooted Vitality] Conditions not an array:', conditionsArray, typeof conditionsArray);
            // Try to parse if it's a stringified array
            if (typeof conditionsArray === 'string') {
                try {
                    conditionsArray = JSON.parse(conditionsArray);
                    console.log('[Rooted Vitality] Parsed conditions from string:', conditionsArray);
                } catch (e) {
                    console.error('[Rooted Vitality] Failed to parse conditions string:', e);
                    return;
                }
            } else {
                return;
            }
        }
        
        console.log('[Rooted Vitality] Loading conditions into UI:', conditionsArray, 'length:', conditionsArray.length);
        
        // Use conditions manager to set selected conditions
        // This handles the dynamic taxonomy checkboxes
        window.conditionsData = conditionsArray;
        if (window.conditionsManager && window.conditionsManager.setSelected) {
            window.conditionsManager.setSelected(conditionsArray);
            console.log('[Rooted Vitality] ✓ Called conditionsManager.setSelected()');
        } else {
            console.warn('[Rooted Vitality] ⚠ conditionsManager not ready or setSelected not available');
        }
        
        // Render display
        renderConditionsDisplay();
        console.log('[Rooted Vitality] ✓ Conditions loaded:', conditionsArray);
    } catch (error) {
        console.error('[Rooted Vitality] Error loading conditions:', error);
    }
}

function renderConditionsDisplay() {
    // Pills display removed - conditions are shown only as checkboxes
    return;
}

/**
 * Continuing Education Functions
 */
function setupContinuingEducationListeners() {
    const addCEBtn = document.getElementById('add-ce-btn');
    if (addCEBtn) {
        addCEBtn.addEventListener('click', addCourseEntry);
    }
    console.log('[Rooted Vitality] Continuing education listeners setup');
}

function addCourseEntry() {
    const entryId = Date.now().toString();
    
    const entry = {
        id: entryId,
        courseName: '',
        provider: '',
        hours: '',
        completedDate: '',
        notes: ''
    };
    
    window.continuingEducationCredentials.push(entry);
    renderContinuingEducationList();
    console.log('[Rooted Vitality] New CE course entry added');
}

function removeCourseEntry(entryId) {
    window.continuingEducationCredentials = window.continuingEducationCredentials.filter(entry => entry.id !== entryId);
    renderContinuingEducationList();
    console.log('[Rooted Vitality] CE course entry removed:', entryId);
}

function updateCourseEntry(entryId, field, value) {
    const entry = window.continuingEducationCredentials.find(e => e.id === entryId);
    if (entry) {
        entry[field] = value;
        console.log('[Rooted Vitality] CE entry updated:', { entryId, field, value });
    }
}

function renderContinuingEducationList() {
    const listDiv = document.getElementById('continuing-education-list');
    if (!listDiv) return;
    
    if (!window.continuingEducationCredentials || window.continuingEducationCredentials.length === 0) {
        listDiv.innerHTML = '<p class="placeholder-text">No courses added yet. Click "Add Course" to get started.</p>';
        return;
    }
    
    let html = '';
    window.continuingEducationCredentials.forEach(entry => {
        html += `
            <div class="ce-item" data-ce-id="${entry.id}">
                <div class="ce-item-header">
                    <span class="ce-item-title">${entry.courseName || 'New Course'}</span>
                    <button class="ce-item-close-btn" onclick="removeCourseEntry('${entry.id}')">×</button>
                </div>
                
                <div class="ce-form-group">
                    <label>Course Name</label>
                    <input 
                        type="text" 
                        value="${entry.courseName || ''}" 
                        placeholder="e.g., Advanced Herbal Medicine"
                        onchange="updateCourseEntry('${entry.id}', 'courseName', this.value)"
                    >
                </div>
                
                <div class="ce-form-row">
                    <div class="ce-form-group">
                        <label>Provider</label>
                        <input 
                            type="text" 
                            value="${entry.provider || ''}" 
                            placeholder="e.g., National Institute of Health"
                            onchange="updateCourseEntry('${entry.id}', 'provider', this.value)"
                        >
                    </div>
                    <div class="ce-form-group">
                        <label>Hours</label>
                        <input 
                            type="number" 
                            value="${entry.hours || ''}" 
                            placeholder="e.g., 20"
                            onchange="updateCourseEntry('${entry.id}', 'hours', this.value)"
                            min="0"
                        >
                    </div>
                </div>
                
                <div class="ce-form-group">
                    <label>Completion Date</label>
                    <input 
                        type="date" 
                        value="${entry.completedDate || ''}" 
                        onchange="updateCourseEntry('${entry.id}', 'completedDate', this.value)"
                    >
                </div>
                
                <div class="ce-form-group">
                    <label>Notes</label>
                    <textarea 
                        placeholder="Optional notes about the course"
                        onchange="updateCourseEntry('${entry.id}', 'notes', this.value)"
                    >${entry.notes || ''}</textarea>
                </div>
            </div>
        `;
    });
    
    listDiv.innerHTML = html;
    console.log('[Rooted Vitality] ✓ CE list rendered');
}

function renderContinuingEducationDisplay() {
    const displayDiv = document.getElementById('continuing-education-display');
    if (!displayDiv) return;
    
    if (!window.continuingEducationCredentials || window.continuingEducationCredentials.length === 0) {
        displayDiv.innerHTML = '<p class="placeholder-text">No continuing education added yet.</p>';
        return;
    }
    
    let totalHours = 0;
    let html = '';
    
    window.continuingEducationCredentials.forEach(entry => {
        const hours = parseInt(entry.hours) || 0;
        totalHours += hours;
        
        const dateStr = entry.completedDate ? new Date(entry.completedDate).toLocaleDateString() : 'Date not specified';
        
        html += `
            <div class="ce-display-item">
                <div class="ce-display-item-title">${entry.courseName}</div>
                <div class="ce-display-item-provider">Provider: ${entry.provider}</div>
                <div class="ce-display-item-hours">Hours: ${hours}${hours !== 1 ? ' hrs' : ' hr'}</div>
                <div class="ce-display-item-date">Completed: ${dateStr}</div>
                ${entry.notes ? `<div class="ce-display-item-notes">Notes: ${entry.notes}</div>` : ''}
            </div>
        `;
    });
    
    // Add total hours summary
    html += `
        <div class="ce-total-hours">
            <div class="ce-total-hours-text">Total Continuing Education: ${totalHours} hours</div>
        </div>
    `;
    
    displayDiv.innerHTML = html;
    console.log('[Rooted Vitality] ✓ CE display rendered - Total hours: ' + totalHours);
}

/**
 * Payment & Insurance Checkbox Handling
 */
function setupPaymentInsuranceSection() {
    const acceptsInsuranceCheckbox = document.getElementById('accepts-insurance');
    const insuranceProvidersList = document.getElementById('insurance-providers-list');
    
    if (acceptsInsuranceCheckbox) {
        // Show/hide insurance providers list based on checkbox
        acceptsInsuranceCheckbox.addEventListener('change', (e) => {
            if (insuranceProvidersList) {
                insuranceProvidersList.style.display = e.target.checked ? 'flex' : 'none';
            }
            console.log('[Rooted Vitality] Insurance acceptance:', e.target.checked);
        });
        
        // Initialize display state
        if (insuranceProvidersList) {
            insuranceProvidersList.style.display = acceptsInsuranceCheckbox.checked ? 'flex' : 'none';
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
        accepts_insurance: document.getElementById('accepts-insurance')?.checked || false,
        insurance_providers: [],
        custom_insurance_providers: document.getElementById('custom-insurance-providers')?.value || '',
        payment_methods: [],
        custom_payment_methods: document.getElementById('custom-payment-methods')?.value || ''
    };
    
    // Collect selected insurance providers
    const insuranceCheckboxes = document.querySelectorAll('input[name="insurance-provider"]:checked');
    console.log('[DEBUG] Found insurance checkboxes (checked):', insuranceCheckboxes.length);
    insuranceCheckboxes.forEach(cb => {
        console.log('[DEBUG] Adding insurance provider:', cb.value);
        paymentData.insurance_providers.push(cb.value);
    });
    
    // Collect selected payment methods
    const paymentCheckboxes = document.querySelectorAll('input[name="payment-method"]:checked');
    console.log('[DEBUG] Found payment checkboxes (checked):', paymentCheckboxes.length);
    paymentCheckboxes.forEach(cb => {
        console.log('[DEBUG] Adding payment method:', cb.value);
        paymentData.payment_methods.push(cb.value);
    });
    
    console.log('[Rooted Vitality] Payment data collected:', paymentData);
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
    console.log('[Rooted Vitality] ✓ Payment display rendered');
}

/**
 * Report a Concern / Error Reporting System
 */

// Initialize ticket number from localStorage
function initializeTicketNumber() {
    if (!localStorage.getItem('error_ticket_counter')) {
        localStorage.setItem('error_ticket_counter', '1');
    }
}

function getNextTicketNumber() {
    let counter = parseInt(localStorage.getItem('error_ticket_counter') || '1');
    localStorage.setItem('error_ticket_counter', (counter + 1).toString());
    return counter;
}

function setupReportConcernListeners() {
    const reportBtn = document.getElementById('report-concern-btn');
    if (reportBtn) {
        reportBtn.addEventListener('click', openReportModal);
    }
    
    // Initialize ticket number on page load
    initializeTicketNumber();
}

function openReportModal() {
    const modal = document.getElementById('report-concern-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeReportModal() {
    const modal = document.getElementById('report-concern-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        // Clear form
        document.getElementById('report-concern-form').reset();
    }
}

async function submitReportConcern() {
    const form = document.getElementById('report-concern-form');
    
    // Validate form
    if (!form.checkValidity()) {
        alert('Please fill in all required fields');
        return;
    }
    
    const title = document.getElementById('report-title').value;
    const description = document.getElementById('report-description').value;
    const email = document.getElementById('report-email').value;
    const section = document.getElementById('report-section').value;
    const priority = document.getElementById('report-priority').value;
    
    // Get ticket number
    const ticketNumber = getNextTicketNumber();
    const ticketId = `TICKET-${String(ticketNumber).padStart(6, '0')}`;
    
    try {
        // Show loading state
        const submitBtn = event.target;
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;
        
        // Prepare email data
        const emailContent = `
=== ROOTED VITALITY USER ERROR REPORT ===

Ticket ID: ${ticketId}
Timestamp: ${new Date().toLocaleString()}
Priority: ${priority.toUpperCase()}

--- USER INFORMATION ---
Email: ${email}

--- ISSUE DETAILS ---
Title: ${title}
Section: ${section}

Description:
${description}

--- SYSTEM INFO ---
User ID: ${currentUser?.id || 'Unknown'}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}

=== END REPORT ===
        `;
        
        // Call Supabase edge function or send via email service
        // For now, we'll use a simple fetch to a Supabase function
        const response = await fetch('/api/send-error-report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ticketId: ticketId,
                title: title,
                description: description,
                email: email,
                section: section,
                priority: priority,
                userEmail: email,
                timestamp: new Date().toISOString(),
                userId: currentUser?.id || 'unknown',
                url: window.location.href
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to send report');
        }
        
        // Show success message
        alert(`✓ Report submitted successfully!\n\nTicket ID: ${ticketId}\n\nWe'll investigate this issue right away.`);
        
        // Close modal and reset form
        closeReportModal();
        
        console.log(`[Rooted Vitality] Error report submitted: ${ticketId}`);
        
    } catch (error) {
        console.error('[Rooted Vitality] Error submitting report:', error);
        alert('Failed to submit report. Please try again or contact support directly.');
        
        // Reset button
        const submitBtn = event.target;
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// ======================================================
// REVIEWS & TESTIMONIALS FUNCTIONALITY
// ======================================================

let allReviews = [];
let filteredReviews = [];

/**
 * Initialize reviews when switching to reviews panel
 */
async function initializeReviews() {
    try {
        console.log('[Reviews] Initializing reviews panel...');
        
        // Load reviews data
        await loadReviews();
        
        // Render initial reviews
        renderReviews(allReviews);
        updateReviewsStats();
        
        // Attach review event listeners
        attachReviewEventListeners();
        
        console.log('[Reviews] Reviews panel initialized successfully');
        
    } catch (error) {
        console.error('[Reviews] Error initializing reviews:', error);
        showToast('Error loading reviews', 'error');
    }
}

/**
 * Load reviews from database
 */
async function loadReviews() {
    try {
        console.log('[Reviews] Loading reviews from database...');
        
        // Get current practitioner
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) {
            allReviews = [];
            filteredReviews = [];
            return;
        }
        
        // Get practitioner ID
        const { data: practitionerData, error: practitionerError } = await window.supabaseClient
            .from('practitioners')
            .select('id, user_id')
            .eq('user_id', user.id)
            .single();
        
        if (practitionerError || !practitionerData) {
            console.error('[Reviews] Error loading practitioner:', practitionerError);
            allReviews = [];
            filteredReviews = [];
            return;
        }
        
        // Fetch real reviews from database
        const { data: dbReviews, error: reviewsError } = await window.supabaseClient
            .from('reviews')
            .select('*')
            .eq('practitioner_id', practitionerData.user_id)
            .eq('is_visible', true)
            .order('created_at', { ascending: false });
        
        if (reviewsError) {
            console.error('[Reviews] Error loading reviews:', reviewsError);
            allReviews = [];
        } else {
            // Transform database reviews to match our format
            console.log('[Reviews] Raw database reviews:', dbReviews);
            allReviews = (dbReviews || []).map(review => {
                // Use stored client names from database
                let displayName = 'Client';
                const first = review.client_first_name?.trim();
                const last = review.client_last_name?.trim();
                
                if (first && last) {
                    displayName = `${first[0]}. ${last}`;
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
            console.log('[Reviews] Transformed reviews:', allReviews);
        }
        
        console.log(`[Reviews] Loaded ${allReviews.length} reviews`);
        filteredReviews = [...allReviews];
        
    } catch (error) {
        console.error('[Reviews] Error loading reviews:', error);
        throw error;
    }
}

/**
 * Render reviews to the page
 */
function renderReviews(reviews) {
    console.log(`[Reviews] Rendering ${reviews.length} reviews...`);
    
    const container = document.getElementById('reviews-container');
    const noReviewsState = document.getElementById('no-reviews-state');
    
    if (!container || !noReviewsState) {
        console.warn('[Reviews] Review containers not found - not on reviews panel');
        return;
    }
    
    if (reviews.length === 0) {
        container.style.display = 'none';
        noReviewsState.style.display = 'block';
        return;
    }
    
    container.style.display = 'grid';
    noReviewsState.style.display = 'none';
    
    container.innerHTML = reviews.map(review => createReviewCard(review)).join('');
}

/**
 * Create a review card HTML element
 */
function createReviewCard(review) {
    const stars = Array(5)
        .fill(0)
        .map((_, i) => `<span class="star ${i < review.rating ? 'filled' : 'empty'}">★</span>`)
        .join('');
    
    const formattedDate = formatReviewDate(review.date);
    const source = review.source === 'platform' ? 'Platform' : 'External';
    
    // Build photos section if photos exist
    let photosHtml = '';
    if (review.photos && Array.isArray(review.photos) && review.photos.length > 0) {
        const photoThumbnails = review.photos
            .map((photo, idx) => {
                const photoUrl = typeof photo === 'string' ? photo : photo.url;
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

/**
 * Update statistics cards
 */
function updateReviewsStats() {
    const totalReviews = allReviews.length;
    const platformReviews = allReviews.filter(r => r.source === 'platform').length;
    const externalReviews = allReviews.filter(r => r.source === 'external').length;
    
    const avgRating = totalReviews > 0 
        ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
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
    
    console.log(`[Reviews] Stats updated - Avg: ${avgRating}, Total: ${totalReviews}`);
}

/**
 * Apply filters to reviews
 */
function applyReviewFilters() {
    const ratingFilter = document.getElementById('filter-rating')?.value;
    const sourceFilter = document.getElementById('filter-source')?.value;
    
    filteredReviews = allReviews.filter(review => {
        const matchRating = !ratingFilter || review.rating.toString() === ratingFilter;
        const matchSource = !sourceFilter || review.source === sourceFilter;
        return matchRating && matchSource;
    });
    
    renderReviews(filteredReviews);
    console.log(`[Reviews] Filters applied - ${filteredReviews.length} reviews shown`);
}

/**
 * Show review link modal
 */
function showReviewLinkModal() {
    console.log('[Reviews] showReviewLinkModal() called');
    
    const modal = document.getElementById('review-link-modal');
    if (!modal) {
        console.error('[Reviews] Modal element not found!');
        return;
    }
    
    const reviewLink = `${window.location.origin}/rooted-vitality/review?practitioner=${currentUser.id}`;
    console.log('[Reviews] Generated review link:', reviewLink);
    
    const linkInput = document.getElementById('review-link-input');
    if (linkInput) {
        linkInput.value = reviewLink;
    } else {
        console.warn('[Reviews] Link input not found');
    }
    
    modal.style.display = 'block';
    console.log('[Reviews] Review link modal opened');
}

/**
 * Close review link modal
 */
function closeReviewLinkModal() {
    const modal = document.getElementById('review-link-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Copy review link to clipboard
 */
function copyReviewLink() {
    const input = document.getElementById('review-link-input');
    if (!input) return;
    
    input.select();
    document.execCommand('copy');
    showToast('Review link copied to clipboard!', 'success');
    console.log('[Reviews] Review link copied to clipboard');
}

/**
 * Format date for reviews
 */
function formatReviewDate(date) {
    const now = new Date();
    const reviewDate = new Date(date);
    const diffDays = Math.floor((now - reviewDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    
    return reviewDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Attach event listeners for reviews functionality
 */
function attachReviewEventListeners() {
    console.log('[Reviews] Attaching review event listeners...');
    
    // Review link button
    const getReviewLinkBtn = document.getElementById('get-review-link-btn');
    if (getReviewLinkBtn) {
        getReviewLinkBtn.addEventListener('click', showReviewLinkModal);
        console.log('[Reviews] Attached listener to get-review-link-btn');
    } else {
        console.warn('[Reviews] get-review-link-btn not found');
    }
    
    // Empty state review link button
    const emptyStateBtn = document.getElementById('empty-state-review-link-btn');
    if (emptyStateBtn) {
        emptyStateBtn.addEventListener('click', showReviewLinkModal);
        console.log('[Reviews] Attached listener to empty-state-review-link-btn');
    } else {
        console.warn('[Reviews] empty-state-review-link-btn not found');
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

console.log('[Rooted Vitality] proProfile.js loaded');

