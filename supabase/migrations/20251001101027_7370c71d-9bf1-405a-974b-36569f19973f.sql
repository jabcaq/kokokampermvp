-- Create enum types for status fields
CREATE TYPE contract_status AS ENUM ('active', 'completed', 'cancelled', 'pending');
CREATE TYPE inquiry_status AS ENUM ('new', 'in_progress', 'completed', 'archived');

-- Create clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  contracts_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contracts table
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number TEXT NOT NULL UNIQUE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  vehicle_model TEXT NOT NULL,
  registration_number TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status contract_status DEFAULT 'pending',
  value DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inquiries table
CREATE TABLE public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status inquiry_status DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vehicle_handovers table
CREATE TABLE public.vehicle_handovers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  mileage INTEGER NOT NULL,
  fuel_level INTEGER NOT NULL CHECK (fuel_level >= 0 AND fuel_level <= 100),
  handover_protocol_files JSONB DEFAULT '[]'::jsonb,
  photos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vehicle_returns table
CREATE TABLE public.vehicle_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  employee_id TEXT,
  employee_name TEXT NOT NULL,
  can_refund_deposit BOOLEAN DEFAULT false,
  deposit_refunded_cash BOOLEAN DEFAULT false,
  vehicle_issue BOOLEAN DEFAULT false,
  fuel_level INTEGER NOT NULL CHECK (fuel_level >= 0 AND fuel_level <= 100),
  mileage INTEGER NOT NULL,
  photos JSONB DEFAULT '[]'::jsonb,
  return_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic updated_at
CREATE TRIGGER set_updated_at_clients
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_contracts
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_inquiries
  BEFORE UPDATE ON public.inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_vehicle_handovers
  BEFORE UPDATE ON public.vehicle_handovers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_vehicle_returns
  BEFORE UPDATE ON public.vehicle_returns
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_contracts_client_id ON public.contracts(client_id);
CREATE INDEX idx_contracts_status ON public.contracts(status);
CREATE INDEX idx_contracts_contract_number ON public.contracts(contract_number);
CREATE INDEX idx_inquiries_status ON public.inquiries(status);
CREATE INDEX idx_inquiries_email ON public.inquiries(email);
CREATE INDEX idx_vehicle_handovers_contract_id ON public.vehicle_handovers(contract_id);
CREATE INDEX idx_vehicle_returns_contract_id ON public.vehicle_returns(contract_id);

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_handovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_returns ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing public access for now - can be restricted later)
CREATE POLICY "Allow public read access to clients"
  ON public.clients FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to clients"
  ON public.clients FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to clients"
  ON public.clients FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Allow public delete access to clients"
  ON public.clients FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Allow public read access to contracts"
  ON public.contracts FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to contracts"
  ON public.contracts FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to contracts"
  ON public.contracts FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Allow public delete access to contracts"
  ON public.contracts FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Allow public read access to inquiries"
  ON public.inquiries FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to inquiries"
  ON public.inquiries FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to inquiries"
  ON public.inquiries FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Allow public delete access to inquiries"
  ON public.inquiries FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Allow public read access to vehicle_handovers"
  ON public.vehicle_handovers FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to vehicle_handovers"
  ON public.vehicle_handovers FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to vehicle_handovers"
  ON public.vehicle_handovers FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Allow public delete access to vehicle_handovers"
  ON public.vehicle_handovers FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Allow public read access to vehicle_returns"
  ON public.vehicle_returns FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to vehicle_returns"
  ON public.vehicle_returns FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to vehicle_returns"
  ON public.vehicle_returns FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Allow public delete access to vehicle_returns"
  ON public.vehicle_returns FOR DELETE
  TO public
  USING (true);