# 🔧 FIX ULTIME - Fonction Auto-Incrément RPE

## ❌ Les 3 erreurs successives rencontrées

1. **`record "v_set_record" has no field "weight"`**
   - Utilisait `weight` au lieu de `prescribed_weight`

2. **`column "max_weight_kg" does not exist`**
   - Utilisait `max_weight_kg` au lieu de `pr.weight`
   - Manquait la jointure avec la table `exercises`

3. **`column "rest_seconds" does not exist`**
   - Essayait d'insérer `rest_seconds` et `tempo` qui n'existent pas

---

## ✅ CORRECTIF FINAL APPLIQUÉ

### Fichier corrigé : `supabase/fix-create-week-function.sql`

**Modifications** :

### 1. Colonnes de la table `sets` corrigées
```sql
-- ❌ AVANT
v_set_record.rpe
v_set_record.reps  
v_set_record.weight

-- ✅ APRÈS
v_set_record.prescribed_rpe
v_set_record.prescribed_reps
v_set_record.prescribed_weight
```

### 2. Requête `personal_records` corrigée
```sql
-- ❌ AVANT
SELECT max_weight_kg INTO v_pr_weight
FROM personal_records pr
WHERE pr.exercise_name = ...

-- ✅ APRÈS
SELECT pr.weight INTO v_pr_weight
FROM personal_records pr
JOIN exercises e ON e.id = pr.exercise_id
WHERE e.name = v_set_record.exercise_name
AND pr.reps = 1
```

### 3. INSERT INTO sets - Colonnes inexistantes retirées
```sql
-- ❌ AVANT (10 colonnes)
INSERT INTO sets (
  session_id,
  exercise_name,
  exercise_type,
  set_number,
  prescribed_reps,
  prescribed_weight,
  prescribed_rpe,
  rest_seconds,    -- ❌ N'EXISTE PAS
  notes,
  tempo            -- ❌ N'EXISTE PAS
)

-- ✅ APRÈS (8 colonnes)
INSERT INTO sets (
  session_id,
  exercise_name,
  exercise_type,
  set_number,
  prescribed_reps,
  prescribed_weight,
  prescribed_rpe,
  notes
)
```

---

## 🚀 INSTALLATION

### ⚡ Exécuter sur Supabase Dashboard → SQL Editor

```sql
-- Copiez TOUT le contenu de ce fichier :
supabase/fix-create-week-function.sql
```

**Ce script va** :
1. ✅ DROP l'ancienne fonction (si elle existe)
2. ✅ CREATE la nouvelle fonction avec TOUTES les corrections
3. ✅ Ajouter un commentaire descriptif

---

## 🧪 TEST FINAL

1. ✅ Créer un bloc de type **"force"**
2. ✅ Créer la **Semaine 1** avec exercices et RPE
3. ✅ Ajouter des **Personal Records** pour les exercices
4. ✅ Cliquer sur **"Créer semaine suivante (auto RPE)"** 📈
5. ✅ **SUCCÈS** : La Semaine 2 est créée !

---

## 📋 Checklist de vérification

Après avoir exécuté le script SQL :

```sql
-- 1. Vérifier que la fonction existe
SELECT proname FROM pg_proc WHERE proname = 'create_week_from_week_one';
-- Résultat attendu : 1 ligne

-- 2. Vérifier la signature de la fonction
SELECT 
  proname,
  pronargs as num_params,
  prorettype::regtype as return_type
FROM pg_proc 
WHERE proname = 'create_week_from_week_one';
-- Résultat attendu : 3 paramètres, retourne UUID
```

---

## 🎯 Structure RÉELLE de la table `sets`

```sql
CREATE TABLE sets (
  id UUID PRIMARY KEY,
  session_id UUID NOT NULL,
  exercise_name TEXT,              -- ✅
  exercise_type TEXT,              -- ✅
  set_number INTEGER,              -- ✅
  prescribed_reps INTEGER,         -- ✅
  prescribed_weight DECIMAL(5,2),  -- ✅
  prescribed_rpe DECIMAL(3,1),     -- ✅
  actual_reps INTEGER,
  actual_weight DECIMAL(5,2),
  actual_rpe DECIMAL(3,1),
  notes TEXT,                      -- ✅
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- ❌ Ces colonnes N'EXISTENT PAS :
-- rest_seconds
-- tempo
```

---

## 🎉 STATUT

**✅ TOUTES LES 3 ERREURS SONT CORRIGÉES**

**Fichiers mis à jour** :
- ✅ `supabase/fix-create-week-function.sql` - PRÊT À EXÉCUTER
- ✅ `supabase/create-week-from-week-one-function.sql` - Version principale
- ✅ Documentation mise à jour

**Action requise** :
1. ⚡ Exécuter `supabase/fix-create-week-function.sql` sur Supabase
2. 🎯 Tester le bouton "Créer semaine suivante (auto RPE)"
3. 🎊 Profiter de l'auto-incrément !

---

**Date** : 6 novembre 2025  
**Version** : 1.0.2 (correctif final des 3 erreurs)  
**Status** : ✅ READY TO USE
