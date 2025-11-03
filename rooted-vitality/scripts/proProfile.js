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

// Initialize credential arrays (use window object for access from functions)
window.educationCredentials = [];
window.licenseCredentials = [];
window.certificationCredentials = [];
window.continuingEducationCredentials = [];

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
            if (link.tagName === 'A' && link.href.includes('/dashboard/pro/profile.html')) {
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
            window.location.href = '/signup.html';
            return;
        }
        currentUser = user;
        console.log(`[Rooted Vitality] Loaded profile for user: ${user.id}`);
        
        
        // Load profile data from Supabase
        await loadProfile(user.id);
        
    } catch (error) {
        console.error('[Rooted Vitality] Error initializing profile:', error);
    }
    
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
    setupAlbumButton();
    setupHeaderSaveButton();
    
    console.log('[Rooted Vitality] Practitioner profile initialized');
});

async function loadProfile(userId) {
    try {
        console.log(`[Rooted Vitality] Loading profile for userId: ${userId}`);
        
        
        // Fetch from practitioners table (main profile data)
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
        
        // Fetch from profiles table (user metadata)
        const { data: profile, error: profileError } = await window.supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        
        console.log('[Rooted Vitality] Profiles query result:', { 
            profile,
            profileError,
            hasData: !!profile,
            errorCode: profileError?.code,
            errorMessage: profileError?.message
        });
        
        if (profileError && profileError.code !== 'PGRST116') {
            console.error('[Rooted Vitality] Error loading profile data:', profileError);
        }
        
        if (practitioner) {
            console.log('[Rooted Vitality] Practitioner data loaded from database:', practitioner);
            // KEEP currentUser as the auth user, don't overwrite with practitioner record
            await populateProfileFields(practitioner);
        } else if (profile) {
            console.log('[Rooted Vitality] Profile loaded from database (limited data):', profile);
            // KEEP currentUser as the auth user, don't overwrite with profile record
            await populateProfileFields(profile);
        } else {
            // Try to get name from auth user metadata
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (user && user.user_metadata && user.user_metadata.full_name) {
                console.log('[Rooted Vitality] Using name from auth metadata:', user.user_metadata.full_name);
                document.getElementById('profile-name').value = user.user_metadata.full_name;
            }
            console.log('[Rooted Vitality] New profile - showing blank form');
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
        document.getElementById('profile-name').value = fullName;
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
    
    // Location fields
    console.log('[Rooted Vitality] Location value from data:', { location: data.location, type: typeof data.location });
    if (data.location) {
        document.getElementById('profile-location').value = data.location;
        console.log('[Rooted Vitality] ✓ Set location to:', data.location);
    } else {
        console.log('[Rooted Vitality] ⚠ Location is falsy:', data.location);
    }
    
    // Years in Service - try years_in_practice first, then years_in_service
    const yearsValue = data.years_in_practice || data.years_in_service || data.year_established || '';
    if (yearsValue) {
        document.getElementById('profile-years').value = yearsValue;
        console.log('[Rooted Vitality] ✓ Set years to:', yearsValue, '(source: years_in_practice or years_in_service)');
    }
    
    // Avatar - from practitioners table (display only in profile form)
    let avatarUrl = null;
    if (data.profile_photo_url) {
        avatarUrl = data.profile_photo_url;
        document.getElementById('profile-avatar').src = avatarUrl;
        console.log('[Rooted Vitality] ✓ Set profile avatar preview to:', avatarUrl);
    } else if (data.avatar_url) {
        avatarUrl = data.avatar_url;
        document.getElementById('profile-avatar').src = avatarUrl;
        console.log('[Rooted Vitality] ✓ Set profile avatar preview to (from avatar_url):', avatarUrl);
    } else {
        // Check local storage as fallback
        const localStorageAvatar = localStorage.getItem(`profile_photo_url_${data.id || data.user_id}`);
        if (localStorageAvatar) {
            avatarUrl = localStorageAvatar;
            document.getElementById('profile-avatar').src = avatarUrl;
            console.log('[Rooted Vitality] ✓ Set profile avatar preview (from local storage):', avatarUrl);
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
    
    // Credentials - now as JSON arrays
    if (data.education_credentials && Array.isArray(data.education_credentials)) {
        console.log('[Rooted Vitality] ✓ Loading education credentials:', data.education_credentials);
        window.educationCredentials = data.education_credentials;
    } else {
        window.educationCredentials = [];
    }
    
    if (data.license_credentials && Array.isArray(data.license_credentials)) {
        // Filter out empty/invalid credentials
        const validLicenses = data.license_credentials.filter(cred => cred && (cred.license_type || cred.license_number));
        console.log('[Rooted Vitality] ✓ Loading license credentials:', validLicenses, '(filtered from', data.license_credentials.length, ')');
        window.licenseCredentials = validLicenses;
    } else {
        window.licenseCredentials = [];
    }
    
    if (data.certification_credentials && Array.isArray(data.certification_credentials)) {
        // Filter out empty/invalid credentials
        const validCerts = data.certification_credentials.filter(cred => cred && (cred.certification_type || cred.issuing_organization));
        console.log('[Rooted Vitality] ✓ Loading certification credentials:', validCerts, '(filtered from', data.certification_credentials.length, ')');
        window.certificationCredentials = validCerts;
    } else {
        window.certificationCredentials = [];
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
        document.getElementById('payment-methods').value = data.payment_methods;
        console.log('[Rooted Vitality] ✓ Set payment methods');
    }
    
    // Load insurance accepted list (new array-based system)
    if (data.insurance_accepted && Array.isArray(data.insurance_accepted)) {
        loadInsurance(data.insurance_accepted);
        console.log('[Rooted Vitality] ✓ Loaded insurance accepted:', data.insurance_accepted);
    } else {
        loadInsurance([]);
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
    if (data.intro_video_url) {
        loadVideo(data.intro_video_url);
        console.log('[Rooted Vitality] ✓ Loaded intro video');
    }
    
    // Load continuing education credentials
    if (data.continuing_education && Array.isArray(data.continuing_education)) {
        window.continuingEducationCredentials = data.continuing_education;
        renderContinuingEducationDisplay();
        console.log('[Rooted Vitality] ✓ Loaded continuing education:', data.continuing_education);
    } else {
        window.continuingEducationCredentials = [];
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
    
    console.log('[Rooted Vitality] 🔧 initializeCredentialSections completed');
}

// Debounce timer for completeness updates
let completenessTimeout = null;

function setupInputListeners() {
    const inputFields = [
        'profile-name', 'profile-location', 'profile-years', 'profile-teamsize',
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
}

/**
 * Calculate and update profile completeness meter
 * Counts: name, location, years, about, approach, degrees, licenses, certifications, modalities, social (as 1), albums, languages, faq, payment
 * Total possible: 14 sections
 */
function updateProfileCompleteness() {
    try {
        // Define what needs to be filled for each section
        // 17 total sections tracked
        const sections = {
            'name': () => !!document.getElementById('profile-name')?.value?.trim(),
            'location': () => !!document.getElementById('profile-location')?.value?.trim(),
            'years': () => {
                const val = document.getElementById('profile-years')?.value;
                return val !== null && val !== undefined && val !== '';
            },
            'about': () => !!document.getElementById('about-content')?.value?.trim(),
            'approach': () => !!document.getElementById('approach-content')?.value?.trim(),
            'degrees': () => educationCredentials && educationCredentials.length > 0,
            'credentials': () => {
                // Licenses OR Certifications count as 1 section
                const hasLicenses = licenseCredentials && licenseCredentials.length > 0;
                const hasCerts = certificationCredentials && certificationCredentials.length > 0;
                return hasLicenses || hasCerts;
            },
            'social': () => {
                // ALL social links count as 1 section - complete if ANY link is filled
                const socialFields = ['social-facebook', 'social-instagram', 'social-x', 'social-linkedin', 
                                    'social-youtube', 'social-tiktok', 'social-pinterest', 'social-website'];
                return socialFields.some(fieldId => !!document.getElementById(fieldId)?.value?.trim());
            },
            'languages': () => {
                const langsList = document.getElementById('languages-list');
                return langsList && langsList.querySelectorAll('.language-tag').length > 0;
            },
            'faq': () => {
                const faqList = document.getElementById('faq-list');
                return faqList && faqList.querySelectorAll('.faq-item').length > 0;
            },
            'payment': () => {
                // Complete if either insurance selected OR payment methods filled
                const hasInsurance = window.selectedInsurance && window.selectedInsurance.length > 0;
                const paymentMethods = document.getElementById('payment-methods')?.value?.trim();
                return hasInsurance || !!paymentMethods;
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
            'practice': () => {
                // Complete if structure or setting selected
                const hasStructure = window.practiceData && window.practiceData.structure;
                return !!hasStructure;
            },
            'conditions': () => window.conditionsData && window.conditionsData.length > 0,
            'video': () => window.videoData && window.videoData.url,
            'photos': () => window.currentPhotos && window.currentPhotos.length > 0,
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
 * Update credentials badge based on available licenses and certifications
 */
function updateCredentialsBadge() {
    try {
        const badgeLicensed = document.getElementById('badge-licensed');
        const badgeVerified = document.getElementById('badge-verified');
        const badgeCertified = document.getElementById('badge-certified');
        
        if (!badgeLicensed || !badgeVerified || !badgeCertified) {
            console.warn('[Rooted Vitality] Badge elements not found!');
            return;
        }
        
        // Check credentials exist and are arrays
        if (!Array.isArray(window.licenseCredentials)) window.licenseCredentials = [];
        if (!Array.isArray(window.certificationCredentials)) window.certificationCredentials = [];
        if (!Array.isArray(window.educationCredentials)) window.educationCredentials = [];
        
        const hasLicenses = window.licenseCredentials.length > 0;
        const hasCerts = window.certificationCredentials.length > 0;
        const hasDegrees = window.educationCredentials.length > 0;
        
        console.log('[Rooted Vitality] updateCredentialsBadge - BEFORE:', {
            licensedClasses: badgeLicensed.className,
            hasLicenses,
            licenseCredentialsLength: window.licenseCredentials.length
        });
        
        // ALWAYS reset to locked state first
        badgeLicensed.classList.add('badge-locked');
        badgeVerified.classList.add('badge-locked');
        badgeCertified.classList.add('badge-locked');
        
        // ALWAYS remove active classes
        badgeLicensed.classList.remove('licensed', 'verified', 'certified');
        badgeVerified.classList.remove('licensed', 'verified', 'certified');
        badgeCertified.classList.remove('licensed', 'verified', 'certified');
        
        console.log('[Rooted Vitality] Badges initialized with badge-locked class:', {
            licensedClasses: badgeLicensed.className
        });
        
        // Licensed Badge - Unlock ONLY if user has licenses
        if (hasLicenses) {
            badgeLicensed.classList.remove('badge-locked');
            badgeLicensed.classList.add('licensed');
            console.log('[Rooted Vitality] ⭐ Badge activated: Licensed');
        } else {
            console.log('[Rooted Vitality] ✓ Licensed badge stays locked (no licenses)', { hasLicenses });
        }
        
        // Verified Badge - Unlock ONLY if user has BOTH licenses AND certifications
        if (hasLicenses && hasCerts) {
            badgeVerified.classList.remove('badge-locked');
            badgeVerified.classList.add('verified');
            console.log('[Rooted Vitality] ⭐ Badge activated: Verified');
        } else {
            console.log('[Rooted Vitality] ✓ Verified badge stays locked', { hasLicenses, hasCerts });
        }
        
        // Certified Badge - Unlock ONLY if user has certifications
        if (hasCerts) {
            badgeCertified.classList.remove('badge-locked');
            badgeCertified.classList.add('certified');
            console.log('[Rooted Vitality] ⭐ Badge activated: Certified');
        } else {
            console.log('[Rooted Vitality] ✓ Certified badge stays locked (no certs)', { hasCerts });
        }
        
        console.log('[Rooted Vitality] Credentials badge showcase updated - FINAL:', {
            licensedClasses: badgeLicensed.className,
            hasLicenses,
            hasCerts,
            hasDegrees
        });
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
        
        const practitionerData = {
            user_id: currentUser.id,
            email: currentUser.email || '',
            legal_name: document.getElementById('profile-name')?.value || '',
            dba_name: document.getElementById('profile-dba-name')?.value || '',
            location: document.getElementById('profile-location')?.value || '',
            years_in_practice: document.getElementById('profile-years')?.value ? parseInt(document.getElementById('profile-years').value) : null,
            business_size: document.getElementById('profile-teamsize')?.value || '',
            updated_at: new Date().toISOString()
        };
        
        console.log('[Rooted Vitality] Saving header info with UPSERT:', practitionerData);
        
        // Use UPSERT to handle both insert and update in one operation
        const { error: upsertError } = await window.supabaseClient
            .from('practitioners')
            .upsert(practitionerData, { onConflict: 'user_id' });
        
        if (upsertError) {
            console.error('[Rooted Vitality] Error saving header info:', upsertError);
            showAutoSaveIndicator('error');
            return;
        }
        
        console.log('[Rooted Vitality] Header info saved successfully with UPSERT');
        showAutoSaveIndicator('success');
        
        // Update profile completeness
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
                education_type: '',
                institution: '',
                degree_qualification: '',
                graduation_year: ''
            };
        case 'license':
            return {
                license_type: '',
                license_number: '',
                issuing_authority: '',
                expiration_date: ''
            };
        case 'certification':
            return {
                certification_type: '',
                issuing_organization: '',
                credential_id: '',
                expiration_date: ''
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
    
    let titleField = '';
    let fieldsHTML = '';
    
    if (type === 'degree') {
        titleField = credential.degree_qualification || 'New Degree';
        fieldsHTML = `
            <div class="credential-field">
                <label>Education Type</label>
                <select class="credential-input" data-field="education_type">
                    <option value="">Select...</option>
                    <option value="High School" ${credential.education_type === 'High School' ? 'selected' : ''}>High School</option>
                    <option value="Associate's Degree" ${credential.education_type === "Associate's Degree" ? 'selected' : ''}>Associate's Degree</option>
                    <option value="Bachelor's Degree" ${credential.education_type === "Bachelor's Degree" ? 'selected' : ''}>Bachelor's Degree</option>
                    <option value="Master's Degree" ${credential.education_type === "Master's Degree" ? 'selected' : ''}>Master's Degree</option>
                    <option value="Doctorate" ${credential.education_type === 'Doctorate' ? 'selected' : ''}>Doctorate</option>
                    <option value="Certificate" ${credential.education_type === 'Certificate' ? 'selected' : ''}>Certificate</option>
                </select>
            </div>
            <div class="credential-field">
                <label>Institution</label>
                <input type="text" class="credential-input" data-field="institution" placeholder="School or University" value="${credential.institution || ''}">
            </div>
            <div class="credential-field">
                <label>Degree / Qualification</label>
                <input type="text" class="credential-input" data-field="degree_qualification" placeholder="e.g., Bachelor of Science in Nutrition" value="${credential.degree_qualification || ''}">
            </div>
            <div class="credential-field">
                <label>Graduation Year</label>
                <input type="number" class="credential-input" data-field="graduation_year" placeholder="YYYY" value="${credential.graduation_year || ''}" min="1970" max="2100">
            </div>
        `;
    } else if (type === 'license') {
        titleField = credential.license_type || 'New License';
        fieldsHTML = `
            <div class="credential-field">
                <label>License Type</label>
                <input type="text" class="credential-input" data-field="license_type" placeholder="e.g., Massage Therapy License" value="${credential.license_type || ''}">
            </div>
            <div class="credential-field">
                <label>License Number</label>
                <input type="text" class="credential-input" data-field="license_number" placeholder="License number" value="${credential.license_number || ''}">
            </div>
            <div class="credential-field">
                <label>Issuing Authority</label>
                <input type="text" class="credential-input" data-field="issuing_authority" placeholder="State or organization" value="${credential.issuing_authority || ''}">
            </div>
            <div class="credential-field">
                <label>Expiration Date</label>
                <input type="date" class="credential-input" data-field="expiration_date" value="${credential.expiration_date || ''}">
            </div>
        `;
    } else if (type === 'certification') {
        titleField = credential.certification_type || 'New Certification';
        fieldsHTML = `
            <div class="credential-field">
                <label>Certification Type</label>
                <input type="text" class="credential-input" data-field="certification_type" placeholder="e.g., Certified Wellness Coach" value="${credential.certification_type || ''}">
            </div>
            <div class="credential-field">
                <label>Issuing Organization</label>
                <input type="text" class="credential-input" data-field="issuing_organization" placeholder="Organization name" value="${credential.issuing_organization || ''}">
            </div>
            <div class="credential-field">
                <label>Credential ID</label>
                <input type="text" class="credential-input" data-field="credential_id" placeholder="Certificate or ID number" value="${credential.credential_id || ''}">
            </div>
            <div class="credential-field">
                <label>Expiration Date</label>
                <input type="date" class="credential-input" data-field="expiration_date" value="${credential.expiration_date || ''}">
            </div>
        `;
    }
    
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
            renderCredentials(type);
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
    
    let title = '';
    let details = '';
    
    if (type === 'degree') {
        title = credential.degree_qualification || credential.education_type || 'Degree';
        details = [
            credential.education_type && `<strong>Type:</strong> ${credential.education_type}`,
            credential.institution && `<strong>Institution:</strong> ${credential.institution}`,
            credential.graduation_year && `<strong>Graduated:</strong> ${credential.graduation_year}`
        ].filter(Boolean).join(' • ');
    } else if (type === 'license') {
        title = credential.license_type || 'License';
        details = [
            credential.license_number && `<strong>License #:</strong> ${credential.license_number}`,
            credential.issuing_authority && `<strong>Authority:</strong> ${credential.issuing_authority}`,
            credential.expiration_date && `<strong>Expires:</strong> ${credential.expiration_date}`
        ].filter(Boolean).join(' • ');
    } else if (type === 'certification') {
        title = credential.certification_type || 'Certification';
        details = [
            credential.issuing_organization && `<strong>Organization:</strong> ${credential.issuing_organization}`,
            credential.credential_id && `<strong>ID:</strong> ${credential.credential_id}`,
            credential.expiration_date && `<strong>Expires:</strong> ${credential.expiration_date}`
        ].filter(Boolean).join(' • ');
    }
    
    div.innerHTML = `
        <div class="credential-display-item-title">${title}</div>
        <div class="credential-display-item-details">${details}</div>
    `;
    
    return div;
}

/* Debounce auto-save for Phase 1 sections (Languages, FAQ) */
function debounceAutoSave() {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
        // Check if this is a header field edit and save immediately
        if (event && event.target) {
            const fieldId = event.target.id;
            if (['profile-name', 'profile-location', 'profile-years', 'profile-teamsize', 'profile-dba-name'].includes(fieldId)) {
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
            location: document.getElementById('profile-location')?.value || '',
            years_in_practice: document.getElementById('profile-years')?.value ? parseInt(document.getElementById('profile-years').value) : null,
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
        
    } catch (error) {
        console.error('[Rooted Vitality] Error in saveHeaderFields:', error);
        showAutoSaveIndicator('error');
    }
}

async function saveSectionData(sectionId) {
    if (!currentUser) return;
    
    try {
        showAutoSaveIndicator('saving');
        
        // For credential sections, save to credentials table instead
        if (['degrees', 'licenses', 'certifications'].includes(sectionId)) {
            await saveCredentialsSection(sectionId);
            return;
        }
        
        // For other sections, prepare practitioners table updates
        const practitionerData = {
            user_id: currentUser.id,
            updated_at: new Date().toISOString()
        };
        
        // Add fields based on section
        if (sectionId === 'about') {
            practitionerData.bio = document.getElementById('about-content')?.value || '';
        } else if (sectionId === 'approach') {
            practitionerData.ethos_statement = document.getElementById('approach-content')?.value || '';
        } else if (sectionId === 'social') {
            // Create plain object for social media and let Supabase handle JSON serialization
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
            // Store as plain object - Supabase will handle JSONB serialization
            practitionerData.social_media = socialData;
        } else if (sectionId === 'languages') {
            practitionerData.languages = getSelectedLanguages();
            console.log('[Rooted Vitality] Saving languages:', practitionerData.languages);
        } else if (sectionId === 'photos') {
            // Save only metadata for photos (caption/id), not base64 data
            practitionerData.gallery_photos = getPhotosForSave();
            console.log('[Rooted Vitality] Saving photos metadata:', practitionerData.gallery_photos);
        } else if (sectionId === 'faq') {
            practitionerData.faq = window.faqItems;
            console.log('[Rooted Vitality] Saving FAQ:', practitionerData.faq);
        } else if (sectionId === 'payment') {
            practitionerData.insurance_accepted = window.selectedInsurance || [];
            practitionerData.payment_methods = document.getElementById('payment-methods')?.value || '';
            console.log('[Rooted Vitality] Saving payment information:', practitionerData);
        } else if (sectionId === 'pricing') {
            const pricingData = savePricingData();
            practitionerData.pricing = JSON.stringify(pricingData);
            console.log('[Rooted Vitality] Saving pricing:', practitionerData.pricing);
        } else if (sectionId === 'practice') {
            const practiceData = savePracticeData();
            practitionerData.practice_type = JSON.stringify(practiceData);
            console.log('[Rooted Vitality] Saving practice type:', practitionerData.practice_type);
        } else if (sectionId === 'conditions') {
            const conditionsData = saveConditionsData();
            practitionerData.conditions_treated = conditionsData;
            console.log('[Rooted Vitality] Saving conditions treated:', practitionerData.conditions_treated);
        } else if (sectionId === 'video') {
            if (window.videoData && window.videoData.url) {
                practitionerData.intro_video_url = window.videoData.url;
                console.log('[Rooted Vitality] Saving video URL:', practitionerData.intro_video_url);
            }
        } else if (sectionId === 'continuing-education') {
            practitionerData.continuing_education = window.continuingEducationCredentials || [];
            console.log('[Rooted Vitality] Saving continuing education:', practitionerData.continuing_education);
        }
        
        console.log(`[Rooted Vitality] Saving section ${sectionId}:`, practitionerData);
        
        // Prepare UPSERT data with required fields
        const upsertData = {
            user_id: currentUser.id,
            email: currentUser.email || '',
            ...practitionerData,
            updated_at: new Date().toISOString()
        };
        
        // Use UPSERT pattern to avoid RLS silent failures
        const { error } = await window.supabaseClient
            .from('practitioners')
            .upsert(upsertData, { onConflict: 'user_id' });
        
        if (error) {
            console.error(`[Rooted Vitality] Error saving section ${sectionId}:`, error);
            showAutoSaveIndicator('error');
            return;
        }
        
        console.log(`[Rooted Vitality] Section ${sectionId} saved successfully`);
        showAutoSaveIndicator('success');
        
        // Lock the section to read-only mode after successful save
        lockSectionEdit(sectionId);
        
        // Update profile completeness meter
        updateProfileCompleteness();
        
    } catch (error) {
        console.error(`[Rooted Vitality] Error in saveSectionData for ${sectionId}:`, error);
        showAutoSaveIndicator('error');
    }
}

/**
 * Save credentials (education, licenses, certifications) to credentials table
 */
async function saveCredentialsSection(sectionId) {
    if (!currentUser) return;
    
    try {
        // Get practitioner_id for this user
        const { data: practitioner, error: practError } = await window.supabaseClient
            .from('practitioners')
            .select('id')
            .eq('user_id', currentUser.id)
            .single();
        
        if (practError || !practitioner) {
            console.error('[Rooted Vitality] Could not find practitioner record:', practError);
            showAutoSaveIndicator('error');
            return;
        }
        
        const practitionerId = practitioner.id;
        
        // Get credentials array
        let credentials = [];
        let credentialType = '';
        
        if (sectionId === 'degrees') {
            credentials = window.educationCredentials || [];
            credentialType = 'education';
        } else if (sectionId === 'licenses') {
            credentials = window.licenseCredentials || [];
            credentialType = 'license';
        } else if (sectionId === 'certifications') {
            credentials = window.certificationCredentials || [];
            credentialType = 'certification';
        }
        
        console.log(`[Rooted Vitality] Saving ${sectionId}:`, credentials);
        
        // Delete existing credentials of this type for this practitioner
        const { error: deleteError } = await window.supabaseClient
            .from('credentials')
            .delete()
            .eq('practitioner_id', practitionerId)
            .eq('credential_type', credentialType);
        
        if (deleteError) {
            console.error(`[Rooted Vitality] Error deleting old ${sectionId}:`, deleteError);
            showAutoSaveIndicator('error');
            return;
        }
        
        // If no credentials to save, we're done
        if (credentials.length === 0) {
            console.log(`[Rooted Vitality] No ${sectionId} to save`);
            showAutoSaveIndicator('success');
            return;
        }
        
        // Insert new credentials
        const credentialRecords = credentials.map(cred => ({
            practitioner_id: practitionerId,
            credential_type: credentialType,
            title: cred.title || '',
            issuer: cred.issuer || '',
            issue_date: cred.issueDate || null,
            expiration_date: cred.expirationDate || null,
            credential_number: cred.number || cred.credential_number || '',
            credential_url: cred.url || cred.credential_url || '',
            description: cred.description || ''
        }));
        
        const { error: insertError } = await window.supabaseClient
            .from('credentials')
            .insert(credentialRecords);
        
        if (insertError) {
            console.error(`[Rooted Vitality] Error saving ${sectionId}:`, insertError);
            showAutoSaveIndicator('error');
            return;
        }
        
        console.log(`[Rooted Vitality] ${sectionId} saved successfully (${credentials.length} records)`);
        showAutoSaveIndicator('success');
        updateProfileCompleteness();
        
    } catch (error) {
        console.error(`[Rooted Vitality] Error in saveCredentialsSection for ${sectionId}:`, error);
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
        // Handle photo gallery section
        const editDiv = document.getElementById('photos-edit');
        const displayDiv = document.getElementById('photos-display');
        
        if (editDiv) editDiv.style.display = 'none';
        if (displayDiv) {
            displayDiv.style.display = 'block';
            renderPhotosDisplay();
        }
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
        
        // Prepare data for practitioners table (primary practitioner profile)
        // Support both field name conventions - schema uses legal_name, signup uses legal_business_name
        const practitionerData = {
            user_id: currentUser.id,
            legal_name: document.getElementById('profile-name').value,
            legal_business_name: document.getElementById('profile-name').value,
            business_size: document.getElementById('profile-teamsize').value,
            bio: document.getElementById('about-content').value,
            ethos_statement: document.getElementById('approach-content').value,
            education: document.getElementById('degrees-content').value,
            license_issuer: document.getElementById('licenses-content').value,
            certifications: document.getElementById('certifications-content').value,
            updated_at: new Date().toISOString()
        };
        
        // Social media as JSON
        const socialData = {
            facebook: document.getElementById('social-facebook').value,
            instagram: document.getElementById('social-instagram').value,
            twitter: document.getElementById('social-x').value,
            linkedin: document.getElementById('social-linkedin').value,
            youtube: document.getElementById('social-youtube').value,
            tiktok: document.getElementById('social-tiktok').value,
            pinterest: document.getElementById('social-pinterest').value,
            website: document.getElementById('social-website').value
        };
        practitionerData.social_media = socialData;
        
        console.log('[Rooted Vitality] Saving practitioner data:', practitionerData);
        
        // Save to practitioners table
        const { error: practError } = await window.supabaseClient
            .from('practitioners')
            .upsert(practitionerData, { onConflict: 'user_id' });
        
        if (practError) {
            console.error('[Rooted Vitality] Error saving to practitioners table:', practError);
            showSaveStatus('Save failed', 'error');
            return;
        }
        
        // Also update profiles table with additional metadata
        const profileData = {
            id: currentUser.id,
            updated_at: new Date().toISOString()
        };
        
        // Add custom fields if the profiles table has them
        const locationValue = document.getElementById('profile-location').value;
        const yearsValue = document.getElementById('profile-years').value;
        const teamValue = document.getElementById('profile-teamsize').value;
        
        if (locationValue) profileData.location = locationValue;
        if (yearsValue) profileData.years_in_service = parseInt(yearsValue) || null;
        if (teamValue) profileData.team_size = teamValue;
        
        const { error: profileError } = await window.supabaseClient
            .from('profiles')
            .upsert(profileData, { onConflict: 'id' });
        
        if (profileError) {
            console.warn('[Rooted Vitality] Warning saving to profiles table:', profileError);
            // Don't fail if profiles table doesn't have all columns
        }
        
        console.log('[Rooted Vitality] Profile saved successfully');
        showSaveStatus('Saved', 'success');
    } catch (error) {
        console.error('[Rooted Vitality] Error in saveProfile:', error);
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
        
        // Update practitioners table with new avatar URL using the correct user_id
        try {
            const { data: updateData, error: practitionerError } = await window.supabaseClient
                .from('practitioners')
                .update({ 
                    profile_photo_url: avatarUrl, 
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
            currentUser.profile_photo_url = avatarUrl;
        }
        
        // Update preview
        document.getElementById('profile-avatar').src = avatarUrl;
        
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

/* ========================================== */
/* PROFESSIONAL PHOTO GALLERY FUNCTIONS */
/* ========================================== */

window.currentPhotos = [];
let photoIdCounter = 0;

function loadPhotos(photos) {
    console.log('[Rooted Vitality] Loading photos:', photos);
    window.currentPhotos = Array.isArray(photos) ? photos : [];
    renderPhotosList();
    renderPhotosDisplay();
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
        
        // Read file as data URL
        const reader = new FileReader();
        reader.onload = (event) => {
            const photoData = {
                id: Date.now(),
                data: event.target.result,
                caption: 'Photo'
            };
            window.currentPhotos.push(photoData);
            renderPhotosList();
            debounceAutoSave();
        };
        reader.readAsDataURL(file);
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
            <img src="${photo.data}" alt="Gallery photo" class="photo-card-image">
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
            <img src="${photo.data}" alt="Gallery photo" class="photo-display-image">
            <div class="photo-display-caption">${photo.caption || 'Photo'}</div>
        </div>
    `).join('');
}

function getPhotosForSave() {
    // Return simplified photo data for database storage (without base64 data for now)
    return window.currentPhotos.map(p => ({
        id: p.id,
        caption: p.caption
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
    } else if (status === 'pending') {
        statusContainer.innerHTML = `
            <div class="background-check-status pending">
                <span class="status-icon">⏳</span>
                <div>
                    <p>Background Check In Progress</p>
                    <p class="status-date">We're verifying your credentials</p>
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
    if (previewLink && currentUser) {
        previewLink.addEventListener('click', (e) => {
            e.preventDefault();
            // Generate public profile URL (adjust path as needed)
            const publicProfileUrl = `/profiles/${currentUser.id}`;
            window.open(publicProfileUrl, '_blank');
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
    console.log('[Rooted Vitality] Loading languages from profile');
    
    if (!currentUser || !currentUser.languages) {
        console.log('[Rooted Vitality] No languages data found');
        renderLanguagesList([]);
        return;
    }
    
    // Parse languages if stored as JSON string
    let languages = [];
    if (typeof currentUser.languages === 'string') {
        try {
            languages = JSON.parse(currentUser.languages);
        } catch (e) {
            console.error('[Rooted Vitality] Error parsing languages:', e);
            languages = [];
        }
    } else if (Array.isArray(currentUser.languages)) {
        languages = currentUser.languages;
    }
    
    renderLanguagesList(languages);
    console.log('[Rooted Vitality] Loaded languages:', languages);
}

function setupLanguageListeners() {
    console.log('[Rooted Vitality] Setting up language listeners');
    
    const languageInput = document.getElementById('language-input');
    if (!languageInput) return;
    
    languageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const language = languageInput.value.trim();
            if (language) {
                addLanguage(language);
                languageInput.value = '';
            }
        }
    });
}

window.currentLanguages = [];

function addLanguage(language) {
    console.log('[Rooted Vitality] Adding language:', language);
    
    if (!window.currentLanguages.includes(language)) {
        window.currentLanguages.push(language);
        renderLanguagesList(window.currentLanguages);
        debounceAutoSave();
    }
}

function removeLanguage(language) {
    console.log('[Rooted Vitality] Removing language:', language);
    
    window.currentLanguages = window.currentLanguages.filter(lang => lang !== language);
    renderLanguagesList(window.currentLanguages);
    debounceAutoSave();
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
    console.log('[Rooted Vitality] Loading FAQ from profile');
    
    if (!currentUser || !currentUser.faq) {
        console.log('[Rooted Vitality] No FAQ data found');
        window.faqItems = [];
        renderFAQItems();
        return;
    }
    
    // Parse FAQ if stored as JSON string
    let faqs = [];
    if (typeof currentUser.faq === 'string') {
        try {
            faqs = JSON.parse(currentUser.faq);
        } catch (e) {
            console.error('[Rooted Vitality] Error parsing FAQ:', e);
            faqs = [];
        }
    } else if (Array.isArray(currentUser.faq)) {
        faqs = currentUser.faq;
    }
    
    window.faqItems = faqs;
    // Set nextId to max id + 1
    window.faqNextId = Math.max(...window.faqItems.map(item => item.id || 0), 0) + 1;
    
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
            <div class="faq-form-group">
                <label>Question ${index + 1}</label>
                <input 
                    type="text" 
                    class="faq-question-input" 
                    data-faq-id="${item.id}"
                    value="${item.question || ''}"
                    placeholder="What do clients commonly ask?"
                >
            </div>
            <div class="faq-form-group">
                <label>Answer</label>
                <textarea 
                    class="faq-answer-input" 
                    data-faq-id="${item.id}"
                    placeholder="Provide a helpful answer..."
                    rows="3"
                >${item.answer || ''}</textarea>
            </div>
            <button class="faq-delete-btn" onclick="deleteFAQItem(${item.id})" title="Remove this Q&A">× Remove</button>
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
                debounceAutoSave();
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
    debounceAutoSave();
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
    const checkboxes = document.querySelectorAll('.insurance-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = window.selectedInsurance.includes(checkbox.value);
        checkbox.addEventListener('change', updateInsuranceSelection);
    });
}

function updateInsuranceSelection() {
    const checkboxes = document.querySelectorAll('.insurance-checkbox:checked');
    window.selectedInsurance = Array.from(checkboxes).map(cb => cb.value);
    renderInsuranceDisplay();
    debounceAutoSave();
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
        
        if (document.getElementById('practice-in-person').checked) delivery.push('in-person');
        if (document.getElementById('practice-virtual').checked) delivery.push('virtual');
        if (document.getElementById('practice-hybrid').checked) delivery.push('hybrid');
        
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
    const videoInput = document.getElementById('video-input');
    if (videoInput) {
        videoInput.addEventListener('change', handleVideoUpload);
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
        document.getElementById('video-filename').textContent = `Selected: ${file.name}`;
        document.getElementById('video-duration-info').textContent = `Duration: ${Math.round(duration)}s`;
        document.getElementById('video-preview-section').style.display = 'block';
        
        console.log('[Rooted Vitality] Video loaded:', { fileName: file.name, duration: duration });
    }, { once: true });
}

function removeVideo() {
    window.videoData = { url: null, duration: null, fileName: null };
    document.getElementById('video-input').value = '';
    document.getElementById('video-filename').textContent = '';
    document.getElementById('video-preview').src = '';
    document.getElementById('video-duration-info').textContent = '';
    document.getElementById('video-preview-section').style.display = 'none';
    console.log('[Rooted Vitality] Video removed');
}

function loadVideo(videoUrl) {
    try {
        window.videoData.url = videoUrl;
        const displayPlayer = document.getElementById('video-display-player');
        const placeholder = document.getElementById('video-display-placeholder');
        
        if (videoUrl && displayPlayer) {
            displayPlayer.src = videoUrl;
            displayPlayer.style.display = 'block';
            if (placeholder) placeholder.style.display = 'none';
            console.log('[Rooted Vitality] ✓ Video loaded for display');
        }
    } catch (error) {
        console.error('[Rooted Vitality] Error loading video:', error);
    }
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
        const checkboxes = document.querySelectorAll('input[name="condition"]:checked');
        window.conditionsData = Array.from(checkboxes).map(checkbox => checkbox.value);
        console.log('[Rooted Vitality] Updated conditions data:', window.conditionsData);
    } catch (error) {
        console.error('[Rooted Vitality] Error updating conditions data:', error);
    }
}

function saveConditionsData() {
    try {
        updateConditionsData();
        console.log('[Rooted Vitality] Saved conditions data:', window.conditionsData);
        return window.conditionsData;
    } catch (error) {
        console.error('[Rooted Vitality] Error saving conditions data:', error);
        return [];
    }
}

function loadConditions(conditionsArray) {
    try {
        if (!Array.isArray(conditionsArray)) {
            console.warn('[Rooted Vitality] Conditions not an array:', conditionsArray);
            return;
        }
        
        window.conditionsData = conditionsArray;
        
        // Check the corresponding checkboxes
        const checkboxes = document.querySelectorAll('input[name="condition"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = conditionsArray.includes(checkbox.value);
        });
        
        // Render display
        renderConditionsDisplay();
        console.log('[Rooted Vitality] ✓ Conditions loaded:', conditionsArray);
    } catch (error) {
        console.error('[Rooted Vitality] Error loading conditions:', error);
    }
}

function renderConditionsDisplay() {
    try {
        const displayDiv = document.getElementById('conditions-display-content');
        if (!displayDiv) return;
        
        if (!window.conditionsData || window.conditionsData.length === 0) {
            displayDiv.innerHTML = '<div class="conditions-placeholder">No conditions selected yet.</div>';
            return;
        }
        
        // Map of condition values to display labels
        const conditionLabels = {
            'anxiety': 'Anxiety Disorders',
            'depression': 'Depression',
            'trauma': 'Trauma & PTSD',
            'bipolar': 'Bipolar Disorder',
            'ocd': 'OCD',
            'adhd': 'ADHD',
            'autism': 'Autism Spectrum',
            'sleep': 'Sleep Disorders',
            'chronic-pain': 'Chronic Pain Management',
            'stress': 'Stress Management',
            'addiction': 'Addiction & Substance Use',
            'eating': 'Eating Disorders',
            'relationships': 'Relationship Issues',
            'grief': 'Grief & Loss',
            'career': 'Career Counseling',
            'life-transitions': 'Life Transitions',
            'family': 'Family Therapy',
            'parenting': 'Parenting Support',
            'self-esteem': 'Self-Esteem & Confidence',
            'anger-management': 'Anger Management'
        };
        
        let html = '';
        window.conditionsData.forEach(condition => {
            const label = conditionLabels[condition] || condition;
            html += `<span class="condition-badge">${label}</span>`;
        });
        
        displayDiv.innerHTML = html;
        console.log('[Rooted Vitality] ✓ Conditions display rendered');
    } catch (error) {
        console.error('[Rooted Vitality] Error rendering conditions display:', error);
    }
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

console.log('[Rooted Vitality] proProfile.js loaded');

