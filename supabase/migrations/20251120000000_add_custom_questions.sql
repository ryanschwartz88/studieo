-- Add custom_questions column to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS custom_questions JSONB DEFAULT '[]'::jsonb;

-- Add answers column to applications table
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS answers JSONB DEFAULT '[]'::jsonb;
