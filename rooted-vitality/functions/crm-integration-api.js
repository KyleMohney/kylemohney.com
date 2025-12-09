/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: crm-integration-api.js                                      ║
║  Purpose: CRM Integration Backend API Handlers                     ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

TABLE OF CONTENTS
  1. CRM OAUTH INITIALIZATION
  2. CRM OAUTH CALLBACK HANDLING
  3. PROVIDER-SPECIFIC OAUTH IMPLEMENTATIONS
     3.1 HighLevel OAuth
     3.2 ServiceTitan OAuth
     3.3 HubSpot OAuth
     3.4 Pipedrive OAuth
     3.5 Salesforce OAuth
     3.6 Zoho OAuth
  4. API KEY CREDENTIAL HANDLING
  5. CRM DISCONNECT
  6. HELPER FUNCTIONS
  7. MODULE EXPORTS

═══════════════════════════════════════════════════════════════════════════════

CRM OAuth Endpoints:
  POST /crm-oauth-init - Initialize OAuth flow for any CRM provider
  GET /crm-oauth-callback - Handle OAuth callback from all providers
  POST /crm-save-credentials - Save API credentials for non-OAuth providers
  POST /crm-disconnect - Disconnect a CRM integration

Supported Providers:
  - HighLevel (OAuth)
  - ServiceTitan (OAuth)
  - mHelpDesk (API Key)
  - HubSpot (OAuth)
  - Pipedrive (OAuth)
  - Salesforce (OAuth)
  - Zoho (OAuth)

═══════════════════════════════════════════════════════════════════════════════
*/

/**
 * CRM Integration API Endpoints
 * Backend handlers for CRM OAuth, credentials, syncing, and webhooks
 * 
 * CRM OAuth Endpoints:
 * POST /crm-oauth-init - Initialize OAuth flow for any CRM provider
 * GET /crm-oauth-callback - Handle OAuth callback for all providers
 * POST /crm-save-credentials - Save API credentials for non-OAuth providers
 * POST /crm-disconnect - Disconnect a CRM integration
 * POST /crm-test-connection - Test CRM connection
 * 
 * CRM Sync Endpoints:
 * POST /crm-sync-client - Sync single client/match to CRM
 * POST /crm-process-queue - Process sync queue (called by scheduler)
 * 
 * Supported Providers:
 * - HighLevel (OAuth)
 * - ServiceTitan (OAuth)
 * - mHelpDesk (API Key)
 * - HubSpot (OAuth)
 * - Pipedrive (OAuth)
 * - Salesforce (OAuth)
 * - Zoho (OAuth)
 */

// ═══════════════════════════════════════════════════════════════════════════════
// 1. CRM OAUTH INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Initialize OAuth flow for CRM provider
 * POST /crm-oauth-init
 */
export async function handleCRMOAuthInit(req, res) {
  try {
    const { provider, practitioner_serial } = req.body;
    
    if (!provider || !practitioner_serial) {
      return res.status(400).json({ error: 'Missing provider or practitioner_serial' });
    }

    // Validate provider
    const validProviders = ['highlevel', 'servicetitan', 'hubspot', 'pipedrive', 'salesforce', 'zoho'];
    if (!validProviders.includes(provider)) {
      return res.status(400).json({ error: 'Unsupported provider' });
    }

    // Generate CSRF state token
    const state = generateRandomString(32);
    await cacheManager.set(
      `crm_oauth_state_${state}`,
      { provider, practitioner_serial, timestamp: Date.now() },
      600 // 10 minute expiry
    );

    let authUrl;

    switch (provider) {
      case 'highlevel':
        authUrl = buildHighLevelOAuthURL(state);
        break;
      case 'servicetitan':
        authUrl = buildServiceTitanOAuthURL(state);
        break;
      case 'hubspot':
        authUrl = buildHubSpotOAuthURL(state);
        break;
      case 'pipedrive':
        authUrl = buildPipedriveOAuthURL(state);
        break;
      case 'salesforce':
        authUrl = buildSalesforceOAuthURL(state);
        break;
      case 'zoho':
        authUrl = buildZohoOAuthURL(state);
        break;
      default:
        return res.status(400).json({ error: 'Provider not supported' });
    }

    res.json({ auth_url: authUrl });

  } catch (error) {
    console.error('[CRM OAuth Init] Error:', error);
    res.status(500).json({ error: 'OAuth initialization failed' });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. CRM OAUTH CALLBACK HANDLING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Handle OAuth callback from any CRM provider
 * GET /crm-oauth-callback?code=...&state=...
 */
export async function handleCRMOAuthCallback(req, res) {
  try {
    const { code, state, error, error_description } = req.query;
    
    // Get the origin from the request headers
    const origin = req.headers.get('origin') || process.env.APP_URL || 'http://localhost:3000';
    const settingsUrl = `${origin}/rooted-vitality/dashboard/pro/pages/settings.html`;

    if (error) {
      console.warn(`[CRM OAuth Callback] Auth error: ${error} - ${error_description}`);
      return res.redirect(`${settingsUrl}?section=integrations&error=${error}`);
    }

    if (!code || !state) {
      return res.status(400).json({ error: 'Missing authorization code or state' });
    }

    // Validate state token
    const stateData = await cacheManager.get(`crm_oauth_state_${state}`);
    if (!stateData) {
      console.warn('[CRM OAuth Callback] Invalid or expired state token');
      return res.redirect(`${settingsUrl}?section=integrations&error=invalid_state`);
    }

    const { provider, practitioner_serial } = stateData;

    let tokens;
    let result;

    switch (provider) {
      case 'highlevel':
        tokens = await exchangeHighLevelToken(code);
        result = await saveHighLevelIntegration(practitioner_serial, tokens);
        break;
      case 'servicetitan':
        tokens = await exchangeServiceTitanToken(code);
        result = await saveServiceTitanIntegration(practitioner_serial, tokens);
        break;
      case 'hubspot':
        tokens = await exchangeHubSpotToken(code);
        result = await saveHubSpotIntegration(practitioner_serial, tokens);
        break;
      case 'pipedrive':
        tokens = await exchangePipedriveToken(code);
        result = await savePipedriveIntegration(practitioner_serial, tokens);
        break;
      case 'salesforce':
        tokens = await exchangeSalesforceToken(code);
        result = await saveSalesforceIntegration(practitioner_serial, tokens);
        break;
      case 'zoho':
        tokens = await exchangeZohoToken(code);
        result = await saveZohoIntegration(practitioner_serial, tokens);
        break;
      default:
        return res.redirect(`${settingsUrl}?section=integrations&error=unknown_provider`);
    }

    if (!result.success) {
      console.error(`[CRM OAuth Callback] Save failed for ${provider}:`, result.error);
      return res.redirect(`${settingsUrl}?section=integrations&error=save_failed`);
    }

    
    // Redirect back to settings with success
    res.redirect(`${settingsUrl}?section=integrations&success=${provider}`);

  } catch (error) {
    console.error('[CRM OAuth Callback] Error:', error);
    const origin = req.headers.get('origin') || process.env.APP_URL || 'http://localhost:3000';
    const settingsUrl = `${origin}/rooted-vitality/dashboard/pro/pages/settings.html`;
    res.redirect(`${settingsUrl}?section=integrations&error=callback_failed`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. PROVIDER-SPECIFIC OAUTH IMPLEMENTATIONS
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// 3.1 HighLevel OAuth
// ─────────────────────────────────────────────────────────────────────────────

function buildHighLevelOAuthURL(state) {
  const url = new URL('https://secure.gohighlevel.com/oauth/authorize');
  url.searchParams.append('client_id', process.env.HIGHLEVEL_CLIENT_ID);
  url.searchParams.append('redirect_uri', `${process.env.APP_URL}/functions/v1/crm-oauth-callback`);
  url.searchParams.append('response_type', 'code');
  url.searchParams.append('scope', 'contacts.read contacts.write deals.read deals.write pipelines.read');
  url.searchParams.append('state', state);
  return url.toString();
}

async function exchangeHighLevelToken(code) {
  const response = await fetch('https://secure.gohighlevel.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.HIGHLEVEL_CLIENT_ID,
      client_secret: process.env.HIGHLEVEL_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: `${process.env.APP_URL}/functions/v1/crm-oauth-callback`
    })
  });

  if (!response.ok) {
    throw new Error(`HighLevel token exchange failed: ${response.statusText}`);
  }

  return await response.json();
}

async function saveHighLevelIntegration(practitioner_serial, tokens) {
  try {
    const supabase = createAdminClient();

    // Decrypt and validate token first
    const accessToken = tokens.access_token;
    
    // Test connection before saving
    const testResponse = await fetch('https://api.gohighlevel.com/v1/contacts?limit=1', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!testResponse.ok) {
      return { success: false, error: 'Failed to validate HighLevel token' };
    }

    // Get location ID (required for HighLevel)
    const locationResponse = await fetch('https://api.gohighlevel.com/v1/locations?limit=1', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    const locationData = await locationResponse.json();
    const locationId = locationData.locations?.[0]?.id;

    if (!locationId) {
      return { success: false, error: 'Could not find HighLevel location' };
    }

    // Save integration
    const { error } = await supabase
      .from('crm_integrations')
      .upsert({
        practitioner_serial,
        provider: 'highlevel',
        api_key: await encryptData(accessToken),
        webhook_url: `${process.env.APP_URL}/functions/v1/crm-webhook-highlevel`,
        is_active: true,
        sync_frequency: 'real-time',
        metadata: JSON.stringify({ location_id: locationId }),
        last_sync_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: ['practitioner_serial', 'provider']
      });

    if (error) {
      console.error('[HighLevel Save] Database error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };

  } catch (error) {
    console.error('[HighLevel Save] Error:', error);
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3.2 ServiceTitan OAuth
// ─────────────────────────────────────────────────────────────────────────────

function buildServiceTitanOAuthURL(state) {
  const url = new URL('https://api.servicetitan.com/oauth/authorize');
  url.searchParams.append('client_id', process.env.SERVICETITAN_CLIENT_ID);
  url.searchParams.append('redirect_uri', `${process.env.APP_URL}/functions/v1/crm-oauth-callback`);
  url.searchParams.append('response_type', 'code');
  url.searchParams.append('scope', 'Crm:Read Crm:Write Jobs:Read');
  url.searchParams.append('state', state);
  return url.toString();
}

async function exchangeServiceTitanToken(code) {
  const response = await fetch('https://api.servicetitan.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.SERVICETITAN_CLIENT_ID,
      client_secret: process.env.SERVICETITAN_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: `${process.env.APP_URL}/functions/v1/crm-oauth-callback`
    })
  });

  if (!response.ok) {
    throw new Error(`ServiceTitan token exchange failed: ${response.statusText}`);
  }

  return await response.json();
}

async function saveServiceTitanIntegration(practitioner_serial, tokens) {
  try {
    const supabase = createAdminClient();
    const accessToken = tokens.access_token;

    // Test connection
    const testResponse = await fetch('https://api.servicetitan.com/v2/crm/customers?pageSize=1', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!testResponse.ok) {
      return { success: false, error: 'Failed to validate ServiceTitan token' };
    }

    // Save integration
    const { error } = await supabase
      .from('crm_integrations')
      .upsert({
        practitioner_serial,
        provider: 'servicetitan',
        api_key: await encryptData(accessToken),
        is_active: true,
        sync_frequency: 'real-time',
        last_sync_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: ['practitioner_serial', 'provider']
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };

  } catch (error) {
    console.error('[ServiceTitan Save] Error:', error);
    return { success: false, error: error.message };
  }
}
// ─────────────────────────────────────────────────────────────────────────────
// 3.3 HubSpot OAuth
// ─────────────────────────────────────────────────────────────────────────────

function buildHubSpotOAuthURL(state) {
  const url = new URL('https://app.hubspot.com/oauth/authorize');
  url.searchParams.append('client_id', process.env.HUBSPOT_CLIENT_ID);
  url.searchParams.append('redirect_uri', `${process.env.APP_URL}/functions/v1/crm-oauth-callback`);
  url.searchParams.append('scope', 'crm.objects.contacts.read crm.objects.contacts.write crm.objects.deals.read crm.objects.deals.write');
  url.searchParams.append('state', state);
  return url.toString();
}

async function exchangeHubSpotToken(code) {
  const response = await fetch('https://api.hubapi.com/oauth/v1/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.HUBSPOT_CLIENT_ID,
      client_secret: process.env.HUBSPOT_CLIENT_SECRET,
      redirect_uri: `${process.env.APP_URL}/functions/v1/crm-oauth-callback`,
      code
    })
  });

  if (!response.ok) {
    throw new Error(`HubSpot token exchange failed: ${response.statusText}`);
  }

  return await response.json();
}

async function saveHubSpotIntegration(practitioner_serial, tokens) {
  try {
    const supabase = createAdminClient();
    const accessToken = tokens.access_token;

    // Test connection
    const testResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!testResponse.ok) {
      return { success: false, error: 'Failed to validate HubSpot token' };
    }

    const { error } = await supabase
      .from('crm_integrations')
      .upsert({
        practitioner_serial,
        provider: 'hubspot',
        api_key: await encryptData(accessToken),
        is_active: true,
        sync_frequency: 'real-time',
        last_sync_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: ['practitioner_serial', 'provider']
      });

    if (error) {
      return { success: false, error: error.message };
    }
    }

    return { success: true };
  } catch (error) {
    console.error('[HubSpot Save] Error:', error);
    return { success: false, error: error.message };
  }
}
// ─────────────────────────────────────────────────────────────────────────────
// 3.4 Pipedrive OAuth
// ─────────────────────────────────────────────────────────────────────────────

function buildPipedriveOAuthURL(state) {
  const url = new URL('https://oauth.pipedrive.com/oauth/authorize');
  url.searchParams.append('client_id', process.env.PIPEDRIVE_CLIENT_ID);
  url.searchParams.append('redirect_uri', `${process.env.APP_URL}/functions/v1/crm-oauth-callback`);
  url.searchParams.append('response_type', 'code');
  url.searchParams.append('state', state);
  return url.toString();
}

async function exchangePipedriveToken(code) {
  const response = await fetch('https://oauth.pipedrive.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.PIPEDRIVE_CLIENT_ID,
      client_secret: process.env.PIPEDRIVE_CLIENT_SECRET,
      redirect_uri: `${process.env.APP_URL}/functions/v1/crm-oauth-callback`,
      code
    })
  });

  if (!response.ok) {
    throw new Error(`Pipedrive token exchange failed: ${response.statusText}`);
  }

  return await response.json();
}

async function savePipedriveIntegration(practitioner_serial, tokens) {
  try {
    const supabase = createAdminClient();
    const accessToken = tokens.access_token;

    // Test connection
    const testResponse = await fetch('https://api.pipedrive.com/v1/users/me?api_token=' + accessToken);

    if (!testResponse.ok) {
      return { success: false, error: 'Failed to validate Pipedrive token' };
    }

    const { error } = await supabase
      .from('crm_integrations')
      .upsert({
        practitioner_serial,
        provider: 'pipedrive',
        api_key: await encryptData(accessToken),
        is_active: true,
        sync_frequency: 'real-time',
        last_sync_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: ['practitioner_serial', 'provider']
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };

  } catch (error) {
    console.error('[Pipedrive Save] Error:', error);
    return { success: false, error: error.message };
  }
}
// ─────────────────────────────────────────────────────────────────────────────
// 3.5 Salesforce OAuth
// ─────────────────────────────────────────────────────────────────────────────

function buildSalesforceOAuthURL(state) {
  const url = new URL('https://login.salesforce.com/services/oauth2/authorize');
  url.searchParams.append('client_id', process.env.SALESFORCE_CLIENT_ID);
  url.searchParams.append('redirect_uri', `${process.env.APP_URL}/functions/v1/crm-oauth-callback`);
  url.searchParams.append('response_type', 'code');
  url.searchParams.append('scope', 'api id full');
  url.searchParams.append('state', state);
  return url.toString();
}

async function exchangeSalesforceToken(code) {
  const response = await fetch('https://login.salesforce.com/services/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.SALESFORCE_CLIENT_ID,
      client_secret: process.env.SALESFORCE_CLIENT_SECRET,
      redirect_uri: `${process.env.APP_URL}/functions/v1/crm-oauth-callback`,
      code
    })
  });

  if (!response.ok) {
    throw new Error(`Salesforce token exchange failed: ${response.statusText}`);
  }

  return await response.json();
}

async function saveSalesforceIntegration(practitioner_serial, tokens) {
  try {
    const supabase = createAdminClient();
    const accessToken = tokens.access_token;

    // Test connection
    const testResponse = await fetch(`${tokens.instance_url}/services/data/v57.0/`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!testResponse.ok) {
      return { success: false, error: 'Failed to validate Salesforce token' };
    }

    const { error } = await supabase
      .from('crm_integrations')
      .upsert({
        practitioner_serial,
        provider: 'salesforce',
        api_key: await encryptData(accessToken),
        webhook_url: tokens.instance_url,
        is_active: true,
        sync_frequency: 'real-time',
        last_sync_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: ['practitioner_serial', 'provider']
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };

  } catch (error) {
    console.error('[Salesforce Save] Error:', error);
    return { success: false, error: error.message };
  }
}
// ─────────────────────────────────────────────────────────────────────────────
// 3.6 Zoho OAuth
// ─────────────────────────────────────────────────────────────────────────────

function buildZohoOAuthURL(state) {
  const url = new URL('https://accounts.zoho.com/oauth/v2/auth');
  url.searchParams.append('client_id', process.env.ZOHO_CLIENT_ID);
  url.searchParams.append('response_type', 'code');
  url.searchParams.append('scope', 'ZohoCRM.modules.contacts.ALL ZohoCRM.modules.deals.ALL');
  url.searchParams.append('redirect_uri', `${process.env.APP_URL}/functions/v1/crm-oauth-callback`);
  url.searchParams.append('state', state);
  return url.toString();
}

async function exchangeZohoToken(code) {
  const response = await fetch('https://accounts.zoho.com/oauth/v2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.ZOHO_CLIENT_ID,
      client_secret: process.env.ZOHO_CLIENT_SECRET,
      redirect_uri: `${process.env.APP_URL}/functions/v1/crm-oauth-callback`,
      code
    })
  });

  if (!response.ok) {
    throw new Error(`Zoho token exchange failed: ${response.statusText}`);
  }

  return await response.json();
}

async function saveZohoIntegration(practitioner_serial, tokens) {
  try {
    const supabase = createAdminClient();
    const accessToken = tokens.access_token;

    // Test connection
    const testResponse = await fetch('https://www.zohoapis.com/crm/v2/modules', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!testResponse.ok) {
      return { success: false, error: 'Failed to validate Zoho token' };
    }

    const { error } = await supabase
      .from('crm_integrations')
      .upsert({
        practitioner_serial,
        provider: 'zoho',
        api_key: await encryptData(accessToken),
        is_active: true,
        sync_frequency: 'real-time',
        last_sync_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: ['practitioner_serial', 'provider']
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };

  } catch (error) {
    console.error('[Zoho Save] Error:', error);
    return { success: false, error: error.message };
  }
}

// ========================================== 
// API KEY CREDENTIALS (for mHelpDesk)
// ═══════════════════════════════════════════════════════════════════════════════
// 4. API KEY CREDENTIAL HANDLING (mHelpDesk)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Save API credentials for non-OAuth providers
 * POST /crm-save-credentials
 */
export async function handleSaveCredentials(req, res) {
  try {
    const { provider, practitioner_serial, api_key } = req.body;

    if (!provider || !practitioner_serial || !api_key) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Only mHelpDesk uses API key auth
    if (provider !== 'mhelpdesk') {
      return res.status(400).json({ error: 'This provider requires OAuth' });
    }

    // Test connection first
    const testResponse = await fetch('https://api.mhelpdesk.com/api/users', {
      headers: { 'Authorization': `Bearer ${api_key}` }
    });

    if (!testResponse.ok) {
      console.warn('[mHelpDesk] Connection test failed');
      return res.status(401).json({ error: 'Invalid API credentials. Please check your API key.' });
    }

    const supabase = createAdminClient();

    // Save credentials
    const { error } = await supabase
      .from('crm_integrations')
      .upsert({
        practitioner_serial,
        provider: 'mhelpdesk',
        api_key: await encryptData(api_key),
        is_active: true,
        sync_frequency: 'hourly',
        last_sync_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: ['practitioner_serial', 'provider']
      });

    if (error) {
      console.error('[mHelpDesk Save] Database error:', error);
      return res.status(500).json({ error: 'Failed to save credentials' });
    }
      return res.status(500).json({ error: 'Failed to save credentials' });
    }

    res.json({ success: true, message: 'mHelpDesk connected successfully' });
    console.error('[Save Credentials] Error:', error);
    res.status(500).json({ error: 'Failed to save credentials' });
  }
}

// ========================================== 
// DISCONNECT INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════
// 5. CRM DISCONNECT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Disconnect a CRM integration
 * POST /crm-disconnect
 */
export async function handleCRMDisconnect(req, res) {
  try {
    const { provider, practitioner_serial } = req.body;

    if (!provider || !practitioner_serial) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const supabase = createAdminClient();

    // Soft delete (set is_active to false)
    const { error } = await supabase
      .from('crm_integrations')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('practitioner_serial', practitioner_serial)
      .eq('provider', provider);

    if (error) {
      console.error('[CRM Disconnect] Error:', error);
      return res.status(500).json({ error: 'Failed to disconnect' });
    }

    res.json({ success: true, message: `${provider} disconnected` });

  } catch (error) {
    console.error('[CRM Disconnect] Error:', error);
    res.status(500).json({ error: 'Disconnection failed' });
  }
}

// ========================================== 
// GOOGLE CALENDAR OAUTH
// ========================================== 

export async function handleGoogleOAuthInit(req, res) {
  try {
    const { practitioner_serial } = req.body;
    
    // Validate practitioner
    if (!practitioner_serial) {
      return res.status(400).json({ error: 'Missing practitioner_serial' });
    }
    
    // Generate OAuth state token for CSRF protection
    const state = generateRandomString(32);
    
    // Store state in Redis/cache with expiry (10 min)
    await cacheManager.set(
      `oauth_state_${state}`,
      { practitioner_serial, timestamp: Date.now() },
      600
    );
    
    // Build Google OAuth URL
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.append('client_id', process.env.GOOGLE_CLIENT_ID);
    googleAuthUrl.searchParams.append('redirect_uri', `${process.env.APP_URL}/api/calendar/google-oauth-callback`);
    googleAuthUrl.searchParams.append('response_type', 'code');
    googleAuthUrl.searchParams.append('scope', 'https://www.googleapis.com/auth/calendar.readonly');
    googleAuthUrl.searchParams.append('state', state);
    googleAuthUrl.searchParams.append('access_type', 'offline'); // For refresh token
    
    res.json({ auth_url: googleAuthUrl.toString() });
  } catch (error) {
    console.error('[Google OAuth] Initialization failed:', error);
    res.status(500).json({ error: 'OAuth initialization failed' });
  }
}

export async function handleGoogleOAuthCallback(req, res) {
  try {
    const { code, state } = req.query;
    
    if (!code || !state) {
      return res.status(400).json({ error: 'Missing authorization code or state' });
    }
    
    // Validate state token
    const stateData = await cacheManager.get(`oauth_state_${state}`);
    if (!stateData) {
      return res.status(401).json({ error: 'Invalid or expired state token' });
    }
    
    const { practitioner_serial } = stateData;
    
    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        redirect_uri: `${process.env.APP_URL}/api/calendar/google-oauth-callback`,
        grant_type: 'authorization_code'
      })
    });
    
    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange authorization code');
    }
    
    const tokens = await tokenResponse.json();
    
    // Store encrypted tokens in database
    const supabase = createAdminClient(); // Use service role
    
    await supabase
      .from('calendar_integrations')
      .upsert({
        practitioner_serial,
        provider: 'google',
        oauth_token: await encryptData(tokens.access_token),
        refresh_token: tokens.refresh_token ? await encryptData(tokens.refresh_token) : null,
        token_expires_at: new Date(Date.now() + tokens.expires_in * 1000),
        is_active: true,
        sync_frequency: 'real-time'
      }, {
        onConflict: 'practitioner_serial,provider'
      });
    
    // Fetch calendar ID
    const calendarId = await getGoogleCalendarId(tokens.access_token);
    
    // Update with calendar_id
    await supabase
      .from('calendar_integrations')
      .update({ calendar_id: calendarId })
      .eq('practitioner_serial', practitioner_serial)
      .eq('provider', 'google');
    
    // Trigger initial calendar sync
    await syncGoogleCalendarEvents(practitioner_serial, tokens.access_token);
    
    // Redirect to success page
    res.redirect(`/rooted-vitality/dashboard/pro/pages/match-settings.html?calendar=connected`);
    
  } catch (error) {
    console.error('[Google OAuth Callback] Error:', error);
    res.redirect(`/rooted-vitality/dashboard/pro/pages/match-settings.html?error=oauth_failed`);
  }
}

async function getGoogleCalendarId(accessToken) {
  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary?fields=id', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  
  if (!response.ok) throw new Error('Failed to fetch calendar ID');
  const data = await response.json();
  return data.id;
}

async function syncGoogleCalendarEvents(practitioner_serial, accessToken) {
  try {
    // Fetch events from Google Calendar (next 30 days)
    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    
    if (!response.ok) throw new Error('Failed to fetch calendar events');
    const data = await response.json();
    
    const supabase = createAdminClient();
    const events = data.items || [];
    
    // Upsert events into database
    for (const event of events) {
      await supabase
        .from('synced_calendar_events')
        .upsert({
          practitioner_serial,
          provider: 'google',
          external_event_id: event.id,
          event_title: event.summary,
          event_start: event.start.dateTime || event.start.date,
          event_end: event.end.dateTime || event.end.date,
          is_busy: event.busy !== false,
          event_data: event,
          last_synced: new Date().toISOString()
        }, {
          onConflict: 'practitioner_serial,provider,external_event_id'
        });
    }
    
  } catch (error) {
    console.error('[Google Calendar Sync] Error:', error);
  }
}

// ========================================== 
// CRM CLIENT SYNC
// ========================================== 

export async function handleCRMClientSync(req, res) {
  try {
    const {
      practitioner_serial,
      client_id,
      client_name,
      client_email,
      client_phone,
      services_offered,
      sync_provider
    } = req.body;
    
    // Get practitioner's CRM integration
    const supabase = createAdminClient();
    const { data: crmIntegration } = await supabase
      .from('crm_integrations')
      .select('*')
      .eq('practitioner_serial', practitioner_serial)
      .eq('provider', sync_provider)
      .eq('is_active', true)
      .single();
    
    if (!crmIntegration) {
      return res.status(404).json({ error: `${sync_provider} integration not configured` });
    }
    
    const apiKey = await decryptData(crmIntegration.api_key);
    
    // Route to appropriate CRM handler
    let result;
    switch (sync_provider) {
      case 'hubspot':
        result = await syncToHubSpot(apiKey, {
          client_name, client_email, client_phone, services_offered
        });
        break;
      case 'pipedrive':
        result = await syncToPipedrive(apiKey, {
          client_name, client_email, client_phone, services_offered
        });
        break;
      default:
        return res.status(400).json({ error: 'Unsupported CRM provider' });
    }
    
    // Log the sync
    await supabase
      .from('crm_sync_logs')
      .insert({
        practitioner_serial,
        client_id,
        sync_provider,
        status_update: 'contact_created',
        crm_contact_id: result.contact_id,
        sync_payload: { client_name, client_email, client_phone, services_offered },
        response_status: result.status
      });
    
    res.json({
      success: true,
      crm_contact_id: result.contact_id,
      crm_deal_id: result.deal_id || null
    });
    
  } catch (error) {
    console.error('[CRM Sync] Error:', error);
    res.status(500).json({ error: 'CRM sync failed' });
  }
}

// ========================================== 
// HUBSPOT INTEGRATION
// ========================================== 

async function syncToHubSpot(apiKey, clientData) {
  try {
    // Create contact in HubSpot
    const contactResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          firstname: clientData.client_name.split(' ')[0],
          lastname: clientData.client_name.split(' ')[1] || '',
          email: clientData.client_email,
          phone: clientData.client_phone || '',
          lifecyclestage: 'lead',
          source: 'rooted_vitality'
        }
      })
    });
    
    if (!contactResponse.ok) {
      throw new Error(`HubSpot contact creation failed: ${contactResponse.statusText}`);
    }
    
    const contact = await contactResponse.json();
    
    // Create deal in HubSpot
    const dealResponse = await fetch('https://api.hubapi.com/crm/v3/objects/deals', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          dealname: `${clientData.client_name} - Services Match`,
          dealstage: 'negotiation',
          pipeline: 'default',
          amount: 0,
          closedate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).getTime(),
          description: `Services: ${clientData.services_offered.join(', ')}`
        },
        associations: [
          {
            type: 'deal_contact',
            id: contact.id
          }
        ]
      })
    });
    
    const deal = dealResponse.ok ? await dealResponse.json() : null;
    
    return {
      contact_id: contact.id,
      deal_id: deal?.id || null,
      status: contactResponse.status
    };
    
  } catch (error) {
    console.error('[HubSpot Sync] Error:', error);
    throw error;
  }
}

// ========================================== 
// PIPEDRIVE INTEGRATION
// ========================================== 

async function syncToPipedrive(apiKey, clientData) {
  try {
    // Create person in Pipedrive
    const personResponse = await fetch('https://api.pipedrive.com/v1/persons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: clientData.client_name,
        email: clientData.client_email,
        phone: clientData.client_phone || '',
        api_token: apiKey
      })
    });
    
    if (!personResponse.ok) {
      throw new Error(`Pipedrive person creation failed: ${personResponse.statusText}`);
    }
    
    const person = await personResponse.json();
    
    // Create deal in Pipedrive
    const dealResponse = await fetch('https://api.pipedrive.com/v1/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `${clientData.client_name} - Services Match`,
        person_id: person.data.id,
        pipeline_id: 1, // Default pipeline
        status: 'open',
        api_token: apiKey
      })
    });
    
    const deal = dealResponse.ok ? await dealResponse.json() : null;
    
    return {
      contact_id: person.data.id,
      deal_id: deal?.data?.id || null,
      status: personResponse.status
    };
    
  } catch (error) {
    console.error('[Pipedrive Sync] Error:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function generateRandomString(length) {
  const crypto = require('crypto');
  return crypto.randomBytes(length).toString('hex');
}

async function encryptData(data) {
  // TODO: Implement proper AES-256 encryption with environment secret
  // For now, using Supabase's built-in encryption (via column encryption)
  // In production, use: crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY)
  return Buffer.from(data).toString('base64');
}

async function decryptData(encryptedData) {
  // TODO: Implement proper AES-256 decryption
  // For now, reverse the base64 encoding
  return Buffer.from(encryptedData, 'base64').toString('utf-8');
}

function createAdminClient() {
  // Return Supabase admin client with service role key
  // This allows bypassing RLS policies for backend operations
  const { createClient } = require('@supabase/supabase-js');
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// Mock cache manager (replace with Redis in production)
const cacheManager = {
  cache: {},
  set(key, value, ttl) {
    this.cache[key] = value;
    if (ttl) {
      setTimeout(() => delete this.cache[key], ttl * 1000);
    }
    return Promise.resolve();
  },
  get(key) {
    return Promise.resolve(this.cache[key] || null);
  },
  del(key) {
    delete this.cache[key];
    return Promise.resolve();
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 7. MODULE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  handleCRMOAuthInit,
  handleCRMOAuthCallback,
  handleSaveCredentials,
  handleCRMDisconnect,
  handleGoogleOAuthInit,
  handleGoogleOAuthCallback,
  handleCRMClientSync,
  syncToHubSpot,
  syncToPipedrive
};

























































