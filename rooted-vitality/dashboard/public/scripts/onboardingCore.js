/**
 ╔════════════════════════════════════════════════════════════════════╗
 ║  ROOTED VITALITY, INC.                                             ║
 ║  File: onboardingCore.js                                           ║
 ║  Purpose: Core onboarding initialization and flow orchestration    ║
 ║  Holistic Wellness · Modern Connection Platform                    ║
 ║  rootedvitality.com | 2025                                         ║
 ╚════════════════════════════════════════════════════════════════════╝

 TABLE OF CONTENTS
   1. Initialization & Taxonomy Loading
   2. Modal Creation & UI Rendering
   3. Step Navigation & Flow Control
   4. Back Button Logic
   5. Exports & Globals

 DEPENDENCIES:
   - Requires: onboardingUI.js, onboardingService.js
   - Used by: index.html, my-wellness.html
   - Global: window.supabaseClient, taxonomyData (optional)
 */

// ======================================================
// 1. INITIALIZATION & TAXONOMY LOADING
// ======================================================

// Reference to global taxonomyData (from my-projects.js) or local cache
let onboardingTaxonomyCache = null;
let taxonomyLoadPromise = null;

/**
 * Initialize the onboarding modal
 * Entry point - routes based on user state
 */
async function initializeOnboarding() {
    // Check if user is authenticated
    if (!window.supabaseClient) {
        console.error('[Onboarding] Supabase client not available');
        return;
    }

    // Load or use cached taxonomy data
    await ensureTaxonomyLoaded();

    const { data: { session } } = await window.supabaseClient.auth.getSession();

    if (session) {
        // Returning user - skip to step 1 (knows what they want?)
        initializeGuidedOnboarding(true); // true = returning user
    } else {
        // New user - show guided onboarding modal
        initializeGuidedOnboarding(false, false); // skipAuth=false, isReturningUser=false
    }
}

/**
 * Ensure taxonomy data is available
 * First tries to use global taxonomyData from my-projects.js
 * Falls back to loading from database if not available
 */
async function ensureTaxonomyLoaded() {
    console.log('[onboardingCore] ensureTaxonomyLoaded called');
    
    // If global taxonomyData exists and has data, use it
    if (typeof taxonomyData !== 'undefined' && Object.keys(taxonomyData).length > 0) {
        console.log('[onboardingCore] Using global taxonomyData');
        onboardingTaxonomyCache = taxonomyData;
        return;
    }

    // If already loading, wait for it
    if (taxonomyLoadPromise) {
        console.log('[onboardingCore] Waiting for existing taxonomy load promise');
        return taxonomyLoadPromise;
    }

    // If already cached locally, use it
    if (onboardingTaxonomyCache && Object.keys(onboardingTaxonomyCache).length > 0) {
        console.log('[onboardingCore] Using cached taxonomy');
        return;
    }

    // Load from database and cache
    console.log('[onboardingCore] Loading taxonomy from database...');
    taxonomyLoadPromise = loadTaxonomyForOnboarding();
    await taxonomyLoadPromise;
    console.log('[onboardingCore] Taxonomy loaded and cached');
    taxonomyLoadPromise = null;
}

/**
 * Load taxonomy from database (fallback if not available globally)
 */
async function loadTaxonomyForOnboarding() {
    try {
        const { data, error } = await window.supabaseClient
            .from('holistic_health_taxonomy')
            .select(`
                id,
                category_id,
                name,
                taxonomy_subcategories(id, name)
            `)
            .eq('is_active', true)
            .order('display_order', { ascending: true });

        if (error) {
            console.error('[Onboarding] Database error loading taxonomy:', error);
            throw error;
        }

        if (!data || data.length === 0) {
            console.warn('[Onboarding] No taxonomy data returned from database');
            return;
        }

        // Build taxonomy object indexed by ID with subcategories as array of names
        onboardingTaxonomyCache = {};
        data.forEach(category => {
            // Extract subcategory names from the nested response
            const subcategoryNames = (category.taxonomy_subcategories || []).map(sub => sub.name);
            onboardingTaxonomyCache[category.id] = {
                id: category.id,
                category_id: category.category_id,
                name: category.name,
                subcategories: subcategoryNames
            };
        });

    } catch (error) {
        console.error('[Onboarding] Error loading taxonomy:', error);
    }
}

// ======================================================
// 2. MODAL CREATION & UI RENDERING
// ======================================================

/**
 * Initialize the unified guided onboarding modal
 * skipAuth: if true, user is already logged in - skip steps 0, 0a and go straight to step 1
 * isReturningUser: if true, user chose "returning" but not yet logged in - show step 0, 0a then skip 3, 4
 */
async function initializeGuidedOnboarding(skipAuth = false, isReturningUser = false) {
    console.log('[onboardingCore] initializeGuidedOnboarding called with skipAuth=', skipAuth, 'isReturningUser=', isReturningUser);
    
    // CRITICAL: Ensure taxonomy is loaded before creating modal
    console.log('[onboardingCore] Ensuring taxonomy is loaded...');
    await ensureTaxonomyLoaded();
    console.log('[onboardingCore] Taxonomy loaded successfully');
    
    console.log('[onboardingCore] Creating modal element...');
    const modal = document.createElement('div');
    modal.id = 'guided-onboarding-modal';

    // Build HTML with all steps
    console.log('[onboardingCore] Building modal HTML...');
    modal.innerHTML = getOnboardingModalHTML(skipAuth);

    // Add to DOM
    console.log('[onboardingCore] Adding modal to DOM...');
    const existing = document.getElementById('guided-onboarding-modal');
    if (existing) existing.remove();
    document.body.appendChild(modal);
    console.log('[onboardingCore] Modal added to DOM');

    // IMMEDIATELY populate all category dropdowns from loaded taxonomy
    console.log('[onboardingCore] Populating category dropdowns...');
    populateCategoryDropdowns();

    // Inject styles from onboardingUI.js
    console.log('[onboardingCore] Injecting styles...');
    injectOnboardingStyles();

    // Setup all event listeners from onboardingUI.js
    console.log('[onboardingCore] Setting up event listeners...');
    setupOnboardingEventListeners(isReturningUser);
    console.log('[onboardingCore] Modal fully initialized');

    // If user is already signed in (skipAuth=true), skip Step 0 and go directly to Step 1
    if (skipAuth) {
        console.log('[onboardingCore] User already signed in, skipping Step 0 and going directly to Step 1');
        if (window.onboardingData) {
            window.onboardingData.path = 'guided';
        }
        window.goToStep('1', modal);
    }
}

/**
 * Get the HTML structure for the entire onboarding modal
 * Returns complete 7-step modal (Steps 0-6) with all form fields and layouts
 */
function getOnboardingModalHTML(skipAuth = false, isReturningUser = false) {
    return `
        <div class="onboarding-overlay"></div>
        <div class="onboarding-modal">
            <button class="onboarding-close-btn" aria-label="Close onboarding" title="Close onboarding">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>

            <div class="onboarding-progress">
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
            </div>

            <!-- STEP 0: New or returning user? -->
            <div class="onboarding-step ${!skipAuth ? 'active' : ''}" data-step="0">
                <div class="step-content">
                    <div class="step-logo">
                        <img src="/rooted-vitality/assets/logo_trimmed.png" alt="Rooted Vitality" class="logo-image">
                    </div>
                    <div class="step-opening">
                        <h2>Welcome to Rooted Vitality</h2>
                        <p class="step-subtitle">Every journey starts somewhere. Let's find yours.</p>
                    </div>

                    <div class="step-choice-cards">
                        <button type="button" class="choice-card" id="new-user-btn">
                            <span class="choice-title">First time here?</span>
                            <span class="choice-desc">Create an account and start your journey</span>
                        </button>
                        <button type="button" class="choice-card" id="returning-user-btn">
                            <span class="choice-title">Welcome back!</span>
                            <span class="choice-desc">Sign in to your account</span>
                        </button>
                    </div>

                    <p class="step-footer-text">You can switch between these anytime</p>

                    <div class="form-actions">
                        <button type="button" class="btn-secondary onboarding-back" style="display: none;">Back</button>
                    </div>
                </div>
            </div>

            <!-- STEP 0a: Sign in -->
            <div class="onboarding-step ${isReturningUser && !skipAuth ? 'active' : ''}" data-step="0a">
                <div class="step-content">
                    <div class="step-logo">
                        <img src="/rooted-vitality/assets/logo_trimmed.png" alt="Rooted Vitality" class="logo-image">
                    </div>
                    <div class="step-opening">
                        <h2>Welcome back to Rooted Vitality</h2>
                        <p class="step-subtitle">Sign in to your account and continue your healing journey</p>
                    </div>

                    <form id="step-login-form" class="onboarding-form">
                        <div class="form-group">
                            <label for="step-login-email">Your email *</label>
                            <input type="email" id="step-login-email" name="email" placeholder="you@email.com" required>
                        </div>

                        <div class="form-group">
                            <label for="step-login-password">Your password *</label>
                            <input type="password" id="step-login-password" name="password" placeholder="Enter your password" required>
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn-secondary onboarding-back">Back</button>
                            <button type="submit" class="btn-primary">Sign in</button>
                        </div>

                        <p class="login-help">
                            New here? <a href="#" class="login-switch-link">Create an account instead</a>
                        </p>
                    </form>
                </div>
            </div>


            <!-- STEP 1: Guided project creation (formerly 1B) -->
            <div class="onboarding-step ${skipAuth ? 'active' : ''}" data-step="1">
                <div class="step-content">
                    <div class="step-logo">
                        <img src="/rooted-vitality/assets/logo_trimmed.png" alt="Rooted Vitality" class="logo-image">
                    </div>
                    <div class="step-opening">
                        <h2>We're so excited you're here!</h2>
                        <p class="step-subtitle">Taking this step toward your wellbeing takes courage. We're here to help you connect with the right practitioner who understands your needs.</p>
                    </div>

                    <form id="step-1-form" class="onboarding-form">
                        <!-- SYMPTOMS/DESCRIPTION -->
                        <div class="form-group">
                            <label for="guided-symptoms">Share what's on your wellness journey</label>
                            <p class="form-helper" style="color: #666;">Don't worry about being perfect—just let it flow. This is a safe space, and everything you share will help your practitioner understand exactly how to support you.</p>
                            <textarea id="guided-symptoms" name="symptoms" placeholder="Share what's going on..." rows="4" maxlength="1000" required></textarea>
                            <span class="form-hint"><span id="guided-symptoms-count">0</span> / 1000 characters</span>
                        </div>

                        <!-- CATEGORY PICKER WITH SEARCH -->
                        <div class="form-group">
                            <label for="guided-category-search">What type of healing are you drawn to?</label>
                            <p class="form-helper" style="color: #666;">Pick one main healing path below, then choose as many specific focuses as you want within it. There are no wrong answers—trust what feels right.</p>
                            <div class="category-picker">
                                <input type="text" id="guided-category-search" class="category-search" placeholder="Type to find your healing..." autocomplete="off">
                                <div id="guided-categories-list" class="categories-list">
                                    <!-- Categories injected by JS with descriptions -->
                                </div>
                                <input type="hidden" id="guided-category-selected" name="category" required>
                            </div>
                        </div>

                        <!-- SUBCATEGORY PICKER (APPEARS AFTER CATEGORY SELECTED) -->
                        <div class="form-group" id="guided-subcategories-group" style="display: none;">
                            <label>Pick everything that speaks to your soul</label>
                            <p class="form-helper" style="color: #666;">Check as many as you want. Your practitioner will see all of these and know exactly what you need.</p>
                            <div id="guided-subcategories-list" class="subcategories-list">
                                <!-- Subcategory checkboxes injected by JS -->
                            </div>
                        </div>

                        <!-- SESSION TYPE PREFERENCE -->
                        <div class="form-group">
                            <label>How do you prefer to receive care?</label>
                            <p class="form-helper" style="color: #666;">Pick whichever option makes you feel most comfortable and safe. Your space, their space, or yours on screen—it's all good.</p>
                            <div class="options-grid">
                                <label class="option-card">
                                    <input type="radio" name="travel_preference" value="in-person" required>
                                    <div class="option-content">
                                        <span class="option-title">In-Office</span>
                                        <span class="option-desc">Visit practitioner's office</span>
                                    </div>
                                </label>
                                <label class="option-card">
                                    <input type="radio" name="travel_preference" value="housecalls" required>
                                    <div class="option-content">
                                        <span class="option-title">Housecalls</span>
                                        <span class="option-desc">Practitioner comes to me</span>
                                    </div>
                                </label>
                                <label class="option-card">
                                    <input type="radio" name="travel_preference" value="virtual" required>
                                    <div class="option-content">
                                        <span class="option-title">Virtual</span>
                                        <span class="option-desc">Online session</span>
                                    </div>
                                </label>
                                <label class="option-card">
                                    <input type="radio" name="travel_preference" value="flexible" required>
                                    <div class="option-content">
                                        <span class="option-title">Flexible</span>
                                        <span class="option-desc">Open to any option</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn-secondary onboarding-back">Back</button>
                            <button type="submit" class="btn-primary">Continue</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- STEP 2: 10 Client Profile Questions -->
            <div class="onboarding-step" data-step="2">
                <div class="step-content">
                    <div class="step-logo">
                        <img src="/rooted-vitality/assets/logo_trimmed.png" alt="Rooted Vitality" class="logo-image">
                    </div>
                    <div class="step-opening">
                        <h2>Tell us more about you</h2>
                        <p class="step-subtitle">All fields are optional and can be edited anytime from your profile page.</p>
                        <p class="privacy-disclaimer-top">Your information is private and will only be shared with practitioners you match with and accept.</p>
                    </div>

                    <form id="step-2-form" class="onboarding-form">
                        <div class="form-group">
                            <label for="wellness-goals">What are your main wellness goals?</label>
                            <textarea id="wellness-goals" name="wellnessGoals" placeholder="Tell us what you want to achieve..." rows="2"></textarea>
                        </div>

                        <div class="form-group">
                            <label for="duration">How long have you been dealing with this?</label>
                            <input type="text" id="duration" name="duration" placeholder="e.g., 6 months, 2 years">
                        </div>

                        <div class="form-group">
                            <label for="tried-before">What have you already tried?</label>
                            <textarea id="tried-before" name="triedBefore" placeholder="Share what has or hasn't worked..." rows="2"></textarea>
                        </div>

                        <div class="form-group">
                            <label for="allergies">Do you have any allergies we should know about?</label>
                            <textarea id="allergies" name="allergies" placeholder="List any allergies..." rows="2"></textarea>
                        </div>

                        <div class="form-group">
                            <label for="medications">Are you currently taking any medications?</label>
                            <textarea id="medications" name="medications" placeholder="List current medications..." rows="2"></textarea>
                        </div>

                        <div class="form-group">
                            <label for="daily-life">How does this affect your daily life?</label>
                            <textarea id="daily-life" name="dailyLife" placeholder="Describe the impact..." rows="2"></textarea>
                        </div>

                        <div class="form-group">
                            <label for="communication-pref">How do you prefer to communicate?</label>
                            <select id="communication-pref" name="communicationPref">
                                <option value="">-- Select preference --</option>
                                <option value="email">Email</option>
                                <option value="phone">Phone</option>
                                <option value="text">Text/SMS</option>
                                <option value="video">Video call</option>
                                <option value="in-person">In-person</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="barriers">What barriers might you face in your wellness journey?</label>
                            <textarea id="barriers" name="barriers" placeholder="Describe any challenges..." rows="2"></textarea>
                        </div>

                        <div class="form-group">
                            <label for="practitioner-exp">Have you worked with practitioners like this before?</label>
                            <select id="practitioner-exp" name="practitionerExp">
                                <option value="">-- Select option --</option>
                                <option value="yes">Yes, I have experience</option>
                                <option value="no">No, this would be new</option>
                                <option value="some">Yes, but limited experience</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="desired-outcomes">What would success look like for you?</label>
                            <textarea id="desired-outcomes" name="desiredOutcomes" placeholder="Describe your ideal outcome..." rows="2"></textarea>
                        </div>

                        <p class="privacy-disclaimer-bottom">We use this information to share with your practitioners. As a third-party platform, we don't use this for matching or medical recommendations.</p>

                        <div class="form-actions">
                            <button type="button" class="btn-secondary onboarding-back">Back</button>
                            <button type="submit" class="btn-primary">Continue</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- STEP 3: Signup form (creates client - SKIP for returning users) -->
            <div class="onboarding-step" data-step="3">
                <div class="step-content">
                    <div class="step-logo">
                        <img src="/rooted-vitality/assets/logo_trimmed.png" alt="Rooted Vitality" class="logo-image">
                    </div>
                    <div class="step-opening">
                        <h2>You're almost there!</h2>
                        <p class="step-subtitle">We're so impressed with you for taking this journey. Now let's create your account so we can match you with your perfect practitioner.</p>
                        <p class="form-helper">It's completely free. Your information is protected and only shared with practitioners you match with and accept.</p>
                    </div>

                    <form id="step-3-form" class="onboarding-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="onboarding-firstName">First name *</label>
                                <input type="text" id="onboarding-firstName" name="firstName" placeholder="First" required>
                            </div>
                            <div class="form-group">
                                <label for="onboarding-lastName">Last name *</label>
                                <input type="text" id="onboarding-lastName" name="lastName" placeholder="Last" required>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="onboarding-dob-signup">Date of birth *</label>
                                <input type="date" id="onboarding-dob-signup" name="dob" required>
                            </div>
                            <div class="form-group">
                                <label for="onboarding-sex">Sex *</label>
                                <select id="onboarding-sex" name="sex" required>
                                    <option value="">-- Choose --</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="onboarding-email">Email address *</label>
                            <input type="email" id="onboarding-email" name="email" placeholder="you@email.com" required>
                        </div>

                        <div class="form-group">
                            <label for="onboarding-password">Create a password *</label>
                            <div class="password-input-container">
                                <input type="password" id="onboarding-password" name="password" placeholder="12+ chars, uppercase, lowercase, number, special character" required>
                                <button type="button" class="password-toggle" id="toggle-password-3" aria-label="Show/hide password">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                </button>
                            </div>
                            <small class="form-hint">Password must have: 12+ characters, uppercase letter, lowercase letter, number, special character (!@#$%^&*)</small>
                            <div id="password-strength-indicator" class="password-strength" style="display: none; margin-top: 8px;">
                                <div class="strength-bar">
                                    <div class="strength-fill"></div>
                                </div>
                                <div id="password-requirements" style="font-size: 12px; color: #666; margin-top: 6px;">
                                    <div><span id="req-length">✗</span> 12+ characters</div>
                                    <div><span id="req-uppercase">✗</span> Uppercase letter (A-Z)</div>
                                    <div><span id="req-lowercase">✗</span> Lowercase letter (a-z)</div>
                                    <div><span id="req-number">✗</span> Number (0-9)</div>
                                    <div><span id="req-special">✗</span> Special character (!@#$%^&*)</div>
                                </div>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="onboarding-confirmPassword">Confirm password *</label>
                            <div class="password-input-container">
                                <input type="password" id="onboarding-confirmPassword" name="confirmPassword" placeholder="Confirm password" required>
                                <button type="button" class="password-toggle" id="toggle-confirm-password-3" aria-label="Show/hide password">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="onboarding-phone-signup">Phone number *</label>
                            <input type="tel" id="onboarding-phone-signup" name="phone" placeholder="(555) 123-4567" required>
                        </div>

                        <fieldset class="form-fieldset">
                            <legend>Address</legend>
                            
                            <div class="form-group">
                                <label for="onboarding-street-signup">Street Address</label>
                                <input type="text" id="onboarding-street-signup" name="street">
                            </div>

                            <div class="form-group">
                                <label for="onboarding-city-signup">City *</label>
                                <input type="text" id="onboarding-city-signup" name="city" required>
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label for="onboarding-state-signup">State *</label>
                                    <input type="text" id="onboarding-state-signup" name="state" maxlength="2" required>
                                </div>

                                <div class="form-group">
                                    <label for="onboarding-zipcode-signup">Zip code *</label>
                                    <input type="text" id="onboarding-zipcode-signup" name="zipcode" maxlength="5" required>
                                </div>
                            </div>
                        </fieldset>

                        <div class="form-actions">
                            <button type="button" class="btn-secondary onboarding-back">Back</button>
                            <button type="submit" class="btn-primary">Continue</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- STEP 4: Verification, Disclaimers, Agreements, Email Confirmation -->
            <div class="onboarding-step" data-step="4">
                <div class="step-content">
                    <div class="step-logo">
                        <img src="/rooted-vitality/assets/logo_trimmed.png" alt="Rooted Vitality" class="logo-image">
                    </div>
                    <div class="step-opening">
                        <h2>Review Our Terms</h2>
                        <p class="step-subtitle">Before we proceed, please review and accept our terms, privacy policy, and disclaimer.</p>
                    </div>

                    <div class="verification-section">
                        <div class="terms-section">
                            <h3>What you should know</h3>

                            <div class="terms-scroll" id="terms-scroll-container">
                                <div class="terms-content">
                                    <h4>Important Disclaimer & Informed Consent</h4>
                                    
                                    <h5>We're not a medical service</h5>
                                    <p>Rooted Vitality is a marketplace platform that connects clients with independent wellness practitioners. We are NOT a medical provider. The practitioners available through our platform offer holistic, complementary wellness services—not medical treatment or diagnosis.</p>
                                    
                                    <h5>Practitioners are independent professionals</h5>
                                    <p>While we vet our practitioners, they are independent contractors. Rooted Vitality is not responsible for their specific practices, methodologies, credentials, or outcomes. You are responsible for evaluating whether a practitioner is right for you.</p>
                                    
                                    <h5>Not a replacement for medical care</h5>
                                    <p>Wellness services are complementary to, not a replacement for, professional medical care. Always consult with a licensed medical doctor (MD) or appropriate healthcare provider before making any health decisions, especially if you have existing medical conditions or are taking medications.</p>
                                    
                                    <h5>Your informed consent</h5>
                                    <p>By using Rooted Vitality, you acknowledge that: (1) you understand the services offered are wellness-based and not medical; (2) you assume full responsibility for health decisions made through practitioners connected via our platform; (3) you will seek professional medical advice when appropriate; and (4) you release Rooted Vitality from liability for practitioner recommendations or outcomes.</p>
                                    
                                    <h5>Your privacy is protected</h5>
                                    <p>Your personal and health information is private and confidential. Rooted Vitality only shares your information with practitioners you match with and accept. We never sell your data to third parties.</p>

                                    <h5>Terms of Use & Privacy Policy</h5>
                                    <p>By proceeding, you agree to our complete <a href="/terms-of-use" target="_blank" rel="noopener">Terms of Use</a> and <a href="/privacy-policy" target="_blank" rel="noopener">Privacy Policy</a>. Please review these documents carefully.</p>

                                    <h5>Next step: Account creation</h5>
                                    <p>When you click Continue below, we will create your account, save your profile information, and send you a confirmation email to verify your email address. You'll be able to start connecting with practitioners right away.</p>
                                </div>
                            </div>

                            <div class="terms-checkboxes">
                                <label class="terms-checkbox">
                                    <input type="checkbox" id="checkbox-disclaimer" name="disclaimer">
                                    <span>I understand Rooted Vitality is a wellness marketplace, not a medical service</span>
                                </label>
                                <label class="terms-checkbox">
                                    <input type="checkbox" id="checkbox-privacy" name="privacy">
                                    <span>I have read and agree to the Privacy Policy</span>
                                </label>
                                <label class="terms-checkbox">
                                    <input type="checkbox" id="checkbox-terms" name="terms">
                                    <span>I have read and agree to the Terms of Use and assume full responsibility for my wellness decisions</span>
                                </label>
                            </div>
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn-secondary onboarding-back">Back</button>
                            <button type="button" class="btn-primary onboarding-next" id="step-4-next">Create Account & Send Email</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- STEP 5: Confirm your project details -->
            <div class="onboarding-step" data-step="5">
                <div class="step-content">
                    <div class="step-logo">
                        <img src="/rooted-vitality/assets/logo_trimmed.png" alt="Rooted Vitality" class="logo-image">
                    </div>
                    <div class="step-opening">
                        <h2>Confirm your care request</h2>
                        <p class="step-subtitle">Let's make sure we have everything right before finding your matches.</p>
                    </div>

                    <div class="project-confirmation">
                        <div class="project-details">
                            <h3>Your wellness focus:</h3>
                            <p><strong>Category:</strong> <span id="confirm-category">Not selected</span></p>
                            <p><strong>Specialty:</strong> <span id="confirm-subcategory">(Not specified)</span></p>
                            
                            <h3 style="margin-top: 1.5rem;">Your location & preferences:</h3>
                            <p><strong>Zipcode:</strong> <span id="confirm-zipcode">Not provided</span></p>
                            <p><strong>Travel Type:</strong> <span id="confirm-travel">Not specified</span></p>

                            <button type="button" class="btn-link" id="edit-project-btn" style="margin-top: 1.5rem;">Edit these details</button>
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn-secondary onboarding-back">Back</button>
                            <button type="button" class="btn-primary" id="step-5-next">Find my matches</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- STEP 6: Here are your matches -->
            <div class="onboarding-step" data-step="6">
                <div class="step-content">
                    <div class="step-logo">
                        <img src="/rooted-vitality/assets/logo_trimmed.png" alt="Rooted Vitality" class="logo-image">
                    </div>
                    <div class="step-opening">
                        <h2>Meet practitioners matched for you</h2>
                        <p class="step-subtitle">We've found some excellent matches based on what you're looking for.</p>
                    </div>

                    <div id="matches-container" class="matches-container">
                        <p class="loading">Finding your perfect matches...</p>
                    </div>

                    <div class="matches-actions">
                        <p class="action-help">Feel drawn to someone? Connect to reach out. Want to explore more first? You can always come back later.</p>
                        
                        <div class="form-actions">
                            <button type="button" class="btn-secondary onboarding-action" id="save-for-later-btn">I'll choose later</button>
                            <button type="button" class="btn-primary onboarding-action" id="continue-browsing-btn">Show me more</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Populate category dropdowns from taxonomy data
 * Uses global taxonomyData if available, otherwise uses cached data
 */
function populateCategoryDropdowns() {
    // Use global if available, otherwise use cache
    const data = (typeof taxonomyData !== 'undefined' && Object.keys(taxonomyData).length > 0) 
        ? taxonomyData 
        : onboardingTaxonomyCache;

    if (!data || Object.keys(data).length === 0) {
        console.warn('[Onboarding] No taxonomy data available to populate dropdowns');
        return;
    }

    // Step 1 form dropdown (if it exists)
    const step1Select = document.getElementById('returning-category');
    if (step1Select) {
        step1Select.innerHTML = '<option value="">Choose a category...</option>';
        Object.entries(data).forEach(([id, category]) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = category.name;
            step1Select.appendChild(option);
        });
    }
}

// ======================================================
// 3. STEP NAVIGATION & FLOW CONTROL
// ======================================================

/**
 * Navigate to a specific step
 * Updates UI, progress bar, and validates data as needed
 */
function goToStep(stepNumber, modal = null) {
    if (!modal) {
        modal = document.getElementById('guided-onboarding-modal');
    }
    if (!modal) return;

    modal.querySelectorAll('.onboarding-step').forEach(step => {
        step.classList.remove('active');
    });
    
    const selector = typeof stepNumber === 'string' 
        ? `[data-step="${stepNumber}"]` 
        : `[data-step="${stepNumber}"]`;
    modal.querySelector(selector)?.classList.add('active');

    // If navigating to Step 5, populate the display with collected data
    if (stepNumber === 5) {
        console.log('[onboardingCore] Navigating to Step 5, populating display...');
        if (typeof window.populateStep5Display === 'function') {
            // Get current onboarding data from window or reconstruct from form
            const onboardingData = window.currentOnboardingData || {};
            window.populateStep5Display(onboardingData);
        }
    }

    // Update progress bar (Total numeric steps: 0, 0a, 1, 2, 3, 4, 5, 6 = 6 main steps)
    let progressPercent;
    if (stepNumber === '0' || stepNumber === 0) {
        progressPercent = (1 / 7) * 100;
    } else if (stepNumber === '0a') {
        progressPercent = (1 / 7) * 100;
    } else if (typeof stepNumber === 'string') {
        progressPercent = (3 / 7) * 100;
    } else {
        progressPercent = ((stepNumber + 1) / 7) * 100;
    }
    const progressFill = modal.querySelector('.progress-fill');
    if (progressFill) {
        progressFill.style.width = progressPercent + '%';
    }

    // Scroll to top
    const stepContent = modal.querySelector('.onboarding-step.active .step-content');
    if (stepContent) {
        stepContent.scrollTop = 0;
    }
}

// ======================================================
// 4. BACK BUTTON LOGIC
// ======================================================

/**
 * Handle back button navigation with context awareness
 */
function handleBackButton(onboardingData) {
    const modal = document.getElementById('guided-onboarding-modal');
    if (!modal) return;
    
    const currentStep = modal.querySelector('.onboarding-step.active')?.dataset.step;
    
    if (currentStep === '0') {
        closeOnboardingModal();
    } else if (currentStep === '0a') {
        goToStep(0, modal);
    } else if (currentStep === '1') {
        goToStep('0a', modal);
    } else if (currentStep === '2') {
        const previousPath = onboardingData.currentPath || '1';
        goToStep(previousPath, modal);
    } else if (currentStep === '3') {
        goToStep(2, modal);
    } else if (currentStep === '4') {
        goToStep(2, modal);
    } else if (currentStep === '5') {
        if (onboardingData.userId && !onboardingData.signupCompleted) {
            goToStep(2, modal);
        } else {
            goToStep(4, modal);
        }
    } else if (currentStep === '6') {
        goToStep(5, modal);
    }
}

// ======================================================
// 5. EXPORTS & GLOBALS
// ======================================================

/**
 * Make functions available globally for HTML access
 */
window.initializeOnboarding = initializeOnboarding;
window.initializeGuidedOnboarding = initializeGuidedOnboarding;
window.openGuidedOnboarding = () => initializeGuidedOnboarding();
window.goToStep = goToStep;
window.handleBackButton = handleBackButton;

/**
 * Auto-open onboarding for first-time visitors (if enabled)
 */
window.autoOpenOnboardingOnFirstVisit = {
    init: function() {
        if (!window.supabaseClient) return;
        window.supabaseClient.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                const hasSeenModal = sessionStorage.getItem('rooted-vitality-onboarding-shown');
                if (!hasSeenModal) {
                    setTimeout(() => {
                        initializeOnboarding();
                        sessionStorage.setItem('rooted-vitality-onboarding-shown', 'true');
                    }, 800);
                }
            }
        });
    }
};
