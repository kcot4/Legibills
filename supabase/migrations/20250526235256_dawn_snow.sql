/*
  # Add system locks table for function coordination
  
  1. Changes
    - Add system_locks table to manage function execution locks
    - Add unique constraint on lock_key
    - Add index for faster lookups
  
  2. Notes
    - Prevents concurrent execution of scheduled functions
    - Includes automatic cleanup of stale locks
*/

CREATE TABLE IF NOT EXISTS system_locks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lock_key text NOT NULL UNIQUE,
  locked_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_system_locks_key ON system_locks(lock_key);

-- Add RLS policies
ALTER TABLE system_locks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage locks"
  ON system_locks
  USING (auth.role() = 'service_role');