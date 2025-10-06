-- Drop trigger first, then functions, then recreate with proper security settings
DROP TRIGGER IF EXISTS trigger_set_inquiry_number ON inquiries;
DROP FUNCTION IF EXISTS set_inquiry_number();
DROP FUNCTION IF EXISTS generate_inquiry_number();

-- Recreate functions with proper search_path
CREATE OR REPLACE FUNCTION generate_inquiry_number()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  next_num := nextval('inquiry_number_seq');
  RETURN 'INQ-' || LPAD(next_num::TEXT, 5, '0');
END;
$$;

CREATE OR REPLACE FUNCTION set_inquiry_number()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.inquiry_number IS NULL THEN
    NEW.inquiry_number := generate_inquiry_number();
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER trigger_set_inquiry_number
BEFORE INSERT ON inquiries
FOR EACH ROW
EXECUTE FUNCTION set_inquiry_number();