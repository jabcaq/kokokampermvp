-- Add column to track if full payment is made as reservation
ALTER TABLE contracts 
ADD COLUMN is_full_payment_as_reservation boolean DEFAULT false;