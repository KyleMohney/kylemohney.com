-- ============================================================================
-- NOTIFICATIONS TABLE RLS POLICIES
-- ============================================================================

-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Practitioners can read their own notifications
CREATE POLICY "notifications_select_own" ON notifications
FOR SELECT
USING (practitioner_id = auth.uid());

-- Practitioners can update their own notifications (mark as read)
CREATE POLICY "notifications_update_own" ON notifications
FOR UPDATE
USING (practitioner_id = auth.uid())
WITH CHECK (practitioner_id = auth.uid());

-- Service role can insert notifications (for server-side operations)
CREATE POLICY "notifications_insert_service_role" ON notifications
FOR INSERT
WITH CHECK (auth.role() = 'service_role');
