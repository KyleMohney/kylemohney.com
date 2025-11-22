/**
 * CRM Integration API Endpoints
 * Backend handlers for Google OAuth, CRM syncing, and calendar integration
 * 
 * Endpoints:
 * POST /api/calendar/google-oauth-init - Start Google OAuth flow
 * POST /api/calendar/google-oauth-callback - Handle OAuth callback
 * POST /api/crm/sync-client - Sync single client to CRM
 * POST /api/crm/hubspot-init - Initialize HubSpot integration
 * POST /api/crm/pipedrive-init - Initialize Pipedrive integration
 * GET /api/crm/status - Get integration status
 */

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
    
    console.log(`[Google Calendar] Synced ${events.length} events for ${practitioner_serial}`);
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

// ========================================== 
// HELPER FUNCTIONS
// ========================================== 

function generateRandomString(length) {
  return require('crypto').randomBytes(length).toString('hex');
}

async function encryptData(data) {
  // TODO: Implement AES-256 encryption
  // For now, use base64 encoding + environment secret
  return Buffer.from(data).toString('base64');
}

async function decryptData(encryptedData) {
  // TODO: Implement AES-256 decryption
  return Buffer.from(encryptedData, 'base64').toString('utf-8');
}

function createAdminClient() {
  // Return Supabase admin client with service role key
  // See: supabaseClient.js
}
