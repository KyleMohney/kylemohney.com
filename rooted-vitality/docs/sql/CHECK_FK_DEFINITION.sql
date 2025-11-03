-- Check the foreign key definition without referencing the users table
SELECT
    tc.constraint_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu USING (constraint_schema, constraint_name)
JOIN information_schema.constraint_column_usage AS ccu USING (constraint_schema, constraint_name)
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='practitioners';

-- Also check practitioners table info
SELECT id, user_id, email, legal_name FROM practitioners LIMIT 3;
