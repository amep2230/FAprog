# 🔧 Guide d'installation SQL - Supabase

## ⚠️ IMPORTANT - À exécuter dans cet ordre exact

Allez sur votre **Supabase Dashboard** : https://doiheofprwqdibkrqjiw.supabase.co

Puis cliquez sur **SQL Editor** dans le menu de gauche.

---

## Étape 1️⃣ : Corriger les politiques RLS

**Fichier** : `supabase/fix-rls.sql`

**Ce que ça fait** :
- Supprime les anciennes politiques RLS qui causaient la récursion infinie
- Crée de nouvelles politiques simplifiées sans récursion

**Instructions** :
1. SQL Editor → New Query
2. Copiez tout le contenu de `supabase/fix-rls.sql`
3. Cliquez sur **Run** (ou Ctrl+Enter)
4. Vous devriez voir : `Success. No rows returned`

---

## Étape 2️⃣ : Corriger le trigger de création de profil

**Fichier** : `supabase/fix-trigger.sql`

**Ce que ça fait** :
- Supprime l'ancien trigger qui ne fonctionne pas bien
- Crée un nouveau trigger avec `SECURITY DEFINER` qui bypass RLS
- Assure que chaque nouvel utilisateur a automatiquement un profil

**Instructions** :
1. SQL Editor → New Query
2. Copiez tout le contenu de `supabase/fix-trigger.sql`
3. Cliquez sur **Run**
4. Vous devriez voir le trigger listé dans les résultats

---

## Étape 3️⃣ : Créer la fonction pour ajouter des athlètes

**Fichier** : `supabase/create-athlete-function.sql`

**Ce que ça fait** :
- Crée une fonction SQL qui peut insérer dans `profiles` malgré RLS
- Permet aux coachs d'ajouter des athlètes via l'interface

**Instructions** :
1. SQL Editor → New Query
2. Copiez tout le contenu de `supabase/create-athlete-function.sql`
3. Cliquez sur **Run**
4. Vous devriez voir : `Success. No rows returned`

---

## Étape 4️⃣ : Créer les profils manquants (optionnel)

**Fichier** : `supabase/create-missing-profiles.sql`

**Ce que ça fait** :
- Crée automatiquement les profils pour tous les utilisateurs qui n'en ont pas encore
- Affiche la liste de tous les profils existants

**Instructions** :
1. SQL Editor → New Query
2. Copiez tout le contenu de `supabase/create-missing-profiles.sql`
3. Cliquez sur **Run**
4. Vous verrez la liste des profils créés/existants

---

## ✅ Vérification

Après avoir exécuté tous les scripts, vérifiez :

### Dans Table Editor → profiles → RLS Policies

Vous devriez voir ces politiques :
- ✅ `Enable insert for authenticated users only`
- ✅ `Users can view own profile`
- ✅ `Coaches can view athletes profiles`
- ✅ `Users can update own profile`
- ✅ `Athletes can update their coach`

### Dans Database → Functions

Vous devriez voir :
- ✅ `handle_new_user` - Trigger de création de profil
- ✅ `create_athlete_profile` - Fonction pour ajouter des athlètes

### Dans Database → Triggers

Vous devriez voir :
- ✅ `on_auth_user_created` sur la table `auth.users`

---

## 🧪 Test

Après avoir tout exécuté :

1. **Créez un nouveau compte coach**
   - Allez sur http://localhost:3002/login
   - Créez un compte avec le rôle "Coach"

2. **Connectez-vous**
   - Le profil devrait être créé automatiquement
   - Vous êtes redirigé vers `/dashboard/coach`

3. **Ajoutez un athlète**
   - Cliquez sur "Ajouter un athlète"
   - Remplissez le formulaire
   - L'athlète devrait apparaître dans la liste

---

## ❌ En cas de problème

### "policy already exists"
- C'est normal, le script DROP supprime d'abord les anciennes
- Ignorez cette erreur et continuez

### "function already exists"
- Utilisez `CREATE OR REPLACE FUNCTION` (déjà dans les scripts)
- Ou supprimez manuellement dans Database → Functions

### "trigger already exists"
- Supprimez d'abord : `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;`
- Puis réexécutez le script

### Les profils ne se créent toujours pas
- Vérifiez dans Table Editor → profiles que RLS est activé
- Vérifiez que les politiques sont bien créées
- Essayez d'exécuter `create-missing-profiles.sql` pour voir si ça fonctionne manuellement

---

## 📞 Support

Si après avoir tout exécuté vous avez toujours des erreurs, donnez-moi :
1. Le message d'erreur exact
2. Le résultat de l'exécution de chaque script SQL
3. Les logs du terminal Next.js
