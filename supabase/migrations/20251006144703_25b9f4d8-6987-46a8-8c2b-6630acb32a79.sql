-- Fix numeric overflow for height columns in inquiries table
-- Change from numeric(3,2) to numeric(5,2) to allow values up to 999.99
ALTER TABLE inquiries 
ALTER COLUMN height TYPE numeric(5,2);

ALTER TABLE inquiries 
ALTER COLUMN partner_height TYPE numeric(5,2);