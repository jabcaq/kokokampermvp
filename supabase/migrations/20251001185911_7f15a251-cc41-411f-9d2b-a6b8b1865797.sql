-- Add new umowa_id column for old database reference
ALTER TABLE public.documents
ADD COLUMN umowa_id TEXT;

-- First, convert empty strings and invalid UUIDs to NULL
UPDATE public.documents
SET contract_id = NULL
WHERE contract_id = '' OR contract_id IS NOT NULL AND contract_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Change contract_id back to UUID for proper foreign key relationship
ALTER TABLE public.documents
ALTER COLUMN contract_id TYPE UUID USING 
  CASE 
    WHEN contract_id IS NULL OR contract_id = '' THEN NULL
    ELSE contract_id::uuid
  END;

-- Add foreign key constraint back
ALTER TABLE public.documents
ADD CONSTRAINT documents_contract_id_fkey 
FOREIGN KEY (contract_id) 
REFERENCES public.contracts(id) 
ON DELETE CASCADE;