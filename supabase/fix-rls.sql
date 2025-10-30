-- ============================================
-- CORRECTION DES POLITIQUES RLS
-- Correction de la récursion infinie
-- ============================================

-- Supprimer TOUTES les anciennes politiques pour profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Coaches can view their athletes" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Coaches can view athletes profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Athletes can update their coach" ON profiles;

-- Nouvelle politique simplifiée pour INSERT (création de profil)
CREATE POLICY "Enable insert for authenticated users only" ON profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Politique pour SELECT (lecture)
-- Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT 
  USING (auth.uid() = id);

-- Les coachs peuvent voir les profils qui ont leur coach_id
CREATE POLICY "Coaches can view athletes profiles" ON profiles
  FOR SELECT 
  USING (
    coach_id = auth.uid()
  );

-- Politique pour UPDATE (modification)
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Politique pour permettre aux athlètes de choisir leur coach
CREATE POLICY "Athletes can update their coach" ON profiles
  FOR UPDATE 
  USING (auth.uid() = id AND role = 'athlete')
  WITH CHECK (auth.uid() = id AND role = 'athlete');
