# 🔧 Fix : Ajout des colonnes date et notes à personal_records

## ⚠️ Problème rencontré

```
Error creating PR: {
  code: 'PGRST204',
  message: "Could not find the 'date' column of 'personal_records' in the schema cache"
}
```

## ✅ Solution

La table `personal_records` n'a pas les colonnes `date` et `notes`. Il faut les ajouter.

## 📝 Script SQL à exécuter

### Dans Supabase SQL Editor :

1. Aller sur [https://doiheofprwqdibkrqjiw.supabase.co](https://doiheofprwqdibkrqjiw.supabase.co)
2. Cliquer sur "SQL Editor"
3. Copier-coller le contenu de **`supabase/add-pr-columns.sql`** :

```sql
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
```

4. Cliquer sur "Run" (ou Cmd/Ctrl + Enter)

## ✅ Vérification

Après l'exécution, vérifiez que les colonnes ont été ajoutées :

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'personal_records' 
AND column_name IN ('date', 'notes')
ORDER BY column_name;
```

Vous devriez voir :
```
column_name | data_type | is_nullable
------------|-----------|------------
date        | date      | NO
notes       | text      | YES
```

## 🔄 Modifications apportées au code

### API Route (`/api/personal-records/route.ts`)
- ✅ Ajout de `reps: 1` (car on enregistre toujours des 1RM)
- ✅ Ajout de `estimated_1rm: weight` (pour un 1RM, c'est le même que le poids)
- ✅ Ajout de `date` et `notes` dans l'insert

### Nouvelle contrainte unique
Avant :
- Un athlète ne pouvait avoir qu'UN SEUL PR par exercice et nombre de reps

Après :
- Un athlète peut avoir PLUSIEURS PRs pour le même exercice à des **dates différentes**
- Permet de tracker la progression dans le temps
- Contrainte unique : `(athlete_id, exercise_id, date)`

## 🎯 Résultat

Après avoir exécuté ce script :
- ✅ Les athlètes peuvent ajouter des PRs avec une date
- ✅ Les notes sont optionnelles pour chaque PR
- ✅ On peut voir l'évolution des PRs dans le temps
- ✅ Pas de doublons pour la même date et le même exercice

## 🧪 Test

1. Recharger la page de l'application
2. Cliquer sur "Ajouter un PR"
3. Remplir le formulaire
4. Enregistrer
5. ✅ Le PR devrait être créé sans erreur

## 📊 Structure finale de personal_records

```sql
personal_records
├── id (UUID, PK)
├── athlete_id (UUID, FK -> profiles)
├── exercise_id (UUID, FK -> exercises)
├── reps (INTEGER) -- Toujours 1 pour nos PRs
├── weight (DECIMAL) -- Le poids du PR
├── estimated_1rm (DECIMAL) -- Égal au poids pour un 1RM
├── date (DATE, NOT NULL) -- 🆕 Date du PR
├── notes (TEXT) -- 🆕 Notes optionnelles
└── created_at (TIMESTAMP)

Indexes:
- idx_pr_athlete (athlete_id)
- idx_pr_exercise (exercise_id)
- idx_pr_date (date DESC) -- 🆕
- idx_pr_unique_athlete_exercise_date (athlete_id, exercise_id, date) -- 🆕 UNIQUE
```

---

**Une fois ce script exécuté, le système de gestion des PRs sera 100% fonctionnel !** 🎉
