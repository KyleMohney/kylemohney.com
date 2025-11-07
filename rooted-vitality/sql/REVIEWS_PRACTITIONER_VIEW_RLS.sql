-- ============================================================================
-- REVIEWS RLS - PRACTITIONERS CAN VIEW OWN REVIEWS
-- ============================================================================

-- Practitioners can view reviews for their profiles (approved or not)
CREATE POLICY "Practitioners can view own reviews" ON reviews
FOR SELECT
USING (
  practitioner_id = auth.uid()
);

-- Public can view approved, visible reviews
CREATE POLICY "Public can view approved reviews" ON reviews
FOR SELECT
USING (
  is_approved = true AND is_visible = true
);
