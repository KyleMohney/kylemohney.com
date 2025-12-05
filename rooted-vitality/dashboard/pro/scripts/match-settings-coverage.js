/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: match-settings-coverage.js                                  ║
║  Purpose: Coverage Area & Map Management for Match Settings        ║
║  Handles: Travel types, radius/ZIP modes, map visualization        ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

TABLE OF CONTENTS
  1. Map Initialization & Globals
  2. Travel Type Management
  3. Coverage Area Display
  4. In-Office Coverage Functions
  5. House Calls Coverage Functions
  6. Virtual/Remote Coverage Functions
  7. ZIP Code Management
  8. CSV Import Handler
  9. Radius Visualization
  10. Map Event Listeners
  11. Settings Persistence (Load & Save)

*/

/* ========================================== */
/* 1. MAP INITIALIZATION & GLOBALS */
/* ========================================== */

// Map instance and layers (conditional declaration to avoid conflicts)
if (typeof coverageMap === 'undefined') { var coverageMap = null; }
if (typeof serviceRadiusCircle === 'undefined') { var serviceRadiusCircle = null; }
if (typeof serviceRadiusCenterMarker === 'undefined') { var serviceRadiusCenterMarker = null; }
if (typeof housecallsRadiusCircle === 'undefined') { var housecallsRadiusCircle = null; }
if (typeof housecallsCenterMarker === 'undefined') { var housecallsCenterMarker = null; }
if (typeof zipCodeMarkers === 'undefined') { var zipCodeMarkers = []; }

// Debounce timers
if (typeof inofficeRadiusDebounceTimer === 'undefined') { var inofficeRadiusDebounceTimer = null; }
if (typeof housecallsRadiusDebounceTimer === 'undefined') { var housecallsRadiusDebounceTimer = null; }

// Last values for change detection
if (typeof inofficeLastZip === 'undefined') { var inofficeLastZip = null; }
if (typeof inofficeLastRadius === 'undefined') { var inofficeLastRadius = null; }
if (typeof housecallsLastZip === 'undefined') { var housecallsLastZip = null; }
if (typeof housecallsLastRadius === 'undefined') { var housecallsLastRadius = null; }

// ZIP codes storage
if (typeof inofficeZipsList === 'undefined') { var inofficeZipsList = []; }
if (typeof housecallsZipsList === 'undefined') { var housecallsZipsList = []; }
if (typeof virtualStatesList === 'undefined') { var virtualStatesList = []; }


/* ========================================== */
/* 2. TRAVEL TYPE MANAGEMENT */
/* ========================================== */

/**
 * Handle travel type checkbox changes
 * Shows/hides appropriate coverage sections and initializes map
 */
function handleTravelTypeChange() {
  const inPerson = document.getElementById('travel-in-person').checked;
  const houseCalls = document.getElementById('travel-house-calls').checked;
  const virtual = document.getElementById('travel-virtual').checked;

  // Show/hide In-Office settings
  const inofficeSettings = document.getElementById('inoffice-settings');
  if (inPerson) {
    inofficeSettings.classList.add('active');
  } else {
    inofficeSettings.classList.remove('active');
  }

  // Show/hide House Calls settings
  const housecallsSettings = document.getElementById('housecalls-settings');
  if (houseCalls) {
    housecallsSettings.classList.add('active');
  } else {
    housecallsSettings.classList.remove('active');
  }

  // Show/hide Virtual/Remote settings
  const virtualremoteSettings = document.getElementById('virtualremote-settings');
  if (virtual) {
    virtualremoteSettings.classList.add('active');
  } else {
    virtualremoteSettings.classList.remove('active');
    // Reset Virtual/Remote options
    document.getElementById('virtualremote-mode-nationwide').checked = false;
    document.getElementById('virtualremote-mode-states').checked = false;
    clearVirtualRemoteSelection();
  }

  // Initialize map if any service type is selected
  const hasAnyService = inPerson || houseCalls || virtual;
  if (hasAnyService) {
    setTimeout(() => {
      if (coverageMap) {
        coverageMap.invalidateSize();
        updateCoverageMapVisualization();
      } else {
        initializeCoverageMap();
      }
    }, 100);
  }
}


/* ========================================== */
/* 3. COVERAGE AREA DISPLAY */
/* ========================================== */

/**
 * Initialize the Leaflet map
 */
function initializeCoverageMap() {
  if (coverageMap) return;
  
  const mapContainer = document.getElementById('coverage-map');
  if (!mapContainer) return;

  mapContainer.classList.add('active');
  mapContainer.classList.add('map-visible');

  try {
    coverageMap = L.map('coverage-map', {
      center: [39.8283, -98.5795],
      zoom: 4,
      scrollWheelZoom: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(coverageMap);

    L.control.zoom({ position: 'topright' }).addTo(coverageMap);

    setTimeout(() => {
      if (coverageMap) {
        coverageMap.invalidateSize();
        updateCoverageMapVisualization();
      }
    }, 100);
  } catch (error) {
    showToast('Error loading map. Please refresh the page.', 'error');
  }
}

/**
 * Update map visualization based on selected coverage options
 */
function updateCoverageMapVisualization() {
  if (!coverageMap) return;
  
  // Clear existing visualization layers
  coverageMap.eachLayer((layer) => {
    if (layer instanceof L.Circle || layer instanceof L.Marker) {
      coverageMap.removeLayer(layer);
    }
  });

  // Show visualization based on active travel types
  const inPerson = document.getElementById('travel-in-person').checked;
  const houseCalls = document.getElementById('travel-house-calls').checked;
  const virtual = document.getElementById('travel-virtual').checked;

  if (virtual && !inPerson && !houseCalls) {
    // Show nationwide coverage
    coverageMap.setView([39.8283, -98.5795], 4);
    const usaBounds = L.latLngBounds(
      L.latLng(24.5, -125),
      L.latLng(50, -66)
    );
    L.rectangle(usaBounds, {
      color: '#77883e',
      weight: 2,
      opacity: 0.3,
      fill: true,
      fillColor: '#77883e',
      fillOpacity: 0.05
    }).addTo(coverageMap);
  } else if (inPerson || houseCalls) {
    // Show radius visualization based on checked options
    if (inPerson) {
      const radiusChecked = document.getElementById('inoffice-mode-radius')?.checked;
      if (radiusChecked) {
        updateInofficeRadiusVisualization();
      }
    }
    if (houseCalls) {
      const radiusChecked = document.getElementById('housecalls-mode-radius')?.checked;
      if (radiusChecked) {
        updateHouseCallsRadiusVisualization();
      }
    }
  }
}


/* ========================================== */
/* 4. IN-OFFICE COVERAGE FUNCTIONS */
/* ========================================== */

function toggleInofficeCollapse() {
  const optionA = document.querySelector('#inoffice-settings > div:nth-child(2)');
  const optionB = document.querySelector('#inoffice-settings > div:nth-child(3)');
  const arrow = document.getElementById('inoffice-arrow');
  
  const isHidden = optionA.classList.contains('hidden');
  optionA.classList.toggle('hidden');
  optionB.classList.toggle('hidden');
  
  if (isHidden) {
    arrow.classList.remove('rotated');
  } else {
    arrow.classList.add('rotated');
  }
}

function toggleInofficeMode(mode) {
  const radiusCheckbox = document.getElementById('inoffice-mode-radius');
  const zipsCheckbox = document.getElementById('inoffice-mode-zips');
  const radiusContent = document.getElementById('inoffice-radius-content');
  const zipsContent = document.getElementById('inoffice-zips-content');

  if (mode === 'radius') {
    if (!radiusCheckbox.checked) {
      radiusContent.style.display = 'none';
      clearInofficeRadiusVisualization();
    } else {
      zipsCheckbox.checked = false;
      radiusContent.style.display = 'block';
      zipsContent.classList.remove('active');
      clearInofficeRadiusVisualization();
    }
  } else if (mode === 'zips') {
    if (!zipsCheckbox.checked) {
      zipsContent.classList.remove('active');
      clearInofficeRadiusVisualization();
    } else {
      radiusCheckbox.checked = false;
      zipsContent.classList.add('active');
      radiusContent.style.display = 'none';
      clearInofficeRadiusVisualization();
    }
  }
}

function clearInofficeRadiusVisualization() {
  if (serviceRadiusCircle && coverageMap) {
    coverageMap.removeLayer(serviceRadiusCircle);
    serviceRadiusCircle = null;
  }
  
  if (serviceRadiusCenterMarker && coverageMap) {
    coverageMap.removeLayer(serviceRadiusCenterMarker);
    serviceRadiusCenterMarker = null;
  }
  
  inofficeLastZip = null;
  inofficeLastRadius = null;
  
  const zipInput = document.getElementById('inoffice-base-zip');
  const radiusSlider = document.getElementById('inoffice-radius-slider');
  if (zipInput) zipInput.value = '';
  if (radiusSlider) {
    radiusSlider.value = 10;
    radiusSlider.dataset.sliderValue = '20';
  }
  
  const radiusDisplay = document.getElementById('inoffice-radius-display');
  if (radiusDisplay) radiusDisplay.textContent = '10 miles';
}

function updateInofficeRadiusDisplay() {
  const slider = document.getElementById('inoffice-radius-slider');
  const display = document.getElementById('inoffice-radius-display');
  if (slider && display) {
    const value = slider.value;
    display.textContent = value + ' miles';
    slider.dataset.sliderValue = (value / 50) * 100;
  }
}


/* ========================================== */
/* 5. HOUSE CALLS COVERAGE FUNCTIONS */
/* ========================================== */

function toggleHouseCallsCollapse() {
  const optionA = document.querySelector('#housecalls-settings > div:nth-child(2)');
  const optionB = document.querySelector('#housecalls-settings > div:nth-child(3)');
  const arrow = document.getElementById('housecalls-arrow');
  
  const isHidden = optionA.classList.contains('hidden');
  optionA.classList.toggle('hidden');
  optionB.classList.toggle('hidden');
  
  if (isHidden) {
    arrow.classList.remove('rotated');
  } else {
    arrow.classList.add('rotated');
  }
}

function toggleHouseCallsMode(mode) {
  const radiusCheckbox = document.getElementById('housecalls-mode-radius');
  const zipsCheckbox = document.getElementById('housecalls-mode-zips');
  const radiusContent = document.getElementById('housecalls-radius-content');
  const zipsContent = document.getElementById('housecalls-zips-content');

  if (mode === 'radius') {
    if (!radiusCheckbox.checked) {
      radiusContent.style.display = 'none';
      clearHouseCallsRadiusVisualization();
    } else {
      zipsCheckbox.checked = false;
      radiusContent.style.display = 'block';
      zipsContent.classList.remove('active');
      clearHouseCallsRadiusVisualization();
    }
  } else if (mode === 'zips') {
    if (!zipsCheckbox.checked) {
      zipsContent.classList.remove('active');
      clearHouseCallsRadiusVisualization();
    } else {
      radiusCheckbox.checked = false;
      zipsContent.classList.add('active');
      radiusContent.style.display = 'none';
      clearHouseCallsRadiusVisualization();
    }
  }
}

function clearHouseCallsRadiusVisualization() {
  if (housecallsRadiusCircle && coverageMap) {
    coverageMap.removeLayer(housecallsRadiusCircle);
    housecallsRadiusCircle = null;
  }
  
  if (housecallsCenterMarker && coverageMap) {
    coverageMap.removeLayer(housecallsCenterMarker);
    housecallsCenterMarker = null;
  }
  
  housecallsLastZip = null;
  housecallsLastRadius = null;
  
  const zipInput = document.getElementById('housecalls-base-zip');
  const radiusSlider = document.getElementById('housecalls-radius-slider');
  if (zipInput) zipInput.value = '';
  if (radiusSlider) {
    radiusSlider.value = 10;
    radiusSlider.dataset.sliderValue = '20';
  }
  
  const radiusDisplay = document.getElementById('housecalls-radius-display');
  if (radiusDisplay) radiusDisplay.textContent = '10 miles';
}

function updateHouseCallsRadiusDisplay() {
  const slider = document.getElementById('housecalls-radius-slider');
  const display = document.getElementById('housecalls-radius-display');
  if (slider && display) {
    const value = slider.value;
    display.textContent = value + ' miles';
    slider.dataset.sliderValue = (value / 50) * 100;
  }
}


/* ========================================== */
/* 6. VIRTUAL/REMOTE COVERAGE FUNCTIONS */
/* ========================================== */

function toggleVirtualRemoteCollapse() {
  const arrow = document.getElementById('virtualremote-arrow');
  const virtualremoteSettings = document.getElementById('virtualremote-settings');
  
  if (!virtualremoteSettings) return;

  const contentDivs = Array.from(virtualremoteSettings.children).filter(child => child.tagName !== 'H3');
  const isCollapsed = arrow.classList.contains('rotated');
  arrow.classList.toggle('rotated');
  
  contentDivs.forEach(div => {
    div.classList.toggle('hidden', !isCollapsed);
  });
}

function toggleVirtualRemoteMode(mode) {
  const nationwideCheckbox = document.getElementById('virtualremote-mode-nationwide');
  const statesCheckbox = document.getElementById('virtualremote-mode-states');
  const statesContent = document.getElementById('virtualremote-states-content');

  if (mode === 'nationwide') {
    if (nationwideCheckbox.checked) {
      statesCheckbox.checked = false;
      statesContent.classList.remove('active');
      clearVirtualRemoteSelection();
    }
  } else if (mode === 'states') {
    if (statesCheckbox.checked) {
      nationwideCheckbox.checked = false;
      statesContent.classList.add('active');
    } else {
      statesContent.classList.remove('active');
      clearVirtualRemoteSelection();
    }
  }
}

function clearVirtualRemoteSelection() {
  const statesContainer = document.getElementById('virtualremote-state-tags');
  const statesSelect = document.getElementById('virtualremote-state-select');
  statesContainer.innerHTML = '';
  statesSelect.value = '';
}

function addVirtualRemoteState() {
  const select = document.getElementById('virtualremote-state-select');
  const container = document.getElementById('virtualremote-state-tags');
  const stateCode = select.value;

  if (!stateCode) {
    showToast('Please select a state', 'error');
    return;
  }

  const selectedOption = select.options[select.selectedIndex];
  const stateName = selectedOption.text;

  const existingStates = Array.from(container.querySelectorAll('[data-state]')).map(el => el.getAttribute('data-state'));
  if (existingStates.includes(stateCode)) {
    showToast(`${stateName} is already added`, 'error');
    return;
  }

  const tag = document.createElement('div');
  tag.setAttribute('data-state', stateCode);
  tag.className = 'state-tag';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn-remove-item';
  btn.textContent = '×';
  btn.addEventListener('click', (e) => removeVirtualRemoteState(e.target));
  tag.textContent = stateCode;
  tag.appendChild(btn);
  container.appendChild(tag);

  select.value = '';
  select.focus();
}

function removeVirtualRemoteState(btn) {
  btn.closest('[data-state]').remove();
}


/* ========================================== */
/* 7. ZIP CODE MANAGEMENT */
/* ========================================== */

function addInofficeZip() {
  const input = document.getElementById('inoffice-zip-input');
  const container = document.getElementById('inoffice-zip-tags');
  const inputValue = input.value.trim();

  if (!inputValue) {
    showToast('Please enter at least one ZIP code', 'error');
    return;
  }

  const zipCodes = inputValue.split(',').map(zip => zip.trim()).filter(zip => zip.length > 0);
  const existingZips = Array.from(container.querySelectorAll('[data-zip]')).map(el => el.getAttribute('data-zip'));
  let addedCount = 0, skippedCount = 0;

  zipCodes.forEach(zipCode => {
    if (!/^\d{5}$/.test(zipCode)) {
      skippedCount++;
      return;
    }
    if (existingZips.includes(zipCode)) {
      skippedCount++;
      return;
    }

    const tag = document.createElement('div');
    tag.setAttribute('data-zip', zipCode);
    tag.className = 'zip-tag';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-remove-item';
    btn.textContent = '×';
    btn.addEventListener('click', (e) => removeInofficeZip(e.target));
    tag.textContent = zipCode;
    tag.appendChild(btn);
    container.appendChild(tag);
    existingZips.push(zipCode);
    addedCount++;
  });

  if (addedCount > 0 && skippedCount > 0) {
    showToast(`Added ${addedCount} ZIP code(s). ${skippedCount} were skipped.`, 'info');
  } else if (skippedCount > 0) {
    showToast(`Could not add any ZIP codes. ${skippedCount} entries were invalid or duplicates.`, 'error');
  }

  input.value = '';
  input.focus();
}

function removeInofficeZip(btn) {
  btn.closest('[data-zip]').remove();
}

function addHouseCallsZip() {
  const input = document.getElementById('housecalls-zip-input');
  const container = document.getElementById('housecalls-zip-tags');
  const inputValue = input.value.trim();

  if (!inputValue) {
    showToast('Please enter at least one ZIP code', 'error');
    return;
  }

  const zipCodes = inputValue.split(',').map(zip => zip.trim()).filter(zip => zip.length > 0);
  const existingZips = Array.from(container.querySelectorAll('[data-zip]')).map(el => el.getAttribute('data-zip'));
  let addedCount = 0, skippedCount = 0;

  zipCodes.forEach(zipCode => {
    if (!/^\d{5}$/.test(zipCode)) {
      skippedCount++;
      return;
    }
    if (existingZips.includes(zipCode)) {
      skippedCount++;
      return;
    }

    const tag = document.createElement('div');
    tag.setAttribute('data-zip', zipCode);
    tag.className = 'zip-tag';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-remove-item';
    btn.textContent = '×';
    btn.addEventListener('click', (e) => removeHouseCallsZip(e.target));
    tag.textContent = zipCode;
    tag.appendChild(btn);
    container.appendChild(tag);
    existingZips.push(zipCode);
    addedCount++;
  });

  if (addedCount > 0 && skippedCount > 0) {
    showToast(`Added ${addedCount} ZIP code(s). ${skippedCount} were skipped.`, 'info');
  } else if (skippedCount > 0) {
    showToast(`Could not add any ZIP codes. ${skippedCount} entries were invalid or duplicates.`, 'error');
  }

  input.value = '';
  input.focus();
}

function removeHouseCallsZip(btn) {
  btn.closest('[data-zip]').remove();
}


/* ========================================== */
/* 8. CSV IMPORT HANDLER */
/* ========================================== */

function importInofficeZipsFromCsv() {
  const fileInput = document.getElementById('inoffice-csv-import');
  const file = fileInput.files[0];

  if (!file) {
    showToast('Please select a CSV file', 'error');
    return;
  }

  if (!file.type.includes('text') && !file.name.endsWith('.csv')) {
    showToast('Please select a valid CSV file', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const csvContent = e.target.result;
      const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
      
      if (lines.length === 0) {
        showToast('CSV file is empty', 'error');
        return;
      }

      const extractedZips = new Set();
      lines.forEach((line, index) => {
        if (index === 0 && isNaN(line.replace(/[^0-9,]/g, ''))) return;
        const parts = line.split(',').map(part => part.trim());
        parts.forEach(part => {
          const zipMatches = part.match(/\d{5}/g);
          if (zipMatches) zipMatches.forEach(zip => extractedZips.add(zip));
        });
      });

      if (extractedZips.size === 0) {
        showToast('No valid ZIP codes found in CSV.', 'error');
        return;
      }

      const zipString = Array.from(extractedZips).join(', ');
      document.getElementById('inoffice-zip-input').value = zipString;
      addInofficeZip();
      fileInput.value = '';
    } catch (error) {
      showToast('Error parsing CSV file.', 'error');
    }
  };
  reader.readAsText(file);
}

function importHouseCallsZipsFromCsv() {
  const fileInput = document.getElementById('housecalls-csv-import');
  const file = fileInput.files[0];

  if (!file) {
    showToast('Please select a CSV file', 'error');
    return;
  }

  if (!file.type.includes('text') && !file.name.endsWith('.csv')) {
    showToast('Please select a valid CSV file', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const csvContent = e.target.result;
      const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
      
      if (lines.length === 0) {
        showToast('CSV file is empty', 'error');
        return;
      }

      const extractedZips = new Set();
      lines.forEach((line, index) => {
        if (index === 0 && isNaN(line.replace(/[^0-9,]/g, ''))) return;
        const parts = line.split(',').map(part => part.trim());
        parts.forEach(part => {
          const zipMatches = part.match(/\d{5}/g);
          if (zipMatches) zipMatches.forEach(zip => extractedZips.add(zip));
        });
      });

      if (extractedZips.size === 0) {
        showToast('No valid ZIP codes found in CSV.', 'error');
        return;
      }

      const zipString = Array.from(extractedZips).join(', ');
      document.getElementById('housecalls-zip-input').value = zipString;
      addHouseCallsZip();
      fileInput.value = '';
    } catch (error) {
      showToast('Error parsing CSV file.', 'error');
    }
  };
  reader.readAsText(file);
}


/* ========================================== */
/* 9. RADIUS VISUALIZATION */
/* ========================================== */

function updateInofficeRadiusVisualization() {
  clearTimeout(inofficeRadiusDebounceTimer);
  inofficeRadiusDebounceTimer = setTimeout(() => {
    const baseZip = document.getElementById('inoffice-base-zip').value.trim();
    const radius = document.getElementById('inoffice-radius-slider').value;

    if (!baseZip || !/^\d{5}$/.test(baseZip)) return;
    if (baseZip === inofficeLastZip && radius === inofficeLastRadius && serviceRadiusCircle) return;

    if (!coverageMap) initializeCoverageMap();
    
    const geocodeUrl = `https://nominatim.openstreetmap.org/search?postalcode=${baseZip}&country=US&format=json`;
    fetch(geocodeUrl)
      .then(response => response.json())
      .then(data => {
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          
          if (serviceRadiusCircle) {
            coverageMap.removeLayer(serviceRadiusCircle);
            serviceRadiusCircle = null;
          }
          
          const radiusInMeters = parseInt(radius) * 1609.34;
          serviceRadiusCircle = L.circle([lat, lng], {
            color: '#77883e',
            fillColor: '#ebf6e8',
            fillOpacity: 0.4,
            weight: 3,
            radius: radiusInMeters
          }).addTo(coverageMap);
          
          serviceRadiusCenterMarker = L.circleMarker([lat, lng], {
            color: '#77883e',
            fillColor: '#77883e',
            fillOpacity: 1,
            radius: 6,
            weight: 2,
            opacity: 1
          }).addTo(coverageMap);
          
          const bounds = serviceRadiusCircle.getBounds();
          coverageMap.fitBounds(bounds, { padding: [80, 80] });
          
          inofficeLastZip = baseZip;
          inofficeLastRadius = radius;
        } else {
          if (baseZip !== inofficeLastZip) {
            showToast('Could not find location for ZIP code ' + baseZip, 'error');
          }
        }
      })
      .catch(error => {
        if (baseZip !== inofficeLastZip) {
          showToast('Error loading location data.', 'error');
        }
      });
  }, 300);
}

function updateHouseCallsRadiusVisualization() {
  clearTimeout(housecallsRadiusDebounceTimer);
  housecallsRadiusDebounceTimer = setTimeout(() => {
    const baseZip = document.getElementById('housecalls-base-zip').value.trim();
    const radius = document.getElementById('housecalls-radius-slider').value;

    if (!baseZip || !/^\d{5}$/.test(baseZip)) return;
    if (baseZip === housecallsLastZip && radius === housecallsLastRadius && housecallsRadiusCircle) return;

    if (!coverageMap) initializeCoverageMap();
    
    const geocodeUrl = `https://nominatim.openstreetmap.org/search?postalcode=${baseZip}&country=US&format=json`;
    fetch(geocodeUrl)
      .then(response => response.json())
      .then(data => {
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          
          if (housecallsRadiusCircle) {
            coverageMap.removeLayer(housecallsRadiusCircle);
            housecallsRadiusCircle = null;
          }
          
          if (housecallsCenterMarker) {
            coverageMap.removeLayer(housecallsCenterMarker);
            housecallsCenterMarker = null;
          }
          
          const radiusInMeters = parseInt(radius) * 1609.34;
          housecallsRadiusCircle = L.circle([lat, lng], {
            color: '#77883e',
            fillColor: '#ebf6e8',
            fillOpacity: 0.4,
            weight: 3,
            radius: radiusInMeters
          }).addTo(coverageMap);
          
          housecallsCenterMarker = L.circleMarker([lat, lng], {
            color: '#77883e',
            fillColor: '#77883e',
            fillOpacity: 1,
            radius: 6,
            weight: 2,
            opacity: 1
          }).addTo(coverageMap);
          
          const bounds = housecallsRadiusCircle.getBounds();
          coverageMap.fitBounds(bounds, { padding: [80, 80] });
          
          housecallsLastZip = baseZip;
          housecallsLastRadius = radius;
        } else {
          if (baseZip !== housecallsLastZip) {
            showToast('Could not find location for ZIP code ' + baseZip, 'error');
          }
        }
      })
      .catch(error => {
        if (baseZip !== housecallsLastZip) {
          showToast('Error loading location data.', 'error');
        }
      });
  }, 300);
}


/* ========================================== */
/* 10. MAP EVENT LISTENERS */
/* ========================================== */

function setupCoverageMapListeners() {
  const travelCheckboxes = [
    document.getElementById('travel-in-person'),
    document.getElementById('travel-house-calls'),
    document.getElementById('travel-virtual')
  ];
  
  travelCheckboxes.forEach(checkbox => {
    if (checkbox) {
      checkbox.addEventListener('change', handleTravelTypeChange);
    }
  });
}


/* ========================================== */
/* 11. SETTINGS PERSISTENCE */
/* ========================================== */

async function loadCoverageSettings() {
  try {
    const { data: { user }, error: userError } = await window.supabaseClient.auth.getUser();
    if (userError || !user) return;

    const practitionerId = user.id;
    const { data: practitioner, error } = await window.supabaseClient
      .from('practitioners')
      .select('in_person_enabled, in_person_option, in_person_base_zipcode, in_person_radius_miles, in_person_zipcodes, housecalls_enabled, housecalls_option, housecalls_base_zipcode, housecalls_radius_miles, housecalls_zipcodes, virtual_enabled, virtual_option, virtual_states')
      .eq('id', practitionerId)
      .single();

    if (error || !practitioner) return;

    // Load in-person settings
    if (practitioner.in_person_enabled) {
      document.getElementById('travel-in-person').checked = true;
      document.getElementById('inoffice-settings').classList.add('active');
      
      if (practitioner.in_person_option === 'radius') {
        document.getElementById('inoffice-mode-radius').checked = true;
        document.getElementById('inoffice-radius-content').classList.remove('hidden');
        document.getElementById('inoffice-base-zip').value = practitioner.in_person_base_zipcode || '';
        document.getElementById('inoffice-radius-slider').value = practitioner.in_person_radius_miles || 10;
        updateInofficeRadiusDisplay();
      }
    }

    // Load house calls settings
    if (practitioner.housecalls_enabled) {
      document.getElementById('travel-house-calls').checked = true;
      document.getElementById('housecalls-settings').classList.add('active');
      
      if (practitioner.housecalls_option === 'radius') {
        document.getElementById('housecalls-mode-radius').checked = true;
        document.getElementById('housecalls-radius-content').classList.remove('hidden');
        document.getElementById('housecalls-base-zip').value = practitioner.housecalls_base_zipcode || '';
        document.getElementById('housecalls-radius-slider').value = practitioner.housecalls_radius_miles || 10;
        updateHouseCallsRadiusDisplay();
      }
    }

    // Load virtual settings
    if (practitioner.virtual_enabled) {
      document.getElementById('travel-virtual').checked = true;
      document.getElementById('virtualremote-settings').classList.add('active');
      
      if (practitioner.virtual_option === 'nationwide') {
        document.getElementById('virtualremote-mode-nationwide').checked = true;
      } else if (practitioner.virtual_option === 'states') {
        document.getElementById('virtualremote-mode-states').checked = true;
        document.getElementById('virtualremote-states-content').classList.remove('hidden');
      }
    }

    handleTravelTypeChange();
  } catch (error) {
    // Error silently
  }
}

async function saveCoverageSettings() {
  try {
    console.log('[Coverage] Save button clicked, starting save...');
    
    const { data: { user }, error: userError } = await window.supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('[Coverage] Auth error:', userError);
      showToast('Please log in to save coverage settings.', 'error');
      return;
    }

    const practitionerId = user.id;
    console.log('[Coverage] User authenticated:', practitionerId);
    
    const coverageData = {
      in_person_enabled: document.getElementById('travel-in-person')?.checked || false,
      in_person_option: null,
      in_person_base_zipcode: null,
      in_person_radius_miles: null,
      in_person_zipcodes: [],
      housecalls_enabled: document.getElementById('travel-house-calls')?.checked || false,
      housecalls_option: null,
      housecalls_base_zipcode: null,
      housecalls_radius_miles: null,
      housecalls_zipcodes: [],
      virtual_enabled: document.getElementById('travel-virtual')?.checked || false,
      virtual_option: null,
      virtual_states: []
    };

    console.log('[Coverage] Coverage data collected:', coverageData);

    if (coverageData.in_person_enabled) {
      if (document.getElementById('inoffice-mode-radius')?.checked) {
        coverageData.in_person_option = 'radius';
        coverageData.in_person_base_zipcode = document.getElementById('inoffice-base-zip')?.value || null;
        coverageData.in_person_radius_miles = parseInt(document.getElementById('inoffice-radius-slider')?.value) || null;
      } else if (document.getElementById('inoffice-mode-zips')?.checked) {
        coverageData.in_person_option = 'zipcodes';
        const zipTags = document.querySelectorAll('#inoffice-zip-tags [data-zip]');
        coverageData.in_person_zipcodes = Array.from(zipTags).map(tag => tag.getAttribute('data-zip'));
      }
    }

    if (coverageData.housecalls_enabled) {
      if (document.getElementById('housecalls-mode-radius')?.checked) {
        coverageData.housecalls_option = 'radius';
        coverageData.housecalls_base_zipcode = document.getElementById('housecalls-base-zip')?.value || null;
        coverageData.housecalls_radius_miles = parseInt(document.getElementById('housecalls-radius-slider')?.value) || null;
      } else if (document.getElementById('housecalls-mode-zips')?.checked) {
        coverageData.housecalls_option = 'zipcodes';
        const zipTags = document.querySelectorAll('#housecalls-zip-tags [data-zip]');
        coverageData.housecalls_zipcodes = Array.from(zipTags).map(tag => tag.getAttribute('data-zip'));
      }
    }

    if (coverageData.virtual_enabled) {
      if (document.getElementById('virtualremote-mode-nationwide')?.checked) {
        coverageData.virtual_option = 'nationwide';
      } else if (document.getElementById('virtualremote-mode-states')?.checked) {
        coverageData.virtual_option = 'states';
        const stateTags = document.querySelectorAll('#virtualremote-state-tags [data-state]');
        coverageData.virtual_states = Array.from(stateTags).map(tag => tag.getAttribute('data-state'));
      }
    }

    console.log('[Coverage] Final coverage data:', coverageData);

    const { data, error } = await window.supabaseClient
      .from('practitioners')
      .update(coverageData)
      .eq('id', practitionerId);

    if (error) {
      console.error('[Coverage] Database error:', error);
      try {
        showToast('Failed to save coverage settings: ' + error.message, 'error');
      } catch (e) {
        console.error('[Coverage] showToast error:', e);
      }
      return;
    }

    try {
      showToast('Coverage area saved successfully!', 'success');
    } catch (e) {
      console.error('[Coverage] showToast error:', e);
    }
  } catch (error) {
    console.error('[Coverage] Exception error:', error);
    try {
      showToast('An unexpected error occurred: ' + error.message, 'error');
    } catch (e) {
      console.error('[Coverage] showToast error:', e);
    }
  }
}
