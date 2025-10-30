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
