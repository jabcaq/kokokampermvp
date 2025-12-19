-- Funkcja do aktualizacji licznika umów klienta
CREATE OR REPLACE FUNCTION update_client_contracts_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE clients SET contracts_count = COALESCE(contracts_count, 0) + 1 WHERE id = NEW.client_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE clients SET contracts_count = GREATEST(COALESCE(contracts_count, 0) - 1, 0) WHERE id = OLD.client_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger na tabeli contracts
CREATE TRIGGER trigger_update_client_contracts_count
AFTER INSERT OR DELETE ON contracts
FOR EACH ROW EXECUTE FUNCTION update_client_contracts_count();

-- Jednorazowa aktualizacja istniejących danych
UPDATE clients c
SET contracts_count = (
  SELECT COUNT(*) FROM contracts WHERE client_id = c.id
);