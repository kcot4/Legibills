/*
  # Add Congress number to bills table
  
  1. Changes
    - Add congress column to bills table
    - Make column NOT NULL with default value of '118'
    - Add index for better query performance
  
  2. Notes
    - Default value set to current congress (118)
    - Index added to optimize filtering by congress
*/

ALTER TABLE bills 
ADD COLUMN IF NOT EXISTS congress text NOT NULL DEFAULT '118';

CREATE INDEX IF NOT EXISTS idx_bills_congress ON bills(congress);