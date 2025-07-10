/*
  # Create system locks table with proper policies
  
  1. Changes
    - Create system_locks table for managing distributed locks
    - Add unique constraint on lock_key
    - Add index for faster lookups
    - Enable RLS and add service role policy
  
  2. Notes
    - Uses IF NOT EXISTS to prevent conflicts
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
      ON system_locks FOR ALL
      TO public
      USING (auth.role() = 'service_role'::text);
END $$;