/*
  # Remove all duplicate relationships and recreate correct ones
  
  1. Changes
    - Drop ALL existing foreign key constraints
    - Recreate single, correct relationships for each table
    - Add proper indexes for performance
  
  2. Security
    - Maintains RLS policies
    - Preserves data integrity
*/

-- Drop all existing foreign key constraints
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tc.table_name, tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu 
        ON tc.constraint_name = ccu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name IN ('bill_sponsors', 'bill_topics', 'bill_provisions', 
                            'bill_impacts', 'bill_timeline', 'bill_votes')
    ) LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(r.table_name) || 
                ' DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name) || ' CASCADE';
    END LOOP;
END $$;

-- Recreate single, correct foreign key constraints
ALTER TABLE bill_sponsors
    ADD CONSTRAINT bill_sponsors_bill_id_fkey 
    FOREIGN KEY (bill_id) 
    REFERENCES bills(id)
    ON DELETE CASCADE;

ALTER TABLE bill_topics
    ADD CONSTRAINT bill_topics_bill_id_fkey 
    FOREIGN KEY (bill_id) 
    REFERENCES bills(id)
    ON DELETE CASCADE;

ALTER TABLE bill_provisions
    ADD CONSTRAINT bill_provisions_bill_id_fkey 
    FOREIGN KEY (bill_id) 
    REFERENCES bills(id)
    ON DELETE CASCADE;

ALTER TABLE bill_impacts
    ADD CONSTRAINT bill_impacts_bill_id_fkey 
    FOREIGN KEY (bill_id) 
    REFERENCES bills(id)
    ON DELETE CASCADE;

ALTER TABLE bill_timeline
    ADD CONSTRAINT bill_timeline_bill_id_fkey 
    FOREIGN KEY (bill_id) 
    REFERENCES bills(id)
    ON DELETE CASCADE;

ALTER TABLE bill_votes
    ADD CONSTRAINT bill_votes_bill_id_fkey 
    FOREIGN KEY (bill_id) 
    REFERENCES bills(id)
    ON DELETE CASCADE;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bill_sponsors_bill_id ON bill_sponsors(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_topics_bill_id ON bill_topics(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_provisions_bill_id ON bill_provisions(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_impacts_bill_id ON bill_impacts(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_timeline_bill_id ON bill_timeline(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_votes_bill_id ON bill_votes(bill_id);