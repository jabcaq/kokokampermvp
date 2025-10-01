-- Drop the existing check constraint
ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_type_check;

-- Add new check constraint with capitalized values
ALTER TABLE vehicles ADD CONSTRAINT vehicles_type_check 
  CHECK (type IN ('Kamper', 'Przyczepa'));

-- Update existing data to use capitalized values
UPDATE vehicles SET type = 'Kamper' WHERE type = 'kamper';
UPDATE vehicles SET type = 'Przyczepa' WHERE type = 'przyczepa';