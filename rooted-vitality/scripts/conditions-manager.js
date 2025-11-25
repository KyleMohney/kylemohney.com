/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: scripts/conditions-manager.js                               ║
║  Purpose: Dynamic taxonomy loading for practitioner conditions     ║
║  Syncs with client-side taxonomy for proper matching algorithm     ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

FUNCTIONALITY:
- Load all taxonomy categories and subcategories from database
- Dynamically render condition checkboxes from database (not hardcoded)
- Store practitioner conditions as taxonomy subcategory NAMES (not short codes)
- Ensure matching algorithm can compare client & practitioner data correctly
*/

let conditionsManagerData = {
  taxonomy: {},
  selectedConditions: [],
  supabaseClient: null
};

/**
 * Initialize conditions manager
 * Must be called after Supabase client is available
 */
async function initConditionsManager(supabaseClient) {
  try {
    console.log('[Conditions Manager] Initializing...');
    conditionsManagerData.supabaseClient = supabaseClient;
    
    // Load taxonomy from database
    await loadConditionsTaxonomy();
    
    // Render checkboxes after taxonomy is loaded
    renderConditionsCheckboxes();
    
    console.log('[Conditions Manager] ✓ Initialized successfully');
  } catch (error) {
    console.error('[Conditions Manager] Error initializing:', error);
  }
}

/**
 * Load all taxonomy categories and subcategories from database
 */
async function loadConditionsTaxonomy() {
  try {
    console.log('[Conditions Manager] Loading taxonomy from database...');
    
    const { data, error } = await conditionsManagerData.supabaseClient
      .from('holistic_health_taxonomy')
      .select(`
        id,
        category_id,
        name,
        display_order,
        is_active,
        taxonomy_subcategories(id, name, display_order, is_active)
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    // Build taxonomy object keyed by category_id
    conditionsManagerData.taxonomy = {};
    data.forEach(category => {
      conditionsManagerData.taxonomy[category.category_id] = {
        id: category.id,
        name: category.name,
        subcategories: (category.taxonomy_subcategories || [])
          .filter(sub => sub.is_active !== false)
          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      };
    });

    console.log('[Conditions Manager] ✓ Loaded', data.length, 'categories');
    console.log('[Conditions Manager] Taxonomy:', conditionsManagerData.taxonomy);

  } catch (error) {
    console.error('[Conditions Manager] Error loading taxonomy:', error);
    throw error;
  }
}

/**
 * Render conditions checkboxes dynamically from taxonomy
 * This replaces the hardcoded HTML checkboxes
 */
function renderConditionsCheckboxes() {
  try {
    console.log('[Conditions Manager] Rendering checkboxes from taxonomy...');
    
    const container = document.getElementById('conditions-checkboxes-container');
    if (!container) {
      console.warn('[Conditions Manager] Container #conditions-checkboxes-container not found');
      return;
    }

    container.innerHTML = '';

    // Get all subcategories from all categories
    const allSubcategories = [];
    Object.values(conditionsManagerData.taxonomy).forEach(category => {
      category.subcategories.forEach(sub => {
        allSubcategories.push({
          name: sub.name,
          id: sub.id,
          category: category.name
        });
      });
    });

    console.log('[Conditions Manager] Rendering', allSubcategories.length, 'subcategories');

    // Render checkboxes
    allSubcategories.forEach(sub => {
      const label = document.createElement('label');
      label.className = 'checkbox-label conditions-checkbox';
      label.innerHTML = `
        <input 
          type="checkbox" 
          name="condition" 
          value="${escapeHtml(sub.name)}"
          class="condition-input"
          data-subcategory-id="${sub.id}"
          data-category="${escapeHtml(sub.category)}"
        >
        <span>${escapeHtml(sub.name)}</span>
      `;
      
      // Add change listener
      const checkbox = label.querySelector('input');
      checkbox.addEventListener('change', onConditionChanged);
      
      container.appendChild(label);
    });

    console.log('[Conditions Manager] ✓ Rendered checkboxes');

  } catch (error) {
    console.error('[Conditions Manager] Error rendering checkboxes:', error);
  }
}

/**
 * Handle condition checkbox change
 * Builds list of selected subcategory names
 */
function onConditionChanged(e) {
  try {
    const checkboxes = document.querySelectorAll('input[name="condition"]:checked');
    conditionsManagerData.selectedConditions = Array.from(checkboxes).map(cb => cb.value);
    
    console.log('[Conditions Manager] Selected conditions updated:', conditionsManagerData.selectedConditions);
    
    // Trigger any custom event if needed
    window.dispatchEvent(new CustomEvent('conditionsUpdated', { 
      detail: { conditions: conditionsManagerData.selectedConditions }
    }));
    
  } catch (error) {
    console.error('[Conditions Manager] Error handling condition change:', error);
  }
}

/**
 * Get currently selected condition names
 * @returns {string[]} Array of subcategory names
 */
function getSelectedConditions() {
  return [...conditionsManagerData.selectedConditions];
}

/**
 * Set selected conditions (for loading existing data)
 * @param {string[]} conditionNames - Array of subcategory names
 */
function setSelectedConditions(conditionNames) {
  try {
    console.log('[Conditions Manager] Setting selected conditions:', conditionNames);
    
    // Clear all checkboxes
    const allCheckboxes = document.querySelectorAll('input[name="condition"]');
    allCheckboxes.forEach(cb => cb.checked = false);

    // Check boxes that match the names
    allCheckboxes.forEach(cb => {
      if (conditionNames.includes(cb.value)) {
        cb.checked = true;
      }
    });

    conditionsManagerData.selectedConditions = [...conditionNames];
    
    console.log('[Conditions Manager] ✓ Selected conditions set');

  } catch (error) {
    console.error('[Conditions Manager] Error setting selected conditions:', error);
  }
}

/**
 * Clear all selected conditions
 */
function clearSelectedConditions() {
  try {
    const allCheckboxes = document.querySelectorAll('input[name="condition"]');
    allCheckboxes.forEach(cb => cb.checked = false);
    conditionsManagerData.selectedConditions = [];
    console.log('[Conditions Manager] ✓ Cleared all selections');
  } catch (error) {
    console.error('[Conditions Manager] Error clearing conditions:', error);
  }
}

/**
 * Validate that at least one condition is selected
 */
function validateConditionsSelected() {
  return conditionsManagerData.selectedConditions.length > 0;
}

/**
 * HTML escape utility for safe display
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Export functions for use in other scripts
if (typeof window !== 'undefined') {
  window.conditionsManager = {
    init: initConditionsManager,
    render: renderConditionsCheckboxes,
    getSelected: getSelectedConditions,
    setSelected: setSelectedConditions,
    clear: clearSelectedConditions,
    validate: validateConditionsSelected,
    loadTaxonomy: loadConditionsTaxonomy
  };
}

console.log('[Conditions Manager] Script loaded');
























































