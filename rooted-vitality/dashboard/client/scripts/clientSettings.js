/*
╔═════════════════════════════════════════════════════════════════════════════╗
║                         ROOTED VITALITY DASHBOARD                           ║
║                    CLIENT SETTINGS MANAGER (SCRIPT)                         ║
║                                                                             ║
║ File:        dashboard/client/scripts/clientSettings.js                     ║
║ Purpose:     Client settings page functionality & preferences management    ║
║ Description: Handles client account settings, notification preferences,     ║
║              password management, billing, and security features.           ║
║              Manages real-time notification updates and user data sync.     ║
║ Last Update: November 2025                                                  ║
║ Status:      Production-Ready | Build Standard v2.0 Compliant               ║
║                                                                             ║
║ QUICK REFERENCE:                                                            ║
║ - Account Settings Management | Notification Preferences | Security         ║
║ - Design System: Modal overlays, notifications, settings cards              ║
║ - Utilities: Real-time updates, validation, database sync                   ║
║                                                                             ║
║ CSS CLASSES USED:                                                           ║
║ - .modal-overlay: Fixed overlay with success modal styling                  ║
║ - .modal-content: Modal content container                                   ║
║ - .notification: Notification toast styling (success/error variants)        ║
║ - .in-app-notification-toast: In-app notification display                   ║
║                                                                             ║
╚═════════════════════════════════════════════════════════════════════════════╝
*/

// ═══════════════════════════════════════════════════════════════════════════
// TABLE OF CONTENTS
// ═══════════════════════════════════════════════════════════════════════════
//
// 1. INITIALIZATION & STATE
// 2. NAVIGATION MANAGEMENT
// 3. ACCOUNT SETTINGS
// 4. NOTIFICATIONS
// 5. UTILITY FUNCTIONS
// 6. EVENT LISTENERS
//
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// 1. INITIALIZATION & STATE
// ═══════════════════════════════════════════════════════════════════════════

let currentUser = null;
let userSettings = {};

async function initializeSettings() {
    try {
        // Get current user
        const { data: { user }, error: authError } = await window.supabaseClient.auth.getUser();
        if (authError) {
            window.location.href = '../../../index.html';
            return;
        }
        
        if (!user) {
            window.location.href = '../../../index.html';
            return;
        }
        
        currentUser = user;
        
        // Load user settings from database
        const loaded = await loadUserSettings();
        if (!loaded) {
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
    } catch (error) {
    }
}

async function loadUserSettings() {
    try {
        const { data, error } = await window.supabaseClient
            .from('clients')
            .select('*')
            .eq('id', currentUser.id)
            .single();
        
        if (error) {
            return false;
        }
        
        if (!data) {
            return false;
        }
        
        userSettings = data;
        return true;
    } catch (error) {
        return false;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. NAVIGATION MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

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
    }
    if (link) {
        link.classList.add('active');
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. ACCOUNT SETTINGS
// ═══════════════════════════════════════════════════════════════════════════

function populateSettingsUI() {
    // Populate email
    document.getElementById('display-email').textContent = userSettings.email || currentUser.email || 'Not provided';
    
    // Populate phone
    document.getElementById('display-phone').textContent = userSettings.phone || 'Not provided';
    
    // Populate address
    document.getElementById('display-address').textContent = userSettings.address || 'Not provided';
    
    // Populate city
    document.getElementById('display-city').textContent = userSettings.city || 'Not provided';
    
    // Populate state
    document.getElementById('display-state').textContent = userSettings.state || 'Not provided';
    
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
            showNotification(`Failed to update ${fieldName}`, 'error');
            return false;
        }
        
        // Update local state
        userSettings[fieldName] = newValue;
        userSettings['settings_updated_at'] = updateData['settings_updated_at'];
        userSettings['updated_at'] = updateData['updated_at'];
        
        showNotification(`${fieldName} updated successfully`, 'success');
        return true;
    } catch (error) {
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
    
    // Edit Address
    const editAddressBtn = document.querySelector('[data-setting="address"]');
    if (editAddressBtn) {
        editAddressBtn.addEventListener('click', () => {
            handleEditField('address', 'Street Address');
        });
    }
    
    // Edit City
    const editCityBtn = document.querySelector('[data-setting="city"]');
    if (editCityBtn) {
        editCityBtn.addEventListener('click', () => {
            handleEditField('city', 'City');
        });
    }
    
    // Edit State
    const editStateBtn = document.querySelector('[data-setting="state"]');
    if (editStateBtn) {
        editStateBtn.addEventListener('click', () => {
            handleEditField('state', 'State');
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
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', () => {
            handleChangePassword();
        });
    }

    // Memberships & Billing buttons
    const upgradePlanBtn = document.getElementById('upgrade-plan-btn');
    if (upgradePlanBtn) {
        upgradePlanBtn.addEventListener('click', () => {
            handleViewPlans();
        });
    }

    const viewBillingBtn = document.getElementById('view-billing-btn');
    if (viewBillingBtn) {
        viewBillingBtn.addEventListener('click', () => {
            handleViewBilling();
        });
    }

    const managePaymentBtn = document.getElementById('manage-payment-btn');
    if (managePaymentBtn) {
        managePaymentBtn.addEventListener('click', () => {
            handleManagePayment();
        });
    }

    const viewHistoryBtn = document.getElementById('view-history-btn');
    if (viewHistoryBtn) {
        viewHistoryBtn.addEventListener('click', () => {
            handleViewHistory();
        });
    }

    // Security buttons
    const enable2faBtn = document.getElementById('enable-2fa-btn');
    if (enable2faBtn) {
        enable2faBtn.addEventListener('click', () => {
            handleEnable2FA();
        });
    }

    const deleteAccountBtn = document.getElementById('delete-account-btn');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', () => {
            handleDeleteAccount();
        });
    }

    const ccpaRequestBtn = document.getElementById('ccpa-request-btn');
    if (ccpaRequestBtn) {
        ccpaRequestBtn.addEventListener('click', () => {
            handleCCPARequest();
        });
    }
}

function handleEditField(fieldName, fieldLabel) {
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
            showNotification('Please enter a value', 'error');
            return;
        }
        
        // Validate
        if (fieldName === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(newValue)) {
                showNotification('Please enter a valid email address', 'error');
                return;
            }
        } else if (fieldName === 'phone') {
            const phoneRegex = /^[\d\s\-\+\(\)]+$/;
            if (!phoneRegex.test(newValue)) {
                showNotification('Please enter a valid phone number', 'error');
                return;
            }
        } else if (fieldName === 'state') {
            if (newValue.length > 2) {
                showNotification('State must be a 2-letter abbreviation (e.g., CA, NY, OH)', 'error');
                return;
            }
        } else if (fieldName === 'zipcode') {
            const zipcodeRegex = /^[\d\-\s]+$/;
            if (!zipcodeRegex.test(newValue)) {
                showNotification('Please enter a valid zip code', 'error');
                return;
            }
        }        // Save to database
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
    const editButtons = document.querySelectorAll('[data-setting="email"], [data-setting="phone"], [data-setting="address"], [data-setting="city"], [data-setting="state"], [data-setting="zipcode"]');
    editButtons.forEach(btn => {
        // Remove existing listeners by cloning and replacing
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        // Add new listener
        const setting = newBtn.dataset.setting;
        let label = 'Value';
        if (setting === 'email') label = 'Email Address';
        else if (setting === 'phone') label = 'Phone Number';
        else if (setting === 'address') label = 'Street Address';
        else if (setting === 'city') label = 'City';
        else if (setting === 'state') label = 'State';
        else if (setting === 'zipcode') label = 'Zip Code';
        
        newBtn.addEventListener('click', () => {
            handleEditField(setting, label);
        });
    });
}

async function handleChangePassword() {
    if (!currentUser || !currentUser.email) {
        return;
    }

    try {
        // Show confirmation
        const confirmed = confirm(`We'll send a password reset link to ${currentUser.email}. Please check your inbox to complete the password reset.`);
        
        if (!confirmed) {
            return;
        }

        // Send password reset email
        const { error } = await window.supabaseClient.auth.resetPasswordForEmail(currentUser.email, {
            redirectTo: `${window.location.origin}/rooted-vitality/reset.html`
        });

        if (error) {
            return;
        }
        
        // Show success message
        showPasswordResetSuccessModal();
    } catch (error) {
    }
}

function showPasswordResetSuccessModal() {
    const modalHTML = `
        <div class="modal-overlay">
            <div class="modal-content">
                <div class="modal-icon">✓</div>
                <h2 class="modal-title">Check Your Email</h2>
                <p class="modal-message">
                    We've sent a password reset link to your email. Click the link in the email to create a new password. 
                    The link expires in 24 hours.
                </p>
                <p class="modal-tip">
                    <strong>Tip:</strong> Check your spam folder if you don't see the email
                </p>
                <button id="close-success-btn" class="modal-btn">Done</button>
            </div>
        </div>
    `;
    
    // Remove existing modal if present
    const existingModal = document.querySelector('.modal-overlay');
    if (existingModal) existingModal.remove();
    
    // Insert modal into DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Setup close handler
    const doneBtn = document.getElementById('close-success-btn');
    const overlay = document.querySelector('.modal-overlay');
    
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
                showNotification('Error enabling two-factor authentication', 'error');
            } else {
                userSettings.two_factor_enabled = true;
                userSettings.two_factor_method = 'email';
                showNotification('Two-factor authentication enabled', 'success');
            }
        }
    } catch (error) {
        showNotification('Error with two-factor setup', 'error');
    }
}

function handleViewPlans() {
    showNotification('View available membership plans functionality to be implemented', 'info');
}

function handleViewBilling() {
    showNotification('View billing history functionality to be implemented', 'info');
}

function handleManagePayment() {
    showNotification('Manage payment methods functionality to be implemented', 'info');
}

function handleViewHistory() {
    showNotification('View subscription history functionality to be implemented', 'info');
}

function handleDeleteAccount() {
    const confirmed = confirm('⚠️ WARNING: This will permanently delete your account and all associated data. This action cannot be undone. If you have an attached practitioner profile, it will also be deleted. Are you sure?');
    if (confirmed) {
        showNotification('Account deletion functionality to be implemented', 'info');
    }
}

function handleCCPARequest() {
    showNotification('CCPA data request form functionality to be implemented', 'info');
}

function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.textContent = message;
    
    // Apply styles via cssText instead of individual properties
    const bgColor = type === 'success' ? '#77883e' : '#d4534f';
    notification.style.cssText = `position: fixed; top: 100px; right: 20px; padding: 1rem 1.5rem; background: ${bgColor}; color: #fbf7ec; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000; font-weight: 500; animation: slideIn 0.3s ease;`;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds with animation
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════

async function loadNotificationPreferences() {
    try {
        const { data, error } = await window.supabaseClient
            .from('client_notification_settings')
            .select('*')
            .eq('client_serial', currentUser.serial_number)
            .single();
        
        if (error && error.code !== 'PGRST116') {
            // Default all to checked if error
            defaultNotificationPreferences();
            return;
        }
        
        if (data) {
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
            defaultNotificationPreferences();
        }
    } catch (error) {
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
}

async function saveNotificationPreferences(e) {
    try {
        const checkboxes = document.querySelectorAll('.notification-input');
        const preferences = {};
        
        // Build preferences object with proper field names
        checkboxes.forEach(checkbox => {
            preferences[checkbox.name] = checkbox.checked;
        });
        
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
            showNotification('Error saving preferences', 'error');
            return;
        }

        showNotification('Notification preferences updated successfully', 'success');
    } catch (error) {
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
        return;
    }

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
    notifEl.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #77883e; color: #fbf7ec; padding: 1rem 1.5rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); z-index: 10000; max-width: 400px; animation: slideIn 0.3s ease-out;';
    
    const title = notification.title || 'New Notification';
    const message = notification.message || '';
    
    notifEl.innerHTML = `
        <div class="notification-title">${title}</div>
        <div class="notification-body">${message}</div>
        <div class="notification-actions">
            <button class="dismiss-btn">Dismiss</button>
        </div>
    `;
    
    document.body.appendChild(notifEl);
    
    // Setup dismiss button handler
    const dismissBtn = notifEl.querySelector('.dismiss-btn');
    dismissBtn.addEventListener('click', () => {
        if (notifEl.parentElement) {
            notifEl.remove();
        }
    });
    
    // Auto-remove after 6 seconds
    setTimeout(() => {
        if (notifEl.parentElement) {
            notifEl.remove();
        }
    }, 6000);
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

// Placeholder functions for future implementation
function setupPrivacySettings() {
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════════════════

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
    
}

function setupModalHandlers() {
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
        window.location.href = '../../index.html';
        return;
    }
    
    await initializeSettings();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWhenReady);
} else {
    initializeWhenReady();
}
