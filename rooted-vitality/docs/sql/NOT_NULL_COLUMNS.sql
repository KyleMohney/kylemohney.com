-- Check which columns are NOT NULL
SELECT column_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'practitioners'
AND is_nullable = 'NO'
ORDER BY ordinal_position;
