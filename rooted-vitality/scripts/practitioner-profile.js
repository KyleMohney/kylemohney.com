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
        let practitionerId = urlParams.get('practitioner_id') || urlParams.get('id');
        
        // If no ID provided, try to get logged-in user's profile
        if (!practitionerId) {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (user) {
                // Get practitioner by user_id
                const { data, error } = await window.supabaseClient
                    .from('practitioners')
                    .select('*')
                    .eq('user_id', user.id)
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
            // Fetch by practitioner ID
            const { data, error } = await window.supabaseClient
                .from('practitioners')
                .select('*')
                .eq('id', practitionerId)
                .single();
            
            if (error) throw error;
            practitioner = data;
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
        
        // Hide loading, show content
        document.getElementById('profile-loading').style.display = 'none';
        document.getElementById('profile-content').style.display = 'block';
        
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
        const { data, error } = await window.supabaseClient
            .from('reviews')
            .select('*')
            .eq('practitioner_id', practitioner.id)
            .eq('is_visible', true)
            .eq('is_approved', true)
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (error) {
            console.warn('[Practitioner Profile] Error loading reviews:', error);
            reviews = [];
        } else {
            reviews = data || [];
            console.log('[Practitioner Profile] Loaded', reviews.length, 'reviews');
        }
    } catch (error) {
        console.error('[Practitioner Profile] Error loading reviews:', error);
        reviews = [];
    }
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
            .eq('practitioner_id', practitioner.id)
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
    document.getElementById('profile-business-name').textContent = businessName;
    
    // Tagline
    if (practitioner.tagline) {
        document.getElementById('profile-tagline').textContent = practitioner.tagline;
    }
    
    // ===== HERO BADGES =====
    console.log('[Practitioner Profile] Processing badges...');
    console.log('[Practitioner Profile] Badge Background Check:', practitioner.badge_background_check);
    console.log('[Practitioner Profile] Badge Certified:', practitioner.badge_certified);
    console.log('[Practitioner Profile] Badge Licensed:', practitioner.badge_licensed);
    console.log('[Practitioner Profile] Badge Verified:', practitioner.badge_verified);
    
    // Show badges based on boolean flags
    if (practitioner.badge_background_check) {
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
                .eq('practitioner_id', practitioner.id)
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
    
    // ===== CREDENTIALS =====
    if (practitioner.credentials && practitioner.credentials.length > 0) {
        hasContent = true;
        const credentialsHtml = practitioner.credentials
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
        
        document.getElementById('card-credentials-list').innerHTML = credentialsHtml;
        document.getElementById('card-credentials-row').style.display = 'block';
    }
    
    // ===== CONTINUING EDUCATION =====
    if (practitioner.continuing_education && practitioner.continuing_education.length > 0) {
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
        
        document.getElementById('card-continuing-ed').innerHTML = ceHtml;
        document.getElementById('card-continuing-ed-row').style.display = 'block';
    }
    
    if (hasContent) {
        document.getElementById('credentials-card-section').style.display = 'block';
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
            
            return `
                <div class="review-item">
                    <div class="review-stars">${stars}${emptyStars}</div>
                    <p class="review-text">"${escapeHtml(review.review_text || '')}"</p>
                    <div class="review-author">— ${escapeHtml(review.client_name || 'Client')}</div>
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
