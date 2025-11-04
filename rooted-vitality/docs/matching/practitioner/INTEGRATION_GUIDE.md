# Match Settings Manager Integration Guide

## Overview
This guide shows how to integrate `MatchSettingsManager` with your `match-settings.html` form for full database persistence.

## 1. Initialize Manager

Add this near the top of your match-settings.html script section, after supabase client loads:

```javascript
// Create manager instance (once when page loads)
let matchSettingsManager = null;

async function initializeMatchSettingsManager(practitionerId) {
  matchSettingsManager = new MatchSettingsManager(window.supabaseClient);
  await matchSettingsManager.initialize(practitionerId);
  
  // Load existing data into UI
  loadSettingsIntoUI();
  
  console.log('Match Settings Manager initialized');
}

// Call this on page load or after auth
// Example: 
// const practitionerId = await getCurrentPractitionerId();
// await initializeMatchSettingsManager(practitionerId);
```

## 2. Coverage Area Integration

### 2a. Saving In-Office Coverage

When user clicks Save for In-Office settings:

```javascript
async function saveInOfficeSetting() {
  try {
    // Gather UI state
    const optionA = document.querySelector('input[name="inoffice-mode"]:checked')?.value === 'mode-a' 
      ? {
          base_zip: document.querySelector('#inoffice-base-zip')?.value || null,
          radius_miles: parseInt(document.querySelector('#inoffice-radius-slider')?.value) || 10
        }
      : null;

    const optionB = document.querySelector('input[name="inoffice-mode"]:checked')?.value === 'mode-b'
      ? {
          zips: Array.from(document.querySelectorAll('#inoffice-zips-list .zip-tag'))
            .map(tag => tag.dataset.zip)
        }
      : null;

    // Save to database
    await matchSettingsManager.saveInOfficeCoverage(optionA, optionB);
    
    showNotification('In-Office coverage saved successfully', 'success');
  } catch (error) {
    console.error('Error saving in-office coverage:', error);
    showNotification('Failed to save in-office coverage', 'error');
  }
}
```

### 2b. Saving House Calls Coverage

```javascript
async function saveHouseCallsSetting() {
  try {
    const optionA = document.querySelector('input[name="housecalls-mode"]:checked')?.value === 'mode-a'
      ? {
          base_zip: document.querySelector('#housecalls-base-zip')?.value || null,
          radius_miles: parseInt(document.querySelector('#housecalls-radius-slider')?.value) || 10
        }
      : null;

    const optionB = document.querySelector('input[name="housecalls-mode"]:checked')?.value === 'mode-b'
      ? {
          zips: Array.from(document.querySelectorAll('#housecalls-zips-list .zip-tag'))
            .map(tag => tag.dataset.zip)
        }
      : null;

    await matchSettingsManager.saveHouseCallsCoverage(optionA, optionB);
    
    showNotification('House Calls coverage saved successfully', 'success');
  } catch (error) {
    console.error('Error saving house calls coverage:', error);
    showNotification('Failed to save house calls coverage', 'error');
  }
}
```

### 2c. Saving Virtual/Remote Coverage

```javascript
async function saveVirtualRemoteSetting() {
  try {
    const optionA = document.querySelector('input[name="virtualremote-mode"]:checked')?.value === 'mode-a'
      ? {
          nationwide: document.querySelector('#virtualremote-nationwide')?.checked || false
        }
      : null;

    const optionB = document.querySelector('input[name="virtualremote-mode"]:checked')?.value === 'mode-b'
      ? {
          states: Array.from(document.querySelectorAll('#virtualremote-states-list .state-tag'))
            .map(tag => tag.dataset.state)
        }
      : null;

    await matchSettingsManager.saveVirtualRemoteCoverage(optionA, optionB);
    
    showNotification('Virtual/Remote coverage saved successfully', 'success');
  } catch (error) {
    console.error('Error saving virtual/remote coverage:', error);
    showNotification('Failed to save virtual/remote coverage', 'error');
  }
}
```

## 3. Service Categories Integration

### 3a. Add Category from Browse

Update your `addCategoryFromBrowse()` function:

```javascript
async function addCategoryFromBrowse(categoryId, categoryName) {
  try {
    // Extract taxonomy and subcategory IDs from the category object
    // Assuming you have access to allCategories array
    const category = allCategories.find(c => c.id === categoryId);
    if (!category) {
      console.error('Category not found:', categoryId);
      return;
    }

    // Save to database (defaults to is_active: false)
    await matchSettingsManager.addServiceCategory(category.taxonomy_id, categoryId);
    
    // Add to UI active list
    if (!activeCategories.includes(categoryId)) {
      activeCategories.push(categoryId);
    }

    // Close browse modal and open preferences
    closeBrowseCategoriesModal();
    selectedCategoryForAdd = categoryId;
    openPreferencesModal(categoryId);
    
    console.log('Category added:', categoryName);
  } catch (error) {
    console.error('Error adding category:', error);
    showNotification('Failed to add category', 'error');
  }
}
```

### 3b. Toggle Category Active/Inactive

Update your `toggleCategoryActive()` function:

```javascript
async function toggleCategoryActive(categoryId) {
  try {
    // Find the service record in database
    const service = matchSettingsManager.getSelectedServices()
      .find(s => s.subcategory_id === categoryId);
    
    if (!service) {
      console.error('Service not found for category:', categoryId);
      return;
    }

    // Toggle in database
    const newIsActive = !service.is_active;
    await matchSettingsManager.toggleServiceCategory(service.id, newIsActive);

    // Update UI
    const checkbox = document.querySelector(`input[data-category="${categoryId}"]`);
    if (checkbox) {
      checkbox.checked = newIsActive;
    }

    console.log('Category', categoryId, 'toggled to', newIsActive);
  } catch (error) {
    console.error('Error toggling category:', error);
    showNotification('Failed to update category status', 'error');
  }
}
```

### 3c. Remove Category

Update your category removal function:

```javascript
async function removeCategory(categoryId) {
  try {
    // Find the service record
    const service = matchSettingsManager.getSelectedServices()
      .find(s => s.subcategory_id === categoryId);
    
    if (!service) {
      console.error('Service not found for category:', categoryId);
      return;
    }

    // Delete from database
    await matchSettingsManager.removeServiceCategory(service.id);

    // Remove from UI active list
    activeCategories = activeCategories.filter(id => id !== categoryId);

    // Update UI display
    renderActiveCategories();
    
    console.log('Category removed:', categoryId);
  } catch (error) {
    console.error('Error removing category:', error);
    showNotification('Failed to remove category', 'error');
  }
}
```

### 3d. Save Preferences for Category

Update your `savePreferencesModal()` function:

```javascript
async function savePreferencesModal() {
  try {
    if (!selectedCategoryForAdd) {
      console.error('No category selected');
      return;
    }

    // Get selected subcategories from checkboxes
    const selectedSubcategories = Array.from(
      document.querySelectorAll('#preferences-modal input[type="checkbox"]:checked')
    ).map(input => input.value);

    // Find the service in database
    const service = matchSettingsManager.getSelectedServices()
      .find(s => s.subcategory_id === selectedCategoryForAdd);

    if (!service) {
      console.error('Service not found');
      return;
    }

    // Update is_active to true and save preferences
    // Note: Preferences storage depends on your database structure
    // For now, just activate the category
    await matchSettingsManager.toggleServiceCategory(service.id, true);

    // Close modal
    closePreferencesModal();

    showNotification('Preferences saved successfully', 'success');
  } catch (error) {
    console.error('Error saving preferences:', error);
    showNotification('Failed to save preferences', 'error');
  }
}
```

## 4. Availability & Schedule Integration

### 4a. Updating Day Availability

```javascript
async function updateDayAvailability(day, isAvailable, openTime, closeTime) {
  try {
    await matchSettingsManager.updateDayAvailability(
      day.toLowerCase(),
      isAvailable,
      isAvailable ? openTime : null,
      isAvailable ? closeTime : null
    );

    showNotification(`${day} availability updated`, 'success');
  } catch (error) {
    console.error('Error updating day availability:', error);
    showNotification('Failed to update availability', 'error');
  }
}
```

### 4b. Updating Timezone

```javascript
async function updateTimezone(timezone) {
  try {
    await matchSettingsManager.updateTimezone(timezone);
    showNotification('Timezone updated', 'success');
  } catch (error) {
    console.error('Error updating timezone:', error);
    showNotification('Failed to update timezone', 'error');
  }
}
```

## 5. Load Settings into UI

When page loads, populate UI from database:

```javascript
async function loadSettingsIntoUI() {
  try {
    // Get coverage settings
    const coverage = matchSettingsManager.getCoverageAreaSettings();

    // Load In-Office
    if (coverage.in_office.enabled) {
      document.querySelector('#travel-type-inoffice').checked = true;
      document.querySelector('#inoffice-settings').style.display = 'block';
      
      if (coverage.in_office.option_a.base_zip) {
        document.querySelector('input[name="inoffice-mode"][value="mode-a"]').checked = true;
        document.querySelector('#inoffice-base-zip').value = coverage.in_office.option_a.base_zip;
        document.querySelector('#inoffice-radius-slider').value = coverage.in_office.option_a.radius_miles;
      } else if (coverage.in_office.option_b.zips.length > 0) {
        document.querySelector('input[name="inoffice-mode"][value="mode-b"]').checked = true;
        // Recreate ZIP tags for each ZIP
        coverage.in_office.option_b.zips.forEach(zip => {
          addInofficeZip(zip, true); // Pass true to skip API call
        });
      }
    }

    // Load House Calls (similar to In-Office)
    // Load Virtual/Remote (similar to In-Office)

    // Get selected services
    const services = matchSettingsManager.getSelectedServices();
    activeCategories = services
      .filter(s => s.is_active === true)
      .map(s => s.subcategory_id);

    renderActiveCategories();

    // Get availability
    const schedule = matchSettingsManager.getAvailabilitySchedule();
    // Populate availability UI with schedule data

    console.log('Settings loaded into UI');
  } catch (error) {
    console.error('Error loading settings into UI:', error);
  }
}
```

## 6. Create a Master Save Function

This saves everything on one button click:

```javascript
async function saveAllMatchSettings() {
  try {
    // Disable save button
    const saveBtn = document.querySelector('#save-all-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    // Save each section
    await saveInOfficeSetting();
    await saveHouseCallsSetting();
    await saveVirtualRemoteSetting();
    // Add availability save too if you have separate function

    // Refresh manager data
    await matchSettingsManager.refreshAll();

    // Show confirmation
    showNotification('All settings saved successfully!', 'success');

    // Re-enable button
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Settings';
  } catch (error) {
    console.error('Error saving all settings:', error);
    showNotification('Failed to save some settings', 'error');

    // Re-enable button
    const saveBtn = document.querySelector('#save-all-btn');
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Settings';
  }
}
```

## 7. Error Handling Helper

Add this to show user-friendly notifications:

```javascript
function showNotification(message, type = 'info') {
  // Create simple notification div (or use existing notification system)
  const notif = document.createElement('div');
  notif.className = `notification notification-${type}`;
  notif.textContent = message;
  notif.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    background: ${type === 'success' ? '#5c9a72' : type === 'error' ? '#d32f2f' : '#1976d2'};
    color: white;
    border-radius: 4px;
    z-index: 10000;
  `;
  document.body.appendChild(notif);
  
  // Auto-remove after 3 seconds
  setTimeout(() => notif.remove(), 3000);
}
```

## 8. Add Script Tag to HTML

In your `match-settings.html` `<head>` section:

```html
<!-- Supabase Client (before matchSettingsManager) -->
<script src="/rooted-vitality/scripts/supabaseClient.js"></script>

<!-- Match Settings Manager -->
<script src="/rooted-vitality/scripts/matchSettingsManager.js"></script>
```

## 9. Example Page Load

Add this to your page initialization:

```javascript
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Get current practitioner ID (adjust based on your auth flow)
    const practitionerId = await getCurrentPractitionerId(); // Your existing function
    
    // Initialize manager
    await initializeMatchSettingsManager(practitionerId);
    
    console.log('Match Settings page ready');
  } catch (error) {
    console.error('Page initialization error:', error);
    showNotification('Failed to load settings', 'error');
  }
});
```

## 10. Testing Checklist

- [ ] Page loads and populates UI with existing data
- [ ] Saving In-Office coverage persists to database
- [ ] Saving House Calls coverage persists to database
- [ ] Saving Virtual/Remote coverage persists to database
- [ ] Adding service category saves to database with `is_active: false`
- [ ] Toggling category active/inactive updates database
- [ ] Removing category deletes from database
- [ ] Availability schedule updates persist
- [ ] Timezone updates persist
- [ ] Page refresh shows saved data
- [ ] Error handling shows user-friendly messages
- [ ] Console shows MatchSettingsManager log messages

## API Reference Quick Guide

```javascript
// Get data
matchSettingsManager.getCoverageAreaSettings()
matchSettingsManager.getTravelTypeCoverage('in_office')
matchSettingsManager.isTravelTypeEnabled('house_calls')
matchSettingsManager.getSelectedServices()
matchSettingsManager.getActiveServices()
matchSettingsManager.getAvailabilitySchedule()
matchSettingsManager.isMatchingActive()
matchSettingsManager.isMatchingPaused()

// Save data
await matchSettingsManager.saveInOfficeCoverage(optionA, optionB)
await matchSettingsManager.saveHouseCallsCoverage(optionA, optionB)
await matchSettingsManager.saveVirtualRemoteCoverage(optionA, optionB)
await matchSettingsManager.addServiceCategory(taxonomyId, subcategoryId)
await matchSettingsManager.toggleServiceCategory(serviceId, isActive)
await matchSettingsManager.removeServiceCategory(serviceId)
await matchSettingsManager.updateAvailabilitySchedule(schedule)
await matchSettingsManager.updateDayAvailability(day, available, open, close)
await matchSettingsManager.updateTimezone(timezone)

// Matching status
await matchSettingsManager.activateMatching()
await matchSettingsManager.deactivateMatching()
await matchSettingsManager.pauseMatching(pauseUntil, reason)
await matchSettingsManager.resumeMatching()

// Utility
await matchSettingsManager.refreshAll()
matchSettingsManager.getSummary()
matchSettingsManager.exportSettings()
```

---

**Next Step:** Update your match-settings.html with these integration points and test the full workflow!
