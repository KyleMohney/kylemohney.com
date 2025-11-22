╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: 02_ROW_LEVEL_SECURITY_MASTER.sql                            ║
║  Purpose: All RLS policies for auth and data access control         ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

-- ============================================================================
-- MASTER: ROW LEVEL SECURITY POLICIES
-- ============================================================================
-- Consolidated RLS policies for all tables
-- Source of truth for authentication and authorization
-- Last Updated: November 8, 2025
-- ============================================================================

-- ============================================================================
-- SECTION 1: CLIENTS TABLE
-- ============================================================================
-- Users see only their own client profile

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own client profile" ON clients;
DROP POLICY IF EXISTS "Users can update their own client profile" ON clients;
DROP POLICY IF EXISTS "Users can view their own client profile" ON clients;
DROP POLICY IF EXISTS "clients_select_policy" ON clients;
DROP POLICY IF EXISTS "clients_update_policy" ON clients;

-- SELECT: Users can see their own client record
CREATE POLICY "clients_select_policy" ON clients
FOR SELECT
USING (id = auth.uid());

-- UPDATE: Users can update their own client record
CREATE POLICY "clients_update_policy" ON clients
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- INSERT: Users can insert their own client profile
CREATE POLICY "clients_insert_policy" ON clients
FOR INSERT
WITH CHECK (auth.uid() = id);

-- ============================================================================
-- SECTION 2: PRACTITIONERS TABLE
-- ============================================================================
-- Users see only their own practitioner profile
-- Public can see approved practitioner profiles

ALTER TABLE practitioners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Practitioners see own profile" ON practitioners;
DROP POLICY IF EXISTS "Public can view approved practitioners" ON practitioners;

-- SELECT: Practitioners see their own profile (or public sees non-deleted profiles)
CREATE POLICY "Practitioners see own profile" ON practitioners
FOR SELECT
USING (id = auth.uid());

-- SELECT: Public can see non-deleted approved profiles
CREATE POLICY "Public view practitioners" ON practitioners
FOR SELECT
USING (deleted_at IS NULL AND status = 'registered');

-- UPDATE: Practitioners can update their own profile
CREATE POLICY "Practitioners update own profile" ON practitioners
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- INSERT: Practitioners can create their own profile
CREATE POLICY "Practitioners create profile" ON practitioners
FOR INSERT
WITH CHECK (id = auth.uid());

-- ============================================================================
-- SECTION 3: PROJECTS TABLE
-- ============================================================================
-- Clients see only their own projects
-- Practitioners can see projects they're matched with

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients see own projects" ON projects;
DROP POLICY IF EXISTS "Practitioners see matched projects" ON projects;

-- SELECT: Clients see their own projects
CREATE POLICY "Clients see own projects" ON projects
FOR SELECT
USING (
  client_serial = auth.uid()
);

-- UPDATE: Clients can update their own projects
CREATE POLICY "Clients update own projects" ON projects
FOR UPDATE
USING (client_serial = auth.uid())
WITH CHECK (client_serial = auth.uid());

-- INSERT: Clients can create projects
CREATE POLICY "Clients create projects" ON projects
FOR INSERT
WITH CHECK (client_serial = auth.uid());

-- ============================================================================
-- SECTION 4: PROJECT_PRACTITIONER_MATCHES TABLE
-- ============================================================================
-- Clients see matches for their projects
-- Practitioners see matches they're involved in

ALTER TABLE project_practitioner_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients see project matches" ON project_practitioner_matches;
DROP POLICY IF EXISTS "Practitioners see own matches" ON project_practitioner_matches;

-- SELECT: Clients see matches for their projects
CREATE POLICY "Clients see project matches" ON project_practitioner_matches
FOR SELECT
USING (
  project_id IN (
    SELECT project_id FROM projects WHERE client_serial = auth.uid()
  )
);

-- SELECT: Practitioners see matches they're involved in
CREATE POLICY "Practitioners see own matches" ON project_practitioner_matches
FOR SELECT
USING (
  practitioner_serial = auth.uid()
);

-- UPDATE: Matches can be updated by client or practitioner
CREATE POLICY "Participants update matches" ON project_practitioner_matches
FOR UPDATE
USING (
  project_id IN (SELECT project_id FROM projects WHERE client_serial = auth.uid())
  OR practitioner_serial = auth.uid()
)
WITH CHECK (
  project_id IN (SELECT project_id FROM projects WHERE client_serial = auth.uid())
  OR practitioner_serial = auth.uid()
);

-- INSERT: Matches created by service role (server-side)
CREATE POLICY "Service role inserts matches" ON project_practitioner_matches
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- SECTION 5: REVIEWS TABLE
-- ============================================================================
-- Public can view approved reviews
-- Practitioners can view all reviews on their profile
-- Clients can view their own reviews

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view approved reviews" ON reviews;
DROP POLICY IF EXISTS "Practitioners can view own reviews" ON reviews;
DROP POLICY IF EXISTS "Clients can view own reviews" ON reviews;

-- SELECT: Public can see approved, visible reviews
CREATE POLICY "Public can view approved reviews" ON reviews
FOR SELECT
USING (is_approved = true AND is_visible = true);

-- SELECT: Practitioners can view all reviews on their profile
CREATE POLICY "Practitioners can view own reviews" ON reviews
FOR SELECT
USING (practitioner_serial = auth.uid());

-- SELECT: Clients can view their own reviews
CREATE POLICY "Clients can view own reviews" ON reviews
FOR SELECT
USING (client_serial = auth.uid());

-- INSERT: Reviews created by service role (server-side)
CREATE POLICY "Service role inserts reviews" ON reviews
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- SECTION 6: NOTIFICATIONS TABLE
-- ============================================================================
-- Practitioners can read and update their own notifications

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Practitioners read own notifications" ON notifications;
DROP POLICY IF EXISTS "Practitioners update own notifications" ON notifications;
DROP POLICY IF EXISTS "Service role inserts notifications" ON notifications;

-- SELECT: Practitioners see their own notifications
CREATE POLICY "Practitioners read own notifications" ON notifications
FOR SELECT
USING (practitioner_serial = auth.uid());

-- UPDATE: Practitioners can mark notifications as read
CREATE POLICY "Practitioners update own notifications" ON notifications
FOR UPDATE
USING (practitioner_serial = auth.uid())
WITH CHECK (practitioner_serial = auth.uid());

-- INSERT: Notifications created by service role
CREATE POLICY "Service role inserts notifications" ON notifications
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- SECTION 7: PRACTITIONER_MATCH_SETTINGS TABLE
-- ============================================================================
-- Practitioners can manage their own match settings and service categories

ALTER TABLE practitioner_match_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Practitioners read own match settings" ON practitioner_match_settings;
DROP POLICY IF EXISTS "Practitioners insert own match settings" ON practitioner_match_settings;
DROP POLICY IF EXISTS "Practitioners update own match settings" ON practitioner_match_settings;

-- SELECT: Practitioners can read their own match settings
CREATE POLICY "Practitioners read own match settings" ON practitioner_match_settings
FOR SELECT
USING (practitioner_serial = auth.uid());

-- INSERT: Practitioners can create their own match settings
CREATE POLICY "Practitioners insert own match settings" ON practitioner_match_settings
FOR INSERT
WITH CHECK (practitioner_serial = auth.uid());

-- UPDATE: Practitioners can update their own match settings
CREATE POLICY "Practitioners update own match settings" ON practitioner_match_settings
FOR UPDATE
USING (practitioner_serial = auth.uid())
WITH CHECK (practitioner_serial = auth.uid());

-- ============================================================================
-- SECTION 8: PROJECT_MESSAGES TABLE
-- ============================================================================
-- Participants in a match can read and send messages

ALTER TABLE project_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Match participants see messages" ON project_messages;
DROP POLICY IF EXISTS "Match participants send messages" ON project_messages;

-- SELECT: Participants see messages for their matches
CREATE POLICY "Match participants see messages" ON project_messages
FOR SELECT
USING (
  (project_id IN (SELECT project_id FROM projects WHERE client_serial = auth.uid()))
  OR (practitioner_serial = auth.uid())
);

-- INSERT: Participants can send messages
CREATE POLICY "Match participants send messages" ON project_messages
FOR INSERT
WITH CHECK (
  (sender_id = auth.uid())
);

-- ============================================================================
-- SECTION 9: PRACTITIONER_SELECTED_SERVICES TABLE
-- ============================================================================
-- Practitioners can manage their selected service categories

ALTER TABLE practitioner_selected_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Practitioners read own selected services" ON practitioner_selected_services;
DROP POLICY IF EXISTS "Practitioners insert own selected services" ON practitioner_selected_services;
DROP POLICY IF EXISTS "Practitioners update own selected services" ON practitioner_selected_services;
DROP POLICY IF EXISTS "Practitioners delete own selected services" ON practitioner_selected_services;

-- SELECT: Practitioners can read their own selected services
CREATE POLICY "Practitioners read own selected services" ON practitioner_selected_services
FOR SELECT
USING (practitioner_serial = auth.uid());

-- INSERT: Practitioners can add their own selected services
CREATE POLICY "Practitioners insert own selected services" ON practitioner_selected_services
FOR INSERT
WITH CHECK (practitioner_serial = auth.uid());

-- UPDATE: Practitioners can update their own selected services (pricing, active status)
CREATE POLICY "Practitioners update own selected services" ON practitioner_selected_services
FOR UPDATE
USING (practitioner_serial = auth.uid())
WITH CHECK (practitioner_serial = auth.uid());

-- DELETE: Practitioners can remove their own selected services
CREATE POLICY "Practitioners delete own selected services" ON practitioner_selected_services
FOR DELETE
USING (practitioner_serial = auth.uid());

-- ============================================================================
-- SECTION 10: PROFILE COMPLETENESS MIGRATION
-- ============================================================================
-- Add profile completeness tracking column to practitioners table
ALTER TABLE practitioners
ADD COLUMN IF NOT EXISTS profile_completeness_percent INTEGER DEFAULT 0;

-- ============================================================================
-- END MASTER: ROW LEVEL SECURITY POLICIES
-- ============================================================================
