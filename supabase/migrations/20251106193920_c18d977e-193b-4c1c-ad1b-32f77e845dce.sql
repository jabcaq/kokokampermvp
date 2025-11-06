-- Add document_number column to vehicle_documents to store policy numbers, certificate numbers, etc.
ALTER TABLE vehicle_documents 
ADD COLUMN document_number TEXT;

-- Add registration_certificate_number to vehicles table
ALTER TABLE vehicles 
ADD COLUMN registration_certificate_number TEXT;