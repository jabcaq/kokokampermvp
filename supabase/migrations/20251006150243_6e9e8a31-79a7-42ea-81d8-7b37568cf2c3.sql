-- Add inquiry reference columns to contracts table
ALTER TABLE contracts 
ADD COLUMN inquiry_id uuid REFERENCES inquiries(id) ON DELETE SET NULL,
ADD COLUMN inquiry_number text;

-- Create index for better query performance
CREATE INDEX idx_contracts_inquiry_id ON contracts(inquiry_id);
CREATE INDEX idx_contracts_inquiry_number ON contracts(inquiry_number);