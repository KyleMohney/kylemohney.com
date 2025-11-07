-- ============================================================================
-- RETROACTIVE REVIEW NOTIFICATIONS
-- ============================================================================
-- This script inserts notifications for existing reviews that don't have them
-- Useful for sending notifications for reviews created before notification system

-- Insert notifications for all reviews that don't already have a notification
INSERT INTO notifications (practitioner_id, type, title, message, link, is_read, created_at)
SELECT 
  r.practitioner_id,
  'review_posted',
  'New Review',
  'You received a new ' || r.rating || '-star review: "' || SUBSTRING(r.review_text, 1, 50) || CASE WHEN LENGTH(r.review_text) > 50 THEN '..."' ELSE '"' END,
  '/rooted-vitality/dashboard/pro/pages/reviews.html',
  false,
  r.created_at
FROM reviews r
WHERE r.practitioner_id NOT IN (
  SELECT DISTINCT practitioner_id FROM notifications WHERE type = 'review_posted'
)
AND r.is_visible = true
ON CONFLICT DO NOTHING;

-- ============================================================================
-- END RETROACTIVE NOTIFICATIONS
-- ============================================================================
