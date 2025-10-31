-- Add unique constraint to prevent duplicate contract numbers in active contracts
-- This will prevent creating contracts with duplicate numbers
CREATE UNIQUE INDEX idx_active_contract_numbers 
ON contracts(contract_number) 
WHERE is_archived = false;

-- Add comment explaining the constraint
COMMENT ON INDEX idx_active_contract_numbers IS 
'Ensures contract numbers are unique among active (non-archived) contracts. Archived contracts can have duplicate numbers as they may be historical versions.';