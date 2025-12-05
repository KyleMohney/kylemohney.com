/*
╔═════════════════════════════════════════════════════════════════════════════╗
║                    ROOTED VITALITY, INC.                                    ║
║              CLIENT PUBLIC PROFILE (LOGIC)                                  ║
║                                                                             ║
║ File:        dashboard/client/scripts/public-profile.js                     ║
║ Purpose:     Load and display client profile for matched practitioners      ║
║ Description: Authorization verification, data loading, profile rendering    ║
║ Last Update: November 2025                                                  ║
║ Status:      Production-Ready | Build Standard v2.0 Compliant               ║
║                                                                             ║
║ QUICK REFERENCE:                                                            ║
║ - Authorization | Data Loading | Profile Population | Error Handling        ║
║ - Real-Time: Practitioner/Client Serial Verification, Match Status Check    ║
║                                                                             ║
╚═════════════════════════════════════════════════════════════════════════════╝
*/

// ═══════════════════════════════════════════════════════════════════════════
// TABLE OF CONTENTS
// ═══════════════════════════════════════════════════════════════════════════
//
// 1. AUTHORIZATION & VALIDATION
// 2. DATA LOADING
// 3. PROFILE POPULATION
// 4. DATA FORMATTING
// 5. ERROR HANDLING
// 6. INITIALIZATION
//
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// 1. AUTHORIZATION & VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extract client_id from URL query parameters
 * @returns {string|null} The client UUID from ?client_id=<uuid> or null
 */
function getClientIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('client_id');
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. DATA LOADING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Initialize and load public profile page
 * Performs authorization checks, loads data, and populates UI
 */
async function initializePublicProfile() {
    try {
        const clientId = getClientIdFromUrl();
        
        if (!clientId) {
            showError('Invalid profile link. Please check the URL and try again.');
            return;
        }

        // Check if current user is a practitioner who has an accepted match with this client
        const { data: { user: currentUser } } = await window.supabaseClient.auth.getUser();
        
        if (!currentUser) {
            showError('You must be signed in to view client profiles.');
            return;
        }

        // Verify that the practitioner has an active/accepted match with this client
        // First, get the practitioner's serial number
        const { data: practitionerData, error: practitionerError } = await window.supabaseClient
            .from('practitioners')
            .select('serial_number')
            .eq('id', currentUser.id)
            .single();

        if (!practitionerData || practitionerError) {
            showError('Could not verify your practitioner account.');
            return;
        }

        // Next, get the client's serial number
        const { data: clientData_serial, error: clientError_serial } = await window.supabaseClient
            .from('clients')
            .select('serial_number')
            .eq('id', clientId)
            .single();

        if (!clientData_serial || clientError_serial) {
            showError('This client profile could not be found.');
            return;
        }

        // Now query matches using the serial numbers
        const { data: match, error: matchError } = await window.supabaseClient
            .from('project_practitioner_matches')
            .select('id, status, match_status')
            .eq('practitioner_serial', practitionerData.serial_number)
            .eq('client_serial', clientData_serial.serial_number);


        // Check if match exists
        if (!match || match.length === 0) {
            showError('You do not have permission to view this profile. You must have an active connection with this client.');
            return;
        }

        // Filter out only explicitly declined/blocked matches
        // Allow: pending, matched, hired, accepted, etc.
        const blockedStatuses = ['declined', 'blocked', 'archived', 'canceled'];
        const activeMatch = match.find(m => {
            const isBlocked = blockedStatuses.includes(m.status?.toLowerCase()) || 
                             blockedStatuses.includes(m.match_status?.toLowerCase());
            return !isBlocked;
        });

        if (!activeMatch) {
            showError('This connection is no longer active. You cannot view archived client profiles.');
            return;
        }

        // Fetch client data
        const { data: clientData, error: clientError } = await window.supabaseClient
            .from('clients')
            .select('id, first_name, last_name, age, sex, zipcode, profile_picture_url')
            .eq('id', clientId)
            .single();

        if (clientError || !clientData) {
            showError('This client profile could not be found.');
            return;
        }

        // Fetch wellness profile data
        const { data: wellnessData, error: wellnessError } = await window.supabaseClient
            .from('client_profiles')
            .select('*')
            .eq('user_id', clientId)
            .single();

        // Populate page with data
        populateProfilePage(clientData, wellnessData);
    } catch (error) {
        showError('An error occurred while loading the profile.');
        console.error('[PUBLIC_PROFILE] Profile initialization error:', error);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. PROFILE POPULATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Populate all profile fields with client and wellness data
 * @param {Object} clientData - Client basic information
 * @param {Object} wellnessData - Client wellness profile responses
 */
function populateProfilePage(clientData, wellnessData) {
    // Header information
    const firstName = clientData.first_name || '';
    const lastName = clientData.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim() || 'Profile';
    
    document.getElementById('clientName').textContent = fullName;
    
    // Avatar
    const avatarContainer = document.getElementById('clientAvatarDisplay');
    if (clientData.profile_picture_url) {
        avatarContainer.innerHTML = `<img src="${clientData.profile_picture_url}" alt="${fullName}" class="client-avatar-image">`;
    } else if (firstName) {
        avatarContainer.textContent = firstName.charAt(0).toUpperCase();
    }

    // Location info
    const location = clientData.address && clientData.city && clientData.state 
        ? `${clientData.address}, ${clientData.city}, ${clientData.state} ${clientData.zipcode}`
        : clientData.zipcode || '—';
    document.getElementById('clientLocation').textContent = location;
    document.getElementById('displayLocation').textContent = location;

    // Basic information
    document.getElementById('displayAge').textContent = clientData.age ? `${clientData.age} years old` : '—';
    document.getElementById('displaySex').textContent = clientData.sex || '—';

    // Wellness profile information
    if (wellnessData) {
        document.getElementById('displayMainWellnessGoal').textContent = wellnessData.main_wellness_goal || '—';
        document.getElementById('displayDurationOfIssue').textContent = wellnessData.duration_of_issue || '—';
        document.getElementById('displayWhatTriedBefore').textContent = wellnessData.what_tried_before || '—';
        document.getElementById('displayAllergiesSensitivities').textContent = wellnessData.allergies_sensitivities || '—';
        document.getElementById('displayCurrentMedicationsSupplements').textContent = wellnessData.current_medications_supplements || '—';
        document.getElementById('displayTypicalDayDescription').textContent = wellnessData.typical_day_description || '—';
        document.getElementById('displayCommunicationPreference').textContent = formatCommunicationPreference(wellnessData.communication_preference) || '—';
        document.getElementById('displayBiggestBarrierToHealing').textContent = wellnessData.biggest_barrier_to_healing || '—';
        document.getElementById('displayPriorPractitionerExperience').textContent = formatPriorExperience(wellnessData.prior_practitioner_experience) || '—';
        document.getElementById('displayDesiredSuccessOutcome').textContent = wellnessData.desired_success_outcome || '—';
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. DATA FORMATTING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Format communication preference for display
 * @param {string} value - Raw communication preference value from database
 * @returns {string} Human-readable communication preference label
 */
function formatCommunicationPreference(value) {
    if (!value) return '';
    const labels = {
        'email': 'Email',
        'phone': 'Phone',
        'text': 'Text/SMS',
        'video': 'Video Call',
        'in-person': 'In-person'
    };
    return labels[value] || value;
}

/**
 * Format prior practitioner experience for display
 * @param {string} value - Raw experience value from database
 * @returns {string} Human-readable experience label
 */
function formatPriorExperience(value) {
    if (!value) return '';
    const labels = {
        'yes': 'Yes',
        'no': 'No',
        'a_little': 'A little'
    };
    return labels[value] || value;
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. ERROR HANDLING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Display error message in user-friendly container
 * Uses CSS classes from public-profile.css (no inline styles)
 * @param {string} message - Error message to display to user
 */
function showError(message) {
    const container = document.querySelector('.container-narrow');
    container.innerHTML = `
        <div class="error-container">
            <h2 class="error-title">Profile Not Found</h2>
            <p class="error-message">${message}</p>
            <a href="/rooted-vitality/dashboard/pro/pages/inbox.html" class="error-link">Back to Inbox</a>
        </div>
    `;
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Initialize public profile on page load
 */
document.addEventListener('DOMContentLoaded', initializePublicProfile);
