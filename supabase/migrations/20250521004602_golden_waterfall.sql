/*
  # Add text source tracking columns
  
  1. Changes
    - Add text_source column to track where the text was fetched from
    - Add text_updated_at column to track when the text was last updated
    - Add trigger to automatically update text_updated_at when text changes
  
  2. Notes
    - Columns are nullable since text may not be available immediately
    - text_updated_at defaults to now() for new records
    - Trigger ensures text_updated_at is always current
*/

ALTER TABLE bills 
ADD COLUMN IF NOT EXISTS text_source text,
ADD COLUMN IF NOT EXISTS text_updated_at timestamptz DEFAULT now();

-- Add trigger to update text_updated_at when original_text changes
CREATE OR REPLACE FUNCTION update_text_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.text_updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_bills_text_updated_at ON bills;
CREATE TRIGGER update_bills_text_updated_at
    BEFORE UPDATE OF original_text ON bills
    FOR EACH ROW
    EXECUTE FUNCTION update_text_updated_at();