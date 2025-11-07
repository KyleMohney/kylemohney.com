/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: scripts/reviewsManager.js                                   ║
║  Purpose: Review submission modal & database integration           ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

ARCHITECTURE:
- reviews table has: id (UUID), rating, review_text, created_at, updated_at, 
  is_approved, is_visible, client_name, practitioner_name
- Modal shows practitioner name for context only
- Submission stores: rating, review text, timestamp, status, names for support
- Serial numbers: METADATA ONLY, never used in database operations
- UUIDs: Every table has id (UUID) at column 1 - this is the system foundation
*/

let reviewsManager = {
  supabaseClient: null,
  authManager: null,
  currentReview: {
    matchId: null,
    practitionerId: null,
    practitionerName: null,
    rating: 0,
    photos: []
  },

  // ======================================================
  // INITIALIZATION
  // ======================================================

  init(supabaseClient, authManager) {
    this.supabaseClient = supabaseClient;
    this.authManager = authManager;
    this.initEventListeners();
    console.log('[Reviews] Manager initialized');
  },

  initEventListeners() {
    const modal = document.getElementById('review-modal');
    if (!modal) {
      console.error('[Reviews] Modal not found');
      return;
    }

    const starBtns = document.querySelectorAll('.star-btn');
    starBtns.forEach(btn => {
      btn.addEventListener('click', (e) => this.handleStarClick(e));
    });

    const reviewText = document.getElementById('review-text');
    if (reviewText) {
      reviewText.addEventListener('input', (e) => this.updateCharCounter(e));
    }

    const photoInput = document.getElementById('review-photos');
    if (photoInput) {
      photoInput.addEventListener('change', (e) => this.handlePhotoUpload(e));
    }

    const photoUpload = document.querySelector('.photo-upload');
    if (photoUpload) {
      photoUpload.addEventListener('dragover', (e) => this.handleDragOver(e));
      photoUpload.addEventListener('dragleave', (e) => this.handleDragLeave(e));
      photoUpload.addEventListener('drop', (e) => this.handleDrop(e));
    }

    const form = document.getElementById('review-form');
    if (form) {
      form.addEventListener('submit', (e) => this.submitReview(e));
    }

    const closeButtons = modal.querySelectorAll('.modal-cancel, .modal__close');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => this.closeReviewModal());
    });

    const overlay = modal.querySelector('.modal__overlay');
    if (overlay) {
      overlay.addEventListener('click', () => this.closeReviewModal());
    }

    console.log('[Reviews] Event listeners attached');
  },

  // ======================================================
  // MODAL MANAGEMENT
  // ======================================================

  openReviewModal(matchId, practitionerId, practitionerName) {
    console.log('[Reviews] Opening modal for:', practitionerName, 'UUID:', practitionerId);

    this.currentReview = {
      matchId,
      practitionerId,
      practitionerName: practitionerName || 'Practitioner',
      rating: 0,
      photos: []
    };

    this.resetForm();

    const nameEl = document.getElementById('review-practitioner-name');
    if (nameEl) nameEl.textContent = this.currentReview.practitionerName;

    const modal = document.getElementById('review-modal');
    if (modal) {
      modal.classList.remove('modal--hidden');
      document.body.style.overflow = 'hidden';
    }
  },

  closeReviewModal() {
    const modal = document.getElementById('review-modal');
    if (modal) {
      modal.classList.add('modal--hidden');
      document.body.style.overflow = 'auto';
    }
    this.resetForm();
  },

  resetForm() {
    const form = document.getElementById('review-form');
    if (form) form.reset();

    document.querySelectorAll('.star-btn').forEach(btn => btn.classList.remove('star-btn--active'));
    const ratingInput = document.getElementById('review-rating');
    if (ratingInput) ratingInput.value = '';
    this.currentReview.rating = 0;

    const charCount = document.getElementById('char-count');
    if (charCount) charCount.textContent = '0 / 1000';

    const photoPreview = document.getElementById('photo-preview');
    if (photoPreview) photoPreview.innerHTML = '';
    this.currentReview.photos = [];
  },

  // ======================================================
  // STAR RATING
  // ======================================================

  handleStarClick(e) {
    e.preventDefault();
    const rating = parseInt(e.target.dataset.rating);
    this.currentReview.rating = rating;

    const ratingInput = document.getElementById('review-rating');
    if (ratingInput) ratingInput.value = rating;

    document.querySelectorAll('.star-btn').forEach((btn, index) => {
      if (index < rating) {
        btn.classList.add('star-btn--active');
      } else {
        btn.classList.remove('star-btn--active');
      }
    });

    console.log('[Reviews] Rating set to:', rating);
  },

  // ======================================================
  // TEXT INPUT
  // ======================================================

  updateCharCounter(e) {
    const count = e.target.value.length;
    const charCount = document.getElementById('char-count');
    if (charCount) charCount.textContent = `${count} / 1000`;
  },

  // ======================================================
  // PHOTO MANAGEMENT
  // ======================================================

  handlePhotoUpload(e) {
    const files = Array.from(e.target.files);
    this.processPhotos(files);
  },

  handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('photo-upload--dragging');
  },

  handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('photo-upload--dragging');
  },

  handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('photo-upload--dragging');
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    this.processPhotos(files);
  },

  processPhotos(files) {
    if (this.currentReview.photos.length >= 3) {
      alert('Maximum 3 photos allowed');
      return;
    }

    const validFiles = files.filter(f => {
      if (f.size > 5 * 1024 * 1024) {
        alert(`${f.name} exceeds 5MB limit`);
        return false;
      }
      return true;
    });

    const canAdd = Math.min(validFiles.length, 3 - this.currentReview.photos.length);

    validFiles.slice(0, canAdd).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.currentReview.photos.push({
          file: file,
          preview: e.target.result
        });
        this.updatePhotoPreview();
      };
      reader.readAsDataURL(file);
    });
  },

  updatePhotoPreview() {
    const preview = document.getElementById('photo-preview');
    if (!preview) return;

    preview.innerHTML = '';

    this.currentReview.photos.forEach((photo, index) => {
      const div = document.createElement('div');
      div.className = 'photo-preview__item';
      div.innerHTML = `
        <img src="${photo.preview}" alt="Photo ${index + 1}">
        <button type="button" class="photo-preview__remove" onclick="reviewsManager.removePhoto(${index})" title="Remove">×</button>
      `;
      preview.appendChild(div);
    });
  },

  removePhoto(index) {
    this.currentReview.photos.splice(index, 1);
    this.updatePhotoPreview();
  },

  // ======================================================
  // SUBMISSION
  // ======================================================

  async submitReview(e) {
    e.preventDefault();

    if (this.currentReview.rating === 0) {
      alert('Please select a rating');
      return;
    }

    const reviewText = document.getElementById('review-text').value.trim();
    if (!reviewText) {
      alert('Please enter a review comment');
      return;
    }

    try {
      console.log('[Reviews] Submitting review...');

      // Step 1: Get the practitioner's user_id (FK constraint uses user_id, not id)
      console.log('[Reviews] Looking up practitioner user_id for:', this.currentReview.practitionerId);
      const { data: practitionerData, error: practitionerError } = await this.supabaseClient
        .from('practitioners')
        .select('user_id, dba_name, legal_name')
        .eq('id', this.currentReview.practitionerId)
        .single();

      if (practitionerError || !practitionerData) {
        throw new Error(`Practitioner not found: ${practitionerError?.message}`);
      }

      const practitionerUserId = practitionerData.user_id;
      console.log('[Reviews] Practitioner user_id found:', practitionerUserId);

      // Build review record - practitioner_id FK points to practitioners.user_id
      const reviewData = {
        practitioner_id: practitionerUserId,
        rating: this.currentReview.rating,
        review_text: reviewText,
        client_name: 'Client',  // Placeholder - can be populated from context if available
        practitioner_name: this.currentReview.practitionerName,
        is_visible: true,
        is_approved: false
      };

      console.log('[Reviews] Review data:', reviewData);

      // Insert into database
      const { data, error } = await this.supabaseClient
        .from('reviews')
        .insert([reviewData])
        .select();

      if (error) {
        console.error('[Reviews] Insert failed:', error);
        throw error;
      }

      console.log('[Reviews] Review inserted successfully:', data);

      // Create notification for practitioner
      try {
        const notification = {
          practitioner_id: practitionerUserId,
          type: 'review_posted',
          title: 'New Review',
          message: `You received a new 5-star review: "${reviewText.substring(0, 50)}${reviewText.length > 50 ? '...' : ''}"`,
          link: '/rooted-vitality/dashboard/pro/pages/reviews.html',
          is_read: false
        };

        const { error: notifError } = await this.supabaseClient
          .from('notifications')
          .insert([notification]);

        if (notifError) {
          console.warn('[Reviews] Failed to create notification:', notifError);
        } else {
          console.log('[Reviews] Notification created for practitioner');
        }
      } catch (notifError) {
        console.warn('[Reviews] Notification error (non-blocking):', notifError);
      }

      alert('Thank you! Your review has been posted.');
      this.closeReviewModal();

    } catch (error) {
      console.error('[Reviews] Submission failed:', error.message);
      alert('Error submitting review: ' + error.message);
    }
  }
};

function openReviewModal(matchId, practitionerId, practitionerName) {
  reviewsManager.openReviewModal(matchId, practitionerId, practitionerName);
}