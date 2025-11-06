-- Fix ambiguous column reference in trigger function by renaming variables
-- and qualifying table names to avoid ambiguity when inserting into notification_logs.

-- Recreate auto_complete_contract_on_return with safe variable names
CREATE OR REPLACE FUNCTION public.auto_complete_contract_on_return()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contract_status text;
  v_contract_number text;
  v_contract_id uuid;
BEGIN
  -- Get contract details for the related return
  SELECT c.status, c.contract_number, c.id
  INTO v_contract_status, v_contract_number, v_contract_id
  FROM public.contracts AS c
  WHERE c.id = NEW.contract_id;
  
  -- If contract is active and return is completed
  IF v_contract_status = 'active' AND NEW.return_completed = true THEN
    -- Check if deposit has been refunded/settled or not required
    IF NEW.deposit_refunded_cash = true 
       OR NEW.deposit_refunded_transfer = true 
       OR NEW.can_refund_deposit = false THEN
      
      -- Set contract status to completed
      UPDATE public.contracts 
      SET status = 'completed'
      WHERE id = NEW.contract_id;
      
      -- Log status change history
      INSERT INTO public.contract_status_history (
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
      
      -- Log to notification_logs; use variable name distinct from column name
      INSERT INTO public.notification_logs (
        notification_type,
        notification_title,
        action_description,
        contract_id,
        contract_number
      ) VALUES (
        'status_auto_change',
        'Automatyczne zakończenie umowy',
        'Umowa ' || v_contract_number || ' automatycznie zakończona po rozliczeniu zwrotu i kaucji',
        NEW.contract_id,
        v_contract_number
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Ensure trigger still exists (idempotent: drop and recreate)
DROP TRIGGER IF EXISTS trigger_auto_complete_on_return ON public.vehicle_returns;
CREATE TRIGGER trigger_auto_complete_on_return
  AFTER INSERT OR UPDATE ON public.vehicle_returns
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_complete_contract_on_return();