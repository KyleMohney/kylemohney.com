-- Add custom_name column to projects table
-- This allows clients to rename their projects with custom titles
-- Defaults to category_name if not set, allowing personalization

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS custom_name TEXT;

-- Add comment to document the field
COMMENT ON COLUMN projects.custom_name IS 'Client-editable custom project title. If blank, displays category_name. Allows clients to personalize project names (e.g., "Recovery Wellness", "My Pregnancy Journey")';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_custom_name ON projects(custom_name);

-- Verify the column was added
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name = 'custom_name';
