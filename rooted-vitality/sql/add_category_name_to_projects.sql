-- Add category_name column to projects table
-- This stores the human-readable category name (e.g., "Acupuncture & TCM") alongside category_id

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS category_name text;

-- Add comment to document the field
COMMENT ON COLUMN projects.category_name IS 'Human-readable category name (e.g., "Acupuncture & TCM"). Stored at project creation time for easy reference.';

-- Verify the column was added
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name = 'category_name';
