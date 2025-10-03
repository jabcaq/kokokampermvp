-- Add files array column to contract_invoices table
ALTER TABLE contract_invoices ADD COLUMN files jsonb DEFAULT '[]'::jsonb;