-- Add is_archived column to contracts table
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;

-- Create index for faster queries on archived contracts
CREATE INDEX IF NOT EXISTS idx_contracts_is_archived ON contracts(is_archived);