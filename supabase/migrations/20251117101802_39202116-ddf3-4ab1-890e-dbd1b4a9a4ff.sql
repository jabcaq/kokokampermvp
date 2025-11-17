-- Add preferred_language column to contracts table
ALTER TABLE public.contracts 
ADD COLUMN preferred_language text DEFAULT 'pl' CHECK (preferred_language IN ('pl', 'en'));