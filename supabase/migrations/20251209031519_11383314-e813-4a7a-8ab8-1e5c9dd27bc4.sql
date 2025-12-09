-- Add additional_vehicles column to contracts table for multi-vehicle contracts
ALTER TABLE public.contracts 
ADD COLUMN additional_vehicles jsonb DEFAULT '[]'::jsonb;

-- Comment explaining the structure
COMMENT ON COLUMN public.contracts.additional_vehicles IS 'Array of additional vehicles: [{model, vin, registration_number, type, cleaning, animals, extra_equipment, next_inspection_date, insurance_policy_number, insurance_valid_until, additional_info}]';