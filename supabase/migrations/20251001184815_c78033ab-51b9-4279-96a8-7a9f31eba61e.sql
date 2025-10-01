-- Create documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rodzaj TEXT NOT NULL,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  folder TEXT,
  nazwa_pliku TEXT NOT NULL,
  link TEXT,
  path TEXT,
  data DATE,
  rok INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create public access policies
CREATE POLICY "Allow public read access to documents"
  ON public.documents
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to documents"
  ON public.documents
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to documents"
  ON public.documents
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete access to documents"
  ON public.documents
  FOR DELETE
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();