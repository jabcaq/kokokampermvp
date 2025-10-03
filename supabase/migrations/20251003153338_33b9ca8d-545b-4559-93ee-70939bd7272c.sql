-- Add invoice_type column to contracts table
ALTER TABLE contracts ADD COLUMN invoice_type TEXT CHECK (invoice_type IN ('receipt', 'invoice')) DEFAULT 'receipt';