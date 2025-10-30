-- ============================================
-- CORRECTION DU TRIGGER DE CRÉATION DE PROFIL
-- ============================================

-- 1. Supprimer l'ancien trigger et la fonction
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Créer une nouvelle fonction avec SECURITY DEFINER
-- Cela permet de bypasser les politiques RLS lors de la création du profil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER -- Important : exécute avec les privilèges du créateur
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Utilisateur'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'athlete')
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log l'erreur mais ne fait pas échouer la création de l'utilisateur
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- 3. Créer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Vérifier que le trigger existe
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
