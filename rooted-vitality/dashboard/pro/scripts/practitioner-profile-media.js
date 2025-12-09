/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: dashboard/pro/scripts/practitioner-profile-media.js         ║
║  Purpose: Media handling module for photos, videos, avatars        ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

TABLE OF CONTENTS:
  1. Photos Gallery
  2. Video Introduction
  3. Profile Picture Modal
  4. Avatar Upload

ARCHITECTURE NOTES:
- Modular service file focusing on media and form handling
- Accesses ProfileState from main practitioner_profile.js
- Uses window.supabaseClient for storage operations
- Integrates with auto-save and completeness tracking from main file
- All functions trigger updateProfileCompleteness() and debounceAutoSave()

*/

// ======================================================
// AUTO-SAVE WRAPPER (calls parent debounceAutoSave if available)
// ======================================================

/**
 * Trigger auto-save - calls parent function or no-op
 */
function debounceAutoSave(section) {
    // If parent has debounceAutoSave, use it
    if (typeof window.debounceAutoSave === 'function') {
        window.debounceAutoSave(section);
    }
    // Otherwise use saveProfileSection if available
    else if (typeof saveProfileSection === 'function') {
        saveProfileSection(section || 'media');
    }
    // If neither available, just do nothing (graceful degradation)
}

// Initialize video data when ProfileState is ready
document.addEventListener('DOMContentLoaded', () => {
    if (typeof ProfileState !== 'undefined' && !ProfileState.videoData) {
        ProfileState.videoData = {
            url: null,
            duration: null,
            fileName: null
        };
    }
    // Setup avatar upload with modal
    setupAvatarUpload();
});

// ======================================================
// 1. PHOTOS GALLERY
// ======================================================

function loadPhotos(photos) {
    ProfileState.currentPhotos = Array.isArray(photos) ? photos : [];
    renderPhotosList();
    // Only render display mode when not in edit mode
    // renderPhotosDisplay();
}

function addPhotoToGallery() {
    if (ProfileState.currentPhotos.length >= 6) {
        alert('Maximum 6 photos allowed');
        return;
    }
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/jpeg,image/png,image/webp';
    
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > 5 * 1024 * 1024) {
            alert('File must be smaller than 5MB');
            return;
        }
        
        try {
            showSaveStatus('Uploading photo...', 'saving');
            
            // Upload to Supabase Storage
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) throw new Error('Not authenticated');
            
            const fileExt = file.name.split('.').pop();
            const fileName = `photos/${user.id}-${Date.now()}.${fileExt}`;
            
            const { error: uploadError } = await window.supabaseClient.storage
                .from('practitioner-files')
                .upload(fileName, file, { upsert: true });
            
            if (uploadError) throw uploadError;
            
            const { data } = window.supabaseClient.storage
                .from('practitioner-files')
                .getPublicUrl(fileName);
            
            const photoData = {
                id: Date.now(),
                url: data.publicUrl,
                caption: 'Photo'
            };
            
            ProfileState.currentPhotos.push(photoData);
            renderPhotosList();
            showSaveStatus('Photo uploaded successfully', 'success');
            debounceAutoSave('photos');
            
        } catch (error) {
            console.error('Error uploading photo:', error);
            showSaveStatus('Photo upload failed', 'error');
        }
    });
    
    fileInput.click();
}

function removePhoto(photoId) {
    ProfileState.currentPhotos = ProfileState.currentPhotos.filter(p => p.id !== photoId);
    renderPhotosList();
    debounceAutoSave('photos');
}

function updatePhotoCaption(photoId, caption) {
    const photo = ProfileState.currentPhotos.find(p => p.id === photoId);
    if (photo) {
        photo.caption = caption;
        debounceAutoSave('photos');
    }
}

function renderPhotosList() {
    const list = document.getElementById('photos-list');
    if (!list) return;
    
    if (ProfileState.currentPhotos.length === 0) {
        list.innerHTML = '';
        return;
    }
    
    list.innerHTML = ProfileState.currentPhotos.map(photo => `
        <div class="photo-card" data-photo-id="${photo.id}">
            <img src="${photo.url || photo.data}" alt="Gallery photo" class="photo-card-image">
            <div class="photo-card-actions">
                <button class="photo-card-btn photo-remove-btn" data-photo-id="${photo.id}" title="Remove photo">×</button>
            </div>
            <div class="photo-card-caption">
                <input 
                    type="text" 
                    value="${photo.caption || ''}"
                    placeholder="Add caption..."
                    class="photo-caption-input"
                    data-photo-id="${photo.id}"
                    maxlength="30"
                >
            </div>
        </div>
    `).join('');
    
    // Attach event listeners to remove buttons
    list.querySelectorAll('.photo-remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const photoId = parseInt(btn.getAttribute('data-photo-id'));
            removePhoto(photoId);
        });
    });
    
    // Attach event listeners to caption inputs
    list.querySelectorAll('.photo-caption-input').forEach(input => {
        input.addEventListener('blur', (e) => {
            const photoId = parseInt(input.getAttribute('data-photo-id'));
            updatePhotoCaption(photoId, input.value);
        });
    });
}

function renderPhotosDisplay() {
    const display = document.getElementById('photos-display');
    if (!display) return;
    
    if (!ProfileState.currentPhotos || ProfileState.currentPhotos.length === 0) {
        display.innerHTML = '<p class="placeholder-text">No professional photos yet.</p>';
        return;
    }
    
    display.innerHTML = ProfileState.currentPhotos.map(photo => `
        <div class="photo-display-card">
            <img src="${photo.url || photo.data}" alt="Gallery photo" class="photo-display-image">
            <div class="photo-display-caption">${photo.caption || 'Photo'}</div>
        </div>
    `).join('');
}

function getPhotosForSave() {
    // Return photo URLs for database storage (much smaller than base64)
    return ProfileState.currentPhotos.map(p => ({
        id: p.id,
        caption: p.caption,
        url: p.url || p.data // Use URL if available, fallback to data for old photos
    }));
}

// ======================================================
// 2. VIDEO INTRODUCTION
// ======================================================

function setupAlbumButton() {
    const btn = document.getElementById('add-photo-btn');
    if (btn) {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            addPhotoToGallery();
        });
    }
}

function setupVideoButton() {
    const btn = document.getElementById('add-video-btn');
    if (btn) {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            addVideoToProfile();
        });
    }
}

async function addVideoToProfile() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'video/mp4,video/webm,video/mov,video/quicktime';
    
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > 50 * 1024 * 1024) { // 50MB limit
            alert('Video file must be smaller than 50MB');
            return;
        }
        
        try {
            showSaveStatus('Uploading video...', 'saving');
            
            // Upload to Supabase Storage
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) throw new Error('Not authenticated');
            
            const fileExt = file.name.split('.').pop();
            const fileName = `videos/${user.id}-${Date.now()}.${fileExt}`;
            
            const { error: uploadError } = await window.supabaseClient.storage
                .from('practitioner-files')
                .upload(fileName, file, { upsert: true });
            
            if (uploadError) throw uploadError;
            
            const { data } = window.supabaseClient.storage
                .from('practitioner-files')
                .getPublicUrl(fileName);
            
            ProfileState.videoData = {
                url: data.publicUrl,
                name: file.name,
                size: file.size
            };
            
            renderVideoPreview();
            showSaveStatus('Video uploaded successfully', 'success');
            debounceAutoSave('media');
            
        } catch (error) {
            console.error('Error uploading video:', error);
            showSaveStatus('Video upload failed', 'error');
        }
    });
    
    fileInput.click();
}

function renderVideoPreview() {
    const videoList = document.getElementById('video-list');
    const addVideoBtn = document.getElementById('add-video-btn');
    const videoUploadArea = document.querySelector('.video-upload-area');
    
    if (!videoList) return;
    
    if (!ProfileState.videoData) {
        videoList.innerHTML = '';
        // Show the add button if no video
        if (addVideoBtn) addVideoBtn.classList.remove('hidden');
        if (videoUploadArea) videoUploadArea.classList.remove('hidden');
        return;
    }
    
    // Hide the add button when video is present
    if (addVideoBtn) addVideoBtn.classList.add('hidden');
    if (videoUploadArea) videoUploadArea.classList.add('hidden');
    
    videoList.innerHTML = `
        <div class="video-preview-card">
            <video class="video-preview" controls>
                <source src="${ProfileState.videoData.url}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
            <div class="video-info">
                <p class="video-name">${ProfileState.videoData.name}</p>
                <p class="video-size">${(ProfileState.videoData.size / (1024 * 1024)).toFixed(1)} MB</p>
            </div>
            <button class="video-remove-btn" title="Remove video">×</button>
        </div>
    `;
    
    // Attach event listener to remove button
    const removeBtn = videoList.querySelector('.video-remove-btn');
    if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            removeVideo();
        });
    }
}

function removeVideo() {
    ProfileState.videoData = null;
    renderVideoPreview();
    debounceAutoSave('media');
}

function loadVideo(videoUrl) {
    if (videoUrl) {
        window.videoData = {
            url: videoUrl,
            name: 'Intro Video',
            size: 0
        };
        renderVideoPreview();
    } else {
    }
}

function showSaveStatus(message, type) {
    const statusEl = document.getElementById('save-status');
    if (!statusEl) return;
    
    statusEl.textContent = message;
    statusEl.className = `save-status ${type}`;
    statusEl.classList.remove('hidden');
    
    if (type !== 'saving') {
        setTimeout(() => {
            statusEl.classList.add('hidden');
        }, 3000);
    }
}

function setupVideoListeners() {
    const uploadBtn = document.getElementById('upload-video-btn');
    const videoInput = document.getElementById('video-input');
    const removeBtn = document.getElementById('remove-video-btn');
    
    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => videoInput.click());
    }
    
    if (videoInput) {
        videoInput.addEventListener('change', handleVideoUpload);
    }
    
    if (removeBtn) {
        removeBtn.addEventListener('click', removeVideo);
    }
    
    // Load saved video if it exists
    if (ProfileState.videoData && ProfileState.videoData.url) {
        loadVideo(ProfileState.videoData.url);
    }
}

function handleVideoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
        alert('Invalid video format. Please use MP4, WebM, or MOV.');
        return;
    }
    
    // Validate file size (100 MB)
    if (file.size > 100 * 1024 * 1024) {
        alert('Video file too large. Maximum size is 100 MB.');
        return;
    }
    
    // Create video preview
    const videoPreview = document.getElementById('video-preview');
    const url = URL.createObjectURL(file);
    videoPreview.src = url;
    
    // Get duration
    videoPreview.addEventListener('loadedmetadata', () => {
        const duration = videoPreview.duration;
        
        // Validate duration (30-60 seconds)
        if (duration < 30 || duration > 60) {
            alert(`Video must be 30-60 seconds. Your video is ${Math.round(duration)} seconds.`);
            removeVideo();
            return;
        }
        
        // Store video data
        ProfileState.videoData = {
            url: url,
            duration: duration,
            fileName: file.name
        };
        
        // Update UI
        document.getElementById('video-filename-display').textContent = `Selected: ${file.name}`;
        document.getElementById('video-file-info').classList.add('visible-flex');
        document.getElementById('video-preview-container').classList.add('visible-flex');
    }, { once: true });
}

function removeVideo() {
    ProfileState.videoData = { url: null, duration: null, fileName: null };
    document.getElementById('video-input').value = '';
    document.getElementById('video-filename-display').textContent = '';
    document.getElementById('video-preview').src = '';
    document.getElementById('video-file-info').classList.add('hidden');
    document.getElementById('video-preview-container').classList.add('hidden');
}

// ======================================================
// 3. PROFILE PICTURE MODAL
// ======================================================

// selectedProfilePictureFile is now part of ProfileState.selectedProfilePictureFile

function openProfilePictureModal() {
    const modal = document.getElementById('profile-picture-modal');
    if (modal) {
        // Show modal using only CSS class
        modal.classList.add('active');
        
        // Activate overlay for backdrop
        const overlay = modal.querySelector('.modal-overlay');
        if (overlay) {
            overlay.classList.add('active');
        }
        
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
    }
}

function closeProfilePictureModal() {
    const modal = document.getElementById('profile-picture-modal');
    if (modal) {
        modal.classList.remove('active');
        
        // Deactivate overlay
        const overlay = modal.querySelector('.modal-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
        
        document.body.classList.remove('modal-open');
        document.body.style.overflow = 'auto';
    }
    
    // Reset form
    ProfileState.selectedProfilePictureFile = null;
    document.getElementById('profile-picture-input').value = '';
    document.getElementById('preview-section').classList.add('hidden');
    document.getElementById('upload-dropzone').classList.remove('hidden');
    document.getElementById('upload-progress-section').classList.add('hidden');
    document.getElementById('confirm-upload-btn').classList.add('hidden');
    document.getElementById('confirm-upload-btn').disabled = false;
}

function handleProfilePictureSelect(e) {
    const file = e.target.files[0];
    if (file) {
        previewProfilePicture(file);
    }
}

function previewProfilePicture(file) {
    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
        alert('Please select a JPG, PNG or WebP image');
        return;
    }
    
    if (file.size > maxSize) {
        alert('File size must be less than 5MB');
        return;
    }
    
    ProfileState.selectedProfilePictureFile = file;
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('preview-image').src = e.target.result;
        document.getElementById('preview-filename').textContent = file.name;
        document.getElementById('preview-size').textContent = formatFileSize(file.size);
        
        document.getElementById('upload-dropzone').classList.add('hidden');
        document.getElementById('preview-section').classList.remove('hidden');
        document.getElementById('confirm-upload-btn').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

async function confirmProfilePictureUpload() {
    if (!ProfileState.selectedProfilePictureFile || !ProfileState.currentUser) {
        alert('Please select a file first');
        return;
    }
    
    try {
        document.getElementById('preview-section').classList.add('hidden');
        document.getElementById('upload-progress-section').classList.remove('hidden');
        document.getElementById('confirm-upload-btn').disabled = true;
        
        await uploadAvatar(ProfileState.selectedProfilePictureFile);
        
        // Close modal on success
        setTimeout(() => {
            closeProfilePictureModal();
        }, 500);
        
    } catch (error) {
        console.error('[Rooted Vitality] Upload error:', error);
        alert('Upload failed. Please try again.');
        
        // Reset UI
        document.getElementById('upload-progress-section').classList.add('hidden');
        document.getElementById('preview-section').classList.remove('hidden');
        document.getElementById('confirm-upload-btn').disabled = false;
    }
}

// ======================================================
// 4. AVATAR UPLOAD
// ======================================================

function setupAvatarUpload() {
    const avatarUploadBtn = document.querySelector('.avatar-upload-btn');
    
    if (avatarUploadBtn) {
        avatarUploadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openProfilePictureModal();
        });
    }

    // Setup file input for modal
    const fileInput = document.getElementById('profile-picture-input');
    if (fileInput) {
        fileInput.addEventListener('change', handleProfilePictureSelect);
    }

    // Setup dropzone for modal
    const dropzone = document.getElementById('upload-dropzone');
    if (dropzone) {
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('drag-active');
        });
        dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-active'));
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('drag-active');
            if (e.dataTransfer.files.length > 0) {
                const file = e.dataTransfer.files[0];
                previewProfilePicture(file);
            }
        });
    }
}

async function uploadAvatar(file) {
    try {
        showSaveStatus('Uploading photo...', 'saving');
        
        // Get the auth id (the authenticated user's UUID)
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) {
            throw new Error('Not authenticated');
        }
        const authUserId = user.id;
        const fileExt = file.name.split('.').pop();
        const fileName = `avatars/${authUserId}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await window.supabaseClient.storage
            .from('practitioner-files')
            .upload(fileName, file, { upsert: true });
        
        if (uploadError) throw uploadError;
        
        const { data } = window.supabaseClient.storage
            .from('practitioner-files')
            .getPublicUrl(fileName);
        
        const avatarUrl = data.publicUrl;
        // Get practitioner serial to update practitioner_profiles table
        const practitionerSerial = ProfileState.practitionerData?.serial_number;
        if (!practitionerSerial) {
            console.error('[Rooted Vitality] Could not get practitioner serial number');
            throw new Error('Practitioner serial number not found');
        }
        // Update practitioner_profiles table with new practice logo URL using practitioner_serial
        try {
            const { data: profileUpdateData, error: profileError } = await window.supabaseClient
                .from('practitioner_profiles')
                .update({ 
                    practice_logo_url: avatarUrl
                })
                .eq('practitioner_serial', practitionerSerial);
            
            if (profileError) {
                console.error('[Rooted Vitality] Profile table update error:', profileError);
                throw profileError;
            } else {
            }
        } catch (profileTableError) {
            console.error('[Rooted Vitality] Error updating practitioner_profiles table:', profileTableError);
            throw profileTableError;
        }
        
        // Update local practitionerData object so it persists
        if (ProfileState.practitionerData) {
            ProfileState.practitionerData.practice_logo_url = avatarUrl;
        }
        
        // Update preview in avatar div
        const avatarDiv = document.getElementById('profile-avatar');
        const avatarImg = document.createElement('img');
        avatarImg.src = avatarUrl;
        avatarImg.className = 'avatar-image';
        avatarDiv.innerHTML = '';
        avatarDiv.appendChild(avatarImg);
        // Recalculate profile completeness since logo was updated
        if (typeof updateProfileCompleteness === 'function') {
            updateProfileCompleteness();
        }
        
        // Update header with avatar using the universal avatar system
        const activeView = localStorage.getItem('active_view') || 'client';
        const userRole = currentUser?.role || 'practitioner';
        
        if (userRole === 'practitioner' && activeView === 'practitioner') {
            // Update as business logo using RootedVitality
            if (typeof RootedVitality !== 'undefined') {
                RootedVitality.updateHeaderLogo(avatarUrl, 'practitioner', 'practitioner');
                // Clear the logo cache so other pages reload it when visited
                RootedVitality.clearLogoCacheForUser();
            }
        } else {
            // Update as avatar
            if (typeof RootedVitality !== 'undefined') {
                RootedVitality.updateHeaderAvatar(avatarUrl);
            }
        }
        
        // Trigger auto-save to ensure everything is synchronized
        if (typeof debounceAutoSave === 'function') {
            debounceAutoSave();
        }
        
        showSaveStatus('Photo updated', 'success');
    } catch (error) {
        console.error('[Rooted Vitality] Error uploading avatar:', error);
        showSaveStatus('Photo upload failed', 'error');
    }
}
