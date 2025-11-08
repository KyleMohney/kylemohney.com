-- ============================================================================
-- FIX: Remove Duplicate Review Notification from All Users
-- ============================================================================
-- Problem: Review notification ID af1f1a89-ba3d-4e01-a83d-6fa9601ada18 was 
-- retroactively added to ALL practitioners instead of just Kyle's account
-- 
-- Solution: Delete from all users, verify Kyle still has it
-- ============================================================================

-- STEP 1: Verify the problematic notification exists
SELECT id, practitioner_id, type, title, message, created_at
FROM notifications
WHERE id = 'af1f1a89-ba3d-4e01-a83d-6fa9601ada18';

-- STEP 2: Find Kyle's user_id (kylejmohney@gmail.com)
SELECT id AS kyle_user_id, email
FROM auth.users 
WHERE email = 'kylejmohney@gmail.com';

-- STEP 3: Check how many practitioners have this notification
-- (This will show us the scope of the duplication problem)
SELECT COUNT(*) as affected_user_count
FROM notifications
WHERE id = 'af1f1a89-ba3d-4e01-a83d-6fa9601ada18'
  OR (type = 'review_posted' 
      AND message = 'You received a new 5-star review: "Take 103 here goes nothing"'
      AND created_at = '2025-11-07 20:20:20.540121+00');

-- STEP 4: DELETE the notification from all users EXCEPT Kyle
-- This deletes the specific notification ID from all practitioners
DELETE FROM notifications
WHERE id = 'af1f1a89-ba3d-4e01-a83d-6fa9601ada18'
  AND practitioner_id != (SELECT id FROM auth.users WHERE email = 'kylejmohney@gmail.com');

-- STEP 5: Verify deletion worked - Kyle should have exactly 1 of these
SELECT COUNT(*) as kyle_notification_count, practitioner_id, email
FROM notifications
JOIN auth.users ON notifications.practitioner_id = auth.users.id
WHERE id = 'af1f1a89-ba3d-4e01-a83d-6fa9601ada18'
GROUP BY practitioner_id, email;

-- STEP 6: Verify no other users have this notification
SELECT COUNT(*) as remaining_on_other_users
FROM notifications
WHERE id = 'af1f1a89-ba3d-4e01-a83d-6fa9601ada18'
  AND practitioner_id != (SELECT id FROM auth.users WHERE email = 'kylejmohney@gmail.com');

-- ============================================================================
-- VERIFICATION: New Review Notifications Going Forward
-- ============================================================================
-- The reviewsManager.js code (line 408) correctly creates notifications with:
--   practitioner_id: practitionerUserId
-- This ensures EACH notification is tied to a SPECIFIC practitioner
-- 
-- All new review notifications will automatically be user-isolated.
-- No schema changes needed - the RLS policies ensure user isolation.
-- ============================================================================

-- View current notifications by user (verify isolation works)
SELECT 
  au.email,
  COUNT(n.id) as notification_count,
  n.type,
  MAX(n.created_at) as last_notification
FROM notifications n
JOIN auth.users au ON n.practitioner_id = au.id
WHERE n.type = 'review_posted'
GROUP BY au.email, n.type
ORDER BY au.email;

-- ============================================================================
-- END OF FIX
-- ============================================================================
