-- Add driving license category field to contracts table for main driver
ALTER TABLE contracts 
ADD COLUMN tenant_license_category TEXT;

-- Note: additional_drivers is already a JSONB column, so we'll update the structure in the application code
-- to include license_category field for each additional driver