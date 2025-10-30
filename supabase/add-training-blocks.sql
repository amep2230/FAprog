-- ============================================
-- TABLE: training_blocks
-- Blocs d'entraînement (cycles de plusieurs semaines)
-- ============================================
CREATE TABLE IF NOT EXISTS training_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_blocks_coach ON training_blocks(coach_id);
CREATE INDEX IF NOT EXISTS idx_training_blocks_athlete ON training_blocks(athlete_id);
CREATE INDEX IF NOT EXISTS idx_training_blocks_is_active ON training_blocks(is_active);

-- ============================================
-- TABLE: training_weeks
-- Semaines dans un bloc d'entraînement
-- ============================================
CREATE TABLE IF NOT EXISTS training_weeks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  block_id UUID NOT NULL REFERENCES training_blocks(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_weeks_block ON training_weeks(block_id);
CREATE INDEX IF NOT EXISTS idx_training_weeks_week_number ON training_weeks(week_number);

-- Ajouter la colonne week_id à sessions pour lier directement aux semaines
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'week_id'
  ) THEN
    ALTER TABLE sessions 
    ADD COLUMN week_id UUID REFERENCES training_weeks(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_sessions_week ON sessions(week_id);
  END IF;

  -- Rendre program_id nullable (ancienne structure)
  ALTER TABLE sessions ALTER COLUMN program_id DROP NOT NULL;
  
  -- Rendre day_of_week nullable (ancienne structure)
  ALTER TABLE sessions ALTER COLUMN day_of_week DROP NOT NULL;
END $$;

-- Migrer la table sets vers la nouvelle structure
DO $$
BEGIN
  -- Ajouter exercise_name si n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sets' AND column_name = 'exercise_name'
  ) THEN
    ALTER TABLE sets ADD COLUMN exercise_name TEXT;
  END IF;

  -- Ajouter exercise_type si n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sets' AND column_name = 'exercise_type'
  ) THEN
    ALTER TABLE sets ADD COLUMN exercise_type TEXT DEFAULT 'main';
  END IF;

  -- Ajouter set_number si n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sets' AND column_name = 'set_number'
  ) THEN
    ALTER TABLE sets ADD COLUMN set_number INTEGER;
  END IF;

  -- Ajouter prescribed_reps si n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sets' AND column_name = 'prescribed_reps'
  ) THEN
    ALTER TABLE sets ADD COLUMN prescribed_reps INTEGER;
  END IF;

  -- Ajouter prescribed_rpe si n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sets' AND column_name = 'prescribed_rpe'
  ) THEN
    ALTER TABLE sets ADD COLUMN prescribed_rpe DECIMAL(3,1);
  END IF;

  -- Ajouter actual_reps si n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sets' AND column_name = 'actual_reps'
  ) THEN
    ALTER TABLE sets ADD COLUMN actual_reps INTEGER;
  END IF;

  -- Ajouter actual_weight si n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sets' AND column_name = 'actual_weight'
  ) THEN
    ALTER TABLE sets ADD COLUMN actual_weight DECIMAL(5,2);
  END IF;

  -- Ajouter actual_rpe si n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sets' AND column_name = 'actual_rpe'
  ) THEN
    ALTER TABLE sets ADD COLUMN actual_rpe DECIMAL(3,1);
  END IF;

  -- Ajouter notes si n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sets' AND column_name = 'notes'
  ) THEN
    ALTER TABLE sets ADD COLUMN notes TEXT;
  END IF;

  -- Ajouter session_number à sessions si n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'session_number'
  ) THEN
    ALTER TABLE sessions ADD COLUMN session_number INTEGER;
  END IF;

  -- Ajouter notes à sessions si n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'notes'
  ) THEN
    ALTER TABLE sessions ADD COLUMN notes TEXT;
  END IF;

  -- Rendre exercise_id nullable (ancienne structure)
  ALTER TABLE sets ALTER COLUMN exercise_id DROP NOT NULL;
END $$;

-- Activer RLS sur training_blocks
ALTER TABLE training_blocks ENABLE ROW LEVEL SECURITY;

-- Policies pour training_blocks
DROP POLICY IF EXISTS "Coaches can view their blocks" ON training_blocks;
CREATE POLICY "Coaches can view their blocks" ON training_blocks
  FOR SELECT USING (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Athletes can view their blocks" ON training_blocks;
CREATE POLICY "Athletes can view their blocks" ON training_blocks
  FOR SELECT USING (auth.uid() = athlete_id);

DROP POLICY IF EXISTS "Coaches can manage their blocks" ON training_blocks;
CREATE POLICY "Coaches can manage their blocks" ON training_blocks
  FOR ALL USING (auth.uid() = coach_id);

-- Activer RLS sur training_weeks
ALTER TABLE training_weeks ENABLE ROW LEVEL SECURITY;

-- Policies pour training_weeks
DROP POLICY IF EXISTS "Users can view weeks from their blocks" ON training_weeks;
CREATE POLICY "Users can view weeks from their blocks" ON training_weeks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM training_blocks 
      WHERE training_blocks.id = training_weeks.block_id 
      AND (training_blocks.coach_id = auth.uid() OR training_blocks.athlete_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Coaches can manage weeks" ON training_weeks;
CREATE POLICY "Coaches can manage weeks" ON training_weeks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM training_blocks 
      WHERE training_blocks.id = training_weeks.block_id 
      AND training_blocks.coach_id = auth.uid()
    )
  );

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_training_blocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at sur training_blocks
DROP TRIGGER IF EXISTS update_training_blocks_updated_at_trigger ON training_blocks;
CREATE TRIGGER update_training_blocks_updated_at_trigger
  BEFORE UPDATE ON training_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_training_blocks_updated_at();

-- Fonction pour mettre à jour updated_at sur training_weeks
CREATE OR REPLACE FUNCTION update_training_weeks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at sur training_weeks
DROP TRIGGER IF EXISTS update_training_weeks_updated_at_trigger ON training_weeks;
CREATE TRIGGER update_training_weeks_updated_at_trigger
  BEFORE UPDATE ON training_weeks
  FOR EACH ROW
  EXECUTE FUNCTION update_training_weeks_updated_at();

-- Activer RLS sur sessions (si pas déjà fait)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Policies pour sessions
DROP POLICY IF EXISTS "Users can view sessions from their weeks" ON sessions;
CREATE POLICY "Users can view sessions from their weeks" ON sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM training_weeks
      JOIN training_blocks ON training_blocks.id = training_weeks.block_id
      WHERE training_weeks.id = sessions.week_id
      AND (training_blocks.coach_id = auth.uid() OR training_blocks.athlete_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Coaches can manage sessions" ON sessions;
CREATE POLICY "Coaches can manage sessions" ON sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM training_weeks
      JOIN training_blocks ON training_blocks.id = training_weeks.block_id
      WHERE training_weeks.id = sessions.week_id
      AND training_blocks.coach_id = auth.uid()
    )
  );

-- Activer RLS sur sets (si pas déjà fait)
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;

-- Policies pour sets
DROP POLICY IF EXISTS "Users can view sets from their sessions" ON sets;
CREATE POLICY "Users can view sets from their sessions" ON sets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions
      JOIN training_weeks ON training_weeks.id = sessions.week_id
      JOIN training_blocks ON training_blocks.id = training_weeks.block_id
      WHERE sessions.id = sets.session_id
      AND (training_blocks.coach_id = auth.uid() OR training_blocks.athlete_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Coaches can manage sets" ON sets;
CREATE POLICY "Coaches can manage sets" ON sets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sessions
      JOIN training_weeks ON training_weeks.id = sessions.week_id
      JOIN training_blocks ON training_blocks.id = training_weeks.block_id
      WHERE sessions.id = sets.session_id
      AND training_blocks.coach_id = auth.uid()
    )
  );
