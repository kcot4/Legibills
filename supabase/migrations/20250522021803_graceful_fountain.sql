/*
  # Clean up congress column migrations
  
  1. Changes
    - Drop duplicate congress columns if they exist
    - Ensure single congress column exists with correct defaults
    - Maintain index for performance
  
  2. Notes
    - Prevents duplicate column errors
    - Preserves existing data
    - Maintains query performance
*/

DO $$ 
BEGIN
  -- Drop duplicate congress columns if they exist
  WHILE (
    SELECT COUNT(*) > 1 
    FROM information_schema.columns 
    WHERE table_name = 'bills' 
    AND column_name = 'congress'
  ) LOOP
    ALTER TABLE bills DROP COLUMN congress;
  END LOOP;

  -- Ensure single congress column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'bills' 
    AND column_name = 'congress'
  ) THEN
    ALTER TABLE bills 
    ADD COLUMN congress text NOT NULL DEFAULT '118';
  END IF;
END $$;

-- Ensure index exists
DROP INDEX IF EXISTS idx_bills_congress;
CREATE INDEX idx_bills_congress ON bills(congress);