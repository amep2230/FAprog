-- ============================================
-- CORRECTION COMPLÈTE DES POLITIQUES RLS
-- Solution pour: "new row violates row-level security policy"
-- ============================================

-- ÉTAPE 1 : Supprimer TOUTES les politiques conflictuelles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Coaches can view their athletes" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Coaches can view athletes profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Athletes can update their coach" ON profiles;
DROP POLICY IF EXISTS "Enable insert for new users" ON profiles;

-- ÉTAPE 2 : Créer les politiques correctes et simples

-- 1. POLITIQUE INSERT : Permettre à un nouvel utilisateur d'insérer SON PROPRE profil
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- 2. POLITIQUE SELECT : Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT 
  USING (auth.uid() = id);

-- 3. POLITIQUE SELECT : Les coachs peuvent voir leurs athlètes
-- SANS sous-requête récursive (évite le problème de RLS)
CREATE POLICY "profiles_select_athletes_of_coach" ON profiles
  FOR SELECT 
  USING (coach_id = auth.uid());

-- 4. POLITIQUE UPDATE : Les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ÉTAPE 3 : Vérifier que les politiques ont été créées
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
