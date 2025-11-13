# 🧪 Guide de Test - Auto-Incrément RPE

## ✅ Checklist avant de tester

### 1. Exécuter les scripts SQL sur Supabase (dans l'ordre)

```sql
-- 1️⃣ Ajouter les colonnes de configuration RPE
-- Fichier: supabase/add-rpe-increment-params.sql
ALTER TABLE training_blocks 
ADD COLUMN IF NOT EXISTS rpe_increment_low NUMERIC(3,1) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS rpe_increment_high NUMERIC(3,1) DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS rpe_threshold NUMERIC(3,1) DEFAULT 6.0;

-- 2️⃣ Mettre à jour la table RPE complète
-- Fichier: supabase/update-rpe-table.sql
-- (Exécuter tout le contenu du fichier - 264 lignes)

-- 3️⃣ Créer la fonction PostgreSQL
-- Fichier: supabase/create-week-from-week-one-function.sql
-- (Exécuter tout le contenu du fichier)
```

### 2. Vérifier la structure de données

```sql
-- Vérifier qu'un bloc de type "force" existe
SELECT id, name, block_type, rpe_increment_low, rpe_increment_high, rpe_threshold
FROM training_blocks
WHERE block_type = 'force';

-- Vérifier la table RPE
SELECT COUNT(*) FROM rpe_table; -- Doit retourner 264

-- Vérifier les personal_records de l'athlète
SELECT exercise_name, max_weight_kg
FROM personal_records
WHERE athlete_id = 'YOUR_ATHLETE_ID';
```

## 🧪 Scénario de Test

### Étape 1 : Créer un bloc de force
1. Se connecter en tant que coach
2. Aller sur la page d'un athlète
3. Créer un nouveau bloc avec `block_type = 'force'`
4. Nommer le bloc (ex: "Cycle Force - Janvier 2024")

### Étape 2 : Créer la Semaine 1 manuellement
1. Cliquer sur "Ajouter une semaine"
2. Créer "Semaine 1"
3. Ajouter une séance (ex: "Séance A - Squat")
4. Ajouter des exercices avec des RPE variés :
   - **Squat** : 4 séries × 6 reps @ **RPE 7.0**
   - **Bench Press** : 3 séries × 8 reps @ **RPE 5.5**
   - **Deadlift** : 3 séries × 5 reps @ **RPE 8.5**

### Étape 3 : Tester l'auto-incrément
1. Retourner sur la page du bloc
2. Cliquer sur le bouton **"Créer semaine suivante (auto RPE)"** 📈
3. Vérifier le message de succès

### Étape 4 : Vérifier la Semaine 2 créée
1. Ouvrir la Semaine 2
2. Vérifier les RPE incrémentés :
   - **Squat** : RPE 7.0 → **RPE 7.5** (+0.5 car >= 6.0)
   - **Bench Press** : RPE 5.5 → **RPE 6.5** (+1.0 car < 6.0)
   - **Deadlift** : RPE 8.5 → **RPE 9.0** (+0.5 car >= 6.0)
3. Vérifier que les charges ont été recalculées automatiquement

### Étape 5 : Tester avec Semaine 3
1. Retourner sur la page du bloc
2. Cliquer à nouveau sur **"Créer semaine suivante (auto RPE)"**
3. Vérifier la Semaine 3 avec les nouveaux RPE incrémentés

## 🔍 Résultats attendus

### Semaine 1 (manuelle)
| Exercice | Séries × Reps | RPE | % 1RM | Charge |
|----------|---------------|-----|-------|--------|
| Squat | 4×6 | 7.0 | 82% | 123kg (si 1RM = 150kg) |
| Bench | 3×8 | 5.5 | 75% | 82.5kg (si 1RM = 110kg) |
| Deadlift | 3×5 | 8.5 | 89% | 156kg (si 1RM = 175kg) |

### Semaine 2 (auto-créée)
| Exercice | Séries × Reps | RPE | % 1RM | Charge |
|----------|---------------|-----|-------|--------|
| Squat | 4×6 | **7.5** (+0.5) | 85% | 127.5kg |
| Bench | 3×8 | **6.5** (+1.0) | 79% | 86.9kg |
| Deadlift | 3×5 | **9.0** (+0.5) | 91% | 159kg |

### Semaine 3 (auto-créée)
| Exercice | Séries × Reps | RPE | % 1RM | Charge |
|----------|---------------|-----|-------|--------|
| Squat | 4×6 | **8.0** (+0.5) | 86% | 129kg |
| Bench | 3×8 | **7.0** (+0.5) | 82% | 90.2kg |
| Deadlift | 3×5 | **9.5** (+0.5) | 94% | 164.5kg |

## ⚙️ Configuration personnalisée

Pour modifier les paramètres d'incrément d'un bloc :

```sql
UPDATE training_blocks
SET 
  rpe_increment_low = 0.5,   -- Incrément si RPE < seuil (défaut: 1.0)
  rpe_increment_high = 0.25, -- Incrément si RPE >= seuil (défaut: 0.5)
  rpe_threshold = 7.0        -- Seuil de changement (défaut: 6.0)
WHERE id = 'VOTRE_BLOCK_ID';
```

## ❌ Cas d'erreur à tester

### Erreur 1 : Pas de Semaine 1
- **Action** : Créer un bloc vide et cliquer sur le bouton
- **Résultat attendu** : Message "La semaine 1 n'existe pas"

### Erreur 2 : Bloc de type "general"
- **Action** : Créer un bloc avec `block_type = 'general'` et tester
- **Résultat attendu** : Message "Ce bloc n'est pas de type 'force'"

### Erreur 3 : RPE déjà au maximum
- **Action** : Créer une semaine avec RPE = 12.5
- **Résultat attendu** : Nouvelle semaine avec RPE = 12.5 (pas d'incrément)

### Erreur 4 : Exercice sans 1RM
- **Action** : Ajouter un exercice sans personal_record
- **Résultat attendu** : Charge = NULL ou 0kg

## 📊 Validation SQL

```sql
-- Voir toutes les semaines d'un bloc avec leurs RPE
SELECT 
  tw.week_number,
  tw.name,
  s.name as session_name,
  st.exercise_name,
  st.prescribed_rpe,
  st.prescribed_weight
FROM training_weeks tw
JOIN sessions s ON s.week_id = tw.id
JOIN sets st ON st.session_id = s.id
WHERE tw.block_id = 'VOTRE_BLOCK_ID'
ORDER BY tw.week_number, s.session_number, st.set_number;
```

## 🎯 Points de contrôle

- [ ] Les 3 scripts SQL sont exécutés
- [ ] La table RPE contient 264 entrées
- [ ] La fonction `create_week_from_week_one` existe
- [ ] Le bouton "Créer semaine suivante" apparaît dans l'UI
- [ ] Le bouton est désactivé si aucune semaine n'existe
- [ ] La Semaine 2 est créée avec les bons RPE incrémentés
- [ ] Les charges sont recalculées automatiquement
- [ ] La structure complète est copiée (séances, exercices, sets)
- [ ] Les messages d'erreur sont clairs et informatifs

---

**Note** : Ce système est conçu pour les blocs de **force**. Pour les blocs de type "general", utilisez la duplication manuelle classique.
