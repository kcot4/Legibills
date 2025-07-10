/*
  # Add bioguide_id to bill_sponsors table
  
  1. Changes
    - Add bioguide_id column to bill_sponsors table
    - Add sponsorship_date column for tracking when members joined as cosponsors
    - Add is_original_cosponsor flag
    - Add district column for House representatives
  
  2. Notes
    - All new columns are nullable since historical data may not have this info
    - No data loss or schema conflicts
*/

ALTER TABLE bill_sponsors 
ADD COLUMN IF NOT EXISTS bioguide_id text,
ADD COLUMN IF NOT EXISTS sponsorship_date timestamptz,
ADD COLUMN IF NOT EXISTS is_original_cosponsor boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS district text;