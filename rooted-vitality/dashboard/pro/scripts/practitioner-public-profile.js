/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: dashboard/pro/scripts/practitioner-public-profile.js        ║
║  Purpose: Public practitioner profile page rendering               ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

TABLE OF CONTENTS
  1. INITIALIZATION & DATA LOADING
  2. PROFILE RENDERING FUNCTIONS
  3. SECTION RENDERERS (Hero, About, Services, Credentials, Contact, Media, Reviews, FAQ)

═══════════════════════════════════════════════════════════════════
DESIGN SYSTEM
  Colors: --rooted-primary (#77883e), --rooted-accent (#d4c47c)
  Typography: Inter (headings), Lora (body), minimum 16px
  Spacing: Generous, mobile-first responsive (360px+)
  Styles: dashboard/pro/styles/practitioner-public-profile.css
═══════════════════════════════════════════════════════════════════
*/

// Import shared utilities
// Note: Assumes utilities.js is loaded before this script
// Available: formatTime(), escapeHtml()

// ======================================================
// 1. INITIALIZATION & DATA LOADING
// ======================================================

let practitioner = null;
let reviews = [];

// Flag for injections.js to know this page handles its own header
window.PRACTITIONER_PROFILE_PAGE = true;

// Set default role immediately to prevent race condition
window.DETECTED_USER_ROLE = 'public';

// ======================================================
// ERROR HANDLING UTILITY
// ======================================================

//Show error notification instead of alert()
//Uses toast notification if available, otherwise creates inline error message
function showError(message) {
    try {
        // Try to use notification toast if available
        if (window.notificationToast && typeof window.notificationToast.show === 'function') {
            window.notificationToast.show({
                title: 'Error',
                message: message,
                rating: 1,
                timestamp: new Date().toLocaleTimeString()
            });
            return;
        }
    } catch (e) {
        // Fallback if toast fails
    }
    
    // Fallback: Log to console and show error in UI
    console.error('[practitioner-profile] Error:', message);
    const errorEl = document.getElementById('profile-error');
    if (errorEl) {
        errorEl.classList.add('visible');
        const msgEl = document.getElementById('error-message');
        if (msgEl) msgEl.textContent = message;
    }
}

// Utility: Merge data source into target object with defaults for null/error cases
function mergeData(target, source, defaults = {}) {
    if (source) {
        return { ...target, ...source };
    }
    return { ...target, ...defaults };
}

// Utility: Setup modal close handlers (close button, X button, overlay click)
function setupModalCloseHandlers(modal) {
    if (!modal) return;
    
    // Handler for close button
    const closeBtn = modal.querySelector('#request-modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    }
    
    // Handler for X button
    const xBtn = modal.querySelector('.modal__close');
    if (xBtn) {
        xBtn.addEventListener('click', () => modal.classList.remove('active'));
    }
    
    // Handler for overlay click
    const overlay = modal.querySelector('.modal__overlay');
    if (overlay) {
        overlay.addEventListener('click', () => modal.classList.remove('active'));
    }
}

// Utility: Get user role from localStorage (rvUser)
function getUserRole() {
    try {
        const rvUserStr = localStorage.getItem('rvUser');
        return rvUserStr ? JSON.parse(rvUserStr).role : null;
    } catch {
        return null;
    }
}

// Utility: Set button state (disabled/enabled with classes and text)
function setButtonState(btn, { disabled = false, text = null, classes = [], title = null } = {}) {
    if (!btn) return;
    btn.disabled = disabled;
    if (text) btn.textContent = text;
    if (title) btn.title = title;
    disabled ? btn.classList.add('disabled-button') : btn.classList.remove('disabled-button');
    classes.forEach(c => btn.classList.add(c));
}

// Utility: Add click listener to button
function onButtonClick(btn, callback) {
    if (btn) btn.addEventListener('click', callback);
}

// Utility: Check if query returned valid data (handles null/error cases)
function isValidQueryResult(data, error) {
    return !error && data;
}

// Utility: Set element visibility (adds/removes visible/hidden classes)
function setVisible(elementOrId, visible = true, displayClass = 'visible') {
    const el = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
    if (!el) return;
    if (visible) {
        el.classList.add(displayClass);
        el.classList.remove('hidden');
    } else {
        el.classList.add('hidden');
        el.classList.remove(displayClass);
    }
}

// Detect user role directly from localStorage (where authManager stores it)
function detectUserRoleForHeader() {
    window.DETECTED_USER_ROLE = getUserRole() || 'public';
}

detectUserRoleForHeader();

document.addEventListener('DOMContentLoaded', async () => {
    
    try {
        // Get practitioner ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        let practitionerId = urlParams.get('id');
        
        // If no ID provided, try to get logged-in user's profile
        if (!practitionerId) {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (user) {
                // Get practitioner by id
                const { data, error } = await window.supabaseClient
                    .from('practitioners')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                
                if (error) {
                    console.error('[Profile] Error fetching practitioner:', error);
                    throw new Error(`Failed to load practitioner: ${error.message}`);
                }
                
                if (data) {
                    practitioner = data;
                    practitionerId = data.id; // Set practitionerId for use in subsequent queries
                } else {
                    throw new Error('Practitioner profile not found');
                }
            } else {
                throw new Error('No practitioner ID provided and not logged in');
            }
        }
        
        // Convert serial number to UUID if needed (P1, P2, etc -> actual UUID)
        if (practitionerId && !practitionerId.includes('-')) {
            // It's a serial number, query by serial_number first to get the UUID
            const { data: serialData, error: serialError } = await window.supabaseClient
                .from('practitioners')
                .select('id')
                .eq('serial_number', practitionerId)
                .single();
            
            if (serialError || !serialData) {
                throw new Error(`Practitioner with serial ${practitionerId} not found`);
            }
            
            practitionerId = serialData.id;
        }
        
        // Now fetch all related profile data (this applies to both ID and non-ID paths)
        if (practitionerId) {
            // Fetch practitioner from practitioners table (includes payment_methods, insurance_providers)
            const { data, error } = await window.supabaseClient
                .from('practitioners')
                .select('*')
                .eq('id', practitionerId)
                .single();
            
            if (error) throw error;
            practitioner = data;
            
            // Fetch profile content from practitioner_profiles table (includes gallery_photos, bio, etc)
            const { data: profileContent, error: profileError } = await window.supabaseClient
                .from('practitioner_profiles')
                .select('*')
                .eq('practitioner_serial', practitioner.serial_number)
                .single();
            
            if (!profileError && profileContent) {
                // Merge profile content into practitioner object
                // Map 'faq' from database to 'faqs' for rendering code
                if (profileContent.faq) {
                    profileContent.faqs = profileContent.faq;
                }
                practitioner = {
                    ...practitioner,
                    ...profileContent
                };

            }
            
            // Fetch credentials from practitioner_credentials table (includes credentials array, badges, etc)
            const { data: credentialsData, error: credentialsError } = await window.supabaseClient
                .from('practitioner_credentials')
                .select('*')
                .eq('practitioner_serial', practitioner.serial_number)
                .maybeSingle();
            
            const credentialsDefaults = {
                credentials: [],
                badge_verified: false,
                badge_certified: false,
                badge_licensed: false,
                badge_background_check_verified: false,
                credentials_verified: false,
                background_check_status: null,
                background_check_date: null,
                continuing_education: []
            };
            
            if (credentialsData) {
                practitioner = mergeData(practitioner, {
                    credentials: credentialsData.credentials || [],
                    badge_verified: credentialsData.badge_verified || false,
                    badge_certified: credentialsData.badge_certified || false,
                    badge_licensed: credentialsData.badge_licensed || false,
                    badge_background_check_verified: credentialsData.badge_background_check_verified || false,
                    credentials_verified: credentialsData.credentials_verified || false,
                    background_check_status: credentialsData.background_check_status || null,
                    background_check_date: credentialsData.background_check_date || null,
                    continuing_education: credentialsData.continuing_education || []
                });
            } else {
                practitioner = mergeData(practitioner, null, credentialsDefaults);
            }
            
            // All availability and service data is already in practitioners table from initial select
            // (in_person_enabled, virtual_enabled, housecalls_enabled, pricing, etc.)
        }
               
        if (!practitioner) {
            throw new Error('Practitioner not found');
        }
        
        // Load reviews
        await loadReviews();
        // Load service categories from match settings
        await loadServiceCategories();
        
        // Render profile
        renderProfile();
        // Setup Contact button
        await setupContactButton();
        
        // Setup Back to Profile button
        await setupBackToProfileButton();
        
        // Setup Back to Search link
        setupBackToSearchLink();
        
        // Setup Connection Request Modal handlers
        const connectionModal = document.getElementById('connection-request-modal');
        setupModalCloseHandlers(connectionModal);
        window.connectionModal = connectionModal; // Cache for later use
        
        // Hide loading, show content
        setVisible('profile-loading', false);
        setVisible('profile-content', true);
        
        // Check for section parameter (e.g., ?section=reviews) and scroll to it
        const targetSection = urlParams.get('section');
        if (targetSection) {
            const sectionEl = document.getElementById(`${targetSection}-section`);
            if (sectionEl) {
                setTimeout(() => {
                    sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 200);
            }
        }
        
        // Reload reviews when page becomes visible (e.g., tab switch)
        document.addEventListener('visibilitychange', async () => {
            if (document.visibilityState === 'visible') {

                await loadReviews();
            }
        });
        
    } catch (error) {
        console.error('[Profile] Initialization error:', error);
        setVisible('profile-loading', false);
        setVisible('profile-error', true);
        const errorEl = document.getElementById('error-message');
        if (errorEl) {
            errorEl.textContent = error.message || 'Unable to load practitioner profile';
        }
    }
    
    // Setup gallery modal
    setupGalleryModal();
});

// Load reviews for the practitioner
async function loadReviews() {
    try {
     
        if (!practitioner?.serial_number) {

            reviews = [];
            return;
        }
               
        const { data, error } = await window.supabaseClient
            .from('reviews')
            .select('*')
            .eq('practitioner_serial', practitioner.serial_number)
            .eq('is_visible', true)
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (error) {


            reviews = [];
        } else {
            reviews = data || [];

            if (reviews.length > 0) {

            } else {

            }
            
            // Render immediately
            renderReviewsCard();
            
            // Setup realtime listener for new reviews
            setupReviewsRealtimeListener();
        }
    } catch (error) {

        reviews = [];
    }
}

// Setup realtime listener for new reviews
function setupReviewsRealtimeListener() {
    if (!practitioner || !practitioner.serial_number) {

        return;
    }
    
    const channel = window.supabaseClient
        .channel(`reviews:${practitioner.serial_number}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'reviews',
                filter: `practitioner_serial=eq.${practitioner.serial_number}`
            },
            (payload) => {
               
                // Only add if visible
                if (payload.new.is_visible) {
                    // Check if already in array (avoid duplicates)
                    const exists = reviews.some(r => r.id === payload.new.id);
                    if (!exists) {
                        reviews.unshift(payload.new);  // Add to beginning (newest first)

                        renderReviewsCard();
                    } else {

                    }
                } else {

                }
            }
        )
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'reviews',
                filter: `practitioner_serial=eq.${practitioner.serial_number}`
            },
            (payload) => {
             
                // Update review if is_visible changed to true
                if (payload.new.is_visible) {
                    const existingIndex = reviews.findIndex(r => r.id === payload.new.id);
                    if (existingIndex >= 0) {
                        reviews[existingIndex] = payload.new;

                    } else {
                        reviews.unshift(payload.new);

                    }
                    renderReviewsCard();
                }
            }
        )
        .subscribe((status) => {

            if (status === 'SUBSCRIBED') {

            } else if (status === 'CHANNEL_ERROR') {

            }
        });
}

// Load service categories from match settings
async function loadServiceCategories() {
    try {
        // First, get the practitioner's selected services
        const { data: selectedServices, error: selectError } = await window.supabaseClient
            .from('practitioner_selected_services')
            .select('subcategory_id')
            .eq('practitioner_serial', practitioner.serial_number)
            .eq('is_active', true);
        
        if (selectError) {

            practitioner.service_categories = [];
            return;
        }
        
        if (!selectedServices || selectedServices.length === 0) {

            practitioner.service_categories = [];
            return;
        }
        
        // Get the subcategory names
        const subcategoryIds = selectedServices.map(s => s.subcategory_id);
        const { data: subcategories, error: subError } = await window.supabaseClient
            .from('taxonomy_subcategories')
            .select('name')
            .in('id', subcategoryIds);
        
        if (subError) {

            practitioner.service_categories = [];
            return;
        }
        
        practitioner.service_categories = (subcategories || [])
            .map(item => item.name)
            .filter(name => name);
        
    } catch (error) {

        practitioner.service_categories = [];
    }
}

// Setup Contact button - check user role and disable if practitioner
async function setupContactButton() {
    const contactBtn = document.getElementById('btn-contact');
    if (!contactBtn) return;
    
    try {
        const currentUser = window.authManager?.getCurrentUser();
        const userRole = getUserRole();
        
        if (!currentUser) {
            onButtonClick(contactBtn, () => window.location.href = '/rooted-vitality/dashboard/client/pages/client-signup.html');
            return;
        }
        
        if (!userRole) {
            onButtonClick(contactBtn, () => openConnectionRequest(practitioner.id));
            return;
        }
        
        if (userRole === 'practitioner') {
            if (currentUser.id === practitioner.id) {
                setButtonState(contactBtn, { disabled: true });
            } else {
                setButtonState(contactBtn, { disabled: true, text: "Can't contact", title: 'Practitioners cannot contact other practitioners' });
            }
            return;
        }
        
        if (userRole === 'client') {
            const { data: clientData, error: clientError } = await window.supabaseClient.from('clients').select('serial_number').eq('id', currentUser.id).single();
            if (!isValidQueryResult(clientData, clientError)) {
                onButtonClick(contactBtn, () => openConnectionRequest(practitioner.id));
                return;
            }
            
            const { data: proData, error: proError } = await window.supabaseClient.from('practitioners').select('serial_number').eq('id', practitioner.id).single();
            if (!isValidQueryResult(proData, proError)) {
                onButtonClick(contactBtn, () => openConnectionRequest(practitioner.id));
                return;
            }
            
            const urlParams = new URLSearchParams(window.location.search);
            const projectIdFromUrl = urlParams.get('project_id');
            const projectSerialFromUrl = urlParams.get('project_serial');
            let hasMatchOnThisProject = false;
            
            if (projectIdFromUrl || projectSerialFromUrl) {
                let projectSerial = projectSerialFromUrl;
                if (!projectSerial && projectIdFromUrl) {
                    const { data: projectData, error: projectError } = await window.supabaseClient.from('projects').select('project_serial').eq('id', projectIdFromUrl).single();
                    if (isValidQueryResult(projectData, projectError)) projectSerial = projectData.project_serial;
                }
                if (projectSerial) {
                    const { data: existingMatches, error: matchError } = await window.supabaseClient.from('project_practitioner_matches').select('id').eq('client_serial', clientData.serial_number).eq('practitioner_serial', proData.serial_number).eq('project_serial', projectSerial);
                    hasMatchOnThisProject = isValidQueryResult(existingMatches, matchError) && existingMatches?.length > 0;
                }
            }
            
            if (hasMatchOnThisProject) {
                setButtonState(contactBtn, { disabled: true, text: 'Matched', title: 'You are already matched with this practitioner on this project' });
            } else {
                onButtonClick(contactBtn, () => openConnectionRequest(practitioner.id));
            }
        }
    } catch (error) {
        // Silent fail - button remains default
    }
}

// Setup Back to Profile button - only show when practitioner views own profile
async function setupBackToProfileButton() {
    const backBtn = document.getElementById('btn-back-to-profile');
    if (!backBtn) return;
    
    try {
        const currentUser = window.authManager?.getCurrentUser();
        const userRole = getUserRole();
        
        if (!currentUser || !userRole || userRole !== 'practitioner' || currentUser.id !== practitioner.id) return;
        
        setVisible(backBtn, true);
        onButtonClick(backBtn, () => window.location.href = '/rooted-vitality/dashboard/pro/pages/profile.html');
    } catch (error) {
        // Silent fail
    }
}

// Setup back-to-search link for clients viewing practitioner profiles
function setupBackToSearchLink() {
    const backLink = document.getElementById('btn-back-to-search');
    if (!backLink) return;
    
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const projectIdFromUrl = urlParams.get('project_id');
        if (!projectIdFromUrl) return;
        
        const userRole = getUserRole();
        if (userRole !== 'client') return;
        
        setVisible(backLink, true);
        onButtonClick(backLink, (e) => {
            e.preventDefault();
            window.location.href = `/rooted-vitality/dashboard/client/pages/find-practitioners.html?project_id=${projectIdFromUrl}`;
        });
    } catch (error) {
        // Silent fail
    }
}

// Open connection request modal (client action)
async function openConnectionRequest(practitionerId) {

    if (!practitionerId) {

        return;
    }
    
    const currentUser = window.authManager.getCurrentUser();

    if (!currentUser) {

        window.location.href = '/rooted-vitality/dashboard/client/pages/client-signup.html';
        return;
    }
    
    try {
        // First, check if we have a project_id from URL (from find-practitioners flow)
        const urlParams = new URLSearchParams(window.location.search);
        let projectIdFromUrl = urlParams.get('project_id');
       
        // Get client's projects
        const { data: clientData, error: clientError } = await window.supabaseClient
            .from('clients')
            .select('serial_number, id')
            .eq('id', currentUser.id)
            .single();
        
        if (!isValidQueryResult(clientData, clientError)) {
            showError('Error: Could not find your client profile');
            return;
        }

        // Get practitioner's serial number
        const { data: proData, error: proError } = await window.supabaseClient
            .from('practitioners')
            .select('serial_number')
            .eq('id', practitionerId)
            .single();
        
        if (!isValidQueryResult(proData, proError)) {
            showError('Error: Could not find practitioner details');
            return;
        }
        
        // Get client's projects (with category info)
        const { data: projects, error: projectError } = await window.supabaseClient
            .from('projects')
            .select('id, project_serial, description, client_serial, category_id, category_name, project_status, created_at')
            .eq('client_serial', clientData.serial_number)
            .order('created_at', { ascending: false });
        
        if (projectError) {
            showError('Error: Could not load your projects. ' + (projectError.message || 'Unknown error'));
            return;
        }
     
        if (!projects || projects.length === 0) {
            showError('Please create a project first before connecting with practitioners');
            window.location.href = '/rooted-vitality/dashboard/client/pages/my-wellness.html';
            return;
        }
        
        // If we have a project from URL, use it; otherwise use most recent
        let selectedProject = null;
        if (projectIdFromUrl) {
            selectedProject = projects.find(p => p.id === projectIdFromUrl);
            if (!selectedProject) {

                selectedProject = projects[0];
            }
        } else {
            selectedProject = projects[0];
        }
               
        // Show confirmation modal
        const modalElement = window.connectionModal || document.getElementById('connection-request-modal');
        const nameElement = document.getElementById('request-practitioner-name');
        const closeBtn = document.getElementById('request-modal-close');
               
        if (!modalElement || !nameElement || !closeBtn) {
            showError('Error: Could not display connection modal');
            return;
        }
        
        const practitionerName = practitioner.legal_name || 'Practitioner';
        nameElement.textContent = practitionerName;
        modalElement.classList.add('active');
        
        // Handle submission - use same RPC approach as find-practitioners
        closeBtn.onclick = async () => {
            await sendPractitionerMatch(selectedProject, practitionerId, proData.serial_number);
            modalElement.classList.remove('active');
        };
        
    } catch (error) {

        showError('Error processing your connection request');
    }
}

// Send connection request using RPC (same as find-practitioners.js)
async function sendPractitionerMatch(project, practitionerId, practitionerSerial) {
    if (!project) return;

    try {

        // Get client ID and name
        const currentUser = window.authManager?.getCurrentUser();
        if (!currentUser) {
            showError('Error: Not authenticated');
            return;
        }

        const { data: clientData, error: clientError } = await window.supabaseClient
            .from('clients')
            .select('id, first_name, last_name')
            .eq('id', currentUser.id)
            .single();

        if (!isValidQueryResult(clientData, clientError)) {
            showError('Error retrieving client information');
            return;
        }

        // Get match score from the matching algorithm
        let matchScore = 75;
        
        const { data: matchData, error: matchQueryError } = await window.supabaseClient.rpc(
            'match_practitioners',
            { p_project_id: project.id }  // Use project UUID
        );

        if (!matchQueryError && matchData && matchData.length > 0) {
            const practitionerMatch = matchData.find(m => m.serial_number === practitionerSerial);
            if (practitionerMatch) {
                matchScore = practitionerMatch.match_score ?? 75;
            }
        }

        // Use RPC function to bypass RLS policy (same as find-practitioners)
        const { data, error } = await window.supabaseClient
            .rpc('create_practitioner_match', {
                p_project_serial: parseInt(project.project_serial),
                p_client_serial: project.client_serial,
                p_practitioner_serial: practitionerSerial,
                p_match_score: matchScore
            });
        
        if (error) {
            showError('Error sending connection request: ' + (error?.message || 'Unknown error'));
            return;
        }
        
        // Log the returned status from RPC
        if (data && data[0]) {

        }

        // Get practitioner data for notification
        const { data: practitionerData, error: practitionerError } = await window.supabaseClient
            .from('practitioners')
            .select('id, serial_number, legal_name')
            .eq('serial_number', practitionerSerial)
            .single();

        if (isValidQueryResult(practitionerData, practitionerError)) {
            // Create notification for the practitioner
            const clientName = clientData.first_name || 'Client';
            const notificationTitle = `New Match: ${clientName}`;
            const notificationMessage = `${clientName} has matched with you!`;

            const { error: notifError } = await window.supabaseClient
                .from('practitioner_notifications')
                .insert({
                    practitioner_id: practitionerData.id,
                    practitioner_serial: practitionerData.serial_number,
                    type: 'match_new',
                    title: notificationTitle,
                    message: notificationMessage,
                    client_name: clientName,
                    client_serial: project.client_serial,
                    match_id: data?.[0]?.id,
                    is_read: false,
                    created_at: new Date().toISOString()
                });

            if (notifError) {

            } else {

            }
        }

        // Update projects table to track matched practitioners
        const currentMatched = project.matched_practitioners || [];
        if (!currentMatched.includes(practitionerId)) {
            const { error: projectUpdateError } = await window.supabaseClient
                .from('projects')
                .update({ matched_practitioners: [...currentMatched, practitionerId] })
                .eq('id', project.id);

            if (projectUpdateError) {

            }
        }

        // Create auto-message
        try {
            const clientName = clientData.first_name || 'Client';
            const messageText = `${clientName} wants to connect!`;

            const { error: msgInsertError } = await window.supabaseClient.rpc('create_project_message', {
                p_project_id: project.id,
                p_practitioner_id: practitionerId,
                p_client_id: clientData.id,
                p_sender_id: clientData.id,
                p_sender_type: 'client',
                p_message: messageText
            });
            
            if (msgInsertError) {

            } else {

                
                // Update contacted_at in the match to mark conversation as started
                const { error: updateContactedError } = await window.supabaseClient
                    .from('project_practitioner_matches')
                    .update({
                        contacted_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('project_serial', project.project_serial)
                    .eq('practitioner_serial', practitionerSerial);

                if (updateContactedError) {

                }
            }
        } catch (msgError) {

        }

        // Redirect to My Matches

        window.location.href = `/rooted-vitality/dashboard/client/pages/inbox.html?project_id=${project.id}&practitioner_serial=${practitionerSerial}`;
        
    } catch (error) {

        showError('Error creating connection');
    }
}

// ======================================================
// 2. PROFILE RENDERING FUNCTIONS
// ======================================================

// Render the complete profile
function renderProfile() {

    
    renderHero();
    renderVideo();
    renderAbout();
    renderPaymentsSection();
    renderServicesCard();
    renderCredentialsCard();
    renderContactCard();
    renderMediaCard();
    renderReviewsCard();
    renderFAQ();

}

// ======================================================
// 3. SECTION RENDERERS
// ======================================================

// Render hero section with photo, name, badges, stats
function renderHero() {
    // Photo
    const photoUrl = practitioner.practice_logo_url || practitioner.profile_photo_url || '';
    if (photoUrl) {
        document.getElementById('profile-photo').src = photoUrl;
    }
    
    // Business Name
    const businessName = practitioner.legal_business_name || practitioner.dba_name || practitioner.legal_name || 'Practitioner';
    // Convert database format (with dashes/underscores) to plain English with spaces
    const displayName = businessName.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
    document.getElementById('profile-business-name').textContent = displayName;
    
    // ===== HERO BADGES =====

    
    // Show badges based on status values (background_check only when 'passed')
    setVisible('badge-background-check', practitioner.background_check_status === 'passed', 'visible-inline');
    setVisible('badge-certified', practitioner.badge_certified, 'visible-inline');
    setVisible('badge-licensed', practitioner.badge_licensed, 'visible-inline');
    setVisible('badge-verified', practitioner.badge_verified, 'visible-inline');
    
    // ===== HERO QUICK INFO: Location =====
    if (practitioner.practice_city && practitioner.practice_state) {
        const locationDisplay = `${practitioner.practice_city}, ${practitioner.practice_state}`;
        document.getElementById('hero-location').textContent = locationDisplay;
        setVisible('hero-location-item', true, 'visible-flex');
    }
    
    // ===== HERO QUICK INFO: Hours & Timezone =====
    if (practitioner.availability_schedule) {
        try {
            const schedule = typeof practitioner.availability_schedule === 'string' 
                ? JSON.parse(practitioner.availability_schedule) 
                : practitioner.availability_schedule;
            
            if (schedule) {
                // Collect open days
                const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                const openDays = [];
                let firstDayHours = '';
                
                for (const day of days) {
                    if (schedule[day] && schedule[day].open && schedule[day].close) {
                        openDays.push(day.substring(0, 3).charAt(0).toUpperCase() + day.substring(0, 3).slice(1).toLowerCase());
                        
                        if (!firstDayHours) {
                            const openTime = convertTo12Hour(schedule[day].open);
                            const closeTime = convertTo12Hour(schedule[day].close);
                            firstDayHours = `${openTime} - ${closeTime}`;
                        }
                    }
                }
                
                if (openDays.length > 0 && firstDayHours) {
                    // Format days (e.g., "Mon-Fri" or "Mon, Wed, Fri")
                    let daysText = openDays.join('');
                    if (openDays.length === 5 && openDays[4] === 'Fri') {
                        // Weekdays
                        daysText = 'Mon-Fri';
                    } else if (openDays.length === 7) {
                        // Every day
                        daysText = '7 days';
                    } else if (openDays.length > 3) {
                        // Abbreviate list
                        daysText = openDays.slice(0, 3).join(', ') + (openDays.length > 3 ? '+' : '');
                    }
                    
                    let hoursText = `${daysText} ${firstDayHours}`;
                    
                    if (practitioner.timezone) {
                        const tzFormatter = new Intl.DateTimeFormat('en-US', { 
                            timeZoneName: 'short', 
                            timeZone: practitioner.timezone 
                        });
                        const tzString = tzFormatter.formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value || practitioner.timezone;
                        hoursText += ` ${tzString}`;
                    }
                    
                    document.getElementById('hero-hours').textContent = hoursText;
                    setVisible('hero-hours-item', true, 'visible-flex');
                }
            }
        } catch (e) {

        }
    }
    
    // ===== HERO QUICK INFO: Service Types =====
    const types = [];
    if (practitioner.in_person_enabled) types.push('In-Person');
    if (practitioner.housecalls_enabled) types.push('House Calls');
    if (practitioner.virtual_enabled) types.push('Virtual');
    
    if (types.length > 0) {
        document.getElementById('hero-service-types').textContent = types.join(', ');
        setVisible('hero-service-types-item', true, 'visible-flex');
    }
    
    // ===== HERO QUICK INFO: Languages =====
    if (practitioner.languages && Array.isArray(practitioner.languages) && practitioner.languages.length > 0) {
        const languages = practitioner.languages.filter(lang => lang && lang.trim());
        if (languages.length > 0) {
            document.getElementById('hero-languages').textContent = languages.join(', ');
            setVisible('hero-languages-item', true, 'visible-flex');
        }
    }
    
    // Stats
    const avgRating = calculateAverageRating();
    document.getElementById('stat-rating').textContent = avgRating.toFixed(1);
    document.getElementById('stat-reviews').textContent = reviews.length;
    
    // Star display
    const starsContainer = document.getElementById('stat-stars');
    starsContainer.innerHTML = Array(5)
        .fill(0)
        .map((_, i) => `<span class="star${i < Math.round(avgRating) ? ' filled' : ''}">★</span>`)
        .join('');
    
    // Years in practice
    if (practitioner.year_established) {
        let yearsInPractice;
        const value = parseInt(practitioner.year_established);
        
        // If value is < 100, treat it as years directly
        // If value is >= 1900, treat it as a year and calculate
        if (value < 100) {
            yearsInPractice = value;
        } else {
            yearsInPractice = new Date().getFullYear() - value;
        }
        
        document.getElementById('stat-years').textContent = yearsInPractice + ' yrs';
    }
    
    // Business type (team size)
    if (practitioner.business_size) {
        document.getElementById('stat-business-type').textContent = practitioner.business_size;
    }
}

// Render about and approach sections
function renderAbout() {
    if (practitioner.bio) {
        setVisible('about-section', true);
        document.getElementById('profile-bio').textContent = practitioner.bio;
    }
    
    if (practitioner.ethos_statement) {
        setVisible('approach-section', true);
        document.getElementById('profile-approach').textContent = practitioner.ethos_statement;
    }
}

// Render intro video
function renderVideo() {
    if (practitioner.intro_video_url) {
        const videoSection = document.getElementById('video-section');
        const videoSource = document.getElementById('video-source');
        const video = document.getElementById('intro-video');
        
        if (videoSource && video) {
            videoSource.src = practitioner.intro_video_url;
            video.load();  // Force reload of video element
            setVisible(videoSection, true);

        } else {

        }
    } else {

    }
}

// Render Payments & Insurance Section
function renderPaymentsSection() {
    try {
        let hasContent = false;
        
        // ===== PAYMENT METHODS =====
        if (practitioner.payment_methods) {
            let methods = [];
            
            // Try to parse as JSON first (handles ["stripe", "square", "paypal"])
            try {
                const parsed = JSON.parse(practitioner.payment_methods);
                if (Array.isArray(parsed)) {
                    methods = parsed.filter(m => m && typeof m === 'string');
                }
            } catch (e) {
                // If not JSON, treat as comma-separated string
                if (typeof practitioner.payment_methods === 'string') {
                    methods = practitioner.payment_methods
                        .split(',')
                        .map(m => m.trim().replace(/^["']|["']$/g, '')) // Remove quotes
                        .filter(m => m && m !== '[]');
                }
            }
            
            if (methods.length > 0) {
                hasContent = true;
                // Format method names: capitalize words, replace hyphens with spaces
                const paymentHtml = methods
                    .map(m => {
                        const formatted = m
                            .split('-')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ');
                        return `<div class="payment-insurance-item">${escapeHtml(formatted)}</div>`;
                    })
                    .join('');
                document.getElementById('payment-methods-list').innerHTML = paymentHtml;
                setVisible('payments-row', true);
            }
        }
        
        // ===== INSURANCE =====
        if (practitioner.accepts_insurance || (practitioner.insurance_providers && practitioner.insurance_providers.length > 0)) {
            const providers = practitioner.insurance_providers || [];
            if (providers.length > 0) {
                hasContent = true;
                // Format provider names: capitalize words, replace hyphens with spaces
                const insuranceHtml = providers
                    .map(p => {
                        const formatted = p
                            .split('-')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ');
                        return `<div class="payment-insurance-item">${escapeHtml(formatted)}</div>`;
                    })
                    .join('');
                document.getElementById('insurance-list').innerHTML = insuranceHtml;
                setVisible('insurance-row', true);
            } else if (practitioner.accepts_insurance) {
                hasContent = true;
                document.getElementById('insurance-list').innerHTML = '<div class="payment-insurance-item">Yes</div>';
                setVisible('insurance-row', true);
            }
        }
        
        // Show payments section if has any content
        if (hasContent) {
            setVisible('payments-section', true);
        }
    } catch (error) {

    }
}

// Render Services & Coverage Card - compact, information-dense
async function renderServicesCard() {
    try {
        let hasContent = false;
        
        // ===== SERVICE CATEGORIES (HIDDEN - for matching only, not public display) =====
        // Hide the services row entirely since services are not shown on public profile
        const servicesRow = document.getElementById('card-services-row');
        if (servicesRow) {
            setVisible(servicesRow, false);
        }
        
        // ===== SPECIALTY =====
        // Specialty is no longer tracked - managed in Match Settings
        
        // ===== LANGUAGES =====
        if (practitioner.languages && practitioner.languages.length > 0) {
            document.getElementById('card-languages').innerHTML = practitioner.languages
                .slice(0, 4)
                .map(l => escapeHtml(l))
                .join(', ');
            setVisible('card-languages-row', true);
        }
        
        // ===== SPECIALIZATIONS - HIDDEN (already covered by match settings) =====
        
        // Show card if has any content
        if (hasContent) {
            setVisible('services-card-section', true);
        }
    } catch (error) {

    }
}

// Render Credentials & Specializations Section (Compact)
function renderCredentialsCard() {
    let hasContent = false;
    
    // Prevent duplicate rendering - ensure credentials loaded once
    if (!practitioner.credentials) {
        practitioner.credentials = [];    }
    
    // Ensure credentials is an array (defense against malformed data)
    if (!Array.isArray(practitioner.credentials)) {

        practitioner.credentials = Object.values(practitioner.credentials || {});
    }
    
    // Build array with DEDUPLICATION: track unique credentials
    let allCredentials = [];
    let credentialIds = new Set(); // Track credential IDs to prevent duplicates
    
    // Add explicit credentials if they exist and are an array - ONLY ONCE
    // Note: Badges (Licensed, Certified) are already displayed in hero section, so we skip those
    if (Array.isArray(practitioner.credentials) && practitioner.credentials.length > 0) {
        practitioner.credentials.forEach(cred => {
            // Create unique key based on type and title to prevent duplicates
            const credKey = `${cred.credential_type}:${cred.title}:${cred.issuer || ''}`;
            
            // Skip badge pseudo-credentials - they're already in the hero section
            if (cred.credential_type === 'Certification' && cred.title === 'Certified Practitioner') {

                return;
            }
            if (cred.credential_type === 'License' && cred.title === 'Licensed Practitioner') {

                return;
            }
            
            if (!credentialIds.has(credKey)) {
                allCredentials.push(cred);
                credentialIds.add(credKey);
            }
        });

    }
    
    // ===== RENDER CREDENTIALS =====
    if (allCredentials.length > 0) {

        hasContent = true;
        
        // Separate by type
        const degrees = allCredentials.filter(c => c.credential_type === 'Degree');
        const licenses = allCredentials.filter(c => c.credential_type === 'License');
        const certs = allCredentials.filter(c => c.credential_type === 'Certification');
        const other = allCredentials.filter(c => !['Degree', 'License', 'Certification'].includes(c.credential_type));
        
        // Build HTML for each credential category
        let credentialsHtml = '';
        
        // Degrees
        if (degrees.length > 0) {
            credentialsHtml += '<div class="credentials-category">';
            credentialsHtml += '<div class="credentials-category-label">Degrees</div>';
            degrees.forEach(cred => {
                credentialsHtml += `
                    <div class="credential-card">
                        <div class="credential-title">${escapeHtml(cred.title || '')}</div>
                        ${cred.issuer ? `<div class="credential-issuer">${escapeHtml(cred.issuer)}</div>` : ''}
                    </div>
                `;
            });
            credentialsHtml += '</div>';
        }
        
        // Licenses
        if (licenses.length > 0) {
            credentialsHtml += '<div class="credentials-category">';
            credentialsHtml += '<div class="credentials-category-label">Licenses</div>';
            licenses.forEach(cred => {
                credentialsHtml += `
                    <div class="credential-card">
                        <div class="credential-title">${escapeHtml(cred.title || '')}</div>
                        ${cred.issuer ? `<div class="credential-issuer">${escapeHtml(cred.issuer)}</div>` : ''}
                    </div>
                `;
            });
            credentialsHtml += '</div>';
        }
        
        // Certifications
        if (certs.length > 0) {
            credentialsHtml += '<div class="credentials-category">';
            credentialsHtml += '<div class="credentials-category-label">Certifications</div>';
            certs.forEach(cred => {
                credentialsHtml += `
                    <div class="credential-card">
                        <div class="credential-title">${escapeHtml(cred.title || '')}</div>
                        ${cred.issuer ? `<div class="credential-issuer">${escapeHtml(cred.issuer)}</div>` : ''}
                    </div>
                `;
            });
            credentialsHtml += '</div>';
        }
        
        // Other
        if (other.length > 0) {
            credentialsHtml += '<div class="credentials-category">';
            other.forEach(cred => {
                credentialsHtml += `
                    <div class="credential-card">
                        <div class="credential-type">${escapeHtml(cred.credential_type || 'Credential')}</div>
                        <div class="credential-title">${escapeHtml(cred.title || '')}</div>
                        ${cred.issuer ? `<div class="credential-issuer">${escapeHtml(cred.issuer)}</div>` : ''}
                    </div>
                `;
            });
            credentialsHtml += '</div>';
        }
        
        const credListEl = document.getElementById('card-credentials-list');
        
        if (credListEl) {
            credListEl.innerHTML = credentialsHtml;
        } else {
            console.error('[Profile] card-credentials-list element NOT FOUND');
        }

        setVisible('card-credentials-row', true);

    } else {

    }
    
    if (hasContent) {
        setVisible('credentials-card-section', true);
    } else {
        setVisible('credentials-card-section', false);
    }
}

// Render Contact Card - Simple hyperlinks to social media/website
function renderContactCard() {
    if (!practitioner.social_media || typeof practitioner.social_media !== 'object') {
        return; // No social media data
    }
    
    const socialPlatforms = {
        website: 'Website',
        facebook: 'Facebook',
        twitter: 'Twitter',
        x: 'X',
        instagram: 'Instagram',
        linkedin: 'LinkedIn',
        youtube: 'YouTube',
        tiktok: 'TikTok',
        pinterest: 'Pinterest'
    };
    
    const links = Object.entries(practitioner.social_media)
        .filter(([key, value]) => value && typeof value === 'string' && socialPlatforms[key])
        .map(([platform, url]) => {
            const label = socialPlatforms[platform];
            return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="contact-link">${escapeHtml(label)}</a>`;
        });
    
    if (links.length === 0) {
        return; // No valid links
    }
    
    const contactHtml = links.join('<span class="contact-link-separator"> · </span>');
    document.getElementById('contact-links-list').innerHTML = contactHtml;
    setVisible('contact-card-section', true);

}

// Render Reviews Card - compact
function renderReviewsCard() {
    if (reviews.length === 0) {
        setVisible('no-reviews-state', true);
        setVisible('reviews-container', false);
        setVisible('reviews-section', true);
        return;
    }
    
    setVisible('reviews-section', true);
    setVisible('no-reviews-state', false);
    
    const reviewsHtml = reviews
        .slice(0, 3) // Show top 3 reviews
        .map(review => {
            const stars = Array(review.rating || 5)
                .fill(0)
                .map(() => `<span class="star filled">★</span>`)
                .join('');
            const emptyStars = Array(5 - (review.rating || 5))
                .fill(0)
                .map(() => `<span class="star">★</span>`)
                .join('');
            
            // Build intelligent client name from stored database values
            let displayName = 'Client';
            const first = review.client_first_name?.trim();
            const last = review.client_last_name?.trim();
            
            if (first && last) {
                displayName = `${first} ${last[0]}`;
            } else if (last) {
                displayName = last;
            } else if (first) {
                displayName = first;
            } else if (review.client_name) {
                displayName = review.client_name;
            }
            
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
                <div class="review-item">
                    <div class="review-stars">${stars}${emptyStars}</div>
                    <p class="review-text">"${escapeHtml(review.review_text || '')}"</p>
                    ${photosHtml}
                    <div class="review-author">— ${escapeHtml(displayName)}</div>
                </div>
            `;
        })
        .join('');
    
    document.getElementById('reviews-container').innerHTML = reviewsHtml;
}

// Render Media & Connect Card - gallery + social compact
function renderMediaCard() {
    let hasContent = false;
    
    // ===== GALLERY =====
    if (practitioner.gallery_photos && practitioner.gallery_photos.length > 0) {
        hasContent = true;
        const galleryHtml = practitioner.gallery_photos
            .slice(0, 6)
            .map((photo, idx) => {
                const photoUrl = typeof photo === 'string' ? photo : photo.url;
                return `
                    <div class="gallery-item-compact" data-photo-url="${escapeHtml(photoUrl)}">
                        <img src="${escapeHtml(photoUrl)}" alt="Gallery" loading="lazy">
                    </div>
                `;
            })
            .join('');
        
        const galleryGrid = document.getElementById('gallery-grid');
        if (galleryGrid) {
            galleryGrid.innerHTML = galleryHtml;
            // Attach event listeners to gallery items
            galleryGrid.querySelectorAll('.gallery-item-compact').forEach(item => {
                item.addEventListener('click', (e) => {
                    const photoUrl = item.getAttribute('data-photo-url');
                    openImageModal(photoUrl);
                });
            });
        }
        const cardGalleryRow = document.getElementById('card-gallery-row');
        if (galleryGrid) {
            galleryGrid.innerHTML = galleryHtml;
        }
        if (cardGalleryRow) {
            setVisible(cardGalleryRow, true);
        }
    }
    
    // ===== SOCIAL MEDIA =====
    if (practitioner.social_media && typeof practitioner.social_media === 'object') {
        const socialLinks = practitioner.social_media;
        const platforms = {
            facebook: { icon: '𝘧', label: 'Facebook' },
            twitter: { icon: '𝘹', label: 'Twitter' },
            instagram: { icon: '◉', label: 'Instagram' },
            linkedin: { icon: 'in', label: 'LinkedIn' },
            youtube: { icon: '▶', label: 'YouTube' },
            website: { icon: '🌐', label: 'Website' }
        };
        
        const links = Object.entries(socialLinks)
            .filter(([key, value]) => value && typeof value === 'string')
            .map(([platform, url]) => {
                const info = platforms[platform] || { icon: '🔗', label: platform };
                return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="social-link-compact" title="${info.label}">${info.icon}</a>`;
            })
            .join('');
        
        if (links) {
            hasContent = true;
            const socialLinksCompact = document.getElementById('social-links-compact');
            const cardSocialRow = document.getElementById('card-social-row');
            if (socialLinksCompact) {
                socialLinksCompact.innerHTML = links;
            }
            if (cardSocialRow) {
                setVisible(cardSocialRow, true);
            }
        }
    }
    
    if (hasContent) {
        setVisible('media-card-section', true);
    }
}

// Render FAQ Section
function renderFAQ() {
    if (!practitioner.faqs || (Array.isArray(practitioner.faqs) && practitioner.faqs.length === 0) || 
        (typeof practitioner.faqs === 'object' && Object.keys(practitioner.faqs).length === 0)) {
        return; // Don't show if empty
    }
    
    let faqItems = [];
    
    // Handle if faqs is an array of Q&A objects
    if (Array.isArray(practitioner.faqs)) {
        faqItems = practitioner.faqs.filter(item => item && item.question && item.answer);
    } 
    // Handle if faqs is an object with question/answer pairs
    else if (typeof practitioner.faqs === 'object') {
        faqItems = Object.entries(practitioner.faqs)
            .filter(([key, value]) => value && value.question && value.answer)
            .map(([key, value]) => value);
    }
    
    if (faqItems.length === 0) return;
    
    const faqHtml = faqItems
        .slice(0, 6) // Show max 6 FAQs
        .map((item, idx) => `
            <div class="faq-item">
                <h4 class="faq-question">
                    <span class="faq-number">${idx + 1}.</span>
                    ${escapeHtml(item.question)}
                </h4>
                <p class="faq-answer">${escapeHtml(item.answer)}</p>
            </div>
        `)
        .join('');
    
    document.getElementById('faq-container').innerHTML = faqHtml;
    setVisible('faq-section', true);
}

// Calculate average rating from reviews
function calculateAverageRating() {
    if (reviews.length === 0) return 5.0;
    const sum = reviews.reduce((acc, review) => acc + (review.rating || 5), 0);
    return sum / reviews.length;
}

// Convert 24-hour time to 12-hour format (e.g., "0900" to "9:00 AM")
function convertTo12Hour(time24) {
    if (!time24) return '';
    
    // Remove any non-digit characters and pad if needed
    const cleanTime = time24.replace(/\D/g, '').padStart(4, '0');
    const hours = parseInt(cleanTime.substring(0, 2), 10);
    const minutes = cleanTime.substring(2, 4);
    
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    
    return `${hours12}:${minutes} ${period}`;
}

// Setup gallery modal
function setupGalleryModal() {
    const modal = document.getElementById('image-modal');
    const closeBtn = document.querySelector('.image-modal-close');
    
    if (!closeBtn || !modal) return; // Modal may not be present in all layouts
    
    closeBtn.onclick = () => {
        setVisible(modal, false);
    };
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            setVisible(modal, false);
        }
    };
    
    // Store modal globally for openImageModal to use
    window.imageModal = modal;
}

// Open image modal
function openImageModal(imageUrl) {
    const modal = window.imageModal || document.getElementById('image-modal');
    if (modal) {
        const modalImg = document.getElementById('image-modal-img');
        setVisible(modal, true, 'visible-flex');
        modalImg.src = imageUrl;
    }
}

// Initialize review notifications once page is ready
document.addEventListener('DOMContentLoaded', () => {
  if (window.supabaseClient && window.authManager && window.reviewNotificationManager) {
    window.reviewNotificationManager.init(window.supabaseClient, window.authManager);
  }
});