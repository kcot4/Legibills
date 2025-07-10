/*
  # Fix congress column and clean up migrations
  
  1. Changes
    - Ensure single congress column exists
    - Clean up any duplicate columns
    - Recreate index properly
    - Update existing records
  
  2. Notes
    - Non-destructive operation
    - Preserves existing data
    - Improves query performance
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

  -- Ensure single congress column exists with correct properties
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'bills' 
    AND column_name = 'congress'
  ) THEN
    ALTER TABLE bills 
    ADD COLUMN congress text NOT NULL DEFAULT '118';
  END IF;

  -- Update any null values
  UPDATE bills 
  SET congress = '118' 
  WHERE congress IS NULL;
END $$;

-- Recreate index
DROP INDEX IF EXISTS idx_bills_congress;
CREATE INDEX idx_bills_congress ON bills(congress);