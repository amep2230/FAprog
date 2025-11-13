-- Migration: Ajouter la colonne intensification_technique à la table sets
-- Description: Permet de sélectionner une technique d'intensification pour les blocs de type "Général"

ALTER TABLE sets
ADD COLUMN intensification_technique VARCHAR(50) NULL;

-- Créer un index pour les performances de requête
CREATE INDEX idx_sets_intensification_technique ON sets(intensification_technique);

-- Ajouter un commentaire de colonne pour la documentation
COMMENT ON COLUMN sets.intensification_technique IS 'Technique d''intensification utilisée (drop-set, rest-pause, superset, etc.)';
