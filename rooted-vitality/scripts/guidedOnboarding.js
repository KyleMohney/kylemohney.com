/**
 * ============================================
 * GUIDED ONBOARDING MODAL
 * ============================================
 * Feminine energy, hand-held onboarding experience
 * 4-step process for new user signup + project creation
 */

/**
 * Wellness categories with keywords for auto-detection
 */
const WELLNESS_CATEGORIES = [
    {
        id: 'acupuncture',
        name: 'Acupuncture & Traditional Chinese Medicine',
        keywords: ['acupuncture', 'needles', 'qi', 'chi', 'meridians', 'energy flow', 'tcm', 'chinese medicine', 'pain relief'],
        subcategories: ['Pain Management', 'Energy Balance', 'Stress Relief', 'Women\'s Health', 'Fertility']
    },
    {
        id: 'nutrition',
        name: 'Nutrition & Functional Medicine',
        keywords: ['nutrition', 'diet', 'eating', 'food', 'digestive', 'gut health', 'supplements', 'functional medicine', 'nutrient'],
        subcategories: ['Nutrition Counseling', 'Digestive Health', 'Functional Medicine', 'Detox Support', 'Supplements']
    },
    {
        id: 'yoga_movement',
        name: 'Yoga & Movement',
        keywords: ['yoga', 'pilates', 'exercise', 'movement', 'flexibility', 'strength', 'mobility', 'stretching', 'alignment'],
        subcategories: ['Hatha Yoga', 'Vinyasa Yoga', 'Yin Yoga', 'Pilates', 'Dance Movement']
    },
    {
        id: 'energy_healing',
        name: 'Energy Healing & Reiki',
        keywords: ['reiki', 'energy', 'chakra', 'aura', 'vibration', 'frequency', 'healing', 'spiritual'],
        subcategories: ['Reiki', 'Chakra Balancing', 'Crystal Healing', 'Sound Therapy', 'Energy Work']
    },
    {
        id: 'herbal',
        name: 'Herbal & Botanical Medicine',
        keywords: ['herbal', 'herbs', 'botanical', 'plants', 'remedies', 'tinctures', 'tea', 'adaptogenic'],
        subcategories: ['Western Herbalism', 'Chinese Herbal Medicine', 'Ayurvedic Herbs', 'Adaptogenic Support']
    },
    {
        id: 'mental_wellness',
        name: 'Mental Wellness & Coaching',
        keywords: ['anxiety', 'stress', 'depression', 'mental health', 'emotional', 'counseling', 'coaching', 'mindfulness', 'meditation'],
        subcategories: ['Life Coaching', 'Meditation', 'Mindfulness', 'Emotional Support', 'Stress Management']
    },
    {
        id: 'massage_bodywork',
        name: 'Massage & Bodywork',
        keywords: ['massage', 'massage therapy', 'bodywork', 'soft tissue', 'therapeutic touch', 'swedish massage', 'deep tissue', 'myofascial'],
        subcategories: ['Swedish Massage', 'Deep Tissue', 'Thai Massage', 'Shiatsu', 'Myofascial Release']
    },
    {
        id: 'naturopath',
        name: 'Naturopathic Medicine',
        keywords: ['naturopath', 'naturopathic', 'natural remedy', 'holistic', 'whole body', 'preventative care'],
        subcategories: ['Naturopathic Consultation', 'Preventative Care', 'Natural Remedies', 'Lifestyle Coaching']
    }
];

/**
 * Detect category and subcategory from user symptoms
 */
function detectCategoryFromSymptoms(symptoms) {
    const symptomsLower = symptoms.toLowerCase();
    let bestMatch = null;
    let highestScore = 0;

    WELLNESS_CATEGORIES.forEach(category => {
        let score = 0;
        category.keywords.forEach(keyword => {
            if (symptomsLower.includes(keyword)) {
                score += 10;
            }
        });

        if (score > highestScore) {
            highestScore = score;
            bestMatch = category;
        }
    });

    return bestMatch || WELLNESS_CATEGORIES[0]; // Default to first if no match
}

/**
 * Show initial choice modal - are they new or returning?
 */
function showOnboardingChoice() {
    const modal = document.createElement('div');
    modal.id = 'onboarding-choice-modal';
    modal.innerHTML = `
        <div class="onboarding-overlay"></div>
        <div class="onboarding-choice-content">
            <button class="onboarding-close-btn" aria-label="Close" title="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>

            <div class="choice-content">
                <div class="choice-logo">
                    <img src="/rooted-vitality/assets/logo_trimmed.png" alt="Rooted Vitality" class="logo-image">
                </div>
                <h1>Welcome to Rooted Vitality</h1>
                <p>Every journey starts somewhere. Let's find yours.</p>

                <div class="choice-buttons">
                    <button class="choice-btn new-user-btn" id="new-user-choice">
                        <span class="choice-title">First time here?</span>
                        <span class="choice-desc">Let's help you start your wellness journey</span>
                    </button>
                    <button class="choice-btn returning-user-btn" id="returning-user-choice">
                        <span class="choice-title">Welcome back!</span>
                        <span class="choice-desc">Sign in to your account</span>
                    </button>
                </div>

                <p class="choice-hint">You can switch between these anytime</p>
            </div>
        </div>
    `;

    if (document.getElementById('onboarding-choice-modal')) {
        document.getElementById('onboarding-choice-modal').remove();
    }
    document.body.appendChild(modal);

    // Inject choice modal styles
    injectChoiceModalStyles();

    // Setup event listeners
    const closeBtn = modal.querySelector('.onboarding-close-btn');
    closeBtn.addEventListener('click', () => {
        closeChoiceModal();
    });

    modal.querySelector('.onboarding-overlay').addEventListener('click', () => {
        closeChoiceModal();
    });

    document.getElementById('new-user-choice').addEventListener('click', () => {
        closeChoiceModal();
        // Show new user signup flow
        initializeGuidedOnboarding();
    });

    document.getElementById('returning-user-choice').addEventListener('click', () => {
        closeChoiceModal();
        // Show returning user login in unified modal
        initializeGuidedOnboarding(true); // true = show login first
    });
}

/**
 * Inject choice modal styles
 */
function injectChoiceModalStyles() {
    if (document.getElementById('choice-modal-styles')) {
        return;
    }

    const styles = document.createElement('style');
    styles.id = 'choice-modal-styles';
    styles.textContent = `
        #onboarding-choice-modal {
            position: fixed;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            z-index: 9999;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            inset: 0;
        }

        .onboarding-choice-content {
            position: relative;
            background: #fbf7ec;
            border-radius: 24px;
            width: 90%;
            max-width: 600px;
            box-shadow: 0 40px 60px rgba(0, 0, 0, 0.2), 0 0 40px rgba(119, 136, 62, 0.1);
            animation: slideIn 0.5s cubic-bezier(0.23, 1, 0.320, 1);
            z-index: 10000;
        }

        .choice-content {
            padding: 3rem 2rem;
            text-align: center;
        }

        .choice-logo {
            margin-bottom: 1.5rem;
            display: flex;
            justify-content: center;
        }

        .logo-image {
            height: 60px;
            width: auto;
            object-fit: contain;
        }

        .choice-content h1 {
            font-size: 2rem;
            font-weight: 700;
            color: #2c3e50;
            margin: 0 0 0.75rem;
            line-height: 1.2;
        }

        .choice-content > p:first-of-type {
            font-size: 1rem;
            color: #888;
            margin: 0 0 2rem;
            line-height: 1.5;
        }

        .choice-buttons {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin-bottom: 2rem;
        }

        @media (max-width: 600px) {
            .choice-buttons {
                grid-template-columns: 1fr;
            }
        }

        .choice-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.75rem;
            padding: 1.5rem;
            background: #fbf7ec;
            border: 2px solid #e0e0e0;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-family: inherit;
            font-size: 0.9rem;
        }

        .choice-btn:hover {
            border-color: #77883e;
            background: linear-gradient(135deg, rgba(119, 136, 62, 0.03) 0%, rgba(119, 136, 62, 0.01) 100%);
            transform: translateY(-2px);
        }

        .choice-title {
            font-weight: 600;
            color: #2c3e50;
            display: block;
        }

        .choice-desc {
            font-size: 0.8rem;
            color: #999;
            display: block;
            font-weight: 400;
        }

        .choice-hint {
            font-size: 0.85rem;
            color: #fbf7ec;
            margin: 0;
        }

        @media (max-width: 600px) {
            .onboarding-choice-content {
                width: 95%;
                border-radius: 16px;
            }

            .choice-content {
                padding: 2rem 1.5rem;
            }

            .choice-content h1 {
                font-size: 1.6rem;
            }

            .choice-emoji {
                font-size: 2.5rem;
            }
        }

        .onboarding-close-btn {
            position: absolute;
            top: 1.5rem;
            right: 1.5rem;
            background: transparent;
            border: none;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 10001;
            color: #77883e;
            transition: color 0.2s, transform 0.2s;
            padding: 0;
        }

        .onboarding-close-btn:hover {
            color: #5e6e30;
            transform: scale(1.1);
        }

        .onboarding-close-btn:active {
            transform: scale(0.95);
        }

        .onboarding-close-btn svg {
            width: 24px;
            height: 24px;
            stroke-width: 3;
        }
    `;

    document.head.appendChild(styles);
}

/**
 * Close choice modal
 */
function closeChoiceModal() {
    const modal = document.getElementById('onboarding-choice-modal');
    if (modal) {
        modal.style.animation = 'slideOut 0.3s ease-out forwards';
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

/**
 * Show login form for returning users
 */
/**
 * Initialize returning member special project creation flow
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
                <!-- Close Button -->
                <button class="onboarding-close-btn" aria-label="Close" title="Close">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <!-- Welcome Section -->
                <div class="returning-welcome">
                    <div class="welcome-heart">💚</div>
                    <h1>Welcome back, ${firstName}</h1>
                    <p>You're here to start something new. Let's make it beautiful.</p>
                </div>

                <!-- Project Creation Form -->
                <div class="step-content returning-member-content">
                    <form id="returning-project-form" class="onboarding-form">
                        <div class="form-section">
                            <h2>What's calling to you now?</h2>
                            <p class="form-description">Every season brings new healing work. Tell us what you're ready to explore.</p>

                            <div class="form-group">
                                <label for="returning-category">What area of wellness speaks to you? *</label>
                                <select id="returning-category" name="category" required>
                                    <option value="">�� What are you feeling drawn to? ��</option>
                                    ${WELLNESS_CATEGORIES.map(cat => `
                                        <option value="${cat.id}">${cat.name}</option>
                                    `).join('')}
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
                                <p class="form-hint">💚 We're here to listen.</p>
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
                            <button type="submit" class="btn-primary">Begin this journey ��</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        if (document.getElementById('returning-member-modal')) {
            document.getElementById('returning-member-modal').remove();
        }
        document.body.appendChild(modal);

        // Inject styles if not already there
        injectOnboardingStyles();
        injectReturningMemberStyles();

        // Setup event listeners for returning member flow
        setupReturningMemberListeners(user.id, firstName);

    } catch (error) {
        console.error('[Onboarding] Error initializing returning member flow:', error);
        window.showAlertModal('Error loading welcome experience. Please try again.');
    }
}

/**
 * Inject additional styles for returning member flow
 */
function injectReturningMemberStyles() {
    if (document.getElementById('returning-member-styles')) {
        return;
    }

    const styles = document.createElement('style');
    styles.id = 'returning-member-styles';
    styles.textContent = `
        .returning-welcome {
            text-align: center;
            padding: 3rem 2rem 2rem;
            background: linear-gradient(135deg, rgba(119, 136, 62, 0.05) 0%, rgba(196, 165, 123, 0.05) 100%);
            border-bottom: 1px solid #fbf7ec;
        }

        .welcome-heart {
            font-size: 3rem;
            margin-bottom: 1rem;
            animation: heartBeat 0.6s ease-out;
        }

        @keyframes heartBeat {
            0% {
                transform: scale(0.95);
                opacity: 0;
            }
            50% {
                transform: scale(1.1);
            }
            100% {
                transform: scale(1);
                opacity: 1;
            }
        }

        .returning-welcome h1 {
            font-size: 1.8rem;
            color: #2c3e50;
            margin: 0 0 0.5rem;
            font-weight: 600;
        }

        .returning-welcome p {
            color: #999;
            font-size: 1rem;
            margin: 0;
        }

        .returning-member-content {
            padding: 2rem;
            max-height: calc(90vh - 280px);
            overflow-y: auto;
        }

        .form-section {
            margin-bottom: 2.5rem;
            padding-bottom: 2.5rem;
            border-bottom: 1px solid #fbf7ec;
        }

        .form-section:last-child {
            margin-bottom: 0;
            padding-bottom: 0;
            border-bottom: none;
        }

        .form-section h2 {
            font-size: 1.4rem;
            color: #2c3e50;
            margin: 0 0 0.5rem;
            font-weight: 600;
        }

        .form-section h3 {
            font-size: 1.1rem;
            color: #2c3e50;
            margin: 0 0 0.5rem;
            font-weight: 600;
        }

        .form-description {
            color: #999;
            font-size: 0.95rem;
            margin: 0 0 1.5rem;
            line-height: 1.5;
        }

        .checkbox-group {
            margin-bottom: 1rem;
        }

        .checkbox-label {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            padding: 1rem;
            background: #fbf7ec;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
            user-select: none;
        }

        .checkbox-label:hover {
            border-color: #77883e;
            background: #fbf7ec;
        }

        .checkbox-label input[type="checkbox"] {
            width: 18px;
            height: 18px;
            cursor: pointer;
            accent-color: #77883e;
        }

        .checkbox-label span {
            font-weight: 500;
            color: #2c3e50;
            font-size: 0.95rem;
        }

        .checkbox-label small {
            color: #999;
            font-size: 0.85rem;
            font-weight: 400;
        }

        .checkbox-label input[type="checkbox"]:checked {
            accent-color: #77883e;
        }

        .returning-cancel {
            width: auto;
        }

        @media (max-width: 600px) {
            .returning-welcome {
                padding: 2rem 1.5rem 1.5rem;
            }

            .returning-welcome h1 {
                font-size: 1.5rem;
            }

            .welcome-heart {
                font-size: 2.5rem;
            }

            .returning-member-content {
                padding: 1.5rem;
                max-height: calc(95vh - 280px);
            }

            .form-section {
                margin-bottom: 1.5rem;
                padding-bottom: 1.5rem;
            }
        }
    `;

    document.head.appendChild(styles);
}

/**
 * Setup event listeners for returning member flow
 */
function setupReturningMemberListeners(userId, firstName) {
    const modal = document.getElementById('returning-member-modal');

    // Close button
    modal.querySelector('.onboarding-close-btn').addEventListener('click', () => {
        closeReturningMemberModal();
    });

    // Overlay click to close
    modal.querySelector('.onboarding-overlay').addEventListener('click', () => {
        closeReturningMemberModal();
    });

    // Cancel button
    modal.querySelector('.returning-cancel').addEventListener('click', () => {
        closeReturningMemberModal();
    });

    // Form submission
    document.getElementById('returning-project-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const category = document.getElementById('returning-category').value;
        const symptoms = document.getElementById('returning-symptoms').value;
        const goals = document.getElementById('returning-goals').value;
        const autoMatch = document.getElementById('returning-auto-match').checked;
        const explore = document.getElementById('returning-explore').checked;

        if (!category || !symptoms) {
            window.showAlertModal('Please tell us about your wellness needs');
            return;
        }

        try {
            const submitBtn = modal.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating your journey...';

            // Create project
            const { data: projectData, error: projectError } = await window.supabaseClient
                .from('projects')
                .insert({
                    user_id: userId,
                    category_id: category,
                    description: symptoms,
                    goals: goals || null,
                    status: 'active',
                    created_at: new Date().toISOString()
                })
                .select();

            if (projectError) throw projectError;

            console.log('[Onboarding] Project created:', projectData[0].id);

            // Show celebration
            showReturningMemberCelebration(firstName, () => {
                closeReturningMemberModal();

                // Route based on preference
                if (autoMatch) {
                    // Load matches and show them
                    window.location.href = `/rooted-vitality/dashboard/client/pages/find-practitioners.html?project=${projectData[0].id}&auto=true`;
                } else {
                    // Go to find practitioners to explore
                    window.location.href = `/rooted-vitality/dashboard/client/pages/find-practitioners.html?project=${projectData[0].id}`;
                }
            });

        } catch (error) {
            console.error('[Onboarding] Error creating project:', error);
            window.showAlertModal('Error creating project: ' + error.message);
            const submitBtn = modal.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Begin This Journey ��';
        }
    });
}

/**
 * Show celebration modal for returning member
 */
function showReturningMemberCelebration(firstName, callback) {
    const celebration = document.createElement('div');
    celebration.id = 'returning-celebration';
    celebration.innerHTML = `
        <div class="onboarding-overlay"></div>
        <div class="celebration-modal">
            <div class="celebration-content">
                <div class="celebration-emoji">��</div>
                <h2>We're so glad you're back, ${firstName}!</h2>
                <p>Your new wellness chapter is being created...</p>
                <p class="celebration-subtext">Get ready to meet practitioners who understand your journey 💚</p>
                <button class="btn-primary celebration-continue">Continue ��</button>
            </div>
        </div>
    `;

    document.body.appendChild(celebration);

    // Inject celebration styles
    injectCelebrationStyles();

    celebration.querySelector('.celebration-continue').addEventListener('click', () => {
        celebration.style.animation = 'slideOut 0.3s ease-out forwards';
        setTimeout(() => {
            celebration.remove();
            callback();
        }, 300);
    });
}

/**
 * Inject celebration modal styles
 */
function injectCelebrationStyles() {
    if (document.getElementById('celebration-styles')) {
        return;
    }

    const styles = document.createElement('style');
    styles.id = 'celebration-styles';
    styles.textContent = `
        #returning-celebration {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .celebration-modal {
            position: relative;
            background: #fbf7ec;
            border-radius: 20px;
            width: 90%;
            max-width: 500px;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
            animation: slideIn 0.4s ease-out;
        }

        .celebration-content {
            text-align: center;
            padding: 3rem 2rem;
        }

        .celebration-emoji {
            font-size: 4rem;
            margin-bottom: 1rem;
            animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
            0%, 100% {
                transform: translateY(0px);
            }
            50% {
                transform: translateY(-20px);
            }
        }

        .celebration-modal h2 {
            font-size: 1.6rem;
            color: #2c3e50;
            margin: 0 0 0.75rem;
            font-weight: 600;
        }

        .celebration-modal p {
            font-size: 1rem;
            color: #666;
            margin: 0.5rem 0;
            line-height: 1.5;
        }

        .celebration-subtext {
            color: #999;
            font-size: 0.95rem;
            margin-top: 1rem !important;
        }

        .celebration-continue {
            margin-top: 2rem;
            min-width: 200px;
        }

        @media (max-width: 600px) {
            .celebration-content {
                padding: 2rem 1.5rem;
            }

            .celebration-emoji {
                font-size: 3rem;
            }

            .celebration-modal h2 {
                font-size: 1.4rem;
            }
        }
    `;

    document.head.appendChild(styles);
}

/**
 * Close returning member modal
 */
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
 * Initialize guided onboarding modal
 * @param {boolean} showLoginFirst - If true, show login form first for returning users
 */
function initializeGuidedOnboarding(showLoginFirst = false) {
    const modal = document.createElement('div');
    modal.id = 'guided-onboarding-modal';
    modal.innerHTML = `
        <div class="onboarding-overlay"></div>
        <div class="onboarding-modal">
            <!-- Close Button -->
            <button class="onboarding-close-btn" aria-label="Close onboarding" title="Close onboarding">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>

            <!-- Progress Bar (subtle) -->
            <div class="onboarding-progress">
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
            </div>

            <!-- LOGIN STEP: Sign in (for returning users) -->
            <div class="onboarding-step ${showLoginFirst ? 'active' : ''}" data-step="0">
                <div class="step-content conversation-style">
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
                            <button type="button" class="btn-secondary onboarding-back" style="display: none;">�� Back</button>
                            <button type="submit" class="btn-primary">Sign in ��</button>
                        </div>

                        <p class="login-help">
                            New here? <a href="#" class="login-switch-link">Create an account instead</a>
                        </p>
                    </form>
                </div>
            </div>

            <!-- STEP 1: How do you want to get started? -->
            <div class="onboarding-step active" data-step="1">
                <div class="step-content conversation-style">
                    <div class="step-opening">
                        <h2>Welcome to Rooted Vitality</h2>
                        <p class="step-subtitle">We're so glad you're here. How would you like to get started?</p>
                    </div>

                    <div class="step-path-choice">
                        <button type="button" class="path-btn" id="path-direct">
                            <span class="path-title">I know what I need</span>
                            <span class="path-desc">I'm ready to choose my wellness category</span>
                        </button>
                        <button type="button" class="path-btn" id="path-guided">
                            <span class="path-title">I'm not sure what I need</span>
                            <span class="path-desc">Help me figure out what's right for me</span>
                        </button>
                    </div>

                    <div class="form-actions">
                        <button type="button" class="btn-secondary onboarding-back" style="display: none;">�� Back</button>
                    </div>
                </div>
            </div>

            <!-- STEP 2A: Direct path - Choose category & subcategory -->
            <div class="onboarding-step" data-step="2a">
                <div class="step-content conversation-style">
                    <div class="step-opening">
                        <h2>What are you looking for?</h2>
                        <p class="step-subtitle">Choose the wellness area that best matches your needs.</p>
                    </div>

                    <form id="step-2a-form" class="onboarding-form">
                        <div class="form-group">
                            <label for="onboarding-category-direct">Wellness Category *</label>
                            <select id="onboarding-category-direct" name="category" required>
                                <option value="">Choose a category...</option>
                                ${WELLNESS_CATEGORIES.map(cat => `
                                    <option value="${cat.id}">${cat.name}</option>
                                `).join('')}
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="onboarding-subcategory-direct">Specialty (optional)</label>
                            <select id="onboarding-subcategory-direct" name="subcategory">
                                <option value="">Choose a specialty...</option>
                            </select>
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn-secondary onboarding-back">�� Back</button>
                            <button type="submit" class="btn-primary onboarding-next">Continue ��</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- STEP 2B: Guided path - Tell us your symptoms -->
            <div class="onboarding-step" data-step="2b">
                <div class="step-content conversation-style">
                    <div class="step-opening">
                        <h2>Tell us what brought you here</h2>
                        <p class="step-subtitle">Share what's really going on. We'll match you with the right wellness area.</p>
                    </div>

                    <form id="step-2b-form" class="onboarding-form">
                        <div class="form-group">
                            <label for="onboarding-symptoms">What's happening in your body, mind, or spirit? *</label>
                            <textarea 
                                id="onboarding-symptoms" 
                                name="symptoms" 
                                placeholder="Share what's on your mind..." 
                                rows="6"
                                required
                            ></textarea>
                            <p class="form-hint">There's no 'right' answer here. Just your truth.</p>
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn-secondary onboarding-back">�� Back</button>
                            <button type="submit" class="btn-primary onboarding-next">Let's find your match ��</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- STEP 3: Confirmation of auto-detected category (guided path only) -->
            <div class="onboarding-step" data-step="3">
                <div class="step-content conversation-style">
                    <div class="step-opening">
                        <h2>Here's what we found</h2>
                        <p class="step-subtitle">Based on what you shared, we think this is the right fit for you.</p>
                    </div>

                    <div id="detected-match" class="detected-match-display">
                        <div class="match-info">
                            <p class="match-category"><strong>Category:</strong> <span id="detected-category"></span></p>
                            <p class="match-subcategory"><strong>Specialty:</strong> <span id="detected-subcategory"></span></p>
                        </div>
                    </div>

                    <div class="confirmation-actions">
                        <button type="button" class="btn-secondary" id="change-match-btn">That's not quite right</button>
                        <button type="button" class="btn-primary" id="confirm-match-btn">Yes, that's it ��</button>
                    </div>

                    <div class="form-actions">
                        <button type="button" class="btn-secondary onboarding-back">�� Back</button>
                    </div>
                </div>
            </div>

            <!-- STEP 5: Who are you? (name) -->
            <div class="onboarding-step" data-step="5">
                <div class="step-content conversation-style">
                    <div class="step-opening">
                        <h2>What's your name?</h2>
                        <p class="step-subtitle">So we know how to welcome you properly.</p>
                    </div>

                    <form id="step-5-form" class="onboarding-form">
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

                        <div class="form-actions">
                            <button type="button" class="btn-secondary onboarding-back">�� Back</button>
                            <button type="submit" class="btn-primary onboarding-next">Let's continue ��</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- STEP 6: Your email -->
            <div class="onboarding-step" data-step="6">
                <div class="step-content conversation-style">
                    <div class="step-opening">
                        <h2>Your email address</h2>
                        <p class="step-subtitle">We'll use this to create your account and send you important updates.</p>
                    </div>

                    <form id="step-6-form" class="onboarding-form">
                        <div class="form-group">
                            <label for="onboarding-email">Your email *</label>
                            <input type="email" id="onboarding-email" name="email" placeholder="you@email.com" required>
                        </div>

                        <div class="form-group">
                            <label for="onboarding-confirmEmail">Confirm it *</label>
                            <input type="email" id="onboarding-confirmEmail" name="confirmEmail" placeholder="Confirm your email" required>
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn-secondary onboarding-back">�� Back</button>
                            <button type="submit" class="btn-primary onboarding-next">Next ��</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- STEP 7: More details -->
            <div class="onboarding-step" data-step="7">
                <div class="step-content conversation-style">
                    <div class="step-opening">
                        <h2>A few more things</h2>
                        <p class="step-subtitle">So we can create your safe space and find the right fit for you.</p>
                    </div>

                    <form id="step-7-form" class="onboarding-form">
                        <div class="form-group">
                            <label for="onboarding-phone">Your phone number *</label>
                            <input type="tel" id="onboarding-phone" name="phone" placeholder="(555) 123-4567" required>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="onboarding-zipcode">Zip code *</label>
                                <input type="text" id="onboarding-zipcode" name="zipcode" placeholder="12345" required>
                            </div>
                            <div class="form-group">
                                <label for="onboarding-dob">Birthday *</label>
                                <input type="date" id="onboarding-dob" name="dob" required>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="onboarding-sex">How do you identify? *</label>
                            <select id="onboarding-sex" name="sex" required>
                                <option value="">-- Choose --</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Non-binary">Non-binary</option>
                                <option value="Prefer not to say">Prefer not to say</option>
                            </select>
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn-secondary onboarding-back">�� Back</button>
                            <button type="submit" class="btn-primary onboarding-next">Create account ��</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- STEP 8: Create password -->
            <div class="onboarding-step" data-step="8">
                <div class="step-content conversation-style">
                    <div class="step-opening">
                        <h2>Your password</h2>
                        <p class="step-subtitle">Keep your space secure. Make it something strong and memorable.</p>
                    </div>

                    <form id="step-8-form" class="onboarding-form">
                        <div class="form-group">
                            <label for="onboarding-password">Create a password *</label>
                            <input type="password" id="onboarding-password" name="password" placeholder="At least 6 characters" required>
                            <small class="form-helper">Minimum 6 characters required</small>
                        </div>

                        <div class="form-group">
                            <label for="onboarding-confirmPassword">Confirm it *</label>
                            <input type="password" id="onboarding-confirmPassword" name="confirmPassword" placeholder="Confirm password" required>
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn-secondary onboarding-back">�� Back</button>
                            <button type="submit" class="btn-primary onboarding-next">Let's go ��</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- STEP 9: Terms & Conditions -->
            <div class="onboarding-step" data-step="9">
                <div class="step-content conversation-style">
                    <div class="step-opening">
                        <h2>Before we connect you</h2>
                        <p class="step-subtitle">Here are a few important things to know about our community and how we work.</p>
                    </div>

                    <div class="verification-container">
                        <div class="terms-section">
                            <h3>What you should know</h3>

                            <div class="terms-scroll" id="terms-scroll-container">
                                <div class="terms-content">
                                    <h4>Our commitment to you</h4>
                                    
                                    <h5>We're not doctors</h5>
                                    <p>The practitioners in our community are talented holistic healers, but they're not medical doctors (unless their profile says so). Their work is valuable AND it's not a replacement for medical care.</p>
                                    
                                    <h5>Your healing journey is yours</h5>
                                    <p>You are the expert of your own body. Practitioners make suggestions; you decide what feels right. Please always consult with an MD before making significant health changes.</p>
                                    
                                    <h5>We're here to connect you</h5>
                                    <p>We work hard to vet every practitioner, but Rooted Vitality isn't responsible for their outcomes or practices. You're choosing who to work with, giving you full agency.</p>
                                    
                                    <h5>Everyone's healing path is unique</h5>
                                    <p>Results vary. What works for one person may not work the same for another. We encourage you to approach your wellness journey with openness and intentionality.</p>
                                    
                                    <h5>Your privacy and safety matter</h5>
                                    <p>Your information is HIPAA-protected and stays private. We don't sell your data. Period.</p>
                                </div>
                            </div>

                            <label class="terms-checkbox">
                                <input type="checkbox" id="terms-agreement" name="terms">
                                <span>I understand and I'm ready to begin.</span>
                            </label>
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn-secondary onboarding-back">�� Back</button>
                            <button type="button" class="btn-primary onboarding-next" id="step-9-next">Create account & continue ��</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- STEP 10: Your matches -->
            <div class="onboarding-step" data-step="10">
                <div class="step-content">
                    <div class="step-opening">
                        <h2>Meet practitioners matched for you</h2>
                        <p class="step-subtitle">We've found some excellent matches based on what you're looking for. Take your time exploring and trust your instincts.</p>
                    </div>

                    <div id="matches-container" class="matches-container">
                        <p class="loading">Finding the right matches for you...</p>
                    </div>

                    <div class="matches-actions">
                        <p class="action-help">Feel drawn to someone? Click "connect" to reach out. Want to explore more first? You can always come back later.</p>
                        
                        <div class="form-actions">
                            <button type="button" class="btn-secondary onboarding-action" id="save-for-later-btn">
                                I'll choose later
                            </button>
                            <button type="button" class="btn-primary onboarding-action" id="continue-browsing-btn">
                                Show me more
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add modal to DOM
    if (document.getElementById('guided-onboarding-modal')) {
        document.getElementById('guided-onboarding-modal').remove();
    }
    document.body.appendChild(modal);

    // Initialize styles
    injectOnboardingStyles();

    // Setup event listeners
    setupOnboardingListeners();
}

/**
 * Inject onboarding styles
 */
function injectOnboardingStyles() {
    if (document.getElementById('guided-onboarding-styles')) {
        return; // Already injected
    }

    const styles = document.createElement('style');
    styles.id = 'guided-onboarding-styles';
    styles.textContent = `
        /* Onboarding Modal Styles */
        #guided-onboarding-modal,
        #returning-member-modal,
        #returning-celebration {
            position: fixed;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            z-index: 9999;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            inset: 0;
        }

        .onboarding-overlay {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            background: rgba(0, 0, 0, 0.55);
            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
        }

        .onboarding-modal {
            position: relative;
            background: #fbf7ec;
            border-radius: 24px;
            width: 90%;
            max-width: 720px;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 40px 60px rgba(0, 0, 0, 0.2), 0 0 40px rgba(119, 136, 62, 0.1);
            overflow: hidden;
            animation: slideIn 0.5s cubic-bezier(0.23, 1, 0.320, 1);
            z-index: 10000;
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(40px) scale(0.95);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        @keyframes slideOut {
            from {
                opacity: 1;
                transform: translateY(0);
            }
            to {
                opacity: 0;
                transform: translateY(40px);
            }
        }

        /* Step opening styling - more warmth */
        .step-opening {
            text-align: center;
            margin-bottom: 2rem;
            padding: 1rem 0;
        }

        .step-content h2 {
            font-size: 2rem;
            font-weight: 700;
            color: #2c3e50;
            margin: 0 0 0.75rem;
            line-height: 1.2;
        }

        /* Path choice buttons */
        .step-path-choice {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin: 2rem 0;
        }

        .path-btn {
            padding: 1.5rem;
            border: 2px solid #e0e0e0;
            border-radius: 12px;
            background: #fbf7ec;
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: left;
        }

        .path-btn:hover {
            border-color: #77883e;
            background: #f9fbfa;
            transform: translateY(-2px);
            box-shadow: 0 8px 16px rgba(119, 136, 62, 0.1);
        }

        .path-title {
            display: block;
            font-size: 1.1rem;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 0.5rem;
        }

        .path-desc {
            display: block;
            font-size: 0.95rem;
            color: #888;
        }

        /* Detected match display */
        .detected-match-display {
            background: linear-gradient(135deg, rgba(119, 136, 62, 0.05) 0%, rgba(196, 165, 123, 0.05) 100%);
            border: 2px solid #e0e0e0;
            border-radius: 12px;
            padding: 2rem;
            margin: 2rem 0;
        }

        .match-info {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .match-category,
        .match-subcategory {
            margin: 0;
            font-size: 1.1rem;
            color: #2c3e50;
        }

        .match-category strong,
        .match-subcategory strong {
            color: #77883e;
            font-weight: 600;
        }

        /* Confirmation actions */
        .confirmation-actions {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin: 1.5rem 0;
        }

        .confirmation-actions button {
            padding: 0.875rem 1.5rem;
            border-radius: 8px;
            border: none;
            font-weight: 600;
            font-size: 0.95rem;
            cursor: pointer;
            transition: all 0.2s;
        }

        .confirmation-actions .btn-primary {
            background: linear-gradient(135deg, #77883e 0%, #5e6e30 100%);
            color: #fbf7ec;
        }

        .confirmation-actions .btn-primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(119, 136, 62, 0.3);
        }

        .confirmation-actions .btn-secondary {
            background: #fbf7ec;
            border: 2px solid #e0e0e0;
            color: #2c3e50;
        }

        .confirmation-actions .btn-secondary:hover {
            border-color: #77883e;
            color: #77883e;
        }

        /* Subdued labels - less "SaaS" */
        .form-group label {
            font-weight: 400 !important;
            color: #5c5c5c;
            font-size: 1.05rem;
            letter-spacing: -0.3px;
        }

        /* Softer form hints */
        .form-hint {
            font-size: 0.9rem !important;
            color: #a8a8a8;
            font-style: italic;
            margin-top: 0.75rem;
        }

        .section-description {
            color: #a8a8a8;
            font-size: 1rem;
            margin: 0 0 1rem;
        }

        /* Terms section styling */
        .terms-section {
            background: linear-gradient(135deg, rgba(119, 136, 62, 0.03) 0%, rgba(196, 165, 123, 0.03) 100%);
            border-radius: 12px;
            padding: 1.5rem;
            margin: 1.5rem 0;
        }

        .terms-section h3 {
            font-size: 1.2rem;
            font-weight: 600;
            color: #2c3e50;
            margin: 0 0 0.5rem;
        }

        /* Softer terms container */
        .terms-container {
            margin-top: 1rem;
        }

        .terms-scroll {
            border: 1px solid #fbf7ec !important;
            background: #fafbfa;
            font-size: 0.95rem !important;
            line-height: 1.7;
        }

        .terms-content h4 {
            color: #77883e !important;
            font-size: 1.1rem;
            margin: 0 0 1rem;
            font-weight: 600;
        }

        .terms-content h5 {
            color: #2c3e50 !important;
            font-weight: 600;
            font-size: 1rem;
            margin: 1.5rem 0 0.75rem;
        }

        .terms-content p {
            color: #666;
            margin: 0.75rem 0;
        }

        .terms-content ul {
            color: #666;
        }

        .terms-checkbox {
            margin-top: 1.5rem;
            padding: 1rem;
            background: #fbf7ec;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            user-select: none;
        }

        .terms-checkbox:hover {
            border-color: #77883e;
        }

        .terms-checkbox span {
            color: #2c3e50;
            font-weight: 400;
        }

        /* Match cards - make them feel personal */
        .match-card {
            border: 2px solid #fbf7ec !important;
            background: linear-gradient(135deg, #fafbfa 0%, #fbf7ec 100%);
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .match-card:hover {
            border-color: #77883e !important;
            transform: translateY(-2px);
            box-shadow: 0 12px 24px rgba(119, 136, 62, 0.15) !important;
        }

        .match-avatar {
            background: linear-gradient(135deg, #77883e 0%, #5e6e30 100%) !important;
        }

        .match-specialty {
            color: #77883e;
            font-weight: 500;
        }

        .match-description {
            color: #5c5c5c;
            line-height: 1.6;
        }

        /* Buttons - softer, warmer */
        .btn-primary {
            background: linear-gradient(135deg, #77883e 0%, #5e6e30 100%) !important;
            color: #fbf7ec !important;
            letter-spacing: -0.3px;
            font-weight: 500;
            box-shadow: 0 6px 20px rgba(119, 136, 62, 0.25) !important;
            border: none;
        }

        .btn-primary:hover {
            transform: translateY(-1px) !important;
            box-shadow: 0 8px 28px rgba(119, 136, 62, 0.35) !important;
        }

        .btn-secondary {
            background: #fbf7ec !important;
            border: 2px solid #fbf7ec !important;
            color: #5c5c5c;
            letter-spacing: -0.3px;
            font-weight: 500;
        }

        .btn-secondary:hover {
            border-color: #77883e !important;
            color: #77883e;
            background: #fafbfa !important;
        }

        /* Action help text */
        .action-help {
            color: #888;
            font-style: italic;
            font-size: 0.95rem;
            margin-top: 1.5rem;
            text-align: center;
        }

        .login-help {
            color: #888;
            font-size: 0.9rem;
            text-align: center;
            margin-top: 1.5rem;
        }

        .login-switch-link {
            color: #77883e;
            text-decoration: none;
            font-weight: 600;
            transition: color 0.2s;
        }

        .login-switch-link:hover {
            color: #5e6e30;
        }

        .onboarding-close-btn {
            position: absolute;
            top: 1.5rem;
            right: 1.5rem;
            background: transparent;
            border: none;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 1000;
            color: #77883e;
            transition: color 0.2s, transform 0.2s;
            padding: 0;
        }

        .onboarding-close-btn:hover {
            color: #5e6e30;
            transform: scale(1.1);
        }

        .onboarding-close-btn:active {
            transform: scale(0.95);
        }

        .onboarding-close-btn svg {
            width: 24px;
            height: 24px;
            stroke-width: 3;
        }

        /* Progress Indicator */
        .onboarding-progress {
            padding: 2rem 2rem 1rem;
            border-bottom: 1px solid #fbf7ec;
        }

        .progress-steps {
            display: flex;
            justify-content: space-between;
            margin-bottom: 1rem;
        }

        .progress-step {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
            color: #fbf7ec;
            transition: color 0.3s;
        }

        .progress-step.active,
        .progress-step.completed {
            color: #77883e;
        }

        .step-number {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: #fbf7ec;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 0.9rem;
            transition: all 0.3s;
        }

        .progress-step.active .step-number {
            background: #77883e;
            color: #fbf7ec;
        }

        .progress-step.completed .step-number {
            background: #77883e;
            color: #fbf7ec;
        }

        .step-label {
            font-size: 0.75rem;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .progress-bar {
            height: 4px;
            background: #fbf7ec;
            border-radius: 2px;
            overflow: hidden;
        }

        .progress-fill {
            height: 100%;
            background: #77883e;
            width: 25%;
            transition: width 0.4s ease;
        }

        /* Step Content */
        .onboarding-content {
            flex: 1;
            overflow-y: auto;
            padding: 2rem;
        }

        .onboarding-step {
            display: none;
            animation: fadeIn 0.3s ease-out;
        }

        .onboarding-step.active {
            display: block;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }

        .step-content {
            padding: 2rem;
            overflow-y: auto;
            max-height: calc(90vh - 180px);
        }

        .step-content h2 {
            font-size: 1.8rem;
            color: #2c3e50;
            margin: 0 0 0.5rem;
            font-weight: 600;
        }

        .step-subtitle {
            font-size: 1rem;
            color: #999;
            margin: 0 0 2rem;
            line-height: 1.5;
        }

        /* Form Styles */
        .onboarding-form {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }

        .form-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
        }

        @media (max-width: 600px) {
            .form-row {
                grid-template-columns: 1fr;
            }
        }

        .form-group label {
            font-weight: 500;
            color: #2c3e50;
            font-size: 0.95rem;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
            padding: 0.75rem;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 1rem;
            font-family: inherit;
            transition: border-color 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
            outline: none;
            border-color: #77883e;
            box-shadow: 0 0 0 3px rgba(119, 136, 62, 0.1);
        }

        .form-hint {
            font-size: 0.85rem;
            color: #999;
            margin-top: 0.5rem;
        }

        /* Button Styles */
        .btn-primary,
        .btn-secondary {
            padding: 0.875rem 1.5rem;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 0.95rem;
            cursor: pointer;
            transition: all 0.2s;
        }

        .btn-primary {
            background: linear-gradient(135deg, #77883e 0%, #5e6e30 100%);
            color: #fbf7ec;
            box-shadow: 0 4px 12px rgba(119, 136, 62, 0.3);
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(119, 136, 62, 0.4);
        }

        .btn-primary:active {
            transform: translateY(0);
        }

        .btn-secondary {
            background: #fbf7ec;
            border: 2px solid #e0e0e0;
            color: #2c3e50;
        }

        .btn-secondary:hover {
            background: #fbf7ec;
            border-color: #77883e;
            color: #77883e;
        }

        .form-actions {
            display: flex;
            gap: 1rem;
            margin-top: 2rem;
            justify-content: space-between;
        }

        .form-actions .btn-primary,
        .form-actions .btn-secondary {
            flex: 1;
        }

        /* Verification Container */
        .verification-container {
            display: flex;
            flex-direction: column;
            gap: 2rem;
        }

        .verification-card {
            background: #fbf7ec;
            padding: 1.5rem;
            border-radius: 12px;
            border-left: 4px solid #77883e;
        }

        .verification-card h3 {
            margin: 0 0 0.75rem;
            color: #2c3e50;
            font-size: 1.1rem;
        }

        .verification-card p {
            margin: 0.5rem 0;
            color: #666;
            font-size: 0.95rem;
        }

        .verification-status {
            font-weight: 500;
            color: #77883e;
            margin-top: 1rem !important;
        }

        .verification-resend {
            margin-top: 1rem;
        }

        /* Terms Container */
        .terms-container {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .terms-scroll {
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            height: 250px;
            overflow-y: scroll;
            padding: 1.5rem;
            background: #fbf7ec;
            font-size: 0.9rem;
            line-height: 1.6;
            color: #666;
        }

        .terms-content h4 {
            margin: 0 0 1rem;
            color: #2c3e50;
            font-size: 1rem;
        }

        .terms-content h5 {
            margin: 1.5rem 0 0.75rem;
            color: #2c3e50;
            font-size: 0.95rem;
        }

        .terms-content p {
            margin: 0.75rem 0;
        }

        .terms-content ul {
            margin: 0.75rem 0;
            padding-left: 1.5rem;
        }

        .terms-checkbox {
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
            cursor: pointer;
            user-select: none;
        }

        .terms-checkbox input {
            width: 20px;
            height: 20px;
            margin-top: 2px;
            cursor: pointer;
        }

        .terms-checkbox span {
            color: #666;
            font-size: 0.95rem;
            line-height: 1.4;
        }

        /* Matches Container */
        .matches-container {
            display: grid;
            gap: 1.5rem;
            margin: 2rem 0;
        }

        .match-card {
            background: #fbf7ec;
            border: 2px solid #e0e0e0;
            border-radius: 12px;
            padding: 1.5rem;
            transition: all 0.3s;
            cursor: pointer;
        }

        .match-card:hover {
            border-color: #77883e;
            box-shadow: 0 8px 16px rgba(119, 136, 62, 0.15);
        }

        .match-header {
            display: flex;
            gap: 1rem;
            margin-bottom: 1rem;
            align-items: flex-start;
        }

        .match-info {
            flex: 1;
        }

        .match-score {
            font-size: 0.85rem;
            font-weight: 600;
            color: #77883e;
            background: rgba(119, 136, 62, 0.08);
            padding: 0.5rem 1rem;
            border-radius: 20px;
            #fbf7ec-space: nowrap;
            text-align: right;
            min-width: 80px;
        }

        .match-avatar {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #77883e 0%, #5e6e30 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fbf7ec;
            font-weight: 600;
            font-size: 1.5rem;
            flex-shrink: 0;
        }

        .match-info h3 {
            margin: 0 0 0.25rem;
            color: #2c3e50;
            font-size: 1.1rem;
        }

        .match-specialty {
            color: #77883e;
            font-weight: 500;
            font-size: 0.9rem;
            margin: 0;
        }

        .match-description {
            color: #666;
            font-size: 0.95rem;
            line-height: 1.5;
            margin: 1rem 0;
        }

        .match-actions {
            display: flex;
            gap: 1rem;
        }

        .match-actions button {
            flex: 1;
            padding: 0.75rem;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.2s;
        }

        .match-actions .btn-primary {
            background: linear-gradient(135deg, #77883e 0%, #5e6e30 100%);
            color: #fbf7ec;
        }

        .match-actions .btn-secondary {
            background: #fbf7ec;
            border: 2px solid #e0e0e0;
            color: #2c3e50;
        }

        .matches-actions {
            margin-top: 2rem;
            padding-top: 2rem;
            border-top: 1px solid #fbf7ec;
        }

        .action-help {
            color: #999;
            font-size: 0.95rem;
            margin-bottom: 1.5rem;
            text-align: center;
        }

        .onboarding-action {
            width: 100%;
        }

        .matches-actions .form-actions {
            margin: 0;
        }

        .matches-actions .btn-primary,
        .matches-actions .btn-secondary {
            flex: 1;
        }

        /* Loading State */
        .loading {
            text-align: center;
            color: #999;
            padding: 2rem;
            font-style: italic;
        }

        /* Conversation Style - Single question focus */
        .conversation-style {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 400px;
        }

        .conversation-style .step-opening {
            margin-bottom: 2.5rem;
            animation: slideDown 0.4s ease-out;
        }

        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }



        .conversation-style h2 {
            font-size: 1.9rem;
            font-weight: 700;
            line-height: 1.1;
            color: #2c3e50;
        }

        .conversation-style .step-subtitle {
            font-size: 1.05rem;
            color: #888;
            font-weight: 400;
            line-height: 1.5;
            margin-top: 0.75rem;
        }

        .conversation-style .onboarding-form {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }

        .conversation-style .form-group {
            margin: 1rem 0;
        }

        .conversation-style .form-group label {
            font-size: 1.05rem;
            font-weight: 400;
            color: #5c5c5c;
            margin-bottom: 0.75rem;
        }

        .conversation-style input,
        .conversation-style select,
        .conversation-style textarea {
            font-size: 1rem;
            padding: 0.875rem;
            border-radius: 8px;
        }

        .conversation-style textarea {
            resize: vertical;
            min-height: 120px;
            font-family: inherit;
        }

        .conversation-style .form-hint {
            font-size: 0.9rem;
            color: #a8a8a8;
            margin-top: 0.5rem;
        }

        .conversation-style .form-actions {
            margin-top: 2rem;
            padding-top: 1.5rem;
            border-top: 1px solid #fbf7ec;
            gap: 1rem;
        }

        @media (max-width: 600px) {
            .onboarding-modal {
                width: 95%;
                max-height: 95vh;
                border-radius: 16px;
            }

            .step-content {
                padding: 1.5rem;
                max-height: calc(95vh - 180px);
            }

            .form-row {
                grid-template-columns: 1fr;
            }

            .form-actions {
                flex-direction: column;
            }

            .form-actions .btn-primary,
            .form-actions .btn-secondary {
                width: 100%;
            }

            .conversation-style h2 {
                font-size: 1.6rem;
            }

            /* Login form styling */
            #step-login-form {
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
            }

            #step-login-form .form-group {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }

            #step-login-form label {
                font-weight: 500;
                color: #2c3e50;
                font-size: 0.95rem;
            }

            #step-login-form input[type="email"],
            #step-login-form input[type="password"] {
                padding: 0.85rem;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                font-size: 1rem;
                font-family: inherit;
                transition: all 0.2s;
            }

            #step-login-form input[type="email"]:focus,
            #step-login-form input[type="password"]:focus {
                outline: none;
                border-color: #77883e;
                box-shadow: 0 0 0 3px rgba(119, 136, 62, 0.1);
            }

            .login-help {
                text-align: center;
                color: #999;
                font-size: 0.9rem;
                margin: 0.5rem 0 0;
            }

            .login-switch-link {
                color: #77883e;
                text-decoration: none;
                font-weight: 500;
                cursor: pointer;
                transition: color 0.2s;
            }

            .login-switch-link:hover {
                color: #4a7d5c;
                text-decoration: underline;
            }
        }
    `;

    document.head.appendChild(styles);
}

/**
 * Setup onboarding event listeners
 */
function setupOnboardingListeners() {
    const modal = document.getElementById('guided-onboarding-modal');
    const onboardingData = { path: null };

    // Close button
    modal.querySelector('.onboarding-close-btn').addEventListener('click', () => {
        closeOnboardingModal();
    });

    // Overlay click to close
    modal.querySelector('.onboarding-overlay').addEventListener('click', () => {
        closeOnboardingModal();
    });

    // LOGIN STEP (Step 0): Handle returning user login
    const loginForm = document.getElementById('step-login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('step-login-email').value.trim();
            const password = document.getElementById('step-login-password').value;

            if (!email || !password) {
                window.showAlertModal('Please fill in all fields');
                return;
            }

            try {
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                submitBtn.disabled = true;
                submitBtn.textContent = 'Signing in...';

                const { data: authData, error: authError } = await window.supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password
                });

                if (authError) {
                    throw authError;
                }

                console.log('[Onboarding] User signed in:', authData.user.email);

                // After successful login, show the returning member flow
                closeOnboardingModal();
                await initializeReturningMemberFlow();

            } catch (error) {
                console.error('[Onboarding] Login error:', error);
                window.showAlertModal('Login failed: ' + error.message);
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign in ��';
            }
        });

        // Switch to signup link
        const switchLink = loginForm.querySelector('.login-switch-link');
        if (switchLink) {
            switchLink.addEventListener('click', (e) => {
                e.preventDefault();
                goToStep('1');
            });
        }
    }

    // STEP 1: Path choice - "I know what I need" vs "I'm not sure what I need"
    document.getElementById('path-direct').addEventListener('click', () => {
        onboardingData.path = 'direct';
        goToStep('2a');
    });

    document.getElementById('path-guided').addEventListener('click', () => {
        onboardingData.path = 'guided';
        goToStep('2b');
    });

    // STEP 2A: Direct path - Choose category & subcategory
    const categorySelectDirect = document.getElementById('onboarding-category-direct');
    if (categorySelectDirect) {
        categorySelectDirect.addEventListener('change', (e) => {
            const categoryId = e.target.value;
            const subcategorySelect = document.getElementById('onboarding-subcategory-direct');
            subcategorySelect.innerHTML = '<option value="">Choose a specialty...</option>';
            
            if (categoryId) {
                const category = WELLNESS_CATEGORIES.find(c => c.id === categoryId);
                if (category && category.subcategories) {
                    category.subcategories.forEach(sub => {
                        const option = document.createElement('option');
                        option.value = sub.id;
                        option.textContent = sub.name;
                        subcategorySelect.appendChild(option);
                    });
                }
            }
        });
    }

    document.getElementById('step-2a-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const category = document.getElementById('onboarding-category-direct').value;
        const subcategory = document.getElementById('onboarding-subcategory-direct').value;
        
        if (!category) {
            window.showAlertModal('Please select a category');
            return;
        }

        onboardingData.category = category;
        onboardingData.subcategory = subcategory || null;
        goToStep(5); // Skip to name (direct path skips guided confirmation)
    });

    // STEP 2B: Guided path - Ask for symptoms
    document.getElementById('step-2b-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const symptoms = document.getElementById('onboarding-symptoms').value.trim();
        if (!symptoms) {
            window.showAlertModal('Please tell us what\'s happening');
            return;
        }
        
        onboardingData.symptoms = symptoms;
        
        // Auto-detect category and subcategory
        const detected = detectCategoryAndSubcategory(symptoms);
        onboardingData.category = detected.categoryId;
        onboardingData.subcategory = detected.subcategoryId;
        onboardingData.detectedCategoryName = detected.categoryName;
        onboardingData.detectedSubcategoryName = detected.subcategoryName;
        
        // Show confirmation
        document.getElementById('detected-category').textContent = detected.categoryName;
        document.getElementById('detected-subcategory').textContent = detected.subcategoryName || '(Not specified)';
        goToStep(3);
    });

    // STEP 3: Confirmation of auto-detected category (guided path only)
    document.getElementById('confirm-match-btn').addEventListener('click', () => {
        goToStep(5); // Proceed to name
    });

    document.getElementById('change-match-btn').addEventListener('click', () => {
        onboardingData.path = 'direct';
        goToStep('2a'); // Go back to direct choice
    });

    // STEP 5: First name
    document.getElementById('step-5-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const firstName = document.getElementById('onboarding-firstName').value.trim();
        const lastName = document.getElementById('onboarding-lastName').value.trim();
        if (!firstName || !lastName) {
            window.showAlertModal('Please enter your first and last name');
            return;
        }
        onboardingData.firstName = firstName;
        onboardingData.lastName = lastName;
        goToStep(6);
    });

    // STEP 6: Email
    document.getElementById('step-6-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('onboarding-email').value.trim();
        const confirmEmail = document.getElementById('onboarding-confirmEmail').value.trim();
        if (!email || !confirmEmail) {
            window.showAlertModal('Please enter your email');
            return;
        }
        if (email !== confirmEmail) {
            window.showAlertModal('Email addresses do not match');
            return;
        }
        onboardingData.email = email;
        goToStep(7);
    });

    // STEP 7: Additional details (phone, zipcode, birthday, identity)
    document.getElementById('step-7-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const phone = document.getElementById('onboarding-phone').value.trim();
        const zipcode = document.getElementById('onboarding-zipcode').value.trim();
        const dob = document.getElementById('onboarding-dob').value;
        const sex = document.getElementById('onboarding-sex').value;
        
        if (!phone || !zipcode || !dob || !sex) {
            window.showAlertModal('Please fill in all fields');
            return;
        }

        // Check age
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

        onboardingData.phone = phone;
        onboardingData.zipcode = zipcode;
        onboardingData.dob = dob;
        onboardingData.sex = sex;
        goToStep(8);
    });

    // STEP 8: Password
    document.getElementById('step-8-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const password = document.getElementById('onboarding-password').value;
        const confirmPassword = document.getElementById('onboarding-confirmPassword').value;
        
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

        onboardingData.password = password;
        goToStep(9);
    });

    // STEP 9: Terms agreement and account creation
    const termsCheckbox = document.getElementById('terms-agreement');
    const step9NextBtn = document.getElementById('step-9-next');

    if (termsCheckbox) {
        termsCheckbox.addEventListener('change', () => {
            if (step9NextBtn) step9NextBtn.disabled = !termsCheckbox.checked;
        });
        if (step9NextBtn) step9NextBtn.disabled = true;
    }

    if (step9NextBtn) {
        step9NextBtn.addEventListener('click', async () => {
            if (!termsCheckbox.checked) {
                window.showAlertModal('Please review and agree to continue');
                return;
            }

            try {
                step9NextBtn.disabled = true;
                step9NextBtn.textContent = 'Creating your account...';

                // Sign up user
                const { data: authData, error: authError } = await window.supabaseClient.auth.signUp({
                    email: onboardingData.email,
                    password: onboardingData.password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/rooted-vitality/index.html`
                    }
                });

                if (authError) {
                    console.error('[Onboarding] Auth signup error details:', authError);
                    console.error('[Onboarding] Auth error message:', authError.message);
                    console.error('[Onboarding] Auth error status:', authError.status);
                    console.error('[Onboarding] Auth error code:', authError.code);
                    
                    let friendlyMessage = 'Signup failed. Please try again.';
                    if (authError.message.includes('already registered')) {
                        friendlyMessage = 'This email is already registered. Please log in instead.';
                    } else if (authError.message.includes('invalid email')) {
                        friendlyMessage = 'Please enter a valid email address.';
                    } else if (authError.message.includes('password')) {
                        friendlyMessage = 'Password is too weak. Use at least 6 characters.';
                    } else {
                        friendlyMessage = authError.message;
                    }
                    throw new Error(friendlyMessage);
                }

                console.log('[Onboarding] User signed up:', authData.user.email);

                // Create client profile
                const { error: clientError } = await window.supabaseClient
                    .from('clients')
                    .insert({
                        id: authData.user.id,
                        email: onboardingData.email,
                        first_name: onboardingData.firstName,
                        last_name: onboardingData.lastName,
                        phone: onboardingData.phone,
                        zipcode: onboardingData.zipcode,
                        date_of_birth: onboardingData.dob,
                        sex: onboardingData.sex,
                        created_at: new Date().toISOString()
                    });

                if (clientError) {
                    console.error('[Onboarding] Client profile error details:', clientError);
                    console.error('[Onboarding] Error code:', clientError.code);
                    console.error('[Onboarding] Error message:', clientError.message);
                    console.error('[Onboarding] Error hint:', clientError.hint);
                    console.error('[Onboarding] Full error object:', JSON.stringify(clientError, null, 2));
                    
                    // Provide detailed error info even if we continue
                    let errorMsg = 'Note: Profile creation had an issue: ' + clientError.message;
                    console.warn('[Onboarding]', errorMsg);
                }

                onboardingData.userId = authData.user.id;

                // Create the project
                const { data: projectData, error: projectError } = await window.supabaseClient
                    .from('projects')
                    .insert({
                        user_id: authData.user.id,
                        category_id: onboardingData.category,
                        subcategory_id: onboardingData.subcategory,
                        description: onboardingData.symptoms || '',
                        status: 'active',
                        created_at: new Date().toISOString()
                    })
                    .select();

                if (projectError) {
                    throw projectError;
                }

                console.log('[Onboarding] Project created:', projectData[0].id);
                onboardingData.projectId = projectData[0].id;

                // Load and display matches for this project
                await loadMatchesForOnboarding(onboardingData);
                goToStep(10);

                step9NextBtn.disabled = false;
                step9NextBtn.textContent = 'Continue ��';

            } catch (error) {
                console.error('[Onboarding] Signup error:', error);
                window.showAlertModal('Something went wrong. Please try again: ' + error.message);
                step9NextBtn.disabled = false;
                step9NextBtn.textContent = 'Create account & continue ��';
            }
        });
    }

    // STEP 10: Save for later
    document.getElementById('save-for-later-btn').addEventListener('click', async () => {
        try {
            closeOnboardingModal();
            window.showAlertModal('Welcome to Rooted Vitality\n\nYour project has been created. You can explore practitioners anytime from your dashboard.');
            setTimeout(() => {
                window.location.href = '/rooted-vitality/dashboard/client/pages/dashboard.html';
            }, 500);
        } catch (error) {
            console.error('[Onboarding] Error:', error);
            window.showAlertModal('Something went wrong. Please try again: ' + error.message);
        }
    });

    // STEP 10: View all practitioners
    document.getElementById('continue-browsing-btn').addEventListener('click', () => {
        closeOnboardingModal();
        const projectId = onboardingData.projectId;
        window.location.href = `/rooted-vitality/dashboard/client/pages/find-practitioners.html?project=${projectId}`;
    });

    // Back buttons for all steps
    modal.querySelectorAll('.onboarding-back').forEach(btn => {
        btn.addEventListener('click', () => {
            const currentStep = modal.querySelector('.onboarding-step.active').dataset.step;
            
            // Handle back navigation for different paths
            if (currentStep === '1') {
                // Back from path choice goes to login if it exists
                const loginStep = modal.querySelector('[data-step="0"]');
                if (loginStep) {
                    goToStep(0);
                } else {
                    closeOnboardingModal();
                }
            } else if (currentStep === '2a' || currentStep === '2b') {
                goToStep(1);
            } else if (currentStep === '3') {
                goToStep('2b'); // Back from confirmation goes to symptoms
            } else if (currentStep === '5') {
                if (onboardingData.path === 'direct') {
                    goToStep('2a');
                } else {
                    goToStep(3); // Guided path goes back to confirmation
                }
            } else {
                // Standard back navigation
                const stepNum = parseInt(currentStep);
                if (stepNum > 1) {
                    goToStep(stepNum - 1);
                }
            }
        });
    });

    // Helper function to navigate steps
    function goToStep(stepNumber) {
        // Update active step
        modal.querySelectorAll('.onboarding-step').forEach(step => {
            step.classList.remove('active');
        });
        
        const selector = typeof stepNumber === 'string' 
            ? `[data-step="${stepNumber}"]` 
            : `[data-step="${stepNumber}"]`;
        modal.querySelector(selector).classList.add('active');

        // Update progress bar (11 total steps with login: 0, 1, 2a/2b, 3, 5-10)
        let progressPercent;
        if (stepNumber === '0' || stepNumber === 0) {
            progressPercent = (1 / 11) * 100; // Login step
        } else if (typeof stepNumber === 'string') {
            progressPercent = (3 / 11) * 100; // Path choice steps are ~27%
        } else {
            // For numeric steps, add 1 to account for step 0
            progressPercent = ((stepNumber + 1) / 11) * 100;
        }
        modal.querySelector('.progress-fill').style.width = progressPercent + '%';

        // Scroll to top
        const stepContent = modal.querySelector('.onboarding-step.active .step-content');
        if (stepContent) {
            stepContent.scrollTop = 0;
        }
    }
}

/**
 * Detect category and subcategory from symptoms text
 */
function detectCategoryAndSubcategory(symptomsText) {
    let highestScore = 0;
    let detectedCategory = null;
    let detectedSubcategory = null;
    const symptomsLower = symptomsText.toLowerCase();

    // Score each category
    for (const category of WELLNESS_CATEGORIES) {
        let categoryScore = 0;
        let subcategoryScore = 0;
        let bestSubcategory = null;

        // Score keywords in category
        if (category.keywords) {
            for (const keyword of category.keywords) {
                if (symptomsLower.includes(keyword.toLowerCase())) {
                    categoryScore += 10;
                }
            }
        }

        // Score subcategories if they exist
        if (category.subcategories) {
            for (const subcategory of category.subcategories) {
                let subScore = 0;
                if (subcategory.keywords) {
                    for (const keyword of subcategory.keywords) {
                        if (symptomsLower.includes(keyword.toLowerCase())) {
                            subScore += 15; // Subcategories weighted higher
                        }
                    }
                }
                if (subScore > subcategoryScore) {
                    subcategoryScore = subScore;
                    bestSubcategory = subcategory;
                }
            }
        }

        const totalScore = categoryScore + subcategoryScore;
        if (totalScore > highestScore) {
            highestScore = totalScore;
            detectedCategory = category;
            detectedSubcategory = bestSubcategory;
        }
    }

    return {
        categoryId: detectedCategory ? detectedCategory.id : null,
        categoryName: detectedCategory ? detectedCategory.name : 'General Wellness',
        subcategoryId: detectedSubcategory ? detectedSubcategory.id : null,
        subcategoryName: detectedSubcategory ? detectedSubcategory.name : null
    };
}

/**
 * Load matches for onboarding
 */
async function loadMatchesForOnboarding(onboardingData) {
    try {
        const container = document.getElementById('matches-container');
        container.innerHTML = '<p class="loading">Finding your perfect matches...</p>';

        // Simulated top 3 matches (in production, query practitioners matching the category with score)
        const matches = [
            {
                id: '1',
                name: 'Dr. Sarah Chen',
                specialty: 'Acupuncture & TCM',
                description: 'Specializing in chronic pain management and energy balance with 12+ years of experience',
                score: 95
            },
            {
                id: '2',
                name: 'Emma Wellness',
                specialty: 'Holistic Nutrition',
                description: 'Functional medicine nutritionist helping you align your diet with your wellness goals',
                score: 88
            },
            {
                id: '3',
                name: 'Marcus Healing',
                specialty: 'Energy & Reiki',
                description: 'Certified reiki master helping clients find peace, clarity, and spiritual alignment',
                score: 82
            }
        ];

        container.innerHTML = matches.map((match, idx) => `
            <div class="match-card">
                <div class="match-header">
                    <div class="match-avatar">${match.name.charAt(0)}</div>
                    <div class="match-info">
                        <h3>${match.name}</h3>
                        <p class="match-specialty">${match.specialty}</p>
                    </div>
                    <div class="match-score">${match.score}% match</div>
                </div>
                <p class="match-description">${match.description}</p>
                <div class="match-actions">
                    <button class="btn-secondary match-view-profile" data-match-id="${match.id}">View Profile</button>
                    <button class="btn-primary match-connect" data-match-id="${match.id}" data-match-name="${match.name}">
                        Connect with ${match.name.split(' ')[0]}
                    </button>
                </div>
            </div>
        `).join('');

        // Add event listeners to connect buttons
        container.querySelectorAll('.match-connect').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const matchId = btn.dataset.matchId;
                const matchName = btn.dataset.matchName;
                
                try {
                    btn.disabled = true;
                    btn.textContent = 'Connecting...';

                    // Create match record linking project to practitioner
                    const { error: matchError } = await window.supabaseClient
                        .from('matches')
                        .insert({
                            project_id: onboardingData.projectId,
                            practitioner_id: matchId,
                            status: 'pending',
                            initiated_by: 'client',
                            created_at: new Date().toISOString()
                        });

                    if (matchError) throw matchError;

                    console.log('[Onboarding] Match created with practitioner:', matchId);

                    // Redirect to my matches
                    closeOnboardingModal();
                    setTimeout(() => {
                        window.location.href = '/rooted-vitality/dashboard/client/pages/my-matches.html';
                    }, 300);
                } catch (error) {
                    console.error('[Onboarding] Error connecting:', error);
                    window.showAlertModal('Error connecting. Please try again: ' + error.message);
                    btn.disabled = false;
                    btn.textContent = `Connect with ${matchName.split(' ')[0]}`;
                }
            });
        });

        // Add event listeners to view profile buttons
        container.querySelectorAll('.match-view-profile').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const matchId = btn.dataset.matchId;
                // In production, this would open a profile modal or navigate to profile page
                window.showAlertModal('Profile view coming soon!');
            });
        });

    } catch (error) {
        console.error('[Onboarding] Error loading matches:', error);
        document.getElementById('matches-container').innerHTML = `
            <p class="loading" style="color: #d32f2f;">Error loading matches. Please try again.</p>
        `;
    }
}

/**
 * Create pending project (for save for later)
 */
async function createPendingProject(data) {
    const { data: projectData, error } = await window.supabaseClient
        .from('projects')
        .insert({
            user_id: data.userId,
            category_id: data.category,
            description: data.symptoms,
            status: 'pending',
            created_at: new Date().toISOString()
        });

    if (error) throw error;
    return projectData;
}

/**
 * Create project with immediate match
 */
async function createProjectWithMatch(data, practitionerId, practitionerName) {
    // Create project
    const { data: projectData, error: projectError } = await window.supabaseClient
        .from('projects')
        .insert({
            user_id: data.userId,
            category_id: data.category,
            description: data.symptoms,
            status: 'active',
            created_at: new Date().toISOString()
        });

    if (projectError) throw projectError;

    // Create match
    const { error: matchError } = await window.supabaseClient
        .from('matches')
        .insert({
            project_id: projectData[0].id,
            practitioner_id: practitionerId,
            status: 'pending',
            initiated_by: 'client',
            created_at: new Date().toISOString()
        });

    if (matchError) throw matchError;

    return projectData[0];
}

/**
 * Close onboarding modal
 */
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
 * Open onboarding modal - shows choice first, then routes appropriately
 */
function openGuidedOnboarding() {
    // Always show the choice modal first
    showOnboardingChoice();
}

/**
 * Auto-open onboarding on first visit (if not authenticated and haven't seen modal before)
 */
function autoOpenOnboardingOnFirstVisit() {
    // Check if user is already authenticated
    if (window.supabaseClient) {
        window.supabaseClient.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                // No active session - check if they've already seen the modal
                const hasSeenModal = sessionStorage.getItem('rooted-vitality-onboarding-shown');
                
                if (!hasSeenModal) {
                    // First time visiting - auto-open after a brief delay
                    setTimeout(() => {
                        openGuidedOnboarding();
                        sessionStorage.setItem('rooted-vitality-onboarding-shown', 'true');
                    }, 800); // Small delay to let page fully render
                }
            }
        });
    }
}

// Export for use
window.openGuidedOnboarding = openGuidedOnboarding;
window.autoOpenOnboardingOnFirstVisit = autoOpenOnboardingOnFirstVisit;
window.closeOnboardingModal = closeOnboardingModal;











































































