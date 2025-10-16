-- Add additional vehicle option fields to contracts table
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS vehicle_cleaning text,
ADD COLUMN IF NOT EXISTS vehicle_animals text,
ADD COLUMN IF NOT EXISTS vehicle_extra_equipment text;