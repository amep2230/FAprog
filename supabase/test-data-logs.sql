-- ============================================
-- DONNÉES DE TEST - Session Logs
-- Pour visualiser les statistiques et graphiques
-- ============================================

-- NOTE: Remplacez les UUIDs par vos vrais IDs
-- Vous pouvez les obtenir avec:
-- SELECT id, name FROM profiles WHERE role = 'athlete';
-- SELECT id, name FROM programs WHERE athlete_id = 'YOUR_ATHLETE_ID';
-- SELECT id, name FROM sessions WHERE program_id = 'YOUR_PROGRAM_ID';
-- SELECT id, name FROM sets WHERE session_id = 'YOUR_SESSION_ID';

-- Exemple de structure pour créer des logs de test:

/*
-- 1. Créer un log de séance
INSERT INTO session_logs (
  athlete_id,
  session_id,
  date,
  weight,
  completed_at
) VALUES (
  'YOUR_ATHLETE_ID',
  'YOUR_SESSION_ID',
  CURRENT_DATE,
  75.5,
  NOW()
);

-- 2. Créer des logs de sets pour cette séance
INSERT INTO set_logs (
  session_log_id,
  set_id,
  actual_reps,
  actual_weight,
  actual_rpe
) VALUES 
  ('SESSION_LOG_ID', 'SET_ID_1', 8, 100, 7.5),
  ('SESSION_LOG_ID', 'SET_ID_2', 8, 100, 7.5),
  ('SESSION_LOG_ID', 'SET_ID_3', 8, 105, 8.0);
*/

-- Pour afficher les sessions existantes et leurs sets :
SELECT 
  p.name as program_name,
  p.week_number,
  s.name as session_name,
  s.id as session_id,
  se.id as set_id,
  e.name as exercise_name,
  se.reps,
  se.rpe,
  se.prescribed_weight
FROM programs p
JOIN sessions s ON s.program_id = p.id
JOIN sets se ON se.session_id = s.id
JOIN exercises e ON e.id = se.exercise_id
WHERE p.athlete_id = 'YOUR_ATHLETE_ID'
ORDER BY p.week_number, s.day_of_week, se.set_order;
