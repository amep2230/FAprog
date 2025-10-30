# ⚠️ ERREUR RÉSOLU - Table training_blocks manquante

## 🔴 Problème

```
Could not find the table 'public.training_blocks' in the schema cache
```

## ✅ Solution

Vous devez **exécuter le script SQL** pour créer la table `training_blocks`.

## 📋 Instructions (2 minutes)

### Étape 1 : Ouvrir Supabase

1. Aller sur https://supabase.com/dashboard
2. Sélectionner votre projet
3. Cliquer sur **SQL Editor** dans le menu de gauche (icône ⚡)

### Étape 2 : Exécuter le Script

1. Cliquer sur **"New query"** (en haut à droite)
2. Ouvrir le fichier : **`supabase/add-training-blocks.sql`** (dans votre projet)
3. **Copier TOUT le contenu** du fichier
4. **Coller** dans l'éditeur SQL de Supabase
5. Cliquer sur **"Run"** (ou appuyer sur Ctrl+Enter / Cmd+Enter)

### Étape 3 : Vérifier

Vous devriez voir :
```
✅ Success. No rows returned
```

### Étape 4 : Vérifier la Table

1. Aller dans **Table Editor** (menu de gauche)
2. Vous devriez maintenant voir :
   - ✅ `training_blocks` (nouvelle table)
3. Cliquer sur `programs` et vérifier :
   - ✅ Nouvelle colonne `block_id`

### Étape 5 : Réessayer

1. Retourner sur votre application (localhost:3000)
2. Rafraîchir la page (F5)
3. Essayer de créer un nouveau bloc
4. ✅ Ça devrait fonctionner maintenant !

---

## 📄 Contenu du Script SQL

Le fichier se trouve ici : **`supabase/add-training-blocks.sql`**

Il contient :
- Création de la table `training_blocks`
- Ajout de la colonne `block_id` à `programs`
- Policies RLS pour la sécurité
- Index pour les performances
- Triggers pour `updated_at`

---

## 🐛 Si l'Erreur Persiste

### Vérification 1 : La table existe-t-elle ?

Dans Supabase → Table Editor :
- La table `training_blocks` apparaît ? ✅ / ❌
- La table `programs` a une colonne `block_id` ? ✅ / ❌

### Vérification 2 : RLS activé ?

Dans Supabase → Table Editor → `training_blocks` → Configuration :
- Row Level Security : **Enabled** ✅

### Vérification 3 : Policies créées ?

Dans Supabase → Authentication → Policies :
- `training_blocks` devrait avoir 3 policies :
  - `Coaches can view their blocks`
  - `Athletes can view their blocks`
  - `Coaches can manage their blocks`

### Si rien ne fonctionne

1. **Vider le cache** : 
   - Navigateur : Ctrl+Shift+R (ou Cmd+Shift+R sur Mac)
   - VS Code : Supprimer le dossier `.next` et relancer `npm run dev`

2. **Vérifier les logs Supabase** :
   - Supabase Dashboard → Logs → Postgres Logs
   - Chercher des erreurs

3. **Réexécuter le script** :
   - Le script utilise `CREATE TABLE IF NOT EXISTS`
   - Safe de le relancer plusieurs fois

---

## 📞 Besoin d'Aide ?

Si le problème persiste après ces étapes :

1. Vérifier la console du navigateur (F12) pour d'autres erreurs
2. Vérifier les logs du terminal où tourne `npm run dev`
3. Consulter `BLOCKS_QUICK_INSTALL.md` pour l'installation complète

---

**Résumé** : Exécutez simplement le fichier `supabase/add-training-blocks.sql` dans le SQL Editor de Supabase ! 🚀
