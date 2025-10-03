-- Remove rental_location and return_by columns from contracts table
ALTER TABLE public.contracts 
DROP COLUMN IF EXISTS rental_location,
DROP COLUMN IF EXISTS return_by;