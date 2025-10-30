# 🔧 Correction de la récursion RLS

## Problème identifié

```
Error fetching profile: {
  code: '42P17',
  message: 'infinite recursion detected in policy for relation "profiles"'
}
```

La politique RLS `"Coaches can view their athletes"` créait une récursion infinie car elle interrogeait la table `profiles` depuis une politique de `profiles`.

## Solution

### Étape 1: Exécuter le script de correction

1. Allez sur **Supabase Dashboard** : https://doiheofprwqdibkrqjiw.supabase.co
2. Cliquez sur **SQL Editor** dans le menu de gauche
3. Cliquez sur **New Query**
4. Copiez-collez le contenu du fichier `supabase/fix-rls.sql`
5. Cliquez sur **Run** (ou appuyez sur Ctrl+Enter)

### Étape 2: Vérifier les politiques

Après avoir exécuté le script, vérifiez dans **Table Editor → profiles → RLS policies** que vous avez :

- ✅ `Enable insert for authenticated users only` - Pour l'insertion (création de profil)
- ✅ `Users can view own profile` - Les utilisateurs voient leur profil
- ✅ `Coaches can view athletes profiles` - Les coachs voient leurs athlètes (SANS récursion)
- ✅ `Users can update own profile` - Les utilisateurs modifient leur profil
- ✅ `Athletes can update their coach` - Les athlètes peuvent choisir leur coach

### Étape 3: Tester

1. Attendez 60 secondes (rate limit Supabase)
2. Créez un nouveau compte sur http://localhost:3002/login
3. Vous devriez être redirigé vers le dashboard approprié sans erreur

## Explication technique

### Avant (❌ Récursion infinie)
```sql
CREATE POLICY "Coaches can view their athletes" ON profiles
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'coach'  -- ⚠️ RÉCURSION!
    ) AND coach_id = auth.uid()
  );
```

### Après (✅ Pas de récursion)
```sql
CREATE POLICY "Coaches can view athletes profiles" ON profiles
  FOR SELECT USING (
    coach_id = auth.uid()  -- Simple comparaison, pas de sous-requête
  );
```

La nouvelle politique se contente de vérifier si `coach_id` correspond à l'utilisateur connecté, sans interroger à nouveau la table `profiles`.
