-- Update lessor address for all contracts to new address in Złotokłos
UPDATE contracts
SET lessor_address = 'Złotokłos, 05-504, ul. Stawowa 1'
WHERE lessor_address IS NOT NULL OR lessor_address IS NULL;