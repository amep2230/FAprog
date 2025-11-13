-- ============================================
-- SCRIPT DE DIAGNOSTIC - Auto-Incrément RPE
-- Permet de vérifier pourquoi les poids ne sont pas calculés
-- ============================================

-- ⚠️ REMPLACEZ CES VALEURS PAR LES VÔTRES
DO $$
DECLARE
  v_block_id UUID := 'VOTRE_BLOCK_ID';  -- ID du bloc à diagnostiquer
  v_athlete_id UUID;
  v_week_one_id UUID;
BEGIN
  -- Récupérer l'athlete_id du bloc
  SELECT athlete_id INTO v_athlete_id FROM training_blocks WHERE id = v_block_id;
  
  -- Récupérer l'ID de la semaine 1
  SELECT id INTO v_week_one_id FROM training_weeks WHERE block_id = v_block_id AND week_number = 1;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DIAGNOSTIC - Bloc ID: %', v_block_id;
  RAISE NOTICE 'Athlete ID: %', v_athlete_id;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

-- ============================================
-- 1️⃣ VÉRIFICATION DES EXERCICES DE LA SEMAINE 1
-- ============================================
SELECT 
  '1. EXERCICES SEMAINE 1' as check_name,
  s.exercise_name,
  s.prescribed_reps as reps,
  s.prescribed_rpe as rpe,
  s.prescribed_weight as weight_s1,
  e.id as exercise_exists_in_db,
  CASE 
    WHEN e.id IS NULL THEN '❌ Exercice introuvable dans la table exercises'
    ELSE '✅ OK'
  END as status
FROM sets s
JOIN sessions se ON se.id = s.session_id
JOIN training_weeks tw ON tw.id = se.week_id
LEFT JOIN exercises e ON LOWER(TRIM(e.name)) = LOWER(TRIM(s.exercise_name))
WHERE tw.block_id = 'VOTRE_BLOCK_ID'  -- REMPLACEZ ICI
AND tw.week_number = 1
ORDER BY s.exercise_name, s.set_number;

-- ============================================
-- 2️⃣ VÉRIFICATION DES PERSONAL RECORDS
-- ============================================
SELECT 
  '2. PERSONAL RECORDS' as check_name,
  e.name as exercise_name,
  pr.reps,
  pr.weight,
  pr.estimated_1rm,
  pr.created_at,
  CASE 
    WHEN pr.estimated_1rm IS NULL THEN '⚠️ estimated_1rm NULL'
    ELSE '✅ OK'
  END as status
FROM training_blocks tb
JOIN personal_records pr ON pr.athlete_id = tb.athlete_id
JOIN exercises e ON e.id = pr.exercise_id
WHERE tb.id = 'VOTRE_BLOCK_ID'  -- REMPLACEZ ICI
ORDER BY e.name, pr.estimated_1rm DESC;

-- ============================================
-- 3️⃣ VÉRIFICATION DE LA TABLE RPE
-- ============================================
SELECT 
  '3. TABLE RPE - Exemples' as check_name,
  rpe,
  reps,
  percentage_of_1rm
FROM rpe_table
WHERE (rpe = 5.0 OR rpe = 6.0 OR rpe = 7.0)
AND reps IN (3, 5, 6)
ORDER BY rpe, reps;

-- Compter le total
SELECT 
  '3. TABLE RPE - Total' as check_name,
  COUNT(*) as total_entries,
  CASE 
    WHEN COUNT(*) = 264 THEN '✅ OK (264 entrées)'
    ELSE '❌ Incomplet (devrait être 264)'
  END as status
FROM rpe_table;

-- ============================================
-- 4️⃣ SIMULATION DU CALCUL POUR UN EXERCICE
-- ============================================
DO $$
DECLARE
  v_block_id UUID := 'VOTRE_BLOCK_ID';  -- REMPLACEZ ICI
  v_exercise_name TEXT := 'Squat';       -- REMPLACEZ ICI
  v_reps INTEGER := 3;                   -- REMPLACEZ ICI
  v_rpe_semaine_1 DECIMAL(3,1) := 5.0;  -- REMPLACEZ ICI
  v_new_rpe DECIMAL(3,1);
  v_percentage DECIMAL(5,2);
  v_pr_weight DECIMAL(5,2);
  v_new_weight DECIMAL(5,2);
  v_rpe_threshold DECIMAL(3,1);
  v_rpe_increment_low DECIMAL(3,1);
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '4. SIMULATION DU CALCUL';
  RAISE NOTICE '========================================';
  
  -- Récupérer les paramètres du bloc
  SELECT rpe_threshold, rpe_increment_low 
  INTO v_rpe_threshold, v_rpe_increment_low
  FROM training_blocks 
  WHERE id = v_block_id;
  
  RAISE NOTICE 'Exercice: %', v_exercise_name;
  RAISE NOTICE 'Reps: %', v_reps;
  RAISE NOTICE 'RPE Semaine 1: %', v_rpe_semaine_1;
  RAISE NOTICE '';
  
  -- Calculer le nouveau RPE
  IF v_rpe_semaine_1 < v_rpe_threshold THEN
    v_new_rpe := v_rpe_semaine_1 + v_rpe_increment_low;
    RAISE NOTICE 'Calcul RPE: %.1f < %.1f (threshold) → %.1f + %.1f = %.1f', 
      v_rpe_semaine_1, v_rpe_threshold, v_rpe_semaine_1, v_rpe_increment_low, v_new_rpe;
  ELSE
    v_new_rpe := v_rpe_semaine_1 + 0.5;
    RAISE NOTICE 'Calcul RPE: %.1f >= %.1f (threshold) → %.1f + 0.5 = %.1f', 
      v_rpe_semaine_1, v_rpe_threshold, v_rpe_semaine_1, v_new_rpe;
  END IF;
  
  -- Récupérer le pourcentage
  SELECT percentage_of_1rm INTO v_percentage
  FROM rpe_table
  WHERE reps = v_reps AND rpe = v_new_rpe;
  
  IF v_percentage IS NULL THEN
    RAISE NOTICE '❌ ERREUR: Pas de pourcentage trouvé pour RPE %.1f @ % reps', v_new_rpe, v_reps;
    RETURN;
  END IF;
  
  RAISE NOTICE 'Pourcentage 1RM: %.1f%%', v_percentage;
  
  -- Récupérer le PR
  SELECT COALESCE(pr.estimated_1rm, pr.weight) INTO v_pr_weight
  FROM personal_records pr
  JOIN training_blocks tb ON tb.athlete_id = pr.athlete_id
  JOIN exercises e ON e.id = pr.exercise_id
  WHERE tb.id = v_block_id
  AND LOWER(TRIM(e.name)) = LOWER(TRIM(v_exercise_name))
  AND pr.reps = 1
  ORDER BY pr.created_at DESC
  LIMIT 1;
  
  IF v_pr_weight IS NULL THEN
    -- Essayer avec n'importe quel PR
    SELECT pr.estimated_1rm INTO v_pr_weight
    FROM personal_records pr
    JOIN training_blocks tb ON tb.athlete_id = pr.athlete_id
    JOIN exercises e ON e.id = pr.exercise_id
    WHERE tb.id = v_block_id
    AND LOWER(TRIM(e.name)) = LOWER(TRIM(v_exercise_name))
    ORDER BY pr.estimated_1rm DESC
    LIMIT 1;
  END IF;
  
  IF v_pr_weight IS NULL THEN
    RAISE NOTICE '❌ ERREUR: Pas de PR trouvé pour %', v_exercise_name;
    RETURN;
  END IF;
  
  RAISE NOTICE '1RM athlète: % kg', v_pr_weight;
  
  -- Calculer le poids
  v_new_weight := (v_pr_weight * v_percentage / 100);
  RAISE NOTICE 'Poids brut: %.2f kg (% × %.1f%% / 100)', v_new_weight, v_pr_weight, v_percentage;
  
  -- Arrondir à 2.5kg
  v_new_weight := ROUND((v_new_weight / 2.5)::numeric, 0) * 2.5;
  RAISE NOTICE 'Poids arrondi (2.5kg): %.1f kg', v_new_weight;
  RAISE NOTICE '';
  RAISE NOTICE '✅ RÉSULTAT FINAL: %.1f kg @ RPE %.1f', v_new_weight, v_new_rpe;
  RAISE NOTICE '========================================';
END $$;

-- ============================================
-- 5️⃣ VÉRIFICATION DES CORRESPONDANCES NOMS
-- ============================================
SELECT 
  '5. CORRESPONDANCE NOMS' as check_name,
  s.exercise_name as nom_dans_sets,
  e.name as nom_dans_exercises,
  CASE 
    WHEN e.id IS NOT NULL THEN '✅ Match'
    ELSE '❌ Pas de match'
  END as status
FROM (
  SELECT DISTINCT s.exercise_name
  FROM sets s
  JOIN sessions se ON se.id = s.session_id
  JOIN training_weeks tw ON tw.id = se.week_id
  WHERE tw.block_id = 'VOTRE_BLOCK_ID'  -- REMPLACEZ ICI
  AND tw.week_number = 1
) s
LEFT JOIN exercises e ON LOWER(TRIM(e.name)) = LOWER(TRIM(s.exercise_name))
ORDER BY status DESC, s.exercise_name;

-- ============================================
-- 📋 INSTRUCTIONS
-- ============================================
/*
COMMENT UTILISER CE SCRIPT :

1. Remplacez 'VOTRE_BLOCK_ID' par l'ID de votre bloc (5 endroits)
2. Dans la section 4, remplacez aussi :
   - v_exercise_name := 'Squat' (nom de l'exercice à tester)
   - v_reps := 3 (nombre de reps)
   - v_rpe_semaine_1 := 5.0 (RPE de la semaine 1)
3. Exécutez le script complet sur Supabase SQL Editor
4. Analysez les résultats :
   - ✅ = Tout va bien
   - ❌ = Problème à corriger
   - ⚠️ = Attention requise

RÉSULTATS ATTENDUS :
- Section 1 : Tous les exercices doivent avoir exercise_exists_in_db NOT NULL
- Section 2 : Au moins un PR par exercice avec estimated_1rm NOT NULL
- Section 3 : 264 entrées dans rpe_table
- Section 4 : Calcul complet sans erreur
- Section 5 : Tous les exercices doivent matcher
*/
