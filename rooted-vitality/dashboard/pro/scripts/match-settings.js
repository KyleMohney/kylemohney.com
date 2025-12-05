/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: match-settings.js                                           ║
║  Purpose: Match Settings Dashboard - All JavaScript functionality  ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

TABLE OF CONTENTS
  1. Initialization & Setup
  2. Tab Navigation
  3. Matching Status Tab
  4. Service Categories Tab
  5. Availability & Hours Tab
  6. Browse Categories Modal

NOTE: Modal management (Preferences, Browse, Credential Gate, Confirmation) is in match-settings-modals.js
NOTE: Coverage Area Tab functionality is in match-settings-coverage.js
NOTE: Match Settings Manager (database operations) is in match-settings-manager.js

*/

/* ========================================== */
/* 1. INITIALIZATION & SETUP */
/* ========================================== */

/**
 * Populate state dropdown from external JSON data
 * Loads all 50 US states and populates the virtual/remote state select element
 */
async function populateStateDropdown() {
  try {
    const response = await fetch('/rooted-vitality/data/us-states.json');
    if (!response.ok) throw new Error(`Failed to load states data: ${response.status}`);
    
    const data = await response.json();
    const states = data.states || [];
    const stateNames = data.stateNames || {};
    
    const select = document.getElementById('virtualremote-state-select');
    if (!select) return;
    
    states.forEach(code => {
      const option = document.createElement('option');
      option.value = code;
      option.textContent = `${stateNames[code]} (${code})`;
      select.appendChild(option);
    });
  } catch (error) {
    console.warn('Could not populate state dropdown:', error);
    // Graceful degradation - dropdown just won't have options
  }
}

/**
 * NOTE: populateTimezoneSelect is called in initializeMatchSettingsPage
 * Function is in match-settings.js (lines follow below)
 * Called during initialization to populate timezone select element
 *
 * This function remains here as it's called early in the initialization chain
 */
function populateTimezoneSelect() {
  const timezoneData = [
    { group: 'US Eastern', options: [{ value: 'America/New_York', label: 'Eastern Time (ET) - New York' }] },
    { group: 'US Central', options: [{ value: 'America/Chicago', label: 'Central Time (CT) - Chicago' }] },
    { group: 'US Mountain', options: [{ value: 'America/Denver', label: 'Mountain Time (MT) - Denver' }] },
    { group: 'US Pacific', options: [{ value: 'America/Los_Angeles', label: 'Pacific Time (PT) - Los Angeles' }] },
    { group: 'US Alaska & Hawaii', options: [
      { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
      { value: 'Pacific/Honolulu', label: 'Hawaii-Aleutian Time (HST)' }
    ]},
    { group: 'Canada', options: [
      { value: 'America/Toronto', label: 'Eastern Time - Toronto' },
      { value: 'America/Vancouver', label: 'Pacific Time - Vancouver' }
    ]},
    { group: 'Europe', options: [
      { value: 'Europe/London', label: 'Greenwich Mean Time (GMT) - London' },
      { value: 'Europe/Paris', label: 'Central European Time (CET) - Paris' },
      { value: 'Europe/Berlin', label: 'Central European Time (CET) - Berlin' }
    ]},
    { group: 'Asia', options: [
      { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
      { value: 'Asia/Hong_Kong', label: 'Hong Kong Time (HKT)' },
      { value: 'Asia/Singapore', label: 'Singapore Time (SGT)' },
      { value: 'Asia/Bangkok', label: 'Indochina Time (ICT)' },
      { value: 'Asia/Kolkata', label: 'Indian Standard Time (IST)' },
      { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST)' }
    ]},
    { group: 'Australia', options: [
      { value: 'Australia/Sydney', label: 'Australian Eastern Time (AEDT/AEST)' },
      { value: 'Australia/Melbourne', label: 'Australian Eastern Time - Melbourne' },
      { value: 'Australia/Brisbane', label: 'Australian Eastern Time - Brisbane' },
      { value: 'Australia/Perth', label: 'Australian Western Time' }
    ]},
    { group: 'Other', options: [{ value: 'UTC', label: 'UTC / GMT (No Offset)' }] }
  ];

  const select = document.getElementById('timezone-select');
  if (!select) return;
  
  select.innerHTML = '<option value="">-- Select Your Timezone --</option>';
  timezoneData.forEach(group => {
    const optgroup = document.createElement('optgroup');
    optgroup.label = group.group;
    group.options.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      optgroup.appendChild(option);
    });
    select.appendChild(optgroup);
  });
}

/**
 * Populate availability table with day rows
 */
function populateAvailabilityTable() {
  const availabilityDays = [
    { day: 'Monday', value: 'Monday', isWeekend: false, checked: true },
    { day: 'Tuesday', value: 'Tuesday', isWeekend: false, checked: true },
    { day: 'Wednesday', value: 'Wednesday', isWeekend: false, checked: true },
    { day: 'Thursday', value: 'Thursday', isWeekend: false, checked: true },
    { day: 'Friday', value: 'Friday', isWeekend: false, checked: true },
    { day: 'Saturday', value: 'Saturday', isWeekend: true, checked: false },
    { day: 'Sunday', value: 'Sunday', isWeekend: true, checked: false }
  ];

  const tbody = document.getElementById('availability-table-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  availabilityDays.forEach(day => {
    const tr = document.createElement('tr');
    tr.className = 'day-row';
    tr.dataset.day = day.value.toLowerCase();
    
    const isDisabled = day.isWeekend ? 'disabled' : '';
    tr.innerHTML = `
      <td class="day-name">${day.day}</td>
      <td class="col-toggle">
        <label class="toggle-switch">
          <input type="checkbox" class="day-available" value="${day.value}" ${day.checked ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </label>
      </td>
      <td class="col-time">
        <input type="time" class="time-input time-open" value="09:00" ${isDisabled}>
      </td>
      <td class="col-time">
        <input type="time" class="time-input time-close" value="17:00" ${isDisabled}>
      </td>
      <td class="col-notes">
        <input type="text" class="notes-input" placeholder="e.g., Lunch 12-1pm" ${isDisabled}>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/**
 * Save availability settings from the UI to the database
 */
async function saveAvailabilitySettings() {
  try {
    // Get timezone from select
    const tzSelect = document.getElementById('timezone-select');
    const timezone = tzSelect?.value || 'America/Denver';
    
    // Collect availability data from table
    const schedule = {};
    const availabilityDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    availabilityDays.forEach(day => {
      const row = document.querySelector(`tr[data-day="${day}"]`);
      if (!row) return;
      
      const checkbox = row.querySelector('.day-available');
      const timeOpen = row.querySelector('.time-open');
      const timeClose = row.querySelector('.time-close');
      
      const available = checkbox?.checked || false;
      schedule[day] = {
        available: available,
        open: available && timeOpen?.value ? timeOpen.value : null,
        close: available && timeClose?.value ? timeClose.value : null,
        notes: null
      };
    });
    
    // Add timezone to schedule
    schedule.timezone = timezone;
    
    if (!window.matchSettingsManager) {
      showToast('Error: Settings manager not ready. Please refresh the page.', 'error');
      return;
    }
    
    // Update via manager
    await window.matchSettingsManager.updateAvailabilitySchedule(schedule);
    
    showToast('Availability schedule saved successfully!', 'success');
  } catch (error) {
    console.error('[Availability] Exception error:', error);
    showToast('An unexpected error occurred: ' + error.message, 'error');
  }
}

/**
 * Load availability settings from database into the UI
 */
async function loadAvailabilityIntoUI() {
  try {
    if (!window.matchSettingsManager) {
      return;
    }

    let schedule = window.matchSettingsManager.getAvailabilitySchedule();

    if (!schedule) {
      return;
    }

    // Handle both old format (flat) and new format (with week property)
    let weekData = schedule.week || schedule;

    // Load timezone if available
    if (schedule.timezone) {
      const tzSelect = document.getElementById('timezone-select');
      if (tzSelect) {
        tzSelect.value = schedule.timezone;
      }
    }

    const availabilityDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    availabilityDays.forEach(day => {
      const row = document.querySelector(`tr[data-day="${day}"]`);
      
      if (!row) return;

      const dayData = weekData[day];
      
      if (!dayData) return;

      const checkbox = row.querySelector('.day-available');
      const timeOpen = row.querySelector('.time-open');
      const timeClose = row.querySelector('.time-close');

      if (checkbox) {
        checkbox.checked = dayData.available || false;
        
        // Enable/disable time inputs based on availability
        if (timeOpen) timeOpen.disabled = !dayData.available;
        if (timeClose) timeClose.disabled = !dayData.available;
      }

      if (timeOpen && dayData.open) {
        timeOpen.value = dayData.open;
      }
      if (timeClose && dayData.close) {
        timeClose.value = dayData.close;
      }
    });
  } catch (error) {
    console.error('[Availability] Error loading schedule into UI:', error);
  }
}

/**
 * NOTE: showToast is also defined in match-settings-modals.js
 * Both versions can coexist - the modals.js version has better duration control
 * Keeping this simple version here for initialization-time calls before modals.js loads
 */
function showToast(message, type = 'success') {
  // Try the modals.js version first (better)
  if (typeof window.showToastFromModals === 'function') {
    return window.showToastFromModals(message, type);
  }
  
  // Fallback to simple version
  const toast = document.getElementById('toast');
  if (!toast) {
    console.warn('[Toast] Toast element not found');
    return;
  }
  
  toast.textContent = message;
  
  // Set correct CSS class names - use hyphenated format
  toast.className = `toast toast-${type} show`;
  
  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => {
      toast.className = 'toast';  // Reset to initial state
    }, 300);
  }, 3000);
}

/**
 * Initialize Match Settings Page
 */
// Global variables
let currentUser = null;
let currentPractitionerId = null;
let allCategories = [];
let activeCategories = [];
window.matchSettingsManager = null;

/**
 * Initialize the Match Settings page
 * Load practitioner data, initialize service manager, and populate UI
 */
async function initializeMatchSettingsPage() {
  try {
    // Mark this as practitioner view
    localStorage.setItem('active_view', 'practitioner');
    
    // Populate state dropdown immediately
    populateStateDropdown();
    
    // Populate timezone and availability table
    populateTimezoneSelect();
    populateAvailabilityTable();
    
    // Get current user
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    
    if (!user) {
      window.location.href = '/rooted-vitality/dashboard/client/pages/client-signup.html';
      return;
    }
    
    currentUser = user;
    
    // Load taxonomy data FIRST (before initializing match settings manager)
    await loadTaxonomy();
    
    // Get practitioner record to get practitioner ID
    const { data: practitioner, error: practitionerError } = await window.supabaseClient
      .from('practitioners')
      .select('id')
      .eq('id', user.id)
      .single();
    
    if (practitionerError || !practitioner) {
      console.error('[Match Settings] Error loading practitioner record:', practitionerError);
    } else {
      currentPractitionerId = practitioner.id;
      
      // Initialize Match Settings Manager (now that taxonomy is loaded)
      window.matchSettingsManager = new MatchSettingsManager(window.supabaseClient);
      await window.matchSettingsManager.initialize(currentPractitionerId);
      
      // Load settings into UI after manager is initialized
      await loadSettingsIntoUI();
    }
    
    // Load coverage settings
    loadCoverageSettings();
    
    // Load matching activation status
    loadMatchingStatus();
    
    // Render UI
    renderActiveCategories();
    
    // Setup event listeners
    setupEventListeners();
    setupModalListeners();
    setupCoverageMapListeners();
    
  } catch (error) {
    console.error('[Match Settings] Initialization error:', error);
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeMatchSettingsPage);
} else {
  initializeMatchSettingsPage();
}

/* ========================================== */
/* 2. TAB NAVIGATION */
/* ========================================== */

/**
 * Switch between panels (tabs)
 * @param {string} panelName - Name of the panel to show (matching, categories, coverage, availability)
 */
function switchPanel(panelName) {
  // Hide all panels
  document.querySelectorAll('.content-panel').forEach(panel => {
    panel.classList.remove('active');
  });

  // Remove active class from all nav items
  document.querySelectorAll('.nav-section-item').forEach(item => {
    item.classList.remove('active');
  });

  // Show selected panel
  const panel = document.getElementById(`panel-${panelName}`);
  if (panel) {
    panel.classList.add('active');
  }

  // Activate corresponding nav item
  event.target.classList.add('active');
}

/**
 * Load taxonomy/categories data from JSON file
 */
async function loadTaxonomy() {
  try {
    const response = await fetch('/rooted-vitality/data/practitioner-categories.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    allCategories = data.categories || [];
    if (allCategories.length === 0) {
      console.warn('[Match Settings] No categories loaded from taxonomy');
    }
  } catch (error) {
    console.error('[Match Settings] Error loading taxonomy:', error);
    showToast('Could not load categories. Please refresh.', 'error');
  }
}

/**
 * Load settings into UI from database via matchSettingsManager
 */
async function loadSettingsIntoUI() {
  if (!window.matchSettingsManager) {
    console.warn('[Match Settings] MatchSettingsManager not initialized');
    return;
  }

  try {
    // Get coverage settings
    const coverage = window.matchSettingsManager.getCoverageAreaSettings();

    // Load In-Office
    if (coverage.in_office.enabled) {
      const inofficeCheckbox = document.querySelector('#travel-in-person');
      if (inofficeCheckbox) {
        inofficeCheckbox.checked = true;
        const inofficeSettings = document.getElementById('inoffice-settings');
        if (inofficeSettings) {
          inofficeSettings.classList.add('active');
        }
      }

      // Check which option was used
      if (coverage.in_office.option_a.base_zip) {
        const modeA = document.querySelector('input[name="inoffice-mode"][value="mode-a"]');
        if (modeA) {
          modeA.checked = true;
          const baseZipInput = document.querySelector('#inoffice-base-zip');
          const radiusSlider = document.querySelector('#inoffice-radius-slider');
          if (baseZipInput) baseZipInput.value = coverage.in_office.option_a.base_zip;
          if (radiusSlider) radiusSlider.value = coverage.in_office.option_a.radius_miles;
        }
      }
    }

    // Load House Calls
    if (coverage.house_calls.enabled) {
      const housecallsCheckbox = document.querySelector('#travel-house-calls');
      if (housecallsCheckbox) {
        housecallsCheckbox.checked = true;
        const housecallsSettings = document.getElementById('housecalls-settings');
        if (housecallsSettings) {
          housecallsSettings.classList.add('active');
        }
      }

      if (coverage.house_calls.option_a.base_zip) {
        const modeA = document.querySelector('input[name="housecalls-mode"][value="mode-a"]');
        if (modeA) {
          modeA.checked = true;
          const baseZipInput = document.querySelector('#housecalls-base-zip');
          const radiusSlider = document.querySelector('#housecalls-radius-slider');
          if (baseZipInput) baseZipInput.value = coverage.house_calls.option_a.base_zip;
          if (radiusSlider) radiusSlider.value = coverage.house_calls.option_a.radius_miles;
        }
      }
    }

    // Load Virtual/Remote
    if (coverage.virtual_remote.enabled) {
      const virtualCheckbox = document.querySelector('#travel-virtual');
      if (virtualCheckbox) {
        virtualCheckbox.checked = true;
        const virtualSettings = document.getElementById('virtualremote-settings');
        if (virtualSettings) {
          virtualSettings.classList.add('active');
        }
      }

      if (coverage.virtual_remote.option_a.nationwide) {
        const modeA = document.querySelector('input[name="virtualremote-mode"][value="mode-a"]');
        if (modeA) {
          modeA.checked = true;
          const nationwideToggle = document.querySelector('#virtualremote-nationwide');
          if (nationwideToggle) {
            nationwideToggle.checked = true;
          }
        }
      }
    }

    // Get selected services and rebuild active categories
    const services = window.matchSettingsManager.getSelectedServices();
    const categoryMap = new Map();
    
    services.forEach(s => {
      const subcategoryName = s.subcategory_name || 'Unknown';
      const categoryName = s.category_name || 'Unknown';
      
      // Find which category in allCategories matches
      const categoryWithService = allCategories.find(cat => 
        cat.name === categoryName || 
        (cat.subcategories && cat.subcategories.includes(subcategoryName))
      );
      
      if (!categoryWithService) {
        return;
      }
      
      const categoryId = categoryWithService.id;
      
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          id: categoryId,
          name: categoryWithService.name,
          subcategories: [],
          active: false,
          price_per_service: null,
          serviceIds: [],
          requiresLicense: categoryWithService.requiresLicense,
          requiresCertification: categoryWithService.requiresCertification
        });
      }
      
      const category = categoryMap.get(categoryId);
      if (!category.subcategories.includes(subcategoryName)) {
        category.subcategories.push(subcategoryName);
      }
      if (!category.serviceIds.includes(s.id)) {
        category.serviceIds.push(s.id);
      }
      if (s.price_per_service) {
        category.price_per_service = s.price_per_service;
      }
      if (s.is_active === true) {
        category.active = true;
      }
    });
    
    activeCategories = Array.from(categoryMap.values());

    // Render the loaded categories in the UI
    renderActiveCategories();

    // Show save button if there are categories
    const saveBtn = document.getElementById('btn-save-categories');
    if (saveBtn && activeCategories.length > 0) {
      saveBtn.style.display = 'block';
    }

    // Load availability settings into UI
    await loadAvailabilityIntoUI();

  } catch (error) {
    console.error('[Match Settings] Error loading settings into UI:', error);
  }
}

/* ========================================== */
/* 3. MATCHING STATUS TAB */
/* ========================================== */

/**
 * Load matching status from database
 * Checks membership status and matching activation state
 */
async function loadMatchingStatus() {
  try {
    const { data: { user }, error: userError } = await window.supabaseClient.auth.getUser();
    if (userError || !user) {
      updateMatchingUI(false, false);
      return;
    }

    // Step 1: Check membership status
    let membershipData = null;
    let membershipError = null;
    
    // Try query with select * - order by created_at to get the LATEST membership
    const result1 = await window.supabaseClient
      .from('memberships')
      .select('*')
      .eq('practitioner_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);
    
    membershipData = result1.data;
    membershipError = result1.error;
    
    // Fallback: if no results, try without order clause
    if (!membershipData || membershipData.length === 0) {
      const result2 = await window.supabaseClient
        .from('memberships')
        .select('*')
        .eq('practitioner_id', user.id);
      
      membershipData = result2.data;
      membershipError = result2.error;
    }
    

    
    if (membershipError) {
      updateMatchingUI(false, false);
      return;
    }

    // Check LATEST membership status - use most recent record
    const latestMembership = membershipData && membershipData.length > 0 ? membershipData[0] : null;
    const hasActiveMembership = latestMembership && latestMembership.status === 'active';

    // Step 2: Load matching status from database
    const { data: practitionerData, error: practError } = await window.supabaseClient
      .from('practitioners')
      .select('matching_enabled, matching_paused')
      .eq('id', user.id)
      .single();
    
    if (practError) {
      updateMatchingUI(false, false);
      return;
    }

    let isActive = practitionerData?.matching_enabled || false;
    let isPaused = practitionerData?.matching_paused || false;

    // ENFORCEMENT: If membership is inactive, FORCE matching OFF
    if (!hasActiveMembership && isActive) {
      isActive = false;
      
      // Update database to turn matching off
      await window.supabaseClient
        .from('practitioners')
        .update({
          matching_enabled: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
    }

    // Step 3: Check for pause status
    const pauseUntil = localStorage.getItem('matchingPauseUntil');
    
    if (pauseUntil && isActive) {
      const pauseTime = new Date(pauseUntil);
      const now = new Date();
      
      if (now < pauseTime) {
        // Still paused
        updateMatchingUI(true, true, pauseTime);
        checkPauseExpiration(pauseTime);
        return;
      } else {
        // Pause time has passed, resume
        localStorage.removeItem('matchingPauseUntil');
        isPaused = false;
      }
    }

    updateMatchingUI(isActive, isPaused);
    
  } catch (error) {
    updateMatchingUI(false, false);
  }
}

/**
 * Update matching status UI based on activation and pause state
 * @param {boolean} isActive - Whether matching is active
 * @param {boolean} isPaused - Whether matching is paused
 * @param {Date} pauseUntilTime - Time when matching will resume
 */
function updateMatchingUI(isActive, isPaused, pauseUntilTime = null) {
  const toggle = document.getElementById('matching-activation-toggle');
  const statusText = document.getElementById('matching-status-text');
  const statusDetail = document.getElementById('matching-status-detail');
  const statusDisplay = document.querySelector('.matching-status-display');
  const pauseBtn = document.getElementById('btn-pause-matching');
  const resumeBtn = document.getElementById('btn-resume-matching');
  const pauseInfo = document.getElementById('pause-info-display');
  
  toggle.checked = isActive;
  
  if (isActive && isPaused) {
    statusText.textContent = 'Paused';
    statusDetail.textContent = 'Matching is temporarily paused';
    statusDisplay.classList.add('active');
    pauseBtn.classList.add('hidden');
    resumeBtn.classList.remove('hidden');
    pauseInfo.classList.add('visible');
    
    if (pauseUntilTime) {
      const formatted = pauseUntilTime.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        meridiem: 'short'
      });
      document.getElementById('pause-info-time').textContent = `Resumes: ${formatted}`;
    }
  } else if (isActive) {
    statusText.textContent = 'Active';
    statusDetail.textContent = 'Clients can send leads for your active categories';
    statusDisplay.classList.add('active');
    pauseBtn.classList.remove('hidden');
    resumeBtn.classList.add('hidden');
    pauseInfo.classList.remove('visible');
  } else {
    statusText.textContent = 'Inactive';
    statusDetail.textContent = 'No leads will be received until you activate matching';
    statusDisplay.classList.remove('active');
    pauseBtn.classList.add('hidden');
    resumeBtn.classList.add('hidden');
    pauseInfo.classList.remove('visible');
  }
}

/**
 * Save matching_enabled status to database
 * Checks membership status before enabling
 * @param {boolean} isEnabled - Whether to enable matching
 * @returns {Promise<boolean>} - Success status
 */
async function saveMatchingEnabledToDatabase(isEnabled) {
  try {
    const { data: { user }, error: userError } = await window.supabaseClient.auth.getUser();
    if (userError || !user) {
      showToast('Failed to verify user account.', 'error');
      return false;
    }

    // If enabling matching, check active membership via RPC function
    if (isEnabled) {
      
      // Get practitioner serial from stored data or query it
      let practitionerSerial = localStorage.getItem('practitionerSerial');
      
      if (!practitionerSerial) {
        // Query for serial number
        const { data: practData, error: practError } = await window.supabaseClient
          .from('practitioners')
          .select('serial_number')
          .eq('id', user.id)
          .single();
        
        if (practError || !practData) {
          showToast('Unable to verify your account. Please refresh and try again.', 'error');
          return false;
        }
        
        practitionerSerial = practData.serial_number;
      }
      
      // Call RPC function to check membership and enable matching
      const { data: canEnable, error: rpcError } = await window.supabaseClient.rpc('enable_matching', {
        p_practitioner_serial: practitionerSerial
      });
      
      if (rpcError) {
        showToast('Unable to verify membership. Please try again.', 'error');
        
        // Force toggle OFF
        const matchingToggle = document.getElementById('matching-activation-toggle');
        if (matchingToggle) {
          matchingToggle.checked = false;
        }
        return false;
      }
      
      if (!canEnable) {
        // Force toggle OFF immediately
        const matchingToggle = document.getElementById('matching-activation-toggle');
        if (matchingToggle) {
          matchingToggle.checked = false;
        }
        
        // Show custom modal
        showMembershipRequiredModal();
        return false;
      }
      
      return true;
    }

    // Call disable_matching RPC if disabling
    if (!isEnabled) {
      let practitionerSerial = localStorage.getItem('practitionerSerial');
      
      if (!practitionerSerial) {
        const { data: practData } = await window.supabaseClient
          .from('practitioners')
          .select('serial_number')
          .eq('id', user.id)
          .single();
        practitionerSerial = practData?.serial_number;
      }
      
      if (practitionerSerial) {
        const { data: disabledSuccess, error: disableError } = await window.supabaseClient.rpc('disable_matching', {
          p_practitioner_serial: practitionerSerial
        });
        
      }
    }
    
    const { error } = await window.supabaseClient
      .from('practitioners')
      .update({
        matching_enabled: isEnabled,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (error) {
      showToast('Failed to save matching status to database.', 'error');
      // Force toggle back to previous state
      const matchingToggle = document.getElementById('matching-activation-toggle');
      if (matchingToggle) {
        matchingToggle.checked = !isEnabled;
      }
      return false;
    }

    // Also update practitioner_match_settings table
    try {
      // Get practitioner serial number to update match settings
      const { data: practitionerData } = await window.supabaseClient
        .from('practitioners')
        .select('serial_number')
        .eq('id', user.id)
        .single();

      if (practitionerData?.serial_number) {
        const { error: matchSettingsError } = await window.supabaseClient
          .from('practitioner_match_settings')
          .update({
            matching_enabled: isEnabled,
            updated_at: new Date().toISOString()
          })
          .eq('practitioner_serial', practitionerData.serial_number);

      }
    } catch (matchSettingsErr) {
      // Match settings update failed
    }

    return true;
  } catch (error) {
    showToast('An error occurred while saving.', 'error');
    // Force toggle back to previous state
    const matchingToggle = document.getElementById('matching-activation-toggle');
    if (matchingToggle) {
      matchingToggle.checked = !isEnabled;
    }
    return false;
  }
}

/**
 * Save matching_paused status to database
 * @param {boolean} isPaused - Whether matching is paused
 * @param {Date} pauseUntilDate - Date/time when to resume
 */
async function saveMatchingPausedToDatabase(isPaused, pauseUntilDate = null) {
  try {
    const { data: { user }, error: userError } = await window.supabaseClient.auth.getUser();
    if (userError || !user) {
      return;
    }

    const updateData = {
      matching_paused: isPaused,
      updated_at: new Date().toISOString()
    };

    // If pausing with a date, we could store it in a JSON field or separate column
    // For now, just saving the paused flag
    if (isPaused && pauseUntilDate) {
      // pauseUntilDate handling here if needed
    }

    const { error } = await window.supabaseClient
      .from('practitioners')
      .update(updateData)
      .eq('id', user.id);

    if (error) {
      showToast('Failed to save pause status to database.', 'error');
      return;
    }

  } catch (error) {
    showToast('An error occurred while saving.', 'error');
  }
}

/**
 * Toggle matching activation
 * Validates active categories before enabling
 */
function toggleMatchingActivation() {
  const toggle = document.getElementById('matching-activation-toggle');
  const isNowActive = toggle.checked;
  
  // Check if there are any active categories (defensive check for undefined)
  if (typeof activeCategories === 'undefined') {
    toggle.checked = false;
    showToast('Please wait for page to fully load before enabling matching.', 'error');
    return;
  }
  
  const hasActiveCategories = activeCategories.some(cat => cat.active !== false);
  
  if (isNowActive && !hasActiveCategories) {
    toggle.checked = false;
    showToast('You must have at least one active category to enable matching.', 'error');
    return;
  }
  
  // Save to database (this will handle membership check and force OFF if needed)
  saveMatchingEnabledToDatabase(isNowActive).then(success => {
    if (success) {
      // Only update UI if database save succeeded
      localStorage.setItem('matchingActive', isNowActive ? 'true' : 'false');
      localStorage.removeItem('matchingPauseUntil');
      updateMatchingUI(isNowActive, false);
      
      const status = isNowActive ? 'activated' : 'deactivated';
      showToast(`Matching ${status}.`, 'success');
    }
  });
}

/**
 * Toggle pause form visibility
 */
function togglePauseForm() {
  const form = document.getElementById('pause-form-container');
  const isPauseVisible = form.classList.contains('active');
  
  if (!isPauseVisible) {
    // Set min date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('pause-until-date').min = today;
    
    // Pre-fill with tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('pause-until-date').value = tomorrow.toISOString().split('T')[0];
  }
  
  form.classList.toggle('active');
}

/**
 * Confirm pause matching
 * Validates date/time selection and updates matching status
 */
function confirmPauseMatching() {
  const dateInput = document.getElementById('pause-until-date').value;
  const timeInput = document.getElementById('pause-until-time').value;
  
  if (!dateInput || !timeInput) {
    showToast('Please select both a date and time.', 'error');
    return;
  }
  
  const pauseDateTime = new Date(`${dateInput}T${timeInput}`);
  const now = new Date();
  
  if (pauseDateTime <= now) {
    showToast('Please select a future date and time.', 'error');
    return;
  }
  
  // Save pause settings to database
  saveMatchingPausedToDatabase(true, pauseDateTime);
  
  // Save pause settings to localStorage
  localStorage.setItem('matchingPauseUntil', pauseDateTime.toISOString());
  localStorage.setItem('matchingLastUpdate', new Date().toISOString());
  
  // Hide pause form
  document.getElementById('pause-form-container').classList.remove('active');
  
  // Update UI
  updateMatchingUI(true, true, pauseDateTime);
  
  showToast('Matching paused. It will resume automatically.', 'success');
}

/**
 * Resume matching immediately
 */
function resumeMatching() {
  localStorage.removeItem('matchingPauseUntil');
  updateMatchingUI(true, false);
  showToast('Matching resumed.', 'success');
}

/**
 * Check if pause time has expired and auto-resume if needed
 * @param {Date} pauseUntilTime - Time when pause expires
 */
function checkPauseExpiration(pauseUntilTime) {
  const now = new Date();
  const timeUntilResume = pauseUntilTime - now;
  
  if (timeUntilResume > 0) {
    setTimeout(() => {
      localStorage.removeItem('matchingPauseUntil');
      updateMatchingUI(true, false);
    }, timeUntilResume);
  }
}

/* ========================================== */
/* 4. SERVICE CATEGORIES TAB */
/* ========================================== */

/**
 * Load active categories from localStorage
 */
function loadActiveCategories() {
  const saved = localStorage.getItem('matchPreferences');
  if (saved) {
    try {
      activeCategories = JSON.parse(saved);
    } catch (error) {
      activeCategories = [];
    }
  }
}

/**
 * Save active categories to localStorage
 */
function saveActiveCategories() {
  localStorage.setItem('matchPreferences', JSON.stringify(activeCategories));
}

/**
 * Render active categories in the UI
 */
function renderActiveCategories() {
  const container = document.getElementById('active-categories-list');
  const saveBtn = document.getElementById('btn-save-categories');
  
  if (activeCategories.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No categories selected yet. Search and add one above.</p></div>';
    if (saveBtn) {
      saveBtn.classList.add('hidden');
    }
    return;
  }
  
  container.innerHTML = activeCategories.map(cat => createCategoryItemHTML(cat)).join('');
  
  // Show save button if there are categories
  if (saveBtn && activeCategories.length > 0) {
    saveBtn.classList.remove('hidden');
  }
}

/**
 * Create HTML for a single category item
 * @param {Object} cat - Category object
 * @returns {string} HTML string for the category item
 */
function createCategoryItemHTML(cat) {
  const isActive = cat.active !== false;
  const statusLabel = isActive ? 'Active' : 'Inactive';
  const statusClass = isActive ? 'active' : 'inactive';
  return `<div class="category-item ${statusClass}" data-category-id="${cat.id}"><div class="category-item-top"><div class="category-item-left"><p class="category-item-name">${cat.name}</p><p class="category-item-meta">${cat.subcategories ? cat.subcategories.length : 0} preferences selected</p></div><div class="category-item-actions"><div class="category-status-display"><label class="toggle-switch" title="Click to ${isActive ? 'deactivate' : 'activate'} this category"><input type="checkbox" class="category-toggle" data-category-id="${cat.id}" ${isActive ? 'checked' : ''}><span class="toggle-slider"></span></label><span class="category-status-label">${statusLabel}</span></div><button class="category-btn category-preferences-btn" data-category-id="${cat.id}" title="Select specific services for this category">Preferences</button><button class="category-btn category-btn-remove category-remove-btn" data-category-id="${cat.id}" title="Remove this category completely">×</button></div></div></div>`;
}

/**
 * Toggle category active/inactive status
 * @param {string} categoryId - The category ID to toggle
 */
function toggleCategoryActive(categoryId) {
  const category = activeCategories.find(ac => ac.id === categoryId);
  if (!category) return;

  // Toggle in database if manager is initialized
  if (matchSettingsManager) {
    toggleCategoryInDatabase(categoryId, !category.active);
  } else {
    // Fallback: toggle UI only
    category.active = category.active !== false;
    saveActiveCategories();
    const status = category.active ? 'activated' : 'deactivated';
    showToast(`${category.name} ${status}.`, 'success');
  }
}

/**
 * Toggle category in database
 * @param {string} categoryId - The category ID
 * @param {boolean} newIsActive - The new active status
 */
async function toggleCategoryInDatabase(categoryId, newIsActive) {
  try {
    if (!matchSettingsManager) {
      showToast('System not ready. Please refresh the page.', 'error');
      return;
    }

    // Find the category in activeCategories
    const category = activeCategories.find(ac => ac.id === categoryId);
    if (!category) {
      showToast('Category not found', 'error');
      return;
    }

    // If category has no service IDs yet, it means no subcategories were selected
    if (!category.serviceIds || category.serviceIds.length === 0) {
      showToast('Please select service subcategories before activating', 'info');
      // Reset the checkbox
      const checkbox = document.querySelector(`input[type="checkbox"].category-toggle[data-category-id="${categoryId}"]`);
      if (checkbox) {
        checkbox.checked = category.active;
      }
      return;
    }

    // Toggle all services in this category
    for (const serviceId of category.serviceIds) {
      await matchSettingsManager.toggleServiceCategory(serviceId, newIsActive);
    }

    // Update local UI state
    if (category) {
      category.active = newIsActive;
    }

    // Re-render to show updated status
    renderActiveCategories();

    const status = newIsActive ? 'activated' : 'deactivated';
    showToast(`${category?.name} ${status}.`, 'success');
  } catch (error) {
    showToast('Failed to update category status', 'error');
  }
}

/**
 * Save category pricing to database
 * @param {string} categoryId - The category ID
 * @param {string|number} priceValue - The price value
 */
async function saveCategoryPrice(categoryId, priceValue, selectedSubcategories = null) {
  try {
    if (!matchSettingsManager) {
      showToast('System not initialized. Please refresh the page.', 'error');
      return;
    }

    // Find the category in activeCategories
    const category = activeCategories.find(ac => ac.id === categoryId);
    if (!category) {
      showToast('Category not found', 'error');
      return;
    }

    // Parse price, handle empty string as null
    const price = priceValue.trim() === '' ? null : parseFloat(priceValue);
    
    if (price !== null && (isNaN(price) || price < 0)) {
      showToast('Please enter a valid price amount', 'error');
      return;
    }

    // Update subcategories if provided
    if (selectedSubcategories && Array.isArray(selectedSubcategories)) {
      category.subcategories = selectedSubcategories;
    }

    // Update price for ALL services in this category
    if (category.serviceIds && category.serviceIds.length > 0) {
      for (const serviceId of category.serviceIds) {
        await matchSettingsManager.updateServicePrice(serviceId, price);
      }
    } else {
      showToast('No services selected for this category', 'info');
      return;
    }

    // Get current user for sync
    const { data: { user } } = await window.supabaseClient.auth.getUser();

    // Sync ALL pricing to practitioners table as JSON array
    if (user) {
      await matchSettingsManager.syncServicePricingToPractitioner(user.id);
    }

    // Update local state
    if (category) {
      category.price_per_service = price;
    }

    const priceDisplay = price ? `$${price.toFixed(2)}` : 'default pricing';
    showToast(`Preferences saved for ${category.name}`, 'success');
  } catch (error) {
    console.error('[Match Settings] Error saving category price:', error);
    showToast('Failed to save preferences', 'error');
  }
}

/**
 * Save all active categories and their selected subcategories to database
 */
async function saveAllCategoriesToDatabase() {
  try {
    if (!matchSettingsManager) {
      showToast('System not initialized. Please refresh the page.', 'error');
      return;
    }

    if (activeCategories.length === 0) {
      showToast('No categories to save', 'info');
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;

    // Save each category's subcategories
    for (const category of activeCategories) {
      try {
        const subcategories = category.subcategories || [];
        
        if (subcategories.length === 0) {
          continue;
        }

        // For each selected subcategory, add it to the database
        for (const subcategoryName of subcategories) {
          try {
            await matchSettingsManager.addServiceCategory(category.id, subcategoryName);
            successCount++;
          } catch (subError) {
            errorCount++;
          }
        }
      } catch (catError) {
        errorCount++;
      }
    }

    if (errorCount === 0) {
      showToast(`Successfully saved ${successCount} service(s) to database!`, 'success');
      
      // After saving all categories, sync pricing to practitioners table
      try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (user) {
          // Extract active category names from activeCategories array
          const activeCategoryNames = activeCategories
            .filter(cat => cat.active !== false)
            .map(cat => cat.name)
            .filter(name => name);
          
          // Update practitioners table with both pricing AND service_category_names
          const { error: updateError } = await window.supabaseClient
            .from('practitioners')
            .update({
              service_category_names: activeCategoryNames,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);
          
          // Also sync pricing
          await matchSettingsManager.syncServicePricingToPractitioner(user.id);
        }
      } catch (syncError) {
        // Sync error
      }
    } else if (successCount > 0) {
      showToast(`Saved ${successCount} service(s), but ${errorCount} had errors`, 'warning');
      
      // Still try to sync what was saved
      try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (user) {
          // Extract active category names from activeCategories array
          const activeCategoryNames = activeCategories
            .filter(cat => cat.active !== false)
            .map(cat => cat.name)
            .filter(name => name);
          
          const { error: updateError } = await window.supabaseClient
            .from('practitioners')
            .update({
              service_category_names: activeCategoryNames,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);
          
          await matchSettingsManager.syncServicePricingToPractitioner(user.id);
        }
      } catch (syncError) {
        // Sync error
      }
    } else {
      showToast(`Failed to save services (${errorCount} errors)`, 'error');
    }

    // Hide the save button after successful save
    const saveBtn = document.getElementById('btn-save-categories');
    if (saveBtn && errorCount === 0) {
      saveBtn.classList.add('hidden');
    }

  } catch (error) {
    showToast('Failed to save categories', 'error');
  }
}

/**
 * Setup event listeners for category search and add functionality
 */
function setupEventListeners() {
  
  const searchInput = document.getElementById('category-search');
  const addBtn = document.getElementById('btn-add-category');
  const browseBtn = document.getElementById('btn-browse-categories');
  const dropdown = document.getElementById('autocomplete-dropdown');
  
  if (!searchInput || !addBtn || !dropdown) {
    return;
  }
  
  // Browse button listener
  if (browseBtn) {
    browseBtn.addEventListener('click', (e) => {
      openBrowseCategoriesModal(e);
    });
  }
  
  searchInput.addEventListener('input', (e) => {
    
    const value = e.target.value.trim();
    selectedCategoryForAdd = null;
    addBtn.disabled = true;
    
    if (value.length === 0) {
      dropdown.classList.remove('active');
      return;
    }
    
    // Guard against undefined allCategories
    if (!allCategories || allCategories.length === 0) {
      dropdown.classList.remove('active');
      return;
    }
    
    const filtered = allCategories.filter(cat => {
      if (!cat || !cat.name) {
        return false;
      }
      return cat.name.toLowerCase().includes(value.toLowerCase()) &&
             !activeCategories.some(ac => ac.id === cat.id);
    });
    
    if (filtered.length === 0) {
      dropdown.classList.remove('active');
      return;
    }
    
    // Show autocomplete dropdown
    dropdown.innerHTML = filtered.slice(0, 8).map(cat => `
      <div class="autocomplete-item" data-category-id="${cat.id}" data-category-name="${cat.name}">
        <span class="autocomplete-item-name">${cat.name}</span>
        ${cat.requiresLicense || cat.requiresCertification ? `
          <span class="autocomplete-item-meta">
            Requires: ${cat.requiresLicense ? 'License' : 'Certification'}
          </span>
        ` : ''}
      </div>
    `).join('');
    
    dropdown.classList.add('active');
  });
  
  // Close dropdown on blur
  searchInput.addEventListener('blur', () => {
    setTimeout(() => {
      dropdown.classList.remove('active');
    }, 200);
  });
  
  // Add button handler with proper error checking
  addBtn.addEventListener('click', (e) => {
    
    e.preventDefault();
    e.stopPropagation();
    
    if (!selectedCategoryForAdd) {
      return;
    }
    
    const fullCategory = allCategories.find(c => c.id === selectedCategoryForAdd.id);
    if (fullCategory) {
      addCategoryToDatabaseAndUI(selectedCategoryForAdd.id, selectedCategoryForAdd.name, fullCategory);
    }
  });

  // EVENT DELEGATION: Browse modal add buttons
  // Use delegation so buttons work even when re-rendered
  const browseModal = document.getElementById('browse-categories-modal');
  if (browseModal) {
    browseModal.addEventListener('click', (e) => {
      const btn = e.target.closest('.browse-category-add-btn');
      if (!btn) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      const cardEl = btn.closest('.browse-category-card');
      const categoryId = cardEl ? cardEl.dataset.categoryId : null;
      const categoryName = btn.dataset.categoryName;
      
      if (categoryId) {
        addCategoryFromBrowse(categoryId, categoryName);
      }
    });
  }
  
  // Event delegation for active categories list
  const categoriesList = document.getElementById('active-categories-list');
  if (categoriesList) {
    categoriesList.addEventListener('change', (e) => {
      if (e.target.classList.contains('category-toggle')) {
        const categoryId = e.target.dataset.categoryId;
        toggleCategoryActive(categoryId);
      }
    });
    
    categoriesList.addEventListener('click', (e) => {
      if (e.target.classList.contains('category-preferences-btn')) {
        const categoryId = e.target.dataset.categoryId;
        openPreferencesModal(categoryId);
      } else if (e.target.classList.contains('category-remove-btn')) {
        const categoryId = e.target.dataset.categoryId;
        confirmRemoveCategory(categoryId);
      }
    });
  }
  
  // Event delegation for autocomplete items
  const autocompleteDropdown = document.getElementById('autocomplete-dropdown');
  if (autocompleteDropdown) {
    autocompleteDropdown.addEventListener('click', (e) => {
      const item = e.target.closest('.autocomplete-item');
      if (item) {
        const categoryId = item.dataset.categoryId;
        const categoryName = item.dataset.categoryName;
        selectFromAutocomplete(categoryId, categoryName);
      }
    });
  }
}

/**
 * Select category from autocomplete dropdown
 * @param {string} categoryId - The category ID
 * @param {string} categoryName - The category name
 */
function selectFromAutocomplete(categoryId, categoryName) {
  
  selectedCategoryForAdd = { id: categoryId, name: categoryName };
  
  const searchInput = document.getElementById('category-search');
  const addBtn = document.getElementById('btn-add-category');
  const dropdown = document.getElementById('autocomplete-dropdown');
  
  if (searchInput) searchInput.value = categoryName;
  if (addBtn) {
    addBtn.disabled = false;
  }
  if (dropdown) dropdown.classList.remove('active');
}

/**
 * Add category to active list
 * @param {Object} categoryInfo - Category information
 */
function addCategoryToActive(categoryInfo) {
  if (activeCategories.some(ac => ac.id === categoryInfo.id)) {
    showToast('This category is already added.', 'error');
    return;
  }
  
  const fullCategory = allCategories.find(c => c.id === categoryInfo.id);
  if (!fullCategory) return;
  
  activeCategories.push({
    id: categoryInfo.id,
    name: categoryInfo.name,
    subcategories: [],
    active: true,
    requiresLicense: fullCategory.requiresLicense,
    requiresCert: fullCategory.requiresCertification
  });
  
  renderActiveCategories();
  
  // Clear search
  document.getElementById('category-search').value = '';
  document.getElementById('btn-add-category').disabled = true;
  selectedCategoryForAdd = null;
  
  showToast(`${categoryInfo.name} added to your categories.`, 'success');
}

/**
 * Add category from browse modal
 * @param {string} categoryId - The category ID
 * @param {string} categoryName - The category name
 */
function addCategoryFromBrowse(categoryId, categoryName) {
  
  // Check if already added
  if (activeCategories.some(ac => ac.id === categoryId)) {
    showToast('This category is already added.', 'error');
    return;
  }

  // Get full category info
  const fullCategory = allCategories.find(c => c.id === categoryId);
  
  if (!fullCategory) {
    showToast('Error: Category not found. Please refresh and try again.', 'error');
    return;
  }

  // Add to database first
  addCategoryToDatabaseAndUI(categoryId, categoryName, fullCategory);
}

/**
 * Add category to database and UI
 * @param {string} categoryId - The category ID
 * @param {string} categoryName - The category name
 * @param {Object} fullCategory - Full category object
 */
async function addCategoryToDatabaseAndUI(categoryId, categoryName, fullCategory) {
  try {
    if (!matchSettingsManager) {
      addCategoryToUIOnly(categoryId, categoryName, fullCategory);
      return;
    }

    // Add category to UI
    addCategoryToUIOnly(categoryId, categoryName, fullCategory);

    // Re-render browse cards to show updated state with animation
    renderBrowseCategoryCards();
    
    // Find the button that was clicked and animate it
    const card = document.querySelector(`[data-category-id="${categoryId}"]`);
    if (card) {
      card.classList.add('added-animation');
      // Remove animation class after it completes
      setTimeout(() => {
        card.classList.remove('added-animation');
      }, 600);
    }

    // Close browse modal and open preferences
    closeBrowseCategoriesModal();
    selectedCategoryForAdd = categoryId;
    openPreferencesModal(categoryId);

  } catch (error) {
    showToast('Failed to add category', 'error');
  }
}

/**
 * Add category to UI only
 * @param {string} categoryId - The category ID
 * @param {string} categoryName - The category name
 * @param {Object} fullCategory - Full category object
 */
function addCategoryToUIOnly(categoryId, categoryName, fullCategory) {
  // Add to active categories
  activeCategories.push({
    id: categoryId,
    name: categoryName,
    subcategories: [],
    active: false, // Default to inactive
    serviceIds: [], // Initialize empty - will be populated when subcategories are added
    price_per_service: null,
    requiresLicense: fullCategory.requiresLicense,
    requiresCert: fullCategory.requiresCertification
  });

  renderActiveCategories();
  
  // Show the save button
  const saveBtn = document.getElementById('btn-save-categories');
  if (saveBtn && activeCategories.length > 0) {
    saveBtn.classList.remove('hidden');
  }
  
  // Update browse cards
  renderBrowseCategoryCards();
}

/* ========================================== */
/* 5. PREFERENCES MODAL */
/* ========================================== */

/**
 * Open Preferences Modal for a specific category
 * @param {string} categoryId - The category ID to open preferences for
 */
// openPreferencesModal moved to match-settings-modals.js
//Save Preferences Modal - persist selected subcategories and pricing
async function savePreferencesModal() {
  if (!currentEditingCategory) return;
  
  try {
    // Get all checked checkboxes and extract the data-subcategory attribute
    const checkboxes = document.querySelectorAll('#subcategories-list input[type="checkbox"]:checked');
    const selectedSubs = Array.from(checkboxes).map(cb => cb.getAttribute('data-subcategory'));
    
    // Get price from modal input
    const priceInput = document.getElementById('modal-price-input');
    const price = priceInput.value ? parseFloat(priceInput.value) : null;
    
    const active = activeCategories.find(ac => ac.id === currentEditingCategory);
    if (active) {
      active.subcategories = selectedSubs;
      if (price !== null) {
        active.price_per_service = price;
      }
      
      // Save to database if manager is initialized
      if (matchSettingsManager && selectedSubs.length > 0) {
        try {
          // For each selected subcategory, add it to the database
          const newServiceIds = [];
          for (const subcategoryName of selectedSubs) {
            const result = await matchSettingsManager.addServiceCategory(currentEditingCategory, subcategoryName, price);
            if (result && result.id) {
              newServiceIds.push(result.id);
            }
          }
          // Update the serviceIds in activeCategories so toggle works
          active.serviceIds = newServiceIds;
          showToast(`${selectedSubs.length} service(s) saved successfully.`, 'success');
        } catch (dbError) {
          // Still close the modal even if database save fails
          showToast('Services saved locally, but database save failed. Please try again.', 'warning');
        }
        
        // After services are saved, sync all pricing to practitioners table
        try {
          const { data: { user } } = await window.supabaseClient.auth.getUser();
          if (user) {
            await matchSettingsManager.syncServicePricingToPractitioner(user.id);
          }
        } catch (syncError) {
          // Pricing sync error
        }
        
        // CRITICAL: Sync denormalized service arrays after all services are saved
        try {
          const { data: { user } } = await window.supabaseClient.auth.getUser();
          if (user && matchSettingsManager?.practitionerSerial) {
            const { data: syncResult, error: syncError } = await window.supabaseClient
              .rpc('sync_practitioner_service_arrays', {
                p_practitioner_serial: matchSettingsManager.practitionerSerial
              });
          }
        } catch (arraySyncError) {
          // Service array sync error
        }
      } else {
        showToast('Services saved successfully.', 'success');
      }
      
      renderActiveCategories();
    }
    
    closePreferencesModal();
  } catch (error) {
    showToast('Error saving preferences', 'error');
  }
}

/* ========================================== */
/* 6. BROWSE CATEGORIES MODAL */
/* ========================================== */

// openBrowseCategoriesModal and closeBrowseCategoriesModal moved to match-settings-modals.js
// (Note: They are now openBrowseModal and closeBrowseModal)
function renderBrowseCategoryCards() {
  const licenseRequiredGrid = document.getElementById('browse-license-required-categories');
  const certifiedGrid = document.getElementById('browse-certified-categories');
  const unrestrictedGrid = document.getElementById('browse-unrestricted-categories');

  if (!licenseRequiredGrid || !certifiedGrid || !unrestrictedGrid) {
    return;
  }

  // Separate categories by credential requirement
  const licenseRequired = allCategories.filter(cat => {
    const cred = cat.credential || '';
    return cred === 'License Required';
  });

  const certified = allCategories.filter(cat => {
    const cred = cat.credential || '';
    return (cred.includes('Cert') || cred.includes('Licensed')) && !cred.includes('Open');
  });

  const openPractice = allCategories.filter(cat => {
    const cred = cat.credential || '';
    return cred.includes('Open');
  });

  // Render each category group
  licenseRequiredGrid.innerHTML = licenseRequired.map(cat => createBrowseCategoryCard(cat)).join('');
  certifiedGrid.innerHTML = certified.map(cat => createBrowseCategoryCard(cat)).join('');
  unrestrictedGrid.innerHTML = openPractice.map(cat => createBrowseCategoryCard(cat)).join('');
}

/**
 * Create a single browse category card
 * @param {Object} category - The category object
 * @returns {string} - HTML string for the card
 */
function createBrowseCategoryCard(category) {
  const isAlreadyAdded = activeCategories.some(ac => ac.id === category.id);

  if (isAlreadyAdded) {
    return `
      <div class="browse-category-card already-added" data-category-id="${category.id}">
        <div class="browse-category-name">${category.name}</div>
        <div class="browse-category-already-added">✓ Added</div>
      </div>
    `;
  }

  return `
    <div class="browse-category-card" data-category-id="${category.id}">
      <div class="browse-category-name">${category.name}</div>
      <button 
        class="browse-category-add-btn" 
        data-category-name="${category.name}"
        type="button"
        title="Add ${category.name}"
      >
        + Add
      </button>
    </div>
  `;
}