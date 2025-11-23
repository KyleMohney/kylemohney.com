/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: scripts/practitioner-profile.js                             ║
║  Purpose: Public practitioner profile page rendering               ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

TABLE OF CONTENTS
  1. INITIALIZATION & DATA LOADING
  2. PROFILE RENDERING FUNCTIONS
  3. SECTION RENDERERS (Hero, About, Services, Credentials, Contact, Media, Reviews, FAQ)
  4. UTILITY FUNCTIONS
  5. ERROR HANDLING

═══════════════════════════════════════════════════════════════════
DESIGN SYSTEM
  Colors: --rooted-primary (#5c9a72), --rooted-accent (#d4c47c)
  Typography: Inter (headings), Lora (body), minimum 16px
  Spacing: Generous, mobile-first responsive (360px+)
  Styles: practitioner-profile-compact.css
═══════════════════════════════════════════════════════════════════
*/

// ======================================================
// 1. INITIALIZATION & DATA LOADING
// ======================================================

let practitioner = null;
let reviews = [];

// Flag for injections.js to know this page handles its own header
window.PRACTITIONER_PROFILE_PAGE = true;

// Set default role immediately to prevent race condition
window.DETECTED_USER_ROLE = 'public';

// Detect user role directly from localStorage (where authManager stores it)
function detectUserRoleForHeader() {
    try {
        console.log('[Practitioner Profile] 🔍 Detecting user role from localStorage...');
        
        // authManager stores user data in rvUser
        const rvUserStr = localStorage.getItem('rvUser');
        
        if (!rvUserStr) {
            console.log('[Practitioner Profile] ✓ No rvUser in localStorage → public header');
            window.DETECTED_USER_ROLE = 'public';
            return;
        }
        
        const userData = JSON.parse(rvUserStr);
        const userRole = userData?.role;
        
        if (!userRole) {
            console.log('[Practitioner Profile] ✓ No role in rvUser → public header');
            window.DETECTED_USER_ROLE = 'public';
        } else {
            console.log('[Practitioner Profile] 🔑 Role from localStorage:', userRole);
            window.DETECTED_USER_ROLE = userRole;
        }
        
        console.log('[Practitioner Profile] ✅ FINAL ROLE:', window.DETECTED_USER_ROLE);
        
    } catch (error) {
        console.error('[Practitioner Profile] ❌ Error parsing localStorage:', error);
        window.DETECTED_USER_ROLE = 'public';
    }
}

// Call role detection immediately (synchronous, no waiting)
console.log('[Practitioner Profile] Script loading...');
detectUserRoleForHeader();

document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Practitioner Profile] DOM Content Loaded');
    
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
                
                if (data) {
                    practitioner = data;
                } else {
                    throw new Error('Practitioner profile not found');
                }
            } else {
                throw new Error('No practitioner ID provided and not logged in');
            }
        } else {
            // Check if practitionerId looks like a serial (P1, P2, etc) instead of UUID
            if (!practitionerId.includes('-')) {
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
            
            // Fetch practitioner from practitioners table
            const { data, error } = await window.supabaseClient
                .from('practitioners')
                .select('*')
                .eq('id', practitionerId)
                .single();
            
            if (error) throw error;
            practitioner = data;
            
            // Fetch profile content from practitioner_profiles table
            const { data: profileContent, error: profileError } = await window.supabaseClient
                .from('practitioner_profiles')
                .select('*')
                .eq('id', practitionerId)
                .single();
            
            if (!profileError && profileContent) {
                // Merge profile content into practitioner object
                practitioner = {
                    ...practitioner,
                    ...profileContent
                };
                console.log('[Practitioner Profile] Profile content loaded from practitioner_profiles');
            }
            
            // Fetch credentials from practitioner_credentials table
            // Query by practitioner_serial (not id) to match the foreign key
            console.log('[Practitioner Profile] Fetching credentials for serial:', practitioner.serial_number);
            const { data: credentialsData, error: credentialsError } = await window.supabaseClient
                .from('practitioner_credentials')
                .select('*')
                .eq('practitioner_serial', practitioner.serial_number)
                .maybeSingle();
            
            console.log('[Practitioner Profile] Credentials query result - error:', credentialsError);
            console.log('[Practitioner Profile] Credentials query result - data:', credentialsData);
            
            if (!credentialsError && credentialsData) {
                // Merge credentials data into practitioner object
                console.log('[Practitioner Profile] ✓ Credentials row found for:', practitioner.serial_number);
                console.log('[Practitioner Profile] Raw credentialsData:', credentialsData);
                console.log('[Practitioner Profile] credentials field type:', typeof credentialsData.credentials);
                console.log('[Practitioner Profile] credentials field value:', credentialsData.credentials);
                console.log('[Practitioner Profile] badge_certified:', credentialsData.badge_certified);
                console.log('[Practitioner Profile] badge_licensed:', credentialsData.badge_licensed);
                console.log('[Practitioner Profile] background_check_status:', credentialsData.background_check_status);
                
                practitioner = {
                    ...practitioner,
                    credentials: credentialsData.credentials || [],
                    badge_verified: credentialsData.badge_verified || false,
                    badge_certified: credentialsData.badge_certified || false,
                    badge_licensed: credentialsData.badge_licensed || false,
                    badge_background_check_verified: credentialsData.badge_background_check_verified || false,
                    credentials_verified: credentialsData.credentials_verified || false,
                    background_check_status: credentialsData.background_check_status || null,
                    background_check_date: credentialsData.background_check_date || null,
                    continuing_education: credentialsData.continuing_education || []
                };
                console.log('[Practitioner Profile] ✓ Credentials loaded from practitioner_credentials');
                console.log('[Practitioner Profile] Merged practitioner.badge_certified:', practitioner.badge_certified);
                console.log('[Practitioner Profile] Merged practitioner.badge_licensed:', practitioner.badge_licensed);
                console.log('[Practitioner Profile] Merged practitioner.background_check_status:', practitioner.background_check_status);
            } else if (credentialsError) {
                console.error('[Practitioner Profile] ✗ Error loading credentials:', credentialsError);
                console.warn('[Practitioner Profile] Initializing credentials with defaults');
                practitioner = {
                    ...practitioner,
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
            } else {
                console.warn('[Practitioner Profile] No credentials row found for practitioner, initializing with defaults');
                practitioner = {
                    ...practitioner,
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
            }
            
            // Fetch availability from practitioner_availability table
            const { data: availabilityData, error: availabilityError } = await window.supabaseClient
                .from('practitioner_availability')
                .select('*')
                .eq('id', practitionerId)
                .single();
            
            if (!availabilityError && availabilityData) {
                // Merge availability data into practitioner object
                practitioner = {
                    ...practitioner,
                    in_person_enabled: availabilityData.in_person_enabled,
                    virtual_enabled: availabilityData.virtual_enabled,
                    housecalls_enabled: availabilityData.housecalls_enabled,
                    timezone: availabilityData.timezone,
                    availability_schedule: availabilityData.availability_schedule,
                    zipcodes: availabilityData.zipcodes,
                    service_radius: availabilityData.service_radius,
                    service_states: availabilityData.service_states
                };
                console.log('[Practitioner Profile] Availability loaded from practitioner_availability');
            }
            
            // Fetch match settings from practitioner_match_settings table
            const { data: matchSettingsData, error: matchSettingsError } = await window.supabaseClient
                .from('practitioner_match_settings')
                .select('*')
                .eq('id', practitionerId)
                .single();
            
            if (!matchSettingsError && matchSettingsData) {
                // Merge match settings data into practitioner object
                practitioner = {
                    ...practitioner,
                    service_categories: matchSettingsData.service_categories,
                    pricing_model: matchSettingsData.pricing_model,
                    accepts_insurance: matchSettingsData.accepts_insurance,
                    insurance_providers: matchSettingsData.insurance_providers,
                    payment_methods: matchSettingsData.payment_methods
                };
                console.log('[Practitioner Profile] Match settings loaded from practitioner_match_settings');
            }
        }
        
        console.log('[Practitioner Profile] Full practitioner data loaded:', practitioner);
        console.log('[Practitioner Profile] Payment methods:', practitioner.payment_methods);
        console.log('[Practitioner Profile] Insurance providers:', practitioner.insurance_providers);
        console.log('[Practitioner Profile] Practice city:', practitioner.practice_city);
        console.log('[Practitioner Profile] Practice state:', practitioner.practice_state);
        console.log('[Practitioner Profile] Accepts insurance:', practitioner.accepts_insurance);
        
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
        
        // Hide loading, show content
        document.getElementById('profile-loading').style.display = 'none';
        document.getElementById('profile-content').style.display = 'block';
        
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
        
    } catch (error) {
        console.error('[Practitioner Profile] Error loading profile:', error);
        document.getElementById('profile-loading').style.display = 'none';
        document.getElementById('profile-error').style.display = 'block';
        document.getElementById('error-message').textContent = error.message || 'Unable to load practitioner profile';
    }
    
    // Setup gallery modal
    setupGalleryModal();
});

/**
 * Load reviews for the practitioner
 */
async function loadReviews() {
    try {
        console.log('[Practitioner Profile] 🔍 Loading reviews for practitioner_serial:', practitioner.serial_number);
        
        const { data, error } = await window.supabaseClient
            .from('reviews')
            .select('*')
            .eq('practitioner_serial', practitioner.serial_number)
            .eq('is_visible', true)
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (error) {
            console.warn('[Practitioner Profile] ⚠️ Error loading reviews:', error);
            console.warn('[Practitioner Profile] Error code:', error.code, 'Message:', error.message);
            reviews = [];
        } else {
            reviews = data || [];
            console.log('[Practitioner Profile] ✅ Loaded', reviews.length, 'reviews');
            console.log('[Practitioner Profile] Review data:', reviews);
            
            // Setup realtime listener for new reviews
            setupReviewsRealtimeListener();
        }
    } catch (error) {
        console.error('[Practitioner Profile] ❌ Unexpected error loading reviews:', error);
        reviews = [];
    }
}

/**
 * Setup realtime listener for new reviews
 */
function setupReviewsRealtimeListener() {
    if (!practitioner || !practitioner.serial_number) {
        console.warn('[Practitioner Profile] Cannot setup reviews listener - no practitioner serial');
        return;
    }
    
    console.log('[Practitioner Profile] 🔌 Setting up realtime listener for new reviews');
    
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
                console.log('[Practitioner Profile] 🔔 NEW REVIEW RECEIVED via Realtime!');
                console.log('[Practitioner Profile] Review data:', payload.new);
                
                // Only add if visible
                if (payload.new.is_visible) {
                    reviews.unshift(payload.new);  // Add to beginning (newest first)
                    console.log('[Practitioner Profile] ✅ Review added to local array - total:', reviews.length);
                    renderReviewsCard();
                } else {
                    console.log('[Practitioner Profile] ℹ️ Review not visible yet, skipping');
                }
            }
        )
        .subscribe((status) => {
            console.log('[Practitioner Profile] Realtime subscription status:', status);
            if (status === 'SUBSCRIBED') {
                console.log('[Practitioner Profile] ✅ Reviews Realtime SUBSCRIBED');
            }
        });
}

/**
 * Load service categories from match settings
 */
async function loadServiceCategories() {
    try {
        // First, get the practitioner's selected services
        const { data: selectedServices, error: selectError } = await window.supabaseClient
            .from('practitioner_selected_services')
            .select('subcategory_id')
            .eq('practitioner_serial', practitioner.serial_number)
            .eq('is_active', true);
        
        if (selectError) {
            console.warn('[Practitioner Profile] Error loading selected services:', selectError);
            practitioner.service_categories = [];
            return;
        }
        
        if (!selectedServices || selectedServices.length === 0) {
            console.log('[Practitioner Profile] No service categories found');
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
            console.warn('[Practitioner Profile] Error loading subcategory names:', subError);
            practitioner.service_categories = [];
            return;
        }
        
        practitioner.service_categories = (subcategories || [])
            .map(item => item.name)
            .filter(name => name);
        
        console.log('[Practitioner Profile] Loaded', practitioner.service_categories.length, 'service categories:', practitioner.service_categories);
    } catch (error) {
        console.error('[Practitioner Profile] Error loading service categories:', error);
        practitioner.service_categories = [];
    }
}

/**
 * Setup Contact button - check user role and disable if practitioner
 */
async function setupContactButton() {
    console.log('[Practitioner Profile] setupContactButton() called');
    const contactBtn = document.getElementById('btn-contact');
    console.log('[Practitioner Profile] Contact button found:', !!contactBtn);
    if (!contactBtn) return;
    
    try {
        console.log('[Practitioner Profile] authManager available:', !!window.authManager);
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        console.log('[Practitioner Profile] Current user:', currentUser?.id || 'none');
        
        if (!currentUser) {
            // Public user - button is active, redirects to signup/login on click
            console.log('[Practitioner Profile] Setting up button for public user');
            contactBtn.addEventListener('click', () => {
                console.log('[Practitioner Profile] Public user clicked Contact');
                window.location.href = '/rooted-vitality/dashboard/signup.html';
            });
            return;
        }
        
        // Check if current user is a practitioner
        const rvUserStr = localStorage.getItem('rvUser');
        console.log('[Practitioner Profile] rvUser in localStorage:', !!rvUserStr);
        if (!rvUserStr) {
            // Client - button is active
            console.log('[Practitioner Profile] Setting up button for client (no rvUser)');
            contactBtn.addEventListener('click', () => {
                console.log('[Practitioner Profile] Client clicked Contact');
                openConnectionRequest(practitioner.id);
            });
            return;
        }
        
        const rvUser = JSON.parse(rvUserStr);
        const userRole = rvUser.role;
        console.log('[Practitioner Profile] User role:', userRole);
        
        if (userRole === 'practitioner') {
            // Practitioner viewing profile - check if it's their own
            console.log('[Practitioner Profile] Practitioner user - checking if own profile');
            
            if (currentUser.id === practitioner.id) {
                // Viewing their own profile - grey out button like a customer would see it
                console.log('[Practitioner Profile] Practitioner viewing own profile - greying out button');
                contactBtn.disabled = true;
                contactBtn.style.opacity = '0.5';
                contactBtn.style.cursor = 'not-allowed';
                // Keep text as "Contact" so they see what customer sees
            } else {
                // Viewing another practitioner's profile - disable with message
                console.log('[Practitioner Profile] Practitioner viewing another practitioner profile');
                contactBtn.disabled = true;
                contactBtn.textContent = "Can't contact";
                contactBtn.style.opacity = '0.6';
                contactBtn.style.cursor = 'not-allowed';
                contactBtn.title = 'Practitioners cannot contact other practitioners';
            }
        } else if (userRole === 'client') {
            // Client - check if already matched with this practitioner
            console.log('[Practitioner Profile] Setting up button for client - checking for existing matches');
            
            // Get client's serial number
            const { data: clientData, error: clientError } = await window.supabaseClient
                .from('clients')
                .select('serial_number')
                .eq('id', currentUser.id)
                .single();
            
            if (clientError || !clientData) {
                console.error('[Practitioner Profile] Error fetching client serial:', clientError);
                // Default to active button if we can't check
                contactBtn.addEventListener('click', () => {
                    console.log('[Practitioner Profile] Client clicked Contact');
                    openConnectionRequest(practitioner.id);
                });
                return;
            }
            
            // Get practitioner's serial number
            const { data: proData, error: proError } = await window.supabaseClient
                .from('practitioners')
                .select('serial_number')
                .eq('id', practitioner.id)
                .single();
            
            if (proError || !proData) {
                console.error('[Practitioner Profile] Error fetching practitioner serial:', proError);
                // Default to active button if we can't check
                contactBtn.addEventListener('click', () => {
                    console.log('[Practitioner Profile] Client clicked Contact');
                    openConnectionRequest(practitioner.id);
                });
                return;
            }
            
            // Check for existing matches
            const { data: existingMatches, error: matchError } = await window.supabaseClient
                .from('project_practitioner_matches')
                .select('id')
                .eq('client_serial', clientData.serial_number)
                .eq('practitioner_serial', proData.serial_number);
            
            if (matchError) {
                console.error('[Practitioner Profile] Error checking matches:', matchError);
                // Default to active button if we can't check
                contactBtn.addEventListener('click', () => {
                    console.log('[Practitioner Profile] Client clicked Contact');
                    openConnectionRequest(practitioner.id);
                });
                return;
            }
            
            if (existingMatches && existingMatches.length > 0) {
                // Already matched - disable button and show Matched
                console.log('[Practitioner Profile] Already matched with this practitioner');
                contactBtn.disabled = true;
                contactBtn.textContent = 'Matched';
                contactBtn.style.opacity = '0.6';
                contactBtn.style.cursor = 'not-allowed';
                contactBtn.title = 'You are already matched with this practitioner';
            } else {
                // Not matched - button is active
                console.log('[Practitioner Profile] Not matched yet - button is active');
                contactBtn.addEventListener('click', () => {
                    console.log('[Practitioner Profile] Client clicked Contact');
                    openConnectionRequest(practitioner.id);
                });
            }
        }
    } catch (error) {
        console.error('[Practitioner Profile] Error setting up Contact button:', error);
    }
}

/**
 * Open connection request modal (client action)
 */
async function openConnectionRequest(practitionerId) {
    console.log('[Practitioner Profile] openConnectionRequest called with ID:', practitionerId);
    if (!practitionerId) {
        console.warn('[Practitioner Profile] No practitioner ID provided');
        return;
    }
    
    const currentUser = window.authManager.getCurrentUser();
    console.log('[Practitioner Profile] Current user:', currentUser?.id);
    if (!currentUser) {
        console.log('[Practitioner Profile] No user, redirecting to signup');
        window.location.href = '/rooted-vitality/dashboard/signup.html';
        return;
    }
    
    try {
        // First, check if we have a project_id from URL (from find-practitioners flow)
        const urlParams = new URLSearchParams(window.location.search);
        let projectIdFromUrl = urlParams.get('project_id');
        console.log('[Practitioner Profile] Project ID from URL:', projectIdFromUrl);
        
        // Also check sessionStorage as fallback
        const storedProjectId = sessionStorage.getItem('selectedProjectId');
        console.log('[Practitioner Profile] Stored project ID from sessionStorage:', storedProjectId);
        console.log('[Practitioner Profile] Stored project ID type:', typeof storedProjectId);
        
        const projectId = projectIdFromUrl || storedProjectId;
        console.log('[Practitioner Profile] Final project ID to use:', projectId);
        
        if (projectId && projectId !== 'undefined' && projectId !== '') {
            // We already know the project - use it directly
            console.log('[Practitioner Profile] Using known project, creating match directly');
            await createMatchWithProjectId(projectId, practitionerId);
            return;
        }
        
        // Otherwise, fetch all projects and let user choose
        console.log('[Practitioner Profile] No project in sessionStorage, fetching all projects');
        
        // Get client's projects
        const { data: clientData, error: clientError } = await window.supabaseClient
            .from('clients')
            .select('serial_number, id')
            .eq('id', currentUser.id)
            .single();
        
        if (clientError || !clientData) {
            console.error('[Practitioner Profile] Client fetch error:', clientError);
            alert('Error: Could not find your client profile');
            return;
        }
        console.log('[Practitioner Profile] Client data:', clientData);
        
        // Get practitioner's serial number
        console.log('[Practitioner Profile] Fetching practitioner serial...');
        const { data: proData, error: proError } = await window.supabaseClient
            .from('practitioners')
            .select('serial_number')
            .eq('id', practitionerId)
            .single();
        
        if (proError || !proData) {
            console.error('[Practitioner Profile] Practitioner fetch error:', proError);
            alert('Error: Could not find practitioner details');
            return;
        }
        console.log('[Practitioner Profile] Practitioner serial:', proData.serial_number);
        
        // Get client's projects (with category info)
        console.log('[Practitioner Profile] Fetching client projects...');
        console.log('[Practitioner Profile] Query params - client_serial:', clientData.serial_number);
        
        const { data: projects, error: projectError } = await window.supabaseClient
            .from('projects')
            .select('id, project_serial, description, client_serial, category_id, category_name, project_status, created_at')
            .eq('client_serial', clientData.serial_number)
            .order('created_at', { ascending: false });
        
        if (projectError) {
            console.error('[Practitioner Profile] Project fetch error details:', {
                message: projectError.message,
                code: projectError.code,
                details: projectError.details,
                hint: projectError.hint
            });
            alert('Error: Could not load your projects. ' + (projectError.message || 'Unknown error'));
            return;
        }
        console.log('[Practitioner Profile] Projects found:', projects?.length || 0);
        
        if (!projects || projects.length === 0) {
            alert('Please create a project first before connecting with practitioners');
            window.location.href = '/rooted-vitality/dashboard/client/pages/my-wellness.html';
            return;
        }
        
        // Always use the first/most recent project (they're sorted by created_at DESC)
        console.log('[Practitioner Profile] Using most recent project:', projects[0].id);
        await createMatchAndRedirect(projects[0], practitionerId, proData.serial_number);
        
    } catch (error) {
        console.error('[Practitioner Profile] Error in openConnectionRequest:', error);
        alert('Error processing your connection request');
    }
}

/**
 * Create match with a known project ID
 */
async function createMatchWithProjectId(projectId, practitionerId) {
    try {
        console.log('[Practitioner Profile] createMatchWithProjectId called with projectId:', projectId, 'practitionerId:', practitionerId);
        
        if (!projectId || projectId === 'undefined' || projectId === '') {
            console.error('[Practitioner Profile] ✗ No valid project ID provided to createMatchWithProjectId');
            console.error('[Practitioner Profile] Project ID value:', projectId);
            console.error('[Practitioner Profile] Project ID type:', typeof projectId);
            alert('Error: No valid project selected');
            return;
        }
        
        console.log('[Practitioner Profile] ✓ Project ID is valid, proceeding...');
        
        // Fetch the project to get client_serial and practitioner serial
        console.log('[Practitioner Profile] Fetching project details...');
        const { data: project, error: projectError } = await window.supabaseClient
            .from('projects')
            .select('client_serial')
            .eq('id', projectId)
            .single();
        
        if (projectError || !project) {
            console.error('[Practitioner Profile] Project fetch error:', projectError);
            alert('Error: Could not find your project');
            return;
        }
        console.log('[Practitioner Profile] Project fetched successfully:', project);
        
        // Get practitioner's serial number
        console.log('[Practitioner Profile] Fetching practitioner details...');
        const { data: proData, error: proError } = await window.supabaseClient
            .from('practitioners')
            .select('serial_number')
            .eq('id', practitionerId)
            .single();
        
        if (proError || !proData) {
            console.error('[Practitioner Profile] Practitioner fetch error:', proError);
            alert('Error: Could not find practitioner details');
            return;
        }
        console.log('[Practitioner Profile] Practitioner fetched successfully:', proData);
        
        console.log('[Practitioner Profile] Calling createMatchAndRedirect with:', { id: projectId, client_serial: project.client_serial }, practitionerId, proData.serial_number);
        await createMatchAndRedirect({ id: projectId, client_serial: project.client_serial }, practitionerId, proData.serial_number);
        
    } catch (error) {
        console.error('[Practitioner Profile] Exception in createMatchWithProjectId:', error);
        alert('Error creating connection');
    }
}

/**
 * Create match and redirect to My Matches with messaging open
 */
async function createMatchAndRedirect(project, practitionerId, practitionerSerial) {
    try {
        console.log('[Practitioner Profile] Creating match for project:', project.project_serial);
        console.log('[Practitioner Profile] Project object keys:', Object.keys(project));
        console.log('[Practitioner Profile] Full project object:', project);
        
        // Use RPC function to create match (bypasses RLS restrictions)
        const { data, error } = await window.supabaseClient.rpc('create_practitioner_match', {
            p_project_serial: project.project_serial,
            p_client_serial: project.client_serial,
            p_practitioner_serial: practitionerSerial,
            p_match_score: 75
        });
        
        if (error) {
            // 23505 = duplicate key (match already exists - this is fine, proceed to my-matches)
            if (error.code === '23505') {
                console.log('[Practitioner Profile] Match already exists, proceeding to my-matches');
            } else {
                console.error('[Practitioner Profile] Error creating match:', error);
                alert('Error creating connection');
                return;
            }
        } else {
            console.log('[Practitioner Profile] Match created successfully');
        }

        // Create auto-message
        try {
            const currentUser = window.authManager.getCurrentUser();
            const { data: clientData, error: clientError } = await window.supabaseClient
                .from('clients')
                .select('id, first_name')
                .eq('id', currentUser.id)
                .single();

            if (!clientError && clientData) {
                const clientName = clientData.first_name || 'Client';
                const messageText = `${clientName} wants connect about their wellness project!`;

                const { error: msgInsertError } = await window.supabaseClient.rpc('create_project_message', {
                    p_project_id: project.id,
                    p_practitioner_id: practitionerId,
                    p_client_id: clientData.id,
                    p_sender_id: clientData.id,
                    p_sender_type: 'client',
                    p_message: messageText
                });
                
                if (msgInsertError) {
                    console.error('[Practitioner Profile] Error inserting auto-message:', msgInsertError);
                } else {
                    console.log('[Practitioner Profile] Auto-message created successfully');
                }
            }
        } catch (msgError) {
            console.warn('[Practitioner Profile] Error creating auto-message:', msgError);
        }
        
        // Redirect to My Matches with project and practitioner in query params
        const redirectUrl = `/rooted-vitality/dashboard/client/pages/my-matches.html?project_id=${project.project_serial}&practitioner_serial=${practitionerSerial}`;
        console.log('[Practitioner Profile] Redirecting to:', redirectUrl);
        window.location.href = redirectUrl;
        
    } catch (error) {
        console.error('[Practitioner Profile] Exception creating match:', error);
        alert('Error creating connection');
    }
}

/**
 * Show project selector modal for multi-project clients
 */


// ======================================================
// 2. PROFILE RENDERING FUNCTIONS
// ======================================================

/**
 * Render the complete profile
 */
function renderProfile() {
    console.log('[Practitioner Profile] Rendering profile (compact)...');
    
    renderHero();
    renderVideo();
    renderAbout();
    renderServicesCard();
    renderCredentialsCard();
    renderContactCard();
    renderMediaCard();
    renderReviewsCard();
    renderFAQ();
    
    console.log('[Practitioner Profile] Profile rendered');
}

// ======================================================
// 3. SECTION RENDERERS
// ======================================================

/**
 * Render hero section with photo, name, badges, stats
 */
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
    console.log('[Practitioner Profile] Processing badges...');
    console.log('[Practitioner Profile] Background Check Status:', practitioner.background_check_status);
    console.log('[Practitioner Profile] Badge Certified:', practitioner.badge_certified);
    console.log('[Practitioner Profile] Badge Licensed:', practitioner.badge_licensed);
    console.log('[Practitioner Profile] Badge Verified:', practitioner.badge_verified);
    
    // Show badges based on status values (background_check only when 'passed')
    if (practitioner.background_check_status === 'passed') {
        console.log('[Practitioner Profile] ✓ Showing Background Check badge');
        document.getElementById('badge-background-check').style.display = 'inline-flex';
    } else {
        document.getElementById('badge-background-check').style.display = 'none';
    }
    
    if (practitioner.badge_certified) {
        console.log('[Practitioner Profile] ✓ Showing Certified badge');
        document.getElementById('badge-certified').style.display = 'inline-flex';
    } else {
        document.getElementById('badge-certified').style.display = 'none';
    }
    
    if (practitioner.badge_licensed) {
        console.log('[Practitioner Profile] ✓ Showing Licensed badge');
        document.getElementById('badge-licensed').style.display = 'inline-flex';
    } else {
        document.getElementById('badge-licensed').style.display = 'none';
    }
    
    if (practitioner.badge_verified) {
        console.log('[Practitioner Profile] ✓ Showing Verified badge');
        document.getElementById('badge-verified').style.display = 'inline-flex';
    } else {
        document.getElementById('badge-verified').style.display = 'none';
    }
    
    // ===== HERO QUICK INFO: Location =====
    if (practitioner.practice_city && practitioner.practice_state) {
        const locationDisplay = `${practitioner.practice_city}, ${practitioner.practice_state}`;
        document.getElementById('hero-location').textContent = locationDisplay;
        document.getElementById('hero-location-item').style.display = 'flex';
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
                    document.getElementById('hero-hours-item').style.display = 'flex';
                }
            }
        } catch (e) {
            console.warn('Hours parse error:', e);
        }
    }
    
    // ===== HERO QUICK INFO: Service Types =====
    const types = [];
    if (practitioner.in_person_enabled) types.push('In-Person');
    if (practitioner.housecalls_enabled) types.push('House Calls');
    if (practitioner.virtual_enabled) types.push('Virtual');
    
    if (types.length > 0) {
        document.getElementById('hero-service-types').textContent = types.join(', ');
        document.getElementById('hero-service-types-item').style.display = 'flex';
    }
    
    // ===== HERO QUICK INFO: Languages =====
    if (practitioner.languages && Array.isArray(practitioner.languages) && practitioner.languages.length > 0) {
        const languages = practitioner.languages.filter(lang => lang && lang.trim());
        if (languages.length > 0) {
            document.getElementById('hero-languages').textContent = languages.join(', ');
            document.getElementById('hero-languages-item').style.display = 'flex';
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
        .map((_, i) => `<span class="star" style="color: ${i < Math.round(avgRating) ? '#d4c47c' : '#e0d8cc'};">★</span>`)
        .join('');
    
    // Years in practice
    if (practitioner.year_established) {
        const yearsInPractice = new Date().getFullYear() - practitioner.year_established;
        document.getElementById('stat-years').textContent = yearsInPractice + ' yrs';
    }
    
    // Business type (team size)
    if (practitioner.business_size) {
        document.getElementById('stat-business-type').textContent = practitioner.business_size;
    }
}

/**
 * Render about and approach sections
 */
function renderAbout() {
    if (practitioner.bio) {
        document.getElementById('about-section').style.display = 'block';
        document.getElementById('profile-bio').textContent = practitioner.bio;
    }
    
    if (practitioner.ethos_statement) {
        document.getElementById('approach-section').style.display = 'block';
        document.getElementById('profile-approach').textContent = practitioner.ethos_statement;
    }
}

/**
 * Render intro video
 */
function renderVideo() {
    if (practitioner.intro_video_url) {
        console.log('[Practitioner Profile] Video URL found:', practitioner.intro_video_url);
        const videoSection = document.getElementById('video-section');
        const videoSource = document.getElementById('video-source');
        const video = document.getElementById('intro-video');
        
        if (videoSource && video) {
            videoSource.src = practitioner.intro_video_url;
            video.load();  // Force reload of video element
            videoSection.style.display = 'block';
            console.log('[Practitioner Profile] Video loaded, section displayed');
        } else {
            console.warn('[Practitioner Profile] Video elements not found in DOM');
        }
    } else {
        console.log('[Practitioner Profile] No intro_video_url found');
    }
}

/**
 * Render Services & Coverage Card - compact, information-dense
 */
async function renderServicesCard() {
    try {
        let hasContent = false;
        
        // ===== SERVICE CATEGORIES (from DB) =====
        try {
            console.log('[Services Card] Loading services for practitioner:', practitioner.id);
            
            // Query with proper relation joins
            const { data: services, error } = await window.supabaseClient
                .from('practitioner_selected_services')
                .select(`
                    id,
                    is_active,
                    taxonomy_subcategories (
                        id,
                        name
                    )
                `)
                .eq('practitioner_serial', practitioner.serial_number)
                .eq('is_active', true);
            
            console.log('[Services Card] Query result:', { services, error });
            
            if (error) {
                console.warn('[Services Card] Query error:', error);
            } else if (services && services.length > 0) {
                console.log('[Services Card] Found', services.length, 'services');
                hasContent = true;
                
                const serviceNames = services
                    .filter(s => {
                        console.log('[Services Card] Service item:', s);
                        return s.taxonomy_subcategories && s.taxonomy_subcategories.name;
                    })
                    .map(s => `<span class="tag">${escapeHtml(s.taxonomy_subcategories.name)}</span>`)
                    .slice(0, 8);
                
                console.log('[Services Card] Service tags created:', serviceNames);
                if (serviceNames.length > 0) {
                    document.getElementById('card-services').innerHTML = serviceNames.join('');
                    document.getElementById('card-services-row').style.display = 'block';
                    console.log('[Services Card] Services displayed successfully');
                } else {
                    console.log('[Services Card] No valid service names found after filtering');
                }
            } else {
                console.log('[Services Card] No services found - empty result');
            }
        } catch (e) {
            console.error('[Services Card] Exception loading services:', e);
        }
        
        // ===== MODALITIES =====
        if (practitioner.modalities && practitioner.modalities.length > 0) {
            hasContent = true;
            const tags = practitioner.modalities
                .slice(0, 6)
                .map(m => `<span class="tag">${escapeHtml(m)}</span>`)
                .join('');
            document.getElementById('card-modalities').innerHTML = tags;
            document.getElementById('card-modalities-row').style.display = 'block';
        }
        
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
                console.log('[Services Card] Payment methods:', methods);
                const paymentHtml = methods
                    .slice(0, 4)
                    .map(m => `<span class="tag-compact">${escapeHtml(m)}</span>`)
                    .join('');
                document.getElementById('card-payment').innerHTML = paymentHtml;
            } else {
                document.getElementById('card-payment').innerHTML = '';
            }
        } else {
            document.getElementById('card-payment').innerHTML = '';
        }
        
        // ===== INSURANCE - HIDE IF NO DATA =====
        const insuranceCol = document.getElementById('card-insurance-col');
        if (practitioner.accepts_insurance || (practitioner.insurance_providers && practitioner.insurance_providers.length > 0)) {
            const providers = practitioner.insurance_providers || [];
            let label = '';
            if (providers.length > 0) {
                label = providers.slice(0, 2).join(', ');
            } else if (practitioner.accepts_insurance) {
                label = 'Yes';
            }
            
            if (label) {
                console.log('[Services Card] Insurance:', label);
                document.getElementById('card-insurance').innerHTML = `<span class="tag-compact">${escapeHtml(label)}</span>`;
                insuranceCol.style.display = 'block';
            } else {
                insuranceCol.style.display = 'none';
                document.getElementById('card-insurance').innerHTML = '';
            }
        } else {
            console.log('[Services Card] No insurance data - hiding field completely');
            insuranceCol.style.display = 'none';
            document.getElementById('card-insurance').innerHTML = '';
        }
        
        // ===== LANGUAGES =====
        if (practitioner.languages && practitioner.languages.length > 0) {
            document.getElementById('card-languages').innerHTML = practitioner.languages
                .slice(0, 4)
                .map(l => `<span class="tag">${escapeHtml(l)}</span>`)
                .join('');
            document.getElementById('card-languages-row').style.display = 'block';
        }
        
        // ===== SPECIALIZATIONS (moved from credentials card) =====
        // Combine conditions_treated and categories from match settings
        const allSpecializations = [];
        if (practitioner.conditions_treated && practitioner.conditions_treated.length > 0) {
            allSpecializations.push(...practitioner.conditions_treated);
        }
        if (practitioner.service_categories && practitioner.service_categories.length > 0) {
            allSpecializations.push(...practitioner.service_categories);
        }
        const uniqueSpecializations = [...new Set(allSpecializations)];
        
        if (uniqueSpecializations.length > 0) {
            hasContent = true;
            document.getElementById('card-specializations').innerHTML = uniqueSpecializations
                .slice(0, 15)
                .map(spec => `<span class="tag">${escapeHtml(spec)}</span>`)
                .join('');
            document.getElementById('card-specializations-row').style.display = 'block';
        }
        
        // Show card if has any content
        if (hasContent) {
            document.getElementById('services-card-section').style.display = 'block';
        }
    } catch (error) {
        console.error('[Practitioner Profile] Error rendering services card:', error);
    }
}

/**
 * Render Credentials & Specializations Section (Compact)
 */
function renderCredentialsCard() {
    let hasContent = false;
    
    console.log('[renderCredentialsCard] ========== CREDENTIALS CARD RENDERING START ==========');
    console.log('[renderCredentialsCard] practitioner object keys:', Object.keys(practitioner || {}));
    console.log('[renderCredentialsCard] practitioner.credentials:', practitioner.credentials);
    console.log('[renderCredentialsCard] practitioner.credentials type:', typeof practitioner.credentials);
    console.log('[renderCredentialsCard] practitioner.credentials is array?', Array.isArray(practitioner.credentials));
    console.log('[renderCredentialsCard] practitioner.badge_certified:', practitioner.badge_certified);
    console.log('[renderCredentialsCard] practitioner.badge_licensed:', practitioner.badge_licensed);
    console.log('[renderCredentialsCard] practitioner.background_check_status:', practitioner.background_check_status);
    console.log('[renderCredentialsCard] practitioner.continuing_education:', practitioner.continuing_education);
    
    // Build array from explicit credentials + badge pseudo-credentials
    let allCredentials = [];
    
    // Add explicit credentials if they exist and are an array
    if (Array.isArray(practitioner.credentials) && practitioner.credentials.length > 0) {
        allCredentials = [...practitioner.credentials];
        console.log('[renderCredentialsCard] Added', practitioner.credentials.length, 'explicit credentials');
    }
    
    // Add badges as pseudo-credentials so they appear in the card
    if (practitioner.badge_certified) {
        allCredentials.push({
            credential_type: 'Certification',
            title: 'Certified Practitioner',
            issuer: 'Rooted Vitality'
        });
        console.log('[renderCredentialsCard] Added badge_certified as pseudo-credential');
    }
    
    if (practitioner.badge_licensed) {
        allCredentials.push({
            credential_type: 'License',
            title: 'Licensed Practitioner',
            issuer: 'Professional Board'
        });
        console.log('[renderCredentialsCard] Added badge_licensed as pseudo-credential');
    }
    
    if (practitioner.background_check_status === 'passed') {
        allCredentials.push({
            credential_type: 'Verification',
            title: 'Background Check Passed',
            issuer: 'Rooted Vitality'
        });
        console.log('[renderCredentialsCard] Added background_check as pseudo-credential');
    }
    
    // ===== RENDER CREDENTIALS =====
    if (allCredentials.length > 0) {
        console.log('[renderCredentialsCard] Found', allCredentials.length, 'total credentials to display');
        hasContent = true;
        const credentialsHtml = allCredentials
            .slice(0, 5)
            .map(cred => `
                <div class="credential-item-compact">
                    <span class="credential-type">${escapeHtml(cred.credential_type || 'Credential')}</span>
                    <span class="credential-divider">·</span>
                    <span class="credential-title">${escapeHtml(cred.title || '')}</span>
                    ${cred.issuer ? `<span class="credential-issuer">${escapeHtml(cred.issuer)}</span>` : ''}
                </div>
            `)
            .join('');
        
        console.log('[renderCredentialsCard] Rendering credentials HTML...');
        document.getElementById('card-credentials-list').innerHTML = credentialsHtml;
        document.getElementById('card-credentials-row').style.display = 'block';
        console.log('[renderCredentialsCard] Credentials displayed');
    } else {
        console.log('[renderCredentialsCard] No credentials to display');
    }
    
    // ===== CONTINUING EDUCATION =====
    if (practitioner.continuing_education && practitioner.continuing_education.length > 0) {
        console.log('[renderCredentialsCard] Found', practitioner.continuing_education.length, 'continuing education items');
        hasContent = true;
        const ceHtml = practitioner.continuing_education
            .slice(0, 5)
            .map(ce => `
                <div class="credential-item-compact">
                    <span class="credential-type">${escapeHtml(ce.type || 'Course')}</span>
                    <span class="credential-divider">·</span>
                    <span class="credential-title">${escapeHtml(ce.title || '')}</span>
                    ${ce.provider ? `<span class="credential-issuer">${escapeHtml(ce.provider)}</span>` : ''}
                    ${ce.year ? `<span class="credential-year">${ce.year}</span>` : ''}
                </div>
            `)
            .join('');
        
        console.log('[renderCredentialsCard] Rendering continuing education HTML...');
        document.getElementById('card-continuing-ed').innerHTML = ceHtml;
        document.getElementById('card-continuing-ed-row').style.display = 'block';
        console.log('[renderCredentialsCard] Continuing education displayed');
    } else {
        console.log('[renderCredentialsCard] No continuing education to display');
    }
    
    if (hasContent) {
        console.log('[renderCredentialsCard] Has content - showing credentials-card-section');
        document.getElementById('credentials-card-section').style.display = 'block';
    } else {
        console.log('[renderCredentialsCard] No credentials or continuing education content - hiding credentials-card-section');
    }
}

/**
 * Render Contact Card - Simple hyperlinks to social media/website
 */
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
    document.getElementById('contact-card-section').style.display = 'block';
    console.log('[Practitioner Profile] Contact card rendered with', links.length, 'links');
}

/**
 * Render Reviews Card - compact
 */
function renderReviewsCard() {
    if (reviews.length === 0) {
        document.getElementById('no-reviews-state').style.display = 'block';
        document.getElementById('reviews-container').style.display = 'none';
        document.getElementById('reviews-section').style.display = 'block';
        return;
    }
    
    document.getElementById('reviews-section').style.display = 'block';
    document.getElementById('no-reviews-state').style.display = 'none';
    
    const reviewsHtml = reviews
        .slice(0, 3) // Show top 3 reviews
        .map(review => {
            const stars = Array(review.rating || 5)
                .fill(0)
                .map(() => `<span class="star" style="color: #d4c47c;">★</span>`)
                .join('');
            const emptyStars = Array(5 - (review.rating || 5))
                .fill(0)
                .map(() => `<span class="star" style="color: #e0d8cc;">★</span>`)
                .join('');
            
            // Build intelligent client name from stored database values
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

/**
 * Render Media & Connect Card - gallery + social compact
 */
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
                    <div class="gallery-item-compact" onclick="openImageModal('${escapeHtml(photoUrl)}')">
                        <img src="${escapeHtml(photoUrl)}" alt="Gallery" loading="lazy">
                    </div>
                `;
            })
            .join('');
        
        const galleryGrid = document.getElementById('gallery-grid');
        const cardGalleryRow = document.getElementById('card-gallery-row');
        if (galleryGrid) {
            galleryGrid.innerHTML = galleryHtml;
        }
        if (cardGalleryRow) {
            cardGalleryRow.style.display = 'block';
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
                cardSocialRow.style.display = 'block';
            }
        }
    }
    
    if (hasContent) {
        document.getElementById('media-card-section').style.display = 'block';
    }
}

/**
 * Render FAQ Section
 */
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
    document.getElementById('faq-section').style.display = 'block';
}

/**
 * Render reviews OLD - KEPT FOR REFERENCE
 */
function renderReviews() {
    // Now handled by renderReviewsCard()
}

/**
 * Calculate average rating from reviews
 */
function calculateAverageRating() {
    if (reviews.length === 0) return 5.0;
    const sum = reviews.reduce((acc, review) => acc + (review.rating || 5), 0);
    return sum / reviews.length;
}

/**
 * Format date
 */
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Helper: Convert 24-hour time to 12-hour format
 * @param {string} time24 - Time in 24-hour format (e.g., "0900" or "09:00")
 * @returns {string} - Time in 12-hour format (e.g., "9:00 AM")
 */
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

/**
 * Setup gallery modal
 */
function setupGalleryModal() {
    const modal = document.getElementById('image-modal');
    const closeBtn = document.querySelector('.image-modal-close');
    
    if (!closeBtn) return; // Modal may not be present in all layouts
    
    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    };
}

/**
 * Open image modal
 */
function openImageModal(imageUrl) {
    const modal = document.getElementById('image-modal');
    if (modal) {
        const modalImg = document.getElementById('image-modal-img');
        modal.style.display = 'flex';
        modalImg.src = imageUrl;
    }
}

console.log('[Practitioner Profile] Script loaded');

// Initialize review notifications once page is ready
document.addEventListener('DOMContentLoaded', () => {
  if (window.supabaseClient && window.authManager && window.reviewNotificationManager) {
    window.reviewNotificationManager.init(window.supabaseClient, window.authManager);
  }
});

