/*
  # Add bill categorization and search capabilities
  
  1. Changes
    - Add topics array column to bills table
    - Add category column to bills table
    - Add search index for topics and category
    - Add trigger to update search index
  
  2. Notes
    - Topics stored as array for efficient querying
    - Category is a single value for broad classification
    - Search index improves performance
*/

-- Add topics array and category columns
ALTER TABLE bills 
ADD COLUMN IF NOT EXISTS topics text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS category text;

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_bills_topics ON bills USING GIN (topics);
CREATE INDEX IF NOT EXISTS idx_bills_category ON bills(category);

-- Create a function to update search index
CREATE OR REPLACE FUNCTION update_bill_search_index()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('english', array_to_string(NEW.topics, ' ')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;