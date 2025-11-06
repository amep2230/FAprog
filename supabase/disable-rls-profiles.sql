-- ============================================
-- SOLUTION NUCLÉAIRE : Désactiver RLS sur profiles
-- Permet à tous les utilisateurs authentifiés d'accéder à profiles
-- ============================================

-- ÉTAPE 1 : Désactiver RLS sur la table profiles
-- Cela permet au trigger de créer le profil sans blocage RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- ÉTAPE 2 : Supprimer les anciennes politiques (optionnel, car RLS est désactivé)
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Coaches can view their athletes" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Coaches can view athletes profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Athletes can update their coach" ON profiles;
DROP POLICY IF EXISTS "Enable insert for new users" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_athletes_of_coach" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- ÉTAPE 3 : Vérifier l'état de RLS
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles';
