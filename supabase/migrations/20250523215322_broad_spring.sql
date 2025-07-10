/*
  # Update Congress default value and add new bills
  
  1. Changes
    - Update default Congress value to '119'
    - Add index for improved performance
    - Ensure existing data integrity
  
  2. Notes
    - Non-destructive operation
    - Preserves existing data
    - Improves query performance
*/

-- Update default value for congress column
ALTER TABLE bills ALTER COLUMN congress SET DEFAULT '119';

-- Update existing null values
UPDATE bills 
SET congress = '119' 
WHERE congress IS NULL;

-- Ensure index exists
DROP INDEX IF EXISTS idx_bills_congress;
CREATE INDEX idx_bills_congress ON bills(congress);