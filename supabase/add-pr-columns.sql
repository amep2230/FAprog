-- ============================================
-- AJOUT DES COLONNES date ET notes À personal_records
-- Pour permettre l'enregistrement de la date du PR et des notes
-- ============================================

-- Ajouter la colonne date
ALTER TABLE personal_records 
ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;

-- Ajouter la colonne notes
ALTER TABLE personal_records 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Mettre à jour les enregistrements existants qui n'ont pas de date
UPDATE personal_records 
SET date = created_at::date 
WHERE date IS NULL;

-- Rendre la colonne date NOT NULL après avoir rempli les valeurs existantes
ALTER TABLE personal_records 
ALTER COLUMN date SET NOT NULL;

-- Créer un index sur la date pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_pr_date ON personal_records(date DESC);

-- Modifier la contrainte UNIQUE pour inclure la date
-- (un athlète peut avoir plusieurs PRs pour le même exercice à des dates différentes)
ALTER TABLE personal_records 
DROP CONSTRAINT IF EXISTS personal_records_athlete_id_exercise_id_reps_key;

-- Nouvelle contrainte : unique par athlète, exercice et date
CREATE UNIQUE INDEX IF NOT EXISTS idx_pr_unique_athlete_exercise_date 
ON personal_records(athlete_id, exercise_id, date);

-- Note : On peut avoir plusieurs entrées pour le même exercice à des dates différentes
-- Cela permet de tracker la progression dans le temps
