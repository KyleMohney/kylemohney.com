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
            .from('clients')
            .select('*')
            .eq('user_id', currentUser.id)
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

function handleChangePassword() {
    console.log('[Rooted Vitality] Change password clicked');
    alert('Change password functionality to be implemented');
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

/* ========================================== */
/* 4. NOTIFICATIONS */
/* ========================================== */

async function loadNotificationPreferences() {
    try {
        const { data, error } = await window.supabaseClient
            .from('notification_settings')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('user_type', 'client')
            .single();
        
        if (error && error.code !== 'PGRST116') {
            console.error('[Rooted Vitality] Error loading notification settings:', error);
            return;
        }
        
        if (data) {
            console.log('[Rooted Vitality] Notification preferences loaded');
            // Apply saved preferences to checkboxes
            Object.keys(data).forEach(key => {
                const checkbox = document.querySelector(`[name="${key}"]`);
                if (checkbox && typeof data[key] === 'boolean') {
                    checkbox.checked = data[key];
                }
            });
        }
    } catch (error) {
        console.error('[Rooted Vitality] Exception loading notifications:', error);
    }
}

async function saveNotificationPreferences(e) {
    try {
        const checkboxes = document.querySelectorAll('.notification-input');
        const preferences = {};
        
        checkboxes.forEach(checkbox => {
            preferences[checkbox.name] = checkbox.checked;
        });
        
        console.log('[Rooted Vitality] Saving notification preferences:', preferences);
        
        const { error } = await window.supabaseClient
            .from('notification_settings')
            .upsert({
                user_id: currentUser.id,
                user_type: 'client',
                ...preferences,
                updated_at: new Date().toISOString()
            });
        
        if (error) {
            console.error('[Rooted Vitality] Error saving preferences:', error);
            alert('Error saving preferences');
        } else {
            console.log('[Rooted Vitality] Preferences saved successfully');
            alert('Notification preferences updated successfully');
        }
    } catch (error) {
        console.error('[Rooted Vitality] Exception saving preferences:', error);
    }
}

async function saveNotificationsToSupabase() {
    await saveNotificationPreferences();
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeSettings);
