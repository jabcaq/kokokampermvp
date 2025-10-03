-- Create function to create notification when invoice is added
CREATE OR REPLACE FUNCTION public.notify_invoice_added()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  contract_data RECORD;
  invoice_type_pl TEXT;
BEGIN
  -- Get contract details
  SELECT contract_number, client_id, tenant_name
  INTO contract_data
  FROM contracts
  WHERE id = NEW.contract_id;
  
  -- Translate invoice type to Polish
  invoice_type_pl := CASE NEW.invoice_type
    WHEN 'reservation' THEN 'Zaliczka'
    WHEN 'main_payment' THEN 'Płatność główna'
    WHEN 'final' THEN 'Płatność końcowa'
    ELSE NEW.invoice_type
  END;
  
  -- Create notification
  INSERT INTO notifications (type, title, message, link)
  VALUES (
    'invoice_added',
    'Dodano nową fakturę/paragon',
    invoice_type_pl || ' (' || NEW.amount || ' PLN) dla umowy ' || contract_data.contract_number || ' - ' || COALESCE(contract_data.tenant_name, 'Klient'),
    '/contracts/' || NEW.contract_id
  );
  
  RETURN NEW;
END;
$function$;

-- Create trigger for invoice additions
DROP TRIGGER IF EXISTS trigger_notify_invoice_added ON contract_invoices;
CREATE TRIGGER trigger_notify_invoice_added
  AFTER INSERT ON contract_invoices
  FOR EACH ROW
  EXECUTE FUNCTION notify_invoice_added();