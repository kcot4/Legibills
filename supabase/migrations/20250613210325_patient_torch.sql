/*
  # Add AI analysis columns to bills table
  
  1. Changes
    - Add key_provisions array column for storing AI-extracted key provisions
    - Add potential_impact array column for storing AI-analyzed potential impacts
    - Add potential_controversy array column for storing AI-identified controversial aspects
    - Add GIN indexes for efficient array searching
  
  2. Notes
    - All columns are nullable since analysis is generated asynchronously
    - GIN indexes enable efficient searching within arrays
    - Maintains backward compatibility with existing data
*/

ALTER TABLE bills 
ADD COLUMN IF NOT EXISTS key_provisions text[],
ADD COLUMN IF NOT EXISTS potential_impact text[],
ADD COLUMN IF NOT EXISTS potential_controversy text[];

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bills_key_provisions ON bills USING GIN (key_provisions);
CREATE INDEX IF NOT EXISTS idx_bills_potential_impact ON bills USING GIN (potential_impact);
CREATE INDEX IF NOT EXISTS idx_bills_potential_controversy ON bills USING GIN (potential_controversy);