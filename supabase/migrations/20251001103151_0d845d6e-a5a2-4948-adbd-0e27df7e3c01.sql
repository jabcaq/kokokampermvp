-- Create vehicles table
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model TEXT NOT NULL,
  vin TEXT NOT NULL UNIQUE,
  registration_number TEXT NOT NULL UNIQUE,
  next_inspection_date DATE,
  insurance_policy_number TEXT,
  insurance_valid_until DATE,
  additional_info TEXT,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'rented', 'maintenance')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access to vehicles" 
ON public.vehicles 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access to vehicles" 
ON public.vehicles 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access to vehicles" 
ON public.vehicles 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete access to vehicles" 
ON public.vehicles 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_vehicles_updated_at
BEFORE UPDATE ON public.vehicles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();