/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: reviewsManager.js                                           ║
║  Purpose: User review submission and management system             ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

 TABLE OF CONTENTS
   1. INITIALIZATION & STATE MANAGEMENT
   2. EVENT LISTENERS & FORM HANDLERS
   3. STAR RATING & INPUT VALIDATION
   4. PHOTO UPLOAD & MANAGEMENT
   5. REVIEW SUBMISSION & STORAGE
   6. MODAL LIFECYCLE & CLEANUP

 ARCHITECTURE:
   - reviews table has: id (UUID), rating, review_text, created_at, updated_at, 
     is_approved, is_visible, client_name, practitioner_name
   - Modal shows practitioner name for context only
   - Submission stores: rating, review text, timestamp, status, names for support
   - Serial numbers: METADATA ONLY, never used in database operations
   - UUIDs: Every table has id (UUID) at column 1 - this is the system foundation
*/

// ======================================================
// 1. INITIALIZATION & STATE MANAGEMENT
// ======================================================

// Helper function to escape HTML
function escapeHtmlReview(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

let reviewsManager = {
  supabaseClient: null,
  authManager: null,
  listenersInitialized: false,
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
    
    // Only initialize listeners once
    if (!this.listenersInitialized) {
      this.initEventListeners();
      this.listenersInitialized = true;
    }

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


  },

  // ======================================================
  // MODAL MANAGEMENT
  // ======================================================

  openReviewModal(matchId, practitionerId, practitionerName, projectId, clientFirstName, clientLastName, clientId) {
    console.log('[Reviews] openReviewModal called with:', { matchId, practitionerId, practitionerName, projectId, clientFirstName, clientLastName, clientId });

    this.currentReview = {
      matchId,
      practitionerId,
      projectId: projectId || null,
      clientId: clientId || null,
      clientFirstName: clientFirstName || '',
      clientLastName: clientLastName || '',
      practitionerName: practitionerName || 'Practitioner',
      rating: 0,
      photos: []
    };

    console.log('[Reviews] currentReview set:', this.currentReview);

    this.resetForm();
    console.log('[Reviews] Form reset');

    // Check if review already exists
    this.checkForExistingReview(projectId, practitionerId, clientId);

    const nameEl = document.getElementById('review-practitioner-name');
    if (nameEl) {
      nameEl.textContent = this.currentReview.practitionerName;
      console.log('[Reviews] Set practitioner name:', this.currentReview.practitionerName);
    } else {
      console.error('[Reviews] Name element not found');
    }

    const modal = document.getElementById('review-modal');
    console.log('[Reviews] Modal element found:', !!modal);
    console.log('[Reviews] Modal before classList operation:', modal?.className);

    if (modal) {
      console.log('[Reviews] Removing modal--hidden and adding active class');
      modal.classList.remove('modal--hidden');
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      console.log('[Reviews] Modal class after changes:', modal.className);
      console.log('[Reviews] Modal display:', window.getComputedStyle(modal).display);

    } else {
      console.error('[Reviews] Modal element not found!');
    }
  },

  // Check if review already exists for this match
  async checkForExistingReview(projectId, practitionerId, clientId) {
    if (!projectId || !practitionerId || !clientId) {
      console.log('[Reviews] Missing required params for checkForExistingReview:', { projectId, practitionerId, clientId });
      return;
    }

    try {
      console.log('[Reviews] Checking for existing review via RPC function');
      const { data: existingReviewData, error } = await this.supabaseClient
        .rpc('get_existing_review', {
          p_project_serial: projectId,
          p_practitioner_id: practitionerId,
          p_client_id: clientId
        });

      if (error) {
        console.error('[Reviews] Error checking for existing review:', error);
        return;
      }

      const existingReview = existingReviewData && existingReviewData[0] ? existingReviewData[0] : null;

      if (existingReview) {
        console.log('[Reviews] Found existing review:', existingReview);

        const form = document.getElementById('review-form');
        const submitBtn = document.getElementById('btn-submit-review');
        if (form && submitBtn) {
          // Remove any existing message first (avoid duplicates)
          const oldMessage = form.querySelector('.review-form__message');
          if (oldMessage) oldMessage.remove();

          // Store the existing review info
          this.currentReview.existingReviewId = existingReview.id;
          this.currentReview.isUpdating = true;
          
          // Pre-fill form with existing review data
          const reviewTextEl = document.getElementById('review-text');
          if (reviewTextEl) {
            reviewTextEl.value = existingReview.review_text;
            const charCount = document.getElementById('char-count');
            if (charCount) charCount.textContent = `${existingReview.review_text.length} / 1000`;
          }

          // Set rating stars
          const ratingInput = document.getElementById('review-rating');
          if (ratingInput) ratingInput.value = existingReview.rating;
          this.currentReview.rating = existingReview.rating;
          document.querySelectorAll('.star-btn').forEach((btn, index) => {
            if (index < existingReview.rating) {
              btn.classList.add('star-btn--active');
            } else {
              btn.classList.remove('star-btn--active');
            }
          });
          
          // Create and insert message at the top
          const formMessage = document.createElement('div');
          formMessage.className = 'review-form__message review-form__message--info';
          formMessage.innerHTML = `
            <p><strong>You already left a review:</strong></p>
            <p style="margin: 8px 0 0 0; font-size: 0.9rem;">${escapeHtmlReview(existingReview.review_text.substring(0, 100))}...</p>
            <p style="margin: 8px 0 0 0; font-size: 0.85rem; color: #999;">Rating: ${existingReview.rating} / 5 stars</p>
            <p style="margin: 8px 0 0 0; font-size: 0.85rem; font-style: italic;">Edit below to update your review.</p>
          `;
          
          // Insert at the top of the form
          const firstSection = form.querySelector('.review-form__section');
          if (firstSection) {
            form.insertBefore(formMessage, firstSection);
          }
          
          submitBtn.textContent = 'Update Review';
        }

        return true; // Review exists
      }

      return false; // No review found
    } catch (error) {
      if (error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('[Reviews] Exception in checkForExistingReview:', error);
      }
      return false;
    }
  },

  closeReviewModal() {
    const modal = document.getElementById('review-modal');
    if (modal) {
      modal.classList.remove('active');
      modal.classList.add('modal--hidden');
      document.body.style.overflow = 'auto';
    }
    this.resetForm();
  },

  resetForm() {
    const form = document.getElementById('review-form');
    if (form) {
      form.reset();
      // Remove any existing review message
      const existingMessage = form.querySelector('.review-form__message');
      if (existingMessage) existingMessage.remove();
    }

    document.querySelectorAll('.star-btn').forEach(btn => btn.classList.remove('star-btn--active'));
    const ratingInput = document.getElementById('review-rating');
    if (ratingInput) ratingInput.value = '';
    this.currentReview.rating = 0;

    const charCount = document.getElementById('char-count');
    if (charCount) charCount.textContent = '0 / 1000';

    const photoPreview = document.getElementById('photo-preview');
    if (photoPreview) photoPreview.innerHTML = '';
    this.currentReview.photos = [];

    // Reset submit button text
    const submitBtn = document.getElementById('btn-submit-review');
    if (submitBtn) submitBtn.textContent = 'Submit Review';
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
          preview: e.target.result,
          name: file.name
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
        <button type="button" class="photo-preview__remove" onclick="reviewsManager.removePhoto(${index})" title="Remove">ï¿½</button>
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
    console.log('[Reviews] submitReview called - form submission triggered');
    e.preventDefault();

    if (this.currentReview.rating === 0) {
      console.log('[Reviews] No rating selected');
      alert('Please select a rating');
      return;
    }

    const reviewText = document.getElementById('review-text').value.trim();
    if (!reviewText) {
      console.log('[Reviews] No review text entered');
      alert('Please enter a review comment');
      return;
    }

    console.log('[Reviews] Starting review submission...');
    try {


      // Step 1: Read practitioner_serial and client_serial from project_practitioner_matches

      const { data: matchData, error: matchError } = await this.supabaseClient
        .from('project_practitioner_matches')
        .select('practitioner_serial, client_serial')
        .eq('id', this.currentReview.matchId)
        .single();

      let practitionerSerial = null;
      let clientSerial = null;

      if (matchError || !matchData) {

        // Fallback: Get the practitioner's serial_number if match not found
        const { data: practitionerData, error: practitionerError } = await this.supabaseClient
          .from('practitioners')
          .select('serial_number')
          .eq('id', this.currentReview.practitionerId)
          .single();

        if (practitionerError || !practitionerData) {
          throw new Error(`Practitioner not found: ${practitionerError?.message}`);
        }
        practitionerSerial = practitionerData.serial_number;
        
        // Fallback: Get client serial_number from current user
        const { data: { user } } = await this.supabaseClient.auth.getUser();
        if (user) {
          const { data: clientData } = await this.supabaseClient
            .from('clients')
            .select('serial_number')
            .eq('id', user.id)
            .single();
          clientSerial = clientData?.serial_number || null;
        }
      } else {
        practitionerSerial = matchData.practitioner_serial;
        clientSerial = matchData.client_serial;
      }


      const { data: { user } } = await this.supabaseClient.auth.getUser();
      const currentUser = window.authManager?.getCurrentUser();
      
      let clientName = 'Client';
      let clientFirstName = this.currentReview.clientFirstName || '';
      let clientLastName = this.currentReview.clientLastName || '';
      
      // Format client name intelligently - store display format for client_name field
      if (clientFirstName && clientLastName) {
        clientName = `${clientFirstName} ${clientLastName[0].toUpperCase()}`;
      } else if (clientLastName) {
        clientName = clientLastName;
      } else if (clientFirstName) {
        clientName = clientFirstName;
      } else if (user?.email) {
        clientName = user.email.split('@')[0];
      }

      // Step 2: Upload photos to Supabase Storage if any
      let photoPaths = [];
      if (this.currentReview.photos && this.currentReview.photos.length > 0) {

        for (const photo of this.currentReview.photos) {
          try {
            // Convert data URL to blob if needed
            let fileToUpload = photo.file;
            if (!fileToUpload && photo.preview) {
              // If we only have preview (data URL), convert it to blob
              const response = await fetch(photo.preview);
              fileToUpload = await response.blob();
            }
            
            if (!fileToUpload) {

              continue;
            }

            // Generate unique filename
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(7);
            const fileName = `review-photos/${this.currentReview.practitionerId}/${timestamp}-${random}-${fileToUpload.name || 'photo.jpg'}`;



            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await this.supabaseClient.storage
              .from('review-files')
              .upload(fileName, fileToUpload, { upsert: false });

            if (uploadError) {
              console.error('[Reviews] Photo upload failed:', uploadError);
              continue;
            }

            // Store the path (not the full URL) for efficient storage
            photoPaths.push(fileName);

          } catch (photoError) {
            console.error('[Reviews] Error processing photo:', photoError);
          }
        }

      }
      
      // Get client record for client_serial
      let clientSerialToStore = this.currentReview.clientSerial || null;
      if (!clientSerialToStore && currentUser) {
        const { data: clientDataForSerial } = await this.supabaseClient
          .from('clients')
          .select('serial_number')
          .eq('id', currentUser.id)
          .single();
        clientSerialToStore = clientDataForSerial?.serial_number || null;
      }

      // Convert photos array to storage paths for TEXT[] column
      const photosArray = photoPaths && photoPaths.length > 0 ? photoPaths : [];

      // Build review record - store serial_numbers as TEXT
      const reviewData = {
        practitioner_id: this.currentReview.practitionerId,  // UUID for RLS
        client_id: this.currentReview.clientId,              // UUID for RLS
        practitioner_serial: practitionerSerial,             // Denormalized serial (P1, P2, etc.)
        project_serial: this.currentReview.projectId,        // Store actual project serial (integer)
        client_serial: clientSerialToStore,                  // Denormalized serial (C1, C2, etc.)
        rating: this.currentReview.rating,
        review_text: reviewText,
        client_name: clientName,
        client_first_name: clientFirstName,
        client_last_name: clientLastName,
        practitioner_name: this.currentReview.practitionerName,
        photos: photosArray,                       // TEXT[] array of storage paths
        is_visible: true,
        is_approved: true,  // Auto-approve reviews (can be changed by admin later)
        is_verified: true,  // Mark as verified - posted directly from our website
        is_featured: false,                         // Will be set by admin for featured reviews
        review_date: new Date().toISOString(),      // When review was written
        created_at: new Date().toISOString(),       // When record created
        updated_at: new Date().toISOString(),       // When record updated
        external_platform: null,                    // For external reviews (google, yelp, etc)
        external_url: null,                         // URL to external review if imported
        external_review_id: null,                   // ID of review on external platform
        moderation_notes: ''                        // Admin notes during moderation
      };








      // Insert into database
      const { data, error } = await this.supabaseClient
        .from('reviews')
        .insert([reviewData])
        .select();

      if (error) {
        console.error('[Reviews] âŒ INSERT FAILED:', error);
        console.error('[Reviews] Error code:', error.code);
        console.error('[Reviews] Error message:', error.message);
        throw error;
      }

      console.log('[Reviews] âœ… Review inserted successfully');
      console.log('[Reviews] About to show success handler');
      console.log('[Reviews] window.showSuccessModal exists?', typeof window.showSuccessModal);

      // FORCE ALERT FOR NOW
      alert('Thank you! Your review has been posted.');
      console.log('[Reviews] Alert shown, closing modal now');
      this.closeReviewModal();
      console.log('[Reviews] Modal should be closed');
      
      // Refresh the card display to show edit review button
      if (window.inboxUI && window.inboxUI.renderMatches) {
        console.log('[Reviews] Refreshing card display');
        window.inboxUI.renderMatches();
      }

    } catch (error) {
      console.error('[Reviews] Submission failed with error:', error);
      console.error('[Reviews] Error message:', error.message);
      alert('Error submitting review: ' + error.message);
    }
  }
};

// Make reviewsManager available globally
window.reviewsManager = reviewsManager;

function openReviewModal(matchId, practitionerId, practitionerName) {
  reviewsManager.openReviewModal(matchId, practitionerId, practitionerName);
}



























































