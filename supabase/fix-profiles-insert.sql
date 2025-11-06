-- ============================================
-- CORRECTION: Ajouter la politique INSERT pour profiles
-- Cela corrige le problème "Erreur lors de la création du profil"
-- ============================================

-- Supprimer les anciennes politiques INSERT si elles existent
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable insert for new authenticated users" ON profiles;

-- Ajouter la politique INSERT correcte
-- Permet à un nouvel utilisateur authentifié d'insérer SON PROPRE profil
CREATE POLICY "Enable insert for new users" ON profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Note: Le trigger handle_new_user() avec SECURITY DEFINER bypasse cette politique
-- Cela signifie que la création automatique via le trigger fonctionnera toujours
-- Et cette politique permettra le fallback manuel si le trigger échoue

