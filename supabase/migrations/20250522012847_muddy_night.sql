ALTER TABLE bills 
ADD COLUMN IF NOT EXISTS congress text NOT NULL DEFAULT '118';

CREATE INDEX IF NOT EXISTS idx_bills_congress ON bills(congress);