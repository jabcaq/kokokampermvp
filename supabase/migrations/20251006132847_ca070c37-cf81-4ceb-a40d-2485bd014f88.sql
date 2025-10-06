-- Add inquiry_number column for human-readable inquiry IDs
ALTER TABLE inquiries ADD COLUMN inquiry_number TEXT UNIQUE;

-- Create sequence for inquiry numbers
CREATE SEQUENCE IF NOT EXISTS inquiry_number_seq START 1;

-- Create function to generate inquiry number
CREATE OR REPLACE FUNCTION generate_inquiry_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
BEGIN
  next_num := nextval('inquiry_number_seq');
  RETURN 'INQ-' || LPAD(next_num::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate inquiry number on insert
CREATE OR REPLACE FUNCTION set_inquiry_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.inquiry_number IS NULL THEN
    NEW.inquiry_number := generate_inquiry_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_inquiry_number
BEFORE INSERT ON inquiries
FOR EACH ROW
EXECUTE FUNCTION set_inquiry_number();

-- Update existing inquiries with inquiry numbers
DO $$
DECLARE
  inquiry_record RECORD;
  counter INTEGER := 1;
BEGIN
  FOR inquiry_record IN SELECT id FROM inquiries WHERE inquiry_number IS NULL ORDER BY created_at
  LOOP
    UPDATE inquiries 
    SET inquiry_number = 'INQ-' || LPAD(counter::TEXT, 5, '0')
    WHERE id = inquiry_record.id;
    counter := counter + 1;
  END LOOP;
  
  -- Set sequence to continue from where we left off
  PERFORM setval('inquiry_number_seq', counter);
END $$;