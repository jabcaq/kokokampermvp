-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Allow public read access to notifications" 
ON public.notifications 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access to notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access to notifications" 
ON public.notifications 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete access to notifications" 
ON public.notifications 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create function to check expiring documents and create notifications
CREATE OR REPLACE FUNCTION public.check_expiring_documents()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  vehicle_record RECORD;
  days_until_expiry INTEGER;
BEGIN
  -- Check for expiring insurance policies (30 days)
  FOR vehicle_record IN 
    SELECT id, model, registration_number, insurance_valid_until
    FROM vehicles
    WHERE insurance_valid_until IS NOT NULL
      AND insurance_valid_until > CURRENT_DATE
      AND insurance_valid_until <= CURRENT_DATE + INTERVAL '30 days'
  LOOP
    days_until_expiry := vehicle_record.insurance_valid_until - CURRENT_DATE;
    
    -- Check if notification already exists for this vehicle and type
    IF NOT EXISTS (
      SELECT 1 FROM notifications 
      WHERE type = 'insurance_expiring'
        AND message LIKE '%' || vehicle_record.registration_number || '%'
        AND created_at > CURRENT_DATE - INTERVAL '7 days'
    ) THEN
      INSERT INTO notifications (type, title, message, link)
      VALUES (
        'insurance_expiring',
        'Wygasająca polisa ubezpieczeniowa',
        'Polisa pojazdu ' || vehicle_record.registration_number || ' (' || vehicle_record.model || ') wygasa za ' || days_until_expiry || ' dni',
        '/fleet/' || vehicle_record.id
      );
    END IF;
  END LOOP;

  -- Check for expiring inspections (30 days)
  FOR vehicle_record IN 
    SELECT id, model, registration_number, next_inspection_date
    FROM vehicles
    WHERE next_inspection_date IS NOT NULL
      AND next_inspection_date > CURRENT_DATE
      AND next_inspection_date <= CURRENT_DATE + INTERVAL '30 days'
  LOOP
    days_until_expiry := vehicle_record.next_inspection_date - CURRENT_DATE;
    
    -- Check if notification already exists
    IF NOT EXISTS (
      SELECT 1 FROM notifications 
      WHERE type = 'inspection_expiring'
        AND message LIKE '%' || vehicle_record.registration_number || '%'
        AND created_at > CURRENT_DATE - INTERVAL '7 days'
    ) THEN
      INSERT INTO notifications (type, title, message, link)
      VALUES (
        'inspection_expiring',
        'Wygasający przegląd techniczny',
        'Przegląd pojazdu ' || vehicle_record.registration_number || ' (' || vehicle_record.model || ') wygasa za ' || days_until_expiry || ' dni',
        '/fleet/' || vehicle_record.id
      );
    END IF;
  END LOOP;
END;
$$;