/*
  # Add committee tracking tables
  
  1. New Tables
    - `bill_committees`
      - `id` (uuid, primary key)
      - `bill_id` (uuid, foreign key to bills)
      - `committee_name` (text)
      - `committee_chamber` (text)
      - `committee_system_code` (text, nullable)
      - `committee_url` (text, nullable)
      - `activity_date` (timestamptz)
      - `activity_text` (text)
      - `activity_type` (text)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on `bill_committees` table
    - Add policy for public read access
*/

CREATE TABLE IF NOT EXISTS bill_committees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id uuid NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  committee_name text NOT NULL,
  committee_chamber text NOT NULL CHECK (committee_chamber IN ('house', 'senate', 'joint')),
  committee_system_code text,
  committee_url text,
  activity_date timestamptz NOT NULL,
  activity_text text NOT NULL,
  activity_type text NOT NULL CHECK (activity_type IN ('referred', 'markup', 'reported', 'discharged', 'hearing', 'other')),
  created_at timestamptz DEFAULT now()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bill_committees_bill_id ON bill_committees(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_committees_name ON bill_committees(committee_name);
CREATE INDEX IF NOT EXISTS idx_bill_committees_chamber ON bill_committees(committee_chamber);
CREATE INDEX IF NOT EXISTS idx_bill_committees_activity_date ON bill_committees(activity_date);

-- Enable RLS
ALTER TABLE bill_committees ENABLE ROW LEVEL SECURITY;

-- Add policy for public read access
CREATE POLICY "Public can read bill committees"
  ON bill_committees
  FOR SELECT
  TO public
  USING (true);