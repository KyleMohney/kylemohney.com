/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: crmManager.js                                               ║
║  Purpose: CRM Integration Management Service                       ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

TABLE OF CONTENTS
  1. CRM PROVIDERS CONFIGURATION
  2. CONNECTION MANAGEMENT
  3. SYNC OPERATIONS
  4. FIELD MAPPING
  5. UI HELPERS
  6. EXPORTS

═══════════════════════════════════════════════════════════════════════════════
*/

// =====================================================================
// 1. CRM PROVIDERS CONFIGURATION
// =====================================================================

const CRM_PROVIDERS = {
  highlevel: {
    name: 'HighLevel',
    icon: '../../../assets/highlevel.png',
    description: 'All-in-one CRM & sales platform',
    authType: 'oauth', // OAuth flow required
    features: ['contacts', 'deals', 'pipelines', 'messages'],
    popular: true
  },
  servicetitan: {
    name: 'ServiceTitan',
    icon: '../../../assets/ServiceTitan.png',
    description: 'Service-based business CRM',
    authType: 'oauth',
    features: ['contacts', 'jobs', 'pipelines'],
    popular: false
  },
  mhelpdesk: {
    name: 'mHelpDesk',
    icon: '../../../assets/mhelp.png',
    description: 'Help desk & ticketing system',
    authType: 'apikey',
    features: ['tickets', 'contacts', 'messages'],
    popular: false
  },
  hubspot: {
    name: 'HubSpot',
    icon: '../../../assets/hubspot.png',
    description: 'Marketing, sales & service platform',
    authType: 'oauth',
    features: ['contacts', 'deals', 'pipelines'],
    popular: false
  },
  pipedrive: {
    name: 'Pipedrive',
    icon: '../../../assets/pipedrive.png',
    description: 'Sales CRM for teams',
    authType: 'oauth',
    features: ['contacts', 'deals', 'pipelines'],
    popular: false
  },
  salesforce: {
    name: 'Salesforce',
    icon: '../../../assets/Salesfoce.png',
    description: 'Enterprise CRM platform',
    authType: 'oauth',
    features: ['contacts', 'opportunities', 'accounts'],
    popular: false
  },
  zoho: {
    name: 'Zoho CRM',
    icon: '../../../assets/zohocrm.png',
    description: 'Zoho CRM platform',
    authType: 'oauth',
    features: ['contacts', 'deals', 'pipelines'],
    popular: false
  }
};

// =====================================================================
// 2. CONNECTION MANAGEMENT
// =====================================================================

/**
 * Initialize CRM Manager - Load connected integrations and setup UI
 */
async function initializeCRMManager() {
  try {
    console.log('[CRM Manager] Initializing...');
    
    // Wait for authManager and Supabase client to be available
    let attempts = 0;
    while ((!window.authManager || !window.supabaseClient) && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (!window.authManager || !window.supabaseClient) {
      console.warn('[CRM Manager] AuthManager or Supabase client not available after timeout');
      return;
    }
    
    // Get current practitioner
    const practitioner = window.authManager.getCurrentUser?.();
    if (!practitioner) {
      console.warn('[CRM Manager] No authenticated practitioner');
      return;
    }

    // Check for OAuth callback parameters
    const urlParams = new URLSearchParams(window.location.search);
    const successProvider = urlParams.get('success');
    const errorProvider = urlParams.get('error');
    
    if (successProvider) {
      const providerName = CRM_PROVIDERS[successProvider]?.name || successProvider;
      console.log(`[CRM Manager] OAuth successful for ${successProvider}`);
      showNotification(`✓ ${providerName} connected successfully!`, 'success');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (errorProvider) {
      console.error(`[CRM Manager] OAuth failed for ${errorProvider}`);
      showNotification(`✗ Connection failed for ${errorProvider}. Please try again.`, 'error');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Load connected CRMs
    await loadConnectedCRMs(practitioner.user_metadata?.serial_number);
    
    // Render available CRM provider cards
    renderCRMProviders();
    
    // Setup sync settings
    setupSyncSettings();
    
    // Setup event listeners
    setupCRMEventListeners();
    
    console.log('[CRM Manager] Initialization complete');
  } catch (error) {
    console.error('[CRM Manager] Initialization failed:', error);
  }
}

/**
 * Load all connected CRMs for practitioner
 */
async function loadConnectedCRMs(practitionerSerial) {
  try {
    if (!window.supabaseClient) {
      console.debug('[CRM Manager] Supabase client not available yet, skipping load');
      return;
    }
    
    if (!practitionerSerial) {
      console.debug('[CRM Manager] No practitioner serial provided, skipping load');
      return;
    }

    const { data, error } = await window.supabaseClient
      .from('crm_integrations')
      .select('*')
      .eq('practitioner_serial', practitionerSerial)
      .eq('is_active', true);

    if (error) {
      console.error('[CRM Manager] Error loading integrations:', error);
      return;
    }

    console.log('[CRM Manager] Loaded connections:', data?.length || 0);
    renderConnectedCRMs(data || []);
    updateProviderCardStatus(data || []);
  } catch (error) {
    console.error('[CRM Manager] Exception loading connections:', error);
  }
}

/**
 * Render connected CRMs list
 */
function renderConnectedCRMs(integrations) {
  const container = document.getElementById('crm-connections-list');
  if (!container) return;

  if (integrations.length === 0) {
    container.innerHTML = `
      <div class="crm-empty-state">
        <div class="crm-empty-state-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
        </div>
        <p>No CRM integrations connected yet. Connect your first CRM below.</p>
      </div>
    `;
    return;
  }

  const html = integrations.map(integration => {
    const provider = CRM_PROVIDERS[integration.provider];
    const lastSync = integration.last_sync_at 
      ? new Date(integration.last_sync_at).toLocaleString()
      : 'Never';

    return `
      <div class="crm-connection-item" data-provider="${integration.provider}">
        <div class="crm-connection-info">
          <div class="crm-connection-name">
            ${provider?.name || integration.provider}
          </div>
          <div class="crm-connection-details">
            Last synced: ${lastSync}
          </div>
        </div>
        <div class="crm-connection-actions">
          <button class="btn-crm-action btn-crm-sync" onclick="syncCRMNow('${integration.provider}')">
            Sync Now
          </button>
          <button class="btn-crm-action btn-crm-settings" onclick="openCRMSettings('${integration.provider}')">
            Settings
          </button>
          <button class="btn-crm-action btn-crm-disconnect" onclick="disconnectCRM('${integration.provider}')">
            Disconnect
          </button>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

/**
 * Update provider card status based on connected integrations
 */
function updateProviderCardStatus(integrations) {
  const connectedProviders = integrations.map(i => i.provider);
  
  document.querySelectorAll('.crm-provider-card').forEach(card => {
    const provider = card.dataset.provider;
    if (connectedProviders.includes(provider)) {
      card.classList.add('connected');
      card.innerHTML = `
        ${card.innerHTML}
        <div class="crm-provider-status">✓ Connected</div>
      `;
    }
  });
}

/**
 * Render available CRM provider cards
 */
function renderCRMProviders() {
  const container = document.getElementById('crm-providers-grid');
  if (!container) return;

  const providers = Object.entries(CRM_PROVIDERS)
    .sort((a, b) => (b[1].popular ? 1 : 0) - (a[1].popular ? 1 : 0)); // Sort popular first

  const html = providers.map(([key, provider]) => `
    <div class="crm-provider-card" data-provider="${key}" onclick="openCRMConnectModal('${key}')">
      <div class="crm-provider-icon">${provider.icon ? `<img src="${provider.icon}" alt="${provider.name}" />` : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" role="img" aria-label="Link icon"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>'}</div>
      <div class="crm-provider-name">${provider.name}</div>
      <div class="crm-provider-status">
        ${provider.popular ? 'Popular' : 'Available'}
      </div>
      <button class="btn-primary" style="padding: 6px 12px; font-size: 12px;">
        Connect
      </button>
    </div>
  `).join('');

  container.innerHTML = html;
}

// =====================================================================
// 3. SYNC OPERATIONS
// =====================================================================

/**
 * Trigger immediate sync for a CRM
 */
async function syncCRMNow(provider) {
  try {
    console.log(`[CRM Manager] Syncing ${provider}...`);
    
    const practitioner = window.authManager?.getCurrentUser?.();
    if (!practitioner) return;

    // Call sync endpoint
    const response = await fetch(
      `${window.supabaseClient.supabaseUrl}/functions/v1/crm-sync`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await window.supabaseClient.auth.getSession()).data.session?.access_token || ''}`
        },
        body: JSON.stringify({
          practitioner_serial: practitioner.user_metadata?.serial_number,
          provider: provider,
          action: 'full_sync'
        })
      }
    );

    if (response.ok) {
      console.log(`[CRM Manager] ✓ Sync initiated for ${provider}`);
      showNotification('Sync initiated successfully', 'success');
      
      // Reload connections after a delay
      setTimeout(() => {
        loadConnectedCRMs(practitioner.user_metadata?.serial_number);
      }, 2000);
    } else {
      throw new Error('Sync failed');
    }
  } catch (error) {
    console.error(`[CRM Manager] Sync error for ${provider}:`, error);
    showNotification('Sync failed - please try again', 'error');
  }
}

/**
 * Sync all connected CRMs
 */
async function syncAllCRMs() {
  try {
    console.log('[CRM Manager] Syncing all CRMs...');
    const practitioner = window.authManager?.getCurrentUser?.();
    if (!practitioner) return;

    // Get all connected CRMs
    const { data: integrations } = await window.supabaseClient
      .from('crm_integrations')
      .select('provider')
      .eq('practitioner_serial', practitioner.user_metadata?.serial_number)
      .eq('is_active', true);

    if (!integrations || integrations.length === 0) {
      showNotification('No CRM integrations connected', 'info');
      return;
    }

    // Sync each provider
    for (const integration of integrations) {
      await syncCRMNow(integration.provider);
    }

    console.log('[CRM Manager] ✓ All syncs completed');
  } catch (error) {
    console.error('[CRM Manager] All-sync error:', error);
  }
}

// =====================================================================
// 4. CONNECTION FLOW (MODALS & AUTH)
// =====================================================================

/**
 * Open CRM connection modal
 */
function openCRMConnectModal(provider) {
  try {
    const providerConfig = CRM_PROVIDERS[provider];
    if (!providerConfig) return;

    console.log(`[CRM Manager] Opening connection modal for ${provider}`);

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'crm-modal active';
    modal.id = `crm-modal-${provider}`;
    modal.innerHTML = `
      <div class="crm-modal-content">
        <div class="crm-modal-header">
          <h2 class="crm-modal-title">
            Connect ${providerConfig.name}
          </h2>
          <button class="crm-modal-close" onclick="closeCRMModal('${provider}')">✕</button>
        </div>
        
        <div class="crm-modal-body">
          <p style="margin-bottom: 1rem; color: var(--rooted-text-secondary);">
            ${providerConfig.description}
          </p>

          ${providerConfig.authType === 'oauth' ? `
            <div style="margin-bottom: 1rem;">
              <p style="font-weight: 600; margin-bottom: 0.5rem;">How it works:</p>
              <ol style="margin-left: 1.5rem; color: var(--rooted-text-secondary); font-size: 14px;">
                <li>Click "Authorize" to connect with ${providerConfig.name}</li>
                <li>Log in to your ${providerConfig.name} account</li>
                <li>Grant Rooted Vitality access permissions</li>
                <li>Configure field mappings</li>
              </ol>
            </div>
          ` : `
            <div style="margin-bottom: 1rem;">
              <label for="api-key-input" style="display: block; font-weight: 600; margin-bottom: 0.5rem;">
                API Key
              </label>
              <input 
                type="password" 
                id="api-key-input" 
                class="form-input" 
                placeholder="Enter your ${providerConfig.name} API key"
                style="width: 100%;"
              >
              <p style="font-size: 12px; color: var(--rooted-text-muted); margin-top: 0.5rem;">
                Find your API key in your ${providerConfig.name} settings
              </p>
            </div>
          `}

          <div style="background: var(--rooted-bg-light); padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
            <p style="font-size: 12px; color: var(--rooted-text-secondary); margin: 0;">
              <strong>🔒 Security:</strong> Your API credentials are encrypted and never stored in plain text.
            </p>
          </div>

          <button 
            class="btn-primary" 
            style="width: 100%;"
            onclick="initiateCRMAuth('${provider}')">
            ${providerConfig.authType === 'oauth' ? 'Authorize' : 'Connect'} ${providerConfig.name}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeCRMModal(provider);
    });
  } catch (error) {
    console.error(`[CRM Manager] Error opening modal for ${provider}:`, error);
  }
}

/**
 * Close CRM modal
 */
function closeCRMModal(provider) {
  const modal = document.getElementById(`crm-modal-${provider}`);
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 200);
  }
}

/**
 * Initiate CRM authentication flow
 */
async function initiateCRMAuth(provider) {
  try {
    console.log(`[CRM Manager] Initiating auth for ${provider}`);
    
    const practitioner = window.authManager?.getCurrentUser?.();
    if (!practitioner) {
      showNotification('Not authenticated', 'error');
      return;
    }

    const providerConfig = CRM_PROVIDERS[provider];
    const session = await window.supabaseClient.auth.getSession();
    const token = session.data.session?.access_token;

    if (providerConfig.authType === 'oauth') {
      // OAuth flow - call edge function to get auth URL
      const response = await fetch(
        `${window.supabaseClient.supabaseUrl}/functions/v1/crm-oauth-init`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            provider: provider,
            practitioner_serial: practitioner.user_metadata?.serial_number
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.auth_url) {
          // Redirect to OAuth provider
          console.log(`[CRM Manager] Redirecting to ${provider} OAuth...`);
          window.location.href = data.auth_url;
        }
      } else {
        throw new Error('Failed to initialize OAuth');
      }
    } else {
      // API Key flow
      const apiKeyInput = document.getElementById('api-key-input');
      const apiKey = apiKeyInput?.value?.trim();

      if (!apiKey) {
        showNotification('Please enter an API key', 'error');
        return;
      }

      const response = await fetch(
        `${window.supabaseClient.supabaseUrl}/functions/v1/crm-save-credentials`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            provider: provider,
            practitioner_serial: practitioner.user_metadata?.serial_number,
            api_key: apiKey
          })
        }
      );

      if (response.ok) {
        console.log(`[CRM Manager] ✓ ${provider} connected successfully`);
        showNotification(`${providerConfig.name} connected successfully`, 'success');
        closeCRMModal(provider);
        
        // Reload connections
        await loadConnectedCRMs(practitioner.user_metadata?.serial_number);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Connection failed');
      }
    }
  } catch (error) {
    console.error(`[CRM Manager] Auth error for ${provider}:`, error);
    showNotification('Connection failed - please try again', 'error');
  }
}

/**
 * Open CRM settings (field mapping, sync options)
 */
function openCRMSettings(provider) {
  console.log(`[CRM Manager] Opening settings for ${provider}`);
  // TODO: Implement settings modal with field mapping UI
  showNotification('CRM settings coming soon', 'info');
}

/**
 * Disconnect a CRM
 */
async function disconnectCRM(provider) {
  if (!confirm(`Are you sure you want to disconnect ${CRM_PROVIDERS[provider]?.name || provider}?`)) {
    return;
  }

  try {
    console.log(`[CRM Manager] Disconnecting ${provider}...`);
    
    const practitioner = window.authManager?.getCurrentUser?.();
    if (!practitioner) return;

    const session = await window.supabaseClient.auth.getSession();
    const token = session.data.session?.access_token;

    const response = await fetch(
      `${window.supabaseClient.supabaseUrl}/functions/v1/crm-disconnect`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          provider: provider,
          practitioner_serial: practitioner.user_metadata?.serial_number
        })
      }
    );

    if (response.ok) {
      console.log(`[CRM Manager] ✓ ${provider} disconnected`);
      showNotification(`${CRM_PROVIDERS[provider]?.name || provider} disconnected`, 'success');
      
      // Reload connections
      await loadConnectedCRMs(practitioner.user_metadata?.serial_number);
    } else {
      throw new Error('Disconnect failed');
    }
  } catch (error) {
    console.error(`[CRM Manager] Disconnect error for ${provider}:`, error);
    showNotification('Disconnection failed - please try again', 'error');
  }
}

// =====================================================================
// 5. SYNC SETTINGS
// =====================================================================

/**
 * Setup sync settings handlers
 */
function setupSyncSettings() {
  const autoSyncToggle = document.getElementById('auto-sync-toggle');
  const syncFrequency = document.getElementById('sync-frequency');
  const syncMessagesToggle = document.getElementById('sync-messages-toggle');
  const syncNowBtn = document.getElementById('sync-now-btn');

  if (autoSyncToggle) {
    autoSyncToggle.addEventListener('change', (e) => {
      saveSyncSetting('auto_sync', e.target.checked);
    });
  }

  if (syncFrequency) {
    syncFrequency.addEventListener('change', (e) => {
      saveSyncSetting('sync_frequency', e.target.value);
    });
  }

  if (syncMessagesToggle) {
    syncMessagesToggle.addEventListener('change', (e) => {
      saveSyncSetting('sync_messages', e.target.checked);
    });
  }

  if (syncNowBtn) {
    syncNowBtn.addEventListener('click', syncAllCRMs);
  }

  // Load saved settings
  loadSyncSettings();
}

/**
 * Save sync setting to database
 */
async function saveSyncSetting(key, value) {
  try {
    console.log(`[CRM Manager] Saving setting: ${key} = ${value}`);
    
    const practitioner = window.authManager?.getCurrentUser?.();
    if (!practitioner) return;

    // Save to local storage for immediate feedback
    localStorage.setItem(`crm_${key}`, JSON.stringify(value));

    // Save to database
    // TODO: Create practitioner_crm_settings table if needed
    console.log(`[CRM Manager] ✓ Setting saved: ${key}`);
  } catch (error) {
    console.error('[CRM Manager] Error saving setting:', error);
  }
}

/**
 * Load sync settings
 */
function loadSyncSettings() {
  try {
    const autoSync = localStorage.getItem('crm_auto_sync');
    const frequency = localStorage.getItem('crm_sync_frequency');
    const syncMessages = localStorage.getItem('crm_sync_messages');

    if (autoSync !== null) {
      const toggle = document.getElementById('auto-sync-toggle');
      if (toggle) toggle.checked = JSON.parse(autoSync);
    }

    if (frequency) {
      const select = document.getElementById('sync-frequency');
      if (select) select.value = frequency;
    }

    if (syncMessages !== null) {
      const toggle = document.getElementById('sync-messages-toggle');
      if (toggle) toggle.checked = JSON.parse(syncMessages);
    }
  } catch (error) {
    console.error('[CRM Manager] Error loading settings:', error);
  }
}

// =====================================================================
// 6. EVENT LISTENERS & UTILITIES
// =====================================================================

/**
 * Setup CRM event listeners
 */
function setupCRMEventListeners() {
  // Sidebar navigation
  document.querySelectorAll('.settings-nav-link[data-section="integrations"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.settings-section').forEach(s => s.classList.remove('active'));
      document.getElementById('integrations').classList.add('active');
      document.querySelectorAll('.settings-nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });
}

/**
 * Show notification helper
 */
function showNotification(message, type = 'info') {
  // Use existing notification system if available
  if (window.showNotification) {
    window.showNotification(message, type);
  } else {
    // Fallback: log to console and show browser alert for critical messages
    console.log(`[${type.toUpperCase()}] ${message}`);
    if (type === 'error') {
      alert(`Error: ${message}`);
    }
  }
}

// =====================================================================
// 7. EXPORTS & INITIALIZATION
// =====================================================================

// Expose globally for HTML onclick handlers
window.crmManager = {
  initializeCRMManager,
  loadConnectedCRMs,
  syncCRMNow,
  syncAllCRMs,
  openCRMConnectModal,
  closeCRMModal,
  initiateCRMAuth,
  openCRMSettings,
  disconnectCRM
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeCRMManager);
} else {
  initializeCRMManager();
}
