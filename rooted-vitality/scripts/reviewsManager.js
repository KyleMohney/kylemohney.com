/*
+--------------------------------------------------------------------+
�  ROOTED VITALITY, INC.                                             �
�  File: scripts/reviewsManager.js                                   �
�  Purpose: Review submission modal & database integration           �
�  Holistic Wellness � Modern Connection Platform                    �
�  rootedvitality.com | 2025                                         �
+--------------------------------------------------------------------+

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

  openReviewModal(matchId, practitionerId, practitionerName, projectId, clientFirstName, clientLastName, clientId) {
    console.log('[Reviews] Opening modal for:', practitionerName, 'UUID:', practitionerId);

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
        <button type="button" class="photo-preview__remove" onclick="reviewsManager.removePhoto(${index})" title="Remove">�</button>
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

      // Step 1: Read practitioner_serial and client_serial from project_practitioner_matches
      console.log('[Reviews] Reading serial numbers from match ID:', this.currentReview.matchId);
      const { data: matchData, error: matchError } = await this.supabaseClient
        .from('project_practitioner_matches')
        .select('practitioner_serial, client_serial')
        .eq('id', this.currentReview.matchId)
        .single();

      let practitionerSerial = null;
      let clientSerial = null;

      if (matchError || !matchData) {
        console.warn('[Reviews] Match lookup failed, falling back to individual lookups:', matchError?.message);
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

      console.log('[Reviews] Serial numbers retrieved - Practitioner:', practitionerSerial, 'Client:', clientSerial);

      // Get current user (client)
      const { data: { user } } = await this.supabaseClient.auth.getUser();
      const currentUser = window.authManager?.getCurrentUser();
      
      let clientName = 'Client';
      let clientFirstName = this.currentReview.clientFirstName || '';
      let clientLastName = this.currentReview.clientLastName || '';
      
      // Format client name intelligently
      if (clientFirstName && clientLastName) {
        clientName = `${clientFirstName[0]}. ${clientLastName}`;
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
        console.log('[Reviews] Uploading photos...');
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
              console.warn('[Reviews] Could not upload photo - no file data');
              continue;
            }

            // Generate unique filename
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(7);
            const fileName = `review-photos/${this.currentReview.practitionerId}/${timestamp}-${random}-${fileToUpload.name || 'photo.jpg'}`;

            console.log('[Reviews] Uploading photo to:', fileName);

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
            console.log('[Reviews] Photo uploaded successfully. Path stored:', fileName);
          } catch (photoError) {
            console.error('[Reviews] Error processing photo:', photoError);
          }
        }
        console.log('[Reviews] Photos uploaded:', photoPaths.length);
      }
      
      // Get client record for client_id
      let clientIdToStore = this.currentReview.clientId || null;
      if (!clientIdToStore && currentUser) {
        const { data: clientDataForId } = await this.supabaseClient
          .from('clients')
          .select('id')
          .eq('id', currentUser.id)
          .single();
        clientIdToStore = clientDataForId?.id || null;
      }

      // Get project serial_number if projectId provided
      let projectSerialToStore = null;
      if (this.currentReview.projectId) {
        const { data: projectData } = await this.supabaseClient
          .from('projects')
          .select('serial_number')
          .eq('id', this.currentReview.projectId)
          .single();
        projectSerialToStore = projectData?.serial_number || null;
      }

      // Convert photos array to storage paths for TEXT[] column
      const photosArray = photoPaths && photoPaths.length > 0 ? photoPaths : [];

      // Build review record - store serial_numbers as TEXT
      const reviewData = {
        practitioner_id: this.currentReview.practitionerId,  // UUID for FK
        practitioner_serial: practitionerSerial,   // Denormalized serial (P1, P2, etc.)
        project_id: projectSerialToStore,          // Store project serial_number (1, 2, 3, etc.)
        client_id: clientIdToStore,                // UUID for FK
        client_serial: clientSerial,               // Denormalized serial (C1, C2, etc.)
        rating: this.currentReview.rating,
        review_text: reviewText,
        client_name: clientName,
        client_first_name: clientFirstName,
        client_last_name: clientLastName,
        practitioner_name: this.currentReview.practitionerName,
        photos: photosArray,                       // TEXT[] array of storage paths
        is_visible: true,
        is_approved: false,
        // NEW FIELDS
        is_verified: false,                         // Will be verified by admin/system
        is_featured: false,                         // Will be set by admin for featured reviews
        review_date: new Date().toISOString(),      // When review was written
        created_at: new Date().toISOString(),       // When record created
        updated_at: new Date().toISOString(),       // When record updated
        source: 'rooted_vitality',                  // Internal platform source
        external_platform: null,                    // For external reviews (google, yelp, etc)
        external_url: null,                         // URL to external review if imported
        external_review_id: null,                   // ID of review on external platform
        moderation_notes: ''                        // Admin notes during moderation
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
          practitioner_id: this.currentReview.practitionerId,  // Use practitionerId from currentReview
          type: 'review_posted',
          title: 'New Review',
          message: `You received a new ${this.currentReview.rating}-star review: "${reviewText.substring(0, 50)}${reviewText.length > 50 ? '...' : ''}"`,
          link: '/rooted-vitality/dashboard/pro/pages/practitioner-profile.html?section=reviews',
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
