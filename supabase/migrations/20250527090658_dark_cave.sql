/*
  # Add bill type and number columns
  
  1. Changes
    - Add bill_type column to store the bill prefix (e.g., HR, S)
    - Add bill_number column to store the numeric portion
    - Update existing records to split number field
  
  2. Notes
    - Non-destructive operation
    - Preserves existing data
    - Improves bill identification
*/

-- Add new columns
ALTER TABLE bills 
ADD COLUMN IF NOT EXISTS bill_type text,
ADD COLUMN IF NOT EXISTS bill_number text;

-- Update existing records
DO $$ 
BEGIN
  UPDATE bills
  SET 
    bill_type = (regexp_match(number, '^([A-Za-z]+)'))[1],
    bill_number = (regexp_match(number, '(\d+)$'))[1]
  WHERE 
    number ~ '^[A-Za-z]+\d+$'
    AND (bill_type IS NULL OR bill_number IS NULL);
END $$;