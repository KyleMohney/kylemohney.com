/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: scripts/dashboard-client.js                                 ║
║  Purpose: Client Dashboard Logic & State Management                ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

TABLE OF CONTENTS:
  1. INITIALIZATION & AUTH CHECK
  2. FORM MANAGEMENT
  3. MODAL CONTROL
  4. LOCAL STORAGE PERSISTENCE
  5. TOAST NOTIFICATIONS
  6. EVENT LISTENERS
  7. UTILITY FUNCTIONS
*/

console.log('[Rooted Vitality] dashboard-client.js loading...');

// ======================================================
// 1. INITIALIZATION & AUTH CHECK
// ======================================================

/**
 * Initialize dashboard on page load
 * Check authentication and populate user data
 */
async function initializeDashboard() {
    try {
        console.log('[Dashboard] Checking authentication...');
        
        // Set active view to client for this dashboard
        localStorage.setItem('active_view', 'client');
        console.log('[Dashboard] Active view set to: client');
        
        // First check localStorage for user data
        let userData = window.authManager.getCurrentUser();
        console.log('[Dashboard] localStorage user data:', userData);
        
        // Then check Supabase session
        const session = await window.authManager.getSession();
        console.log('[Dashboard] Supabase session:', session);
        
        if (!session && !userData) {
            console.warn('[Dashboard] No active session, redirecting to home');
            window.location.href = '/rooted-vitality/index.html';
            return;
        }

        console.log('[Dashboard] User authenticated:', userData?.email || session?.user?.email);
        
        // NOTE: Header update now handled universally by authHooks.js on every page
        // This removes duplicate Dashboard/Logout buttons
        
        // Fetch complete profile data from Supabase (to get all signup fields)
        if (userData?.id) {
            try {
                const { data: clients, error: clientError } = await window.supabaseClient
                    .from('clients')
                    .select('*')
                    .eq('id', userData.id)
                    .single();

                if (clients && !clientError) {
                    console.log('[Dashboard] Full client data from Supabase:', clients);
                    userData = { ...userData, ...clients };
                }
            } catch (err) {
                console.warn('[Dashboard] Could not fetch fresh client data, using localStorage:', err);
            }
        }
        
        if (userData) {
            populateDashboardForms(userData);
            console.log('[Dashboard] User data loaded');
        }

        // Load wellness profile from localStorage
        const wellnessData = loadWellnessProfile();
        if (wellnessData) {
            populateWellnessForm(wellnessData);
        }

        // Load preferences from localStorage
        const preferences = loadPreferences();
        if (preferences) {
            applyPreferences(preferences);
        }

        // Load membership from localStorage
        const membership = loadMembership();
        if (membership) {
            updateMembershipDisplay(membership);
        }

    } catch (error) {
        console.error('[Dashboard] Initialization error:', error);
        showToast('Error loading dashboard. Please refresh.', 'error');
    }
}

// ======================================================
// 2. FORM MANAGEMENT
// ======================================================

/**
 * Populate account form with user data
 * @param {object} userData - User data object
 */
function populateDashboardForms(userData) {
    try {
        document.getElementById('firstName').value = userData.first_name || '';
        document.getElementById('lastName').value = userData.last_name || '';
        document.getElementById('age').value = userData.age || '';
        document.getElementById('sex').value = userData.sex || '';
        
        // Load avatar if available
        const avatarContainer = document.getElementById('clientProfileAvatarContainer');
        if (avatarContainer) {
            if (userData.profile_picture_url) {
                avatarContainer.innerHTML = `<img id="clientProfileAvatar" src="${userData.profile_picture_url}" alt="Your profile picture" style="width: 100%; height: 100%; object-fit: cover; border-radius: inherit;">`;
                console.log('[Dashboard] Avatar loaded:', userData.profile_picture_url);
            } else if (userData.first_name) {
                // Show first initial if no profile picture
                avatarContainer.textContent = userData.first_name.charAt(0).toUpperCase();
                console.log('[Dashboard] Avatar initial:', userData.first_name.charAt(0));
            }
        }
    } catch (error) {
        console.error('[Dashboard] Error populating account form:', error);
    }
}

/**
 * Populate wellness form with stored data
 * @param {object} wellnessData - Wellness profile data
 */
function populateWellnessForm(wellnessData) {
    try {
        document.getElementById('wellnessGoals').value = wellnessData.goals || '';
        document.getElementById('healthFocus').value = wellnessData.healthFocus || '';
        document.getElementById('locationPreference').value = wellnessData.locationPreference || '';

        // Handle multi-select for healing modalities
        if (wellnessData.modalities && Array.isArray(wellnessData.modalities)) {
            const modalitiesSelect = document.getElementById('healingModalities');
            for (let option of modalitiesSelect.options) {
                option.selected = wellnessData.modalities.includes(option.value);
            }
        }
    } catch (error) {
        console.error('[Dashboard] Error populating wellness form:', error);
    }
}

/**
 * Collect form data into object
 * @param {HTMLFormElement} form - Form element
 * @returns {object} Form data
 */
function collectFormData(form) {
    const formData = new FormData(form);
    const data = {};

    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }

    return data;
}

/**
 * Collect multi-select data
 * @param {string} selectId - Select element ID
 * @returns {array} Selected values
 */
function collectMultiSelectData(selectId) {
    const select = document.getElementById(selectId);
    const selected = [];
    
    for (let option of select.options) {
        if (option.selected) {
            selected.push(option.value);
        }
    }

    return selected;
}

/**
 * Handle client avatar upload
 * Uploads to Supabase storage and updates profiles table
 * @param {File} file - The image file to upload
 */
async function handleClientAvatarUpload(file) {
    try {
        showToast('Uploading profile picture...', 'saving');
        
        // Get current user's ID
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) {
            throw new Error('Not authenticated');
        }
        const userId = user.id;
        
        // Validate file
        if (!file.type.startsWith('image/')) {
            throw new Error('Please upload an image file');
        }
        
        if (file.size > 5 * 1024 * 1024) {
            throw new Error('File size must be less than 5MB');
        }
        
        console.log('[Dashboard] Uploading avatar for client:', userId);
        
        // Upload to storage
        const fileExt = file.name.split('.').pop();
        const fileName = `client-avatars/${userId}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await window.supabaseClient.storage
            .from('client-files')
            .upload(fileName, file, { upsert: true });
        
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data } = window.supabaseClient.storage
            .from('client-files')
            .getPublicUrl(fileName);
        
        const avatarUrl = data.publicUrl;
        console.log('[Dashboard] Avatar uploaded to storage:', avatarUrl);
        
        // Update clients table
        const { data: updateData, error: profileError } = await window.supabaseClient
            .from('clients')
            .update({ 
                profile_picture_url: avatarUrl,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);
        
        if (profileError) throw profileError;
        
        console.log('[Dashboard] Profile updated with avatar:', updateData);
        
        // Update preview - put the image into the container
        const avatarContainer = document.getElementById('clientProfileAvatarContainer');
        if (avatarContainer) {
            avatarContainer.innerHTML = `<img id="clientProfileAvatar" src="${avatarUrl}" alt="Your profile picture" style="width: 100%; height: 100%; object-fit: cover; border-radius: inherit;">`;
        }
        
        // Update header avatar
        if (typeof RootedVitality !== 'undefined') {
            RootedVitality.updateHeaderAvatar(avatarUrl);
            // Clear cache so other pages reload new avatar
            RootedVitality.clearClientAvatarCacheForUser();
        }
        
        showToast('Profile picture updated successfully', 'success');
        
    } catch (error) {
        console.error('[Dashboard] Error uploading avatar:', error);
        showToast(error.message || 'Error uploading profile picture', 'error');
    }
}

/**
 * Handle account form submission
 * @param {Event} e - Form submit event
 */
async function handleAccountFormSubmit(e) {
    e.preventDefault();

    try {
        const accountForm = document.getElementById('accountForm');
        const formData = collectFormData(accountForm);
        
        // Get current user
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) {
            showToast('Not authenticated', 'error');
            return;
        }

        // Prepare update data with all fields including timestamps
        const updateData = {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone || null,
            age: parseInt(formData.age) || null,
            sex: formData.sex || null,
            settings_updated_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        // Save to Supabase clients table
        const { error } = await window.supabaseClient
            .from('clients')
            .update(updateData)
            .eq('id', user.id);

        if (error) {
            console.error('[Dashboard] Error saving to Supabase:', error);
            showToast('Error saving account information', 'error');
            return;
        }

        // Update localStorage
        const userData = window.authManager.getCurrentUser();
        const updatedData = {
            ...userData,
            ...updateData
        };

        localStorage.setItem('rvUser', JSON.stringify(updatedData));
        
        console.log('[Dashboard] Account information saved to Supabase and localStorage');
        showToast('Account information updated successfully', 'success');

    } catch (error) {
        console.error('[Dashboard] Error saving account data:', error);
        showToast('Error saving account information', 'error');
    }
}

/**
 * Handle wellness form submission
 * @param {Event} e - Form submit event
 */
async function handleWellnessFormSubmit(e) {
    e.preventDefault();

    try {
        const wellnessForm = document.getElementById('wellnessForm');
        const formData = collectFormData(wellnessForm);
        const modalities = collectMultiSelectData('healingModalities');

        // For now, wellness data stored in localStorage as it's not in clients table
        // TODO: Consider creating separate wellness_profiles table if needed
        const wellnessData = {
            goals: formData.wellnessGoals,
            healthFocus: formData.healthFocus,
            modalities: modalities,
            locationPreference: formData.locationPreference,
            updated_at: new Date().toISOString()
        };

        localStorage.setItem('rvWellnessProfile', JSON.stringify(wellnessData));
        
        // Also update clients table settings_updated_at to track that user modified settings
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (user) {
            const { error } = await window.supabaseClient
                .from('clients')
                .update({
                    settings_updated_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);
            
            if (error) {
                console.warn('[Dashboard] Error updating settings_updated_at:', error);
            }
        }
        
        console.log('[Dashboard] Wellness profile saved');
        showToast('Wellness profile updated successfully', 'success');

    } catch (error) {
        console.error('[Dashboard] Error saving wellness data:', error);
        showToast('Error saving wellness profile', 'error');
    }
}

/**
 * Handle password change form submission
 * @param {Event} e - Form submit event
 */
function handlePasswordFormSubmit(e) {
    e.preventDefault();

    try {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validation
        if (newPassword.length < 6) {
            showToast('Password must be at least 6 characters', 'warning');
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        // TODO: Future integration - call Supabase updateUser
        // const { error } = await window.supabaseClient.auth.updateUser({
        //     password: newPassword
        // });

        console.log('[Dashboard] Password change placeholder - requires backend integration');
        showToast('Password change requires authentication backend integration', 'warning');
        closeModal('changePasswordModal');
        document.getElementById('changePasswordForm').reset();

    } catch (error) {
        console.error('[Dashboard] Error in password change:', error);
        showToast('Error changing password', 'error');
    }
}

// ======================================================
// 3. MODAL CONTROL
// ======================================================

/**
 * Open modal by ID
 * @param {string} modalId - Modal element ID
 */
function openModal(modalId) {
    try {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            modal.removeAttribute('inert');
            modal.setAttribute('aria-hidden', 'false');
            console.log(`[Dashboard] Modal opened: ${modalId}`);
        }
    } catch (error) {
        console.error(`[Dashboard] Error opening modal ${modalId}:`, error);
    }
}

/**
 * Close modal by ID
 * @param {string} modalId - Modal element ID
 */
function closeModal(modalId) {
    try {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            modal.setAttribute('inert', '');
            modal.setAttribute('aria-hidden', 'true');
            console.log(`[Dashboard] Modal closed: ${modalId}`);
        }
    } catch (error) {
        console.error(`[Dashboard] Error closing modal ${modalId}:`, error);
    }
}

/**
 * Setup modal close buttons
 */
function setupModalCloseButtons() {
    try {
        // Find all modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = btn.closest('.modal-overlay');
                if (modal) {
                    closeModal(modal.id);
                }
            });
        });

        // Find all modal cancel buttons
        document.querySelectorAll('.modal-cancel').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = btn.closest('.modal-overlay');
                if (modal) {
                    closeModal(modal.id);
                }
            });
        });

        // Close modal on overlay click (outside modal content)
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal(modal.id);
                }
            });
        });

        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal-overlay.active').forEach(modal => {
                    closeModal(modal.id);
                });
            }
        });

    } catch (error) {
        console.error('[Dashboard] Error setting up modal close buttons:', error);
    }
}

// ======================================================
// 4. LOCAL STORAGE PERSISTENCE
// ======================================================

/**
 * Save wellness profile to localStorage
 * @param {object} data - Wellness profile data
 */
function saveWellnessProfile(data) {
    try {
        localStorage.setItem('rvWellnessProfile', JSON.stringify(data));
    } catch (error) {
        console.error('[Dashboard] Error saving wellness profile:', error);
    }
}

/**
 * Load wellness profile from localStorage
 * @returns {object|null} Wellness profile data
 */
function loadWellnessProfile() {
    try {
        const data = localStorage.getItem('rvWellnessProfile');
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('[Dashboard] Error loading wellness profile:', error);
        return null;
    }
}

/**
 * Save preferences to localStorage
 * @param {object} data - Preferences data
 */
function savePreferences(data) {
    try {
        localStorage.setItem('rvPreferences', JSON.stringify(data));
    } catch (error) {
        console.error('[Dashboard] Error saving preferences:', error);
    }
}

/**
 * Load preferences from localStorage
 * @returns {object|null} Preferences data
 */
function loadPreferences() {
    try {
        const data = localStorage.getItem('rvPreferences');
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('[Dashboard] Error loading preferences:', error);
        return null;
    }
}

/**
 * Apply preferences to UI
 * @param {object} preferences - Preferences data
 */
function applyPreferences(preferences) {
    try {
        if (preferences.openToContact !== undefined) {
            const toggle = document.getElementById('openToContact');
            toggle.checked = preferences.openToContact;
        }
    } catch (error) {
        console.error('[Dashboard] Error applying preferences:', error);
    }
}

/**
 * Save membership to localStorage
 * @param {object} data - Membership data
 */
function saveMembership(data) {
    try {
        localStorage.setItem('rvMembership', JSON.stringify(data));
    } catch (error) {
        console.error('[Dashboard] Error saving membership:', error);
    }
}

/**
 * Load membership from localStorage
 * @returns {object|null} Membership data
 */
function loadMembership() {
    try {
        const data = localStorage.getItem('rvMembership');
        return data ? JSON.parse(data) : { tier: 'Free', updated_at: new Date().toISOString() };
    } catch (error) {
        console.error('[Dashboard] Error loading membership:', error);
        return { tier: 'Free' };
    }
}

/**
 * Update membership display
 * @param {object} membership - Membership data
 */
function updateMembershipDisplay(membership) {
    try {
        const tierElement = document.getElementById('currentTier');
        if (tierElement) {
            tierElement.textContent = membership.tier || 'Free';
        }
    } catch (error) {
        console.error('[Dashboard] Error updating membership display:', error);
    }
}

// ======================================================
// 5. TOAST NOTIFICATIONS
// ======================================================

/**
 * Show toast notification
 * @param {string} message - Notification message
 * @param {string} type - Notification type: 'success', 'error', 'warning'
 * @param {number} duration - Duration in milliseconds
 */
function showToast(message, type = 'success', duration = 3000) {
    try {
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = message;
            toast.className = `toast ${type} show`;

            setTimeout(() => {
                toast.classList.remove('show');
            }, duration);
        }
    } catch (error) {
        console.error('[Dashboard] Error showing toast:', error);
    }
}

// ======================================================
// 6. EVENT LISTENERS
// ======================================================

/**
 * Setup all event listeners on page load
 */
function setupEventListeners() {
    try {
        // Account form submission
        const accountForm = document.getElementById('accountForm');
        if (accountForm) {
            accountForm.addEventListener('submit', handleAccountFormSubmit);
        }

        // Wellness form submission
        const wellnessForm = document.getElementById('wellnessForm');
        if (wellnessForm) {
            wellnessForm.addEventListener('submit', handleWellnessFormSubmit);
        }

        // Avatar upload
        const avatarInput = document.getElementById('clientAvatarInput');
        if (avatarInput) {
            avatarInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    handleClientAvatarUpload(e.target.files[0]);
                }
            });
        }

        // Change password button
        const changePasswordBtn = document.getElementById('changePasswordBtn');
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', () => {
                openModal('changePasswordModal');
            });
        }

        // Change password form submission
        const changePasswordForm = document.getElementById('changePasswordForm');
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', handlePasswordFormSubmit);
        }

        // Connection preferences toggle
        const openToContactToggle = document.getElementById('openToContact');
        if (openToContactToggle) {
            openToContactToggle.addEventListener('change', (e) => {
                const preferences = {
                    openToContact: e.target.checked,
                    updated_at: new Date().toISOString()
                };
                savePreferences(preferences);
                showToast(
                    e.target.checked ? 'Practitioners can now contact you' : 'Practitioner contact disabled',
                    'success'
                );
            });
        }

        // Membership upgrade buttons
        const upgradeBasicBtn = document.getElementById('upgradeBasicBtn');
        if (upgradeBasicBtn) {
            upgradeBasicBtn.addEventListener('click', () => {
                showToast('Membership upgrade requires payment integration', 'warning');
            });
        }

        const upgradePremiumBtn = document.getElementById('upgradePremiumBtn');
        if (upgradePremiumBtn) {
            upgradePremiumBtn.addEventListener('click', () => {
                showToast('Membership upgrade requires payment integration', 'warning');
            });
        }

        // Delete account button
        const deleteAccountBtn = document.getElementById('deleteAccountBtn');
        if (deleteAccountBtn) {
            deleteAccountBtn.addEventListener('click', () => {
                openModal('deleteAccountModal');
                resetDeleteConfirmation();
            });
        }

        // Delete confirmation input
        const deleteConfirmInput = document.getElementById('deleteConfirmInput');
        if (deleteConfirmInput) {
            deleteConfirmInput.addEventListener('input', (e) => {
                const confirmBtn = document.getElementById('confirmDeleteBtn');
                confirmBtn.disabled = e.target.value !== 'DELETE';
            });
        }

        // Confirm delete button
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', handleDeleteAccount);
        }

        // Modal close buttons (delegated)
        setupModalCloseButtons();

        console.log('[Dashboard] Event listeners setup complete');

    } catch (error) {
        console.error('[Dashboard] Error setting up event listeners:', error);
    }
}

// ======================================================
// 7. UTILITY FUNCTIONS
// ======================================================

/**
 * Reset delete confirmation modal
 */
function resetDeleteConfirmation() {
    try {
        const input = document.getElementById('deleteConfirmInput');
        const btn = document.getElementById('confirmDeleteBtn');
        if (input) input.value = '';
        if (btn) btn.disabled = true;
    } catch (error) {
        console.error('[Dashboard] Error resetting delete confirmation:', error);
    }
}

/**
 * Handle account deletion
 * @param {Event} e - Click event
 */
async function handleDeleteAccount(e) {
    e.preventDefault();

    try {
        const confirmInput = document.getElementById('deleteConfirmInput');
        
        if (confirmInput.value !== 'DELETE') {
            showToast('Please type DELETE to confirm', 'warning');
            return;
        }

        // TODO: Future integration - delete from Supabase
        // const { error } = await window.supabaseClient
        //     .from('profiles')
        //     .delete()
        //     .eq('id', user.id);
        //
        // await window.supabaseClient.auth.signOut();

        console.log('[Dashboard] Account deletion placeholder - requires backend integration');
        showToast('Account deletion requires backend integration (placeholder only)', 'warning');
        
        // For demo purposes, just close modal
        closeModal('deleteAccountModal');
        resetDeleteConfirmation();

    } catch (error) {
        console.error('[Dashboard] Error deleting account:', error);
        showToast('Error processing account deletion', 'error');
    }
}

// ======================================================
// PAGE INITIALIZATION
// ======================================================

window.addEventListener('DOMContentLoaded', async () => {
    console.log('[Dashboard] Page loaded, initializing...');
    
    await initializeDashboard();
    setupEventListeners();
    
    console.log('[Dashboard] Initialization complete');
});

console.log('[Rooted Vitality] dashboard-client.js ready');

























































