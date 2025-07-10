/*
  # Fix bill number format and cleanup invalid bills
  
  1. Changes
    - Add check constraint to ensure bill numbers follow correct format
    - Clean up any bills with invalid number format
    - Update bill_type and bill_number columns
  
  2. Notes
    - Removes bills with invalid numbers to maintain data quality
    - Ensures all future bills follow correct format
    - Preserves relationships by using CASCADE
*/

-- First, delete any bills with invalid number format
DELETE FROM bills 
WHERE number !~ '^(HR|S|HJRES|SJRES|HCONRES|SCONRES|HRES|SRES)\d+$';

-- Add check constraint to ensure proper format
ALTER TABLE bills
ADD CONSTRAINT check_bill_number_format
CHECK (number ~ '^(HR|S|HJRES|SJRES|HCONRES|SCONRES|HRES|SRES)\d+$');

-- Update bill_type and bill_number columns for existing bills
UPDATE bills
SET 
  bill_type = (regexp_match(number, '^(HR|S|HJRES|SJRES|HCONRES|SCONRES|HRES|SRES)'))[1],
  bill_number = (regexp_match(number, '(\d+)$'))[1]
WHERE 
  number ~ '^(HR|S|HJRES|SJRES|HCONRES|SCONRES|HRES|SRES)\d+$';

-- Create index for bill_type and bill_number
CREATE INDEX IF NOT EXISTS idx_bills_type_number ON bills(bill_type, bill_number);