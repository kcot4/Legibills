/*
  # Add AI-generated summary column
  
  1. Changes
    - Add ai_summary column to bills table for storing AI-generated summaries
    - Make column nullable since summaries will be generated asynchronously
  
  2. Notes
    - Existing bills will have NULL ai_summary until processed
    - No data loss or schema conflicts
*/

ALTER TABLE bills ADD COLUMN IF NOT EXISTS ai_summary text;