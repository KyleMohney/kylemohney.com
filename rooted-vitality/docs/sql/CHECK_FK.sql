-- Check the foreign key constraint
SELECT constraint_name, table_name, column_name, foreign_table_name, foreign_column_name
FROM information_schema.referential_constraints
WHERE table_name = 'practitioners' AND column_name = 'user_id';

-- Check what users table it's pointing to
SELECT constraint_name
FROM information_schema.table_constraints
WHERE table_name = 'practitioners' AND constraint_type = 'FOREIGN KEY';

-- List practitioners records
SELECT id, user_id, email FROM practitioners LIMIT 10;
