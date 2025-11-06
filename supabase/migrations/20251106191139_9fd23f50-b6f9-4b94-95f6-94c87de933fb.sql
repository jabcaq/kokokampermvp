-- Create function to update timestamps if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create table for vehicle documents (OC, Zielona Karta, etc.)
CREATE TABLE IF NOT EXISTS public.vehicle_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'oc', 'green_card', 'inspection', 'other'
  file_name TEXT NOT NULL,
  file_url TEXT,
  issue_date DATE,
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.vehicle_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for vehicle_documents
CREATE POLICY "Allow public read access to vehicle_documents" 
ON public.vehicle_documents 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access to vehicle_documents" 
ON public.vehicle_documents 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access to vehicle_documents" 
ON public.vehicle_documents 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete access to vehicle_documents" 
ON public.vehicle_documents 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_vehicle_documents_updated_at
BEFORE UPDATE ON public.vehicle_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();