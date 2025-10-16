-- Add number_of_travelers column to contracts table
ALTER TABLE public.contracts 
ADD COLUMN number_of_travelers integer;