-- Rename company fields to tenant_company and remove redundant fields
ALTER TABLE contracts 
  RENAME COLUMN company_name TO tenant_company_name;

-- Drop redundant email and phone fields for company
ALTER TABLE contracts 
  DROP COLUMN IF EXISTS company_email,
  DROP COLUMN IF EXISTS company_phone1,
  DROP COLUMN IF EXISTS company_phone2;