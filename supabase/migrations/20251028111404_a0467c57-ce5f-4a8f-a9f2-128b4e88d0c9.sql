-- Add missing columns to clients table to store tenant information
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS id_type text,
ADD COLUMN IF NOT EXISTS id_number text,
ADD COLUMN IF NOT EXISTS id_issuer text,
ADD COLUMN IF NOT EXISTS pesel text,
ADD COLUMN IF NOT EXISTS nip text,
ADD COLUMN IF NOT EXISTS license_number text,
ADD COLUMN IF NOT EXISTS license_date date,
ADD COLUMN IF NOT EXISTS license_category text,
ADD COLUMN IF NOT EXISTS trailer_license_category text,
ADD COLUMN IF NOT EXISTS company_name text;

-- Update existing clients with data from their most recent contract
UPDATE public.clients c
SET 
  address = COALESCE(c.address, sub.tenant_address),
  id_type = COALESCE(c.id_type, sub.tenant_id_type),
  id_number = COALESCE(c.id_number, sub.tenant_id_number),
  id_issuer = COALESCE(c.id_issuer, sub.tenant_id_issuer),
  pesel = COALESCE(c.pesel, sub.tenant_pesel),
  nip = COALESCE(c.nip, sub.tenant_nip),
  license_number = COALESCE(c.license_number, sub.tenant_license_number),
  license_date = COALESCE(c.license_date, sub.tenant_license_date),
  license_category = COALESCE(c.license_category, sub.tenant_license_category),
  trailer_license_category = COALESCE(c.trailer_license_category, sub.tenant_trailer_license_category),
  company_name = COALESCE(c.company_name, sub.tenant_company_name),
  phone = COALESCE(c.phone, sub.tenant_phone),
  email = COALESCE(c.email, sub.tenant_email),
  name = COALESCE(c.name, sub.tenant_name)
FROM (
  SELECT DISTINCT ON (client_id)
    client_id,
    tenant_address,
    tenant_id_type,
    tenant_id_number,
    tenant_id_issuer,
    tenant_pesel,
    tenant_nip,
    tenant_license_number,
    tenant_license_date,
    tenant_license_category,
    tenant_trailer_license_category,
    tenant_company_name,
    tenant_phone,
    tenant_email,
    tenant_name
  FROM public.contracts
  WHERE client_id IS NOT NULL
    AND (tenant_address IS NOT NULL OR 
         tenant_id_type IS NOT NULL OR 
         tenant_id_number IS NOT NULL OR
         tenant_pesel IS NOT NULL OR
         tenant_nip IS NOT NULL OR
         tenant_license_number IS NOT NULL)
  ORDER BY client_id, created_at DESC
) sub
WHERE c.id = sub.client_id;