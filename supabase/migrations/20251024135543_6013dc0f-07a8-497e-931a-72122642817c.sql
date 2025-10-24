-- Add is_archived column to contract_invoices table
ALTER TABLE contract_invoices 
ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_contract_invoices_archived 
ON contract_invoices(is_archived);

-- Update RLS policy to allow admins to permanently delete
DROP POLICY IF EXISTS "Allow public delete access to contract_invoices" ON contract_invoices;

CREATE POLICY "Only admins can permanently delete contract_invoices"
ON contract_invoices
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));