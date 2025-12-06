


/*
╔════════════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                                     ║
║  File: dashboard/pro/scripts/proOpportunitiesManager.js                    ║
║  Purpose: Practitioner Opportunities Management                            ║
║  - Display opportunities from open-to-match clients                        ║
║  - 1-message-only messaging from opportunities                             ║
║  - Decline and Block functionality                                         ║
║  Holistic Wellness · Modern Connection Platform                            ║
║  rootedvitality.com | 2025                                                 ║
╚════════════════════════════════════════════════════════════════════════════╝
*/

let supabaseClient;
let authManager;
let currentPractitioner = null;
let opportunities = [];
let selectedOpportunity = null;document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Initialize Supabase and Auth
    supabaseClient = window.supabaseClient;
    authManager = window.authManager;

    if (!supabaseClient || !authManager) {
      console.error('[Pro Opportunities] Supabase or Auth not initialized');
      return;
    }

    const currentUser = authManager.getCurrentUser();
    if (!currentUser) {

      return;
    }

    // Load practitioner profile
    const { data: practitionerData, error: practError } = await supabaseClient
      .from('practitioners')
      .select('id, serial_number, legal_name')
      .eq('id', currentUser.id)
      .single();

    if (practError) {
      console.error('[Pro Opportunities] Error loading practitioner:', practError);
      return;
    }

    currentPractitioner = practitionerData;


    // Set up sidebar tab switching
    setupTabSwitching();

    // Load opportunities
    await loadOpportunities();

    // Set up event listeners
    setupEventListeners();

  } catch (error) {
    console.error('[Pro Opportunities] Initialization error:', error);
  }
});

/**
 * Setup sidebar tab switching for New Clients vs Opportunities
 */
function setupTabSwitching() {
  const tabs = document.querySelectorAll('.sidebar-tab');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const target = tab.getAttribute('data-tab');
      
      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Show corresponding list
      const newClientsList = document.getElementById('new-clients');
      const opportunitiesList = document.getElementById('opportunities');
      
      if (target === 'new-clients') {
        newClientsList.style.display = 'flex';
        opportunitiesList.style.display = 'none';
      } else if (target === 'opportunities') {
        newClientsList.style.display = 'none';
        opportunitiesList.style.display = 'flex';
      }

    });
  });
}

/**
 * Load opportunities from open-to-match clients with active projects
 * Uses smart matching: shows projects where practitioner's settings match the project requirements
 */
async function loadOpportunities() {
  try {
    // First, load practitioner's match settings
    const { data: matchSettings, error: settingsError } = await supabaseClient
      .from('practitioners')
      .select(`
        service_category_ids,
        service_subcategory_names,
        in_person_enabled,
        virtual_enabled,
        housecalls_enabled,
        in_person_base_zipcode,
        in_person_radius_miles,
        virtual_states,
        housecalls_base_zipcode,
        housecalls_radius_miles,
        matching_enabled,
        matching_paused
      `)
      .eq('id', currentPractitioner.id)
      .single();

    if (settingsError) {
      console.error('[Pro Opportunities] Error loading match settings:', settingsError);
      showToast('Error loading match settings', 'error');
      return;
    }

    // If matching is disabled or paused, show empty state
    if (!matchSettings?.matching_enabled || matchSettings?.matching_paused) {
      renderOpportunities([]);
      return;
    }

    // Get all open projects (pending status) with client details
      const { data: allProjects, error: projectsError } = await supabaseClient
      .from('projects')
      .select(`
        id,
        project_serial,
        client_serial,
        client_id,
        client_first_name,
        client_last_name,
        category_id,
        category_name,
        subcategory_name,
        custom_name,
        description,
        zipcode,
        city,
        state,
        travel_preference,
        urgency,
        project_status,
        created_at
      `)
      .eq('project_status', 'pending')
      .order('created_at', { ascending: false });

    if (projectsError) {
      console.error('[Pro Opportunities] Error loading projects:', projectsError);
      showToast('Error loading opportunities', 'error');
      return;
    }

    // Projects table already has client_first_name and client_last_name denormalized
    const flatProjects = allProjects || [];    // Get clients that are open_to_match
    const { data: openToMatchClients } = await supabaseClient
      .from('clients')
      .select('id')
      .eq('open_to_match', true);

    const openToMatchClientIds = new Set((openToMatchClients || []).map(c => c.id));

    if (!flatProjects || flatProjects.length === 0) {
      renderOpportunities([]);
      return;
    }

    // Get practitioner's existing matches to exclude
    // IMPORTANT: Only exclude matches that are ACTIVE, IN-PROGRESS, or HIRED
    // Pending matches should still show as opportunities since they haven't been accepted yet
    const { data: existingMatches } = await supabaseClient
      .from('project_practitioner_matches')
      .select('project_serial')
      .eq('practitioner_serial', currentPractitioner.serial_number)
      .in('status', ['active', 'in-progress', 'hired']);

    const matchedProjectSerials = new Set((existingMatches || []).map(m => m.project_serial));

    // ALSO get pending matches - these should NOT appear in opportunities tab
    // They appear in the "New Clients" tab instead
    const { data: pendingMatches } = await supabaseClient
      .from('project_practitioner_matches')
      .select('project_serial')
      .eq('practitioner_serial', currentPractitioner.serial_number)
      .eq('status', 'pending');

    const pendingProjectSerials = new Set((pendingMatches || []).map(m => m.project_serial));

    // ALSO get declined matches - these should NOT reappear in opportunities tab
    const { data: declinedMatches } = await supabaseClient
      .from('project_practitioner_matches')
      .select('project_serial')
      .eq('practitioner_serial', currentPractitioner.serial_number)
      .eq('status', 'declined');

    const declinedProjectSerials = new Set((declinedMatches || []).map(m => m.project_serial));

    // Get practitioner's blocked clients
    const { data: blockedClients } = await supabaseClient
      .from('practitioner_blocks')
      .select('client_serial')
      .eq('practitioner_serial', currentPractitioner.serial_number)
      .eq('is_blocked', true);

    const blockedClientSerials = new Set((blockedClients || []).map(b => b.client_serial));

    // Map category slugs to UUIDs for comparison
    const categorySlugToUuid = {
      'midwifery': '900f680e-15e1-4ce1-95df-6c5e2cd10d6a',
      'acupuncture': '17d4d957-905e-411a-9b4d-1165a9940b4f',
      'chiropractic': '88e8ef68-ea5c-4ef5-af89-53f08502845a'
    };

    // Smart filter: keep only projects that match practitioner's settings
    const filteredProjects = flatProjects.filter(project => {
      // Exclude if already matched (active/in-progress/hired)
      if (matchedProjectSerials.has(project.project_serial)) {
        console.log('[Pro Opp Debug] Project', project.project_serial, 'already matched');
        return false;
      }
      // Exclude if pending match exists
      if (pendingProjectSerials.has(project.project_serial)) {
        console.log('[Pro Opp Debug] Project', project.project_serial, 'has pending match');
        return false;
      }
      // Exclude if already declined
      if (declinedProjectSerials.has(project.project_serial)) {
        console.log('[Pro Opp Debug] Project', project.project_serial, 'already declined');
        return false;
      }

      // Exclude if client is blocked
      if (blockedClientSerials.has(project.client_serial)) {
        console.log('[Pro Opp Debug] Project', project.project_serial, 'client is blocked');
        return false;
      }

      // Exclude if client is not open to match
      if (!openToMatchClientIds.has(project.client_id)) {
        console.log('[Pro Opp Debug] Project', project.project_serial, 'client not open to match. open_to_match IDs:', Array.from(openToMatchClientIds), 'project client_id:', project.client_id);
        return false;
      }

      // Check if practitioner's service categories match project category
      const practitionerCategories = matchSettings?.service_category_ids || [];
      const projectCategoryUuid = categorySlugToUuid[project.category_id] || project.category_id;
      if (!practitionerCategories.includes(projectCategoryUuid)) {
        console.log('[Pro Opp Debug] Project', project.project_serial, 'category mismatch. Practitioner:', practitionerCategories, 'Project:', projectCategoryUuid);
        return false;
      }

      // Check subcategory match (if project has subcategories specified)
      if (project.subcategory_name && project.subcategory_name.trim()) {
        const projectSubcategories = project.subcategory_name.split(',').map(s => s.trim());
        const practitionerSubcategories = matchSettings?.service_subcategory_names || [];
        const hasMatchingSubcategory = projectSubcategories.some(sub => 
          practitionerSubcategories.includes(sub)
        );
        if (!hasMatchingSubcategory) {
          return false;
        }
      }

      // Parse travel preferences - handle flexible option
      const travelPrefs = (project.travel_preference || 'flexible').split(',').map(p => p.trim().toLowerCase());
      const normalizedPrefs = new Set(
        travelPrefs.map(p => 
          p === 'in_person' ? 'in-person' : p
        )
      );

      // FLEXIBLE: practitioner must offer at least ONE delivery method and matching location
      if (normalizedPrefs.has('flexible')) {
        const hasInPerson = matchSettings?.in_person_enabled && 
          isWithinZipcodeRadius(project.zipcode, matchSettings.in_person_base_zipcode, matchSettings.in_person_radius_miles);
        
        const hasHousecalls = matchSettings?.housecalls_enabled &&
          isWithinZipcodeRadius(project.zipcode, matchSettings.housecalls_base_zipcode, matchSettings.housecalls_radius_miles);
        
        const hasVirtual = matchSettings?.virtual_enabled && 
          (!matchSettings.virtual_states || matchSettings.virtual_states.includes(project.state));
        
        if (!hasInPerson && !hasHousecalls && !hasVirtual) {
          return false;
        }
      } else {
        // Specific travel preferences - ALL must match
        
        // If project requires in-person, practitioner must offer it in that area
        if (normalizedPrefs.has('in-person')) {
          if (!matchSettings?.in_person_enabled) {
            return false;
          }
          if (!isWithinZipcodeRadius(project.zipcode, matchSettings.in_person_base_zipcode, matchSettings.in_person_radius_miles)) {
            return false;
          }
        }

        // If project requires virtual, practitioner must offer it in that state
        if (normalizedPrefs.has('virtual') || normalizedPrefs.has('remote')) {
          if (!matchSettings?.virtual_enabled) {
            return false;
          }
          // Virtual with no state restrictions OR state matches
          if (matchSettings.virtual_states && !matchSettings.virtual_states.includes(project.state)) {
            return false;
          }
        }

        // If project requires housecalls, practitioner must offer it in that area
        if (normalizedPrefs.has('housecalls') || normalizedPrefs.has('house_calls')) {
          if (!matchSettings?.housecalls_enabled) {
            return false;
          }
          if (!isWithinZipcodeRadius(project.zipcode, matchSettings.housecalls_base_zipcode, matchSettings.housecalls_radius_miles)) {
            return false;
          }
        }
      }

      return true;
    });

    opportunities = filteredProjects;
    renderOpportunities();

  } catch (error) {
    console.error('[Pro Opportunities] Error loading opportunities:', error);
    showToast('Failed to load opportunities', 'error');
  }
}

/**
 * Helper: Check if a zipcode is within radius of base zipcode
 * Note: This is a simplified check - ideally would use actual distance calculation
 */
function isWithinZipcodeRadius(projectZip, baseZip, radiusMiles) {
  // If no base zip or radius set, can't verify coverage
  if (!baseZip || !radiusMiles) {
    return false;
  }
  
  // For now, do simple prefix match (e.g., 44101 matches 441xx within ~30 miles)
  // In production, would use proper zipcode distance library
  const basePrefix = baseZip.substring(0, 3);
  const projectPrefix = projectZip?.substring(0, 3);
  
  // If same prefix, likely within reasonable distance
  if (basePrefix === projectPrefix) {
    return true;
  }
  
  // Could be adjacent prefixes depending on radius - for safety, allow 1 prefix difference for large radius
  if (radiusMiles >= 30) {
    const basePrefixNum = parseInt(basePrefix);
    const projectPrefixNum = parseInt(projectPrefix);
    if (Math.abs(basePrefixNum - projectPrefixNum) <= 1) {
      return true;
    }
  }
  
  return false;
}

/**
 * Render opportunities cards (now rendering matched projects)
 */
function renderOpportunities() {
  const container = document.getElementById('opportunities');
  
  if (!container) {
    console.error('[Pro Opportunities] Container not found');
    return;
  }

  console.log('[Pro Opportunities] Rendering', opportunities.length, 'opportunities');
  console.log('[Pro Opportunities] First opportunity:', opportunities[0]);

  if (opportunities.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No Opportunities Available</h3>
        <p>No clients matching your services are currently open to opportunities. Check back soon!</p>
      </div>
    `;
    return;
  }

  const htmlCards = opportunities.map(project => {
    console.log('[Pro Opportunities] Rendering card for project:', project.project_serial, 'client:', project.client_first_name, project.client_last_name);
    const clientName = `${project.client_first_name || 'Unknown'} ${project.client_last_name || 'Client'}`;
    const avatar = project.client_first_name?.charAt(0).toUpperCase() || 'C';

    const html = `
      <div class="client-card" data-project-id="${project.id}" data-project-serial="${project.project_serial}">
        <div class="card-header">
          <div class="client-avatar">${avatar}</div>
          <div class="client-info">
            <h3 class="client-name">${clientName}</h3>
            <p class="client-service">${project.category_name || 'Wellness Support'}</p>
            <p class="client-meta">
              <strong>Urgency:</strong> ${project.urgency || 'Standard'} • 
              <strong>Posted:</strong> ${formatDate(project.created_at)}
            </p>
          </div>
        </div>
        
        <div class="message-preview-box">
          <p class="message-text">${project.description || 'Client seeking wellness support'}</p>
        </div>
        
        <div class="match-details">
          <span class="match-detail-item">
            <span class="match-detail-label">Project:</span>
            ${project.custom_name || 'Wellness Journey'}
          </span>
          <span class="match-detail-item">
            <span class="match-detail-label">Service Type:</span>
            ${(project.travel_preference || 'In-person/Virtual').split(',').map(p => p.trim()).join(', ')}
          </span>
          <span class="match-detail-item">
            <span class="match-detail-label">Location:</span>
            ${project.city}, ${project.state} ${project.zipcode}
          </span>
        </div>
        
        <div class="card-actions">
          <button class="btn-accent opp-message-btn" data-project-id="${project.id}">
            Send Message & Create Match
          </button>
          <button class="btn-neutral opp-decline-btn" data-project-serial="${project.project_serial}" data-client-serial="${project.client_serial}">
            Decline
          </button>
          <button class="btn-danger opp-block-btn" data-client-serial="${project.client_serial}">
            Block Client
          </button>
        </div>
      </div>
    `;
    return html;
  }).join('');

  console.log('[Pro Opportunities] Generated HTML, length:', htmlCards.length);
  container.innerHTML = htmlCards;
  console.log('[Pro Opportunities] Cards rendered to DOM');

  // Attach event listeners to buttons
  attachOpportunityListeners();
}

/**
 * Attach event listeners to opportunity action buttons
 */
function attachOpportunityListeners() {
  // Message buttons
  document.querySelectorAll('.opp-message-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const projectId = e.currentTarget.dataset.projectId;
      const project = opportunities.find(o => o.id === projectId);
      if (project) {
        openOpportunityMessageModal(project);
      }
    });
  });

  // Decline buttons
  document.querySelectorAll('.opp-decline-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const projectSerial = e.currentTarget.dataset.projectSerial;
      const clientSerial = e.currentTarget.dataset.clientSerial;
      const project = opportunities.find(o => o.project_serial == projectSerial);
      if (project) {
        declineOpportunity(project);
      }
    });
  });

  // Block buttons
  document.querySelectorAll('.opp-block-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const clientSerial = e.currentTarget.dataset.clientSerial;
      if (clientSerial) {
        blockOpportunityClient(clientSerial);
      }
    });
  });
}

/**
 * Open modal to send message from opportunity
 */
function openOpportunityMessageModal(opp) {
  const client = opp.clients[0];
  const project = opp.projects[0];
  const clientName = client ? `${client.first_name} ${client.last_name}` : 'Unknown Client';

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'opp-message-modal';
  modal.innerHTML = `
    <div class="modal__overlay"></div>
    <div class="modal__content modal__content--small">
      <div class="modal__header">
        <h2>Send Message to ${clientName}</h2>
        <button class="modal__close" aria-label="Close modal">&times;</button>
      </div>
      <div class="modal__body">
        <div style="background: #fbf7ec; padding: 1rem; border-radius: 6px; margin-bottom: 1.5rem;">
          <p style="margin: 0; font-size: 0.85rem; color: #666;"><strong>Project:</strong> ${project?.custom_name}</p>
          <p style="margin: 0.5rem 0 0 0; font-size: 0.85rem; color: #666;"><strong>Need:</strong> ${project?.category_name}</p>
        </div>
        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; font-size: 0.9rem;">Your Message (max 1):</label>
        <textarea 
          id="opp-message-text" 
          placeholder="Introduce yourself and why you're a good fit for their needs..."
          style="width: 100%; height: 120px; padding: 0.75rem; border: 1px solid #fbf7ec; border-radius: 6px; font-family: inherit; font-size: 0.9rem; resize: vertical;"
        ></textarea>
        <p style="font-size: 0.8rem; color: #999; margin: 0.5rem 0 0 0;">ðŸ’¡ Tip: This is your only message. Make it count!</p>
      </div>
      <div class="modal__footer">
        <button id="opp-message-cancel" class="btn btn--secondary">Cancel</button>
        <button id="opp-message-send" class="btn btn-accent" data-opp-id="${opp.id}">Send Message</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Close button
  modal.querySelector('.modal__close').addEventListener('click', () => modal.remove());
  document.getElementById('opp-message-cancel').addEventListener('click', () => modal.remove());

  // Send button
  document.getElementById('opp-message-send').addEventListener('click', async () => {
    const messageText = document.getElementById('opp-message-text').value.trim();
    if (!messageText) {
      showToast('Please type a message', 'error');
      return;
    }
    
    await sendOpportunityMessage(opp, messageText);
    modal.remove();
  });

  modal.style.display = 'flex';
}

/**
 * Send opportunity message (1 per opportunity)
 */
async function sendOpportunityMessage(project, messageText) {
  try {
    // First, create a project_practitioner_match (so it appears in inbox)
    const { data: matchData, error: matchError } = await supabaseClient
      .from('project_practitioner_matches')
      .insert({
        project_serial: project.project_serial,
        practitioner_serial: currentPractitioner.serial_number,
        client_serial: project.client_serial,
        status: 'pending',
        match_score: 0,
        client_initiated: false,
        matched_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (matchError) {
      console.warn('[Pro Opportunities] Error creating match (may already exist):', matchError);
      // Continue anyway - match may already exist
    }

    // Create project message
    const { data: msgData, error: msgError } = await supabaseClient
      .from('project_messages')
      .insert({
        project_id: project.id,
        practitioner_id: currentPractitioner.id,
        client_id: project.client_id,
        sender_id: currentPractitioner.id,
        sender_type: 'practitioner',
        message: messageText,
        is_read: false,
        is_opportunity_message: true,
        practitioner_serial: currentPractitioner.serial_number,
        client_serial: project.client_serial,
        project_serial: project.project_serial
      })
      .select()
      .single();

    if (msgError) throw msgError;

    showToast('Message sent! The client will see it in their inbox.', 'success');

    // Reload opportunities
    await loadOpportunities();

  } catch (error) {
    console.error('[Pro Opportunities] Error sending message:', error);
    showToast('Failed to send message', 'error');
  }
}

/**
 * Decline opportunity (notify client)
 */
async function declineOpportunity(project) {
  if (!confirm(`Decline this opportunity from ${project.client_first_name}? We'll record your decline.`)) {
    return;
  }

  try {
    // Create a decline record in project_practitioner_matches if doesn't exist
    const { error } = await supabaseClient
      .from('project_practitioner_matches')
      .update({
        status: 'declined'
      })
      .eq('project_serial', project.project_serial)
      .eq('practitioner_serial', currentPractitioner.serial_number);

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    showToast('Opportunity declined', 'success');

    // Reload opportunities
    await loadOpportunities();

  } catch (error) {
    console.error('[Pro Opportunities] Error declining opportunity:', error);
    showToast('Failed to decline opportunity', 'error');
  }
}

/**
 * Block client from opportunity (notify client)
 */
async function blockOpportunityClient(clientSerial) {
  if (!confirm(`Block this client from reaching you again? They will be notified.`)) {
    return;
  }

  try {
    // Create block record
    const { error: blockError } = await supabaseClient
      .from('practitioner_blocks')
      .insert({
        practitioner_id: currentPractitioner.id,
        client_serial: clientSerial,
        practitioner_serial: currentPractitioner.serial_number,
        is_blocked: true,
        from_opportunity: true
      });

    if (blockError && blockError.code !== 'PGRST116') {
      throw blockError; // Ignore unique constraint errors
    }

    showToast('Client blocked. They will be notified.', 'success');

    // Reload opportunities
    await loadOpportunities();

  } catch (error) {
    console.error('[Pro Opportunities] Error blocking client:', error);
    showToast('Failed to block client', 'error');
  }
}

/**
 * Setup general event listeners
 */
function setupEventListeners() {
  // This is where you'd add any other listeners needed
}

/**
 * Format date for display
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

/**
 * Create client notification
 */
async function createClientNotification(clientSerial, notificationType, title, message) {
  try {
    const { error } = await supabaseClient
      .from('client_notifications')
      .insert({
        client_serial: clientSerial,
        type: notificationType,
        title: title,
        message: message,
        is_read: false,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('[Pro Opportunities] Error creating client notification:', error);
    }
  } catch (error) {
    console.error('[Pro Opportunities] Exception creating client notification:', error);
  }
}

/**
 * Show toast notification
 */
/**
 * Show toast notification (wrapper for modalManager)
 * Uses the unified toast system from modalManager.js
 * @param {string} message - Message to display
 * @param {string} type - Type: 'success', 'error', 'info'
 */
function showToast(message, type = 'info') {
  // Use modalManager's showToast if available
  if (typeof window.ModalManager !== 'undefined' && window.ModalManager.showToast) {
    window.ModalManager.showToast(message, type, 3000);
  } else if (typeof window.ModalManagerInstance !== 'undefined' && window.ModalManagerInstance.showToast) {
    window.ModalManagerInstance.showToast(message, type, 3000);
  }
  // If modalManager not loaded, silently fail (user should load it first)
}

/**
 * Real-time hook: Called when a new match is received
 * Automatically reloads opportunities to show new clients
 */
window.onNewMatchReceived = async function(matchData) {
  try {
    console.log('[Pro Opportunities] New match received via realtime:', matchData);
    
    // Wait a brief moment for the database to fully update
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Reload opportunities to show the newly matched client
    await loadOpportunities();
    
    console.log('[Pro Opportunities] Opportunities reloaded after new match');
  } catch (error) {
    console.error('[Pro Opportunities] Error reloading opportunities on new match:', error);
  }
};



























































