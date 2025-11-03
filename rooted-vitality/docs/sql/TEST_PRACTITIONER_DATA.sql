-- Quick test: Check if your practitioner record exists
-- Replace YOUR_USER_ID with your actual user ID from auth

SELECT id, user_id, legal_name, location, years_in_practice, business_size, updated_at
FROM practitioners
WHERE user_id = 'YOUR_USER_ID'
LIMIT 1;

-- Also check all practitioners to see what's there
SELECT id, user_id, legal_name, location, years_in_practice, created_at
FROM practitioners
ORDER BY created_at DESC
LIMIT 10;
