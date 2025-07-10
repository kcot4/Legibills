/*
  # Add search functionality and bill categorization
  
  1. Changes
    - Add topics array column for efficient topic storage
    - Add category column for bill categorization
    - Create GIN indexes for better search performance
    - Add search vector column and update trigger
    - Add function to maintain search vector
  
  2. Notes
    - Improves search performance with full-text search
    - Enables efficient filtering by topics
    - Supports bill categorization
*/

-- Add topics array and category columns
ALTER TABLE bills 
ADD COLUMN IF NOT EXISTS topics text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_bills_topics ON bills USING GIN (topics);
CREATE INDEX IF NOT EXISTS idx_bills_category ON bills(category);
CREATE INDEX IF NOT EXISTS idx_bills_search ON bills USING GIN (search_vector);

-- Create a function to update search index
CREATE OR REPLACE FUNCTION update_bill_search_index()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('english', array_to_string(NEW.topics, ' ')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW.number, '')), 'A');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to maintain search vector
DROP TRIGGER IF EXISTS bills_search_vector_update ON bills;
CREATE TRIGGER bills_search_vector_update
  BEFORE INSERT OR UPDATE OF title, summary, topics, number
  ON bills
  FOR EACH ROW
  EXECUTE FUNCTION update_bill_search_index();