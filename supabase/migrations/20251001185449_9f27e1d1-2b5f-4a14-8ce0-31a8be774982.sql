-- Drop the foreign key constraint and change contract_id to TEXT
ALTER TABLE public.documents
DROP CONSTRAINT IF EXISTS documents_contract_id_fkey;

-- Change contract_id column type from UUID to TEXT
ALTER TABLE public.documents
ALTER COLUMN contract_id TYPE TEXT;