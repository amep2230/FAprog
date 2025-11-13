// Types de base pour l'application

export type UserRole = "coach" | "athlete";

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  coach_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  category: string;
  created_at: string;
}

export interface RpeTable {
  id: string;
  reps: number;
  rpe: number;
  percentage_of_1rm: number;
}

export interface PersonalRecord {
  id: string;
  athlete_id: string;
  exercise_id: string;
  reps: number;
  weight: number;
  estimated_1rm: number;
  created_at: string;
}

export interface Program {
  id: string;
  coach_id: string;
  athlete_id: string;
  week_number: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  program_id: string;
  day_of_week: number;
  name: string;
  created_at: string;
}

export interface Set {
  id: string;
  session_id: string;
  exercise_id: string;
  set_order: number;
  reps: number;
  rpe: number;
  prescribed_weight?: number | null;
  instructions?: string | null;
  created_at: string;
}

export interface SessionLog {
  id: string;
  athlete_id: string;
  session_id: string;
  date: string;
  weight?: number | null;
  steps?: number | null;
  water?: string | null;
  nutrition?: string | null;
  sleep?: string | null;
  form?: string | null;
  motivation?: string | null;
  stress?: string | null;
  lower_pain?: string | null;
  upper_pain?: string | null;
  created_at: string;
}

export interface SetLog {
  id: string;
  session_log_id: string;
  set_id: string;
  completed: boolean;
  actual_weight?: number | null;
  actual_reps?: number | null;
  actual_rpe?: number | null;
  comments?: string | null;
  created_at: string;
}

// Types avec relations pour les vues
export interface ProgramWithDetails extends Program {
  athlete: Profile;
  sessions: SessionWithSets[];
}

export interface SessionWithSets extends Session {
  sets: SetWithExercise[];
}

export interface SetWithExercise extends Set {
  exercise: Exercise;
}

export interface SessionLogWithSets extends SessionLog {
  session: SessionWithSets;
  set_logs: SetLogWithSet[];
}

export interface SetLogWithSet extends SetLog {
  set: SetWithExercise;
}

// Types pour les blocs d'entraînement
export interface TrainingBlock {
  id: string;
  coach_id: string;
  athlete_id: string;
  name: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active: boolean;
  block_type: 'force' | 'general';
  rpe_increment_low?: number; // Incrément RPE si RPE < rpe_threshold (par défaut 1.0)
  rpe_increment_high?: number; // Incrément RPE si RPE >= rpe_threshold (par défaut 0.5)
  rpe_threshold?: number; // Seuil pour choisir l'incrément RPE (par défaut 6.0)
  created_at: string;
  updated_at: string;
  weeks?: TrainingWeek[];
}

export interface TrainingWeek {
  id: string;
  block_id: string;
  week_number: number;
  name: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  block?: Partial<TrainingBlock>;
  sessions?: TrainingSession[];
}

export interface TrainingSession {
  id: string;
  week_id: string;
  session_number: number;
  name: string;
  notes?: string | null;
  created_at: string;
  sets?: TrainingSet[];
}

export interface TrainingSet {
  id: string;
  session_id: string;
  exercise_name: string;
  exercise_type: string; // 'main', 'accessory', etc.
  set_number: number;
  reps?: number | null;
  weight?: number | null;
  rpe?: number | null;
  rest_seconds?: number | null;
  notes?: string | null;
  tempo?: string | null;
}
