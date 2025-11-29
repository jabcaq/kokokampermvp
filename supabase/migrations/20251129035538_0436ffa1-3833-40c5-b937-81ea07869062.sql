-- Grant accounting role access to contracts table
CREATE POLICY "Accounting can view contracts" ON public.contracts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'accounting'
  )
);

-- Grant accounting role access to contract_invoices table
CREATE POLICY "Accounting can view contract invoices" ON public.contract_invoices
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'accounting'
  )
);

CREATE POLICY "Accounting can update contract invoices" ON public.contract_invoices
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'accounting'
  )
);

-- Grant accounting role access to clients table (needed to view contract details)
CREATE POLICY "Accounting can view clients" ON public.clients
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'accounting'
  )
);