-- ============================================
-- RECONFIGURATION COMPLÈTE DE LA BASE DE DONNÉES
-- Architecture: Blocs → Semaines → Séances
-- ============================================

-- ============================================
-- 1. CRÉER LES NOUVELLES TABLES
-- ============================================

-- Table: training_blocks
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

-- Table: training_weeks
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

-- ============================================
-- 2. MIGRER LES TABLES EXISTANTES
-- ============================================

DO $$ 
BEGIN
  -- SESSIONS: Ajouter les nouvelles colonnes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'week_id'
  ) THEN
    ALTER TABLE sessions ADD COLUMN week_id UUID REFERENCES training_weeks(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_sessions_week ON sessions(week_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'session_number'
  ) THEN
    ALTER TABLE sessions ADD COLUMN session_number INTEGER;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'notes'
  ) THEN
    ALTER TABLE sessions ADD COLUMN notes TEXT;
  END IF;

  -- SESSIONS: Rendre les anciennes colonnes nullables
  BEGIN
    ALTER TABLE sessions ALTER COLUMN program_id DROP NOT NULL;
  EXCEPTION
    WHEN others THEN NULL;
  END;

  BEGIN
    ALTER TABLE sessions ALTER COLUMN day_of_week DROP NOT NULL;
  EXCEPTION
    WHEN others THEN NULL;
  END;

  -- SETS: Ajouter les nouvelles colonnes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sets' AND column_name = 'exercise_name'
  ) THEN
    ALTER TABLE sets ADD COLUMN exercise_name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sets' AND column_name = 'exercise_type'
  ) THEN
    ALTER TABLE sets ADD COLUMN exercise_type TEXT DEFAULT 'main';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sets' AND column_name = 'set_number'
  ) THEN
    ALTER TABLE sets ADD COLUMN set_number INTEGER;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sets' AND column_name = 'prescribed_reps'
  ) THEN
    ALTER TABLE sets ADD COLUMN prescribed_reps INTEGER;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sets' AND column_name = 'prescribed_weight'
  ) THEN
    ALTER TABLE sets ADD COLUMN prescribed_weight DECIMAL(5,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sets' AND column_name = 'prescribed_rpe'
  ) THEN
    ALTER TABLE sets ADD COLUMN prescribed_rpe DECIMAL(3,1);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sets' AND column_name = 'actual_reps'
  ) THEN
    ALTER TABLE sets ADD COLUMN actual_reps INTEGER;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sets' AND column_name = 'actual_weight'
  ) THEN
    ALTER TABLE sets ADD COLUMN actual_weight DECIMAL(5,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sets' AND column_name = 'actual_rpe'
  ) THEN
    ALTER TABLE sets ADD COLUMN actual_rpe DECIMAL(3,1);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sets' AND column_name = 'notes'
  ) THEN
    ALTER TABLE sets ADD COLUMN notes TEXT;
  END IF;

  -- SETS: Rendre les anciennes colonnes nullables
  BEGIN
    ALTER TABLE sets ALTER COLUMN exercise_id DROP NOT NULL;
  EXCEPTION
    WHEN others THEN NULL;
  END;

  BEGIN
    ALTER TABLE sets ALTER COLUMN set_order DROP NOT NULL;
  EXCEPTION
    WHEN others THEN NULL;
  END;

  BEGIN
    ALTER TABLE sets ALTER COLUMN reps DROP NOT NULL;
  EXCEPTION
    WHEN others THEN NULL;
  END;

END $$;

-- ============================================
-- 3. ACTIVER ROW LEVEL SECURITY
-- ============================================

ALTER TABLE training_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. POLICIES RLS - TRAINING_BLOCKS
-- ============================================

DROP POLICY IF EXISTS "Coaches can view their blocks" ON training_blocks;
CREATE POLICY "Coaches can view their blocks" ON training_blocks
  FOR SELECT USING (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Athletes can view their blocks" ON training_blocks;
CREATE POLICY "Athletes can view their blocks" ON training_blocks
  FOR SELECT USING (auth.uid() = athlete_id);

DROP POLICY IF EXISTS "Coaches can manage their blocks" ON training_blocks;
CREATE POLICY "Coaches can manage their blocks" ON training_blocks
  FOR ALL USING (auth.uid() = coach_id);

-- ============================================
-- 5. POLICIES RLS - TRAINING_WEEKS
-- ============================================

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

-- ============================================
-- 6. POLICIES RLS - SESSIONS
-- ============================================

DROP POLICY IF EXISTS "Users can view sessions from their weeks" ON sessions;
CREATE POLICY "Users can view sessions from their weeks" ON sessions
  FOR SELECT USING (
    -- Nouvelle structure (week_id)
    (week_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM training_weeks
      JOIN training_blocks ON training_blocks.id = training_weeks.block_id
      WHERE training_weeks.id = sessions.week_id
      AND (training_blocks.coach_id = auth.uid() OR training_blocks.athlete_id = auth.uid())
    ))
    OR
    -- Ancienne structure (program_id) - pour compatibilité
    (program_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM programs
      WHERE programs.id = sessions.program_id
      AND (programs.coach_id = auth.uid() OR programs.athlete_id = auth.uid())
    ))
  );

DROP POLICY IF EXISTS "Coaches can manage sessions" ON sessions;
CREATE POLICY "Coaches can manage sessions" ON sessions
  FOR ALL USING (
    -- Nouvelle structure (week_id)
    (week_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM training_weeks
      JOIN training_blocks ON training_blocks.id = training_weeks.block_id
      WHERE training_weeks.id = sessions.week_id
      AND training_blocks.coach_id = auth.uid()
    ))
    OR
    -- Ancienne structure (program_id) - pour compatibilité
    (program_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM programs
      WHERE programs.id = sessions.program_id
      AND programs.coach_id = auth.uid()
    ))
  );

-- ============================================
-- 7. POLICIES RLS - SETS
-- ============================================

DROP POLICY IF EXISTS "Users can view sets from their sessions" ON sets;
CREATE POLICY "Users can view sets from their sessions" ON sets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions
      LEFT JOIN training_weeks ON training_weeks.id = sessions.week_id
      LEFT JOIN training_blocks ON training_blocks.id = training_weeks.block_id
      LEFT JOIN programs ON programs.id = sessions.program_id
      WHERE sessions.id = sets.session_id
      AND (
        training_blocks.coach_id = auth.uid() 
        OR training_blocks.athlete_id = auth.uid()
        OR programs.coach_id = auth.uid()
        OR programs.athlete_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Coaches can manage sets" ON sets;
CREATE POLICY "Coaches can manage sets" ON sets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sessions
      LEFT JOIN training_weeks ON training_weeks.id = sessions.week_id
      LEFT JOIN training_blocks ON training_blocks.id = training_weeks.block_id
      LEFT JOIN programs ON programs.id = sessions.program_id
      WHERE sessions.id = sets.session_id
      AND (
        training_blocks.coach_id = auth.uid()
        OR programs.coach_id = auth.uid()
      )
    )
  );

-- ============================================
-- 8. TRIGGERS POUR UPDATED_AT
-- ============================================

-- Fonction pour training_blocks
CREATE OR REPLACE FUNCTION update_training_blocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_training_blocks_updated_at_trigger ON training_blocks;
CREATE TRIGGER update_training_blocks_updated_at_trigger
  BEFORE UPDATE ON training_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_training_blocks_updated_at();

-- Fonction pour training_weeks
CREATE OR REPLACE FUNCTION update_training_weeks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_training_weeks_updated_at_trigger ON training_weeks;
CREATE TRIGGER update_training_weeks_updated_at_trigger
  BEFORE UPDATE ON training_weeks
  FOR EACH ROW
  EXECUTE FUNCTION update_training_weeks_updated_at();

-- ============================================
-- RECONFIGURATION TERMINÉE ✅
-- ============================================
-- Votre base de données est maintenant configurée pour :
-- - Architecture: Blocs → Semaines → Séances
-- - Compatibilité: Anciennes données (programs) toujours accessibles
-- - Sécurité: Row Level Security configuré
-- ============================================
