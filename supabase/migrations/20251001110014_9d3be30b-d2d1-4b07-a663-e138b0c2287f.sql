-- Add missing fields to vehicles table for Fleet management
ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('kamper', 'przyczepa')),
ADD COLUMN IF NOT EXISTS brand TEXT,
ADD COLUMN IF NOT EXISTS year INTEGER,
ADD COLUMN IF NOT EXISTS location TEXT;

-- Update status to include archived
ALTER TABLE public.vehicles
DROP CONSTRAINT IF EXISTS vehicles_status_check;

ALTER TABLE public.vehicles
ADD CONSTRAINT vehicles_status_check CHECK (status IN ('available', 'rented', 'maintenance', 'archived'));