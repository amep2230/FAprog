-- ============================================
-- FONCTION POUR CRÉER UN PROFIL D'ATHLÈTE
-- Avec SECURITY DEFINER pour bypasser RLS
-- ============================================

-- Créer une fonction qui peut insérer dans profiles malgré RLS
CREATE OR REPLACE FUNCTION public.create_athlete_profile(
  athlete_id UUID,
  athlete_name TEXT,
  athlete_email TEXT,
  coach_id UUID
)
RETURNS json
SECURITY DEFINER -- Exécute avec les privilèges du créateur (admin)
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
BEGIN
  -- Insérer le profil
  INSERT INTO public.profiles (id, name, email, role, coach_id)
  VALUES (athlete_id, athlete_name, athlete_email, 'athlete', coach_id)
  ON CONFLICT (id) DO UPDATE
  SET coach_id = EXCLUDED.coach_id
  RETURNING json_build_object(
    'id', profiles.id,
    'name', profiles.name,
    'email', profiles.email,
    'role', profiles.role,
    'coach_id', profiles.coach_id
  ) INTO result;
  
  RETURN result;
EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Erreur création profil: %', SQLERRM;
END;
$$;

-- Donner les permissions d'exécution à tous les utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION public.create_athlete_profile TO authenticated;
