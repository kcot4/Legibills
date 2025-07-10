/*
  # Fix duplicate foreign key relationships

  1. Changes
    - Drop duplicate foreign key constraint between bills and bill_timeline tables
    - Keep only the original constraint from the first migration

  2. Notes
    - This fixes the "Could not embed because more than one relationship was found" error
    - No data will be lost during this operation
*/

DO $$ BEGIN
  -- Drop the duplicate foreign key constraint if it exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_bill_timeline_bill'
  ) THEN
    ALTER TABLE bill_timeline DROP CONSTRAINT fk_bill_timeline_bill;
  END IF;
END $$;