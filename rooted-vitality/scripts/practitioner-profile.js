/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: scripts/practitioner-profile.js                             ║
║  Purpose: Public practitioner profile page                         ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝
*/

console.log('[Practitioner Profile] Page loading...');

let practitioner = null;
let reviews = [];

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
        
        console.log('[Practitioner Profile] Loaded practitioner:', practitioner);
        
        if (!practitioner) {
            throw new Error('Practitioner not found');
        }
        
        // Load reviews
        await loadReviews();
        
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
 * Render the complete profile
 */
function renderProfile() {
    console.log('[Practitioner Profile] Rendering profile...');
    
    // Hero Section
    renderHero();
    
    // Video Section
    if (practitioner.intro_video_url) {
        document.getElementById('video-section').style.display = 'block';
        document.getElementById('video-source').src = practitioner.intro_video_url;
    }
    
    // About & Approach
    renderAbout();
    
    // Specializations
    if (practitioner.conditions_treated && practitioner.conditions_treated.length > 0) {
        document.getElementById('conditions-section').style.display = 'block';
        renderConditions();
    }
    
    // Credentials
    if (practitioner.credentials && practitioner.credentials.length > 0) {
        document.getElementById('credentials-section').style.display = 'block';
        renderCredentials();
    }
    
    // Reviews
    if (reviews.length > 0) {
        document.getElementById('reviews-section').style.display = 'block';
        renderReviews();
    }
    
    // Gallery
    if (practitioner.gallery_photos && practitioner.gallery_photos.length > 0) {
        document.getElementById('gallery-section').style.display = 'block';
        renderGallery();
    }
    
    // Additional Details
    renderAdditionalDetails();
    
    console.log('[Practitioner Profile] Profile rendered');
}

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
    
    // Badges
    if (practitioner.credentials_verified) {
        document.getElementById('badge-credentials').style.display = 'inline-flex';
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
        document.getElementById('profile-bio').textContent = practitioner.bio;
    }
    
    if (practitioner.ethos_statement) {
        document.getElementById('approach-column').style.display = 'block';
        document.getElementById('profile-approach').textContent = practitioner.ethos_statement;
    }
}

/**
 * Render conditions/specializations
 */
function renderConditions() {
    const container = document.getElementById('conditions-grid');
    const conditions = practitioner.conditions_treated || [];
    
    container.innerHTML = conditions
        .map(condition => `<div class="condition-tag">${escapeHtml(condition)}</div>`)
        .join('');
}

/**
 * Render credentials
 */
function renderCredentials() {
    const container = document.getElementById('credentials-grid');
    const credentials = practitioner.credentials || [];
    
    container.innerHTML = credentials
        .map(cred => `
            <div class="credential-card">
                <div class="credential-type">${escapeHtml(cred.credential_type || 'Credential')}</div>
                <h4 class="credential-title">${escapeHtml(cred.title || '')}</h4>
                ${cred.issuer ? `<p class="credential-issuer">${escapeHtml(cred.issuer)}</p>` : ''}
                ${cred.date_issued ? `<p class="credential-date">Issued: ${formatDate(cred.date_issued)}</p>` : ''}
                ${cred.expiry_date ? `<p class="credential-date">Expires: ${formatDate(cred.expiry_date)}</p>` : ''}
            </div>
        `)
        .join('');
}

/**
 * Render reviews
 */
function renderReviews() {
    const container = document.getElementById('reviews-container');
    const noReviewsState = document.getElementById('no-reviews-state');
    
    if (reviews.length === 0) {
        container.style.display = 'none';
        noReviewsState.style.display = 'block';
        return;
    }
    
    container.style.display = 'grid';
    noReviewsState.style.display = 'none';
    
    container.innerHTML = reviews
        .map(review => createReviewCard(review))
        .join('');
}

/**
 * Create a review card
 */
function createReviewCard(review) {
    const stars = Array(5)
        .fill(0)
        .map((_, i) => `<span class="star">★</span>`)
        .join('');
    
    const rating = review.rating || 5;
    const filledStars = Array(rating)
        .fill(0)
        .map(() => `<span class="star" style="color: #d4c47c;">★</span>`)
        .join('');
    const emptyStars = Array(5 - rating)
        .fill(0)
        .map(() => `<span class="star" style="color: #e0d8cc;">★</span>`)
        .join('');
    
    const reviewDate = review.created_at ? formatDate(review.created_at) : 'Recently';
    
    return `
        <div class="review-card">
            <div class="review-header">
                <div>
                    <h4 class="review-client-name">${escapeHtml(review.client_name || 'Anonymous')}</h4>
                    <div class="review-stars">${filledStars}${emptyStars}</div>
                </div>
            </div>
            <p class="review-text">${escapeHtml(review.review_text || '')}</p>
            <div class="review-footer">
                <span>${reviewDate}</span>
            </div>
        </div>
    `;
}

/**
 * Render gallery
 */
function renderGallery() {
    const container = document.getElementById('gallery-grid');
    const photos = practitioner.gallery_photos || [];
    
    container.innerHTML = photos
        .map((photo, index) => {
            const photoUrl = typeof photo === 'string' ? photo : photo.url;
            return `
                <div class="gallery-item" onclick="openImageModal('${escapeHtml(photoUrl)}')">
                    <img src="${escapeHtml(photoUrl)}" alt="Gallery image ${index + 1}" loading="lazy">
                    <div class="gallery-overlay">🔍</div>
                </div>
            `;
        })
        .join('');
}

/**
 * Render additional details section
 */
function renderAdditionalDetails() {
    // Modalities
    if (practitioner.modalities && practitioner.modalities.length > 0) {
        document.getElementById('modalities-detail').style.display = 'block';
        document.getElementById('modalities-list').innerHTML = practitioner.modalities
            .map(m => `<div class="detail-list-item">${escapeHtml(m)}</div>`)
            .join('');
    }
    
    // Languages
    if (practitioner.languages && practitioner.languages.length > 0) {
        document.getElementById('languages-detail').style.display = 'block';
        document.getElementById('languages-list').innerHTML = practitioner.languages
            .map(l => `<div class="detail-list-item">${escapeHtml(l)}</div>`)
            .join('');
    }
    
    // Insurance
    if (practitioner.insurance_accepted) {
        document.getElementById('insurance-detail').style.display = 'block';
        const insuranceList = practitioner.insurance_providers || [];
        if (insuranceList.length > 0) {
            document.getElementById('insurance-info').innerHTML = insuranceList
                .map(i => `<div class="detail-list-item">${escapeHtml(i)}</div>`)
                .join('');
        } else {
            document.getElementById('insurance-info').innerHTML = '<div class="detail-list-item">Accepts insurance (call for details)</div>';
        }
    }
    
    // Pricing
    if (practitioner.pricing) {
        document.getElementById('pricing-detail').style.display = 'block';
        document.getElementById('pricing-info').textContent = practitioner.pricing;
    }
    
    // Show section if any detail is visible
    const anyDetailVisible = [
        document.getElementById('modalities-detail'),
        document.getElementById('languages-detail'),
        document.getElementById('insurance-detail'),
        document.getElementById('pricing-detail')
    ].some(el => el.style.display !== 'none');
    
    if (anyDetailVisible) {
        document.getElementById('additional-section').style.display = 'block';
    }
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
 * Setup gallery modal
 */
function setupGalleryModal() {
    const modal = document.getElementById('image-modal');
    const closeBtn = document.querySelector('.image-modal-close');
    
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
    const modalImg = document.getElementById('image-modal-img');
    modal.style.display = 'flex';
    modalImg.src = imageUrl;
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

console.log('[Practitioner Profile] Script loaded');
