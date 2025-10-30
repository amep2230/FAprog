-- ============================================
-- NOUVELLE ARCHITECTURE V2 avec préfixe v2_
-- Tables complètement nouvelles sans toucher aux anciennes
-- ============================================

-- ============================================
-- TABLE: v2_training_blocks
-- Blocs d'entraînement (cycles de plusieurs semaines)
-- ============================================
CREATE TABLE IF NOT EXISTS v2_training_blocks (
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

CREATE INDEX IF NOT EXISTS idx_v2_training_blocks_coach ON v2_training_blocks(coach_id);
CREATE INDEX IF NOT EXISTS idx_v2_training_blocks_athlete ON v2_training_blocks(athlete_id);
CREATE INDEX IF NOT EXISTS idx_v2_training_blocks_is_active ON v2_training_blocks(is_active);

-- ============================================
-- TABLE: v2_training_weeks
-- Semaines dans un bloc d'entraînement
-- ============================================
CREATE TABLE IF NOT EXISTS v2_training_weeks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  block_id UUID NOT NULL REFERENCES v2_training_blocks(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_v2_training_weeks_block ON v2_training_weeks(block_id);
CREATE INDEX IF NOT EXISTS idx_v2_training_weeks_week_number ON v2_training_weeks(week_number);

-- ============================================
-- TABLE: v2_sessions
-- Séances d'entraînement dans une semaine
-- ============================================
CREATE TABLE IF NOT EXISTS v2_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_id UUID NOT NULL REFERENCES v2_training_weeks(id) ON DELETE CASCADE,
  session_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_v2_sessions_week ON v2_sessions(week_id);
CREATE INDEX IF NOT EXISTS idx_v2_sessions_session_number ON v2_sessions(session_number);

-- ============================================
-- TABLE: v2_sets
-- Séries d'exercices dans une séance
-- ============================================
CREATE TABLE IF NOT EXISTS v2_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES v2_sessions(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  exercise_type TEXT DEFAULT 'main',
  set_number INTEGER NOT NULL,
  prescribed_reps INTEGER,
  prescribed_weight DECIMAL(5,2),
  prescribed_rpe DECIMAL(3,1),
  actual_reps INTEGER,
  actual_weight DECIMAL(5,2),
  actual_rpe DECIMAL(3,1),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_v2_sets_session ON v2_sets(session_id);
CREATE INDEX IF NOT EXISTS idx_v2_sets_set_number ON v2_sets(set_number);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Activer RLS sur v2_training_blocks
ALTER TABLE v2_training_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches can view their blocks" ON v2_training_blocks;
CREATE POLICY "Coaches can view their blocks" ON v2_training_blocks
  FOR SELECT USING (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Athletes can view their blocks" ON v2_training_blocks;
CREATE POLICY "Athletes can view their blocks" ON v2_training_blocks
  FOR SELECT USING (auth.uid() = athlete_id);

DROP POLICY IF EXISTS "Coaches can manage their blocks" ON v2_training_blocks;
CREATE POLICY "Coaches can manage their blocks" ON v2_training_blocks
  FOR ALL USING (auth.uid() = coach_id);

-- Activer RLS sur v2_training_weeks
ALTER TABLE v2_training_weeks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view weeks from their blocks" ON v2_training_weeks;
CREATE POLICY "Users can view weeks from their blocks" ON v2_training_weeks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM v2_training_blocks 
      WHERE v2_training_blocks.id = v2_training_weeks.block_id 
      AND (v2_training_blocks.coach_id = auth.uid() OR v2_training_blocks.athlete_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Coaches can manage weeks" ON v2_training_weeks;
CREATE POLICY "Coaches can manage weeks" ON v2_training_weeks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM v2_training_blocks 
      WHERE v2_training_blocks.id = v2_training_weeks.block_id 
      AND v2_training_blocks.coach_id = auth.uid()
    )
  );

-- Activer RLS sur v2_sessions
ALTER TABLE v2_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view sessions from their weeks" ON v2_sessions;
CREATE POLICY "Users can view sessions from their weeks" ON v2_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM v2_training_weeks 
      JOIN v2_training_blocks ON v2_training_blocks.id = v2_training_weeks.block_id
      WHERE v2_training_weeks.id = v2_sessions.week_id 
      AND (v2_training_blocks.coach_id = auth.uid() OR v2_training_blocks.athlete_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Coaches can manage sessions" ON v2_sessions;
CREATE POLICY "Coaches can manage sessions" ON v2_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM v2_training_weeks 
      JOIN v2_training_blocks ON v2_training_blocks.id = v2_training_weeks.block_id
      WHERE v2_training_weeks.id = v2_sessions.week_id 
      AND v2_training_blocks.coach_id = auth.uid()
    )
  );

-- Activer RLS sur v2_sets
ALTER TABLE v2_sets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view sets from their sessions" ON v2_sets;
CREATE POLICY "Users can view sets from their sessions" ON v2_sets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM v2_sessions 
      JOIN v2_training_weeks ON v2_training_weeks.id = v2_sessions.week_id
      JOIN v2_training_blocks ON v2_training_blocks.id = v2_training_weeks.block_id
      WHERE v2_sessions.id = v2_sets.session_id 
      AND (v2_training_blocks.coach_id = auth.uid() OR v2_training_blocks.athlete_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Coaches can manage sets" ON v2_sets;
CREATE POLICY "Coaches can manage sets" ON v2_sets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM v2_sessions 
      JOIN v2_training_weeks ON v2_training_weeks.id = v2_sessions.week_id
      JOIN v2_training_blocks ON v2_training_blocks.id = v2_training_weeks.block_id
      WHERE v2_sessions.id = v2_sets.session_id 
      AND v2_training_blocks.coach_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Athletes can update their actual values" ON v2_sets;
CREATE POLICY "Athletes can update their actual values" ON v2_sets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM v2_sessions 
      JOIN v2_training_weeks ON v2_training_weeks.id = v2_sessions.week_id
      JOIN v2_training_blocks ON v2_training_blocks.id = v2_training_weeks.block_id
      WHERE v2_sessions.id = v2_sets.session_id 
      AND v2_training_blocks.athlete_id = auth.uid()
    )
  );

-- ============================================
-- TRIGGERS
-- ============================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_v2_training_blocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_v2_training_blocks_updated_at_trigger ON v2_training_blocks;
CREATE TRIGGER update_v2_training_blocks_updated_at_trigger
  BEFORE UPDATE ON v2_training_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_v2_training_blocks_updated_at();

-- Fonction pour v2_training_weeks
CREATE OR REPLACE FUNCTION update_v2_training_weeks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_v2_training_weeks_updated_at_trigger ON v2_training_weeks;
CREATE TRIGGER update_v2_training_weeks_updated_at_trigger
  BEFORE UPDATE ON v2_training_weeks
  FOR EACH ROW
  EXECUTE FUNCTION update_v2_training_weeks_updated_at();

-- Fonction pour v2_sessions
CREATE OR REPLACE FUNCTION update_v2_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_v2_sessions_updated_at_trigger ON v2_sessions;
CREATE TRIGGER update_v2_sessions_updated_at_trigger
  BEFORE UPDATE ON v2_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_v2_sessions_updated_at();

-- Fonction pour v2_sets
CREATE OR REPLACE FUNCTION update_v2_sets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_v2_sets_updated_at_trigger ON v2_sets;
CREATE TRIGGER update_v2_sets_updated_at_trigger
  BEFORE UPDATE ON v2_sets
  FOR EACH ROW
  EXECUTE FUNCTION update_v2_sets_updated_at();
