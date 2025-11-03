-- List all columns in practitioners table with exact names
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'practitioners'
ORDER BY ordinal_position;
