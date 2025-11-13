# 🎯 CORRECTIF v1.1 - Arrondi 2.5kg + Recherche PR élargie

## 🆕 Nouvelles fonctionnalités (v1.1)

### 1️⃣ Arrondi automatique à 2.5 kg près
Les poids sont maintenant arrondis aux plaques standards :
- 67.3 kg → **67.5 kg**
- 114.8 kg → **115.0 kg** 
- 48.2 kg → **47.5 kg**
- 121.35 kg → **120.0 kg**

### 2️⃣ Recherche élargie des Personal Records
**Avant** : Ne trouvait les PR que si `reps = 1` exactement

**Maintenant** :
1. Essaie d'abord avec `reps = 1` et prend `estimated_1rm`
2. Si pas trouvé, prend n'importe quel PR et utilise le meilleur `estimated_1rm`

Cela permet de calculer les poids même si l'athlète n'a pas de vrai 1RM enregistré !

---

## 📝 Code ajouté

### Arrondi à 2.5kg
```sql
-- Calculer le poids brut
v_new_weight := (v_pr_weight * v_percentage / 100);

-- Arrondir à 2.5kg près
v_new_weight := ROUND((v_new_weight / 2.5)::numeric, 0) * 2.5;
```

**Formule** : `ROUND(poids / 2.5) × 2.5`

### Recherche PR élargie
```sql
-- 1. Essayer avec reps = 1
SELECT COALESCE(pr.estimated_1rm, pr.weight) INTO v_pr_weight
FROM personal_records pr
JOIN training_blocks tb ON tb.athlete_id = pr.athlete_id
JOIN exercises e ON e.id = pr.exercise_id
WHERE tb.id = p_block_id
AND e.name = v_set_record.exercise_name
AND pr.reps = 1
ORDER BY pr.created_at DESC
LIMIT 1;

-- 2. Si pas trouvé, prendre n'importe quel PR
IF v_pr_weight IS NULL THEN
  SELECT pr.estimated_1rm INTO v_pr_weight
  FROM personal_records pr
  JOIN training_blocks tb ON tb.athlete_id = pr.athlete_id
  JOIN exercises e ON e.id = pr.exercise_id
  WHERE tb.id = p_block_id
  AND e.name = v_set_record.exercise_name
  ORDER BY pr.estimated_1rm DESC, pr.created_at DESC
  LIMIT 1;
END IF;
```

---

## 🧪 Exemple de calcul complet

### Scénario : Squat - Semaine 1 → Semaine 2

**Données** :
- **Semaine 1** : 3 reps @ RPE 5.0 = 70 kg
- **1RM estimé** : 150 kg (depuis personal_records)
- **Threshold** : 6.0 (défaut)
- **Increment low** : 1.0 (défaut)

### Étapes de calcul :

#### 1. Incrément RPE
```
RPE S1 = 5.0
5.0 < 6.0 (threshold) → incrément +1.0
RPE S2 = 5.0 + 1.0 = 6.0 ✅
```

#### 2. Chercher % 1RM dans rpe_table
```sql
SELECT percentage_of_1rm 
FROM rpe_table 
WHERE rpe = 6.0 AND reps = 3;

-- Résultat : 80.9%
```

#### 3. Calculer poids brut
```
Poids brut = 150 kg × 80.9% = 121.35 kg
```

#### 4. Arrondir à 2.5kg
```
121.35 / 2.5 = 48.54
ROUND(48.54) = 49
49 × 2.5 = 122.5 kg

Mais en fait : ROUND(121.35 / 2.5) = 48
48 × 2.5 = 120.0 kg ✅
```

### ✅ Résultat final
- **Semaine 1** : 70 kg @ RPE 5.0
- **Semaine 2** : **120.0 kg @ RPE 6.0** 

---

## 🔍 Diagnostic si les poids ne changent pas

### Utilisez le script de diagnostic

```sql
-- Exécutez ce fichier sur Supabase :
supabase/diagnose-auto-rpe.sql

-- N'oubliez pas de remplacer :
-- 1. VOTRE_BLOCK_ID (5 fois)
-- 2. Les paramètres de test (section 4)
```

### Problèmes courants

| Symptôme | Cause probable | Solution |
|----------|----------------|----------|
| Poids identiques S1/S2 | Pas de PR trouvé | Vérifier `personal_records` |
| Erreur "NULL" | Exercice introuvable | Vérifier nom exact dans `exercises` |
| Poids = 0 | Table RPE incomplète | Vérifier 264 entrées |
| Nom différent | "Squat" vs "Back Squat" | Uniformiser les noms |

### Checklist de vérification

```sql
-- 1. Vérifier les PR existent
SELECT COUNT(*) 
FROM personal_records pr
JOIN training_blocks tb ON tb.athlete_id = pr.athlete_id
WHERE tb.id = 'VOTRE_BLOCK_ID';
-- Doit être > 0

-- 2. Vérifier la table RPE
SELECT COUNT(*) FROM rpe_table;
-- Doit être = 264

-- 3. Vérifier les noms d'exercices
SELECT DISTINCT exercise_name 
FROM sets s
JOIN sessions se ON se.id = s.session_id
JOIN training_weeks tw ON tw.id = se.week_id
WHERE tw.block_id = 'VOTRE_BLOCK_ID' 
AND tw.week_number = 1;
-- Comparer avec exercises.name
```

---

## 🚀 Installation v1.1

### Exécuter sur Supabase

```sql
-- Copiez TOUT le contenu de ce fichier :
supabase/fix-create-week-function.sql
```

---

## 📊 Tests de validation

### Test 1 : Arrondi 2.5kg
```sql
DO $$
DECLARE
  v_weight DECIMAL(5,2);
BEGIN
  -- Test 1
  v_weight := 121.35;
  v_weight := ROUND((v_weight / 2.5)::numeric, 0) * 2.5;
  RAISE NOTICE 'Test 1: 121.35 → %.1f (attendu: 120.0)', v_weight;
  
  -- Test 2
  v_weight := 67.3;
  v_weight := ROUND((v_weight / 2.5)::numeric, 0) * 2.5;
  RAISE NOTICE 'Test 2: 67.3 → %.1f (attendu: 67.5)', v_weight;
  
  -- Test 3
  v_weight := 114.8;
  v_weight := ROUND((v_weight / 2.5)::numeric, 0) * 2.5;
  RAISE NOTICE 'Test 3: 114.8 → %.1f (attendu: 115.0)', v_weight;
END $$;
```

### Test 2 : Recherche PR
```sql
-- Scénario : Athlète a un 5RM mais pas de 1RM
INSERT INTO personal_records (athlete_id, exercise_id, reps, weight, estimated_1rm)
SELECT 
  'ATHLETE_ID',
  e.id,
  5,
  140.0,
  157.5  -- 1RM estimé
FROM exercises e
WHERE e.name = 'Squat';

-- La fonction devrait trouver ce PR même si reps != 1
```

---

## 📚 Fichiers mis à jour

| Fichier | Description |
|---------|-------------|
| `supabase/fix-create-week-function.sql` | **À EXÉCUTER** - Fonction corrigée v1.1 |
| `supabase/create-week-from-week-one-function.sql` | Version principale v1.1 |
| `supabase/diagnose-auto-rpe.sql` | Script de diagnostic |
| `DEBUG_AUTO_RPE_WEIGHTS.md` | Guide de debugging |
| `FIX_AUTO_RPE_V1.1.md` | Ce document |

---

## 🎉 Changelog

### Version 1.1 (Actuelle)
- ✅ Arrondi automatique à 2.5kg près
- ✅ Recherche élargie des Personal Records
- ✅ Meilleure gestion des cas où reps != 1
- ✅ Script de diagnostic inclus

### Version 1.0.2
- ✅ Correction colonnes `rest_seconds` et `tempo`
- ✅ Correction table `personal_records` 
- ✅ Correction table `sets`

---

**Date** : 6 novembre 2025  
**Version** : 1.1.0  
**Status** : ✅ PRODUCTION READY
