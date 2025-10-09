-- Change start_date and end_date from DATE to TIMESTAMP WITH TIME ZONE to support time
ALTER TABLE contracts 
ALTER COLUMN start_date TYPE timestamp with time zone USING start_date::timestamp with time zone;

ALTER TABLE contracts 
ALTER COLUMN end_date TYPE timestamp with time zone USING end_date::timestamp with time zone;