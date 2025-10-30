-- ============================================
-- AJOUT DU CHAMP completed_at
-- Pour tracker quand une séance a été complétée
-- ============================================

ALTER TABLE session_logs 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Mettre à jour les enregistrements existants
UPDATE session_logs 
SET completed_at = created_at 
WHERE completed_at IS NULL;

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_session_logs_completed_at ON session_logs(completed_at);
