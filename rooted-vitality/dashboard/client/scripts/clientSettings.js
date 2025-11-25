/* =====================================================
   ROOTED VITALITY, INC.
   File: clientSettings.js
   Purpose: Client settings page functionality
   Holistic Wellness · Modern Connection Platform
   rootedvitality.com | 2025
   ===================================================== */

console.log('[Rooted Vitality] clientSettings.js loading...');

/* TABLE OF CONTENTS
   1. INITIALIZATION & STATE
   2. NAVIGATION MANAGEMENT
   3. ACCOUNT SETTINGS
   4. NOTIFICATIONS
   5. UTILITY FUNCTIONS
   6. EVENT LISTENERS
*/

/* ========================================== */
/* 1. INITIALIZATION & STATE */
/* ========================================== */

let currentUser = null;
let userSettings = {};

async function initializeSettings() {
    try {
        console.log('[Rooted Vitality] Initializing client settings...');
        
        // Get current user
        const { data: { user }, error: authError } = await window.supabaseClient.auth.getUser();
        if (authError) {
            console.error('[Rooted Vitality] Auth error:', authError);
            window.location.href = '../../../index.html';
            return;
        }
        
        if (!user) {
            console.warn('[Rooted Vitality] No user found, redirecting to index');
            window.location.href = '../../../index.html';
            return;
        }
        
        currentUser = user;
        console.log('[Rooted Vitality] Current user:', user.email);
        
        // Load user settings from database
        const loaded = await loadUserSettings();
        if (!loaded) {
            console.error('[Rooted Vitality] No client profile found - user needs to create profile first');
            // Redirect to profile setup if no client record exists
            window.location.href = '/rooted-vitality/join-network.html?role=client&step=profile';
            return;
        }
        
        // Populate UI with user data
        populateSettingsUI();
        
        // Setup event listeners
        setupSettingsListeners();
        setupModalHandlers();
        
        // Setup real-time notification updates
        subscribeToNotificationUpdates();
        
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
            .from('clients')
            .select('*')
            .eq('id', currentUser.id)
            .single();
        
        if (error) {
            console.error('[Rooted Vitality] Database error loading settings:', error);
            return false;
        }
        
        if (!data) {
            console.warn('[Rooted Vitality] No client record found for user');
            return false;
        }
        
        userSettings = data;
        console.log('[Rooted Vitality] User settings loaded successfully:', {
            email: data.email,
            phone: data.phone,
            zipcode: data.zipcode || 'not set'
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
}

/* ========================================== */
/* 3. ACCOUNT SETTINGS */
/* ========================================== */

function populateSettingsUI() {
    // Populate email
    document.getElementById('display-email').textContent = userSettings.email || currentUser.email || 'Not provided';
    
    // Populate phone
    document.getElementById('display-phone').textContent = userSettings.phone || 'Not provided';
    
    // Populate zipcode
    document.getElementById('display-zipcode').textContent = userSettings.zipcode || 'Not provided';
    
    // Populate account standing
    const standingBadge = document.getElementById('account-standing-badge');
    const standingDesc = document.getElementById('account-standing-desc');
    
    if (userSettings.account_status === 'suspended') {
        standingBadge.textContent = 'Suspended';
        standingBadge.classList.add('inactive');
        standingDesc.textContent = 'Your account has been suspended. Please contact support.';
    } else {
        standingBadge.textContent = 'Active';
        standingBadge.classList.remove('inactive');
        standingDesc.textContent = 'Your account is in good standing';
    }
}

/**
 * Save a single field to database with validation
 * Updates client profile field and sets settings_updated_at timestamp
 * @param {string} fieldName - Field name to update (email, phone, zipcode, age, sex, etc.)
 * @param {*} newValue - New value for the field
 */
async function saveFieldToDatabase(fieldName, newValue) {
    try {
        console.log('[Rooted Vitality] Saving field to database:', fieldName, '=', newValue);
        
        // Build update object
        const updateData = {};
        updateData[fieldName] = newValue;
        updateData['settings_updated_at'] = new Date().toISOString();
        updateData['updated_at'] = new Date().toISOString();
        
        const { error } = await window.supabaseClient
            .from('clients')
            .update(updateData)
            .eq('id', currentUser.id);
        
        if (error) {
            console.error('[Rooted Vitality] Error saving field:', error);
            showNotification(`Failed to update ${fieldName}`, 'error');
            return false;
        }
        
        // Update local state
        userSettings[fieldName] = newValue;
        userSettings['settings_updated_at'] = updateData['settings_updated_at'];
        userSettings['updated_at'] = updateData['updated_at'];
        
        showNotification(`${fieldName} updated successfully`, 'success');
        console.log('[Rooted Vitality] Field saved successfully:', fieldName);
        return true;
    } catch (error) {
        console.error('[Rooted Vitality] Exception saving field:', error);
        showNotification('Error saving changes', 'error');
        return false;
    }
}

function setupButtonActions() {
    // Edit Email
    const editEmailBtn = document.querySelector('[data-setting="email"]');
    if (editEmailBtn) {
        editEmailBtn.addEventListener('click', () => {
            handleEditField('email', 'Email Address');
        });
    }
    
    // Edit Phone
    const editPhoneBtn = document.querySelector('[data-setting="phone"]');
    if (editPhoneBtn) {
        editPhoneBtn.addEventListener('click', () => {
            handleEditField('phone', 'Phone Number');
        });
    }
    
    // Edit Zipcode
    const editZipcodeBtn = document.querySelector('[data-setting="zipcode"]');
    if (editZipcodeBtn) {
        editZipcodeBtn.addEventListener('click', () => {
            handleEditField('zipcode', 'Zip Code');
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

    // Memberships & Billing buttons
    const upgradePlanBtn = document.getElementById('upgrade-plan-btn');
    if (upgradePlanBtn) {
        upgradePlanBtn.addEventListener('click', () => {
            console.log('[Rooted Vitality] View plans clicked');
            handleViewPlans();
        });
    }

    const viewBillingBtn = document.getElementById('view-billing-btn');
    if (viewBillingBtn) {
        viewBillingBtn.addEventListener('click', () => {
            console.log('[Rooted Vitality] View billing history clicked');
            handleViewBilling();
        });
    }

    const managePaymentBtn = document.getElementById('manage-payment-btn');
    if (managePaymentBtn) {
        managePaymentBtn.addEventListener('click', () => {
            console.log('[Rooted Vitality] Manage payment methods clicked');
            handleManagePayment();
        });
    }

    const viewHistoryBtn = document.getElementById('view-history-btn');
    if (viewHistoryBtn) {
        viewHistoryBtn.addEventListener('click', () => {
            console.log('[Rooted Vitality] View subscription history clicked');
            handleViewHistory();
        });
    }

    // Security buttons
    const enable2faBtn = document.getElementById('enable-2fa-btn');
    if (enable2faBtn) {
        enable2faBtn.addEventListener('click', () => {
            console.log('[Rooted Vitality] Enable 2FA clicked');
            handleEnable2FA();
        });
    }

    const deleteAccountBtn = document.getElementById('delete-account-btn');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', () => {
            console.log('[Rooted Vitality] Delete account clicked');
            handleDeleteAccount();
        });
    }

    const ccpaRequestBtn = document.getElementById('ccpa-request-btn');
    if (ccpaRequestBtn) {
        ccpaRequestBtn.addEventListener('click', () => {
            console.log('[Rooted Vitality] CCPA request clicked');
            handleCCPARequest();
        });
    }
}

function handleEditField(fieldName, fieldLabel) {
    console.log('[Rooted Vitality] Edit field clicked:', fieldName);
    
    const displayId = `display-${fieldName}`;
    const displayEl = document.getElementById(displayId);
    if (!displayEl) return;
    
    const currentValue = userSettings[fieldName] || '';
    const cardContent = displayEl.closest('.card-content');
    
    // Get the info-group div
    const infoGroup = cardContent.querySelector('.info-group');
    if (!infoGroup) return;
    
    // Create input and buttons
    const inputHTML = `
        <input type="text" id="edit-${fieldName}-input" value="${currentValue}" class="edit-inline-input">
        <div class="edit-inline-actions">
            <button class="btn-inline-save" data-field="${fieldName}">Save</button>
            <button class="btn-inline-cancel" data-field="${fieldName}">Cancel</button>
        </div>
    `;
    
    // Store original content
    const originalContent = infoGroup.innerHTML;
    
    // Replace content with input
    infoGroup.innerHTML = inputHTML;
    
    // Focus input
    const input = infoGroup.querySelector(`#edit-${fieldName}-input`);
    input.focus();
    input.select();
    
    // Save handler
    const saveBtn = infoGroup.querySelector('.btn-inline-save');
    saveBtn.addEventListener('click', async () => {
        const newValue = input.value.trim();
        
        if (!newValue) {
            alert('Please enter a value');
            return;
        }
        
        // Validate
        if (fieldName === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(newValue)) {
                alert('Please enter a valid email address');
                return;
            }
        } else if (fieldName === 'phone') {
            const phoneRegex = /^[\d\s\-\+\(\)]+$/;
            if (!phoneRegex.test(newValue)) {
                alert('Please enter a valid phone number');
                return;
            }
        } else if (fieldName === 'zipcode') {
            const zipcodeRegex = /^[\d\-\s]+$/;
            if (!zipcodeRegex.test(newValue)) {
                alert('Please enter a valid zip code');
                return;
            }
        }
        
        // Save to database
        await saveFieldToDatabase(fieldName, newValue);
        
        // Update display
        infoGroup.innerHTML = `<p class="info-value" id="display-${fieldName}">${newValue}</p>`;
        
        // Re-attach edit button listener
        setupEditListeners();
    });
    
    // Cancel handler
    const cancelBtn = infoGroup.querySelector('.btn-inline-cancel');
    cancelBtn.addEventListener('click', () => {
        infoGroup.innerHTML = originalContent;
        setupEditListeners();
    });
}

function setupEditListeners() {
    const editButtons = document.querySelectorAll('[data-setting="email"], [data-setting="phone"], [data-setting="zipcode"]');
    editButtons.forEach(btn => {
        // Remove existing listeners by cloning and replacing
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        // Add new listener
        const setting = newBtn.dataset.setting;
        let label = 'Value';
        if (setting === 'email') label = 'Email Address';
        else if (setting === 'phone') label = 'Phone Number';
        else if (setting === 'zipcode') label = 'Zip Code';
        
        newBtn.addEventListener('click', () => {
            handleEditField(setting, label);
        });
    });
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
        <div class="modal-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
            <div class="modal-content" style="background: #fbf7ec; border-radius: 12px; padding: 40px; max-width: 420px; width: 90%; box-shadow: 0 10px 40px rgba(0,0,0,0.15); text-align: center;">
                <div style="font-size: 48px; margin-bottom: 16px;">✓</div>
                <h2 style="font-size: 20px; color: #2e2b28; margin-bottom: 12px; font-weight: 600;">
                    Check Your Email
                </h2>
                <p style="font-size: 14px; color: #888; line-height: 1.6; margin-bottom: 16px;">
                    We've sent a password reset link to your email. Click the link in the email to create a new password. 
                    The link expires in 24 hours.
                </p>
                <p style="font-size: 13px; color: #aaa; margin-bottom: 24px;">
                    <strong>Tip:</strong> Check your spam folder if you don't see the email
                </p>
                <button id="close-success-btn" style="width: 100%; padding: 12px; background: #c4a57b; color: #fbf7ec; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">Done</button>
            </div>
        </div>
    `;
    
    // Remove existing modal if present
    const existingModal = document.querySelector('[style*="modal-overlay"]');
    if (existingModal) existingModal.remove();
    
    // Insert modal into DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Setup close handler
    const doneBtn = document.getElementById('close-success-btn');
    const overlay = document.querySelector('[style*="modal-overlay"]');
    
    const closeModal = () => {
        if (overlay) overlay.remove();
    };
    
    doneBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });
}

/**
 * Handle 2FA enable/disable
 */
async function handleEnable2FA() {
    console.log('[Rooted Vitality] Enable 2FA clicked');
    try {
        // For now, show alert - requires detailed 2FA setup implementation
        // In production: integrate with Supabase MFA or third-party service
        const confirmed = confirm('Enable two-factor authentication? (Implementation pending)');
        if (confirmed) {
            // Update two_factor_enabled and two_factor_method in database
            const { error } = await window.supabaseClient
                .from('clients')
                .update({
                    two_factor_enabled: true,
                    two_factor_method: 'email', // or 'sms', 'authenticator'
                    settings_updated_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', currentUser.id);
            
            if (error) {
                console.error('[Rooted Vitality] Error enabling 2FA:', error);
                showNotification('Error enabling two-factor authentication', 'error');
            } else {
                userSettings.two_factor_enabled = true;
                userSettings.two_factor_method = 'email';
                showNotification('Two-factor authentication enabled', 'success');
            }
        }
    } catch (error) {
        console.error('[Rooted Vitality] Exception enabling 2FA:', error);
        showNotification('Error with two-factor setup', 'error');
    }
}

function handleViewPlans() {
    console.log('[Rooted Vitality] View plans clicked');
    alert('View available membership plans functionality to be implemented');
}

function handleViewBilling() {
    console.log('[Rooted Vitality] View billing history clicked');
    alert('View billing history functionality to be implemented');
}

function handleManagePayment() {
    console.log('[Rooted Vitality] Manage payment methods clicked');
    alert('Manage payment methods functionality to be implemented');
}

function handleViewHistory() {
    console.log('[Rooted Vitality] View subscription history clicked');
    alert('View subscription history functionality to be implemented');
}

function handleEnable2FA() {
    console.log('[Rooted Vitality] Enable 2FA clicked');
    alert('Two-factor authentication setup functionality to be implemented');
}

function handleDeleteAccount() {
    console.log('[Rooted Vitality] Delete account clicked');
    const confirmed = confirm('⚠️ WARNING: This will permanently delete your account and all associated data. This action cannot be undone. If you have an attached practitioner profile, it will also be deleted. Are you sure?');
    if (confirmed) {
        alert('Account deletion functionality to be implemented');
    }
}

function handleCCPARequest() {
    console.log('[Rooted Vitality] CCPA request clicked');
    alert('CCPA data request form functionality to be implemented');
}

function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#77883e' : '#d4534f'};
        color: #fbf7ec;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-weight: 500;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/* ========================================== */
/* 4. NOTIFICATIONS */
/* ========================================== */

async function loadNotificationPreferences() {
    try {
        const { data, error } = await window.supabaseClient
            .from('client_notification_settings')
            .select('*')
            .eq('client_serial', currentUser.serial_number)
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
                'promotions_in_app', 'promotions_sms', 'promotions_email',
                'system_in_app', 'system_sms', 'system_email',
                'account_in_app', 'account_email', 'account_sms'
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
        'promotions_in_app', 'promotions_sms', 'promotions_email',
        'system_in_app', 'system_sms', 'system_email',
        'account_in_app', 'account_email', 'account_sms'
    ];
    
    notificationFields.forEach(field => {
        const checkbox = document.querySelector(`[name="${field}"]`);
        if (checkbox) {
            checkbox.checked = true;
        }
    });
    
    console.log('[Rooted Vitality] Default notification preferences applied (all checked)');
}

async function saveNotificationPreferences(e) {
    try {
        const checkboxes = document.querySelectorAll('.notification-input');
        const preferences = {};
        
        // Build preferences object with proper field names
        checkboxes.forEach(checkbox => {
            preferences[checkbox.name] = checkbox.checked;
        });
        
        console.log('[Rooted Vitality] Saving notification preferences:', preferences);
        
        // Ensure all fields are present with correct names
        const fullPreferences = {
            client_serial: userSettings.serial_number,
            messages_in_app: preferences['messages_in_app'] !== false,
            messages_sms: preferences['messages_sms'] !== false,
            messages_email: preferences['messages_email'] !== false,
            matches_in_app: preferences['matches_in_app'] !== false,
            matches_sms: preferences['matches_sms'] !== false,
            matches_email: preferences['matches_email'] !== false,
            promotions_in_app: preferences['promotions_in_app'] !== false,
            promotions_sms: preferences['promotions_sms'] !== false,
            promotions_email: preferences['promotions_email'] !== false,
            system_in_app: preferences['system_in_app'] !== false,
            system_sms: preferences['system_sms'] !== false,
            system_email: preferences['system_email'] !== false,
            account_in_app: preferences['account_in_app'] !== false,
            account_email: preferences['account_email'] !== false,
            account_sms: preferences['account_sms'] !== false,
            updated_at: new Date().toISOString()
        };
        
        // Save to client_notification_settings table
        const { error: notifError } = await window.supabaseClient
            .from('client_notification_settings')
            .upsert(fullPreferences, { onConflict: 'client_serial' });
        
        if (notifError) {
            console.error('[Rooted Vitality] Error saving preferences:', notifError);
            showNotification('Error saving preferences', 'error');
            return;
        }

        console.log('[Rooted Vitality] Preferences saved successfully');
        showNotification('Notification preferences updated successfully', 'success');
    } catch (error) {
        console.error('[Rooted Vitality] Exception saving preferences:', error);
        showNotification('Error saving preferences', 'error');
    }
}

async function saveNotificationsToSupabase() {
    await saveNotificationPreferences();
}

/**
 * Subscribe to real-time notification updates
 * Listens for new notifications from promotions and other sources
 */
function subscribeToNotificationUpdates() {
    if (!window.supabaseClient || !currentUser) {
        console.warn('[Rooted Vitality] Cannot subscribe to notifications - not ready');
        return;
    }

    console.log('[Rooted Vitality] Setting up real-time notification subscription for', currentUser.serial_number);

    // Subscribe to new notifications for this client
    const channel = window.supabaseClient.channel(
        `client-notifications-${currentUser.serial_number}`,
        {
            config: {
                broadcast: { self: true },
                presence: { key: currentUser.serial_number }
            }
        }
    );

    channel
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'client_notifications',
                filter: `client_serial=eq.${currentUser.serial_number}`
            },
            (payload) => {
                console.log('[Rooted Vitality] New notification received:', payload.new);
                
                const notification = payload.new;
                
                // Check if this type of notification is enabled in preferences
                if (shouldShowNotification(notification.type)) {
                    // Show visual notification
                    showInAppNotification(notification);
                    
                    // Update badge if available
                    if (window.updateNotificationBadge) {
                        window.updateNotificationBadge();
                    }
                }
            }
        )
        .subscribe();

    console.log('[Rooted Vitality] Real-time notification subscription active');
}

/**
 * Check if a notification type should be shown based on preferences
 * @param {string} notificationType - The type of notification (promotions, system, etc.)
 * @returns {boolean} True if notification should be shown
 */
function shouldShowNotification(notificationType) {
    const typeMap = {
        'promotions': 'promotions_in_app',
        'system': 'system_in_app',
        'messages': 'messages_in_app',
        'matches': 'matches_in_app',
        'match_response': 'matches_in_app'
    };

    const prefField = typeMap[notificationType] || 'system_in_app';
    const checkbox = document.querySelector(`[name="${prefField}"]`);
    
    return checkbox ? checkbox.checked : true;
}

/**
 * Show an in-app notification (temporary alert)
 * @param {Object} notification - Notification data
 */
function showInAppNotification(notification) {
    // Create notification element
    const notifEl = document.createElement('div');
    notifEl.className = 'in-app-notification-toast';
    notifEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #77883e;
        color: #fbf7ec;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        max-width: 400px;
        animation: slideIn 0.3s ease-out;
    `;
    
    const title = notification.title || 'New Notification';
    const message = notification.message || '';
    
    notifEl.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 0.5rem;">${title}</div>
        <div style="font-size: 0.9rem; opacity: 0.95;">${message}</div>
        <div style="margin-top: 1rem;">
            <button onclick="this.closest('.in-app-notification-toast').remove()" 
                    style="background: rgba(251, 247, 236, 0.2); color: #fbf7ec; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; font-weight: 500;">
                Dismiss
            </button>
        </div>
    `;
    
    document.body.appendChild(notifEl);
    
    // Auto-remove after 6 seconds
    setTimeout(() => {
        if (notifEl.parentElement) {
            notifEl.remove();
        }
    }, 6000);
}

/* ========================================== */
/* 5. UTILITY FUNCTIONS */
/* ========================================== */

// Placeholder functions for future implementation
function setupPrivacySettings() {
    console.log('[Rooted Vitality] Privacy settings setup');
}

/* ========================================== */
/* 6. SETUP EVENT LISTENERS */
/* ========================================== */

function setupSettingsListeners() {
    setupNavigationTabs();
    setupPrivacySettings();
    loadNotificationPreferences();
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

function setupModalHandlers() {
    console.log('[Rooted Vitality] Modal handlers setup');
}

// Initialize when DOM is ready and Supabase is loaded
async function initializeWhenReady() {
    // Wait for supabaseClient to be available
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max wait
    
    while (!window.supabaseClient && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (!window.supabaseClient) {
        console.error('[Rooted Vitality] Supabase client failed to load');
        window.location.href = '../../index.html';
        return;
    }
    
    console.log('[Rooted Vitality] Supabase client ready, initializing settings');
    await initializeSettings();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWhenReady);
} else {
    initializeWhenReady();
}
























































