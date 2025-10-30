-- ============================================
-- SCHEMA SQL POUR SUPABASE
-- Application de coaching powerlifting
-- ============================================

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: profiles
-- Stocke les informations utilisateur étendues
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('coach', 'athlete')),
  coach_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX idx_profiles_coach_id ON profiles(coach_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- ============================================
-- TABLE: exercises
-- Catalogue des exercices
-- ============================================
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_exercises_category ON exercises(category);

-- ============================================
-- TABLE: rpe_table
-- Table de référence RPE
-- ============================================
CREATE TABLE rpe_table (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reps INTEGER NOT NULL,
  rpe DECIMAL(3,1) NOT NULL,
  percentage_of_1rm DECIMAL(5,2) NOT NULL,
  UNIQUE(reps, rpe)
);

CREATE INDEX idx_rpe_table_lookup ON rpe_table(reps, rpe);

-- ============================================
-- TABLE: personal_records
-- Records personnels des athlètes
-- ============================================
CREATE TABLE personal_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  reps INTEGER NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  estimated_1rm DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(athlete_id, exercise_id, reps)
);

CREATE INDEX idx_pr_athlete ON personal_records(athlete_id);
CREATE INDEX idx_pr_exercise ON personal_records(exercise_id);

-- ============================================
-- TABLE: programs
-- Programmes d'entraînement
-- ============================================
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_programs_coach ON programs(coach_id);
CREATE INDEX idx_programs_athlete ON programs(athlete_id);

-- ============================================
-- TABLE: sessions
-- Séances d'entraînement dans un programme
-- ============================================
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sessions_program ON sessions(program_id);

-- ============================================
-- TABLE: sets
-- Séries d'exercices dans une séance
-- ============================================
CREATE TABLE sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  set_order INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  rpe DECIMAL(3,1) NOT NULL,
  prescribed_weight DECIMAL(5,2),
  instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sets_session ON sets(session_id);
CREATE INDEX idx_sets_exercise ON sets(exercise_id);

-- ============================================
-- TABLE: session_logs
-- Logs des séances effectuées par les athlètes
-- ============================================
CREATE TABLE session_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight DECIMAL(5,2),
  steps INTEGER,
  water TEXT,
  nutrition TEXT,
  sleep TEXT,
  form TEXT,
  motivation TEXT,
  stress TEXT,
  lower_pain TEXT,
  upper_pain TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_session_logs_athlete ON session_logs(athlete_id);
CREATE INDEX idx_session_logs_session ON session_logs(session_id);
CREATE INDEX idx_session_logs_date ON session_logs(date);

-- ============================================
-- TABLE: set_logs
-- Logs des séries effectuées
-- ============================================
CREATE TABLE set_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_log_id UUID NOT NULL REFERENCES session_logs(id) ON DELETE CASCADE,
  set_id UUID NOT NULL REFERENCES sets(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  actual_weight DECIMAL(5,2),
  actual_reps INTEGER,
  actual_rpe DECIMAL(3,1),
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_set_logs_session_log ON set_logs(session_log_id);
CREATE INDEX idx_set_logs_set ON set_logs(set_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE rpe_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE set_logs ENABLE ROW LEVEL SECURITY;

-- Policies pour profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Coaches can view their athletes" ON profiles
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'coach'
    ) AND coach_id = auth.uid()
  );

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policies pour exercises (lecture publique)
CREATE POLICY "Everyone can view exercises" ON exercises
  FOR SELECT USING (true);

CREATE POLICY "Only coaches can manage exercises" ON exercises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coach'
    )
  );

-- Policies pour rpe_table (lecture publique)
CREATE POLICY "Everyone can view RPE table" ON rpe_table
  FOR SELECT USING (true);

-- Policies pour personal_records
CREATE POLICY "Athletes can view their own PRs" ON personal_records
  FOR SELECT USING (athlete_id = auth.uid());

CREATE POLICY "Coaches can view their athletes' PRs" ON personal_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = personal_records.athlete_id 
      AND coach_id = auth.uid()
    )
  );

CREATE POLICY "Athletes and coaches can manage PRs" ON personal_records
  FOR ALL USING (
    athlete_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = personal_records.athlete_id 
      AND coach_id = auth.uid()
    )
  );

-- Policies pour programs
CREATE POLICY "Coaches can view their programs" ON programs
  FOR SELECT USING (coach_id = auth.uid());

CREATE POLICY "Athletes can view their programs" ON programs
  FOR SELECT USING (athlete_id = auth.uid());

CREATE POLICY "Coaches can manage their programs" ON programs
  FOR ALL USING (coach_id = auth.uid());

-- Policies pour sessions
CREATE POLICY "Users can view sessions from their programs" ON sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM programs 
      WHERE programs.id = sessions.program_id 
      AND (programs.coach_id = auth.uid() OR programs.athlete_id = auth.uid())
    )
  );

CREATE POLICY "Coaches can manage sessions" ON sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM programs 
      WHERE programs.id = sessions.program_id 
      AND programs.coach_id = auth.uid()
    )
  );

-- Policies pour sets
CREATE POLICY "Users can view sets from their sessions" ON sets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions 
      JOIN programs ON programs.id = sessions.program_id
      WHERE sessions.id = sets.session_id 
      AND (programs.coach_id = auth.uid() OR programs.athlete_id = auth.uid())
    )
  );

CREATE POLICY "Coaches can manage sets" ON sets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sessions 
      JOIN programs ON programs.id = sessions.program_id
      WHERE sessions.id = sets.session_id 
      AND programs.coach_id = auth.uid()
    )
  );

-- Policies pour session_logs
CREATE POLICY "Athletes can view their own logs" ON session_logs
  FOR SELECT USING (athlete_id = auth.uid());

CREATE POLICY "Coaches can view their athletes' logs" ON session_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = session_logs.athlete_id 
      AND coach_id = auth.uid()
    )
  );

CREATE POLICY "Athletes can manage their own logs" ON session_logs
  FOR ALL USING (athlete_id = auth.uid());

-- Policies pour set_logs
CREATE POLICY "Users can view set logs from their session logs" ON set_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM session_logs
      WHERE session_logs.id = set_logs.session_log_id
      AND (
        session_logs.athlete_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = session_logs.athlete_id 
          AND coach_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Athletes can manage their own set logs" ON set_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM session_logs
      WHERE session_logs.id = set_logs.session_log_id
      AND session_logs.athlete_id = auth.uid()
    )
  );

-- ============================================
-- FONCTIONS ET TRIGGERS
-- ============================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour programs
CREATE TRIGGER update_programs_updated_at
  BEFORE UPDATE ON programs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour créer le profil automatiquement lors de l'inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Utilisateur'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'athlete')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer le profil
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
