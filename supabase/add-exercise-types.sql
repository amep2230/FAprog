-- Migration: Ajouter les types d'exercices (Normal, Superset, Triset)
-- Description: Permet de classifier les exercices dans les blocs de type "Général"

-- Note: exercise_type peut être 'normal', 'superset', ou 'triset'
-- Les valeurs existantes 'main' seront conservées pour compatibilité

-- Créer un index pour les performances de requête
CREATE INDEX IF NOT EXISTS idx_sets_exercise_type ON sets(exercise_type);

-- Ajouter un commentaire de colonne pour la documentation
COMMENT ON COLUMN sets.exercise_type IS 'Type d''exercice: normal, superset, triset, ou main (legacy)';
