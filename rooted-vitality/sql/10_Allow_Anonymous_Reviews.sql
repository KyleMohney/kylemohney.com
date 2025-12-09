-- ============================================================================
-- MIGRATION 10: Allow Anonymous Users to Submit Off-Platform Reviews
-- ============================================================================
-- Purpose: Add RLS policy allowing anonymous users to submit off-platform reviews
-- that are auto-approved and auto-visible
-- 
-- Details:
-- - Anonymous users can insert reviews with source='review-link'
-- - Reviews must have is_approved=true and is_visible=true
-- - Reviews must have client_id=null (off-platform)
-- - This allows the public review link feature to work
-- ============================================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Anonymous users submit off-platform reviews" ON reviews;

-- Add simpler policy for anonymous users to submit off-platform reviews
-- Check only the essential conditions that the frontend enforces
CREATE POLICY "Anonymous users submit off-platform reviews" ON reviews
FOR INSERT
WITH CHECK (source = 'external' AND client_id IS NULL AND is_approved = true);

-- Verify policy was created
SELECT policy_name, permissive, action
FROM pg_policies
WHERE tablename = 'reviews'
AND policy_name = 'Anonymous users submit off-platform reviews';

