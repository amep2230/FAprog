VOUS POUVEZ UTILISER MON DÉPANNAGE, VOICI LES INSTRUCTIONS POUR CORRIGER L'ERREUR D'INSCRIPTION

# 🔧 Correction : "Erreur lors de la création du profil"

## Problème identifié
Quand vous créez un compte, vous recevez le message : **"Une erreur est survenue lors de la création du profil"**

### Cause racine
La table `profiles` de Supabase manque d'une **politique RLS (Row Level Security)** pour les insertions (`INSERT`). Cela bloque la création du profil utilisateur, même avec le fallback.

## ✅ Solution

### Étape 1 : Exécuter le script SQL de correction

1. Accédez à votre **Console Supabase** : https://app.supabase.com
2. Allez dans **SQL Editor**
3. Créez une **nouvelle requête**
4. Copiez-collez le contenu du fichier : `supabase/fix-profiles-insert.sql`
5. Cliquez sur **Run** (ou Exécuter)

**Le script exécutera :**
```sql
-- Supprimer les anciennes politiques conflictuelles
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable insert for new authenticated users" ON profiles;

-- Ajouter la nouvelle politique permettant les insertions
CREATE POLICY "Enable insert for new users" ON profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = id);
```

### Étape 2 : Vérifier les logs Supabase

Si le problème persiste, vérifiez la **configuration de la table profiles** :

1. Dans Supabase, allez à **Tables > profiles**
2. Vérifiez que **RLS est activé** (vous devriez voir "RLS enabled" avec un bouton bascule vert)
3. Vérifiez les **Policies** - il devrait y avoir au minimum :
   - ✅ "Enable insert for new users" (INSERT)
   - ✅ "Users can view own profile" (SELECT)
   - ✅ "Users can update own profile" (UPDATE)

### Étape 3 : Vérifier le Trigger

1. Dans Supabase, allez à **Extensions > SQL Editor > Triggers**
2. Recherchez le trigger `on_auth_user_created`
3. Il devrait exécuter la fonction `handle_new_user()` qui crée automatiquement le profil

Si le trigger n'existe pas ou est désactivé, exécutez `supabase/fix-trigger.sql`

## 📝 Améliorations apportées au code

Le fichier `src/app/login/actions.ts` a été amélioré avec :

✅ **Meilleure gestion d'erreurs** - Messages d'erreur plus détaillés
✅ **Validation des données** - Vérification avant d'envoyer à Supabase
✅ **Logging amélioré** - Console.log pour déboguer
✅ **Délai d'attente** - Laisse le temps au trigger de s'exécuter
✅ **Horodatage** - Ajoute les timestamps lors de la création manuelle du profil

## 🧪 Test de la correction

1. Allez à http://localhost:3000/login
2. Cliquez sur **"Créer un compte"**
3. Remplissez le formulaire :
   - Nom : "Test User"
   - Email : "test@example.com"
   - Mot de passe : "123456"
   - Rôle : "Athlète" ou "Coach"
4. Cliquez sur **Créer un compte**

**Résultat attendu :**
- ✅ Le compte est créé
- ✅ Vous êtes redirigé vers la page d'accueil OU vous voyez "Compte créé ! Vérifiez vos emails"
- ❌ Plus de message "Erreur lors de la création du profil"

## 🔍 Dépannage supplémentaire

### Cas 1 : Le problème persiste
- Videz le cache du navigateur (Cmd+Shift+Delete sur Mac)
- Rechargez la page (Cmd+R)
- Essayez avec une nouvelle adresse email

### Cas 2 : Erreur dans les logs Supabase
- Dans Supabase, allez à **Logs** (en bas à gauche)
- Recherchez les erreurs liées à `profiles` ou `handle_new_user`
- Cela vous donnera l'erreur SQL exacte

### Cas 3 : Le trigger s'exécute mais échoue
- Vérifiez que la colonne `profiles.role` peut accepter les valeurs "coach" et "athlete"
- Vérifiez que vous n'avez pas de contrainte UNIQUE dupliquée sur `email`

## 📞 Besoin d'aide supplémentaire ?

Si l'erreur persiste après avoir suivi ces étapes :
1. Partagez les logs de Supabase (Logs section)
2. Vérifiez la console du navigateur (F12 > Console)
3. Cherchez le message d'erreur exact dans la console
