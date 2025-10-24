-- Add deposit_received field to contracts table
ALTER TABLE public.contracts 
ADD COLUMN deposit_received boolean DEFAULT false;

-- Add deposit_received_at field to track when it was marked
ALTER TABLE public.contracts
ADD COLUMN deposit_received_at timestamp with time zone DEFAULT null;