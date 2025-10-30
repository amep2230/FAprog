-- ============================================
-- SEED DATA - EXERCICES DE BASE
-- ============================================

INSERT INTO exercises (name, muscle_group, category) VALUES
-- Exercices principaux - Squat
('Squat', 'Jambes', 'Principal'),
('Squat tempo 3.2.0', 'Jambes', 'Principal'),
('Squat pause 2CT', 'Jambes', 'Principal'),
('Squat pause 3CT', 'Jambes', 'Principal'),
('Front Squat', 'Jambes', 'Principal'),
('Box Squat', 'Jambes', 'Principal'),

-- Exercices principaux - Bench
('Bench', 'Pectoraux', 'Principal'),
('Bench pause 2CT', 'Pectoraux', 'Principal'),
('Bench pause 3CT', 'Pectoraux', 'Principal'),
('Bench larsen', 'Pectoraux', 'Principal'),
('Bench close grip', 'Pectoraux', 'Principal'),
('Incline Bench', 'Pectoraux', 'Principal'),

-- Exercices principaux - Deadlift
('Deadlift', 'Dos', 'Principal'),
('Deadlift pause 2CT', 'Dos', 'Principal'),
('Deadlift tempo 3.2.0', 'Dos', 'Principal'),
('Deficit Deadlift', 'Dos', 'Principal'),
('Romanian Deadlift', 'Dos', 'Principal'),
('Sumo Deadlift', 'Dos', 'Principal'),

-- Accessoires - Jambes
('Leg extension', 'Jambes', 'Accessoire'),
('Leg curl', 'Jambes', 'Accessoire'),
('Leg press', 'Jambes', 'Accessoire'),
('Hip trust', 'Fessiers', 'Accessoire'),
('Bulgarian split squat', 'Jambes', 'Accessoire'),
('Lunges', 'Jambes', 'Accessoire'),

-- Accessoires - Dos
('Rowing barre', 'Dos', 'Accessoire'),
('Rowing haltères', 'Dos', 'Accessoire'),
('Traction', 'Dos', 'Accessoire'),
('Lat pulldown', 'Dos', 'Accessoire'),
('Face pull', 'Dos', 'Accessoire'),

-- Accessoires - Épaules
('Développé militaire', 'Épaules', 'Accessoire'),
('Élévation latérale', 'Épaules', 'Accessoire'),
('Oiseau', 'Épaules', 'Accessoire'),
('Élévation frontale', 'Épaules', 'Accessoire'),

-- Accessoires - Bras
('Curls haltères', 'Biceps', 'Accessoire'),
('Curls barre', 'Biceps', 'Accessoire'),
('Curls marteau', 'Biceps', 'Accessoire'),
('Triceps extension poulie haute', 'Triceps', 'Accessoire'),
('Triceps extension haltères', 'Triceps', 'Accessoire'),
('Dips', 'Triceps', 'Accessoire'),

-- Accessoires - Core
('Planche', 'Abdominaux', 'Accessoire'),
('Crunch', 'Abdominaux', 'Accessoire'),
('Russian twist', 'Abdominaux', 'Accessoire'),
('Pallof press', 'Abdominaux', 'Accessoire');
