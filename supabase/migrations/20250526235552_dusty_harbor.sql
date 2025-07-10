/*
  # Fix system_locks table and policy creation
  
  1. Changes
    - Create system_locks table if it doesn't exist
    - Add unique constraint and index on lock_key
    - Enable RLS and add policy for service role
  
  2. Notes
    - Uses IF NOT EXISTS checks to avoid conflicts
    - Safely handles policy creation
    - Maintains data integrity
*/

-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_locks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lock_key text NOT NULL UNIQUE,
  locked_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_system_locks_key ON system_locks(lock_key);

-- Enable RLS
ALTER TABLE system_locks ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and create new one
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Service role can manage locks" ON system_locks;
    
    CREATE POLICY "Service role can manage locks"
      ON system_locks
      USING (auth.role() = 'service_role'::text);
END $$;