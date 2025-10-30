-- ============================================
-- CRÉER LES PROFILS MANQUANTS
-- Pour les utilisateurs qui existent déjà sans profil
-- ============================================

-- Créer les profils pour tous les utilisateurs qui n'en ont pas encore
INSERT INTO public.profiles (id, name, email, role)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'name', 'Utilisateur'),
  au.email,
  COALESCE(au.raw_user_meta_data->>'role', 'athlete')
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Vérifier les profils créés
SELECT 
  p.id,
  p.name,
  p.email,
  p.role,
  p.created_at
FROM public.profiles p
ORDER BY p.created_at DESC;
