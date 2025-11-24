-- ============================================================================
-- ROOTED VITALITY - SCHEMA & CRM INTEGRATION
-- ============================================================================
-- All table definitions and CRM/Calendar integration schemas
-- ============================================================================

-- ========================================== 
-- CRM INTEGRATION TABLES
-- ========================================== 

CREATE TABLE IF NOT EXISTS crm_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_serial TEXT NOT NULL REFERENCES practitioners(serial_number) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('hubspot', 'pipedrive', 'salesforce', 'zoho')),
  api_key TEXT NOT NULL,
  webhook_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sync_frequency TEXT DEFAULT 'real-time' CHECK (sync_frequency IN ('real-time', 'hourly', 'daily')),
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(practitioner_serial, provider)
);

CREATE TABLE IF NOT EXISTS crm_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_serial TEXT NOT NULL REFERENCES practitioners(serial_number) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  sync_provider TEXT NOT NULL,
  status_update TEXT NOT NULL,
  crm_contact_id TEXT,
  crm_deal_id TEXT,
  sync_payload JSONB,
  response_status INTEGER,
  error_message TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_field_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_serial TEXT NOT NULL REFERENCES practitioners(serial_number) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  rooted_field_name TEXT NOT NULL,
  crm_field_name TEXT NOT NULL,
  field_type TEXT,
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(practitioner_serial, provider, rooted_field_name)
);

CREATE TABLE IF NOT EXISTS crm_sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_serial TEXT NOT NULL REFERENCES practitioners(serial_number) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('create_contact', 'update_contact', 'create_deal', 'update_deal', 'update_status')),
  data JSONB NOT NULL,
  sync_provider TEXT NOT NULL,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

-- ========================================== 
-- CALENDAR INTEGRATION TABLES
-- ========================================== 

CREATE TABLE IF NOT EXISTS calendar_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_serial TEXT NOT NULL REFERENCES practitioners(serial_number) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft', 'apple')),
  oauth_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  calendar_id TEXT,
  is_active BOOLEAN DEFAULT true,
  sync_frequency TEXT DEFAULT 'real-time' CHECK (sync_frequency IN ('real-time', '15min', '30min', 'hourly')),
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(practitioner_serial, provider)
);

CREATE TABLE IF NOT EXISTS synced_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_serial TEXT NOT NULL REFERENCES practitioners(serial_number) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  external_event_id TEXT NOT NULL,
  event_title TEXT,
  event_start TIMESTAMP,
  event_end TIMESTAMP,
  is_busy BOOLEAN DEFAULT true,
  event_data JSONB,
  last_synced TIMESTAMP DEFAULT NOW(),
  UNIQUE(practitioner_serial, provider, external_event_id)
);

-- ========================================== 
-- INDEXES
-- ========================================== 

CREATE INDEX IF NOT EXISTS idx_crm_integrations_practitioner ON crm_integrations(practitioner_serial);
CREATE INDEX IF NOT EXISTS idx_crm_integrations_active ON crm_integrations(is_active, practitioner_serial);
CREATE INDEX IF NOT EXISTS idx_crm_sync_logs_practitioner ON crm_sync_logs(practitioner_serial);
CREATE INDEX IF NOT EXISTS idx_crm_sync_logs_client ON crm_sync_logs(client_id, practitioner_serial);
CREATE INDEX IF NOT EXISTS idx_crm_sync_logs_timestamp ON crm_sync_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_crm_sync_queue_status ON crm_sync_queue(status, practitioner_serial);
CREATE INDEX IF NOT EXISTS idx_crm_sync_queue_created ON crm_sync_queue(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_practitioner ON calendar_integrations(practitioner_serial);
CREATE INDEX IF NOT EXISTS idx_synced_events_practitioner ON synced_calendar_events(practitioner_serial);
CREATE INDEX IF NOT EXISTS idx_synced_events_dates ON synced_calendar_events(event_start, event_end);

-- ========================================== 
-- RLS POLICIES - CRM TABLES
-- ========================================== 

ALTER TABLE crm_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_field_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_sync_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Practitioners can manage own CRM integrations"
  ON crm_integrations FOR ALL
  USING (practitioner_serial IN (SELECT serial_number FROM practitioners WHERE id = auth.uid()))
  WITH CHECK (practitioner_serial IN (SELECT serial_number FROM practitioners WHERE id = auth.uid()));

CREATE POLICY "Practitioners can view own CRM sync logs"
  ON crm_sync_logs FOR SELECT
  USING (practitioner_serial IN (SELECT serial_number FROM practitioners WHERE id = auth.uid()));

CREATE POLICY "Practitioners can manage own CRM field mappings"
  ON crm_field_mappings FOR ALL
  USING (practitioner_serial IN (SELECT serial_number FROM practitioners WHERE id = auth.uid()))
  WITH CHECK (practitioner_serial IN (SELECT serial_number FROM practitioners WHERE id = auth.uid()));

CREATE POLICY "Practitioners can view own CRM sync queue"
  ON crm_sync_queue FOR SELECT
  USING (practitioner_serial IN (SELECT serial_number FROM practitioners WHERE id = auth.uid()));

CREATE POLICY "System can manage CRM sync queue"
  ON crm_sync_queue FOR ALL
  USING (TRUE);

-- ========================================== 
-- RLS POLICIES - CALENDAR TABLES
-- ========================================== 

ALTER TABLE calendar_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE synced_calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Practitioners can manage own calendar integrations"
  ON calendar_integrations FOR ALL
  USING (practitioner_serial IN (SELECT serial_number FROM practitioners WHERE id = auth.uid()))
  WITH CHECK (practitioner_serial IN (SELECT serial_number FROM practitioners WHERE id = auth.uid()));

CREATE POLICY "Practitioners can view own synced events"
  ON synced_calendar_events FOR SELECT
  USING (practitioner_serial IN (SELECT serial_number FROM practitioners WHERE id = auth.uid()));
