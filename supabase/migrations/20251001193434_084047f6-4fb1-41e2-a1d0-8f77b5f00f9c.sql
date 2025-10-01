-- Add umowa_text column to contracts table
ALTER TABLE public.contracts 
ADD COLUMN umowa_text text;