-- Extend vehicle_returns table with booking fields
ALTER TABLE vehicle_returns
ADD COLUMN IF NOT EXISTS scheduled_return_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS scheduled_return_time TEXT,
ADD COLUMN IF NOT EXISTS return_confirmed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS return_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS booking_notes TEXT;

-- Add notification types for return bookings
INSERT INTO notifications (type, title, message, link)
SELECT 
  'return_scheduled',
  'Test notification type',
  'This is to register the notification type',
  '/'
WHERE NOT EXISTS (
  SELECT 1 FROM notifications WHERE type = 'return_scheduled'
);

DELETE FROM notifications WHERE message = 'This is to register the notification type';