/*
  # Add congress column to bills table
  
  1. Changes
    - Add congress column to track which Congress session a bill belongs to
    - Add index for faster queries by congress number
  
  2. Notes
    - Default value set to '118' for current Congress
    - Index improves performance when filtering by congress
*/

ALTER TABLE bills 
ADD COLUMN IF NOT EXISTS congress text NOT NULL DEFAULT '118';

CREATE INDEX IF NOT EXISTS idx_bills_congress ON bills(congress);