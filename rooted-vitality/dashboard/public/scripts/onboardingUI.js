/**
 ╔════════════════════════════════════════════════════════════════════╗
 ║  ROOTED VITALITY, INC.                                             ║
 ║  File: onboardingUI.js                                             ║
 ║  Purpose: UI rendering, form handling, and event listeners         ║
 ║  Holistic Wellness · Modern Connection Platform                    ║
 ║  rootedvitality.com | 2025                                         ║
 ╚════════════════════════════════════════════════════════════════════╝

 TABLE OF CONTENTS
   1. CSS Injection & Styling
   2. Event Listener Setup
   3. Form Submission Handlers
   4. Character Counters & Input Helpers
   5. Modal Close & Navigation
   6. Category Picker UI

 DEPENDENCIES:
   - Requires: onboardingCore.js, onboardingService.js
   - Global: window.showAlertModal, goToStep, closeOnboardingModal
 */

// ======================================================
// 1. CSS INJECTION & STYLING
// ======================================================

/**
 * Inject onboarding styles from external CSS files
 * Loads three modular CSS files in order:
 * 1. onboardingCore.css - Base modal and animations
 * 2. onboardingUI.css - UI components and forms
 * 3. onboardingService.css - Business flows and responsive design
 */
function injectOnboardingStyles() {
    if (document.getElementById('onboarding-modal-styles-core')) {
        return; // Already injected
    }

    const cssFiles = [
        'onboardingCore.css',
        'onboardingUI.css',
        'onboardingService.css'
    ];

    cssFiles.forEach((fileName, index) => {
        const link = document.createElement('link');
        link.id = `onboarding-modal-styles-${fileName.replace('.css', '')}`;
        link.rel = 'stylesheet';
        link.href = `/rooted-vitality/dashboard/public/styles/${fileName}`;
        document.head.appendChild(link);
    });
}

// ======================================================
// 2. EVENT LISTENER SETUP
// ======================================================

/**
 * Setup all event listeners for the onboarding modal
 * isReturningUser: if true, user is returning/logged in - skip steps 3 and 4
 */
function setupOnboardingEventListeners(isReturningUser = false) {
    const modal = document.getElementById('guided-onboarding-modal');
    if (!modal) return;
    
    // Load existing data from localStorage or start fresh
    let onboardingData = JSON.parse(localStorage.getItem('rooted-onboarding-data')) || { path: null };
    
    // Store to window so it's accessible to other functions like populateStep5Display
    window.currentOnboardingData = onboardingData;
    
    // Function to save data to localStorage after each step
    const saveLocalData = () => {
        localStorage.setItem('rooted-onboarding-data', JSON.stringify(onboardingData));
        window.currentOnboardingData = onboardingData;
    };

    // Setup character counters
    setupCharacterCounters();

    // Setup password toggles
    setupPasswordToggles(modal);

    // Setup category picker
    setupCategoryPickerForStep1b();

    // Close button
    modal.querySelector('.onboarding-close-btn').addEventListener('click', () => {
        closeOnboardingModal();
    });

    // ====== STEP 0: New or returning user choice ======
    const returningUserBtn = document.getElementById('returning-user-btn');
    const newUserBtn = document.getElementById('new-user-btn');
    if (returningUserBtn) {
        returningUserBtn.addEventListener('click', () => {
            goToStep('0a');
        });
    }
    if (newUserBtn) {
        newUserBtn.addEventListener('click', () => {
            goToStep(1);
        });
    }

    // ====== STEP 0a: Login ======
    const loginForm = document.getElementById('step-login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => handleLoginSubmit(e, saveLocalData));
        const switchLink = loginForm.querySelector('.login-switch-link');
        if (switchLink) {
            switchLink.addEventListener('click', (e) => {
                e.preventDefault();
                goToStep(1);
            });
        }
    }

    // ====== STEP 1: Path choice ======
    document.getElementById('path-direct')?.addEventListener('click', () => {
        onboardingData.path = 'direct';
        goToStep('1a');
    });

    document.getElementById('path-guided')?.addEventListener('click', () => {
        onboardingData.path = 'guided';
        goToStep('1b');
    });

    // ====== STEP 1A: Direct category selection ======
    setupStep1aHandler(onboardingData, saveLocalData);

    // ====== STEP 1B: Guided path ======
    setupStep1bHandler(onboardingData, saveLocalData);

    // ====== STEP 2: Client profile ======
    setupStep2Handler(onboardingData, saveLocalData);

    // ====== STEP 3: Signup ======
    setupStep3Handler(onboardingData, saveLocalData);

    // ====== STEP 4: Verification ======
    setupStep4Handler(onboardingData, saveLocalData);

    // ====== STEP 5: Project confirmation ======
    setupStep5Handler(onboardingData, saveLocalData);

    // ====== STEP 6: Matches ======
    setupStep6Handler(onboardingData);

    // Back buttons
    modal.querySelectorAll('.onboarding-back').forEach(btn => {
        btn.addEventListener('click', () => handleBackButton(onboardingData));
    });
}

// ======================================================
// 3. FORM SUBMISSION HANDLERS
// ======================================================

function setupStep1aHandler(onboardingData, saveLocalData) {
    const categorySelect = document.getElementById('onboarding-category-direct');
    const subcategoriesGrid = document.getElementById('onboarding-subcategories-direct');
    
    if (!categorySelect) return;

    // Handle category dropdown changes
    categorySelect.addEventListener('change', (e) => {
        const categoryId = e.target.value;

        // Clear and repopulate subcategories based on selected category
        if (subcategoriesGrid) {
            subcategoriesGrid.innerHTML = '';
            
            if (categoryId) {
                const data = (typeof taxonomyData !== 'undefined' && Object.keys(taxonomyData).length > 0) 
                    ? taxonomyData 
                    : onboardingTaxonomyCache;

                const category = data?.[categoryId];
                if (category?.subcategories?.length) {
                    category.subcategories.forEach(subName => {
                        const label = document.createElement('label');
                        label.className = 'checkbox-label';
                        label.innerHTML = `
                            <input type="checkbox" name="subcategories" value="${subName}">
                            <span class="checkbox-text">${subName}</span>
                        `;
                        subcategoriesGrid.appendChild(label);
                    });
                }
            }
        }
    });

    // Handle form submission
    document.getElementById('step-1a-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const categoryId = document.getElementById('onboarding-category-direct').value;
        
        const selectedSubcategories = Array.from(
            document.querySelectorAll('input[name="subcategories"]:checked')
        ).map(input => input.value);

        if (!categoryId) {
            window.showAlertModal('Please select a wellness category');
            return;
        }

        if (selectedSubcategories.length === 0) {
            window.showAlertModal('Please select at least one specific concern');
            return;
        }

        onboardingData.category = categoryId;
        onboardingData.subcategories = selectedSubcategories;
        onboardingData.description = document.getElementById('onboarding-description-direct').value.trim() || '';
        onboardingData.travel_preference = document.querySelector('input[name="travel_preference"]:checked')?.value || null;
        onboardingData.urgency = document.querySelector('input[name="urgency"]:checked')?.value || null;
        onboardingData.currentPath = '1a';
        saveLocalData();
        goToStep(2);
    });
}

// Step 1B, 2, 3, 4, 5, 6 handlers defined similarly...
// [Handlers extracted from the monolith - keeping actual form logic]

function setupStep1bHandler(onboardingData, saveLocalData) {
    document.getElementById('step-1b-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const symptoms = document.getElementById('guided-symptoms').value.trim();
        const category = document.getElementById('guided-category-selected').value;
        const urgency = document.querySelector('input[name="urgency"]:checked').value;
        const travelPref = document.querySelector('input[name="travel_preference"]:checked').value;
        const selectedSubcategories = Array.from(document.querySelectorAll('#guided-subcategories-list input[type="checkbox"]:checked')).map(cb => cb.value);

        if (!symptoms || !category || selectedSubcategories.length === 0) {
            window.showAlertModal('Please complete all required fields');
            return;
        }

        onboardingData.category = category;
        onboardingData.description = symptoms;
        onboardingData.subcategory = selectedSubcategories;
        onboardingData.urgency = urgency;
        onboardingData.travel_preference = travelPref;
        onboardingData.currentPath = '1b';
        saveLocalData();
        goToStep(2);
    });
}

function setupStep2Handler(onboardingData, saveLocalData) {
    document.getElementById('step-2-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        onboardingData.clientProfile = {
            wellnessGoals: document.getElementById('wellness-goals').value.trim(),
            duration: document.getElementById('duration').value.trim(),
            triedBefore: document.getElementById('tried-before').value.trim(),
            allergies: document.getElementById('allergies').value.trim(),
            medications: document.getElementById('medications').value.trim(),
            dailyLife: document.getElementById('daily-life').value.trim(),
            communicationPref: document.getElementById('communication-pref').value,
            barriers: document.getElementById('barriers').value.trim(),
            practitionerExp: document.getElementById('practitioner-exp').value,
            desiredOutcomes: document.getElementById('desired-outcomes').value.trim()
        };
        saveLocalData();
        
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (session) {
            // Authenticated user - skip to step 5
            onboardingData.userId = session.user.id;
            const { data: clientData } = await window.supabaseClient
                .from('clients')
                .select('serial_number, first_name, last_name')
                .eq('id', session.user.id)
                .single();
            onboardingData.clientSerial = clientData?.serial_number || null;
            onboardingData.firstName = clientData?.first_name || null;
            onboardingData.lastName = clientData?.last_name || null;
            saveLocalData();
            goToStep(5);
            return;
        }
        
        goToStep(3);
    });
}

function setupStep3Handler(onboardingData, saveLocalData) {
    document.getElementById('step-3-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Check if user is already authenticated - if so, skip signup and go to step 5
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (session) {
            onboardingData.userId = session.user.id;
            // Fetch client info for authenticated user (serial, name)
            const { data: clientData } = await window.supabaseClient
                .from('clients')
                .select('serial_number, first_name, last_name')
                .eq('id', session.user.id)
                .single();
            onboardingData.clientSerial = clientData?.serial_number || null;
            onboardingData.firstName = clientData?.first_name || null;
            onboardingData.lastName = clientData?.last_name || null;
            goToStep(5);
            return;
        }
        
        const firstName = document.getElementById('onboarding-firstName').value.trim();
        const lastName = document.getElementById('onboarding-lastName').value.trim();
        const dob = document.getElementById('onboarding-dob-signup').value;
        const sex = document.getElementById('onboarding-sex').value;
        const email = document.getElementById('onboarding-email').value.trim();
        const confirmEmail = document.getElementById('onboarding-confirmEmail').value.trim();
        const password = document.getElementById('onboarding-password').value;
        const confirmPassword = document.getElementById('onboarding-confirmPassword').value;
        const phone = document.getElementById('onboarding-phone-signup').value.trim();
        const street = document.getElementById('onboarding-street-signup').value.trim();
        const city = document.getElementById('onboarding-city-signup').value.trim();
        const state = document.getElementById('onboarding-state-signup').value.trim();
        const zipcode = document.getElementById('onboarding-zipcode-signup').value.trim();

        if (!firstName || !lastName) {
            window.showAlertModal('Please enter your name');
            return;
        }
        if (!dob) {
            window.showAlertModal('Please enter your date of birth');
            return;
        }

        // Calculate age from date of birth
        const dobDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - dobDate.getFullYear();
        const monthDiff = today.getMonth() - dobDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
            age--;
        }

        if (age < 18) {
            window.showAlertModal('You must be at least 18 years old');
            return;
        }
        if (!sex) {
            window.showAlertModal('Please select your sex');
            return;
        }
        if (!email || email !== confirmEmail) {
            window.showAlertModal('Please enter matching email addresses');
            return;
        }
        if (!password || !confirmPassword) {
            window.showAlertModal('Please enter a password');
            return;
        }
        if (password !== confirmPassword) {
            window.showAlertModal('Passwords do not match');
            return;
        }
        if (password.length < 6) {
            window.showAlertModal('Password must be at least 6 characters');
            return;
        }
        if (!phone) {
            window.showAlertModal('Please enter your phone number');
            return;
        }
        if (!city || !state || !zipcode) {
            window.showAlertModal('Please fill in city, state, and zip code');
            return;
        }

        onboardingData.firstName = firstName;
        onboardingData.lastName = lastName;
        onboardingData.dob = dob;
        onboardingData.age = age;
        onboardingData.sex = sex;
        onboardingData.email = email;
        onboardingData.password = password;
        onboardingData.phone = phone;
        onboardingData.street = street;
        onboardingData.city = city;
        onboardingData.state = state;
        onboardingData.zipcode = zipcode;
        saveLocalData();
        goToStep(4);
    });
}

function setupStep4Handler(onboardingData, saveLocalData) {
    // ====== STEP 4: Project confirmation (edit button) ======
    const editProjectBtn = document.getElementById('edit-project-btn');
    if (editProjectBtn) {
        editProjectBtn.addEventListener('click', () => {
            // Go back to path choice step to edit
            goToStep(onboardingData.path === 'direct' ? '1a' : '1b');
        });
    }

    // ====== STEP 4: Terms agreement verification ======
    const disclaimerCheckbox = document.getElementById('checkbox-disclaimer');
    const privacyCheckbox = document.getElementById('checkbox-privacy');
    const termsCheckbox = document.getElementById('checkbox-terms');
    const step4NextBtn = document.getElementById('step-4-next');
    const termsScrollContainer = document.getElementById('terms-scroll-container');

    if (disclaimerCheckbox && privacyCheckbox && termsCheckbox && step4NextBtn && termsScrollContainer) {
        let hasScrolledToBottom = false;

        // Detect scroll to bottom
        termsScrollContainer.addEventListener('scroll', () => {
            const scrollTop = termsScrollContainer.scrollTop;
            const scrollHeight = termsScrollContainer.scrollHeight;
            const clientHeight = termsScrollContainer.clientHeight;
            
            // Check if scrolled to bottom (within 10px tolerance)
            if (scrollTop + clientHeight >= scrollHeight - 10) {
                hasScrolledToBottom = true;
            }
        });

        const updateStep4Button = () => {
            const allChecked = disclaimerCheckbox.checked && privacyCheckbox.checked && termsCheckbox.checked;
            // Button only enabled if scrolled to bottom AND all checkboxes checked
            step4NextBtn.disabled = !allChecked || !hasScrolledToBottom;
        };

        disclaimerCheckbox.addEventListener('change', updateStep4Button);
        privacyCheckbox.addEventListener('change', updateStep4Button);
        termsCheckbox.addEventListener('change', updateStep4Button);
        step4NextBtn.disabled = true;

        step4NextBtn.addEventListener('click', async () => {
            if (!disclaimerCheckbox.checked || !privacyCheckbox.checked || !termsCheckbox.checked) {
                window.showAlertModal('Please review and accept all agreements to continue');
                return;
            }

            try {
                step4NextBtn.disabled = true;
                step4NextBtn.textContent = 'Creating your account...';

                // Check if user is already authenticated (returning user)
                const { data: { session } } = await window.supabaseClient.auth.getSession();
                let authData;
                
                if (session) {
                    // User is already logged in - use existing auth
                    authData = { user: session.user };
                } else {
                    // New user - sign up
                    const { data: signupData, error: authError } = await window.supabaseClient.auth.signUp({
                        email: onboardingData.email,
                        password: onboardingData.password,
                        options: {
                            emailRedirectTo: `${window.location.origin}/rooted-vitality/index.html`
                        }
                    });

                    if (authError) throw authError;
                    authData = signupData;
                }

                // Normalize phone
                const phoneDigitsOnly = onboardingData.phone.replace(/\D/g, '');
                const normalizedPhone = phoneDigitsOnly.slice(-10);

                // Create client profile in clients table
                const { error: clientError } = await window.supabaseClient
                    .from('clients')
                    .insert({
                        id: authData.user.id,
                        email: onboardingData.email,
                        first_name: onboardingData.firstName,
                        last_name: onboardingData.lastName,
                        phone: normalizedPhone,
                        address: onboardingData.street || null,
                        city: onboardingData.city || null,
                        state: onboardingData.state || null,
                        zipcode: onboardingData.zipcode.trim().slice(0, 10),
                        sex: onboardingData.sex,
                        age: onboardingData.age,
                        date_of_birth: onboardingData.dob || null,
                        account_status: 'active',
                        account_standing: 'good',
                        two_factor_enabled: false,
                        open_to_contact: true,
                        open_to_match: true
                    });

                if (clientError) {
                    console.warn('[Onboarding] Client profile warning:', clientError.message);
                }

                // Get the client_serial that was auto-generated
                const { data: clientData, error: clientSerialError } = await window.supabaseClient
                    .from('clients')
                    .select('serial_number')
                    .eq('id', authData.user.id)
                    .single();

                if (clientSerialError) {
                    console.warn('[Onboarding] Could not retrieve client serial:', clientSerialError.message);
                }

                const clientSerial = clientData?.serial_number || null;
                onboardingData.clientSerial = clientSerial;

                // Client profile questionnaire will be saved to client_profiles table in Step 5
                // This ensures all users (authenticated and new) have their profile data saved

                onboardingData.userId = authData.user.id;
                onboardingData.signupCompleted = true; // Mark that user completed signup (for back button logic)

                // Continue to Step 5 (project confirmation)
                goToStep(5);

                step4NextBtn.disabled = false;
                step4NextBtn.textContent = 'Create Account & Send Email';

            } catch (error) {
                console.error('[Onboarding] Signup error:', error);
                window.showAlertModal('Signup failed: ' + error.message);
                step4NextBtn.disabled = false;
                step4NextBtn.textContent = 'Create Account & Send Email';
            }
        });
    }
}

function setupStep5Handler(onboardingData, saveLocalData) {
    // ====== STEP 5: Project confirmation - load matches and go to Step 6 ======
    const step5NextBtn = document.getElementById('step-5-next');
    if (step5NextBtn) {
        step5NextBtn.addEventListener('click', async () => {
            try {
                step5NextBtn.disabled = true;
                step5NextBtn.textContent = 'Saving your profile...';

                // VALIDATION: Check that travel_preference and urgency are selected
                const travelPrefSelected = document.querySelector('input[name="travel_preference"]:checked');
                const urgencySelected = document.querySelector('input[name="urgency"]:checked');
                
                if (!travelPrefSelected) {
                    window.showAlertModal('Please select a travel preference (In-Person, House Calls, Virtual, or Flexible)');
                    step5NextBtn.disabled = false;
                    step5NextBtn.textContent = 'Find my matches';
                    return;
                }
                
                if (!urgencySelected) {
                    window.showAlertModal('Please select your urgency level');
                    step5NextBtn.disabled = false;
                    step5NextBtn.textContent = 'Find my matches';
                    return;
                }

                // ========== STEP 1: SAVE CLIENT PROFILE FIRST ==========
                
                // First, try to restore from localStorage if not in memory
                if (!onboardingData.clientProfile) {
                    const stored = JSON.parse(localStorage.getItem('rooted-onboarding-data') || '{}');
                    onboardingData.clientProfile = stored.clientProfile;
                }
                
                let profileSaveSucceeded = false;
                if (onboardingData.userId) {
                    
                    // Only save if we have actual profile data
                    if (onboardingData.clientProfile && Object.keys(onboardingData.clientProfile).length > 0) {
                        // Build profile data - use what we have, or null if not provided
                        const profileData = {
                            user_id: onboardingData.userId,
                            serial_number: onboardingData.clientSerial || null,
                            main_wellness_goal: onboardingData.clientProfile?.wellnessGoals || null,
                            duration_of_issue: onboardingData.clientProfile?.duration || null,
                            what_tried_before: onboardingData.clientProfile?.triedBefore || null,
                            allergies_sensitivities: onboardingData.clientProfile?.allergies || null,
                            current_medications_supplements: onboardingData.clientProfile?.medications || null,
                            typical_day_description: onboardingData.clientProfile?.dailyLife || null,
                            communication_preference: onboardingData.clientProfile?.communicationPref || null,
                            biggest_barrier_to_healing: onboardingData.clientProfile?.barriers || null,
                            prior_practitioner_experience: onboardingData.clientProfile?.practitionerExp || null,
                            desired_success_outcome: onboardingData.clientProfile?.desiredOutcomes || null,
                            created_at: new Date().toISOString()
                        };
                        
                        try {
                            const { data: profileInsertData, error: profileError } = await window.supabaseClient
                                .from('client_profiles')
                                .insert(profileData)
                                .select();

                            if (profileError) {
                                console.error('[Onboarding] Client profile insert error:', profileError);
                                // CONTINUE ANYWAY - do not throw, we want to save project even if profile fails
                            } else {
                                profileSaveSucceeded = true;
                            }
                        } catch (err) {
                            console.error('[Onboarding] Exception during profile insert:', err);
                            // CONTINUE ANYWAY
                        }
                    } else {
                        console.warn('[Onboarding] No actual client profile data to save');
                    }
                } else {
                    console.warn('[Onboarding] No userId found in onboardingData');
                }

                // ========== STEP 2: NOW CREATE PROJECT ==========
                step5NextBtn.textContent = 'Creating your project...';

                // Get category name
                let categoryName = '';
                // Use global if available, otherwise use cache
                const data = (typeof taxonomyData !== 'undefined' && Object.keys(taxonomyData).length > 0) 
                    ? taxonomyData 
                    : onboardingTaxonomyCache;
                if (onboardingData.category) {
                    const categoryObj = data ? data[onboardingData.category] : null;
                    categoryName = categoryObj ? categoryObj.name : onboardingData.category;
                }

                // Format subcategory - can be array or string
                let subcategoryStr = '';
                if (onboardingData.subcategory) {
                    if (Array.isArray(onboardingData.subcategory)) {
                        subcategoryStr = onboardingData.subcategory.join(', ');
                    } else {
                        subcategoryStr = onboardingData.subcategory;
                    }
                }

                // Get raw values from form
                let travelPref = document.querySelector('input[name="travel_preference"]:checked')?.value || onboardingData.travel_preference;
                let urgency = document.querySelector('input[name="urgency"]:checked')?.value || onboardingData.urgency;

                // Validate travel_preference is one of the allowed values
                const validTravelPrefs = ['in-person', 'housecalls', 'virtual', 'flexible'];
                if (travelPref && !validTravelPrefs.includes(travelPref)) {
                    console.warn('[Onboarding] Invalid travel_preference:', travelPref);
                    travelPref = null;
                }

                // Validate urgency is one of the allowed values
                const validUrgencies = ['browsing', 'interested', 'urgent'];
                if (urgency && !validUrgencies.includes(urgency)) {
                    console.warn('[Onboarding] Invalid urgency:', urgency);
                    urgency = null;
                }

                // Build the project insert object
                const projectInsertData = {
                    client_id: onboardingData.userId,
                    client_serial: onboardingData.clientSerial,
                    category_id: (data && onboardingData.category) ? data[onboardingData.category]?.category_id : null,
                    category_name: categoryName || null,
                    subcategory_name: subcategoryStr || null,
                    description: onboardingData.description || onboardingData.symptoms || '',
                    zipcode: onboardingData.zipcode || null,
                    city: onboardingData.city || null,
                    state: onboardingData.state || null,
                    street: onboardingData.street || null,
                    travel_preference: travelPref || null,
                    urgency: urgency,
                    client_first_name: onboardingData.firstName || null,
                    client_last_name: onboardingData.lastName || null
                };

                // Create project with ALL required fields
                const insertObject = {
                    ...projectInsertData,
                    project_status: 'pending',
                    start_date: new Date().toISOString().split('T')[0]
                };

                // Create project with ALL required fields
                const { data: projectData, error: projectError } = await window.supabaseClient
                    .from('projects')
                    .insert([insertObject])
                    .select();

                if (projectError) {
                    console.error('[Onboarding] Project insert error:', projectError);
                    throw projectError;
                }

                onboardingData.projectId = projectData[0].id;
                
                // Save projectId to window and localStorage immediately
                window.currentOnboardingData = onboardingData;
                localStorage.setItem('rooted-onboarding-data', JSON.stringify(onboardingData));
                console.log('[Onboarding Step 5] Project created with ID:', onboardingData.projectId);

                // ========== STEP 3: LOAD MATCHES ==========
                step5NextBtn.textContent = 'Finding matches...';

                // Load and show matches before going to Step 6
                await loadMatchesForOnboarding(onboardingData);
                
                goToStep(6);
                
                step5NextBtn.disabled = false;
                step5NextBtn.textContent = 'Find my matches';
            } catch (error) {
                console.error('[Onboarding] CRITICAL ERROR in Step 5:', error);
                const msg = 'Error: ' + (error?.message || 'Unknown error');
                if (typeof window.showAlertModal === 'function') {
                    window.showAlertModal(msg);
                } else {
                    alert(msg);
                }
                step5NextBtn.disabled = false;
                step5NextBtn.textContent = 'Find my matches';
            }
        });
    }
}

function setupStep6Handler(onboardingData) {
    document.getElementById('save-for-later-btn')?.addEventListener('click', () => {
        closeOnboardingModal();
        window.showAlertModal('Your project has been created. Explore practitioners anytime from your dashboard.');
        setTimeout(() => {
            window.location.href = '/rooted-vitality/dashboard/client/pages/client-profile.html';
        }, 500);
    });

    document.getElementById('continue-browsing-btn')?.addEventListener('click', () => {
        closeOnboardingModal();
        // Use window.currentOnboardingData to get the latest projectId that was set in Step 5
        const projectId = window.currentOnboardingData?.projectId || onboardingData.projectId;
        console.log('[Onboarding Step 6] Continue browsing clicked');
        console.log('[Onboarding Step 6] window.currentOnboardingData:', window.currentOnboardingData);
        console.log('[Onboarding Step 6] onboardingData:', onboardingData);
        console.log('[Onboarding Step 6] projectId:', projectId);
        
        if (!projectId) {
            console.error('[Onboarding] No project ID available');
            window.showAlertModal('Error: Could not retrieve project ID. Please try again.');
            return;
        }
        const url = `/rooted-vitality/dashboard/client/pages/find-practitioners.html?project_id=${projectId}`;
        console.log('[Onboarding Step 6] Navigating to:', url);
        window.location.href = url;
    });
}

// ======================================================
// 4. CHARACTER COUNTERS & INPUT HELPERS
// ======================================================

function setupCharacterCounters() {
    const guidedSymptomsTextarea = document.getElementById('guided-symptoms');
    if (guidedSymptomsTextarea) {
        guidedSymptomsTextarea.addEventListener('input', (e) => {
            const count = e.target.value.length;
            const countDisplay = document.getElementById('guided-symptoms-count');
            if (countDisplay) countDisplay.textContent = count;
        });
    }

    const directDescriptionTextarea = document.getElementById('onboarding-description-direct');
    if (directDescriptionTextarea) {
        directDescriptionTextarea.addEventListener('input', (e) => {
            const count = e.target.value.length;
            const countDisplay = document.getElementById('onboarding-char-count');
            if (countDisplay) countDisplay.textContent = count;
        });
    }
}

function setupPasswordToggles(modal) {
    const passwordToggles = modal.querySelectorAll('.password-toggle');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            const input = toggle.parentElement.querySelector('input[type="password"], input[type="text"]');
            if (input) {
                const isPassword = input.type === 'password';
                input.type = isPassword ? 'text' : 'password';
            }
        });
    });
}

//======================================================
// 5. MODAL CLOSE & NAVIGATION
//======================================================

function closeOnboardingModal() {
    const modal = document.getElementById('guided-onboarding-modal');
    if (modal) {
        modal.style.animation = 'slideOut 0.3s ease-out forwards';
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

/**
 * Populate Step 5 display with user's previously entered data
 * Called when navigating to Step 5 to show confirmation of details
 */
function populateStep5Display(onboardingData) {
    console.log('[onboardingUI] Populating Step 5 display with data:', onboardingData);
    
    // Populate category
    const categorySpan = document.getElementById('confirm-category');
    if (categorySpan && onboardingData.category) {
        // Get category name from taxonomy
        const data = (typeof taxonomyData !== 'undefined' && Object.keys(taxonomyData).length > 0) 
            ? taxonomyData 
            : onboardingTaxonomyCache;
        const categoryObj = data ? data[onboardingData.category] : null;
        const categoryName = categoryObj ? categoryObj.name : onboardingData.category;
        categorySpan.textContent = categoryName;
    }
    
    // Populate subcategory
    const subcategorySpan = document.getElementById('confirm-subcategory');
    if (subcategorySpan) {
        if (onboardingData.subcategory) {
            if (Array.isArray(onboardingData.subcategory)) {
                subcategorySpan.textContent = onboardingData.subcategory.join(', ');
            } else {
                subcategorySpan.textContent = onboardingData.subcategory;
            }
        } else {
            subcategorySpan.textContent = '(Not specified)';
        }
    }
    
    // Populate zipcode
    const zipcodeSpan = document.getElementById('confirm-zipcode');
    if (zipcodeSpan) {
        zipcodeSpan.textContent = onboardingData.zipcode || 'Not provided';
    }
    
    // Populate travel preference
    const travelSpan = document.getElementById('confirm-travel');
    if (travelSpan) {
        const travelValue = document.querySelector('input[name="travel_preference"]:checked')?.value || onboardingData.travel_preference;
        const travelLabels = {
            'in-person': 'In-Person',
            'housecalls': 'House Calls',
            'virtual': 'Virtual',
            'flexible': 'Flexible'
        };
        travelSpan.textContent = travelLabels[travelValue] || 'Not specified';
    }
    
    // Populate urgency
    const urgencySpan = document.getElementById('confirm-urgency');
    if (urgencySpan) {
        const urgencyValue = document.querySelector('input[name="urgency"]:checked')?.value || onboardingData.urgency;
        const urgencyLabels = {
            'browsing': 'Just browsing',
            'interested': 'Interested',
            'urgent': 'Urgent'
        };
        urgencySpan.textContent = urgencyLabels[urgencyValue] || 'Not specified';
    }
}

//======================================================
// 6. CATEGORY PICKER UI
//======================================================

/**
 * Setup category picker with search and subcategories for Step 1b
 * Renders interactive category cards with descriptions and subcategory checkboxes
 * Features: Category search, descriptions, subcategory multi-select with full descriptions
 */
function setupCategoryPickerForStep1b() {
    const searchInput = document.getElementById('guided-category-search');
    const categoriesList = document.getElementById('guided-categories-list');
    const subcategoriesGroup = document.getElementById('guided-subcategories-group');
    const subcategoriesList = document.getElementById('guided-subcategories-list');
    const categorySelected = document.getElementById('guided-category-selected');
    
    if (!searchInput) return; // Step 1b not visible yet

    // Soft spiritual descriptions for each category
    const categoryDescriptions = {
        // Lowercase underscore versions (legacy)
        'acupuncture': 'Let needles whisper to your energy',
        'chiropractic': 'Align your spine, align your life',
        'naturopathy': 'Ancient plant wisdom for modern souls',
        'nutrition': 'Nourish the temple that holds you',
        'wellness_coaching': 'Your partner in transformation',
        'personal_training': 'Strengthen what\'s within and without',
        'yoga': 'Find your breath, find your flow',
        'meditation': 'Quiet the noise, hear yourself',
        'mental_health': 'Heal what your heart has been carrying',
        'energy_healing': 'Realign what feels scattered',
        'herbalism': 'Nature\'s medicine for your body',
        'ayurveda': 'Balance your unique constitution',
        'homeopathy': 'Like heals like, always gently',
        'functional_medicine': 'Find the root, heal the whole',
        'physical_therapy': 'Restore movement, restore freedom',
        'aromatherapy': 'Scent as medicine, feeling as healer',
        'life_coaching': 'Rewrite your story, reclaim your power',
        'hypnotherapy': 'Unlock what your subconscious knows',
        'midwifery': 'Ancient wisdom meets modern care',
        'reflexology': 'Every pressure point holds a story',
        'osteopathy': 'The body knows how to heal',
        'massage': 'Let your body release what it\'s holding',
        // Full category names (matching database)
        'Acupuncture & TCM': 'Let needles whisper to your energy',
        'Chiropractic Care': 'Align your spine, align your life',
        'Naturopathic Medicine': 'Ancient plant wisdom for modern souls',
        'Nutrition & Dietetics': 'Nourish the temple that holds you',
        'Wellness Coaching': 'Your partner in transformation',
        'Personal Training': 'Strengthen what\'s within and without',
        'Yoga': 'Find your breath, find your flow',
        'Meditation': 'Quiet the noise, hear yourself',
        'Mental Health & Counseling': 'Heal what your heart has been carrying',
        'Energy Healing': 'Realign what feels scattered',
        'Herbalism': 'Nature\'s medicine for your body',
        'Ayurveda': 'Balance your unique constitution',
        'Homeopathy': 'Like heals like, always gently',
        'Functional Medicine': 'Find the root, heal the whole',
        'Physical Therapy': 'Restore movement, restore freedom',
        'Aromatherapy': 'Scent as medicine, feeling as healer',
        'Life Coaching': 'Rewrite your story, reclaim your power',
        'Hypnotherapy': 'Unlock what your subconscious knows',
        'Midwifery & Doula Services': 'Ancient wisdom meets modern care',
        'Reflexology': 'Every pressure point holds a story',
        'Osteopathy': 'The body knows how to heal',
        'Massage': 'Let your body release what it\'s holding'
    };

    // Comprehensive subcategory descriptions across all categories
    const subcategoryDescriptions = {
        // Massage Therapy
        'Swedish Massage': 'Gentle pressure for relaxation and stress relief',
        'Deep Tissue Massage': 'Strong pressure to release chronic muscle tension',
        'Sports Massage': 'Targeted work to enhance athletic performance and recovery',
        'Trigger Point Therapy': 'Precise techniques for localized pain relief',
        'Prenatal/Pregnancy Massage': 'Gentle, safe massage for expecting mothers',
        'Hot Stone Massage': 'Heated stones to deepen relaxation and improve circulation',
        'Thai Massage': 'Energizing pressure and stretching for flexibility and flow',
        'Shiatsu': 'Japanese finger pressure following your body\'s energy meridians',
        'Reflexology': 'Therapeutic pressure on feet and hands to balance whole body',
        'Lymphatic Drainage': 'Gentle technique to support immune function and detoxification',
        'Myofascial Release': 'Deep work on connective tissues to restore mobility',
        'Craniosacral Therapy': 'Light touch addressing headaches and TMJ tension',
        'Chair Massage': 'Quick, clothed massage perfect for workplace and events',
        'Cupping Therapy': 'Traditional technique using suction for pain and tension',
        'Aromatherapy Massage': 'Massage combined with essential oils for deeper healing',
        'Medical Massage': 'Therapeutic treatment for injury rehab and chronic conditions',
        'Geriatric Massage': 'Gentle, specialized massage for elderly clients',
        'Oncology Massage': 'Compassionate care tailored for cancer patients',
        'Ashiatsu': 'Deep barefoot massage for profound pressure and relief',
        'Reiki + Massage': 'Energy work combined with traditional massage techniques',
        'Lomi Lomi': 'Hawaiian spiritual massage blending healing and ceremony',
        'Tui Na': 'Chinese medical massage using specific techniques and points',
        'Acupressure': 'Finger pressure on TCM meridian points without needles',
        'Assisted Stretching': 'Guided flexibility work to enhance mobility and range of motion',
        
        // Acupuncture & TCM
        'Pain Management': 'Needle therapy for chronic and acute pain relief',
        'Fertility Support': 'Traditional approach to support conception and IVF',
        'Women\'s Health': 'Specialized care for menstrual, menopause, and hormonal issues',
        'Stress & Anxiety Relief': 'Calming treatments to settle nervous system',
        'Digestive Issues': 'Targeted points to address IBS, bloating, and nausea',
        'Insomnia & Sleep Disorders': 'Gentle approach to restore natural sleep',
        'Headaches & Migraines': 'Effective needle placement for headache relief',
        'Allergies & Sinus Issues': 'Natural support for seasonal and chronic allergies',
        'Autoimmune Support': 'Immune-balancing approach for autoimmune conditions',
        'Weight Management': 'Metabolism support combined with lifestyle guidance',
        'Smoking Cessation': 'Ear and body points to ease your path to freedom',
        'Sports Injury Recovery': 'Quick return to activity with targeted treatment',
        'Facial Acupuncture': 'Natural rejuvenation without needles or injections',
        'Cupping Therapy': 'Traditional suction technique for muscle tension and pain',
        'Electroacupuncture': 'Enhanced needle therapy with gentle electrical stimulation',
        'Moxibustion': 'Warming herb therapy to restore circulation and energy',
        'Gua Sha': 'Scraping technique to release tension and improve flow',
        'Chinese Herbal Medicine': 'Custom formulas targeting your specific imbalances',
        'Auricular Acupuncture': 'Ear points that reflect and heal the whole body',
        'Pediatric Acupuncture': 'Gentle techniques safe and effective for children',
        
        // Chiropractic Care
        'Spinal Adjustment': 'Manual manipulation to restore spine alignment',
        'Subluxation Correction': 'Precise adjustments to remove nerve interference',
        'Extremity Adjustment': 'Alignment work for shoulders, knees, ankles, and more',
        'Diversified Technique': 'Comprehensive manual adjustment approach',
        'Gonstead Method': 'Specific analysis and precise corrections',
        'Activator Method': 'Gentle instrument-assisted adjustments',
        'Thompson Technique': 'Drop-table method for precise, comfortable adjustments',
        'Corrective Exercise': 'Personalized movements to support lasting alignment',
        'Posture Correction': 'Training to maintain healthy spinal curves',
        'Ergonomic Counseling': 'Workspace and lifestyle optimization for spine health',
        'Pediatric Chiropractic': 'Gentle care for growing bodies',
        'Prenatal Chiropractic': 'Safe care supporting pregnancy wellness',
        'Sports Injury Care': 'Quick recovery protocols for athletic injuries',
        'Auto Injury Treatment': 'Specialized whiplash and trauma recovery',
        'Work Injury Rehab': 'Functional recovery for occupational injuries',
        'Headache & Migraine Relief': 'Addressing root causes of head pain',
        'Vertigo & Dizziness': 'Techniques to restore balance and equilibrium',
        'Sciatica Treatment': 'Relief from nerve pain and leg symptoms',
        'Arthritis Management': 'Supportive care for joint degeneration',
        'Wellness Maintenance': 'Ongoing care to prevent future problems',
        
        // Naturopathic Medicine
        'Primary Care': 'Preventive, whole-person approach to general health',
        'Digestive Health': 'Healing IBS, SIBO, and chronic gut issues',
        'Hormone Balance': 'Natural support for thyroid, adrenal, and sex hormones',
        'Autoimmune Conditions': 'Root-cause approach to immune system dysregulation',
        'Chronic Fatigue & Fibromyalgia': 'Comprehensive protocols to restore energy',
        'Diabetes Management': 'Natural support for blood sugar and metabolic health',
        'Cardiovascular Health': 'Heart-centered approach to circulatory wellness',
        'Women\'s Health': 'Specialized care for menstrual, fertility, and hormonal needs',
        'Men\'s Health': 'Testosterone, prostate, and masculine vitality support',
        'Pediatric Naturopathy': 'Gentle, natural care for children and teens',
        'Mental Health Support': 'Natural approaches to anxiety, depression, and mood',
        'Allergy & Asthma Management': 'Root-cause resolution of respiratory issues',
        'Detoxification Programs': 'Supported cleansing to remove accumulated toxins',
        'Weight Management': 'Metabolic support for sustainable weight loss',
        'Pain Management': 'Natural pain relief without dependency',
        'Cancer Support': 'Complementary care alongside conventional treatment',
        'Chronic Disease Management': 'Long-term naturopathic support for complex conditions',
        'Lab Testing & Interpretation': 'Advanced testing to identify root causes',
        'IV Nutrient Therapy': 'Direct nutrient delivery for maximum absorption',
        'Homeopathy': 'Gentle energetic medicine addressing whole person',
        'Botanical Medicine': 'Custom herbal formulas for your unique needs',
        'Lifestyle Counseling': 'Sustainable changes for lasting health transformation',
        'Mind-Body Medicine': 'Integration of emotional and physical healing',
        
        // Nutrition & Dietetics
        'Weight Loss & Management': 'Sustainable approaches to healthy weight',
        'Sports Nutrition': 'Performance-enhancing nutrition for athletes',
        'Plant-Based/Vegan Nutrition': 'Complete, thriving on plant foods',
        'Gut Health & Digestive Issues': 'Healing your digestive system from within',
        'Food Allergies & Sensitivities': 'Identification and elimination of problematic foods',
        'Diabetes Management': 'Blood sugar balance through nutritional support',
        'Heart Health': 'Cholesterol and blood pressure management through food',
        'Autoimmune Nutrition Protocol': 'Anti-inflammatory eating to calm immune system',
        'Hormone Balance Nutrition': 'Foods and timing to support hormonal health',
        'Fertility Nutrition': 'Nutrient-dense eating to support conception',
        'Prenatal & Postnatal Nutrition': 'Nourishment for pregnancy and postpartum recovery',
        'Pediatric Nutrition': 'Optimal nutrition for growing children',
        'Eating Disorder Recovery': 'Compassionate nutrition support for healing',
        'Anti-Inflammatory Diet': 'Food choices to reduce pain and inflammation',
        'Ketogenic Diet Coaching': 'Guidance for metabolic health through low-carb eating',
        'Mediterranean Diet': 'Heart-healthy eating inspired by coastal cultures',
        'Meal Planning & Prep': 'Practical guidance for sustainable healthy eating',
        'Supplement Recommendations': 'Personalized supplement protocols for your needs',
        'Nutrigenomics': 'Genetic-based nutrition tailored to your DNA',
        'Corporate Wellness Programs': 'Nutrition education for workplace health',
        
        // Yoga
        'Hatha Yoga': 'Foundational yoga accessible to all levels',
        'Vinyasa/Flow Yoga': 'Dynamic, breath-synchronized movement and flow',
        'Ashtanga Yoga': 'Structured, athletic practice with set sequences',
        'Iyengar Yoga': 'Precise alignment using props and modifications',
        'Bikram/Hot Yoga': 'Practice in heated room with benefits of warmth',
        'Power Yoga': 'Fitness-focused, strength-building yoga',
        'Yin Yoga': 'Deep stretches held passively for profound release',
        'Restorative Yoga': 'Supported relaxation and nervous system reset',
        'Kundalini Yoga': 'Breath, energy, and spiritual awakening practices',
        'Prenatal Yoga': 'Pregnancy-safe poses and preparation for birth',
        'Postnatal Yoga': 'Gentle recovery and core rebuilding after birth',
        'Chair Yoga': 'Accessible seated practice for all ages and abilities',
        'Yoga for Seniors': 'Gentle practice honoring aging bodies',
        'Yoga for Athletes': 'Flexibility and recovery for sports performance',
        'Yoga for Back Pain': 'Poses to strengthen and heal your back',
        'Yoga for Stress/Anxiety': 'Calming practice to ease nervous system',
        'Yoga Nidra': 'Guided yogic sleep for deep rest and restoration',
        'Therapeutic Yoga': 'Therapeutic approach to injury recovery',
        'Meditation Instruction': 'Seated meditation taught within yoga context',
        'Breathwork/Pranayama': 'Pranayama techniques to control life force energy',
        'Private Yoga Sessions': 'One-on-one personalized instruction',
        'Corporate/Workplace Yoga': 'Yoga brought to workplace for wellness',
        'Outdoor/Nature Yoga': 'Practice in nature for grounding connection',
        
        // Meditation & Mindfulness
        'Mindfulness Meditation': 'Present-moment awareness and observation practice',
        'Transcendental Meditation': 'TM technique using personal mantra',
        'Loving-Kindness Meditation': 'Metta practice cultivating compassion',
        'Body Scan Meditation': 'Systematic awareness of physical sensations',
        'Guided Visualization': 'Imagery-based meditation for specific outcomes',
        'Breathwork Practices': 'Conscious breathing to shift nervous system',
        'Stress Reduction': 'MBSR and mindfulness for anxiety release',
        'Anxiety Management': 'Meditation techniques specifically for anxiety',
        'Sleep Meditation': 'Guided practices to transition into restful sleep',
        'Walking Meditation': 'Mindful movement combining walking and awareness',
        'Sound Meditation': 'Singing bowls, gongs, and vibrational sound healing',
        'Mantra Meditation': 'Repetition of sacred sounds or affirmations',
        'Chakra Meditation': 'Energy center activation and alignment',
        'Corporate Mindfulness Programs': 'Meditation brought to workplace culture',
        'Meditation for Beginners': 'Gentle introduction to meditation practice',
        'Advanced Meditation Practice': 'Deepening practice for experienced meditators',
        'Meditation Retreats': 'Immersive multi-day or weekend meditation experiences',
        'Online/Virtual Sessions': 'Meditation guidance through digital connection',
        'Group Meditation Classes': 'Community meditation for shared consciousness',
        'One-on-One Instruction': 'Personal meditation guidance and coaching',
        
        // Mental Health Counseling & Therapy
        'Individual Therapy/Counseling': 'One-on-one talk therapy for personal healing',
        'Couples Therapy': 'Relational work to strengthen partnership',
        'Family Therapy': 'Systemic approach to family dynamics and healing',
        'Grief & Loss Counseling': 'Support navigating death and major losses',
        'Trauma Therapy (PTSD, EMDR)': 'Specialized trauma processing and recovery',
        'Anxiety Disorders': 'Targeted treatment for anxiety conditions',
        'Depression Treatment': 'Therapy addressing mood disorders',
        'Stress Management': 'Practical tools for stress resilience',
        'Life Transitions': 'Support navigating career, relationship, or life changes',
        'Relationship Issues': 'Communication and connection work',
        'Addiction/Substance Abuse Counseling': 'Compassionate path to recovery and sobriety',
        'Eating Disorder Treatment': 'Healing relationship with food and body',
        'LGBTQ+ Affirming Therapy': 'Safe space honoring all identities and expressions',
        'Child & Adolescent Therapy': 'Age-appropriate support for young people',
        'Career Counseling': 'Guidance for career exploration and transitions',
        'Cognitive Behavioral Therapy (CBT)': 'Evidence-based approach changing thought patterns',
        'Dialectical Behavior Therapy (DBT)': 'Skills-based therapy for emotional regulation',
        'Psychodynamic Therapy': 'Exploring unconscious patterns and their roots',
        'Mindfulness-Based Therapy': 'Integration of mindfulness with therapeutic work',
        'Somatic Therapy': 'Healing through the body and nervous system',
        'Art Therapy': 'Creative expression as path to healing',
        'Play Therapy': 'Age-appropriate therapy through play for children',
        'Teletherapy/Online Counseling': 'Therapy accessible from your home',
        
        // Energy Healing & Bodywork
        'Reiki (Level I, II, III/Master)': 'Universal life force energy channeling and healing',
        'Healing Touch': 'Energy work to balance and restore wellness',
        'Pranic Healing': 'Energy manipulation for physical and emotional healing',
        'Quantum Touch': 'Advanced energy healing raising vibrational frequency',
        'Chakra Balancing': 'Alignment of energy centers for wholeness',
        'Aura Cleansing': 'Clearing and revitalizing your energy field',
        'Crystal Healing': 'Therapeutic use of stones and crystals',
        'Sound Healing': 'Vibrational medicine through singing bowls and tuning forks',
        'Shamanic Healing': 'Ancient practices for spiritual and physical healing',
        'Energy Assessment/Reading': 'Intuitive assessment of your energetic state',
        'Biofield Tuning': 'Calibration of your biofield for coherence',
        'Polarity Therapy': 'Energy balancing addressing opposing forces',
        'Therapeutic Touch': 'Hands-off energy work for relaxation and healing',
        'Jin Shin Jyutsu': 'Japanese energy pathway activation',
        'Distance/Remote Healing': 'Energy work sent across any distance',
        'Integrated Energy Therapy (IET)': 'Cellular memory clearing and integration',
        'Light Therapy': 'Healing through color and light frequencies',
        
        // Herbalism & Botanical Medicine
        'Western Herbalism': 'Plant medicine in Western tradition and practice',
        'Traditional Chinese Herbal Medicine': 'Herbs used in Chinese medicine philosophy',
        'Ayurvedic Herbalism': 'Medicinal plants in Ayurvedic tradition',
        'Clinical Herbalism': 'Evidence-based approach to herbal medicine',
        'Custom Herbal Formulas': 'Personalized herbal blends for your needs',
        'Tincture Creation': 'Concentrated herbal extracts for potency',
        'Herbal Teas & Infusions': 'Gentle, nourishing herbal preparations',
        'Topical Herbal Preparations': 'Salves, oils, and creams for external use',
        'Digestive Health Herbs': 'Plant medicine to heal and restore digestion',
        'Immune Support Herbs': 'Strengthening herbs for immune resilience',
        'Hormonal Balance Herbs': 'Plant medicine to support hormonal harmony',
        'Sleep & Relaxation Herbs': 'Calming plants to promote rest',
        'Pain Management Herbs': 'Natural pain relief through botanical wisdom',
        'Women\'s Health Herbs': 'Plants supporting menstrual, fertility, and menopausal health',
        'Men\'s Health Herbs': 'Herbs supporting masculine vitality and prostate health',
        'Children\'s Herbalism': 'Safe, gentle herbal care for young ones',
        'Herbal Consultations': 'Personal guidance on medicinal plants',
        'Herb-Drug Interaction Counseling': 'Safety information about herb and medication interactions',
        'Wildcrafting & Plant Identification': 'Sustainable harvesting and identification of wild plants',
        'Herbal Education Workshops': 'Teaching others the art and science of herbalism',
        
        // Ayurveda
        'Dosha Assessment': 'Understanding your unique constitution',
        'Personalized Diet Plans': 'Food choices aligned with your dosha',
        'Ayurvedic Herbal Consultations': 'Custom herbal recommendations',
        'Panchakarma Detox': 'Intensive cleansing and rejuvenation therapy',
        'Ayurvedic Massage (Abhyanga)': 'Oil massage for balance and rejuvenation',
        'Shirodhara': 'Therapeutic oil stream for deep relaxation',
        'Ayurvedic Lifestyle Counseling': 'Daily practices aligned with your nature',
        'Digestive Health (Agni optimization)': 'Strengthening digestive fire',
        'Seasonal Cleansing': 'Seasonal practices for transitions and balance',
        'Women\'s Health Ayurveda': 'Ayurvedic support for women\'s unique needs',
        'Men\'s Health Ayurveda': 'Ayurvedic support for men\'s vitality',
        'Stress & Anxiety Management': 'Ayurvedic protocols for nervous system',
        'Sleep Optimization': 'Ayurvedic practices for restorative sleep',
        'Skin Health Treatments': 'Ayurvedic approaches to radiant skin',
        'Chronic Disease Management': 'Long-term Ayurvedic care for complex conditions',
        'Ayurvedic Cooking Classes': 'Learning to cook according to Ayurvedic principles',
        'Marma Therapy': 'Energy point work in Ayurvedic tradition',
        
        // Homeopathy
        'Classical Homeopathy': 'Traditional single-remedy homeopathic approach',
        'Constitutional Remedies': 'Deep healing addressing your overall constitution',
        'Acute Condition Treatment': 'Quick remedy selection for current symptoms',
        'Chronic Disease Management': 'Long-term remedy support for underlying patterns',
        'Allergy Treatment': 'Homeopathic support for allergic conditions',
        'Digestive Issues': 'Remedies for stomach, digestion, and elimination',
        'Anxiety & Depression': 'Gentle emotional support through remedies',
        'Insomnia Treatment': 'Natural sleep support through homeopathy',
        'Children\'s Homeopathy': 'Safe, gentle remedies for young children',
        'Women\'s Health': 'Homeopathic support for menstrual and menopausal issues',
        'Skin Conditions': 'Remedy approach to eczema, psoriasis, and rashes',
        'Respiratory Issues': 'Support for cough, asthma, and breathing',
        'Injury & Trauma Support': 'Remedies to support acute injuries and shock',
        'Remedy Selection Consultation': 'Professional guidance choosing the right remedy',
        'Combination Remedies': 'Pre-made combinations for common conditions',
        'Cell Salts (Tissue Salts)': 'Mineral remedies for cellular health',
        
        // Functional Medicine
        'Root Cause Analysis': 'Finding and addressing underlying causes of disease',
        'Comprehensive Lab Testing': 'Advanced testing revealing hidden imbalances',
        'Gut Health & Microbiome': 'Healing the foundation of health',
        'Hormone Optimization': 'Balancing hormones for vitality',
        'Autoimmune Management': 'Addressing immune system dysregulation',
        'Thyroid Disorders': 'Comprehensive thyroid support and optimization',
        'Adrenal Health': 'Restoring energy and stress resilience',
        'Chronic Fatigue': 'Functional approach to exhaustion',
        'Fibromyalgia': 'Multi-system approach to pain and fatigue',
        'Metabolic Syndrome': 'Addressing insulin resistance and metabolic health',
        'Diabetes Reversal': 'Functional protocols for diabetes recovery',
        'Cardiovascular Health': 'Root-cause approach to heart disease prevention',
        'Brain Health & Cognitive Function': 'Optimizing memory and mental clarity',
        'Detoxification Protocols': 'Supported removal of accumulated toxins',
        'Nutrient Deficiency Correction': 'Repletion of depleted nutrients',
        'Food Sensitivity Testing': 'Identifying problematic foods precisely',
        'Genetic Testing & Analysis': 'DNA-informed personalized medicine',
        'Peptide Therapy': 'Advanced bioregulatory peptide support',
        'IV Nutrient Therapy': 'Direct nutrient delivery for optimal absorption',
        'Bioidentical Hormone Replacement': 'Natural hormone support when needed',
        
        // Physical Therapy
        'Manual Therapy': 'Hands-on treatment for mobility and pain',
        'Therapeutic Exercise': 'Specific movements for healing and strengthening',
        'Post-Surgical Rehabilitation': 'Recovery protocols after surgery',
        'Sports Injury Recovery': 'Athletic injury rehabilitation and return to sport',
        'Stroke Recovery': 'Neurological rehabilitation after stroke',
        'Orthopedic Rehabilitation': 'Bone and joint injury recovery',
        'Neurological Rehabilitation': 'Nervous system recovery and adaptation',
        'Fall Prevention': 'Training to improve balance and prevent falls',
        'Gait Training': 'Walking pattern improvement and normalization',
        'Joint Mobilization': 'Restoring normal joint movement and function',
        'Soft Tissue Mobilization': 'Release of scar tissue and muscle tension',
        'Aquatic Therapy': 'Water-based therapy for healing and strengthening',
        'Electrotherapy': 'Therapeutic use of electrical current for healing',
        'Ultrasound Therapy': 'Sound wave therapy for tissue healing',
        'Ergonomic Assessment': 'Workplace optimization for prevention',
        'Pain Management': 'Comprehensive approach to chronic pain',
        'Balance & Vestibular Training': 'Inner ear and balance system rehabilitation',
        'Proprioceptive Training': 'Body awareness and coordination improvement',
        'Wound Care': 'Specialized treatment of difficult-to-heal wounds',
        'Pediatric Physical Therapy': 'Development-focused therapy for children',
        
        // Aromatherapy
        'Essential Oil Consultation': 'Guidance on selecting and using essential oils',
        'Diffusion Blending': 'Creating custom aromatic blends',
        'Topical Oil Application': 'Safe dilution and application of oils on skin',
        'Inhalation Therapy': 'Breathing in therapeutic aromatics',
        'Bath & Body Treatments': 'Oils incorporated into baths and body care',
        'Emotional Support Blends': 'Oils addressing emotional and mood states',
        'Pain Relief Blends': 'Aromatics supporting pain management',
        'Sleep Support': 'Calming scents to promote rest',
        'Immune Boost Blends': 'Oils to support immune function',
        'Stress Relief Aromatics': 'Scents that calm and center',
        'Chakra Aromatherapy': 'Oils aligned with energy centers',
        'Pregnancy-Safe Aromatherapy': 'Safe oils during pregnancy',
        'Children\'s Aromatherapy': 'Gentle, safe aromatics for kids',
        'Pet-Friendly Aromatherapy': 'Oils safe around animal companions',
        'Seasonal Blends': 'Aromatics rotating with seasons',
        'Cellular Healing Oils': 'Essential oils supporting cellular renewal',
        'Frankincense & Myrrh': 'Ancient sacred oils for spiritual practice',
        'Rose & Neroli': 'Heart-opening and uplifting florals',
        'Grounding & Centering Blends': 'Earthy oils for stability and presence',
        'Custom Formula Creation': 'Personal aromatherapy blends just for you',
        
        // Life Coaching
        'Career Transition Coaching': 'Navigating major career changes',
        'Relationship Coaching': 'Communication and connection skills',
        'Financial Wellness Coaching': 'Money mindset and financial goal setting',
        'Goal Setting & Achievement': 'Clear direction with accountability',
        'Confidence Building': 'Stepping into your power and potential',
        'Life Purpose Exploration': 'Finding meaning and direction',
        'Belief System Transformation': 'Shifting limiting beliefs',
        'Relationship to Self': 'Self-love and self-acceptance work',
        'Communication Skills': 'Healthy, authentic communication',
        'Boundary Setting': 'Creating healthy limits and saying no',
        'Stress & Overwhelm Management': 'Strategies for calm and clarity',
        'Time Management': 'Productivity and life balance optimization',
        'Health & Wellness Goals': 'Creating sustainable lifestyle changes',
        'Personal Development': 'Growth and evolution as a person',
        'Accountability Partnerships': 'Regular check-ins and support',
        'Vision Clarity': 'Visualizing and manifesting your dreams',
        'Authenticity Work': 'Living aligned with your true values',
        'Resilience Building': 'Bouncing back from challenges',
        'Leadership Development': 'Stepping into influence and leadership',
        'Life Balance Coaching': 'Integration of all life dimensions',
        
        // Hypnotherapy
        'Weight Loss Hypnosis': 'Subconscious reprogramming for healthy weight',
        'Smoking Cessation': 'Breaking free from tobacco addiction',
        'Anxiety Reduction': 'Subconscious calming for anxious mind',
        'Phobia Treatment': 'Releasing deep-seated fears safely',
        'Pain Management': 'Subconscious pain reduction and relief',
        'Sleep Issues': 'Programming the mind for restful sleep',
        'Stress Management': 'Deep relaxation and nervous system reset',
        'Confidence Building': 'Accessing your inner strength and capability',
        'Sports Performance': 'Mental training through hypnosis',
        'Past Life Regression': 'Exploring previous incarnations for insight',
        'Habit Change': 'Breaking unwanted habits at subconscious level',
        'Public Speaking Anxiety': 'Confidence for presentations and speaking',
        'Test Anxiety': 'Releasing exam-related stress',
        'Childbirth Hypnosis (HypnoBirthing)': 'Relaxed, natural birthing through hypnosis',
        'Trauma Resolution': 'Gentle processing of traumatic memories',
        'Addiction Support': 'Subconscious shift in addictive patterns',
        'Self-Esteem Enhancement': 'Building positive self-image',
        
        // Midwifery & Doula Services
        'Prenatal Care': 'Regular care through pregnancy',
        'Labor & Delivery Attendance': 'Presence and support during birth',
        'Postpartum Care': 'Recovery support after birth',
        'Breastfeeding Support': 'Lactation guidance and troubleshooting',
        'Newborn Care Education': 'Teaching care of your new baby',
        'Birth Plan Development': 'Creating your ideal birth experience',
        'Pain Management in Labor': 'Natural comfort measures during labor',
        'Home Birth Services': 'Safe, supported birth at home',
        'Hospital Birth Support': 'Advocacy within hospital settings',
        'Water Birth Facilitation': 'Support for birth in water',
        'Doula Support': 'Emotional and physical support person',
        'High-Risk Pregnancy Care': 'Specialized care for complicated pregnancies',
        'Miscarriage Care': 'Compassionate support during loss',
        'Birth Complications Support': 'Expert care during challenging births',
        'Placenta Services': 'Encapsulation, art, or burial options',
        'Postpartum Depression Support': 'Care for emotional challenges after birth',
        'Lactation Consulting': 'Professional breastfeeding support',
        'Infant Care Classes': 'Education on caring for newborns',
        'Partner Education': 'Preparing birthing partner',
        'Referral & Collaboration': 'Working with medical team when needed',
        
        // Reflexology
        'Foot Reflexology': 'Therapeutic pressure on reflex points of feet',
        'Hand Reflexology': 'Reflex work on hands for whole-body benefit',
        'Ear Reflexology': 'Auricular therapy addressing body systems',
        'Facial Reflexology': 'Gentle reflex work on the face',
        'Zone Therapy': 'Work within specific body zones',
        'Pain Management': 'Reflexology for chronic pain relief',
        'Stress Relief': 'Deep relaxation through foot pressure',
        'Organ System Support': 'Targeting specific organs and systems',
        'Digestive Support': 'Reflex work for digestive health',
        'Immune Boosting': 'Stimulation for immune system enhancement',
        'Fertility Support': 'Reflexology for conception support',
        'Pregnancy Reflexology': 'Safe, comfortable care during pregnancy',
        'Sports Recovery': 'Foot therapy for athletic performance',
        'Lymphatic Drainage': 'Supporting lymphatic circulation through reflex points',
        'Circulatory Support': 'Improving blood flow through reflexology',
        'Sleep Support': 'Relaxation inducing restful sleep',
        'Emotional Release': 'Reflexology for emotional processing',
        'Detoxification Support': 'Supporting body\'s natural cleansing',
        'Energy Balancing': 'Restoring vital life force',
        'Chakra Reflexology': 'Reflex points aligned with energy centers',
        
        // Osteopathy
        'Craniosacral Therapy': 'Gentle work on cranial and sacral systems',
        'Visceral Manipulation': 'Gentle work releasing organ restrictions',
        'Joint Mobilization': 'Restoring normal joint movement',
        'Soft Tissue Release': 'Manual release of muscle and fascia tension',
        'Lymphatic Drainage': 'Supporting lymphatic circulation',
        'Structural Alignment': 'Alignment work for proper posture',
        'Pediatric Osteopathy': 'Gentle care for children\'s structural health',
        'Prenatal Osteopathy': 'Supporting structural changes during pregnancy',
        'Labor Preparation': 'Pelvic and structural preparation for birth',
        'Postpartum Recovery': 'Recovery work after birth',
        'Headache & Migraine Relief': 'Addressing tension-related head pain',
        'Neck & Shoulder Pain': 'Releasing upper body tension',
        'Lower Back Pain': 'Addressing lumbar region dysfunction',
        'Sports Injury Recovery': 'Athletic injury healing and rehabilitation',
        'Chronic Pain Management': 'Long-term osteopathic care for pain',
        'Posture Correction': 'Structural training for better alignment',
        'Sinus Issues': 'Cranial work for sinus health',
        'Jaw & TMJ Disorders': 'Care for jaw misalignment and TMJ',
        'Whole-System Integration': 'Holistic approach to structural health',
        'Energy Flow Optimization': 'Supporting vital energy through structure',
        
        // Wellness Coaching
        'Lifestyle Change Coaching': 'Support for creating sustainable healthy habits',
        'Stress Management': 'Tools and practices to navigate daily pressures',
        'Weight Loss Coaching': 'Accountability and guidance for weight goals',
        'Fitness & Exercise Coaching': 'Motivation to move your body consistently',
        'Sleep Optimization': 'Natural approaches to better sleep quality',
        'Habit Formation': 'Strategic support for building new positive patterns',
        'Goal Setting & Accountability': 'Clear direction with regular check-ins',
        'Work-Life Balance': 'Integration of career and personal wellness',
        'Chronic Disease Management Support': 'Navigation of living with chronic conditions',
        'Nutrition Education': 'Knowledge to make informed food choices',
        'Mental Wellness Support': 'Emotional health and resilience building',
        'Corporate Wellness Coaching': 'Health transformation in workplace settings',
        'Health Behavior Change': 'Sustainable shifts in how you live',
        'Preventive Health': 'Proactive steps to maintain wellness',
        'Energy & Vitality Enhancement': 'Awakening your natural life force',
        'Mindfulness Practices': 'Presence and awareness in daily life',
        'Self-Care Strategies': 'Nurturing rituals for whole-person wellness',
        
        // Personal Training
        'Strength Training': 'Build muscle and bone density through resistance',
        'Weight Loss Programs': 'Fitness protocols designed for fat loss',
        'Muscle Building/Hypertrophy': 'Targeted training for muscle growth',
        'Functional Fitness': 'Practical strength for real-life movement',
        'HIIT Training': 'Intense intervals for maximum results in minimum time',
        'Cardio Conditioning': 'Build cardiovascular health and endurance',
        'Core Strengthening': 'Foundation work for stability and power',
        'Flexibility & Mobility': 'Expanded range of motion and ease of movement',
        'Sports-Specific Training': 'Training tailored to your sport or activity',
        'Senior Fitness': 'Safe, effective programs for older adults',
        'Prenatal/Postnatal Fitness': 'Pregnancy-safe and postpartum recovery training',
        'Injury Recovery/Rehabilitation': 'Safe return to activity after injury',
        'Posture Correction': 'Alignment and strengthening for better posture',
        'Balance Training': 'Stability work to prevent falls and improve coordination',
        'Endurance Training': 'Build capacity for sustained athletic performance',
        'Bodyweight Training': 'Strength and fitness using only your body',
        'Kettlebell Training': 'Dynamic training with this versatile tool',
        'TRX/Suspension Training': 'Full-body strength using suspended straps',
        'Circuit Training': 'Efficient full-body workouts combining strength and cardio',
        'Group Fitness Classes': 'Community and motivation in group settings',
        'Online/Virtual Training': 'Convenient fitness guidance from your space',
        'Nutrition Coaching': 'Training paired with nutritional guidance',
    };

    // Render category cards with descriptions (uses taxonomy data)
    function renderCategories(filter = '') {
        // Use global if available, otherwise use cache
        const data = (typeof taxonomyData !== 'undefined' && Object.keys(taxonomyData).length > 0) 
            ? taxonomyData 
            : onboardingTaxonomyCache;
        
        if (!data || Object.keys(data).length === 0) {
            categoriesList.innerHTML = '<p>Loading categories...</p>';
            return;
        }
        
        const categories = Object.entries(data).map(([id, categoryData]) => ({
            id,
            name: categoryData.name,
            subcategories: categoryData.subcategories || []
        }));
        
        categoriesList.innerHTML = categories
            .filter(cat => {
                const matchesName = cat.name.toLowerCase().includes(filter.toLowerCase());
                const matchesDesc = (categoryDescriptions[cat.id] || '').toLowerCase().includes(filter.toLowerCase());
                return matchesName || matchesDesc;
            })
            .map(cat => {
                // Try to get description by ID first, then by category name
                const description = categoryDescriptions[cat.id] 
                    || categoryDescriptions[cat.name] 
                    || 'Explore this path to wellness';
                return `
                    <div class="category-card" data-category-id="${cat.id}" data-category-name="${cat.name}" style="
                        padding: 16px 20px;
                        border: 2px solid #e0d5c7;
                        border-radius: 12px;
                        margin-bottom: 16px;
                        background: linear-gradient(135deg, #fbf7ec 0%, #f5f0e6 100%);
                        transition: all 0.3s ease;
                        cursor: pointer;
                    " onmouseover="this.style.borderColor='#77883e'; this.style.boxShadow='0 4px 12px rgba(119,136,62,0.15)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.borderColor='#e0d5c7'; this.style.boxShadow='none'; this.style.transform='translateY(0)'">
                        <h4 style="
                            margin: 0 0 8px 0;
                            color: #77883e;
                            font-size: 16px;
                            font-weight: 700;
                            letter-spacing: 0.5px;
                        ">${cat.name}</h4>
                        <p style="
                            margin: 0;
                            color: #666;
                            font-size: 14px;
                            line-height: 1.5;
                            font-style: italic;
                        ">${description}</p>
                    </div>
                `;
            }).join('');

        // Add click handlers to category cards
        document.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', () => {
                selectCategory(card.dataset.categoryId, card.dataset.categoryName);
            });
        });
    }

    // Select category and show subcategories
    function selectCategory(catId, catName) {
        categorySelected.value = catId;
        
        // Highlight selected category
        document.querySelectorAll('.category-card').forEach(card => {
            card.classList.remove('selected');
        });
        document.querySelector(`[data-category-id="${catId}"]`).classList.add('selected');

        // Use global if available, otherwise use cache
        const data = (typeof taxonomyData !== 'undefined' && Object.keys(taxonomyData).length > 0) 
            ? taxonomyData 
            : onboardingTaxonomyCache;
        
        // Find category object to get subcategories
        const category = data ? data[catId] : null;
        if (category && category.subcategories && category.subcategories.length > 0) {
            renderSubcategories(category.subcategories);
            subcategoriesGroup.style.display = 'block';
        } else {
            subcategoriesGroup.style.display = 'none';
        }
    }

    // Render subcategories as checkboxes with descriptions
    function renderSubcategories(subcategories) {
        subcategoriesList.innerHTML = subcategories
            .map((subName, idx) => {
                let description = subcategoryDescriptions[subName];
                
                // If no description exists, generate a smart one from the subcategory name
                if (!description) {
                    description = generateDescriptionFromName(subName);
                }
                
                return `
                    <div class="subcategory-card" style="
                        padding: 12px 16px;
                        border: 1px solid #e0d5c7;
                        border-radius: 8px;
                        margin-bottom: 12px;
                        background: #fbf7ec;
                        transition: all 0.2s ease;
                        cursor: pointer;
                    " onmouseover="this.style.borderColor='#77883e'; this.style.backgroundColor='#f5f0e6'; this.style.boxShadow='0 2px 8px rgba(119,136,62,0.1)'" onmouseout="this.style.borderColor='#e0d5c7'; this.style.backgroundColor='#fbf7ec'; this.style.boxShadow='none'">
                        <label style="
                            display: flex;
                            align-items: flex-start;
                            gap: 12px;
                            cursor: pointer;
                            margin: 0;
                        ">
                            <input type="checkbox" value="${subName}" name="subcategory" data-index="${idx}" style="
                                margin-top: 3px;
                                flex-shrink: 0;
                                cursor: pointer;
                            ">
                            <span class="checkbox-text" style="
                                flex: 1;
                                display: block;
                                font-weight: 600;
                                color: #333;
                                font-size: 14px;
                            ">${subName}${description ? `<div style="font-size: 13px; color: #777; line-height: 1.4; font-style: italic; margin-top: 4px; font-weight: normal;">${description}</div>` : ''}</span>
                        </label>
                    </div>
                `;
            }).join('');
    }

    // Generate intelligent description from subcategory name if not in database
    function generateDescriptionFromName(name) {
        // Common patterns for auto-generating descriptions
        const patterns = {
            'assessment': 'Evaluation and personalized analysis',
            'consultation': 'One-on-one guidance and professional advice',
            'coaching': 'Goal-oriented support and accountability',
            'training': 'Structured instruction and skill development',
            'therapy': 'Healing work addressing root causes',
            'treatment': 'Professional care addressing your needs',
            'support': 'Compassionate assistance on your wellness path',
            'counseling': 'Professional guidance and emotional support',
            'session': 'Dedicated time for focused work together',
            'class': 'Group instruction in a structured environment',
            'workshop': 'Interactive learning and practice opportunity',
            'course': 'Comprehensive instruction and skill building',
            'program': 'Structured, multi-step path to your goals',
            'retreat': 'Immersive experience for deeper transformation',
            'intensive': 'Focused, concentrated healing work',
            'private': 'One-on-one personalized attention',
            'group': 'Community experience with shared healing',
            'online': 'Accessible guidance from anywhere',
            'virtual': 'Remote connection maintaining presence and care',
        };

        // Check if name contains any pattern words
        const lowerName = name.toLowerCase();
        for (const [pattern, description] of Object.entries(patterns)) {
            if (lowerName.includes(pattern)) {
                return description;
            }
        }

        // Default fallback with the service name incorporated
        return `Personalized ${name} experience tailored to your wellness needs`;
    }

    // Search handler
    searchInput.addEventListener('input', (e) => {
        renderCategories(e.target.value);
    });

    // Initial render
    renderCategories();
}

// Export
window.injectOnboardingStyles = injectOnboardingStyles;
window.setupOnboardingEventListeners = setupOnboardingEventListeners;
window.closeOnboardingModal = closeOnboardingModal;
window.populateStep5Display = populateStep5Display;
window.goToStep = goToStep;
