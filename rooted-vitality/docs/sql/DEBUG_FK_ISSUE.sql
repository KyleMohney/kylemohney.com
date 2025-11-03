-- Check what user_id values exist and where
SELECT 'practitioners' as table_name, COUNT(*) as row_count, COUNT(DISTINCT user_id) as unique_users
FROM practitioners
UNION ALL
SELECT 'profiles' as table_name, COUNT(*) as row_count, COUNT(DISTINCT id) as unique_users
FROM profiles
UNION ALL
SELECT 'users (if exists)' as table_name, COUNT(*) as row_count, COUNT(DISTINCT id) as unique_users
FROM users;

-- Show sample practitioner records
SELECT id, user_id, email, legal_name FROM practitioners LIMIT 3;

-- Show the foreign key definition
SELECT
    tc.constraint_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu USING (constraint_schema, constraint_name)
JOIN information_schema.constraint_column_usage AS ccu USING (constraint_schema, constraint_name)
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='practitioners';
