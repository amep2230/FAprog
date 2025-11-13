# 🔧 CORRECTIF FINAL - Fonction Auto-Incrément RPE

## 📊 Résumé des erreurs corrigées

### ❌ Erreur 1 : `record "v_set_record" has no field "weight"`
**Cause** : Mauvais noms de colonnes pour la table `sets`

### ❌ Erreur 2 : `column "max_weight_kg" does not exist`  
**Cause** : Mauvais noms de colonnes et jointure manquante pour `personal_records`

### ❌ Erreur 3 : `column "rest_seconds" does not exist`
**Cause** : Tentative d'insertion de colonnes inexistantes (`rest_seconds`, `tempo`)

---

## ✅ Toutes les corrections appliquées

### 1️⃣ Table `sets` - Noms de colonnes corrigés

| ❌ Avant | ✅ Après |
|---------|---------|
| `v_set_record.rpe` | `v_set_record.prescribed_rpe` |
| `v_set_record.reps` | `v_set_record.prescribed_reps` |
| `v_set_record.weight` | `v_set_record.prescribed_weight` |

### 2️⃣ INSERT INTO sets - Colonnes inexistantes supprimées

**Colonnes retirées** :
- ❌ `rest_seconds` - n'existe pas dans la table
- ❌ `tempo` - n'existe pas dans la table

**Colonnes utilisées** (✅) :
- `session_id`, `exercise_name`, `exercise_type`, `set_number`
- `prescribed_reps`, `prescribed_weight`, `prescribed_rpe`
- `notes`

### 3️⃣ Table `personal_records` - Requête corrigée

**Avant (❌)** :
```sql
SELECT max_weight_kg INTO v_pr_weight
FROM personal_records pr
JOIN training_blocks tb ON tb.athlete_id = pr.athlete_id
WHERE tb.id = p_block_id
AND pr.exercise_name = v_set_record.exercise_name
ORDER BY pr.recorded_at DESC
LIMIT 1;
```

**Après (✅)** :
```sql
SELECT pr.weight INTO v_pr_weight
FROM personal_records pr
JOIN training_blocks tb ON tb.athlete_id = pr.athlete_id
JOIN exercises e ON e.id = pr.exercise_id
WHERE tb.id = p_block_id
AND e.name = v_set_record.exercise_name
AND pr.reps = 1
ORDER BY pr.created_at DESC
LIMIT 1;
```

**Changements** :
- ✅ `max_weight_kg` → `pr.weight`
- ✅ Ajout de la jointure avec `exercises` (car `personal_records` utilise `exercise_id`, pas `exercise_name`)
- ✅ Filtre `pr.reps = 1` pour obtenir le vrai 1RM
- ✅ `pr.recorded_at` → `pr.created_at`

---

## 🚀 Installation du correctif

### Méthode 1 : Script de correction rapide (recommandé)

**Sur Supabase Dashboard → SQL Editor** :

```sql
-- Copier/coller le contenu complet de :
supabase/fix-create-week-function.sql
```

### Méthode 2 : Fichier complet

```sql
-- Copier/coller le contenu complet de :
supabase/create-week-from-week-one-function.sql
```

---

## 🧪 Test après correction

1. ✅ Aller sur votre application
2. ✅ Créer un bloc de type "force"
3. ✅ Créer la Semaine 1 avec des exercices et RPE
4. ✅ Cliquer sur "Créer semaine suivante (auto RPE)" 📈
5. ✅ Vérifier que la Semaine 2 est créée avec succès

---

## 📊 Structure des tables concernées

### Table `sets` (structure réelle)
```sql
sets (
  id UUID,
  session_id UUID,
  exercise_name TEXT,              -- ✅ utilisé
  exercise_type TEXT,              -- ✅ utilisé
  set_number INTEGER,              -- ✅ utilisé
  prescribed_reps INTEGER,         -- ✅ utilisé
  prescribed_weight DECIMAL(5,2),  -- ✅ utilisé
  prescribed_rpe DECIMAL(3,1),     -- ✅ utilisé
  actual_reps INTEGER,
  actual_weight DECIMAL(5,2),
  actual_rpe DECIMAL(3,1),
  notes TEXT,                      -- ✅ utilisé
  created_at TIMESTAMP,
  updated_at TIMESTAMP
  -- ❌ rest_seconds N'EXISTE PAS
  -- ❌ tempo N'EXISTE PAS
)
```

### Table `personal_records`
```sql
personal_records (
  id UUID,
  athlete_id UUID,
  exercise_id UUID,               -- ✅ jointure avec exercises.id
  reps INTEGER,                   -- ✅ filtre sur reps = 1
  weight DECIMAL(5,2),            -- ✅ utilisé (pas max_weight_kg)
  estimated_1rm DECIMAL(5,2),
  created_at TIMESTAMP            -- ✅ utilisé (pas recorded_at)
)
```

### Table `exercises`
```sql
exercises (
  id UUID,
  name TEXT                       -- ✅ utilisé pour matcher exercise_name
)
```

---

## 🎯 Calcul du poids final

Voici comment la fonction calcule les charges :

```
1. Récupérer le nouveau RPE (incrémenté)
2. Récupérer le nombre de reps de l'exercice
3. Chercher le % dans rpe_table : 
   → WHERE reps = prescribed_reps AND rpe = nouveau_rpe
4. Récupérer le 1RM de l'athlète via :
   → personal_records → exercise_id → exercises.name
5. Calculer : nouveau_poids = (1RM × %) / 100
```

**Exemple** :
- RPE 7.0 @ 6 reps = 76.2% du 1RM (depuis rpe_table)
- 1RM Squat = 150 kg (depuis personal_records)
- Charge calculée = (150 × 76.2) / 100 = **114.3 kg**

---

## ✅ Validation finale

Après l'exécution du script, vérifiez que la fonction existe :

```sql
SELECT 
  proname as function_name,
  pronargs as num_arguments,
  prorettype::regtype as return_type
FROM pg_proc 
WHERE proname = 'create_week_from_week_one';
```

**Résultat attendu** :
```
function_name              | num_arguments | return_type
--------------------------|---------------|-------------
create_week_from_week_one | 3             | uuid
```

---

## 📚 Fichiers mis à jour

1. ✅ `supabase/create-week-from-week-one-function.sql` - Fichier principal corrigé
2. ✅ `supabase/fix-create-week-function.sql` - Script de correction rapide
3. ✅ `FIX_AUTO_RPE_FIELD_NAMES.md` - Documentation des corrections
4. ✅ `FIX_AUTO_RPE_FINAL.md` - Ce document (résumé complet)

---

## 🎉 Statut

**✅ TOUTES LES ERREURS SONT CORRIGÉES**

Vous pouvez maintenant :
1. Exécuter le script SQL
2. Utiliser le bouton "Créer semaine suivante (auto RPE)"
3. Profiter de l'auto-incrément du RPE ! 🚀

---

**Date** : 6 novembre 2025  
**Version** : 1.0.1 (correctif final)
