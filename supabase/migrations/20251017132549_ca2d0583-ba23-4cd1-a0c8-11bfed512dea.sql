-- Add is_archived column to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;

-- Create index for faster queries on archived documents
CREATE INDEX IF NOT EXISTS idx_documents_is_archived ON documents(is_archived);