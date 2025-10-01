-- Table for tracking contract documents (generated contracts, sent documents)
CREATE TABLE public.contract_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'contract', 'verification', etc.
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'generated', 'sent', 'verified'
  generated_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  sent_to_email TEXT,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for tracking invoices and accounting submissions
CREATE TABLE public.contract_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  invoice_type TEXT NOT NULL, -- 'reservation', 'main_payment', 'final'
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'submitted', 'invoice_uploaded', 'completed'
  submitted_at TIMESTAMP WITH TIME ZONE,
  invoice_file_url TEXT,
  invoice_uploaded_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.contract_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contract_documents
CREATE POLICY "Allow public read access to contract_documents"
  ON public.contract_documents FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to contract_documents"
  ON public.contract_documents FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to contract_documents"
  ON public.contract_documents FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete access to contract_documents"
  ON public.contract_documents FOR DELETE
  USING (true);

-- RLS Policies for contract_invoices
CREATE POLICY "Allow public read access to contract_invoices"
  ON public.contract_invoices FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to contract_invoices"
  ON public.contract_invoices FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to contract_invoices"
  ON public.contract_invoices FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete access to contract_invoices"
  ON public.contract_invoices FOR DELETE
  USING (true);

-- Add triggers for updated_at
CREATE TRIGGER update_contract_documents_updated_at
  BEFORE UPDATE ON public.contract_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_contract_invoices_updated_at
  BEFORE UPDATE ON public.contract_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create storage bucket for invoices
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for invoices bucket
CREATE POLICY "Allow public upload to invoices"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'invoices');

CREATE POLICY "Allow public read from invoices"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'invoices');

CREATE POLICY "Allow public update to invoices"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'invoices');

CREATE POLICY "Allow public delete from invoices"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'invoices');