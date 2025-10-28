// Prompt Library JavaScript - prompts.js
// Dynamic content loading and filtering for enterprise AI coordination prompts

let promptsData = [];
let filteredPrompts = [];

// Color mapping for tiers (system prompt rules)
const tierColors = {
    'strategic': '#8B5CF6', // purple
    'operational': '#3B82F6', // blue
    'financial': '#10B981', // green
    'rd': '#F59E0B', // yellow-orange (R&D)
    'technical': '#6B7280', // gray
    'lifestyle': '#F97316', // orange-red
    'hr': '#DC2626' // HR (red)
};
// Color mapping for complexity
const complexityColors = {
    3: '#DC2626', // Expert (red)
    2: '#F59E0B', // Intermediate (orange)
    1: '#10B981'  // Standard (green)
};

// Define the desired tier order for grouping
const tierOrder = ['strategic', 'operational', 'financial', 'rd', 'technical', 'lifestyle', 'hr'];

// Initialize the prompt library
async function initPromptLibrary() {
    try {
        // Load prompts data
        const response = await fetch('./prompts-data.json');
        promptsData = await response.json();
        filteredPrompts = [...promptsData];
        
        // Render initial prompts
        renderPrompts();
        
        // Setup event listeners
        setupEventListeners();
        
    } catch (error) {
        console.error('Error loading prompts:', error);
        document.getElementById('prompts-grid').innerHTML = 
            '<div class="col-span-3 text-center text-red-500">Error loading prompts. Please try again.</div>';
    }
}

// Setup all event listeners
function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('search-prompts');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    // Complexity dropdown
    const complexitySelect = document.getElementById('complexity-filter');
    if (complexitySelect) {
        complexitySelect.addEventListener('change', handleComplexityFilter);
    }
    // Filter buttons
    document.querySelectorAll('[data-filter]').forEach(button => {
        button.addEventListener('click', handleFilter);
    });

    // Show/hide HR section description on filter
    document.querySelectorAll('[data-filter]').forEach(button => {
        button.addEventListener('click', function(e) {
            const filterValue = e.target.getAttribute('data-filter');
            const hrDesc = document.getElementById('hr-section-description');
            if (hrDesc) {
                if (filterValue === 'hr') {
                    hrDesc.style.display = 'block';
                } else {
                    hrDesc.style.display = 'none';
                }
            }
        });
    });
}

// Handle complexity filter change
function handleComplexityFilter() {
    applyFilters();
}

// Handle search input
function handleSearch(event) {
    applyFilters();
}

// Handle filter button clicks
function handleFilter(event) {
    const filterValue = event.target.getAttribute('data-filter');
    document.querySelectorAll('[data-filter]').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    applyFilters();
}

// Apply all filters: search, tier, and complexity
function applyFilters() {
    const searchInput = document.getElementById('search-prompts');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const activeFilterBtn = document.querySelector('[data-filter].active');
    const tier = activeFilterBtn ? activeFilterBtn.getAttribute('data-filter') : 'all';
    const complexitySelect = document.getElementById('complexity-filter');
    const complexity = complexitySelect ? complexitySelect.value : 'all';
    filteredPrompts = promptsData.filter(prompt => {
        // Tier filter
        const tierMatch = (tier === 'all') || (prompt.tier === tier);
        // Complexity filter
        const complexityMatch = (complexity === 'all') || (String(prompt.complexity) === complexity);
        // Search filter
        const searchMatch =
            prompt.title.toLowerCase().includes(searchTerm) ||
            prompt.description.toLowerCase().includes(searchTerm) ||
            prompt.tags.some(tag => tag.toLowerCase().includes(searchTerm));
        return tierMatch && complexityMatch && searchMatch;
    });
    // Show/hide HR section description if filter is set to HR
    const hrDesc = document.getElementById('hr-section-description');
    if (hrDesc) {
        if (tier === 'hr') {
            hrDesc.style.display = 'block';
        } else {
            hrDesc.style.display = 'none';
        }
    }
    renderPrompts();
}

// Render prompts to the grid
function renderPrompts() {
    const grid = document.getElementById('prompts-grid');
    if (filteredPrompts.length === 0) {
        grid.innerHTML = `
            <div class="col-span-3 text-center py-12">
                <div class="text-gray-400 text-lg">No prompts found matching your criteria.</div>
                <button onclick="clearFilters()" class="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Clear Filters
                </button>
            </div>
        `;
        return;
    }
    // Sort prompts by tier order for grouped display
    const sortedPrompts = [...filteredPrompts].sort((a, b) => {
        const aIdx = tierOrder.indexOf(a.tier);
        const bIdx = tierOrder.indexOf(b.tier);
        return aIdx - bIdx;
    });
    grid.innerHTML = sortedPrompts.map(prompt => createPromptCard(prompt)).join('');
}

// Create individual prompt card HTML
function createPromptCard(prompt) {
    const tierColor = tierColors[prompt.tier] || '#6B7280';
    // Render complexity dots with correct color
    let complexityDots = '';
    for (let i = 1; i <= 3; i++) {
        if (i <= prompt.complexity) {
            complexityDots += `<span style='color:${complexityColors[prompt.complexity]}; font-size:1.1em;'>&#9679;</span>`;
        } else {
            complexityDots += `<span style='color:#e5e7eb; font-size:1.1em;'>&#9679;</span>`;
        }
    }
    return `
        <div style="background:#fff; border:1.5px solid #e5e7eb; border-radius:16px; box-shadow:0 2px 12px #1e293b18; margin:0; padding:24px 20px 18px 20px; transition:box-shadow 0.2s,transform 0.2s; min-height:260px; display:flex; flex-direction:column; justify-content:space-between; position:relative;">
            <div style="position:absolute; left:0; top:0; height:100%; width:6px; background:${tierColor}; border-radius:16px 0 0 16px;"></div>
            <div style="margin-left:16px;">
                <h3 style="font-size:1.18em; font-weight:700; color:#18181b; margin-bottom:6px;">${prompt.title}</h3>
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
                    <span style="padding:2px 12px; font-size:0.92em; font-weight:600; border-radius:8px; color:#fff; background:${tierColor}; letter-spacing:0.5px;">${prompt.tier.toUpperCase()}</span>
                    <span style="font-size:0.98em; font-weight:500;">Complexity: ${complexityDots}</span>
                </div>
                <p style="color:#444; font-size:1em; margin-bottom:10px; line-height:1.5;">${prompt.description}</p>
                <div style="margin-bottom:8px;">
                    <span style="font-size:0.98em; font-weight:600; color:#222;">Variables:</span>
                    <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:2px;">
                        ${prompt.variables.map(variable => 
                            `<code style='padding:2px 7px; background:#f3f4f6; color:#222; border-radius:6px; font-size:0.93em; font-family:monospace;'>[${variable}]</code>`
                        ).join('')}
                    </div>
                </div>
                <div style="margin-bottom:8px; display:flex; flex-wrap:wrap; gap:6px;">
                    ${prompt.tags.map(tag => 
                        `<span style='padding:2px 7px; background:#f1f5f9; color:#555; border-radius:6px; font-size:0.93em;'>#${tag}</span>`
                    ).join('')}
                </div>
            </div>
            <div style="display:flex; gap:8px; margin-top:10px;">
                <button onclick="viewPrompt('${prompt.id}')" style="flex:1; padding:7px 0; background:#f3f4f6; color:#222; border:none; border-radius:7px; font-size:0.98em; font-weight:600; cursor:pointer; transition:background 0.2s;">View Prompt</button>
                <button onclick="copyPrompt('${prompt.id}')" style="padding:7px 18px; background:#f3f4f6; color:#222; border:none; border-radius:7px; font-size:0.98em; font-weight:600; cursor:pointer; transition:background 0.2s;">Copy</button>
                <button onclick="customizePrompt('${prompt.id}')" style="padding:7px 18px; background:#f3f4f6; color:#222; border:none; border-radius:7px; font-size:0.98em; font-weight:600; cursor:pointer; transition:background 0.2s;">Customize</button>
            </div>
        </div>
    `;
}

// View prompt in modal
function viewPrompt(promptId) {
    const prompt = promptsData.find(p => p.id === promptId);
    if (!prompt) return;
    // Create unique modal ID
    const modalId = `modal-${Date.now()}`;
    // Create modal
    const modal = document.createElement('div');
    modal.id = modalId;
    modal.setAttribute('style', 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.55); z-index:9999; display:flex; align-items:center; justify-content:center; padding:16px;');
    modal.innerHTML = `
        <div id="${modalId}-content" style="background:#fff; border-radius:18px; max-width:600px; width:100%; max-height:90vh; overflow-y:auto; box-shadow:0 8px 32px rgba(0,0,0,0.18); position:relative;">
            <div style="padding:32px 28px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:18px;">
                    <h2 style="font-size:1.35em; font-weight:800; color:#18181b;">${prompt.title}</h2>
                    <button id="${modalId}-close-btn" style="background:none; border:none; color:#64748b; font-size:2em; font-weight:700; cursor:pointer; line-height:1;">×</button>
                </div>
                <div style="margin-bottom:12px;">
                    <span style="padding:4px 14px; font-size:0.98em; font-weight:600; border-radius:8px; color:#fff; background:${tierColors[prompt.tier]}; letter-spacing:0.5px;">${prompt.tier.toUpperCase()}</span>
                </div>
                <p style="color:#444; margin-bottom:18px;">${prompt.description}</p>
                <div style="background:#f3f4f6; border-radius:10px; padding:18px 14px; margin-bottom:18px;">
                    <h3 style="font-size:1.08em; font-weight:700; margin-bottom:8px; color:#18181b;">Prompt:</h3>
                    <pre style="white-space:pre-wrap; font-size:1em; color:#222; line-height:1.5;">${prompt.prompt}</pre>
                </div>
                <div style="display:flex; gap:10px; padding-top:8px;">
                    <button id="${modalId}-copy-btn" style="flex:1; padding:10px 0; background:#3b82f6; color:#fff; border:none; border-radius:7px; font-size:1em; font-weight:600; cursor:pointer;">Copy Prompt</button>
                    <button id="${modalId}-close-btn2" style="padding:10px 24px; background:#f3f4f6; color:#222; border:none; border-radius:7px; font-size:1em; font-weight:600; cursor:pointer;">Close</button>
                </div>
            </div>
        </div>
    `;
    // Prevent modal content from closing modal
    modal.querySelector(`#${modalId}-content`).addEventListener('click', e => e.stopPropagation());
    // Close buttons
    modal.querySelector(`#${modalId}-close-btn`).onclick = () => document.getElementById(modalId).remove();
    modal.querySelector(`#${modalId}-close-btn2`).onclick = () => document.getElementById(modalId).remove();
    // Copy button
    modal.querySelector(`#${modalId}-copy-btn`).onclick = () => copyPromptText(prompt.id);
    // Overlay click closes modal
    modal.onclick = () => document.getElementById(modalId).remove();
    document.body.appendChild(modal);
}

// Copy prompt to clipboard
function copyPrompt(promptId) {
    const prompt = promptsData.find(p => p.id === promptId);
    if (!prompt) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(prompt.prompt).then(() => {
            showNotification('Prompt copied to clipboard!');
        }).catch(() => {
            fallbackCopyTextToClipboard(prompt.prompt);
        });
    } else {
        fallbackCopyTextToClipboard(prompt.prompt);
    }
}
function fallbackCopyTextToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
        document.execCommand('copy');
        showNotification('Prompt copied to clipboard!');
    } catch (err) {
        alert('Copy not supported in this browser.');
    }
    document.body.removeChild(textarea);
}

// Copy prompt text from modal
function copyPromptText(promptId) {
    const prompt = promptsData.find(p => p.id === promptId);
    if (!prompt) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(prompt.prompt).then(() => {
            showNotification('Prompt copied to clipboard!');
            closeModal();
        }).catch(() => {
            fallbackCopyTextToClipboard(prompt.prompt);
            closeModal();
        });
    } else {
        fallbackCopyTextToClipboard(prompt.prompt);
        closeModal();
    }
}

// Show notification for copy success
function showNotification(message) {
    let notif = document.createElement('div');
    notif.textContent = message;
    notif.style.position = 'fixed';
    notif.style.bottom = '32px';
    notif.style.left = '50%';
    notif.style.transform = 'translateX(-50%)';
    notif.style.background = '#10B981';
    notif.style.color = '#fff';
    notif.style.padding = '14px 32px';
    notif.style.borderRadius = '10px';
    notif.style.fontWeight = '700';
    notif.style.fontSize = '1.08em';
    notif.style.boxShadow = '0 2px 12px #1e293b22';
    notif.style.zIndex = 9999;
    notif.style.opacity = '0.98';
    document.body.appendChild(notif);
    setTimeout(() => {
        notif.style.transition = 'opacity 0.4s';
        notif.style.opacity = '0';
        setTimeout(() => notif.remove(), 400);
    }, 1600);
}

// Close modal
function closeModal() {
    const modal = document.querySelector('.fixed.inset-0');
    if (modal) {
        modal.remove();
    }
}

// Clear all filters
function clearFilters() {
    // Reset search
    const searchInput = document.getElementById('search-prompts');
    if (searchInput) {
        searchInput.value = '';
    }
    // Reset filter buttons
    document.querySelectorAll('[data-filter]').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector('[data-filter="all"]').classList.add('active');
    // Reset complexity
    const complexitySelect = document.getElementById('complexity-filter');
    if (complexitySelect) {
        complexitySelect.value = 'all';
    }
    // Reset data
    filteredPrompts = [...promptsData];
    renderPrompts();
}

// Add customize prompt functionality
function customizePrompt(promptId) {
    const prompt = promptsData.find(p => p.id === promptId);
    if (!prompt) return;
    // Create unique modal ID
    const modalId = `modal-${Date.now()}`;
    // Create customization modal
    const modal = document.createElement('div');
    modal.id = modalId;
    modal.setAttribute('style', 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.55); z-index:9999; display:flex; align-items:center; justify-content:center; padding:16px;');
    modal.innerHTML = `
        <div id="${modalId}-content" style="background:#fff; border-radius:18px; max-width:600px; width:100%; max-height:90vh; overflow-y:auto; box-shadow:0 8px 32px rgba(0,0,0,0.18); position:relative;">
            <div style="padding:32px 28px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:18px;">
                    <h2 style="font-size:1.2em; font-weight:800; color:#18181b;">Customize: ${prompt.title}</h2>
                    <button id="${modalId}-close-btn" style="background:none; border:none; color:#64748b; font-size:2em; font-weight:700; cursor:pointer; line-height:1;">×</button>
                </div>
                <div style="margin-bottom:18px;">
                    <h3 style="font-size:1.08em; font-weight:700; margin-bottom:8px; color:#18181b;">Variables to Customize:</h3>
                    <div style="display:flex; flex-direction:column; gap:10px;">
                        ${prompt.variables.map(variable => `
                            <div>
                                <label style='display:block; font-size:0.98em; font-weight:600; color:#222; margin-bottom:3px;'>[${variable}]</label>
                                <input type="text" id="var-${variable}" style="width:100%; padding:8px 10px; border:1.5px solid #c7d2fe; border-radius:7px; font-size:1em; font-family:monospace; background:#f8fafc; color:#222;" placeholder="Enter ${variable.toLowerCase()}...">
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div style="background:#f3f4f6; border-radius:10px; padding:18px 14px; margin-bottom:18px;">
                    <h3 style="font-size:1.08em; font-weight:700; margin-bottom:8px; color:#18181b;">Preview:</h3>
                    <pre id="customized-prompt" style="white-space:pre-wrap; font-size:1em; color:#222; line-height:1.5;">${prompt.prompt}</pre>
                </div>
                <div style="display:flex; gap:10px; padding-top:8px;">
                    <button id="${modalId}-copy-btn" style="flex:1; padding:10px 0; background:#3b82f6; color:#fff; border:none; border-radius:7px; font-size:1em; font-weight:600; cursor:pointer;">Copy Customized Prompt</button>
                    <button id="${modalId}-update-btn" style="padding:10px 24px; background:#F97316; color:#fff; border:none; border-radius:7px; font-size:1em; font-weight:600; cursor:pointer;">Update Preview</button>
                    <button id="${modalId}-close-btn2" style="padding:10px 24px; background:#f3f4f6; color:#222; border:none; border-radius:7px; font-size:1em; font-weight:600; cursor:pointer;">Close</button>
                </div>
            </div>
        </div>
    `;
    // Prevent modal content from closing modal
    modal.querySelector(`#${modalId}-content`).addEventListener('click', e => e.stopPropagation());
    // Close buttons
    modal.querySelector(`#${modalId}-close-btn`).onclick = () => document.getElementById(modalId).remove();
    modal.querySelector(`#${modalId}-close-btn2`).onclick = () => document.getElementById(modalId).remove();
    // Copy button
    modal.querySelector(`#${modalId}-copy-btn`).onclick = () => copyCustomizedPrompt(prompt.id);
    // Update button
    modal.querySelector(`#${modalId}-update-btn`).onclick = () => updatePreview(prompt.id);
    // Overlay click closes modal
    modal.onclick = () => document.getElementById(modalId).remove();
    document.body.appendChild(modal);
    // Add real-time preview updates
    prompt.variables.forEach(variable => {
        const input = document.getElementById(`var-${variable}`);
        if (input) {
            input.addEventListener('input', () => updatePreview(prompt.id));
        }
    });
}

// Update preview with customized variables
function updatePreview(promptId) {
    const prompt = promptsData.find(p => p.id === promptId);
    if (!prompt) return;
    
    let customizedPrompt = prompt.prompt;
    
    prompt.variables.forEach(variable => {
        const input = document.getElementById(`var-${variable}`);
        if (input && input.value.trim()) {
            const regex = new RegExp(`\\[${variable}\\]`, 'g');
            customizedPrompt = customizedPrompt.replace(regex, input.value.trim());
        }
    });
    
    const preview = document.getElementById('customized-prompt');
    if (preview) {
        preview.textContent = customizedPrompt;
    }
}

// Copy customized prompt
function copyCustomizedPrompt(promptId) {
    const prompt = promptsData.find(p => p.id === promptId);
    if (!prompt) return;
    let customizedPrompt = prompt.prompt;
    prompt.variables.forEach(variable => {
        const input = document.getElementById(`var-${variable}`);
        if (input && input.value.trim()) {
            const regex = new RegExp(`\[${variable}\]`, 'g');
            customizedPrompt = customizedPrompt.replace(regex, input.value.trim());
        }
    });
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(customizedPrompt).then(() => {
            showNotification('Customized prompt copied to clipboard!');
            closeModal();
        }).catch(() => {
            fallbackCopyTextToClipboard(customizedPrompt);
            closeModal();
        });
    } else {
        fallbackCopyTextToClipboard(customizedPrompt);
        closeModal();
    }
}

// Expose functions for inline onclick
window.viewPrompt = viewPrompt;
window.copyPrompt = copyPrompt;
window.customizePrompt = customizePrompt;
window.closeModal = closeModal;
window.copyPromptText = copyPromptText;
window.copyCustomizedPrompt = copyCustomizedPrompt;
window.updatePreview = updatePreview;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initPromptLibrary);