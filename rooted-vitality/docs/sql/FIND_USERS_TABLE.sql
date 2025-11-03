-- Check if there are multiple users tables
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_name LIKE '%user%'
ORDER BY table_schema, table_name;

-- Check the foreign key constraint on practitioners
\d practitioners
