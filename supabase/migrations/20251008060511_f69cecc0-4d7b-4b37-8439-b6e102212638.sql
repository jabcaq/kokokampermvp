-- Dodanie pól związanych z przyczepą do tabeli contracts
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS has_trailer boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS trailer_mass numeric,
ADD COLUMN IF NOT EXISTS vehicle_f1_mass numeric,
ADD COLUMN IF NOT EXISTS vehicle_o1_mass numeric;

COMMENT ON COLUMN contracts.has_trailer IS 'Czy umowa dotyczy przyczepy';
COMMENT ON COLUMN contracts.trailer_mass IS 'Masa przyczepy';
COMMENT ON COLUMN contracts.vehicle_f1_mass IS 'F1 - maksymalna masa całkowita pojazdu holującego';
COMMENT ON COLUMN contracts.vehicle_o1_mass IS 'O1 - maksymalna wartość przyczepy z hamulcem';

-- Dodanie pola dla kategorii prawa jazdy kierowcy do holowania przyczepy
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS tenant_trailer_license_category text;

COMMENT ON COLUMN contracts.tenant_trailer_license_category IS 'Kategoria prawa jazdy dla przyczepy (B, B96, B+E)';