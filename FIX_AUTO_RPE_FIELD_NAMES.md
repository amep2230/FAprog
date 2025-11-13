# 🔧 Fix - Erreur "record has no field weight"

## 🐛 Problème
Erreur lors du clic sur le bouton "Créer semaine suivante" :
```
❌ Erreur: record "v_set_record" has no field "weight"
```

# 🔧 Fix - Erreurs de noms de colonnes

## � Problèmes rencontrés

### Erreur 1: `record "v_set_record" has no field "weight"`
La fonction utilisait les mauvais noms de colonnes pour la table `sets`.

### Erreur 2: `column "max_weight_kg" does not exist`
La fonction utilisait les mauvais noms de colonnes pour la table `personal_records`.

## 🔍 Causes

### Table `sets`
- ❌ `rpe` au lieu de `prescribed_rpe`
- ❌ `reps` au lieu de `prescribed_reps`
- ❌ `weight` au lieu de `prescribed_weight`

### Table `personal_records`
- ❌ `pr.exercise_name` - cette colonne n'existe pas
- ❌ `max_weight_kg` au lieu de `weight`
- ❌ `pr.recorded_at` au lieu de `pr.created_at`
- ✅ Doit faire une jointure avec `exercises` pour matcher `exercise_name`

## ✅ Solution

### Exécuter le script de correction sur Supabase

1. **Aller dans Supabase Dashboard** → Votre projet → SQL Editor

2. **Exécuter ce script** : `supabase/fix-create-week-function.sql`

   Le script va :
   - Supprimer l'ancienne version de la fonction
   - Recréer la fonction avec les bons noms de colonnes pour `sets`
   - Recréer la fonction avec la bonne requête pour `personal_records` (jointure avec `exercises`)

3. **Tester à nouveau** en cliquant sur le bouton "Créer semaine suivante (auto RPE)"

## 📝 Corrections appliquées

### Table `sets`
```sql
-- Avant (❌)
v_set_record.rpe
v_set_record.reps
v_set_record.weight

-- Après (✅)
v_set_record.prescribed_rpe
v_set_record.prescribed_reps
v_set_record.prescribed_weight
```

### Table `personal_records`
```sql
-- Avant (❌)
SELECT max_weight_kg INTO v_pr_weight
FROM personal_records pr
JOIN training_blocks tb ON tb.athlete_id = pr.athlete_id
WHERE tb.id = p_block_id
AND pr.exercise_name = v_set_record.exercise_name
ORDER BY pr.recorded_at DESC

-- Après (✅)
SELECT pr.weight INTO v_pr_weight
FROM personal_records pr
JOIN training_blocks tb ON tb.athlete_id = pr.athlete_id
JOIN exercises e ON e.id = pr.exercise_id
WHERE tb.id = p_block_id
AND e.name = v_set_record.exercise_name
AND pr.reps = 1
ORDER BY pr.created_at DESC
```

## 📋 Vérification

Après avoir exécuté le script, vous pouvez vérifier que la fonction existe :

```sql
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as definition
FROM pg_proc 
WHERE proname = 'create_week_from_week_one';
```

## 🧪 Test

1. Créer un bloc de type "force"
2. Créer la Semaine 1 avec des exercices et RPE
3. Cliquer sur "Créer semaine suivante (auto RPE)"
4. ✅ La Semaine 2 devrait se créer avec succès

## 📝 Fichiers modifiés

- ✅ `supabase/create-week-from-week-one-function.sql` - Version corrigée
- ✅ `supabase/fix-create-week-function.sql` - Script de correction rapide

## 🔄 Prochaines étapes

Après avoir exécuté le script de correction :
1. Tester la création automatique de semaines
2. Vérifier que les RPE sont bien incrémentés
3. Vérifier que les charges sont bien recalculées

---

**Note** : Ce fix corrige uniquement les noms de colonnes. La logique de la fonction reste identique.
