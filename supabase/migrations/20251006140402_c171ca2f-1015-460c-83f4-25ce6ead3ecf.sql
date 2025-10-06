-- Add inquiry_number column to inquiry_messages table
ALTER TABLE inquiry_messages
ADD COLUMN inquiry_number TEXT;

-- Create index for better search performance
CREATE INDEX idx_inquiry_messages_inquiry_number ON inquiry_messages(inquiry_number);