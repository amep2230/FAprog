# 🔍 Debug - Poids non calculés automatiquement

## 🐛 Problème
Les poids ne sont pas ajustés automatiquement lors de la création de la semaine suivante.

## ✅ Corrections appliquées

### 1️⃣ Recherche élargie des Personal Records
**Avant** : Ne cherchait que les PR avec `reps = 1`
**Après** : 
- Essaie d'abord avec `reps = 1` et prend `estimated_1rm`
- Si pas trouvé, prend n'importe quel PR et utilise `estimated_1rm`

### 2️⃣ Arrondi à 2.5 kg près
**Ajouté** : `ROUND((weight / 2.5) * 2.5)`

Exemples :
- 67.3 kg → **67.5 kg**
- 114.8 kg → **115.0 kg**
- 48.2 kg → **47.5 kg**

## 🧪 Requêtes de diagnostic

### 1. Vérifier les Personal Records de l'athlète

```sql
-- Remplacez ATHLETE_ID et BLOCK_ID par vos valeurs
SELECT 
  e.name as exercise_name,
  pr.reps,
  pr.weight,
  pr.estimated_1rm,
  pr.created_at
FROM personal_records pr
JOIN exercises e ON e.id = pr.exercise_id
JOIN training_blocks tb ON tb.athlete_id = pr.athlete_id
WHERE tb.id = 'VOTRE_BLOCK_ID'
ORDER BY e.name, pr.estimated_1rm DESC;
```

### 2. Vérifier la table RPE

```sql
-- Exemple : Vérifier si RPE 6.0 @ 3 reps existe
SELECT rpe, reps, percentage_of_1rm 
FROM rpe_table 
WHERE rpe = 6.0 AND reps = 3;
```

### 3. Tester manuellement le calcul

```sql
-- Variables de test
DO $$
DECLARE
  v_pr_weight DECIMAL(5,2) := 150.0;  -- 1RM Squat
  v_percentage DECIMAL(5,2) := 73.4;  -- RPE 5.0 @ 3 reps
  v_new_weight DECIMAL(5,2);
BEGIN
  -- Calcul brut
  v_new_weight := (v_pr_weight * v_percentage / 100);
  RAISE NOTICE 'Poids brut: %', v_new_weight;
  
  -- Arrondi à 2.5kg
  v_new_weight := ROUND((v_new_weight / 2.5)::numeric, 0) * 2.5;
  RAISE NOTICE 'Poids arrondi: %', v_new_weight;
END $$;

-- Résultat attendu :
-- Poids brut: 110.10
-- Poids arrondi: 110.0
```

### 4. Vérifier que les exercices existent

```sql
-- Vérifier les exercices dans la Semaine 1
SELECT DISTINCT 
  s.exercise_name,
  e.id as exercise_id_in_db,
  e.name as exercise_name_in_db
FROM sets s
JOIN sessions se ON se.id = s.session_id
JOIN training_weeks tw ON tw.id = se.week_id
LEFT JOIN exercises e ON e.name = s.exercise_name
WHERE tw.block_id = 'VOTRE_BLOCK_ID' 
AND tw.week_number = 1;

-- Si exercise_id_in_db est NULL, l'exercice n'existe pas dans la table exercises
```

## 🔧 Solutions aux problèmes courants

### Problème 1 : Pas de Personal Records
**Symptôme** : Les poids restent identiques à la Semaine 1

**Solution** : Ajouter des PR pour l'athlète
```sql
-- Exemple : Ajouter un PR pour Squat
INSERT INTO personal_records (athlete_id, exercise_id, reps, weight, estimated_1rm)
SELECT 
  'ATHLETE_ID',
  e.id,
  1,
  150.0,
  150.0
FROM exercises e
WHERE e.name = 'Squat';
```

### Problème 2 : Nom d'exercice différent
**Symptôme** : L'exercice dans `sets.exercise_name` ne match pas avec `exercises.name`

**Exemples** :
- `sets.exercise_name` = "Squat" 
- `exercises.name` = "Back Squat"
- ❌ Pas de match !

**Solution 1** : Uniformiser les noms
```sql
UPDATE sets 
SET exercise_name = 'Back Squat'
WHERE exercise_name = 'Squat';
```

**Solution 2** : Ajouter l'exercice exact
```sql
INSERT INTO exercises (name, category)
VALUES ('Squat', 'strength');
```

### Problème 3 : Table RPE incomplète
**Symptôme** : `v_percentage` est NULL

**Solution** : Vérifier que la table RPE contient bien toutes les combinaisons
```sql
SELECT COUNT(*) FROM rpe_table;
-- Doit retourner 264 lignes (22 RPE × 12 reps)
```

## 📊 Exemple de calcul complet

### Données d'entrée
- **Exercice** : Squat
- **Semaine 1** : 3 reps @ RPE 5.0 → 70 kg
- **Semaine 2** : 3 reps @ RPE 6.0 (auto-incrémenté)
- **1RM athlète** : 150 kg

### Calcul
1. **RPE incrémenté** : 5.0 < 6.0 (threshold) → 5.0 + 1.0 = **6.0**
2. **Pourcentage** : RPE 6.0 @ 3 reps = **80.9%** (depuis rpe_table)
3. **Poids brut** : 150 × 80.9% = 121.35 kg
4. **Arrondi 2.5kg** : ROUND(121.35 / 2.5) × 2.5 = **120.0 kg**

### Résultat final
- Semaine 1 : 70 kg
- **Semaine 2 : 120 kg** ✅

## 🎯 Checklist de vérification

Avant de créer la Semaine 2, vérifiez :

- [ ] Les Personal Records existent pour tous les exercices
- [ ] Les noms d'exercices sont identiques entre `sets.exercise_name` et `exercises.name`
- [ ] La table `rpe_table` contient 264 entrées
- [ ] Les colonnes `estimated_1rm` sont remplies dans `personal_records`
- [ ] Le script SQL corrigé est exécuté sur Supabase

## 🚀 Prochaines étapes

1. **Exécuter les requêtes de diagnostic** ci-dessus
2. **Identifier le problème** (PR manquants, nom différent, etc.)
3. **Appliquer la solution** appropriée
4. **Re-exécuter le script** `fix-create-week-function.sql`
5. **Tester** la création de la Semaine 2

---

**Note** : Si les poids ne sont toujours pas calculés après ces corrections, partagez les résultats des requêtes de diagnostic pour un diagnostic plus précis.
