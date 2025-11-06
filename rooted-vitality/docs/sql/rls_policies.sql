-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- Rooted Vitality Platform
-- ============================================================================
-- This file contains all RLS policies for the database.
-- Ensures proper data access control and multi-tenancy.
-- Created: 2025-11-05
-- ============================================================================


-- ============================================================================
-- PROJECTS TABLE POLICIES
-- ============================================================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_select_policy" ON projects;
DROP POLICY IF EXISTS "projects_insert_policy" ON projects;
DROP POLICY IF EXISTS "projects_update_policy" ON projects;
DROP POLICY IF EXISTS "projects_delete_policy" ON projects;

-- SELECT: Clients see their own, practitioners see open-to-contact projects
CREATE POLICY "projects_select_policy" ON projects
FOR SELECT
USING (
  client_serial IN (
    SELECT serial_number 
    FROM clients 
    WHERE user_id = auth.uid()
  )
  OR
  (
    client_open_to_contact = true
    AND EXISTS (
      SELECT 1 
      FROM practitioners 
      WHERE user_id = auth.uid()
    )
  )
);

-- INSERT: Only clients can create projects
CREATE POLICY "projects_insert_policy" ON projects
FOR INSERT
WITH CHECK (
  client_serial IN (
    SELECT serial_number 
    FROM clients 
    WHERE user_id = auth.uid()
  )
);

-- UPDATE: Only clients can update their own projects
CREATE POLICY "projects_update_policy" ON projects
FOR UPDATE
USING (
  client_serial IN (
    SELECT serial_number 
    FROM clients 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  client_serial IN (
    SELECT serial_number 
    FROM clients 
    WHERE user_id = auth.uid()
  )
);

-- DELETE: Only clients can delete their own projects
CREATE POLICY "projects_delete_policy" ON projects
FOR DELETE
USING (
  client_serial IN (
    SELECT serial_number 
    FROM clients 
    WHERE user_id = auth.uid()
  )
);


-- ============================================================================
-- PROJECT_PRACTITIONER_MATCHES TABLE POLICIES
-- ============================================================================

ALTER TABLE project_practitioner_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "matches_select_policy" ON project_practitioner_matches;
DROP POLICY IF EXISTS "matches_insert_policy" ON project_practitioner_matches;
DROP POLICY IF EXISTS "matches_update_policy" ON project_practitioner_matches;
DROP POLICY IF EXISTS "matches_delete_policy" ON project_practitioner_matches;

-- SELECT: Clients see matches for their projects, practitioners see their matches
CREATE POLICY "matches_select_policy" ON project_practitioner_matches
FOR SELECT
USING (
  client_serial IN (
    SELECT serial_number 
    FROM clients 
    WHERE user_id = auth.uid()
  )
  OR
  practitioner_serial IN (
    SELECT serial_number 
    FROM practitioners 
    WHERE user_id = auth.uid()
  )
);

-- INSERT: Practitioners can apply, clients can invite
CREATE POLICY "matches_insert_policy" ON project_practitioner_matches
FOR INSERT
WITH CHECK (
  practitioner_serial IN (
    SELECT serial_number 
    FROM practitioners 
    WHERE user_id = auth.uid()
  )
  OR
  client_serial IN (
    SELECT serial_number 
    FROM clients 
    WHERE user_id = auth.uid()
  )
);

-- UPDATE: Both parties can update status
CREATE POLICY "matches_update_policy" ON project_practitioner_matches
FOR UPDATE
USING (
  practitioner_serial IN (
    SELECT serial_number 
    FROM practitioners 
    WHERE user_id = auth.uid()
  )
  OR
  client_serial IN (
    SELECT serial_number 
    FROM clients 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  practitioner_serial IN (
    SELECT serial_number 
    FROM practitioners 
    WHERE user_id = auth.uid()
  )
  OR
  client_serial IN (
    SELECT serial_number 
    FROM clients 
    WHERE user_id = auth.uid()
  )
);

-- DELETE: Either party can remove a match
CREATE POLICY "matches_delete_policy" ON project_practitioner_matches
FOR DELETE
USING (
  practitioner_serial IN (
    SELECT serial_number 
    FROM practitioners 
    WHERE user_id = auth.uid()
  )
  OR
  client_serial IN (
    SELECT serial_number 
    FROM clients 
    WHERE user_id = auth.uid()
  )
);


-- ============================================================================
-- PROJECT_CLIENT_CONCERNS TABLE POLICIES
-- ============================================================================

ALTER TABLE project_client_concerns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "concerns_select_policy" ON project_client_concerns;
DROP POLICY IF EXISTS "concerns_insert_policy" ON project_client_concerns;
DROP POLICY IF EXISTS "concerns_update_policy" ON project_client_concerns;
DROP POLICY IF EXISTS "concerns_delete_policy" ON project_client_concerns;

-- SELECT: Anyone who can see the project can see its concerns
CREATE POLICY "concerns_select_policy" ON project_client_concerns
FOR SELECT
USING (
  project_id IN (SELECT id FROM projects)
);

-- INSERT: Only project owner can add concerns
CREATE POLICY "concerns_insert_policy" ON project_client_concerns
FOR INSERT
WITH CHECK (
  project_id IN (
    SELECT id 
    FROM projects 
    WHERE client_serial IN (
      SELECT serial_number 
      FROM clients 
      WHERE user_id = auth.uid()
    )
  )
);

-- UPDATE: Only project owner can update concerns
CREATE POLICY "concerns_update_policy" ON project_client_concerns
FOR UPDATE
USING (
  project_id IN (
    SELECT id 
    FROM projects 
    WHERE client_serial IN (
      SELECT serial_number 
      FROM clients 
      WHERE user_id = auth.uid()
    )
  )
)
WITH CHECK (
  project_id IN (
    SELECT id 
    FROM projects 
    WHERE client_serial IN (
      SELECT serial_number 
      FROM clients 
      WHERE user_id = auth.uid()
    )
  )
);

-- DELETE: Only project owner can remove concerns
CREATE POLICY "concerns_delete_policy" ON project_client_concerns
FOR DELETE
USING (
  project_id IN (
    SELECT id 
    FROM projects 
    WHERE client_serial IN (
      SELECT serial_number 
      FROM clients 
      WHERE user_id = auth.uid()
    )
  )
);


-- ============================================================================
-- REVIEWS TABLE POLICIES
-- ============================================================================

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_select_policy" ON reviews;
DROP POLICY IF EXISTS "reviews_insert_policy" ON reviews;
DROP POLICY IF EXISTS "reviews_update_policy" ON reviews;
DROP POLICY IF EXISTS "reviews_delete_policy" ON reviews;

-- SELECT: Reviews are public, everyone can see them
CREATE POLICY "reviews_select_policy" ON reviews
FOR SELECT
USING (true);

-- INSERT: Only clients can write reviews
CREATE POLICY "reviews_insert_policy" ON reviews
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM clients 
    WHERE user_id = auth.uid()
  )
);

-- UPDATE: Only review author can update
CREATE POLICY "reviews_update_policy" ON reviews
FOR UPDATE
USING (
  client_id IN (
    SELECT id 
    FROM clients 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  client_id IN (
    SELECT id 
    FROM clients 
    WHERE user_id = auth.uid()
  )
);

-- DELETE: Only review author can delete
CREATE POLICY "reviews_delete_policy" ON reviews
FOR DELETE
USING (
  client_id IN (
    SELECT id 
    FROM clients 
    WHERE user_id = auth.uid()
  )
);


-- ============================================================================
-- END OF RLS POLICIES
-- ============================================================================
