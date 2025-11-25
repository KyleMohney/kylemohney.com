/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: scripts/proReviews.js                                       ║
║  Purpose: Practitioner reviews management page logic               ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ╚════════════════════════════════════════════════════════════════════╝

TABLE OF CONTENTS
  1. INITIALIZATION & AUTH CHECK
  2. DATA MANAGEMENT
  3. REVIEWS DISPLAY
  4. FILTERING & SORTING
  5. MODALS
  6. GOOGLE SYNC
  7. UTILITY FUNCTIONS
*/

console.log('[Reviews] proReviews.js loading...');

// ======================================================
// 1. INITIALIZATION & AUTH CHECK
// ======================================================

let currentUser = null;
let allReviews = [];
let filteredReviews = [];

/**
 * Initialize reviews page on load
 */
async function initializeReviewsPage() {
    try {
        console.log('[Reviews] Initializing reviews page...');
        
        // Check authentication
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            
            if (!user) {
                console.log('[Reviews] No user logged in, redirecting to signup');
                const baseUrl = (typeof RootedVitality !== 'undefined' && RootedVitality.config.siteUrl) ? RootedVitality.config.siteUrl : '/rooted-vitality/';
                window.location.href = baseUrl + 'dashboard/signup.html';
                return;
            }
            currentUser = user;
            console.log(`[Reviews] Loaded for user: ${user.id}`);
        } catch (error) {
            console.error('[Reviews] Auth error:', error);
            return;
        }
        
        // Load reviews data
        await loadReviews();
        
        // Render initial reviews
        renderReviews(allReviews);
        updateStats();
        
        // Attach event listeners
        attachEventListeners();
        
        console.log('[Reviews] Page initialized successfully');
        
    } catch (error) {
        console.error('[Reviews] Initialization error:', error);
        showToast('Error loading reviews page', 'error');
    }
}

// ======================================================
// 2. DATA MANAGEMENT
// ======================================================

/**
 * Load reviews from database
 */
async function loadReviews() {
    try {
        console.log('[Reviews] Loading reviews from database...');
        
        // Get practitioner ID
        const { data: practitionerData, error: practitionerError } = await window.supabaseClient
            .from('practitioners')
            .select('id')
            .eq('id', currentUser.id)
            .single();
        
        if (practitionerError || !practitionerData) {
            console.error('[Reviews] Error loading practitioner:', practitionerError);
            allReviews = [];
            filteredReviews = [];
            return;
        }
        
        // Fetch real reviews from database
        const { data: dbReviews, error: reviewsError } = await window.supabaseClient
            .from('reviews')
            .select('*')
            .eq('practitioner_serial', practitionerData.serial_number)  // Use serial_number for queries
            .eq('is_visible', true)
            .order('created_at', { ascending: false });
        
        if (reviewsError) {
            console.error('[Reviews] Error loading reviews:', reviewsError);
            allReviews = [];
        } else {
            // Transform database reviews to match our format
            console.log('[Reviews] Raw database reviews:', dbReviews);
            allReviews = (dbReviews || []).map(review => {
                // Use stored client names from database
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
                
                return {
                    id: review.id,
                    clientName: displayName,
                    rating: review.rating || 5,
                    text: review.review_text || '',
                    date: new Date(review.created_at),
                    source: 'platform',
                    verified: true,
                    photos: review.photos || []
                };
            });
            console.log('[Reviews] Transformed reviews:', allReviews);
        }
        
        console.log(`[Reviews] Loaded ${allReviews.length} reviews`);
        filteredReviews = [...allReviews];
        
    } catch (error) {
        console.error('[Reviews] Error loading reviews:', error);
        showToast('Error loading reviews', 'error');
    }
}

// ======================================================
// 3. REVIEWS DISPLAY
// ======================================================

/**
 * Render reviews to the page
 */
function renderReviews(reviews) {
    console.log(`[Reviews] Rendering ${reviews.length} reviews...`);
    
    const container = document.getElementById('reviews-container');
    const noReviewsState = document.getElementById('no-reviews-state');
    
    if (reviews.length === 0) {
        container.style.display = 'none';
        noReviewsState.style.display = 'block';
        return;
    }
    
    container.style.display = 'grid';
    noReviewsState.style.display = 'none';
    
    container.innerHTML = reviews.map(review => createReviewCard(review)).join('');
}

/**
 * Create a review card HTML element
 */
function createReviewCard(review) {
    const stars = Array(5)
        .fill(0)
        .map((_, i) => `<span class="star ${i < review.rating ? 'filled' : 'empty'}">★</span>`)
        .join('');
    
    const formattedDate = formatDate(review.date);
    const source = review.source === 'platform' ? 'Platform' : 'External';
    
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
        <div class="review-card" data-review-id="${review.id}" data-source="${review.source}" data-rating="${review.rating}">
            <div class="review-header">
                <div class="review-client-info">
                    <h3 class="review-client-name">${escapeHtml(review.clientName)}</h3>
                    <span class="review-source-badge ${review.source}">${source}</span>
                </div>
                <div class="review-stars">${stars}</div>
            </div>
            <p class="review-text">${escapeHtml(review.text)}</p>
            ${photosHtml}
            <div class="review-footer">
                <span class="review-date">${formattedDate}</span>
                <div class="review-actions">
                    ${review.source === 'external' ? `
                        <button class="btn-review-action" onclick="editExternalReview(${review.id})" title="Edit external review">Edit</button>
                    ` : ''}
                    <button class="btn-review-action" onclick="shareReview(${review.id})" title="Share this review">Share</button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Update statistics cards
 */
function updateStats() {
    const totalReviews = allReviews.length;
    const platformReviews = allReviews.filter(r => r.source === 'platform').length;
    const externalReviews = allReviews.filter(r => r.source === 'external').length;
    
    const avgRating = totalReviews > 0 
        ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
        : 5.0;
    
    // Update DOM
    document.getElementById('total-reviews').textContent = totalReviews;
    document.getElementById('platform-reviews').textContent = platformReviews;
    document.getElementById('external-reviews').textContent = externalReviews;
    document.getElementById('avg-rating').textContent = avgRating;
    
    // Update stars
    const avgStars = Math.round(avgRating);
    const starsHtml = Array(5)
        .fill(0)
        .map((_, i) => `<span class="star ${i < avgStars ? 'filled' : 'empty'}">★</span>`)
        .join('');
    document.getElementById('avg-stars').innerHTML = starsHtml;
    
    console.log(`[Reviews] Stats updated - Avg: ${avgRating}, Total: ${totalReviews}`);
}

// ======================================================
// 4. FILTERING & SORTING
// ======================================================

/**
 * Apply filters to reviews
 */
function applyFilters() {
    const ratingFilter = document.getElementById('filter-rating').value;
    const sourceFilter = document.getElementById('filter-source').value;
    
    filteredReviews = allReviews.filter(review => {
        const matchRating = !ratingFilter || review.rating.toString() === ratingFilter;
        const matchSource = !sourceFilter || review.source === sourceFilter;
        return matchRating && matchSource;
    });
    
    renderReviews(filteredReviews);
    console.log(`[Reviews] Filters applied - ${filteredReviews.length} reviews shown`);
}

// ======================================================
// 5. MODALS
// ======================================================

/**
 * Show review link modal with copy functionality
 */
function showReviewLinkModal() {
    const modal = document.getElementById('review-link-modal');
    const reviewLink = `${window.location.origin}/rooted-vitality/review?practitioner=${currentUser.id}`;
    
    document.getElementById('review-link-input').value = reviewLink;
    
    modal.classList.add('show');
    modal.inert = false;
    modal.setAttribute('aria-hidden', 'false');
    
    console.log('[Reviews] Review link modal opened');
}

/**
 * Close any open modal
 */
function closeModal(modalElement) {
    modalElement.classList.remove('show');
    modalElement.inert = true;
    modalElement.setAttribute('aria-hidden', 'true');
}

/**
 * Copy review link to clipboard
 */
function copyReviewLink() {
    const input = document.getElementById('review-link-input');
    input.select();
    document.execCommand('copy');
    showToast('Review link copied to clipboard!', 'success');
    console.log('[Reviews] Review link copied to clipboard');
}

/**
 * Show Google sync modal
 */
function showGoogleSyncModal() {
    const modal = document.getElementById('google-sync-modal');
    modal.classList.add('show');
    modal.inert = false;
    modal.setAttribute('aria-hidden', 'false');
    console.log('[Reviews] Google sync modal opened');
}

// ======================================================
// 6. GOOGLE SYNC
// ======================================================

/**
 * Sync reviews from Google (placeholder)
 */
function syncGoogleReviews() {
    showToast('Google review sync is coming soon!', 'info');
    console.log('[Reviews] Google sync initiated (feature in development)');
}

// ======================================================
// 7. REVIEW ACTIONS
// ======================================================

/**
 * Edit an external review
 */
function editExternalReview(reviewId) {
    console.log('[Reviews] Edit external review:', reviewId);
    showToast('Edit feature coming soon!', 'info');
}

/**
 * Share a review
 */
function shareReview(reviewId) {
    console.log('[Reviews] Share review:', reviewId);
    showToast('Share feature coming soon!', 'info');
}

// ======================================================
// 8. UTILITY FUNCTIONS
// ======================================================

/**
 * Format date for display
 */
function formatDate(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;
    
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/**
 * Attach all event listeners
 */
function attachEventListeners() {
    // Filter buttons
    document.getElementById('filter-rating').addEventListener('change', applyFilters);
    document.getElementById('filter-source').addEventListener('change', applyFilters);
    
    // Action buttons
    document.getElementById('get-review-link-btn').addEventListener('click', showReviewLinkModal);
    document.getElementById('empty-state-review-link-btn').addEventListener('click', showReviewLinkModal);
    document.getElementById('sync-google-reviews-btn').addEventListener('click', showGoogleSyncModal);
    
    // Modal closes
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal-overlay');
            closeModal(modal);
        });
    });
    
    document.querySelectorAll('.modal-cancel').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal-overlay');
            closeModal(modal);
        });
    });
    
    // Copy link button
    document.getElementById('copy-review-link-btn').addEventListener('click', copyReviewLink);
    
    // Close modals on background click
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal);
            }
        });
    });
    
    console.log('[Reviews] Event listeners attached');
}

// ======================================================
// AUTO-INITIALIZE ON PAGE LOAD
// ======================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeReviewsPage);
} else {
    initializeReviewsPage();
}

console.log('[Reviews] proReviews.js loaded');

























































