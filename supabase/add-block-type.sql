-- ============================================
-- MIGRATION: Ajouter le type de bloc
-- ============================================

-- Ajouter la colonne block_type à training_blocks
ALTER TABLE training_blocks 
ADD COLUMN IF NOT EXISTS block_type TEXT NOT NULL DEFAULT 'force' CHECK (block_type IN ('force', 'general'));

-- Créer un index pour optimiser les requêtes par type
CREATE INDEX IF NOT EXISTS idx_training_blocks_type ON training_blocks(block_type);
