/**
 * ============================================
 * PUBLIC CLIENT PROFILE SCRIPT
 * ============================================
 * Loads and displays client profile for practitioners
 * Accessed via URL parameter: ?client_id=<uuid>
 */

console.log('[Public Profile] Loading...');

// Get client_id from URL parameters
function getClientIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('client_id');
}

/**
 * Initialize public profile page
 */
async function initializePublicProfile() {
    try {
        const clientId = getClientIdFromUrl();
        
        if (!clientId) {
            console.error('[Public Profile] No client_id provided');
            showError('Invalid profile link. Please check the URL and try again.');
            return;
        }

        // Check if current user is a practitioner who has an accepted match with this client
        const { data: { user: currentUser } } = await window.supabaseClient.auth.getUser();
        
        if (!currentUser) {
            console.error('[Public Profile] User not authenticated');
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
            console.error('[Public Profile] Could not find practitioner data:', practitionerError);
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
            console.error('[Public Profile] Could not find client data:', clientError_serial);
            showError('This client profile could not be found.');
            return;
        }

        console.log('[Public Profile] Practitioner serial:', practitionerData.serial_number, 'Client serial:', clientData_serial.serial_number);

        // Now query matches using the serial numbers
        const { data: match, error: matchError } = await window.supabaseClient
            .from('project_practitioner_matches')
            .select('id, status, match_status')
            .eq('practitioner_serial', practitionerData.serial_number)
            .eq('client_serial', clientData_serial.serial_number);

        console.log('[Public Profile] Match query result:', match, 'Error:', matchError);

        // Check if match exists
        if (!match || match.length === 0) {
            console.error('[Public Profile] No match found for this practitioner and client');
            showError('You do not have permission to view this profile. You must have an active connection with this client.');
            return;
        }

        // Log match details for debugging
        match.forEach((m, idx) => {
            console.log(`[Public Profile] Match ${idx}:`, {
                status: m.status,
                match_status: m.match_status
            });
        });

        // Filter out only explicitly declined/blocked matches
        // Allow: pending, matched, hired, accepted, etc.
        const blockedStatuses = ['declined', 'blocked', 'archived', 'canceled'];
        const activeMatch = match.find(m => {
            const isBlocked = blockedStatuses.includes(m.status?.toLowerCase()) || 
                             blockedStatuses.includes(m.match_status?.toLowerCase());
            console.log(`[Public Profile] Checking match - status: ${m.status}, match_status: ${m.match_status}, isBlocked: ${isBlocked}`);
            return !isBlocked;
        });

        if (!activeMatch) {
            console.error('[Public Profile] No active match found - all matches are archived or blocked');
            showError('This connection is no longer active. You cannot view archived client profiles.');
            return;
        }

        console.log('[Public Profile] Active match found, proceeding...');

        console.log('[Public Profile] Practitioner authorized. Loading profile for client:', clientId);

        // Fetch client data
        const { data: clientData, error: clientError } = await window.supabaseClient
            .from('clients')
            .select('id, first_name, last_name, age, sex, zipcode, profile_picture_url')
            .eq('id', clientId)
            .single();

        if (clientError || !clientData) {
            console.error('[Public Profile] Error fetching client data:', clientError);
            showError('This client profile could not be found.');
            return;
        }

        // Fetch wellness profile data
        const { data: wellnessData, error: wellnessError } = await window.supabaseClient
            .from('client_profiles')
            .select('*')
            .eq('user_id', clientId)
            .single();

        if (wellnessError && wellnessError.code !== 'PGRST116') {
            console.warn('[Public Profile] Error fetching wellness profile:', wellnessError);
        }

        // Populate page with data
        populateProfilePage(clientData, wellnessData);
        console.log('[Public Profile] Profile loaded successfully');

    } catch (error) {
        console.error('[Public Profile] Initialization error:', error);
        showError('An error occurred while loading the profile.');
    }
}

/**
 * Populate all profile fields with data
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
        avatarContainer.innerHTML = `<img src="${clientData.profile_picture_url}" alt="${fullName}" style="width: 100%; height: 100%; object-fit: cover;">`;
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

/**
 * Format communication preference for display
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

/**
 * Show error message
 */
function showError(message) {
    const container = document.querySelector('.container-narrow');
    container.innerHTML = `
        <div style="background: #f0fdf4; border: 2px solid #5c9a72; border-radius: 12px; padding: 2rem; text-align: center; margin-top: 3rem;">
            <h2 style="color: #2e2b28; margin: 0 0 1rem 0;">Profile Not Found</h2>
            <p style="color: #555; margin: 0;">${message}</p>
            <a href="/rooted-vitality/dashboard/pro/pages/inbox.html" style="display: inline-block; margin-top: 1rem; padding: 0.75rem 1.5rem; background: #5c9a72; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">Back to Inbox</a>
        </div>
    `;
}

/**
 * On page load, initialize
 */
document.addEventListener('DOMContentLoaded', initializePublicProfile);
