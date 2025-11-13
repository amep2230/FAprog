-- ============================================
-- FIX: Corriger les noms de colonnes dans la fonction
-- Remplace: rpe, reps, weight
-- Par: prescribed_rpe, prescribed_reps, prescribed_weight
-- ============================================

-- Supprimer l'ancienne version de la fonction
DROP FUNCTION IF EXISTS create_week_from_week_one(UUID, INTEGER, TEXT);

-- Recréer la fonction avec les bons noms de colonnes
CREATE OR REPLACE FUNCTION create_week_from_week_one(
  p_block_id UUID,
  p_week_number INTEGER,
  p_week_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_week_id UUID;
  v_week_one_id UUID;
  v_block_type TEXT;
  v_rpe_increment DECIMAL(3,1);
  v_rpe_increment_low DECIMAL(3,1);
  v_rpe_increment_high DECIMAL(3,1);
  v_rpe_threshold DECIMAL(3,1);
  v_previous_week_id UUID;
  v_session_record RECORD;
  v_set_record RECORD;
  v_new_session_id UUID;
  v_new_rpe DECIMAL(3,1);
  v_new_weight DECIMAL(5,2);
  v_percentage DECIMAL(5,2);
  v_pr_weight DECIMAL(5,2);
BEGIN
  -- Récupérer les paramètres du bloc
  SELECT block_type, rpe_increment_low, rpe_increment_high, rpe_threshold
  INTO v_block_type, v_rpe_increment_low, v_rpe_increment_high, v_rpe_threshold
  FROM training_blocks
  WHERE id = p_block_id;

  -- Si ce n'est pas un bloc de force, retourner une erreur
  IF v_block_type != 'force' THEN
    RAISE EXCEPTION 'Cette fonction ne peut être utilisée que pour les blocs de force';
  END IF;

  -- Récupérer l'ID de la semaine 1
  SELECT id INTO v_week_one_id
  FROM training_weeks
  WHERE block_id = p_block_id AND week_number = 1;

  IF v_week_one_id IS NULL THEN
    RAISE EXCEPTION 'La semaine 1 n''existe pas pour ce bloc';
  END IF;

  -- Vérifier si la semaine existe déjà
  IF EXISTS (SELECT 1 FROM training_weeks WHERE block_id = p_block_id AND week_number = p_week_number) THEN
    RAISE EXCEPTION 'La semaine % existe déjà pour ce bloc', p_week_number;
  END IF;

  -- Récupérer l'ID de la semaine précédente pour calculer l'incrément RPE
  SELECT id INTO v_previous_week_id
  FROM training_weeks
  WHERE block_id = p_block_id AND week_number = p_week_number - 1;

  -- Créer la nouvelle semaine
  INSERT INTO training_weeks (block_id, week_number, name, notes)
  VALUES (
    p_block_id,
    p_week_number,
    COALESCE(p_week_name, 'Semaine ' || p_week_number),
    'Créée automatiquement à partir de la semaine 1 avec RPE incrémenté'
  )
  RETURNING id INTO v_new_week_id;

  -- Pour chaque session de la semaine 1
  FOR v_session_record IN
    SELECT * FROM sessions
    WHERE week_id = v_week_one_id
    ORDER BY session_number
  LOOP
    -- Créer la nouvelle session
    INSERT INTO sessions (week_id, session_number, name, notes)
    VALUES (
      v_new_week_id,
      v_session_record.session_number,
      v_session_record.name,
      v_session_record.notes
    )
    RETURNING id INTO v_new_session_id;

    -- Pour chaque set de la session
    FOR v_set_record IN
      SELECT * FROM sets
      WHERE session_id = v_session_record.id
      ORDER BY set_number
    LOOP
      -- Calculer le nouvel RPE
      v_new_rpe := v_set_record.prescribed_rpe;
      
      -- Si il y a une semaine précédente, calculer l'incrément basé sur le RPE de la semaine précédente
      IF v_previous_week_id IS NOT NULL THEN
        -- Récupérer le RPE correspondant de la semaine précédente
        SELECT prescribed_rpe INTO v_new_rpe
        FROM sets
        WHERE session_id IN (
          SELECT id FROM sessions 
          WHERE week_id = v_previous_week_id 
          AND session_number = v_session_record.session_number
        )
        AND set_number = v_set_record.set_number
        AND exercise_name = v_set_record.exercise_name
        LIMIT 1;

        -- Si trouvé, incrémenter
        IF v_new_rpe IS NOT NULL THEN
          IF v_new_rpe < v_rpe_threshold THEN
            v_new_rpe := v_new_rpe + v_rpe_increment_low;
          ELSE
            v_new_rpe := v_new_rpe + v_rpe_increment_high;
          END IF;

          -- Limiter le RPE à 12.5 maximum
          IF v_new_rpe > 12.5 THEN
            v_new_rpe := 12.5;
          END IF;
        ELSE
          -- Si pas trouvé, utiliser le RPE de la semaine 1
          v_new_rpe := v_set_record.prescribed_rpe;
        END IF;
      ELSE
        -- Pour la semaine 2, incrémenter directement depuis la semaine 1
        IF v_set_record.prescribed_rpe < v_rpe_threshold THEN
          v_new_rpe := v_set_record.prescribed_rpe + v_rpe_increment_low;
        ELSE
          v_new_rpe := v_set_record.prescribed_rpe + v_rpe_increment_high;
        END IF;

        -- Limiter le RPE à 12.5 maximum
        IF v_new_rpe > 12.5 THEN
          v_new_rpe := 12.5;
        END IF;
      END IF;

      -- Calculer le nouveau poids basé sur le RPE et les reps
      v_new_weight := v_set_record.prescribed_weight;
      
      -- Récupérer le pourcentage du 1RM depuis la table RPE
      SELECT percentage_of_1rm INTO v_percentage
      FROM rpe_table
      WHERE reps = v_set_record.prescribed_reps AND rpe = v_new_rpe;

      -- Si trouvé dans la table RPE, calculer le poids
      IF v_percentage IS NOT NULL THEN
        -- Récupérer le PR de l'athlète pour cet exercice (essayer avec estimated_1rm d'abord)
        SELECT COALESCE(pr.estimated_1rm, pr.weight) INTO v_pr_weight
        FROM personal_records pr
        JOIN training_blocks tb ON tb.athlete_id = pr.athlete_id
        JOIN exercises e ON e.id = pr.exercise_id
        WHERE tb.id = p_block_id
        AND e.name = v_set_record.exercise_name
        AND pr.reps = 1
        ORDER BY pr.created_at DESC
        LIMIT 1;

        -- Si pas trouvé, essayer de trouver n'importe quel PR et calculer le 1RM estimé
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

        -- Si PR trouvé, calculer le poids et arrondir à 2.5kg près
        IF v_pr_weight IS NOT NULL THEN
          -- Calculer le poids brut
          v_new_weight := (v_pr_weight * v_percentage / 100);
          -- Arrondir à 2.5kg près : ROUND(weight / 2.5) * 2.5
          v_new_weight := ROUND((v_new_weight / 2.5)::numeric, 0) * 2.5;
        END IF;
      END IF;

      -- Créer le nouveau set avec le RPE incrémenté et le poids calculé
      INSERT INTO sets (
        session_id,
        exercise_name,
        exercise_type,
        set_number,
        prescribed_reps,
        prescribed_weight,
        prescribed_rpe,
        actual_rpe,
        notes
      )
      VALUES (
        v_new_session_id,
        v_set_record.exercise_name,
        v_set_record.exercise_type,
        v_set_record.set_number,
        v_set_record.prescribed_reps,
        v_new_weight,
        v_new_rpe,
        v_new_rpe,  -- RPE réel initialisé avec le RPE prescrit
        v_set_record.notes
      );
    END LOOP;
  END LOOP;

  RETURN v_new_week_id;
END;
$$;

-- Ajouter un commentaire pour la documentation
COMMENT ON FUNCTION create_week_from_week_one IS 'Crée une nouvelle semaine pour un bloc de force en copiant la semaine 1 avec RPE incrémenté automatiquement selon les paramètres du bloc';
