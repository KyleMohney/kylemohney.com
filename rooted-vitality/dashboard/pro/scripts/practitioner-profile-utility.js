/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: dashboard/pro/scripts/practitioner-profile-utility.js       ║
║  Purpose: Utility module - state management, initialization, etc   ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

TABLE OF CONTENTS:
  1. State Management - ProfileState object definition
  2. Profile Table Fields Definition - constant field mappings for intelligent routing
  3. Helper Functions - routeUpdateData(), safePractitionerUpdate()
  4. Safe Database Update Function - database operations wrapper
  5. Profile Initialization & Page Load - DOMContentLoaded handler
  6. Load Profile Data from Database - loadProfile()
  7. Populate Form Fields from Profile State - populateProfileFields()
  8. Setup Input Listeners & Change Tracking - setupInputListeners()
  9. Profile Completeness Calculation - updateProfileCompleteness()
  10. CLEAN UNIFIED SAVE SYSTEM - executeSave(), performSave(), section handlers
      - Single entry point for manual AND auto-save
      - Auto-save with intelligent debouncing (1.5s)
      - Manual save buttons routed through same system
      - Routes to correct database table (practitioners, practitioner_profiles, practitioner_credentials)
      - Unified save indicator with status feedback


ARCHITECTURE NOTES:
- Central ProfileState object manages all component state
- Object.defineProperty creates window.* proxies for backwards compatibility
- Profile data flows: Database → ProfileState → UI Form Fields
- routeUpdateData() intelligently routes updates to practitioners, practitioner_profiles,
  and practitioner_credentials tables
- All database queries use proper indexes and row-level security

*/

// ======================================================
// 1. STATE MANAGEMENT
// ======================================================

const ProfileState = {
    // Authentication & User
    currentUser: null,
    
    // Profile Data
    practitionerData: null,
    
    // Initialization flag - prevents auto-save during initial data load
    isInitializing: true,
    
    // Auto-save Management
    autoSaveTimeout: null,
    hasUnsavedChanges: false,
    completenessTimeout: null,
    AUTO_SAVE_DELAY: 1500, // 1.5 seconds
    
    // Credentials
    educationCredentials: [],
    licenseCredentials: [],
    certificationCredentials: [],
    
    // Media
    currentPhotos: [],
    photoIdCounter: 0,
    selectedProfilePictureFile: null,
    videoData: null,
    
    // Content
    currentLanguages: [],
    faqItems: [],
    faqNextId: 0,
    conditionsData: [],
    
    // Insurance & Payment
    selectedInsurance: [],
    selectedPaymentMethods: [],
    
    // Practice Settings
    practiceData: {},
    
    // Reviews
    allReviews: [],
    filteredReviews: [],
    profileLoadComplete: false,
    
    /**
     * Generic save method - routes to appropriate save function
     * Persists all unsaved data in ProfileState to database
     */
    async save() {
        try {
            // Save credentials if changed
            if (this.educationCredentials.length > 0 || this.licenseCredentials.length > 0 || this.certificationCredentials.length > 0) {
                await saveSectionCredentials();
            }
            
            // Save photos and video together
            if ((this.currentPhotos && this.currentPhotos.length > 0) || (this.videoData && (this.videoData.url || this.videoData.fileName))) {
                await saveSectionPhotosVideo();
            }
            
            console.log('[ProfileState] Save complete');
        } catch (error) {
            console.error('[ProfileState] Save failed:', error);
            throw error;
        }
    }
};

// Make ProfileState globally available for other modules
window.ProfileState = ProfileState;

// Legacy window access for backwards compatibility during transition
Object.defineProperty(window, 'educationCredentials', {
    get: () => ProfileState.educationCredentials,
    set: (val) => { ProfileState.educationCredentials = val; }
});
Object.defineProperty(window, 'licenseCredentials', {
    get: () => ProfileState.licenseCredentials,
    set: (val) => { ProfileState.licenseCredentials = val; }
});
Object.defineProperty(window, 'certificationCredentials', {
    get: () => ProfileState.certificationCredentials,
    set: (val) => { ProfileState.certificationCredentials = val; }
});
Object.defineProperty(window, 'currentPhotos', {
    get: () => ProfileState.currentPhotos,
    set: (val) => { ProfileState.currentPhotos = val; }
});
Object.defineProperty(window, 'videoData', {
    get: () => ProfileState.videoData,
    set: (val) => { ProfileState.videoData = val; }
});
Object.defineProperty(window, 'currentLanguages', {
    get: () => ProfileState.currentLanguages,
    set: (val) => { ProfileState.currentLanguages = val; }
});
Object.defineProperty(window, 'faqItems', {
    get: () => ProfileState.faqItems,
    set: (val) => { ProfileState.faqItems = val; }
});
Object.defineProperty(window, 'faqNextId', {
    get: () => ProfileState.faqNextId,
    set: (val) => { ProfileState.faqNextId = val; }
});
Object.defineProperty(window, 'selectedInsurance', {
    get: () => ProfileState.selectedInsurance,
    set: (val) => { ProfileState.selectedInsurance = val; }
});
Object.defineProperty(window, 'selectedPaymentMethods', {
    get: () => ProfileState.selectedPaymentMethods,
    set: (val) => { ProfileState.selectedPaymentMethods = val; }
});
Object.defineProperty(window, 'practiceData', {
    get: () => ProfileState.practiceData,
    set: (val) => { ProfileState.practiceData = val; }
});
Object.defineProperty(window, 'conditionsData', {
    get: () => ProfileState.conditionsData,
    set: (val) => { ProfileState.conditionsData = val; }
});
Object.defineProperty(window, 'allReviews', {
    get: () => ProfileState.allReviews,
    set: (val) => { ProfileState.allReviews = val; }
});
Object.defineProperty(window, 'practitionerData', {
    get: () => ProfileState.practitionerData,
    set: (val) => { ProfileState.practitionerData = val; }
});
Object.defineProperty(window, 'currentUser', {
    get: () => ProfileState.currentUser,
    set: (val) => { ProfileState.currentUser = val; }
});
Object.defineProperty(window, 'autoSaveTimeout', {
    get: () => ProfileState.autoSaveTimeout,
    set: (val) => { ProfileState.autoSaveTimeout = val; }
});
Object.defineProperty(window, 'hasUnsavedChanges', {
    get: () => ProfileState.hasUnsavedChanges,
    set: (val) => { ProfileState.hasUnsavedChanges = val; }
});
Object.defineProperty(window, 'completenessTimeout', {
    get: () => ProfileState.completenessTimeout,
    set: (val) => { ProfileState.completenessTimeout = val; }
});
Object.defineProperty(window, 'selectedProfilePictureFile', {
    get: () => ProfileState.selectedProfilePictureFile,
    set: (val) => { ProfileState.selectedProfilePictureFile = val; }
});
Object.defineProperty(window, 'photoIdCounter', {
    get: () => ProfileState.photoIdCounter,
    set: (val) => { ProfileState.photoIdCounter = val; }
});
Object.defineProperty(window, 'filteredReviews', {
    get: () => ProfileState.filteredReviews,
    set: (val) => { ProfileState.filteredReviews = val; }
});

// ======================================================
// 2. PROFILE TABLE FIELDS DEFINITION
// ======================================================

const PROFILE_TABLE_FIELDS = [
    // About & Specializations
    'bio', 'ethos_statement', 'languages',
    // Photos & Video
    'gallery_photos', 'intro_video_url', 'practice_logo_url',
    // Additional Details
    'faq', 'social_media', 'practice_type', 'year_established',
    // Insurance & Payment (moved to practitioner_profiles)
    'insurance_providers', 'payment_methods', 'custom_insurance_providers', 'custom_payment_methods',
    // Profile management
    'profile_completeness_percent'
];

/**
 * Credential-specific fields that belong in practitioner_credentials table
 */
const CREDENTIALS_TABLE_FIELDS = [
    'credentials', 'badge_certified', 'badge_licensed', 'badge_background_check_verified',
    'background_check_status', 'background_check_date', 'background_check_provider',
    'background_check_notes', 'verification_updated_at', 'verification_updated_by',
    'verification_audit_trail', 'approved_by', 'badge_verified', 'credentials_verified'
];

// ======================================================
// 3. HELPER FUNCTIONS
// ======================================================

/**
 * Route update data to the correct table based on field type
 * Separates fields for practitioners, practitioner_profiles, and practitioner_credentials
 * Returns merged data for window.practitionerData
 */
async function routeUpdateData(updateData) {
    if (!currentUser) {
        throw new Error('No current user');
    }
    
    try {
        const practitionersData = {};
        const profileData = {};
        const credentialsData = {};
        const mergedResult = {};
        
        // Separate fields by table
        Object.keys(updateData).forEach(key => {
            if (PROFILE_TABLE_FIELDS.includes(key)) {
                profileData[key] = updateData[key];
            } else if (CREDENTIALS_TABLE_FIELDS.includes(key)) {
                credentialsData[key] = updateData[key];
            } else {
                practitionersData[key] = updateData[key];
            }
        });
        
        // Update practitioners table if there are fields for it
        if (Object.keys(practitionersData).length > 0) {
            const { data: updated, error: updateError } = await window.supabaseClient
                .from('practitioners')
                .update(practitionersData)
                .eq('id', ProfileState.currentUser.id)
                .select('*')
                .single();
            
            if (updateError) {
                console.error('[DB] Error updating practitioners:', updateError);
                throw updateError;
            }
            Object.assign(mergedResult, updated);
        }
        
        // Update practitioner_profiles table if there are fields for it
        if (Object.keys(profileData).length > 0) {
            // Add updated_at if not present
            if (!profileData.updated_at) {
                profileData.updated_at = new Date().toISOString();
            }
            
            const { data: profileUpdated, error: profileError } = await window.supabaseClient
                .from('practitioner_profiles')
                .update(profileData)
                .eq('id', ProfileState.currentUser.id)
                .select('*')
                .single();
            
            if (profileError) {
                // If record doesn't exist, try to insert it
                if (profileError.code === 'PGRST116') {
                    const insertData = {
                        id: ProfileState.currentUser.id,
                        practitioner_serial: ProfileState.practitionerData?.serial_number,
                        ...profileData
                    };
                    
                    const { data: inserted, error: insertError } = await window.supabaseClient
                        .from('practitioner_profiles')
                        .insert([insertData])
                        .select('*')
                        .single();
                    
                    if (insertError) {
                        console.error('[DB] Error inserting into practitioner_profiles:', insertError);
                        throw insertError;
                    }
                    Object.assign(mergedResult, inserted);
                } else {
                    console.error('[DB] Error updating practitioner_profiles:', profileError);
                    throw profileError;
                }
            } else {
                Object.assign(mergedResult, profileUpdated);
            }
        }
        
        // Update practitioner_credentials table if there are fields for it
        if (Object.keys(credentialsData).length > 0) {
            if (!credentialsData.updated_at) {
                credentialsData.updated_at = new Date().toISOString();
            }
            
            const { data: credUpdated, error: credError } = await window.supabaseClient
                .from('practitioner_credentials')
                .update(credentialsData)
                .eq('id', ProfileState.currentUser.id)
                .select('*')
                .single();
            
            if (credError) {
                if (credError.code === 'PGRST116') {
                    const insertData = {
                        id: ProfileState.currentUser.id,
                        practitioner_serial: ProfileState.practitionerData?.serial_number,
                        ...credentialsData
                    };
                    
                    const { data: inserted, error: insertError } = await window.supabaseClient
                        .from('practitioner_credentials')
                        .insert([insertData])
                        .select('*')
                        .single();
                    
                    if (insertError) {
                        console.error('[DB] Error inserting into practitioner_credentials:', insertError);
                        throw insertError;
                    }
                    Object.assign(mergedResult, inserted);
                } else {
                    console.error('[DB] Error updating practitioner_credentials:', credError);
                    throw credError;
                }
            } else {
                Object.assign(mergedResult, credUpdated);
            }
        }
        
        // Return merged data with existing ProfileState.practitionerData
        const finalMerged = {
            ...ProfileState.practitionerData,
            ...mergedResult
        };
        
        // Recalculate profile completeness after successful save
        if (typeof recalculateProfileCompleteness === 'function') {
            await recalculateProfileCompleteness();
        }
        
        return finalMerged;
        
    } catch (error) {
        console.error('[DB] Error in routeUpdateData:', error);
        throw error;
    }
}

// ======================================================
// 4. SAFE DATABASE UPDATE FUNCTION
// ======================================================

// Safe update/insert for practitioners table (legacy - kept for compatibility)
// Tries UPDATE first, then INSERT if record doesn't exist
async function safePractitionerUpdate(updateData) {
    // Use the new routing function which handles all tables
    return routeUpdateData(updateData);
}

// Warn user if they try to leave page with unsaved changes
window.addEventListener('beforeunload', (event) => {
    if (ProfileState.hasUnsavedChanges) {
        // Standard beforeunload message (browsers show their own warning)
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return event.returnValue;
    }
});

// ======================================================
// 5. PROFILE INITIALIZATION & PAGE LOAD
// ======================================================

document.addEventListener('DOMContentLoaded', async () => {
    // Set active view to practitioner
    localStorage.setItem('active_view', 'practitioner');
    
    // Wait for header to be injected, then load logo
    let headerWaitAttempts = 0;
    const waitForHeaderLogo = () => {
        headerWaitAttempts++;
        const header = document.getElementById('rvHeader');
        const logoImg = document.querySelector('.rv-logo-img');
        
        if (header && logoImg && typeof RootedVitality !== 'undefined' && typeof RootedVitality.loadPractitionerLogo === 'function') {
            RootedVitality.loadPractitionerLogo();
            return true;
        }
        
        // Retry up to 30 times (3 seconds total)
        if (headerWaitAttempts < 30) {
            setTimeout(waitForHeaderLogo, 100);
        } else {
        }
        return false;
    };
    
    // Start waiting for header
    waitForHeaderLogo();
    
    // Wait for header to be rendered, then set Profile as active
    const setProfileAsActive = () => {
        const allNavLinks = document.querySelectorAll('.rv-nav-link');
        let profileLinkFound = false;
        allNavLinks.forEach(link => {
            link.classList.remove('active');
            // If this is the Profile link (an <a> tag), mark it as active
            if (link.tagName === 'A' && link.href.includes('/dashboard/pro/pages/profile.html')) {
                link.classList.add('active');
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
        }, 3000);
    }
    
    
    // Get current user
    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        
        if (!user) {
            const baseUrl = (typeof RootedVitality !== 'undefined' && RootedVitality.config.siteUrl) ? RootedVitality.config.siteUrl : '/rooted-vitality/';
            window.location.href = baseUrl + 'dashboard/client/pages/client-signup.html';
            return;
        }
        ProfileState.currentUser = user;
        // Load profile data from Supabase
        await loadProfile(user.id);
        
    } catch (error) {
        console.error('[Rooted Vitality] Error initializing profile:', error);
    }
    
    // Note: setupUnsavedChangesTracking and other setup functions are called from profile.js
    // This ensures all dependencies are loaded first
});

// ======================================================
// 6. LOAD PROFILE DATA FROM DATABASE
// ======================================================

async function loadProfile(userId) {
    try {
        // Fetch from practitioners table (main profile data)
        // Query by id, not user_id
        const { data: practitioner, error: practError } = await window.supabaseClient
            .from('practitioners')
            .select('*')
            .eq('id', userId)
            .single();
        if (practError && practError.code !== 'PGRST116') {
            console.error('[Rooted Vitality] Error loading practitioner data:', practError);
        }
        
        // Fetch profile content from practitioner_profiles table
        let profileContent = null;
        if (practitioner) {
            const { data: profile, error: profileError } = await window.supabaseClient
                .from('practitioner_profiles')
                .select('*')
                .eq('id', userId)
                .single();
            
            if (!profileError && profile) {
                profileContent = profile;
            }
        }
        
        // Fetch credentials from practitioner_credentials table
        let credentialsData = null;
        if (practitioner && practitioner.serial_number) {
            const { data: credentials, error: credError } = await window.supabaseClient
                .from('practitioner_credentials')
                .select('*')
                .eq('practitioner_serial', practitioner.serial_number)
                .maybeSingle();
            
            if (!credError && credentials) {
                credentialsData = credentials;
            } else if (credError) {
                console.error('[Profile] Error fetching credentials:', credError);
            }
        }
        
        // Merge practitioner + profile content + credentials
        if (practitioner) {
            const mergedData = {
                ...practitioner,
                ...(profileContent || {}),
                // Merge all credentials table data including background_check_status, verification_submitted, etc
                ...(credentialsData || {})
            };
            // Store practitioner data globally for badge system and form logic
            ProfileState.practitionerData = mergedData;
            
            // Populate ProfileState arrays from merged data
            // This separates credentials by type and loads other form data
            await populateProfileFields(mergedData);
        }
        
        // Populate profile fields is called from profile.js to ensure all functions are loaded
        
    } catch (error) {
        console.error('[Rooted Vitality] Error in loadProfile:', error);
    } finally {
        // Mark profile load as complete
        ProfileState.profileLoadComplete = true;
        // Call profile.js initialization after data is loaded
        if (typeof initializeProfilePage === 'function') {
            initializeProfilePage();
        }
    }
}

// ======================================================
// 7. POPULATE FORM FIELDS FROM PROFILE STATE
// ======================================================

async function populateProfileFields(data) {
    
    // Try to populate from practitioners table fields first, then fallback to profiles table fields
    
    // Header fields - from practitioners table 
    // The schema defines legal_name, but signup saves legal_business_name
    // Try both field names
    const fullName = data.legal_business_name || data.legal_name || data.dba_name || data.full_name || '';
    if (fullName) {
        const nameField = document.getElementById('profile-name');
        // Convert database format (dashes/underscores) to plain English (spaces)
        const displayName = fullName.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
        nameField.value = displayName;
        nameField.title = displayName; // Show full name on hover
    } else {
    }
    
    // DBA Name - display name for practitioners
    const dbaName = data.dba_name || '';
    if (dbaName) {
        // Convert database format (dashes/underscores) to plain English (spaces)
        const displayDbaName = dbaName.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
        document.getElementById('profile-dba-name').value = displayDbaName;
    }
    
    // Location fields - pull from address_city and address_state if available
    
    // Avatar - from practitioners table (display only in profile form)
    // Use practice_logo_url for practitioner logo
    let avatarUrl = null;
    const avatarDiv = document.getElementById('profile-avatar');
    
    if (data.practice_logo_url) {
        avatarUrl = data.practice_logo_url;
        // Show image
        avatarDiv.innerHTML = `<img src="${avatarUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: inherit;">`;
    } else {
        // Check local storage as fallback
        const localStorageAvatar = localStorage.getItem(`practice_logo_url_${data.id}`);
        if (localStorageAvatar) {
            avatarUrl = localStorageAvatar;
            const avatarImg = document.createElement('img');
            avatarImg.src = localStorageAvatar;
            avatarImg.className = 'avatar-image';
            avatarDiv.innerHTML = '';
            avatarDiv.appendChild(avatarImg);
        } else {
            // Show initial from business name
            const initial = fullName ? fullName.charAt(0).toUpperCase() : 'P';
            avatarDiv.innerHTML = initial;
            avatarDiv.classList.add('avatar-initial');
        }
    }
    
    // NOTE: Header avatar is now managed UNIVERSALLY by injections.js
    // Do NOT update header here - let the universal system handle it
    // Text sections - from practitioners table
    if (data.bio) {
        document.getElementById('about-content').value = data.bio;
        // Populate display text
        const aboutDisplay = document.getElementById('about-display');
        if (aboutDisplay) {
            aboutDisplay.textContent = data.bio;
            aboutDisplay.classList.remove('hidden');
        }
    }
    if (data.ethos_statement) {
        document.getElementById('approach-content').value = data.ethos_statement;
        // Populate display text
        const approachDisplay = document.getElementById('approach-display');
        if (approachDisplay) {
            approachDisplay.textContent = data.ethos_statement;
            approachDisplay.classList.remove('hidden');
        }
    }
    
    // Credentials - stored in practitioner_credentials.credentials JSONB array
    // Clear all credential arrays first
    ProfileState.educationCredentials = [];
    ProfileState.licenseCredentials = [];
    ProfileState.certificationCredentials = [];
    
    // Parse credentials from JSONB column (all types combined in single array)
    if (data.credentials && Array.isArray(data.credentials)) {
        // Separate credentials by type from combined array
        data.credentials.forEach(cred => {
            const credWithId = {
                ...cred,
                id: cred.id || Date.now()
            };
            
            if (cred.credential_type === 'degree') {
                ProfileState.educationCredentials.push(credWithId);
            } else if (cred.credential_type === 'license') {
                ProfileState.licenseCredentials.push(credWithId);
            } else if (cred.credential_type === 'certification') {
                ProfileState.certificationCredentials.push(credWithId);
            }
        });
    }
    
    // Social media fields
    if (data.social_media) {
        const social = data.social_media;
        if (social.facebook) document.getElementById('social-facebook').value = social.facebook;
        if (social.instagram) document.getElementById('social-instagram').value = social.instagram;
        if (social.twitter) document.getElementById('social-x').value = social.twitter;
        if (social.linkedin) document.getElementById('social-linkedin').value = social.linkedin;
        if (social.youtube) document.getElementById('social-youtube').value = social.youtube;
        if (social.tiktok) document.getElementById('social-tiktok').value = social.tiktok;
        if (social.pinterest) document.getElementById('social-pinterest').value = social.pinterest;
        if (social.website) document.getElementById('social-website').value = social.website;
    }
    
    // Load photos from gallery
    if (data.gallery_photos && Array.isArray(data.gallery_photos)) {
        loadPhotos(data.gallery_photos);
    } else {
        loadPhotos([]);
    }
    
    // Background check status - from practitioners table or practitioner_credentials table
    if (data.background_check_status) {
        updateBackgroundCheckStatus(data.background_check_status);
    }
    
    // Load badge verification status from practitioner_credentials
    if (data.badge_certified) {
        const badgeCertifiedCheckbox = document.getElementById('badge-certified');
        if (badgeCertifiedCheckbox) {
            badgeCertifiedCheckbox.checked = true;
        }
    }
    if (data.badge_licensed) {
        const badgeLicensedCheckbox = document.getElementById('badge-licensed');
        if (badgeLicensedCheckbox) {
            badgeLicensedCheckbox.checked = true;
        }
    }
    if (data.badge_background_check_verified) {
        const badgeBackgroundCheckCheckbox = document.getElementById('badge-background-check');
        if (badgeBackgroundCheckCheckbox) {
            badgeBackgroundCheckCheckbox.checked = true;
        }
    }
    
    // Payment information - from practitioners table
    if (data.payment_methods) {
        const paymentEl = document.getElementById('payment-methods');
        if (paymentEl) {
            paymentEl.value = data.payment_methods;
        }
    }
    
    // Load insurance providers list
    let insuranceData = [];
    if (data.insurance_providers) {
        // Handle both array and JSON string formats (stored as TEXT in DB)
        if (typeof data.insurance_providers === 'string') {
            try {
                insuranceData = JSON.parse(data.insurance_providers);
            } catch (e) {
                insuranceData = [];
            }
        } else if (Array.isArray(data.insurance_providers)) {
            insuranceData = data.insurance_providers;
        }
    }
    ProfileState.selectedInsurance = insuranceData;
    loadInsurance(insuranceData);
    
    // Load payment methods
    if (data.payment_methods) {
        // Handle both array and JSON string formats (stored as TEXT in DB)
        let paymentData = [];
        if (typeof data.payment_methods === 'string') {
            try {
                paymentData = JSON.parse(data.payment_methods);
            } catch (e) {
                paymentData = [];
            }
        } else if (Array.isArray(data.payment_methods)) {
            paymentData = data.payment_methods;
        }
        if (paymentData.length > 0) {
            loadPaymentMethods(paymentData);
        } else {
            ProfileState.selectedPaymentMethods = [];
        }
    } else {
        ProfileState.selectedPaymentMethods = [];
    }
    
    
    // NOTE: Practice type loading happens in profile.js during initialization
    // Just store in state, don't call profile.js functions from utility
    
    // NOTE: Video loading is handled by profile.js during initialization
    // Just store in state, don't call profile.js functions from utility
    if (data.intro_video_url) {
        ProfileState.videoData = { url: data.intro_video_url };
    }
    
    // Load languages from database
    // Languages are stored as text[] array in database
    if (data.languages) {
        
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
        
        ProfileState.currentLanguages = languagesArray;
    } else {
        ProfileState.currentLanguages = [];
    }
    
    // Load FAQ from database
    if (data.faq && Array.isArray(data.faq)) {
        ProfileState.faqItems = data.faq;
        // Set nextId to max id + 1
        ProfileState.faqNextId = Math.max(...ProfileState.faqItems.map(item => item.id || 0), 0) + 1;
    } else {
        ProfileState.faqItems = [];
        ProfileState.faqNextId = 0;
    }
    
    
    // NOTE: All credential UI rendering happens in profile.js
    // Data is stored in ProfileState, UI functions are called during page initialization
}

// ======================================================
// 8. SETUP INPUT LISTENERS & CHANGE TRACKING
// ======================================================

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
                clearTimeout(ProfileState.autoSaveTimeout);
                
                // Debounce completeness update (update after 500ms of no input)
                clearTimeout(ProfileState.completenessTimeout);
                ProfileState.completenessTimeout = setTimeout(() => {
                    updateProfileCompleteness();
                }, 500);
            });
        }
    });
    
    // NOTE: Manual save buttons are setup in profile.js via setupManualSaveButtons()
    // which uses the unified save system via executeSave()
}

// ======================================================
// 9. PROFILE COMPLETENESS TRACKING
// ======================================================

// Calculate and update profile completeness meter
// Covers all profile sections: About, Credentials, Photos/Video, Reviews, Additional Details
// Total: 18 sections for comprehensive profile tracking
function updateProfileCompleteness() {
    try {
        if (!ProfileState.practitionerData) {
            return;
        }
        
        const p = ProfileState.practitionerData;
        const itemsPercentage = 100 / 15; // Each item = 6.67%
        let completedItems = 0;
        const itemStatus = {};
        
        // 1. About You text (bio)
        itemStatus['1. Bio'] = p.bio?.trim()?.length > 0;
        if (itemStatus['1. Bio']) completedItems++;
        
        // 2. Your Approach & Philosophy text (ethos_statement)
        itemStatus['2. Ethos'] = p.ethos_statement?.trim()?.length > 0;
        if (itemStatus['2. Ethos']) completedItems++;
        
        // 3. Licensed badge = true
        itemStatus['3. Licensed Badge'] = p.badge_licensed === true;
        if (itemStatus['3. Licensed Badge']) completedItems++;
        
        // 4. Certification badge = true
        itemStatus['4. Certification Badge'] = p.badge_certified === true;
        if (itemStatus['4. Certification Badge']) completedItems++;
        
        // 5. Background check badge = true
        itemStatus['5. Background Check'] = p.badge_background_check_verified === true || p.background_check_status === 'passed';
        if (itemStatus['5. Background Check']) completedItems++;
        
        // 6. Verified badge = true
        itemStatus['6. Verified Badge'] = p.badge_verified === true;
        if (itemStatus['6. Verified Badge']) completedItems++;
        
        // 7. Business logo picture uploaded
        itemStatus['7. Business Logo'] = p.practice_logo_url?.trim()?.length > 0;
        if (itemStatus['7. Business Logo']) completedItems++;
        
        // 8. At least 1 gallery photo
        itemStatus['8. Gallery Photos'] = Array.isArray(p.gallery_photos) && p.gallery_photos.length > 0;
        if (itemStatus['8. Gallery Photos']) completedItems++;
        
        // 9. Introduction video uploaded
        itemStatus['9. Intro Video'] = p.intro_video_url?.trim()?.length > 0;
        if (itemStatus['9. Intro Video']) completedItems++;
        
        // 10. At least 1 review
        itemStatus['10. Reviews'] = ProfileState.allReviews && ProfileState.allReviews.length > 0;
        if (itemStatus['10. Reviews']) completedItems++;
        
        // 11. At least 1 FAQ
        itemStatus['11. FAQ'] = p.faq && ((Array.isArray(p.faq) && p.faq.length > 0) || (typeof p.faq === 'object' && Object.keys(p.faq).length > 0));
        if (itemStatus['11. FAQ']) completedItems++;
        
        // 12. At least 1 social media or website link
        if (p.social_media) {
            const hasSocial = p.social_media.facebook?.trim() || p.social_media.instagram?.trim() || 
                            p.social_media.twitter?.trim() || p.social_media.linkedin?.trim() || 
                            p.social_media.youtube?.trim() || p.social_media.tiktok?.trim() || 
                            p.social_media.pinterest?.trim() || p.social_media.website?.trim();
            itemStatus['12. Social Media'] = hasSocial;
            if (hasSocial) completedItems++;
        } else {
            itemStatus['12. Social Media'] = false;
        }
        
        // 13. Practice type & setting selected
        itemStatus['13. Practice Type'] = p.practice_type && ['private', 'clinic', 'hospital'].includes(p.practice_type);
        if (itemStatus['13. Practice Type']) completedItems++;
        
        // 14. At least 1 insurance provider checkbox selected
        // Check both ProfileState arrays and database columns
        const hasInsurance = (Array.isArray(p.insurance_providers) && p.insurance_providers.length > 0) || 
                           (Array.isArray(ProfileState.selectedInsurance) && ProfileState.selectedInsurance.length > 0) ||
                           p.custom_insurance_providers?.trim()?.length > 0;
        itemStatus['14. Insurance'] = hasInsurance;
        if (itemStatus['14. Insurance']) completedItems++;
        
        // 15. At least 1 payment method checkbox selected
        // Check both ProfileState arrays and database columns
        const hasPayment = (Array.isArray(p.payment_methods) && p.payment_methods.length > 0) ||
                          (Array.isArray(ProfileState.selectedPaymentMethods) && ProfileState.selectedPaymentMethods.length > 0) ||
                          p.custom_payment_methods?.trim()?.length > 0;
        itemStatus['15. Payment Methods'] = hasPayment;
        if (itemStatus['15. Payment Methods']) completedItems++;
        
        const percentage = Math.round(completedItems * itemsPercentage);
        
        // Update UI immediately
        const progressEl = document.getElementById('completeness-progress');
        const percentageEl = document.getElementById('completeness-percentage');
        const labelEl = document.getElementById('completeness-label');
        
        if (progressEl) {
            progressEl.style.setProperty('--progress-width', percentage + '%');
        }
        if (percentageEl) {
            percentageEl.textContent = percentage + '%';
        }
        if (labelEl) {
            if (percentage === 100) {
                labelEl.textContent = 'COMPLETE';
                labelEl.classList.add('complete');
            } else {
                const remaining = 15 - completedItems;
                labelEl.textContent = `${remaining} item${remaining !== 1 ? 's' : ''} to complete`;
                labelEl.classList.remove('complete');
            }
        }
        
        // Save to database (non-blocking)
        if (ProfileState.practitionerData?.id) {
            window.supabaseClient
                .from('practitioner_profiles')
                .update({ profile_completeness_percent: percentage })
                .eq('id', ProfileState.practitionerData.id)
                .then(({ error }) => {
                    if (error) console.error('[Rooted Vitality] Error saving completeness:', error);
                });
        }
        
        // Update credentials badge
        updateCredentialsBadge();
    } catch (error) {
        console.error('[Rooted Vitality] Error calculating profile completeness:', error);
    }
}

// Update credentials badge based on background check status, license credentials, certification credentials, and verification status
function updateCredentialsBadge() {
    try {
        const badgeBackgroundCheck = document.getElementById('badge-background-check');
        const badgeLicense = document.getElementById('badge-license');
        const badgeCertified = document.getElementById('badge-certified');
        const badgeVerified = document.getElementById('badge-verified');
        
        if (!badgeBackgroundCheck) {
        }
        
        if (!badgeLicense) {
        }
        
        if (!badgeCertified) {
        }
        
        if (!badgeVerified) {
        }
        
        const hasBackgroundCheck = ProfileState.practitionerData && ProfileState.practitionerData.background_check_status === 'passed';
        const hasLicense = ProfileState.practitionerData && ProfileState.practitionerData.badge_licensed;
        const hasCertified = ProfileState.practitionerData && ProfileState.practitionerData.badge_certified;
        const isVerified = ProfileState.practitionerData && ProfileState.practitionerData.badge_verified;
        // Background Check Badge - ALWAYS reset to locked state first
        if (badgeBackgroundCheck) {
            badgeBackgroundCheck.classList.add('badge-locked');
            badgeBackgroundCheck.classList.remove('background-check');
            
            if (hasBackgroundCheck) {
                badgeBackgroundCheck.classList.remove('badge-locked');
                badgeBackgroundCheck.classList.add('background-check');
            } else {
            }
        }
        
        // License Badge - ALWAYS reset to locked state first
        if (badgeLicense) {
            badgeLicense.classList.add('badge-locked');
            badgeLicense.classList.remove('license');
            
            if (hasLicense) {
                badgeLicense.classList.remove('badge-locked');
                badgeLicense.classList.add('license');
            } else {
            }
        }
        
        // Certified Badge - ALWAYS reset to locked state first
        if (badgeCertified) {
            badgeCertified.classList.add('badge-locked');
            badgeCertified.classList.remove('certified');
            
            if (hasCertified) {
                badgeCertified.classList.remove('badge-locked');
                badgeCertified.classList.add('certified');
            } else {
            }
        }
        
        // Verified Badge - ALWAYS reset to locked state first
        if (badgeVerified) {
            badgeVerified.classList.add('badge-locked');
            badgeVerified.classList.remove('verified');
            
            if (isVerified) {
                badgeVerified.classList.remove('badge-locked');
                badgeVerified.classList.add('verified');
            } else {
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
            executeSave('header', false); // Manual save using unified system
        });
    }

    // Add auto-save event listener for DBA name field
    const dbaNameInput = document.getElementById('profile-dba-name');
    if (dbaNameInput) {
        dbaNameInput.addEventListener('blur', () => {
            executeSave('header', true); // Auto-save with debounce
        });
        dbaNameInput.addEventListener('change', () => {
            executeSave('header', true); // Auto-save with debounce
        });
    }
}

// ======================================================
// 10. UNIFIED SAVE SYSTEM & AUTO-SAVE ORCHESTRATOR
// ======================================================

/**
 * CLEAN UNIFIED SAVE ARCHITECTURE
 * 
 * Single entry point: executeSave(target?, isAutoSave=false)
 * - target: Optional specific section to save (or null for auto-detect)
 * - isAutoSave: true for auto-debounced, false for manual button
 * 
 * Routes intelligently based on:
 * 1. Which table the fields belong to (practitioners, practitioner_profiles, practitioner_credentials)
 * 2. Whether it's manual (immediate) or auto (debounced)
 * 3. What data changed
 * 
 * Database Tables:
 * - practitioners: Identity fields (name, team_size, years, phone, email, dba_name, etc)
 * - practitioner_profiles: Content fields (bio, photos, faq, languages, social_media, etc)
 * - practitioner_credentials: Credential fields (licenses, certifications, badges)
 */

// ============ CHANGE TRACKING ============

function setupUnsavedChangesTracking() {
    window.markAsChanged = () => {
        ProfileState.hasUnsavedChanges = true;
    };
    
    window.clearUnsavedChanges = () => {
        ProfileState.hasUnsavedChanges = false;
    };
    
    // Monitor all form inputs for changes - triggers auto-save
    document.addEventListener('input', (e) => {
        // SKIP if still initializing (prevents auto-save on initial data load)
        if (ProfileState.isInitializing) return;
        
        const target = e.target;
        if (target.matches('input[type="text"], input[type="email"], input[type="url"], input[type="number"], textarea, select')) {
            window.markAsChanged();
            // Only call debounceAutoSave if available (credentials/media modules define it)
            if (typeof debounceAutoSave === 'function') {
                debounceAutoSave('credentials'); // Default to credentials, module can override
            }
        }
    }, true);
    
    document.addEventListener('change', (e) => {
        // SKIP if still initializing (prevents auto-save on initial data load)
        if (ProfileState.isInitializing) return;
        
        const target = e.target;
        if (target.matches('input[type="checkbox"], input[type="radio"], select')) {
            window.markAsChanged();
            // Only call debounceAutoSave if available (credentials/media modules define it)
            if (typeof debounceAutoSave === 'function') {
                debounceAutoSave('credentials'); // Default to credentials, module can override
            }
        }
    }, true);
}

// ============ SAVE INDICATOR UI ============

function showAutoSaveIndicator(status = 'saving') {
    let indicator = document.getElementById('auto-save-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'auto-save-indicator';
        document.body.appendChild(indicator);
    }
    
    indicator.className = `auto-save-indicator visible ${status}`;
    
    if (status === 'saving') {
        indicator.innerHTML = `<div class="save-spinner"></div><span>Saving...</span>`;
    } else if (status === 'success') {
        indicator.innerHTML = `<div class="save-checkmark">✓</div><span>Saved</span>`;
        setTimeout(() => indicator.classList.remove('visible'), 2000);
    } else if (status === 'error') {
        indicator.innerHTML = `<div class="save-error">!</div><span>Save failed</span>`;
        setTimeout(() => indicator.classList.remove('visible'), 3000);
    }
}

// ============ UNIFIED SAVE ORCHESTRATOR ============

/**
 * Smart unified save entry point
 * Handles both manual and auto-save with clean routing
 * @param {string|null} targetSection - Specific section to save, or null to auto-detect
 * @param {boolean} isAutoSave - true for debounced auto-save, false for immediate manual save
 */
function executeSave(targetSection = null, isAutoSave = true) {
    if (isAutoSave) {
        // Auto-save uses debounce to avoid hammering the database
        clearTimeout(ProfileState.autoSaveTimeout);
        ProfileState.autoSaveTimeout = setTimeout(() => {
            performSave(targetSection);
        }, ProfileState.AUTO_SAVE_DELAY);
    } else {
        // Manual save is immediate (button click)
        performSave(targetSection);
    }
}

/**
 * Actually perform the save operation
 * Figures out what section changed and routes to appropriate handler
 */
async function performSave(targetSection = null) {
    if (!ProfileState.currentUser) {
        console.error('[SAVE] No authenticated user');
        showAutoSaveIndicator('error');
        return;
    }
    
    try {
        showAutoSaveIndicator('saving');
        
        // Determine what to save
        let sectionToSave = targetSection;
        
        if (!sectionToSave && event?.target) {
            // Auto-detect from event target which section it belongs to
            const fieldId = event.target.id;
            
            // Header fields
            if (['profile-name', 'profile-dba-name', 'profile-teamsize', 'profile-years'].includes(fieldId)) {
                sectionToSave = 'header';
            } else {
                // Try to find parent section container
                const section = event.target.closest('[data-section]');
                sectionToSave = section?.getAttribute('data-section');
            }
        }
        
        // Route to appropriate handler
        if (sectionToSave === 'header') {
            await saveHeaderFields();
        } else if (sectionToSave === 'about') {
            await saveSectionAbout();
        } else if (sectionToSave === 'credentials') {
            await saveSectionCredentials();
        } else if (sectionToSave === 'photos') {
            await saveSectionPhotosVideo();
        } else if (sectionToSave === 'more-details') {
            await saveSectionMoreDetails();
        } else {
            // No clear section, do nothing
            return;
        }
        
        // Update completeness AFTER save completes
        await updateProfileCompleteness();
        window.clearUnsavedChanges();
        showAutoSaveIndicator('success');
        
    } catch (error) {
        console.error('[SAVE] Error:', error);
        showAutoSaveIndicator('error');
    }
}

// ============ SECTION SAVE HANDLERS ============

/**
 * Save header/identity fields to practitioners table
 * Fields: name, dba_name, team_size, years
 */
async function saveHeaderFields() {
    const headerData = {
        legal_name: document.getElementById('profile-name')?.value || '',
        dba_name: document.getElementById('profile-dba-name')?.value || '',
        business_size: document.getElementById('profile-teamsize')?.value || '',
        updated_at: new Date().toISOString()
    };
    
    const { error } = await window.supabaseClient
        .from('practitioners')
        .update(headerData)
        .eq('id', ProfileState.currentUser.id);
    
    if (error) throw error;
}

/**
 * Save about section to practitioner_profiles table
 * Fields: bio, ethos_statement
 */
async function saveSectionAbout() {
    const aboutData = {
        bio: document.getElementById('about-content')?.value || '',
        ethos_statement: document.getElementById('approach-content')?.value || '',
        updated_at: new Date().toISOString()
    };
    
    await routeUpdateData(aboutData);
}

/**
 * Save credentials section to practitioner_credentials table
 * Combines all credential types and saves badges
 */
async function saveSectionCredentials() {
    const allCredentials = [
        ...(ProfileState.educationCredentials || []).map(c => ({ ...c, type: 'degree' })),
        ...(ProfileState.licenseCredentials || []).map(c => ({ ...c, type: 'license' })),
        ...(ProfileState.certificationCredentials || []).map(c => ({ ...c, type: 'certification' }))
    ];
    
    const credentialsData = {
        credentials: allCredentials,
        badge_verified: document.getElementById('badge-verified')?.checked || false,
        badge_certified: document.getElementById('badge-certified')?.checked || false,
        badge_licensed: document.getElementById('badge-licensed')?.checked || false,
        badge_background_check_verified: document.getElementById('badge-background-check')?.checked || false,
        updated_at: new Date().toISOString()
    };
    
    await routeUpdateData(credentialsData);
}

/**
 * Save photos & video section to practitioner_profiles table
 */
async function saveSectionPhotosVideo() {
    const photosVideoData = {
        gallery_photos: getPhotosForSave() || [],
        intro_video_url: ProfileState.videoData?.url || null,
        updated_at: new Date().toISOString()
    };
    
    await routeUpdateData(photosVideoData);
}

/**
 * Save more details section to practitioner_profiles table
 * Fields: languages, faq, social_media, practice_type, insurance, payment methods
 */
async function saveSectionMoreDetails() {
    const moreDetailsData = {
        languages: getSelectedLanguages() || [],
        faq: ProfileState.faqItems || [],
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
        practice_type: document.querySelector('input[name="practice-setting"]:checked')?.value || null,
        
        // INSURANCE PROVIDERS - collect from ProfileState
        insurance_providers: ProfileState.selectedInsurance || [],
        
        // CUSTOM INSURANCE PROVIDERS - collect from form input
        custom_insurance_providers: document.getElementById('custom-insurance-input')?.value || '',
        
        // PAYMENT METHODS - collect from ProfileState
        payment_methods: ProfileState.selectedPaymentMethods || [],
        
        // CUSTOM PAYMENT METHODS - collect from form input
        custom_payment_methods: document.getElementById('custom-payment-input')?.value || '',
        
        updated_at: new Date().toISOString()
    };
    
    await routeUpdateData(moreDetailsData);
}

