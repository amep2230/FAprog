-- ============================================
-- MIGRATION: Ajouter les paramètres d'incrémentation RPE pour les blocs de force
-- ============================================

-- Ajouter les colonnes de paramétrage RPE à training_blocks
ALTER TABLE training_blocks 
ADD COLUMN IF NOT EXISTS rpe_increment_low DECIMAL(3,1) DEFAULT 1.0 CHECK (rpe_increment_low >= 0 AND rpe_increment_low <= 5),
ADD COLUMN IF NOT EXISTS rpe_increment_high DECIMAL(3,1) DEFAULT 0.5 CHECK (rpe_increment_high >= 0 AND rpe_increment_high <= 5),
ADD COLUMN IF NOT EXISTS rpe_threshold DECIMAL(3,1) DEFAULT 6.0 CHECK (rpe_threshold >= 0 AND rpe_threshold <= 12.5);

-- Commentaires pour documentation
COMMENT ON COLUMN training_blocks.rpe_increment_low IS 'Incrément RPE si RPE de la semaine N-1 < rpe_threshold (par défaut 1.0)';
COMMENT ON COLUMN training_blocks.rpe_increment_high IS 'Incrément RPE si RPE de la semaine N-1 >= rpe_threshold (par défaut 0.5)';
COMMENT ON COLUMN training_blocks.rpe_threshold IS 'Seuil pour choisir l''incrément RPE (par défaut 6.0)';
