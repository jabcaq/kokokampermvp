-- Add trailer_weight column to vehicles table for trailers
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS trailer_weight numeric;