/**
 * ============================================
 * GUIDED ONBOARDING MODAL
 * ============================================
 * Unified modal for new/returning users
 * Uses: global taxonomyData if available, otherwise loads from database
 * 
 * ARCHITECTURE:
 * - Reuses global taxonomyData from my-projects.js if available
 * - Falls back to loading from database if needed (e.g., on landing page)
 * - All styling is in onboarding-modal.css (injected at runtime)
 * - This file contains modal logic, event handlers, and database operations
 */

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
    // If global taxonomyData exists and has data, use it
    if (typeof taxonomyData !== 'undefined' && Object.keys(taxonomyData).length > 0) {
        console.log('[Onboarding] Using global taxonomyData from my-projects.js, count:', Object.keys(taxonomyData).length);
        onboardingTaxonomyCache = taxonomyData;
        return;
    }

    console.log('[Onboarding] Global taxonomyData not available, checking cache...');

    // If already loading, wait for it
    if (taxonomyLoadPromise) {
        console.log('[Onboarding] Waiting for existing taxonomy load promise...');
        return taxonomyLoadPromise;
    }

    // If already cached locally, use it
    if (onboardingTaxonomyCache && Object.keys(onboardingTaxonomyCache).length > 0) {
        console.log('[Onboarding] Using cached taxonomy data, count:', Object.keys(onboardingTaxonomyCache).length);
        return;
    }

    console.log('[Onboarding] Loading taxonomy from database...');
    // Load from database and cache
    taxonomyLoadPromise = loadTaxonomyForOnboarding();
    await taxonomyLoadPromise;
    taxonomyLoadPromise = null;
    console.log('[Onboarding] Taxonomy load complete, cache has', Object.keys(onboardingTaxonomyCache).length, 'categories');
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

        console.log('[Onboarding] Raw taxonomy data from DB:', data);

        // Build taxonomy object indexed by ID with subcategories as array of names
        onboardingTaxonomyCache = {};
        data.forEach(category => {
            // Extract subcategory names from the nested response
            const subcategoryNames = (category.taxonomy_subcategories || []).map(sub => sub.name);
            console.log(`[Onboarding] Category "${category.id}" has ${subcategoryNames.length} subcategories:`, subcategoryNames);
            onboardingTaxonomyCache[category.id] = {
                id: category.id,
                category_id: category.category_id,
                name: category.name,
                subcategories: subcategoryNames
            };
        });

        console.log('[Onboarding] Taxonomy loaded from database, categories:', Object.keys(onboardingTaxonomyCache).length);

    } catch (error) {
        console.error('[Onboarding] Error loading taxonomy:', error);
    }
}

/**
 * Initialize the unified guided onboarding modal
 * skipAuth: if true, user is already logged in - skip steps 0, 0a and go straight to step 1
 * isReturningUser: if true, user chose "returning" but not yet logged in - show step 0, 0a then skip 3, 4
 */
async function initializeGuidedOnboarding(skipAuth = false, isReturningUser = false) {
    // CRITICAL: Ensure taxonomy is loaded before creating modal
    await ensureTaxonomyLoaded();
    
    const modal = document.createElement('div');
    modal.id = 'guided-onboarding-modal';

    // Build HTML with all steps
    modal.innerHTML = `
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

            <!-- STEP 1: Know what you need? -->
            <div class="onboarding-step ${skipAuth ? 'active' : ''}" data-step="1">
                <div class="step-content">
                    <div class="step-logo">
                        <img src="/rooted-vitality/assets/logo_trimmed.png" alt="Rooted Vitality" class="logo-image">
                    </div>
                    <div class="step-opening">
                        <h2>Welcome to Rooted Vitality</h2>
                        <p class="step-subtitle">We're so glad you're here. How would you like to get started?</p>
                    </div>

                    <div class="step-path-choice">
                        <button type="button" class="path-btn" id="path-direct">I know what I need</button>
                        <button type="button" class="path-btn" id="path-guided">I'm not sure what I need</button>
                    </div>

                    <div class="form-actions">
                        <button type="button" class="btn-secondary onboarding-back" style="display: none;">Back</button>
                    </div>
                </div>
            </div>

            <!-- STEP 1A: Direct path - Choose category -->
            <div class="onboarding-step" data-step="1a">
                <div class="step-content">
                    <div class="step-logo">
                        <img src="/rooted-vitality/assets/logo_trimmed.png" alt="Rooted Vitality" class="logo-image">
                    </div>
                    <div class="step-opening">
                        <h2>What are you looking for?</h2>
                        <p class="step-subtitle">Tell us about your wellness needs so we can find the right practitioner for you.</p>
                    </div>

                    <form id="step-1a-form" class="onboarding-form">
                        <!-- CATEGORY -->
                        <div class="form-group">
                            <label for="onboarding-category-direct">Wellness Category *</label>
                            <select id="onboarding-category-direct" name="category" required>
                                <option value="">Choose a category...</option>
                            </select>
                        </div>

                        <!-- SUBCATEGORY -->
                        <div class="form-group">
                            <label for="onboarding-subcategory-direct">Specific Concerns *</label>
                            <select id="onboarding-subcategory-direct" name="subcategory" required>
                                <option value="">Choose a specialty...</option>
                            </select>
                        </div>

                        <!-- DESCRIPTION -->
                        <div class="form-group">
                            <label for="onboarding-description-direct">Description / Notes *</label>
                            <textarea id="onboarding-description-direct" name="description" placeholder="Share what's going on..." rows="4" maxlength="1000" required></textarea>
                            <span class="form-hint"><span id="onboarding-char-count">0</span> / 1000 characters</span>
                        </div>

                        <!-- URGENCY -->
                        <div class="form-group">
                            <label>How Urgent? *</label>
                            <div class="options-grid">
                                <label class="option-card">
                                    <input type="radio" name="urgency" value="browsing" required>
                                    <div class="option-content">
                                        <span class="option-title">Just Browsing</span>
                                        <span class="option-desc">Exploring options, no rush</span>
                                    </div>
                                </label>
                                <label class="option-card">
                                    <input type="radio" name="urgency" value="interested" required>
                                    <div class="option-content">
                                        <span class="option-title">Interested</span>
                                        <span class="option-desc">Moderate priority</span>
                                    </div>
                                </label>
                                <label class="option-card">
                                    <input type="radio" name="urgency" value="urgent" required>
                                    <div class="option-content">
                                        <span class="option-title">Urgent</span>
                                        <span class="option-desc">Need help soon</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <!-- SESSION TYPE PREFERENCE -->
                        <div class="form-group">
                            <label>Session Type Preference *</label>
                            <div class="options-grid">
                                <label class="option-card">
                                    <input type="radio" name="travel_preference" value="in-person" required>
                                    <div class="option-content">
                                        <span class="option-title">In-Person</span>
                                        <span class="option-desc">Visit practitioner's office</span>
                                    </div>
                                </label>
                                <label class="option-card">
                                    <input type="radio" name="travel_preference" value="house-call" required>
                                    <div class="option-content">
                                        <span class="option-title">House Calls</span>
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

                        <!-- LOCATION -->
                        <fieldset class="form-fieldset">
                            <legend>Location</legend>
                            
                            <div class="form-group">
                                <label for="onboarding-street">Street Address</label>
                                <input type="text" id="onboarding-street" name="street">
                            </div>

                            <div class="form-group">
                                <label for="onboarding-city">City *</label>
                                <input type="text" id="onboarding-city" name="city" required>
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label for="onboarding-state">State *</label>
                                    <input type="text" id="onboarding-state" name="state" maxlength="2" required>
                                </div>

                                <div class="form-group">
                                    <label for="onboarding-zipcode-direct">Zip Code *</label>
                                    <input type="text" id="onboarding-zipcode-direct" name="zipcode" maxlength="5" required>
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

            <!-- STEP 2B: Guided path - Tell us about it (questionnaire disguised) -->
            <!-- STEP 1B: Guided path - Full taxonomy picker with search -->
            <div class="onboarding-step" data-step="1b">
                <div class="step-content">
                    <div class="step-logo">
                        <img src="/rooted-vitality/assets/logo_trimmed.png" alt="Rooted Vitality" class="logo-image">
                    </div>
                    <div class="step-opening">
                        <h2>We're so excited you're here!</h2>
                        <p class="step-subtitle">You've already taken the biggest, most beautiful step just by showing up. We're so proud of you. Now, let's find exactly what your precious body needs.</p>
                    </div>

                    <form id="step-1b-form" class="onboarding-form">
                        <!-- SYMPTOMS/DESCRIPTION -->
                        <div class="form-group">
                            <label for="guided-symptoms">Tell us what's happening with you</label>
                            <p class="form-helper">Don't worry about being perfect—just let it flow. This is a safe space, and everything you share will help your practitioner understand exactly how to support you.</p>
                            <textarea id="guided-symptoms" name="symptoms" placeholder="Share what's going on..." rows="4" maxlength="1000" required></textarea>
                            <span class="form-hint"><span id="guided-symptoms-count">0</span> / 1000 characters</span>
                        </div>

                        <!-- CATEGORY PICKER WITH SEARCH -->
                        <div class="form-group">
                            <label for="guided-category-search">What type of healing are you drawn to?</label>
                            <p class="form-helper">Pick one main healing path below, then choose as many specific focuses as you want within it. There are no wrong answers—trust what feels right.</p>
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
                            <p class="form-helper">Check as many as you want. Your practitioner will see all of these and know exactly what you need.</p>
                            <div id="guided-subcategories-list" class="subcategories-list">
                                <!-- Subcategory checkboxes injected by JS -->
                            </div>
                        </div>

                        <!-- URGENCY -->
                        <div class="form-group">
                            <label>What does your timeline feel like right now?</label>
                            <p class="form-helper">There's no rush—we'll match you with someone amazing whenever you're ready.</p>
                            <div class="options-grid">
                                <label class="option-card">
                                    <input type="radio" name="urgency" value="browsing" required>
                                    <div class="option-content">
                                        <span class="option-title">Just Exploring</span>
                                        <span class="option-desc">I'm dreaming and discovering</span>
                                    </div>
                                </label>
                                <label class="option-card">
                                    <input type="radio" name="urgency" value="interested" required>
                                    <div class="option-content">
                                        <span class="option-title">I'm Ready</span>
                                        <span class="option-desc">This really matters to me</span>
                                    </div>
                                </label>
                                <label class="option-card">
                                    <input type="radio" name="urgency" value="urgent" required>
                                    <div class="option-content">
                                        <span class="option-title">I Need This Now</span>
                                        <span class="option-desc">My body's calling for help</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <!-- SESSION TYPE PREFERENCE -->
                        <div class="form-group">
                            <label>How do you prefer to receive care?</label>
                            <p class="form-helper">Pick whichever option makes you feel most comfortable and safe. Your space, their space, or yours on screen—it's all good.</p>
                            <div class="options-grid">
                                <label class="option-card">
                                    <input type="radio" name="travel_preference" value="in-person" required>
                                    <div class="option-content">
                                        <span class="option-title">In Their Sacred Space</span>
                                        <span class="option-desc">I'll travel to them</span>
                                    </div>
                                </label>
                                <label class="option-card">
                                    <input type="radio" name="travel_preference" value="house-call" required>
                                    <div class="option-content">
                                        <span class="option-title">In My Sanctuary</span>
                                        <span class="option-desc">They come to my space</span>
                                    </div>
                                </label>
                                <label class="option-card">
                                    <input type="radio" name="travel_preference" value="virtual" required>
                                    <div class="option-content">
                                        <span class="option-title">Through the Screen</span>
                                        <span class="option-desc">From my cozy home</span>
                                    </div>
                                </label>
                                <label class="option-card">
                                    <input type="radio" name="travel_preference" value="flexible" required>
                                    <div class="option-content">
                                        <span class="option-title">I'm Flexible</span>
                                        <span class="option-desc">I'm open to any option</span>
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
                            <label for="onboarding-confirmEmail">Confirm email *</label>
                            <input type="email" id="onboarding-confirmEmail" name="confirmEmail" placeholder="Confirm your email" required>
                        </div>

                        <div class="form-group">
                            <label for="onboarding-password">Create a password *</label>
                            <div class="password-input-container">
                                <input type="password" id="onboarding-password" name="password" placeholder="At least 6 characters" required>
                                <button type="button" class="password-toggle" id="toggle-password-3" aria-label="Show/hide password">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                </button>
                            </div>
                            <small class="form-hint">Minimum 6 characters required</small>
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
                            <p><strong>Urgency:</strong> <span id="confirm-urgency">Not specified</span></p>

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

    // Add to DOM
    const existing = document.getElementById('guided-onboarding-modal');
    if (existing) existing.remove();
    document.body.appendChild(modal);

    // Debug: Check data availability
    console.log('[Onboarding] Before populateCategoryDropdowns:');
    console.log('[Onboarding] - typeof taxonomyData:', typeof taxonomyData);
    console.log('[Onboarding] - taxonomyData keys:', typeof taxonomyData !== 'undefined' ? Object.keys(taxonomyData).length : 'undefined');
    console.log('[Onboarding] - onboardingTaxonomyCache keys:', onboardingTaxonomyCache ? Object.keys(onboardingTaxonomyCache).length : 'null');

    // IMMEDIATELY populate all category dropdowns from loaded taxonomy
    populateCategoryDropdowns();

    // Inject styles
    injectOnboardingStyles();

    // Setup all event listeners
    setupOnboardingEventListeners(isReturningUser);
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

    console.log('[Onboarding] populateCategoryDropdowns called with data:', data ? Object.keys(data).length + ' categories' : 'NO DATA');

    if (!data || Object.keys(data).length === 0) {
        console.warn('[Onboarding] No taxonomy data available to populate dropdowns');
        return;
    }

    // Step 1a direct form dropdown
    const step1aSelect = document.getElementById('onboarding-category-direct');
    if (step1aSelect) {
        console.log('[Onboarding] Populating Step 1a dropdown...');
        step1aSelect.innerHTML = '<option value="">Choose a category...</option>';
        Object.entries(data).forEach(([id, category]) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = category.name;
            step1aSelect.appendChild(option);
        });
        console.log('[Onboarding] Step 1a dropdown populated with', Object.keys(data).length, 'categories');
    } else {
        console.log('[Onboarding] Step 1a dropdown element not found');
    }

    // Step 1b/returning form dropdown (if it exists)
    const step1bSelect = document.getElementById('returning-category');
    if (step1bSelect) {
        console.log('[Onboarding] Populating Step 1b dropdown...');
        step1bSelect.innerHTML = '<option value="">Choose a category...</option>';
        Object.entries(data).forEach(([id, category]) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = category.name;
            step1bSelect.appendChild(option);
        });
        console.log('[Onboarding] Step 1b dropdown populated');
    }
}

/**
 * Inject onboarding styles from external CSS file
 */
function injectOnboardingStyles() {
    if (document.getElementById('onboarding-modal-styles')) {
        return; // Already injected
    }

    const link = document.createElement('link');
    link.id = 'onboarding-modal-styles';
    link.rel = 'stylesheet';
    link.href = '/rooted-vitality/styles/onboarding-modal.css';
    document.head.appendChild(link);
}

/**
 * Setup all event listeners for the onboarding modal
 * isReturningUser: if true, user is returning/logged in - skip steps 3 and 4
 */
function setupOnboardingEventListeners(isReturningUser = false) {
    const modal = document.getElementById('guided-onboarding-modal');
    
    // Load existing data from localStorage or start fresh
    let onboardingData = JSON.parse(localStorage.getItem('rooted-onboarding-data')) || { path: null };
    
    // Function to save data to localStorage after each step
    const saveLocalData = () => {
        localStorage.setItem('rooted-onboarding-data', JSON.stringify(onboardingData));
    };

    // ====== SETUP: Category Picker for Step 1b ======
    setupCategoryPickerForStep1b();

    // ====== SETUP: Character counters ======
    const guidedSymptomsTextarea = document.getElementById('guided-symptoms');
    if (guidedSymptomsTextarea) {
        guidedSymptomsTextarea.addEventListener('input', (e) => {
            const count = e.target.value.length;
            const countDisplay = document.getElementById('guided-symptoms-count');
            if (countDisplay) {
                countDisplay.textContent = count;
            }
        });
    }

    const directDescriptionTextarea = document.getElementById('onboarding-description-direct');
    if (directDescriptionTextarea) {
        directDescriptionTextarea.addEventListener('input', (e) => {
            const count = e.target.value.length;
            const countDisplay = document.getElementById('onboarding-char-count');
            if (countDisplay) {
                countDisplay.textContent = count;
            }
        });
    }

    // ====== SETUP: Password reveal toggle buttons ======
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

    // Close button
    modal.querySelector('.onboarding-close-btn').addEventListener('click', () => {
        closeOnboardingModal();
    });

    // Overlay does NOT close the modal - only X button or completing onboarding closes it

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
        loginForm.addEventListener('submit', handleLoginSubmit);
        const switchLink = loginForm.querySelector('.login-switch-link');
        if (switchLink) {
            switchLink.addEventListener('click', (e) => {
                e.preventDefault();
                goToStep(1);
            });
        }
    }

    // ====== STEP 1: Path choice (Know what you need or not?) ======
    document.getElementById('path-direct').addEventListener('click', () => {
        onboardingData.path = 'direct';
        goToStep('1a');
    });

    document.getElementById('path-guided').addEventListener('click', () => {
        onboardingData.path = 'guided';
        goToStep('1b');
    });

    // ====== STEP 1A: Direct category selection ======
    const categoryDirect = document.getElementById('onboarding-category-direct');
    categoryDirect.addEventListener('change', (e) => {
        const categoryId = e.target.value;
        const subSelect = document.getElementById('onboarding-subcategory-direct');
        
        if (!subSelect) return;
        
        subSelect.innerHTML = '<option value="">Choose a specialty...</option>';
        
        if (categoryId) {
            // Use global if available, otherwise use cache
            const data = (typeof taxonomyData !== 'undefined' && Object.keys(taxonomyData).length > 0) 
                ? taxonomyData 
                : onboardingTaxonomyCache;
            
            const category = data ? data[categoryId] : null;
            if (category && category.subcategories && category.subcategories.length > 0) {
                category.subcategories.forEach(subName => {
                    const option = document.createElement('option');
                    option.value = subName;
                    option.textContent = subName;
                    subSelect.appendChild(option);
                });
            }
        }
    });

    document.getElementById('step-1a-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const category = document.getElementById('onboarding-category-direct').value;
        if (!category) {
            window.showAlertModal('Please select a category');
            return;
        }
        onboardingData.category = category;
        onboardingData.subcategory = document.getElementById('onboarding-subcategory-direct').value || null;
        onboardingData.travel_preference = document.querySelector('input[name="travel_preference"]:checked')?.value || null;
        onboardingData.urgency = document.querySelector('input[name="urgency"]:checked')?.value || null;
        onboardingData.currentPath = '1a';
        saveLocalData();
        goToStep(2);
    });

    // ====== STEP 1B: Guided path with category picker ======
    document.getElementById('step-1b-form').addEventListener('submit', (e) => {
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

        // Store all guided path data
        onboardingData.category = category;
        onboardingData.description = symptoms;
        onboardingData.subcategory = selectedSubcategories;
        onboardingData.urgency = urgency;
        onboardingData.travel_preference = travelPref;
        onboardingData.currentPath = '1b';
        saveLocalData();

        // All users go to Step 2 (client profile questions)
        goToStep(2);


    });

    // ====== STEP 2: Client profile questions ======
    document.getElementById('step-2-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Capture all client profile answers
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
        
        // Check if user is already authenticated - if so, skip Steps 3 & 4 and go to Step 5
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (session) {
            console.log('[Onboarding] Authenticated user detected at Step 2, skipping Steps 3 & 4 to Step 5');
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
            saveLocalData();
            goToStep(5);
            return;
        }
        
        // ALL new users go to Step 3 (signup) after Step 2
        // Authenticated users already skipped above and went to Step 5
        goToStep(3);
    });

    // ====== STEP 3: Signup (name, email, password) ======
    document.getElementById('step-3-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Check if user is already authenticated - if so, skip signup and go to step 5
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (session) {
            console.log('[Onboarding] Authenticated user detected in Step 3, skipping to Step 5');
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
                    console.log('[Onboarding] User already authenticated:', session.user.email);
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
                    console.log('[Onboarding] User signed up:', authData.user.email);
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
                    window.showAlertModal('Please select your urgency level (Interested, Somewhat Urgent, Very Urgent, or Need Immediately)');
                    step5NextBtn.disabled = false;
                    step5NextBtn.textContent = 'Find my matches';
                    return;
                }

                // ========== STEP 1: SAVE CLIENT PROFILE FIRST ==========
                console.log('[Onboarding Step 5] STARTING - First, save client profile questionnaire');
                
                // First, try to restore from localStorage if not in memory
                if (!onboardingData.clientProfile) {
                    loadLocalData();
                    console.log('[Onboarding] Restored clientProfile from localStorage:', onboardingData.clientProfile);
                }
                
                let profileSaveSucceeded = false;
                if (onboardingData.userId) {
                    console.log('[Onboarding] Step 1: Attempting to save client profile for user:', onboardingData.userId);
                    console.log('[Onboarding] clientProfile object:', onboardingData.clientProfile);
                    
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
                        
                        console.log('[Onboarding] Profile data to insert:', profileData);
                        
                        try {
                            const { data: profileInsertData, error: profileError } = await window.supabaseClient
                                .from('client_profiles')
                                .insert(profileData)
                                .select();

                            if (profileError) {
                                console.error('[Onboarding] Client profile insert error:', profileError);
                                console.error('[Onboarding] Error code:', profileError.code);
                                console.error('[Onboarding] Error message:', profileError.message);
                                console.error('[Onboarding] Error details:', profileError.details);
                                // CONTINUE ANYWAY - do not throw, we want to save project even if profile fails
                            } else {
                                console.log('[Onboarding] ✅ CLIENT PROFILE SAVED SUCCESSFULLY');
                                console.log('[Onboarding] Profile ID:', profileInsertData[0]?.id);
                                profileSaveSucceeded = true;
                            }
                        } catch (err) {
                            console.error('[Onboarding] Exception during profile insert:', err);
                            // CONTINUE ANYWAY
                        }
                    } else {
                        console.warn('[Onboarding] No actual client profile data to save - all fields are empty');
                    }
                } else {
                    console.warn('[Onboarding] No userId found in onboardingData');
                }

                // ========== STEP 2: NOW CREATE PROJECT ==========
                console.log('[Onboarding Step 5] PROCEEDING - Now create project with full details');
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

                // Get raw values from form (NO VALIDATION - just like my-projects.js does)
                let travelPref = document.querySelector('input[name="travel_preference"]:checked')?.value || onboardingData.travel_preference;
                let urgency = document.querySelector('input[name="urgency"]:checked')?.value || onboardingData.urgency;

                // Validate travel_preference is one of the allowed values
                const validTravelPrefs = ['in-person', 'housecalls', 'virtual', 'flexible'];
                if (travelPref && !validTravelPrefs.includes(travelPref)) {
                    console.warn('[Onboarding] Invalid travel_preference:', travelPref, 'Valid options:', validTravelPrefs);
                    travelPref = null;
                }

                // Validate urgency is one of the allowed values
                const validUrgencies = ['interested', 'somewhat_urgent', 'very_urgent', 'need_immediately'];
                if (urgency && !validUrgencies.includes(urgency)) {
                    console.warn('[Onboarding] Invalid urgency:', urgency, 'Valid options:', validUrgencies);
                    urgency = null;
                }

                console.log('[Onboarding] Raw form values - travelPref:', travelPref, 'urgency:', urgency);
                console.log('[Onboarding] From onboardingData - travelPref:', onboardingData.travel_preference, 'urgency:', onboardingData.urgency);
                
                // Don't map - send raw values
                const mappedTravelPref = travelPref;
                const mappedUrgency = urgency;
                
                console.log('[Onboarding] Using unmapped - travelPref:', mappedTravelPref, 'urgency:', mappedUrgency);

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
                    travel_preference: mappedTravelPref || null,
                    urgency: mappedUrgency,
                    client_first_name: onboardingData.firstName || null,
                    client_last_name: onboardingData.lastName || null
                };

                console.log('[Onboarding] FULL Project insert data:', projectInsertData);
                console.log('[Onboarding] travel_preference type:', typeof projectInsertData.travel_preference, 'value:', JSON.stringify(projectInsertData.travel_preference));
                console.log('[Onboarding] urgency type:', typeof projectInsertData.urgency, 'value:', JSON.stringify(projectInsertData.urgency));

                // Create project with ALL required fields
                const insertObject = {
                    ...projectInsertData,
                    project_status: 'pending',
                    client_open_to_contact: true,
                    start_date: new Date().toISOString().split('T')[0]
                };
                console.log('[Onboarding] EXACT insert object being sent:', JSON.stringify(insertObject, null, 2));

                // Create project with ALL required fields - use array format like my-projects.js
                const { data: projectData, error: projectError } = await window.supabaseClient
                    .from('projects')
                    .insert([insertObject])
                    .select();

                if (projectError) {
                    console.error('[Onboarding] Project insert error:', projectError);
                    console.error('[Onboarding] Error code:', projectError.code);
                    console.error('[Onboarding] Error message:', projectError.message);
                    console.error('[Onboarding] Error details:', projectError.details);
                    throw projectError;
                }

                console.log('[Onboarding] ✅ PROJECT CREATED SUCCESSFULLY');
                console.log('[Onboarding] Project created:', projectData[0].id);
                onboardingData.projectId = projectData[0].id;

                // ========== STEP 3: LOAD MATCHES ==========
                console.log('[Onboarding Step 5] FINAL STEP - Load matches and advance to Step 6');
                step5NextBtn.textContent = 'Finding matches...';

                // Load and show matches before going to Step 6
                await loadMatchesForOnboarding(onboardingData);
                console.log('[Onboarding] ✅ MATCHES LOADED');
                
                // Log summary
                console.log('[Onboarding] ========== COMPLETION SUMMARY ==========');
                console.log('[Onboarding] ✅ Client Profile:', profileSaveSucceeded ? 'SAVED' : 'SKIPPED/FAILED (see logs)');
                console.log('[Onboarding] ✅ Project: CREATED with ID', onboardingData.projectId);
                console.log('[Onboarding] ✅ Matches: LOADED');
                console.log('[Onboarding] =========================================');
                
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

    // ====== STEP 6: Matches ======
    document.getElementById('save-for-later-btn').addEventListener('click', () => {
        closeOnboardingModal();
        window.showAlertModal('Your project has been created. Explore practitioners anytime from your dashboard.');
        setTimeout(() => {
            window.location.href = '/rooted-vitality/dashboard/client/pages/dashboard.html';
        }, 500);
    });

    document.getElementById('continue-browsing-btn').addEventListener('click', () => {
        closeOnboardingModal();
        window.location.href = `/rooted-vitality/dashboard/client/pages/find-practitioners.html?project=${onboardingData.projectId}`;
    });

    // Back buttons
    modal.querySelectorAll('.onboarding-back').forEach(btn => {
        btn.addEventListener('click', handleBackButton);
    });

    function goToStep(stepNumber) {
        modal.querySelectorAll('.onboarding-step').forEach(step => {
            step.classList.remove('active');
        });
        
        const selector = typeof stepNumber === 'string' 
            ? `[data-step="${stepNumber}"]` 
            : `[data-step="${stepNumber}"]`;
        modal.querySelector(selector).classList.add('active');

        // Populate Step 5 project confirmation details
        if (stepNumber === 5 || stepNumber === '5') {
            const confirmCat = modal.querySelector('#confirm-category');
            const confirmSubcat = modal.querySelector('#confirm-subcategory');
            const confirmZipcode = modal.querySelector('#confirm-zipcode');
            const confirmTravel = modal.querySelector('#confirm-travel');
            const confirmUrgency = modal.querySelector('#confirm-urgency');

            // Get category name from taxonomy data
            let categoryName = 'Not selected';
            // Use global if available, otherwise use cache
            const data = (typeof taxonomyData !== 'undefined' && Object.keys(taxonomyData).length > 0) 
                ? taxonomyData 
                : onboardingTaxonomyCache;
            if (onboardingData.category && data && data[onboardingData.category]) {
                categoryName = data[onboardingData.category].name;
            }

            if (confirmCat) confirmCat.textContent = categoryName;
            
            // Subcategory handling - can be array or string
            let subcategoryDisplay = '(Not specified)';
            if (onboardingData.subcategory) {
                if (Array.isArray(onboardingData.subcategory)) {
                    subcategoryDisplay = onboardingData.subcategory.join(', ');
                } else {
                    subcategoryDisplay = onboardingData.subcategory;
                }
            }
            if (confirmSubcat) confirmSubcat.textContent = subcategoryDisplay;
            
            // Location - try to get from signup (step 3) or step 1a
            const zipcode = onboardingData.zipcode || 'Not provided';
            if (confirmZipcode) confirmZipcode.textContent = zipcode;
            
            // Travel preference
            const travelPref = onboardingData.travel_preference || 'Not specified';
            const travelDisplay = travelPref.charAt(0).toUpperCase() + travelPref.slice(1).replace(/_/g, ' ');
            if (confirmTravel) confirmTravel.textContent = travelDisplay;
            
            // Urgency
            const urgency = onboardingData.urgency || 'Not specified';
            const urgencyDisplay = urgency.charAt(0).toUpperCase() + urgency.slice(1);
            if (confirmUrgency) confirmUrgency.textContent = urgencyDisplay;
        }

        // Update progress bar (Total numeric steps: 0, 0a, 1, 1a/1b, 2, 3, 4, 5, 6 = 7 main steps)
        let progressPercent;
        if (stepNumber === '0' || stepNumber === 0) {
            progressPercent = (1 / 7) * 100;
        } else if (stepNumber === '0a') {
            progressPercent = (1 / 7) * 100; // Still at same level as Step 0
        } else if (typeof stepNumber === 'string') {
            progressPercent = (3 / 7) * 100; // 1a or 1b
        } else {
            progressPercent = ((stepNumber + 1) / 7) * 100;
        }
        modal.querySelector('.progress-fill').style.width = progressPercent + '%';

        // Scroll to top
        const stepContent = modal.querySelector('.onboarding-step.active .step-content');
        if (stepContent) {
            stepContent.scrollTop = 0;
        }
    }

    function handleBackButton() {
        const currentStep = modal.querySelector('.onboarding-step.active').dataset.step;
        
        if (currentStep === '0') {
            closeOnboardingModal();
        } else if (currentStep === '0a') {
            goToStep(0);
        } else if (currentStep === '1') {
            const loginStep = modal.querySelector('[data-step="0"]');
            if (loginStep) {
                goToStep(0);
            } else {
                closeOnboardingModal();
            }
        } else if (currentStep === '1a' || currentStep === '1b') {
            goToStep(1);
        } else if (currentStep === '2') {
            // Go back to whichever path user took (1a or 1b)
            const previousPath = onboardingData.currentPath || '1a';
            goToStep(previousPath);
        } else if (currentStep === '3') {
            goToStep(2);
        } else if (currentStep === '4') {
            // Check if this is an authenticated user - if so, they should have gone straight from 2 to 5, so this shouldn't happen
            // But if they're here, go back to step 2
            goToStep(2);
        } else if (currentStep === '5') {
            // Back from Step 5: 
            // - If authenticated user (has userId but came from Step 2), go back to Step 2
            // - If new user who went through Step 3-4, go back to Step 4
            if (onboardingData.userId && !onboardingData.signupCompleted) {
                // Authenticated user - skip back to step 2
                goToStep(2);
            } else {
                // New user - go back to step 4
                goToStep(4);
            }
        } else if (currentStep === '6') {
            goToStep(5);
        } else {
            const stepNum = parseInt(currentStep);
            if (stepNum > 1) {
                goToStep(stepNum - 1);
            }
        }
    }
}

/**
 * Save onboarding data to database after verification step completed
 * This creates the client account and saves their profile information
 * Project details are saved later at Step 5 confirmation
 */
async function saveToDatabaseAfterVerification(onboardingData) {
    try {
        // TODO: Implement database save
        // 1. Create entry in clients table with signup info (firstName, lastName, email, password, age, sex, address, city, state, zipcode, phone, dob)
        // 2. Create entry in client_profiles table with profile questionnaire answers
        // 3. Return clientId for use in project creation
        console.log('Saving to database:', onboardingData);
        
        // For now, just store clientId in onboardingData
        // onboardingData.clientId = response.clientId;
        
        // Clear localStorage after successful save
        clearOnboardingLocalStorage();
        
    } catch (error) {
        console.error('Error saving to database:', error);
        window.showAlertModal('Error creating account. Please try again.');
        throw error;
    }
}

/**
 * Handle login form submission
 */
async function handleLoginSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('step-login-email').value.trim();
    const password = document.getElementById('step-login-password').value;

    if (!email || !password) {
        window.showAlertModal('Please fill in all fields');
        return;
    }

    try {
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in...';

        const { data: authData, error: authError } = await window.supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (authError) throw authError;

        console.log('[Onboarding] User signed in:', authData.user.email);

        closeOnboardingModal();
        await initializeReturningMemberFlow();

    } catch (error) {
        console.error('[Onboarding] Login error:', error);
        window.showAlertModal('Login failed: ' + error.message);
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign in';
    }
}

/**
 * Initialize returning member flow (signed-in user)
 */
async function initializeReturningMemberFlow() {
    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        const { data: clientData } = await window.supabaseClient
            .from('clients')
            .select('first_name')
            .eq('id', user.id)
            .single();

        const firstName = clientData?.first_name || 'Friend';

        const modal = document.createElement('div');
        modal.id = 'returning-member-modal';
        modal.innerHTML = `
            <div class="onboarding-overlay"></div>
            <div class="onboarding-modal">
                <button class="onboarding-close-btn" aria-label="Close" title="Close">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div class="returning-welcome">
                <div class="welcome-logo">
                    <img src="./assets/logo_trimmed.png" alt="Rooted Vitality" class="welcome-logo-image">
                </div>
                    <h1>Welcome back, ${firstName}</h1>
                    <p>You're here to start something new. Let's make it beautiful.</p>
                </div>

                <div class="step-content returning-member-content">
                    <form id="returning-project-form" class="onboarding-form">
                        <div class="form-section">
                            <h2>What's calling to you now?</h2>
                            <p class="form-description">Every season brings new healing work. Tell us what you're ready to explore.</p>

                            <div class="form-group">
                                <label for="returning-category">What area of wellness speaks to you? *</label>
                                <select id="returning-category" name="category" required>
                                    <option value="">Choose a category...</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="returning-symptoms">Tell us what's happening in your world *</label>
                                <textarea 
                                    id="returning-symptoms" 
                                    name="symptoms" 
                                    placeholder="What's shifted? What do you want to heal or explore this time?" 
                                    rows="5"
                                    required
                                ></textarea>
                                <p class="form-hint">We're here to listen.</p>
                            </div>

                            <div class="form-group">
                                <label for="returning-goals">What does healing look like for you?</label>
                                <textarea 
                                    id="returning-goals" 
                                    name="goals" 
                                    placeholder="What do you hope to shift, experience, or become?" 
                                    rows="3"
                                ></textarea>
                            </div>
                        </div>

                        <div class="form-section">
                            <h3>How do you want to connect?</h3>
                            <p class="form-description">You know what works best for you. Choose your path.</p>

                            <div class="form-group checkbox-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="returning-auto-match" name="autoMatch" checked>
                                    <span>Let me see who matches my energy</span>
                                    <small>We'll suggest practitioners we think get your vibe</small>
                                </label>
                            </div>

                            <div class="form-group checkbox-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="returning-explore" name="explore">
                                    <span>I want to browse and choose</span>
                                    <small>Look through practitioners and reach out to the ones calling to you</small>
                                </label>
                            </div>
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn-secondary returning-cancel">Close</button>
                            <button type="submit" class="btn-primary">Begin this journey</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        const existing = document.getElementById('returning-member-modal');
        if (existing) existing.remove();
        document.body.appendChild(modal);

        injectOnboardingStyles();

        // Event listeners
        modal.querySelector('.onboarding-close-btn').addEventListener('click', closeReturningMemberModal);
        modal.querySelector('.onboarding-overlay').addEventListener('click', closeReturningMemberModal);
        modal.querySelector('.returning-cancel').addEventListener('click', closeReturningMemberModal);

        document.getElementById('returning-project-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            const category = document.getElementById('returning-category').value;
            const symptoms = document.getElementById('returning-symptoms').value;
            const goals = document.getElementById('returning-goals').value;
            const autoMatch = document.getElementById('returning-auto-match').checked;

            if (!category || !symptoms) {
                window.showAlertModal('Please fill in required fields');
                return;
            }

            try {
                const submitBtn = e.target.querySelector('button[type="submit"]');
                submitBtn.disabled = true;
                submitBtn.textContent = 'Creating your journey...';

                const { data: projectData, error: projectError } = await window.supabaseClient
                    .from('projects')
                    .insert({
                        user_id: user.id,
                        category_id: category,
                        description: symptoms,
                        goals: goals || null,
                        status: 'active',
                        created_at: new Date().toISOString()
                    })
                    .select();

                if (projectError) throw projectError;

                console.log('[Onboarding] Project created:', projectData[0].id);

                closeReturningMemberModal();
                window.showAlertModal(`Welcome back, ${firstName}!\n\nYour project has been created.`);

                if (autoMatch) {
                    setTimeout(() => {
                        window.location.href = `/rooted-vitality/dashboard/client/pages/find-practitioners.html?project=${projectData[0].id}&auto=true`;
                    }, 500);
                } else {
                    setTimeout(() => {
                        window.location.href = `/rooted-vitality/dashboard/client/pages/find-practitioners.html?project=${projectData[0].id}`;
                    }, 500);
                }

            } catch (error) {
                console.error('[Onboarding] Error creating project:', error);
                window.showAlertModal('Error: ' + error.message);
                const submitBtn = e.target.querySelector('button[type="submit"]');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Begin this journey';
            }
        });

    } catch (error) {
        console.error('[Onboarding] Error initializing returning member flow:', error);
        window.showAlertModal('Error loading welcome experience');
    }
}

function closeReturningMemberModal() {
    const modal = document.getElementById('returning-member-modal');
    if (modal) {
        modal.style.animation = 'slideOut 0.3s ease-out forwards';
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

/**
 * Load matches for new user
 */
async function loadMatchesForOnboarding(onboardingData) {
  try {
    const container = document.getElementById('matches-container');
    if (!container) return;

    // Get current user for client serial
    const currentUser = window.authManager?.getCurrentUser();
    if (!currentUser) {
      console.error('[Onboarding] Not authenticated');
      container.innerHTML = '<p class="loading" style="color: #d32f2f;">Error: Not authenticated</p>';
      return;
    }

    // Get client serial
    const { data: clientData, error: clientError } = await window.supabaseClient
      .from('clients')
      .select('serial_number, first_name')
      .eq('id', currentUser.id)
      .single();

    if (clientError || !clientData) {
      console.error('[Onboarding] Could not find client:', clientError);
      container.innerHTML = '<p class="loading" style="color: #d32f2f;">Error loading client data</p>';
      return;
    }

    // Call matching algorithm RPC with project ID
    const { data: matchData, error: matchError } = await window.supabaseClient
      .rpc('match_practitioners', { p_project_id: onboardingData.projectId });

    if (matchError) {
      console.error('[Onboarding] Matching error:', matchError);
      container.innerHTML = '<p class="loading" style="color: #d32f2f;">Error loading matches</p>';
      return;
    }

    console.log('[Onboarding] Raw matchData from RPC:', matchData);

    // Get top 3 matches sorted by match_score (descending)
    const topMatches = (matchData || [])
      .sort((a, b) => (b.match_score || 0) - (a.match_score || 0))
      .slice(0, 3);
    
    console.log('[Onboarding] Top matches after sort:', topMatches);

    if (topMatches.length === 0) {
      container.innerHTML = '<p class="loading">No matching practitioners found. You can browse all practitioners in the dashboard.</p>';
      return;
    }

    // Fetch profile data for all matches (including logo and profile info)
    const serialNumbers = topMatches.map(m => m.serial_number);
    
    const { data: practitionerData, error: practError } = await window.supabaseClient
      .from('practitioners')
      .select('id, serial_number, legal_business_name, dba_name')
      .in('serial_number', serialNumbers);

    if (practError) {
      console.warn('[Onboarding] Error fetching practitioner data:', practError);
    }

    // Fetch practitioner profiles for logos
    const { data: profileData, error: profileError } = await window.supabaseClient
      .from('practitioner_profiles')
      .select('practitioner_serial, practice_logo_url, modalities')
      .in('practitioner_serial', serialNumbers);

    if (profileError) {
      console.warn('[Onboarding] Error fetching practitioner profiles:', profileError);
      console.log('[Onboarding] Profile error details:', profileError.message);
    }
    
    console.log('[Onboarding] Profile data fetched:', profileData);

    // Fetch reviews for ratings
    const { data: reviewsData, error: reviewError } = await window.supabaseClient
      .from('reviews')
      .select('practitioner_serial, rating')
      .in('practitioner_serial', serialNumbers);

    if (reviewError) {
      console.warn('[Onboarding] Error fetching reviews:', reviewError);
    }

    // Create lookup maps
    const practMap = {};
    practitionerData?.forEach(p => {
      practMap[p.serial_number] = p;
    });

    const profileMap = {};
    profileData?.forEach(p => {
      profileMap[p.practitioner_serial] = p;
    });

    const reviewMap = {};
    reviewsData?.forEach(r => {
      if (!reviewMap[r.practitioner_serial]) {
        reviewMap[r.practitioner_serial] = { count: 0, totalRating: 0 };
      }
      reviewMap[r.practitioner_serial].count += 1;
      reviewMap[r.practitioner_serial].totalRating += (r.rating || 0);
    });

    // Render matches with real data
    container.innerHTML = topMatches.map(match => {
      const practitioner = practMap[match.serial_number];
      const profile = profileMap[match.serial_number];
      // Use DBA name first, then legal name, then fallback
      let displayName = practitioner?.dba_name || practitioner?.legal_business_name || 'Practitioner';
      // Replace hyphens with spaces for display
      displayName = displayName.replace(/-/g, ' ');
      const logoUrl = profile?.practice_logo_url;
      const specialty = (profile?.modalities || []).join(', ') || 'Wellness Services';
      const reviews = reviewMap[match.serial_number];
      const avgRating = reviews ? (reviews.totalRating / reviews.count).toFixed(1) : 0;
      const reviewCount = reviews?.count || 0;
      
      console.log('[Onboarding] Rendering match card:', {
        serial_number: match.serial_number,
        match_score: match.match_score,
        displayName: displayName,
        logoUrl: logoUrl,
        specialty: specialty
      });
      
      // Create avatar: use logo if available, otherwise use initials
      const avatarHtml = logoUrl 
        ? `<img src="${logoUrl}" alt="${displayName}" class="match-avatar-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='block'">`
        : '';
      const initialsHtml = logoUrl 
        ? `<div class="match-avatar-initials" style="display:none;">${displayName.charAt(0)}</div>`
        : `<div class="match-avatar-initials">${displayName.charAt(0)}</div>`;

      return `
        <div class="match-card" data-practitioner-serial="${match.serial_number}" data-practitioner-id="${practitioner?.id}">
          <div class="match-header">
            <div class="match-avatar">
              ${avatarHtml}
              ${initialsHtml}
            </div>
            <div class="match-info">
              <h3>${displayName}</h3>
              <p class="match-specialty">${specialty}</p>
              <p class="match-rating">★${avgRating} (${reviewCount} reviews)</p>
            </div>
            <div class="match-score">${match.match_score}% match</div>
          </div>
          <div class="match-actions">
            <button class="btn-secondary match-view-profile" data-practitioner-serial="${match.serial_number}" data-practitioner-id="${practitioner?.id}">View Profile</button>
            <button class="btn-primary match-connect" data-practitioner-serial="${match.serial_number}" data-practitioner-id="${practitioner?.id}" data-match-score="${match.match_score}">Send Request</button>
          </div>
        </div>
      `;
    }).join('');

    // View Profile button - navigate to practitioner profile
    container.querySelectorAll('.match-view-profile').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const practitionerId = btn.dataset.practitionerId;
        const projectId = onboardingData.projectId;
        if (practitionerId) {
          window.location.href = `/rooted-vitality/dashboard/pro/pages/practitioner-profile.html?id=${practitionerId}&project_id=${projectId}`;
        }
      });
    });

    // Send Match Request button
    container.querySelectorAll('.match-connect').forEach(btn => {
      console.log('[Onboarding] Attaching match-connect listener - button dataset:', btn.dataset);
      console.log('[Onboarding] practitionerSerial from dataset:', btn.dataset.practitionerSerial);
      console.log('[Onboarding] Button HTML:', btn.outerHTML);
      
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const practitionerSerial = btn.dataset.practitionerSerial; // Keep as text (P1, P2, etc)
        const matchScore = parseInt(btn.dataset.matchScore);
        const displayName = btn.closest('.match-card')?.querySelector('.match-info h3')?.textContent || 'Practitioner';
        
        console.log('[Onboarding] Match connect clicked - practitionerSerial:', practitionerSerial, 'type:', typeof practitionerSerial);
        console.log('[Onboarding] Button dataset:', btn.dataset);
        
        try {
          btn.disabled = true;
          btn.textContent = 'Sending...';

          // Get project data
          const { data: projectData, error: projectError } = await window.supabaseClient
            .from('projects')
            .select('id, project_serial, client_serial')
            .eq('id', onboardingData.projectId)
            .single();

          if (projectError || !projectData) {
            throw new Error('Project not found');
          }

          console.log('[Onboarding] Creating match with:', { 
            project_serial: projectData.project_serial, 
            client_serial: projectData.client_serial, 
            practitioner_serial: practitionerSerial,
            match_score: matchScore
          });

          // Create match directly in table (same approach as "Save for Later")
          const { data: matchResult, error: matchCreateError } = await window.supabaseClient
            .from('project_practitioner_matches')
            .insert({
              project_serial: parseInt(projectData.project_serial),
              client_serial: projectData.client_serial,
              practitioner_serial: practitionerSerial,
              match_score: matchScore,
              status: 'pending',
              client_initiated: true,
              matched_at: new Date().toISOString()
            })
            .select();

          if (matchCreateError) {
            console.error('[Onboarding] Match creation error:', matchCreateError);
            throw matchCreateError;
          }

          console.log('[Onboarding] ✅ Match created:', matchResult);

          // Create notification for practitioner
          const { data: practitionerInfo, error: practError } = await window.supabaseClient
            .from('practitioners')
            .select('id, serial_number, legal_name')
            .eq('serial_number', practitionerSerial)
            .single();

          if (practitionerInfo && !practError) {
            const clientName = onboardingData.firstName || 'New Client';
            const { error: notifError } = await window.supabaseClient
              .from('practitioner_notifications')
              .insert({
                practitioner_serial: practitionerInfo.serial_number,
                type: 'match_new',
                title: `New Match: ${clientName}`,
                message: `${clientName} has matched with you!`,
                is_read: false,
                created_at: new Date().toISOString()
              });

            if (notifError) {
              console.warn('[Onboarding] Notification creation warning:', notifError);
            }
          }

          // Show pending modal
          showPendingMatchModal(displayName);
          
          // Close onboarding after brief delay
          setTimeout(() => {
            closeOnboardingModal();
            setTimeout(() => {
              window.location.href = '/rooted-vitality/dashboard/client/pages/my-matches.html';
            }, 300);
          }, 1500);

        } catch (error) {
          console.error('[Onboarding] Error sending match request:', error);
          window.showAlertModal('Error sending request: ' + (error?.message || 'Unknown error'));
          btn.disabled = false;
          btn.textContent = 'Send Request';
        }
      });
    });

  } catch (error) {
    console.error('[Onboarding] Error loading matches:', error);
    document.getElementById('matches-container').innerHTML = '<p class="loading" style="color: #d32f2f;">Error loading matches</p>';
  }
}

/**
 * Show modal explaining match request is pending practitioner acceptance
 */
function showPendingMatchModal(practitionerName) {
  const modal = document.createElement('div');
  modal.className = 'pending-match-modal';
  modal.innerHTML = `
    <div class="pending-match-overlay"></div>
    <div class="pending-match-content">
      <div class="pending-match-icon">
        <img src="./assets/logo_trimmed.png" alt="Rooted Vitality" class="pending-match-logo">
      </div>
      <h2>Request Sent!</h2>
      <p>Your connection request has been sent to <strong>${practitionerName}</strong>.</p>
      <p style="font-size: 14px; color: #666; margin-top: 12px;">They'll review your profile and get back to you soon. You'll receive a notification when they respond.</p>
    </div>
  `;
  document.body.appendChild(modal);
  
  // Auto-remove after 2 seconds
  setTimeout(() => {
    modal.remove();
  }, 2000);
}

/**
 * Setup category picker with search and subcategories for Step 1b
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
        'massage': 'Let your body release what it\'s holding'
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
                const description = categoryDescriptions[cat.id] || 'A path to wellness';
                return `
                    <div class="category-card" data-category-id="${cat.id}" data-category-name="${cat.name}">
                        <h4>${cat.name}</h4>
                        <p>${description}</p>
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

    // Render subcategories as checkboxes
    function renderSubcategories(subcategories) {
        subcategoriesList.innerHTML = subcategories
            .map((subName, idx) => `
                <label class="checkbox-label">
                    <input type="checkbox" value="${subName}" name="subcategory" data-index="${idx}">
                    <span class="checkbox-text">${subName}</span>
                </label>
            `).join('');
    }

    // Search handler
    searchInput.addEventListener('input', (e) => {
        renderCategories(e.target.value);
    });

    // Initial render
    renderCategories();
}

function closeOnboardingModal() {
    const modal = document.getElementById('guided-onboarding-modal');
    if (modal) {
        modal.style.animation = 'slideOut 0.3s ease-out forwards';
        setTimeout(() => {
            modal.remove();
            // NOTE: Do NOT clear localStorage here - user might close by accident
            // localStorage is cleared only after successful account creation
        }, 300);
    }
}

/**
 * Restore form values from localStorage
 * Called when a user navigates back or reopens the modal
 */
function restoreFormValuesFromLocalStorage() {
    const data = JSON.parse(localStorage.getItem('rooted-onboarding-data'));
    if (!data) return;

    // Restore Step 1a fields if they exist
    if (data.category) {
        const categorySelect = document.getElementById('onboarding-category-direct');
        if (categorySelect) categorySelect.value = data.category;
    }

    // Restore Step 1b fields if they exist
    if (data.description) {
        const descInput = document.getElementById('guided-symptoms');
        if (descInput) descInput.value = data.description;
    }

    // Restore Step 2 fields if they exist
    if (data.clientProfile) {
        if (data.clientProfile.wellnessGoals) {
            const field = document.getElementById('wellness-goals');
            if (field) field.value = data.clientProfile.wellnessGoals;
        }
        if (data.clientProfile.duration) {
            const field = document.getElementById('duration');
            if (field) field.value = data.clientProfile.duration;
        }
        // ... etc for other client profile fields
    }

    // Restore Step 3 fields if they exist
    if (data.firstName) {
        const field = document.getElementById('onboarding-firstName');
        if (field) field.value = data.firstName;
    }
    if (data.lastName) {
        const field = document.getElementById('onboarding-lastName');
        if (field) field.value = data.lastName;
    }
    if (data.dob) {
        const field = document.getElementById('onboarding-dob-signup');
        if (field) field.value = data.dob;
    }
    if (data.sex) {
        const field = document.getElementById('onboarding-sex');
        if (field) field.value = data.sex;
    }
    if (data.email) {
        const field = document.getElementById('onboarding-email');
        if (field) field.value = data.email;
    }
    if (data.street) {
        const field = document.getElementById('onboarding-street-signup');
        if (field) field.value = data.street;
    }
    if (data.city) {
        const field = document.getElementById('onboarding-city-signup');
        if (field) field.value = data.city;
    }
    if (data.state) {
        const field = document.getElementById('onboarding-state-signup');
        if (field) field.value = data.state;
    }
    if (data.zipcode) {
        const field = document.getElementById('onboarding-zipcode-signup');
        if (field) field.value = data.zipcode;
    }
}

/**
 * Clear localStorage after successful account creation
 * Call this after Step 4 verification is complete and account is created
 */
function clearOnboardingLocalStorage() {
    localStorage.removeItem('rooted-onboarding-data');
}

// Export
window.initializeOnboarding = initializeOnboarding;
window.openGuidedOnboarding = () => initializeGuidedOnboarding();
window.autoOpenOnboardingOnFirstVisit = () => {
    if (window.supabaseClient) {
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
