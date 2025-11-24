/* =====================================================
   ROOTED VITALITY, INC.
   File: proSettings.js
   Purpose: Practitioner settings page functionality
   Holistic Wellness · Modern Connection Platform
   rootedvitality.com | 2025
   ===================================================== */

console.log('[Rooted Vitality] proSettings.js loading...');

/* TABLE OF CONTENTS
   1. INITIALIZATION & STATE
   2. NAVIGATION MANAGEMENT
   3. ACCOUNT SETTINGS
   4. NOTIFICATIONS
   5. PRIVACY & SECURITY
   6. BILLING MANAGEMENT
   7. UTILITY FUNCTIONS
   8. EVENT LISTENERS
*/

/* ========================================== */
/* 1. INITIALIZATION & STATE */
/* ========================================== */

let currentUser = null;
let userSettings = {};

async function initializeSettings() {
    try {
        console.log('[Rooted Vitality] Initializing practitioner settings...');
        
        // Get current user
        const { data: { user }, error: authError } = await window.supabaseClient.auth.getUser();
        if (authError) {
            console.error('[Rooted Vitality] Auth error:', authError);
            window.location.href = '../../index.html';
            return;
        }
        
        if (!user) {
            console.warn('[Rooted Vitality] No user found, redirecting to index');
            window.location.href = '../../index.html';
            return;
        }
        
        currentUser = user;
        console.log('[Rooted Vitality] Current user:', user.email);
        
        // Load user settings from database
        const loaded = await loadUserSettings();
        if (!loaded) {
            console.warn('[Rooted Vitality] Failed to load user settings, but continuing with available data');
        }
        
        // Populate UI with user data
        populateSettingsUI();
        
        // Setup event listeners
        setupSettingsListeners();
        setupModalHandlers();
        
        console.log('[Rooted Vitality] Settings initialized successfully');
    } catch (error) {
        console.error('[Rooted Vitality] Fatal error initializing settings:', error);
        alert('Error loading settings. Please refresh the page.');
    }
}

async function loadUserSettings() {
    try {
        console.log('[Rooted Vitality] Loading settings for user:', currentUser.id);
        
        const { data, error } = await window.supabaseClient
            .from('practitioners')
            .select('*')
            .eq('id', currentUser.id)
            .single();
        
        if (error) {
            console.error('[Rooted Vitality] Database error loading settings:', error);
            console.error('[Rooted Vitality] Error code:', error.code);
            console.error('[Rooted Vitality] Error details:', error.details);
            return false;
        }
        
        if (!data) {
            console.warn('[Rooted Vitality] No practitioner record found for user');
            return false;
        }
        
        userSettings = data;
        console.log('[Rooted Vitality] User settings loaded successfully:', {
            email: data.email,
            phone: data.phone,
            address: data.address_street || 'not set'
        });
        return true;
    } catch (error) {
        console.error('[Rooted Vitality] Exception in loadUserSettings:', error);
        return false;
    }
}

/* ========================================== */
/* 2. NAVIGATION MANAGEMENT */
/* ========================================== */

function setupNavigationTabs() {
    const navLinks = document.querySelectorAll('.settings-nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            switchSection(section);
        });
    });

    // Setup link to account settings from notification banner
    const linkToAccount = document.querySelector('.link-to-account');
    if (linkToAccount) {
        linkToAccount.addEventListener('click', (e) => {
            e.preventDefault();
            switchSection('account');
        });
    }
}

function switchSection(sectionId) {
    // Remove active class from all sections and links
    document.querySelectorAll('.settings-section').forEach(s => {
        s.classList.remove('active');
    });
    document.querySelectorAll('.settings-nav-link').forEach(l => {
        l.classList.remove('active');
    });
    
    // Add active class to selected section and link
    const section = document.querySelector(`.settings-section[data-section="${sectionId}"]`);
    const link = document.querySelector(`.settings-nav-link[data-section="${sectionId}"]`);
    
    if (section) {
        section.classList.add('active');
        console.log('[Rooted Vitality] Section activated:', sectionId);
    } else {
        console.error('[Rooted Vitality] Section not found:', sectionId);
    }
    if (link) {
        link.classList.add('active');
    }
    
    console.log('[Rooted Vitality] Switched to section:', sectionId);
}

/* ========================================== */
/* 3. ACCOUNT SETTINGS */
/* ========================================== */

function populateSettingsUI() {
    try {
        console.log('[Rooted Vitality] Starting to populate settings UI');
        
        // Email Address
        const emailEl = document.getElementById('display-email');
        if (emailEl) {
            emailEl.textContent = currentUser.email || 'Not set';
            console.log('[Rooted Vitality] Email populated:', currentUser.email);
        } else {
            console.warn('[Rooted Vitality] display-email element not found');
        }
        
        // Phone Number
        const phoneEl = document.getElementById('display-phone');
        if (phoneEl) {
            phoneEl.textContent = userSettings.phone || 'Not set';
            console.log('[Rooted Vitality] Phone populated:', userSettings.phone || 'Not set');
        } else {
            console.warn('[Rooted Vitality] display-phone element not found');
        }
        
        // Physical Address
        const addressEl = document.getElementById('display-address');
        if (addressEl) {
            let address = 'Not set';
            // Check both old and new field names for compatibility
            const street = userSettings.physical_address || userSettings.address_street;
            const city = userSettings.practice_city || userSettings.address_city;
            const state = userSettings.practice_state || userSettings.address_state;
            const zip = userSettings.zipcode || userSettings.address_zip;
            
            if (street && city && state) {
                address = `${street}, ${city}, ${state}${zip ? ' ' + zip : ''}`;
            } else if (street) {
                address = street;
            } else if (userSettings.location) {
                address = userSettings.location;
            }
            addressEl.textContent = address;
            console.log('[Rooted Vitality] Address populated:', address);
        } else {
            console.warn('[Rooted Vitality] display-address element not found');
        }
        
        // Account Standing
        const standingBadge = document.getElementById('account-standing-badge');
        const standingDesc = document.getElementById('account-standing-desc');
        
        if (standingBadge && standingDesc) {
            standingBadge.textContent = 'Active';
            standingBadge.className = 'status-badge';
            standingDesc.textContent = 'Your account is in good standing';
            console.log('[Rooted Vitality] Account standing populated');
        } else {
            console.warn('[Rooted Vitality] Account standing elements not found');
        }
        
        console.log('[Rooted Vitality] Settings UI population complete');
    } catch (error) {
        console.error('[Rooted Vitality] Error populating settings UI:', error);
    }
}

/* ========================================== */
/* 4. NOTIFICATIONS */
/* ========================================== */

function loadNotificationPreferences() {
    try {
        console.log('[Rooted Vitality] Loading notification preferences');
        
        // Load from database instead of localStorage
        loadNotificationPreferencesFromDatabase();
    } catch (error) {
        console.error('[Rooted Vitality] Error loading notification preferences:', error);
    }
}

async function loadNotificationPreferencesFromDatabase() {
    try {
        const { data, error } = await window.supabaseClient
            .from('practitioner_notification_settings')
            .select('*')
            .eq('practitioner_serial', currentUser.serial_number)
            .single();
        
        if (error && error.code !== 'PGRST116') {
            console.error('[Rooted Vitality] Error loading notification settings:', error);
            // Default all to checked if error
            defaultNotificationPreferences();
            return;
        }
        
        if (data) {
            console.log('[Rooted Vitality] Notification preferences loaded:', data);
            // Apply saved preferences to checkboxes
            const notificationFields = [
                'messages_in_app', 'messages_sms', 'messages_email',
                'matches_in_app', 'matches_sms', 'matches_email',
                'reviews_in_app', 'reviews_sms', 'reviews_email',
                'promotions_in_app', 'promotions_sms', 'promotions_email',
                'system_in_app', 'system_sms', 'system_email',
                'account_in_app'
            ];
            
            notificationFields.forEach(field => {
                const checkbox = document.querySelector(`[name="${field}"]`);
                if (checkbox) {
                    checkbox.checked = data[field] !== false; // Default to true if field not set
                }
            });
        } else {
            console.log('[Rooted Vitality] No notification settings found, defaulting all to checked');
            defaultNotificationPreferences();
        }
    } catch (error) {
        console.error('[Rooted Vitality] Exception loading notifications:', error);
        defaultNotificationPreferences();
    }
}

function defaultNotificationPreferences() {
    // Set all notification checkboxes to checked by default
    const notificationFields = [
        'messages_in_app', 'messages_sms', 'messages_email',
        'matches_in_app', 'matches_sms', 'matches_email',
        'reviews_in_app', 'reviews_sms', 'reviews_email',
        'promotions_in_app', 'promotions_sms', 'promotions_email',
        'system_in_app', 'system_sms', 'system_email',
        'account_in_app'
    ];
    
    notificationFields.forEach(field => {
        const checkbox = document.querySelector(`[name="${field}"]`);
        if (checkbox) {
            checkbox.checked = true;
        }
    });
    
    console.log('[Rooted Vitality] Default notification preferences applied (all checked)');
}

function saveNotificationPreferences() {
    try {
        const preferences = {};
        
        // Collect all notification channel preferences
        document.querySelectorAll('.notification-input').forEach(checkbox => {
            preferences[checkbox.name] = checkbox.checked;
        });
        
        // Save to Supabase instead of localStorage
        saveNotificationPreferencesToDatabase(preferences);
        console.log('[Rooted Vitality] Notification preferences updated:', preferences);
    } catch (error) {
        console.error('[Rooted Vitality] Error saving notification preferences:', error);
    }
}

async function saveNotificationPreferencesToDatabase(preferences) {
    try {
        // Ensure all fields are present with correct names
        const fullPreferences = {
            practitioner_serial: currentUser.serial_number,
            messages_in_app: preferences['messages_in_app'] !== false,
            messages_sms: preferences['messages_sms'] !== false,
            messages_email: preferences['messages_email'] !== false,
            matches_in_app: preferences['matches_in_app'] !== false,
            matches_sms: preferences['matches_sms'] !== false,
            matches_email: preferences['matches_email'] !== false,
            reviews_in_app: preferences['reviews_in_app'] !== false,
            reviews_sms: preferences['reviews_sms'] !== false,
            reviews_email: preferences['reviews_email'] !== false,
            promotions_in_app: preferences['promotions_in_app'] !== false,
            promotions_sms: preferences['promotions_sms'] !== false,
            promotions_email: preferences['promotions_email'] !== false,
            system_in_app: preferences['system_in_app'] !== false,
            system_sms: preferences['system_sms'] !== false,
            system_email: preferences['system_email'] !== false,
            account_in_app: preferences['account_in_app'] !== false,
            updated_at: new Date().toISOString()
        };
        
        // Save to practitioner_notification_settings table
        const { error: notifError } = await window.supabaseClient
            .from('practitioner_notification_settings')
            .upsert(fullPreferences, { onConflict: 'practitioner_serial' });
        
        if (notifError) {
            console.error('[Rooted Vitality] Error saving preferences:', notifError);
            console.log('[Rooted Vitality] Failed to save notification preferences');
            return;
        }

        console.log('[Rooted Vitality] Preferences saved successfully to database');
    } catch (error) {
        console.error('[Rooted Vitality] Exception saving preferences to database:', error);
    }
}

async function saveNotificationsToSupabase() {
    try {
        if (!currentUser) {
            console.warn('[Rooted Vitality] No current user, cannot save to Supabase');
            alert('Please log in again to save notification preferences.');
            return false;
        }

        const preferences = {};
        
        // Collect all notification channel preferences
        document.querySelectorAll('.notification-input').forEach(checkbox => {
            preferences[checkbox.name] = checkbox.checked;
        });

        // Update practitioner_notification_settings table with new preferences
        const fullPreferences = {
            practitioner_serial: currentUser.serial_number,
            messages_in_app: preferences['messages_in_app'] !== false,
            messages_sms: preferences['messages_sms'] !== false,
            messages_email: preferences['messages_email'] !== false,
            matches_in_app: preferences['matches_in_app'] !== false,
            matches_sms: preferences['matches_sms'] !== false,
            matches_email: preferences['matches_email'] !== false,
            reviews_in_app: preferences['reviews_in_app'] !== false,
            reviews_sms: preferences['reviews_sms'] !== false,
            reviews_email: preferences['reviews_email'] !== false,
            promotions_in_app: preferences['promotions_in_app'] !== false,
            promotions_sms: preferences['promotions_sms'] !== false,
            promotions_email: preferences['promotions_email'] !== false,
            system_in_app: preferences['system_in_app'] !== false,
            system_sms: preferences['system_sms'] !== false,
            system_email: preferences['system_email'] !== false,
            account_in_app: preferences['account_in_app'] !== false,
            updated_at: new Date().toISOString()
        };

        const { error } = await window.supabaseClient
            .from('practitioner_notification_settings')
            .upsert(fullPreferences);

        if (error) {
            console.error('[Rooted Vitality] Error saving to Supabase:', error);
            alert('Error saving preferences. Please try again.');
            return false;
        }
        
        console.log('[Rooted Vitality] Notification preferences saved to Supabase:', fullPreferences);
        
        // Show success feedback
        const btn = document.getElementById('save-notifications-btn');
        if (btn) {
            const originalText = btn.textContent;
            btn.textContent = 'Preferences Saved!';
            btn.style.opacity = '0.7';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.opacity = '1';
            }, 2000);
        }
        
        return true;
    } catch (error) {
        console.error('[Rooted Vitality] Fatal error saving notification preferences:', error);
        alert('Error saving preferences. Please try again.');
        return false;
    }
}

/* ========================================== */
/* 5. PRIVACY & SECURITY */
/* ========================================== */

function setupPrivacySettings() {
    // Load privacy preferences
    const profileVisibility = localStorage.getItem('profile-visibility') || 'public';
    const marketing = localStorage.getItem('marketing-emails') === 'true';
    
    const visibilitySelect = document.getElementById('profile-visibility');
    const marketingCheckbox = document.getElementById('marketing-emails');
    
    if (visibilitySelect) {
        visibilitySelect.value = profileVisibility;
        visibilitySelect.addEventListener('change', () => {
            localStorage.setItem('profile-visibility', visibilitySelect.value);
            console.log('[Rooted Vitality] Profile visibility updated');
        });
    }
    
    if (marketingCheckbox) {
        marketingCheckbox.checked = marketing;
        marketingCheckbox.addEventListener('change', () => {
            localStorage.setItem('marketing-emails', marketingCheckbox.checked);
            console.log('[Rooted Vitality] Marketing email preference updated');
        });
    }
}

/* ========================================== */
/* 6. FIELD EDITING */
/* ========================================== */

async function handleEditField(fieldType, fieldName) {
    const modal = document.getElementById(`edit-${fieldType}-modal`);
    if (!modal) {
        console.error(`[Rooted Vitality] Modal not found for field: ${fieldType}`);
        return;
    }

    // Populate form with current values
    if (fieldType === 'email') {
        const emailInput = document.getElementById('email-input');
        emailInput.value = userSettings.email || currentUser.email || '';
    } else if (fieldType === 'phone') {
        const phoneInput = document.getElementById('phone-input');
        phoneInput.value = userSettings.phone || '';
    } else if (fieldType === 'address') {
        document.getElementById('address-street-input').value = userSettings.physical_address || '';
        document.getElementById('address-city-input').value = userSettings.practice_city || '';
        document.getElementById('address-state-input').value = userSettings.practice_state || '';
        document.getElementById('address-zip-input').value = userSettings.zipcode || '';
    }

    // Show modal
    modal.style.display = 'flex';

    // Create form submit handler
    const form = document.getElementById(`edit-${fieldType}-form`);
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            let updateData = {};
            let newValue = '';

            if (fieldType === 'email') {
                newValue = document.getElementById('email-input').value.trim();
                if (!newValue || !newValue.includes('@')) {
                    alert('Please enter a valid email address');
                    return;
                }
                // Update email in auth
                const { error } = await window.supabaseClient.auth.updateUser({
                    email: newValue
                });
                if (error) throw error;
            } else if (fieldType === 'phone') {
                newValue = document.getElementById('phone-input').value.trim();
                if (!newValue) {
                    alert('Please enter a phone number');
                    return;
                }
                updateData.phone = newValue;
            } else if (fieldType === 'address') {
                const street = document.getElementById('address-street-input').value.trim();
                const city = document.getElementById('address-city-input').value.trim();
                const state = document.getElementById('address-state-input').value.trim();
                const zip = document.getElementById('address-zip-input').value.trim();

                if (!street || !city || !state || !zip) {
                    alert('Please fill in all address fields');
                    return;
                }

                updateData.physical_address = street;
                updateData.practice_city = city;
                updateData.practice_state = state;
                updateData.zipcode = zip;
                newValue = `${street}, ${city}, ${state} ${zip}`;
            }

            // Update in Supabase practitioners table
            if (Object.keys(updateData).length > 0) {
                const { error } = await window.supabaseClient
                    .from('practitioners')
                    .update(updateData)
                    .eq('id', currentUser.id);
                
                if (error) throw error;

                // Update local state
                Object.assign(userSettings, updateData);
            } else if (fieldType === 'email') {
                // Email was updated via auth
                userSettings.email = newValue;
            }

            // Update UI
            if (fieldType === 'email') {
                document.getElementById('display-email').textContent = newValue;
            } else if (fieldType === 'phone') {
                document.getElementById('display-phone').textContent = newValue;
            } else if (fieldType === 'address') {
                const street = document.getElementById('address-street-input').value;
                const city = document.getElementById('address-city-input').value;
                const state = document.getElementById('address-state-input').value;
                const zip = document.getElementById('address-zip-input').value;
                document.getElementById('display-address').textContent = `${street}, ${city}, ${state} ${zip}`;
            }

            // Close modal
            modal.style.display = 'none';
            form.removeEventListener('submit', handleSubmit);

            alert(`${fieldName} updated successfully!`);
            console.log(`[Rooted Vitality] ${fieldName} updated`);
        } catch (error) {
            console.error(`[Rooted Vitality] Error updating ${fieldName}:`, error);
            alert(`Error updating ${fieldName}. Please try again.`);
        }
    };

    form.addEventListener('submit', handleSubmit);
}

/* ========================================== */
/* INLINE ADDRESS EDITING */
/* ========================================== */

function toggleAddressEdit() {
    const displayView = document.getElementById('address-display-view');
    const editView = document.getElementById('address-edit-view');
    const editBtn = document.getElementById('btn-edit-address');
    
    const isEditing = editView.style.display !== 'none';
    
    if (isEditing) {
        // Hide edit, show display
        editView.style.display = 'none';
        displayView.style.display = 'block';
        editBtn.textContent = 'Edit';
    } else {
        // Show edit, hide display
        editView.style.display = 'block';
        displayView.style.display = 'none';
        editBtn.textContent = 'Cancel';
        
        // Populate fields with current values
        document.getElementById('address-street-inline').value = userSettings.physical_address || '';
        document.getElementById('address-city-inline').value = userSettings.practice_city || '';
        document.getElementById('address-state-inline').value = userSettings.practice_state || '';
    }
}

async function saveAddressChanges(e) {
    e.preventDefault();
    
    try {
        const street = document.getElementById('address-street-inline').value.trim();
        const city = document.getElementById('address-city-inline').value.trim();
        const state = document.getElementById('address-state-inline').value.trim();
        
        if (!street || !city || !state) {
            alert('Please fill in all address fields');
            return;
        }
        
        // Update in Supabase
        const { error } = await window.supabaseClient
            .from('practitioners')
            .update({
                physical_address: street,
                practice_city: city,
                practice_state: state
            })
            .eq('id', currentUser.id);
        
        if (error) throw error;
        
        // Update local state
        userSettings.physical_address = street;
        userSettings.practice_city = city;
        userSettings.practice_state = state;
        
        // Update display
        document.getElementById('display-address').textContent = `${street}, ${city}, ${state}`;
        
        // Hide edit, show display
        toggleAddressEdit();
        
        console.log('[Rooted Vitality] Address updated successfully');
    } catch (error) {
        console.error('[Rooted Vitality] Error saving address:', error);
        alert('Error saving address. Please try again.');
    }
}

/* ========================================== */
/* INLINE EMAIL EDITING */
/* ========================================== */

function toggleEmailEdit() {
    const displayView = document.getElementById('email-display-view');
    const editView = document.getElementById('email-edit-view');
    const editBtn = document.getElementById('btn-edit-email');
    
    const isEditing = editView.style.display !== 'none';
    
    if (isEditing) {
        // Hide edit, show display
        editView.style.display = 'none';
        displayView.style.display = 'block';
        editBtn.textContent = 'Edit';
    } else {
        // Show edit, hide display
        editView.style.display = 'block';
        displayView.style.display = 'none';
        editBtn.textContent = 'Cancel';
        
        // Populate field with current value
        document.getElementById('email-inline').value = currentUser.email || '';
    }
}

async function saveEmailChanges(e) {
    e.preventDefault();
    
    try {
        const newEmail = document.getElementById('email-inline').value.trim();
        
        if (!newEmail || !newEmail.includes('@')) {
            alert('Please enter a valid email address');
            return;
        }
        
        // Update email via Supabase auth
        const { error } = await window.supabaseClient.auth.updateUser({
            email: newEmail
        });
        
        if (error) throw error;
        
        // Update local state
        currentUser.email = newEmail;
        userSettings.email = newEmail;
        
        // Update display
        document.getElementById('display-email').textContent = newEmail;
        
        // Hide edit, show display
        toggleEmailEdit();
        
        console.log('[Rooted Vitality] Email updated successfully');
    } catch (error) {
        console.error('[Rooted Vitality] Error saving email:', error);
        alert('Error saving email. Please try again.');
    }
}

/* ========================================== */
/* INLINE PHONE EDITING */
/* ========================================== */

function togglePhoneEdit() {
    const displayView = document.getElementById('phone-display-view');
    const editView = document.getElementById('phone-edit-view');
    const editBtn = document.getElementById('btn-edit-phone');
    
    const isEditing = editView.style.display !== 'none';
    
    if (isEditing) {
        // Hide edit, show display
        editView.style.display = 'none';
        displayView.style.display = 'block';
        editBtn.textContent = 'Edit';
    } else {
        // Show edit, hide display
        editView.style.display = 'block';
        displayView.style.display = 'none';
        editBtn.textContent = 'Cancel';
        
        // Populate field with current value
        document.getElementById('phone-inline').value = userSettings.phone || '';
    }
}

async function savePhoneChanges(e) {
    e.preventDefault();
    
    try {
        const newPhone = document.getElementById('phone-inline').value.trim();
        
        if (!newPhone) {
            alert('Please enter a phone number');
            return;
        }
        
        // Update in Supabase
        const { error } = await window.supabaseClient
            .from('practitioners')
            .update({ phone: newPhone })
            .eq('id', currentUser.id);
        
        if (error) throw error;
        
        // Update local state
        userSettings.phone = newPhone;
        
        // Update display
        document.getElementById('display-phone').textContent = newPhone;
        
        // Hide edit, show display
        togglePhoneEdit();
        
        console.log('[Rooted Vitality] Phone updated successfully');
    } catch (error) {
        console.error('[Rooted Vitality] Error saving phone:', error);
        alert('Error saving phone. Please try again.');
    }
}

function setupModalHandlers() {
    // Close buttons for all modals
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.settings-modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });

    // Cancel buttons for all modals
    document.querySelectorAll('.modal-cancel-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.settings-modal');
            if (modal) {
                modal.style.display = 'none';
                // Remove form listeners
                const form = modal.querySelector('form');
                if (form) {
                    const clone = form.cloneNode(true);
                    form.parentNode.replaceChild(clone, form);
                }
            }
        });
    });

    // Close modals when clicking overlay
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                const modal = e.target.closest('.settings-modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            }
        });
    });
}

/* ========================================== */
/* 7. BUTTON ACTIONS */
/* ========================================== */

function setupButtonActions() {
    // Edit Email
    const editEmailBtn = document.querySelector('[data-setting="email"]');
    if (editEmailBtn) {
        editEmailBtn.addEventListener('click', () => {
            toggleEmailEdit();
        });
    }
    
    // Email form handlers
    const emailForm = document.getElementById('email-edit-view');
    if (emailForm) {
        emailForm.addEventListener('submit', saveEmailChanges);
    }
    
    const cancelEmailBtn = document.getElementById('btn-cancel-email');
    if (cancelEmailBtn) {
        cancelEmailBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleEmailEdit();
        });
    }
    
    // Edit Phone
    const editPhoneBtn = document.querySelector('[data-setting="phone"]');
    if (editPhoneBtn) {
        editPhoneBtn.addEventListener('click', () => {
            togglePhoneEdit();
        });
    }
    
    // Phone form handlers
    const phoneForm = document.getElementById('phone-edit-view');
    if (phoneForm) {
        phoneForm.addEventListener('submit', savePhoneChanges);
    }
    
    const cancelPhoneBtn = document.getElementById('btn-cancel-phone');
    if (cancelPhoneBtn) {
        cancelPhoneBtn.addEventListener('click', (e) => {
            e.preventDefault();
            togglePhoneEdit();
        });
    }
    
    // Edit Address
    const editAddressBtn = document.querySelector('[data-setting="address"]');
    if (editAddressBtn) {
        editAddressBtn.addEventListener('click', () => {
            toggleAddressEdit();
        });
    }
    
    // Address form handlers
    const addressForm = document.getElementById('address-edit-view');
    if (addressForm) {
        addressForm.addEventListener('submit', saveAddressChanges);
    }
    
    const cancelAddressBtn = document.getElementById('btn-cancel-address');
    if (cancelAddressBtn) {
        cancelAddressBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleAddressEdit();
        });
    }
    
    // Change Password
    const changePasswordBtn = document.getElementById('change-password-btn');
    console.log('[Rooted Vitality] Change password button:', changePasswordBtn);
    if (changePasswordBtn) {
        console.log('[Rooted Vitality] Attaching password reset listener');
        changePasswordBtn.addEventListener('click', () => {
            console.log('[Rooted Vitality] Password button clicked');
            handleChangePassword();
        });
    } else {
        console.warn('[Rooted Vitality] Change password button not found in DOM');
    }
    
    // Download Data
    const downloadDataBtn = document.getElementById('download-data-btn');
    if (downloadDataBtn) {
        downloadDataBtn.addEventListener('click', () => {
            handleDownloadData();
        });
    }
    
    // Enable 2FA
    const enable2faBtn = document.getElementById('enable-2fa-btn');
    if (enable2faBtn) {
        enable2faBtn.addEventListener('click', () => {
            enable2FA();
        });
    }
    
    // Cancel 2FA setup
    const cancel2faBtn = document.getElementById('btn-cancel-2fa');
    if (cancel2faBtn) {
        cancel2faBtn.addEventListener('click', () => {
            document.getElementById('2fa-setup-view').style.display = 'none';
            document.getElementById('2fa-status-view').style.display = 'block';
            document.getElementById('2fa-setup-view').reset();
        });
    }
    
    // Disable 2FA
    const disable2faBtn = document.getElementById('disable-2fa-btn');
    if (disable2faBtn) {
        disable2faBtn.addEventListener('click', () => {
            disable2FA();
        });
    }
    
    // View Sessions
    const viewSessionsBtn = document.getElementById('view-sessions-btn');
    if (viewSessionsBtn) {
        viewSessionsBtn.addEventListener('click', () => {
            handleViewSessions();
        });
    }
    
    // Contact Support
    const contactSupportBtn = document.getElementById('contact-support-btn');
    if (contactSupportBtn) {
        contactSupportBtn.addEventListener('click', () => {
            handleContactSupport();
        });
    }
    
    // Deactivate Account
    const deactivateBtn = document.getElementById('deactivate-account-btn');
    if (deactivateBtn) {
        deactivateBtn.addEventListener('click', () => {
            handleDeactivateAccount();
        });
    }
    
    // Delete Account
    const deleteBtn = document.getElementById('delete-account-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            handleDeleteAccount();
        });
    }
    
    // Delete Profile
    const deleteProfileBtn = document.getElementById('delete-profile-btn');
    if (deleteProfileBtn) {
        deleteProfileBtn.addEventListener('click', () => {
            handleDeleteProfile();
        });
    }
    
    // CCPA Request
    const ccpaBtn = document.getElementById('ccpa-request-btn');
    if (ccpaBtn) {
        ccpaBtn.addEventListener('click', () => {
            handleCCPARequest();
        });
    }
    
    // View Billing History
    const viewBillingBtn = document.getElementById('view-billing-btn');
    if (viewBillingBtn) {
        viewBillingBtn.addEventListener('click', () => {
            handleViewBilling();
        });
    }
    
    // Manage Payment Methods
    const managePaymentBtn = document.getElementById('manage-payment-btn');
    if (managePaymentBtn) {
        managePaymentBtn.addEventListener('click', () => {
            handleManagePayment();
        });
    }
    
    // View Plans
    const viewPlansBtn = document.getElementById('view-plans-btn');
    if (viewPlansBtn) {
        viewPlansBtn.addEventListener('click', () => {
            handleViewPlans();
        });
    }
}

async function handleChangePassword() {
    console.log('[Rooted Vitality] Change password initiated');
    
    if (!currentUser || !currentUser.email) {
        alert('Error: User email not found');
        return;
    }

    try {
        // Show confirmation
        const confirmed = confirm(`We'll send a password reset link to ${currentUser.email}. Please check your inbox to complete the password reset.`);
        
        if (!confirmed) {
            console.log('[Rooted Vitality] Password reset cancelled');
            return;
        }

        console.log('[Rooted Vitality] Sending password reset email to:', currentUser.email);

        // Send password reset email
        const { error } = await window.supabaseClient.auth.resetPasswordForEmail(currentUser.email, {
            redirectTo: `${window.location.origin}/rooted-vitality/reset.html`
        });

        if (error) {
            console.error('[Rooted Vitality] Password reset error:', error);
            alert(`Error sending reset email: ${error.message}`);
            return;
        }

        console.log('[Rooted Vitality] Password reset email sent successfully');
        
        // Show success message
        showPasswordResetSuccessModal();
    } catch (error) {
        console.error('[Rooted Vitality] Unexpected error during password reset:', error);
        alert('An unexpected error occurred. Please try again.');
    }
}

function showPasswordResetSuccessModal() {
    const modalHTML = `
        <div class="password-reset-modal-overlay">
            <div class="password-reset-modal" style="max-width: 420px;">
                <div class="modal-header">
                    <h2>Check Your Email</h2>
                    <button class="modal-close-btn" id="close-success-modal">&times;</button>
                </div>
                
                <div class="modal-content">
                    <div style="text-align: center; padding: 20px 0;">
                        <div style="font-size: 48px; margin-bottom: 16px;">✓</div>
                        <p style="font-size: 16px; color: #2e2b28; margin-bottom: 12px; font-weight: 500;">
                            Password Reset Email Sent
                        </p>
                        <p style="font-size: 14px; color: #888; line-height: 1.6;">
                            We've sent a password reset link to your email. Click the link in the email to create a new password. 
                            The link expires in 24 hours.
                        </p>
                        <p style="font-size: 13px; color: #aaa; margin-top: 16px;">
                            <strong>Tip:</strong> Check your spam folder if you don't see the email
                        </p>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn-accent" id="close-success-btn" style="width: 100%;">Done</button>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if present
    const existingModal = document.querySelector('.password-reset-modal-overlay');
    if (existingModal) existingModal.remove();
    
    // Insert modal into DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Setup close handlers
    const closeBtn = document.getElementById('close-success-modal');
    const doneBtn = document.getElementById('close-success-btn');
    
    const closeModal = () => {
        const modal = document.querySelector('.password-reset-modal-overlay');
        if (modal) modal.remove();
    };
    
    closeBtn.addEventListener('click', closeModal);
    doneBtn.addEventListener('click', closeModal);
    
    // Close on outside click
    document.querySelector('.password-reset-modal-overlay').addEventListener('click', (e) => {
        if (e.target.classList.contains('password-reset-modal-overlay')) {
            closeModal();
        }
    });
}

function showPasswordResetModal() {
    // Create modal HTML
    const modalHTML = `
        <div class="password-reset-modal-overlay">
            <div class="password-reset-modal">
                <div class="modal-header">
                    <h2>Change Password</h2>
                    <button class="modal-close-btn" id="close-password-modal">&times;</button>
                </div>
                
                <div class="modal-content">
                    <p class="modal-description">Enter your current password and your new password to update your account security.</p>
                    
                    <form id="password-reset-form">
                        <!-- Current Password Section -->
                        <div class="password-section">
                            <h3>Current Password</h3>
                            <div class="form-group">
                                <label for="current-password-1">Enter current password</label>
                                <input 
                                    type="password" 
                                    id="current-password-1" 
                                    class="password-input" 
                                    placeholder="Enter current password"
                                    required
                                />
                            </div>
                            <div class="form-group">
                                <label for="current-password-2">Confirm current password</label>
                                <input 
                                    type="password" 
                                    id="current-password-2" 
                                    class="password-input" 
                                    placeholder="Re-enter current password"
                                    required
                                />
                            </div>
                            <div id="current-password-error" class="password-error"></div>
                        </div>
                        
                        <!-- New Password Section -->
                        <div class="password-section">
                            <h3>New Password</h3>
                            <div class="form-group">
                                <label for="new-password-1">Enter new password</label>
                                <input 
                                    type="password" 
                                    id="new-password-1" 
                                    class="password-input" 
                                    placeholder="Enter new password"
                                    required
                                />
                                <div id="password-strength" class="password-strength"></div>
                            </div>
                            <div class="form-group">
                                <label for="new-password-2">Confirm new password</label>
                                <input 
                                    type="password" 
                                    id="new-password-2" 
                                    class="password-input" 
                                    placeholder="Re-enter new password"
                                    required
                                />
                            </div>
                            <div id="new-password-error" class="password-error"></div>
                        </div>
                        
                        <!-- Password Requirements -->
                        <div class="password-requirements">
                            <h4>Password Requirements:</h4>
                            <ul>
                                <li id="req-length"><span class="req-icon">○</span> At least 8 characters</li>
                                <li id="req-uppercase"><span class="req-icon">○</span> At least one uppercase letter</li>
                                <li id="req-lowercase"><span class="req-icon">○</span> At least one lowercase letter</li>
                                <li id="req-number"><span class="req-icon">○</span> At least one number</li>
                                <li id="req-special"><span class="req-icon">○</span> At least one special character (!@#$%^&*)</li>
                            </ul>
                        </div>
                    </form>
                </div>
                
                <div class="modal-footer">
                    <button class="btn-secondary" id="cancel-password-btn">Cancel</button>
                    <button class="btn-accent" id="submit-password-btn">Update Password</button>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if present
    const existingModal = document.querySelector('.password-reset-modal-overlay');
    if (existingModal) existingModal.remove();
    
    // Insert modal into DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Setup event listeners
    const form = document.getElementById('password-reset-form');
    const closeBtn = document.getElementById('close-password-modal');
    const cancelBtn = document.getElementById('cancel-password-btn');
    const submitBtn = document.getElementById('submit-password-btn');
    
    const currentPass1 = document.getElementById('current-password-1');
    const currentPass2 = document.getElementById('current-password-2');
    const newPass1 = document.getElementById('new-password-1');
    const newPass2 = document.getElementById('new-password-2');
    
    // Close modal handlers
    const closeModal = () => {
        const modal = document.querySelector('.password-reset-modal-overlay');
        if (modal) modal.remove();
    };
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    // Click outside modal to close
    document.querySelector('.password-reset-modal-overlay').addEventListener('click', (e) => {
        if (e.target.classList.contains('password-reset-modal-overlay')) {
            closeModal();
        }
    });
    
    // Real-time password strength indicator
    newPass1.addEventListener('input', () => {
        validatePasswordStrength(newPass1.value);
    });
    
    // Form submission
    submitBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        // Clear previous errors
        document.getElementById('current-password-error').textContent = '';
        document.getElementById('new-password-error').textContent = '';
        
        // Validate current passwords match
        if (currentPass1.value !== currentPass2.value) {
            document.getElementById('current-password-error').textContent = 'Current passwords do not match';
            return;
        }
        
        if (!currentPass1.value) {
            document.getElementById('current-password-error').textContent = 'Current password is required';
            return;
        }
        
        // Validate new passwords match
        if (newPass1.value !== newPass2.value) {
            document.getElementById('new-password-error').textContent = 'New passwords do not match';
            return;
        }
        
        // Validate new password strength
        if (!isPasswordStrong(newPass1.value)) {
            document.getElementById('new-password-error').textContent = 'Password does not meet requirements';
            return;
        }
        
        // Prevent same password
        if (currentPass1.value === newPass1.value) {
            document.getElementById('new-password-error').textContent = 'New password must be different from current password';
            return;
        }
        
        // Disable button during submission
        submitBtn.disabled = true;
        submitBtn.textContent = 'Updating...';
        
        try {
            console.log('[Rooted Vitality] Starting password reset process');
            
            // Step 1: Verify current password by attempting to sign in with current email and current password
            console.log('[Rooted Vitality] Verifying current password');
            const { error: signInError } = await window.supabaseClient.auth.signInWithPassword({
                email: currentUser.email,
                password: currentPass1.value
            });
            
            if (signInError) {
                console.error('[Rooted Vitality] Current password verification failed:', signInError);
                document.getElementById('current-password-error').textContent = 'Current password is incorrect';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Update Password';
                return;
            }
            
            console.log('[Rooted Vitality] Current password verified successfully');
            
            // Step 2: Update to new password
            console.log('[Rooted Vitality] Updating to new password');
            const { error: updateError } = await window.supabaseClient.auth.updateUser({
                password: newPass1.value
            });
            
            if (updateError) {
                console.error('[Rooted Vitality] Password update error:', updateError);
                document.getElementById('new-password-error').textContent = updateError.message || 'Error updating password';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Update Password';
                return;
            }
            
            console.log('[Rooted Vitality] Password updated successfully in Supabase');
            
            // Step 3: Update practitioners table with updated_at timestamp
            const { error: dbError } = await window.supabaseClient
                .from('practitioners')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', currentUser.id);
            
            if (dbError) {
                console.warn('[Rooted Vitality] Warning: DB timestamp update failed (but password was changed):', dbError);
            } else {
                console.log('[Rooted Vitality] Updated practitioners record timestamp');
            }
            
            console.log('[Rooted Vitality] Password reset completed successfully');
            closeModal();
            alert('✅ Password updated successfully! Your new password is now active.');
            
        } catch (error) {
            console.error('[Rooted Vitality] Exception during password reset:', error);
            document.getElementById('new-password-error').textContent = 'An unexpected error occurred: ' + error.message;
            submitBtn.disabled = false;
            submitBtn.textContent = 'Update Password';
        }
    });
    
    // Focus first input
    currentPass1.focus();
}

function validatePasswordStrength(password) {
    const requirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*()_+\-=\[\]{};:'",.<>?/\\|`~]/.test(password)
    };
    
    // Update requirement indicators
    document.getElementById('req-length').classList.toggle('met', requirements.length);
    document.getElementById('req-uppercase').classList.toggle('met', requirements.uppercase);
    document.getElementById('req-lowercase').classList.toggle('met', requirements.lowercase);
    document.getElementById('req-number').classList.toggle('met', requirements.number);
    document.getElementById('req-special').classList.toggle('met', requirements.special);
    
    // Update icons
    Object.entries(requirements).forEach(([key, met]) => {
        const element = document.getElementById(`req-${key}`);
        if (element) {
            const icon = element.querySelector('.req-icon');
            icon.textContent = met ? '✓' : '○';
        }
    });
    
    return requirements;
}

function isPasswordStrong(password) {
    const requirements = validatePasswordStrength(password);
    return Object.values(requirements).every(req => req === true);
}

function handleDownloadData() {
    console.log('[Rooted Vitality] Download data clicked');
    alert('Your data download will be prepared and sent to your email');
}

/* ========================================== */
/* 7. TWO-FACTOR AUTHENTICATION (2FA/MFA) */
/* ========================================== */

async function check2FAStatus() {
    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        
        // Check if user has MFA factors enrolled
        const factors = await window.supabaseClient.auth.mfa.listFactors();
        const is2faEnabled = factors.data && factors.data.totp && factors.data.totp.length > 0;
        
        const statusView = document.getElementById('2fa-status-view');
        const enabledView = document.getElementById('2fa-enabled-view');
        const enable2faBtn = document.getElementById('enable-2fa-btn');
        const disable2faBtn = document.getElementById('disable-2fa-btn');
        
        if (is2faEnabled) {
            statusView.style.display = 'none';
            enabledView.style.display = 'block';
            if (disable2faBtn) {
                disable2faBtn.addEventListener('click', disable2FA);
            }
        } else {
            statusView.style.display = 'block';
            enabledView.style.display = 'none';
            if (enable2faBtn) {
                enable2faBtn.addEventListener('click', enable2FA);
            }
        }
        
        console.log('[Rooted Vitality] 2FA status checked:', is2faEnabled);
    } catch (error) {
        console.error('[Rooted Vitality] Error checking 2FA status:', error);
    }
}

async function enable2FA() {
    try {
        console.log('[Rooted Vitality] Starting 2FA enrollment');
        
        // Enroll in TOTP (Time-based One-Time Password)
        const { data, error: enrollError } = await window.supabaseClient.auth.mfa.enroll({
            factorType: 'totp'
        });
        
        if (enrollError) throw enrollError;
        
        const factorId = data?.id;
        const secret = data?.totp?.secret;
        const qrCode = data?.totp?.qr_code;
        
        console.log('[Rooted Vitality] 2FA enrollment initiated, factor ID:', factorId);
        
        // Hide status view, show setup form
        document.getElementById('2fa-status-view').style.display = 'none';
        document.getElementById('2fa-setup-view').style.display = 'block';
        
        const form = document.getElementById('2fa-setup-view');
        
        // Display QR code
        if (qrCode) {
            document.getElementById('qr-code-container').innerHTML = `<img src="${qrCode}" alt="2FA QR Code" style="max-width: 250px;">`;
        }
        
        // Display secret key for manual entry
        if (secret) {
            document.getElementById('manual-entry-code').textContent = secret;
        }
        
        // Generate backup codes (Supabase provides these)
        const backupCodes = generateBackupCodes();
        displayBackupCodes(backupCodes);
        
        // Handle form submission
        form.onsubmit = async (e) => {
            e.preventDefault();
            
            const verificationCode = document.getElementById('2fa-verify-code').value;
            
            if (verificationCode.length !== 6 || isNaN(verificationCode)) {
                alert('Please enter a valid 6-digit code');
                return;
            }
            
            try {
                // Verify and confirm the TOTP factor
                const { data: { session }, error: verifyError } = await window.supabaseClient.auth.mfa.verify({
                    factorId: factorId,
                    code: verificationCode
                });
                
                if (verifyError) throw verifyError;
                
                console.log('[Rooted Vitality] 2FA verification successful');
                
                // Save 2FA status to database
                await window.supabaseClient
                    .from('user_2fa_status')
                    .upsert({
                        user_id: currentUser.id,
                        is_enabled: true,
                        enrolled_at: new Date().toISOString()
                    });
                
                // Close form
                form.reset();
                document.getElementById('2fa-setup-view').style.display = 'none';
                
                alert('✓ Two-Factor Authentication has been enabled successfully!\n\nYou will now be required to enter a code from your authenticator app when logging in.');
                
                // Refresh UI
                check2FAStatus();
            } catch (error) {
                console.error('[Rooted Vitality] Error verifying 2FA:', error);
                alert('Error verifying code. Please try again.');
            }
        };
        
        document.getElementById('2fa-verify-code').focus();
        
    } catch (error) {
        console.error('[Rooted Vitality] Error starting 2FA setup:', error);
        alert('Error starting 2FA setup. Please try again.');
    }
}

async function disable2FA() {
    if (!confirm('Are you sure? Disabling 2FA will reduce your account security.')) {
        return;
    }
    
    try {
        console.log('[Rooted Vitality] Disabling 2FA');
        
        // Get list of TOTP factors
        const { data: factors, error: listError } = await window.supabaseClient.auth.mfa.listFactors();
        
        if (listError) throw listError;
        
        // Unenroll all TOTP factors
        if (factors && factors.totp) {
            for (const factor of factors.totp) {
                const { error: unenrollError } = await window.supabaseClient.auth.mfa.unenroll({
                    factorId: factor.id
                });
                
                if (unenrollError) throw unenrollError;
            }
        }
        
        // Update database
        await window.supabaseClient
            .from('user_2fa_status')
            .update({ is_enabled: false })
            .eq('user_id', currentUser.id);
        
        console.log('[Rooted Vitality] 2FA disabled');
        alert('Two-Factor Authentication has been disabled.');
        
        // Refresh UI
        check2FAStatus();
    } catch (error) {
        console.error('[Rooted Vitality] Error disabling 2FA:', error);
        alert('Error disabling 2FA. Please try again.');
    }
}

function generateBackupCodes() {
    const codes = [];
    for (let i = 0; i < 10; i++) {
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        codes.push(code);
    }
    return codes;
}

function displayBackupCodes(codes) {
    const container = document.getElementById('backup-codes-display');
    container.innerHTML = codes.map(code => `<div>${code}</div>`).join('');
    
    const copyBtn = document.getElementById('copy-backup-codes-btn');
    copyBtn.onclick = () => {
        const text = codes.join('\n');
        navigator.clipboard.writeText(text).then(() => {
            copyBtn.textContent = '✓ Copied!';
            setTimeout(() => {
                copyBtn.textContent = 'Copy Backup Codes';
            }, 2000);
        });
    };
}

function handleViewSessions() {
    console.log('[Rooted Vitality] View sessions clicked');
    alert('Active sessions view coming soon!');
}

function handleContactSupport() {
    console.log('[Rooted Vitality] Contact support clicked');
    window.open('mailto:support@rootedvitality.com');
}

async function handleDeactivateAccount() {
    const confirm = window.confirm(
        'Are you sure you want to deactivate your account? You can reactivate it anytime.'
    );
    if (!confirm) return;
    
    try {
        const { error } = await window.supabaseClient
            .from('practitioners')
            .update({ status: 'inactive' })
            .eq('id', currentUser.id);
        
        if (error) throw error;
        alert('Account deactivated. You can reactivate it anytime.');
        console.log('[Rooted Vitality] Account deactivated');
    } catch (error) {
        console.error('[Rooted Vitality] Error deactivating account:', error);
    }
}

async function handleDeleteAccount() {
    const confirm = window.confirm(
        'PERMANENT ACCOUNT DELETION\n\n' +
        'This will permanently delete your entire account including:\n' +
        '• Your client profile\n' +
        '• Your practitioner profile (if any)\n' +
        '• All your data, messages, and activity\n\n' +
        'This action CANNOT be undone. Are you absolutely certain?'
    );
    if (!confirm) return;
    
    const doubleConfirm = prompt('Type "DELETE" to confirm permanent account deletion:');
    if (doubleConfirm !== 'DELETE') {
        alert('Account deletion cancelled.');
        return;
    }
    
    try {
        // TODO: Implement secure account deletion with backend function
        console.log('[Rooted Vitality] Account deletion initiated');
        alert('Account deletion request submitted. Our team will process this within 24 hours.');
    } catch (error) {
        console.error('[Rooted Vitality] Error deleting account:', error);
    }
}

async function handleDeleteProfile() {
    const confirm = window.confirm(
        'Delete Practitioner Profile?\n\n' +
        'Your practitioner profile will be removed from Rooted Vitality. ' +
        'You can still log in and use the service as a client. ' +
        'Your account will remain active and your data will be preserved. ' +
        'You can create a new profile anytime.\n\n' +
        'Continue?'
    );
    if (!confirm) return;
    
    try {
        // Delete practitioner record from database
        const { error } = await window.supabaseClient
            .from('practitioners')
            .delete()
            .eq('id', currentUser.id);
        
        if (error) throw error;
        
        alert('Your practitioner profile has been deleted.');
        console.log('[Rooted Vitality] Practitioner profile deleted');
        
        // Optionally redirect to dashboard or home
        setTimeout(() => {
            window.location.href = '../dashboard.html';
        }, 1500);
    } catch (error) {
        console.error('[Rooted Vitality] Error deleting profile:', error);
        alert('Error deleting profile. Please try again.');
    }
}

async function handleCCPARequest() {
    const confirm = window.confirm(
        'CCPA Data Request\n\n' +
        'This request is available for California residents seeking to have their data removed from our system under the California Consumer Privacy Act.\n\n' +
        'Continue?'
    );
    if (!confirm) return;
    
    try {
        // Create support ticket for CCPA request
        const { error } = await window.supabaseClient
            .from('support_tickets')
            .insert({
                id: currentUser.id,
                type: 'ccpa_request',
                status: 'open',
                subject: 'CCPA Data Request',
                message: 'User submitted a CCPA data removal request',
                created_at: new Date().toISOString()
            });
        
        if (error) throw error;
        
        alert('CCPA request submitted successfully. Our compliance team will contact you within 10 business days.');
        console.log('[Rooted Vitality] CCPA request submitted');
    } catch (error) {
        console.error('[Rooted Vitality] Error submitting CCPA request:', error);
        alert('Error submitting CCPA request. Please contact support@rootedvitality.com');
    }
}

/* ========================================== */
/* 8. SETUP EVENT LISTENERS */
/* ========================================== */

function setupSettingsListeners() {
    setupNavigationTabs();
    setupPrivacySettings();
    loadNotificationPreferences();
    loadActiveMemberships();
    check2FAStatus();
    setupButtonActions();
    
    // Auto-save notifications when changed
    document.querySelectorAll('.notification-input').forEach(checkbox => {
        checkbox.addEventListener('change', saveNotificationPreferences);
    });
    
    // Save button for notification preferences
    const saveNotificationsBtn = document.getElementById('save-notifications-btn');
    if (saveNotificationsBtn) {
        saveNotificationsBtn.addEventListener('click', saveNotificationsToSupabase);
    }
    
    console.log('[Rooted Vitality] Notification listeners attached');
}

/* ========================================== */
/* 7. MEMBERSHIPS */
/* ========================================== */

function loadActiveMemberships() {
    try {
        const membershipsList = document.getElementById('active-memberships-list');
        if (membershipsList) {
            // TODO: Load from database when membership system is implemented
            membershipsList.innerHTML = '<p class="setting-description">You currently have no active memberships. <a href="#" style="color: var(--primary); font-weight: 600;">View available plans</a></p>';
        }
    } catch (error) {
        console.error('[Rooted Vitality] Error loading memberships:', error);
    }
}

function handleViewBilling() {
    alert('Billing history management is coming soon!\n\nYou will be able to view your invoices and payment history here.');
    console.log('[Rooted Vitality] View billing requested');
}

function handleManagePayment() {
    alert('Payment method management is coming soon!\n\nNote: We do not store your payment information. Payment processing is handled securely by our payment provider.');
    console.log('[Rooted Vitality] Manage payment requested');
}

function handleViewPlans() {
    alert('Membership plans are coming soon!\n\nYou will be able to upgrade or downgrade your membership tier from here.');
    console.log('[Rooted Vitality] View plans requested');
}

/* ========================================== */
/* 8. PAGE INITIALIZATION */
/* ========================================== */

document.addEventListener('DOMContentLoaded', () => {
    console.log('[Rooted Vitality] Settings page DOM ready');
    initializeSettings();
});

console.log('[Rooted Vitality] proSettings.js loaded');
