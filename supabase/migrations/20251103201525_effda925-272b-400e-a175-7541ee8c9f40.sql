-- Tabela dla historii zmian statusu umów
CREATE TABLE IF NOT EXISTS contract_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid REFERENCES contracts(id) ON DELETE CASCADE,
  old_status text,
  new_status text,
  changed_by text, -- 'user', 'system_deposit', 'system_date', 'system_return', 'telegram'
  changed_at timestamptz DEFAULT now(),
  notes text
);

-- Enable RLS
ALTER TABLE contract_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to contract_status_history"
  ON contract_status_history FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to contract_status_history"
  ON contract_status_history FOR INSERT
  WITH CHECK (true);

-- Trigger 1: Automatyczna aktywacja umowy po wpłacie kaucji
CREATE OR REPLACE FUNCTION auto_activate_contract_on_deposit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Jeśli kaucja została właśnie wpłacona
  IF NEW.deposit_received = true AND (OLD.deposit_received = false OR OLD.deposit_received IS NULL) THEN
    -- I umowa jest jeszcze w statusie 'pending'
    IF NEW.status = 'pending' THEN
      NEW.status := 'active';
      
      -- Logowanie do historii statusów
      INSERT INTO contract_status_history (
        contract_id,
        old_status,
        new_status,
        changed_by,
        notes
      ) VALUES (
        NEW.id,
        'pending',
        'active',
        'system_deposit',
        'Automatyczna aktywacja po wpłacie kaucji'
      );
      
      -- Logowanie do notification_logs
      INSERT INTO notification_logs (
        notification_type,
        notification_title,
        action_description,
        contract_id,
        contract_number
      ) VALUES (
        'status_auto_change',
        'Automatyczna aktywacja umowy',
        'Umowa ' || NEW.contract_number || ' została automatycznie aktywowana po wpłacie kaucji',
        NEW.id,
        NEW.contract_number
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_activate_on_deposit
  BEFORE UPDATE OF deposit_received ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION auto_activate_contract_on_deposit();

-- Trigger 2: Automatyczne zakończenie umowy po zwrocie i rozliczeniu
CREATE OR REPLACE FUNCTION auto_complete_contract_on_return()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  contract_status text;
  contract_number text;
  contract_id_var uuid;
BEGIN
  -- Pobierz status umowy
  SELECT status, contract_number, id INTO contract_status, contract_number, contract_id_var
  FROM contracts
  WHERE id = NEW.contract_id;
  
  -- Jeśli umowa jest aktywna i spełnione warunki zakończenia
  IF contract_status = 'active' AND NEW.return_completed = true THEN
    -- Sprawdź czy kaucja została rozliczona
    IF NEW.deposit_refunded_cash = true 
       OR NEW.deposit_refunded_transfer = true 
       OR NEW.can_refund_deposit = false THEN
      
      -- Zmień status na completed
      UPDATE contracts 
      SET status = 'completed'
      WHERE id = NEW.contract_id;
      
      -- Logowanie do historii statusów
      INSERT INTO contract_status_history (
        contract_id,
        old_status,
        new_status,
        changed_by,
        notes
      ) VALUES (
        NEW.contract_id,
        'active',
        'completed',
        'system_return',
        'Automatyczne zakończenie po zwrocie pojazdu i rozliczeniu kaucji'
      );
      
      -- Log do notification_logs
      INSERT INTO notification_logs (
        notification_type,
        notification_title,
        action_description,
        contract_id,
        contract_number
      ) VALUES (
        'status_auto_change',
        'Automatyczne zakończenie umowy',
        'Umowa ' || contract_number || ' automatycznie zakończona po rozliczeniu zwrotu i kaucji',
        NEW.contract_id,
        contract_number
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_complete_on_return
  AFTER INSERT OR UPDATE ON vehicle_returns
  FOR EACH ROW
  EXECUTE FUNCTION auto_complete_contract_on_return();