-- Drop existing authenticated-only policies for clients
DROP POLICY IF EXISTS "Authenticated users can view clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can delete clients" ON public.clients;

-- Create public access policies for clients
CREATE POLICY "Allow public read access to clients"
ON public.clients
FOR SELECT
USING (true);

CREATE POLICY "Allow public insert access to clients"
ON public.clients
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update access to clients"
ON public.clients
FOR UPDATE
USING (true);

CREATE POLICY "Allow public delete access to clients"
ON public.clients
FOR DELETE
USING (true);