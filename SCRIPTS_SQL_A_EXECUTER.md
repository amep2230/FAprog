# 🛠️ Scripts SQL à exécuter dans Supabase

## ⚠️ IMPORTANT - À faire maintenant

Pour que toutes les fonctionnalités fonctionnent, vous devez exécuter ces scripts SQL dans l'ordre :

---

## 1️⃣ Ajouter la colonne `completed_at` (REQUIS pour logging)

**Fichier** : `supabase/add-completed-at.sql`

**Pourquoi** : La table `session_logs` a besoin d'une colonne pour stocker la date de complétion.

**Comment** :
1. Aller sur [https://doiheofprwqdibkrqjiw.supabase.co](https://doiheofprwqdibkrqjiw.supabase.co)
2. Cliquer sur "SQL Editor" dans la sidebar
3. Copier-coller le contenu de `supabase/add-completed-at.sql`
4. Cliquer sur "Run" (ou Cmd/Ctrl + Enter)
5. Vérifier que vous voyez "Success. No rows returned"

---

## 2️⃣ Ajouter les colonnes `date` et `notes` à personal_records (REQUIS pour PRs)

**Fichier** : `supabase/add-pr-columns.sql`

**Pourquoi** : La table `personal_records` a besoin de colonnes pour la date du PR et les notes.

**Comment** :
1. Aller sur [https://doiheofprwqdibkrqjiw.supabase.co](https://doiheofprwqdibkrqjiw.supabase.co)
2. Cliquer sur "SQL Editor"
3. Copier-coller le contenu de `supabase/add-pr-columns.sql`
4. Cliquer sur "Run"
5. Vérifier "Success"

**Détails** : Voir `FIX_PR_COLUMNS.md` pour plus d'informations.

---

## 3️⃣ Activer la détection automatique des PRs (REQUIS pour auto-PRs)

**Fichier** : `supabase/auto-detect-prs.sql`

**Pourquoi** : Permet de détecter et enregistrer automatiquement les PRs lors du logging des séances.

**Comment** :
1. Aller sur [https://doiheofprwqdibkrqjiw.supabase.co](https://doiheofprwqdibkrqjiw.supabase.co)
2. Cliquer sur "SQL Editor"
3. Copier-coller le contenu de `supabase/auto-detect-prs.sql`
4. Cliquer sur "Run"
5. Vérifier "Success"

**Fonctionnalité** :
- 🤖 Détecte automatiquement les PRs pendant le logging
- 📊 Calcule le 1RM avec la formule Epley
- 🏆 Affiche une notification immédiate à l'athlète
- ✅ Aucune saisie manuelle requise !

**Détails** : Voir `AUTO_PR_DETECTION.md` pour plus d'informations.

---

## 4️⃣ Corriger les RLS (si pas déjà fait)

**Fichier** : `supabase/fix-rls.sql`

**Pourquoi** : Éviter les boucles infinies dans les Row Level Security policies.

**Statut** : Probablement déjà fait, mais on peut re-exécuter (c'est idempotent).

---

## 3️⃣ Fonction de création d'athlète (si pas déjà fait)

**Fichier** : `supabase/create-athlete-function.sql`

**Pourquoi** : Permet aux coachs d'ajouter des athlètes sans problèmes de permissions.

**Statut** : Probablement déjà fait.

---

## 4️⃣ Trigger pour les profils (si pas déjà fait)

**Fichier** : `supabase/fix-trigger.sql`

**Pourquoi** : Création automatique du profil lors de l'inscription.

**Statut** : Probablement déjà fait.

---

## ✅ Vérification

Après avoir exécuté `add-completed-at.sql`, vous pouvez vérifier que la colonne existe :

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'session_logs' 
AND column_name = 'completed_at';
```

Vous devriez voir :
```
column_name   | data_type
--------------|--------------------------
completed_at  | timestamp with time zone
```

---

## 🎯 Après l'exécution

Une fois le script exécuté :

1. Retournez sur l'application
2. Allez dans un programme en tant qu'athlète
3. Cliquez sur "Logger la séance"
4. Remplissez le formulaire
5. Cliquez sur "Enregistrer"

✅ **Ça devrait maintenant fonctionner !**

L'erreur `Could not find the 'completed_at' column` devrait disparaître.

---

## 📊 Vérifier les données après logging

```sql
-- Voir tous les session_logs
SELECT * FROM session_logs ORDER BY completed_at DESC;

-- Voir tous les set_logs
SELECT sl.*, s.exercise_id, e.name as exercise_name
FROM set_logs sl
JOIN sets s ON sl.set_id = s.id
JOIN exercises e ON s.exercise_id = e.id
ORDER BY sl.created_at DESC;
```

---

## 🚨 En cas de problème

Si après avoir exécuté le script vous avez toujours des erreurs :

1. **Vider le cache Supabase** :
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```

2. **Redémarrer le serveur Next.js** :
   - Dans le terminal, faire Ctrl+C
   - Puis `npm run dev`

3. **Vider le cache du navigateur** :
   - Cmd/Ctrl + Shift + R (hard refresh)
