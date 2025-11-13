-- Add drop set suite fields to sets table
ALTER TABLE sets ADD COLUMN IF NOT EXISTS drop_set_reps INTEGER NULL;
ALTER TABLE sets ADD COLUMN IF NOT EXISTS drop_set_weight DECIMAL(5,2) NULL;

-- Create indexes for potential queries
CREATE INDEX IF NOT EXISTS idx_sets_drop_set_reps ON sets(drop_set_reps);
CREATE INDEX IF NOT EXISTS idx_sets_drop_set_weight ON sets(drop_set_weight);

-- Add comment for documentation
COMMENT ON COLUMN sets.drop_set_reps IS 'Number of reps for drop set suite (follow-up portion)';
COMMENT ON COLUMN sets.drop_set_weight IS 'Weight in kg for drop set suite (follow-up portion)';
