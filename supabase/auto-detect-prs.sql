-- ============================================
-- FONCTION ET TRIGGER POUR DÉTECTION AUTOMATIQUE DES PRs
-- Lors du logging d'une séance, si un athlète bat un PR,
-- il est automatiquement enregistré dans personal_records
-- ============================================

-- Fonction qui vérifie et crée un PR automatiquement
CREATE OR REPLACE FUNCTION auto_create_pr_from_set_log()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_athlete_id UUID;
  v_exercise_id UUID;
  v_session_date DATE;
  v_existing_pr RECORD;
  v_estimated_1rm DECIMAL(5,2);
BEGIN
  -- Récupérer l'athlete_id, exercise_id et la date de la séance
  SELECT 
    sl.athlete_id,
    s.exercise_id,
    sl.date
  INTO 
    v_athlete_id,
    v_exercise_id,
    v_session_date
  FROM set_logs slg
  JOIN sets s ON slg.set_id = s.id
  JOIN session_logs sl ON slg.session_log_id = sl.id
  WHERE slg.id = NEW.id;

  -- Calculer le 1RM estimé avec la formule Epley
  -- 1RM = weight × (1 + reps / 30)
  v_estimated_1rm := NEW.actual_weight * (1 + NEW.actual_reps / 30.0);

  -- Chercher le PR existant pour cet exercice
  SELECT *
  INTO v_existing_pr
  FROM personal_records
  WHERE athlete_id = v_athlete_id
    AND exercise_id = v_exercise_id
  ORDER BY estimated_1rm DESC
  LIMIT 1;

  -- Si pas de PR existant OU si le nouveau 1RM estimé est meilleur
  IF v_existing_pr IS NULL OR v_estimated_1rm > v_existing_pr.estimated_1rm THEN
    -- Insérer ou mettre à jour le PR
    INSERT INTO personal_records (
      athlete_id,
      exercise_id,
      reps,
      weight,
      estimated_1rm,
      date,
      notes
    )
    VALUES (
      v_athlete_id,
      v_exercise_id,
      NEW.actual_reps,
      NEW.actual_weight,
      v_estimated_1rm,
      v_session_date,
      'Auto-détecté lors de la séance'
    )
    ON CONFLICT (athlete_id, exercise_id, date)
    DO UPDATE SET
      reps = EXCLUDED.reps,
      weight = EXCLUDED.weight,
      estimated_1rm = EXCLUDED.estimated_1rm,
      notes = EXCLUDED.notes
    WHERE EXCLUDED.estimated_1rm > personal_records.estimated_1rm;

    -- Log pour debug (optionnel)
    RAISE NOTICE 'Nouveau PR détecté pour athlete % sur exercice %: % kg x % reps (1RM estimé: % kg)', 
      v_athlete_id, v_exercise_id, NEW.actual_weight, NEW.actual_reps, v_estimated_1rm;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur, on log mais on ne bloque pas l'insertion du set_log
    RAISE WARNING 'Erreur lors de la détection automatique de PR: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Créer le trigger qui s'exécute après l'insertion d'un set_log
DROP TRIGGER IF EXISTS trigger_auto_create_pr ON set_logs;

CREATE TRIGGER trigger_auto_create_pr
  AFTER INSERT ON set_logs
  FOR EACH ROW
  WHEN (NEW.completed = true AND NEW.actual_weight > 0 AND NEW.actual_reps > 0)
  EXECUTE FUNCTION auto_create_pr_from_set_log();

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION auto_create_pr_from_set_log TO authenticated;

-- ============================================
-- COMMENTAIRES ET EXPLICATIONS
-- ============================================

-- Ce système fonctionne ainsi :
-- 1. L'athlète log une séance et remplit les poids/reps réellement effectués
-- 2. Pour chaque set complété (completed=true), le trigger vérifie :
--    - Calcule le 1RM estimé avec la formule Epley
--    - Compare avec le meilleur PR existant pour cet exercice
--    - Si c'est un nouveau PR, l'enregistre automatiquement
-- 3. L'athlète et le coach voient le nouveau PR sans intervention manuelle

-- Avantages :
-- ✅ Pas besoin de saisie manuelle des PRs
-- ✅ Tous les PRs sont capturés automatiquement
-- ✅ Utilise la formule Epley pour estimer les 1RM à partir de n'importe quel nombre de reps
-- ✅ Ne bloque pas l'insertion du set_log en cas d'erreur
-- ✅ Enregistre la date exacte de la séance

-- Note : On peut toujours ajouter des PRs manuellement via AddPRDialog
-- (par exemple pour des tests de 1RM en dehors du programme)
