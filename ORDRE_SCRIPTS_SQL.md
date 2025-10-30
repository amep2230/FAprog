# 📋 Liste Complète des Scripts SQL - Ordre d'Exécution

## ⚠️ IMPORTANT

Ces scripts doivent être exécutés dans Supabase SQL Editor dans l'ordre suivant :

🔗 **Supabase SQL Editor** : https://doiheofprwqdibkrqjiw.supabase.co

---

## ✅ Scripts Obligatoires

### 1. `add-completed-at.sql` ⭐ **REQUIS**

**Pourquoi** : Ajoute la colonne `completed_at` à `session_logs`  
**Pour** : Logging des séances  
**Statut** : 🟡 À EXÉCUTER

```sql
-- Ouvrir le fichier supabase/add-completed-at.sql
-- Copier tout le contenu
-- Coller dans SQL Editor
-- Run
```

**Vérification** :
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'session_logs' AND column_name = 'completed_at';
-- Devrait retourner : completed_at
```

---

### 2. `add-pr-columns.sql` ⭐ **REQUIS**

**Pourquoi** : Ajoute les colonnes `date` et `notes` à `personal_records`  
**Pour** : Gestion des PRs  
**Statut** : 🟡 À EXÉCUTER

```sql
-- Ouvrir le fichier supabase/add-pr-columns.sql
-- Copier tout le contenu
-- Coller dans SQL Editor
-- Run
```

**Vérification** :
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'personal_records' AND column_name IN ('date', 'notes');
-- Devrait retourner : date, notes
```

---

### 3. `auto-detect-prs.sql` ⭐ **REQUIS**

**Pourquoi** : Active la détection automatique des PRs  
**Pour** : PRs automatiques lors du logging  
**Statut** : 🟡 À EXÉCUTER  
**Dépend de** : add-pr-columns.sql (doit être exécuté APRÈS)

```sql
-- Ouvrir le fichier supabase/auto-detect-prs.sql
-- Copier tout le contenu
-- Coller dans SQL Editor
-- Run
```

**Vérification** :
```sql
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_name = 'trigger_auto_create_pr';
-- Devrait retourner : trigger_auto_create_pr
```

---

## 🔧 Scripts Optionnels (si pas déjà fait)

### 4. `fix-rls.sql` 🔵 **Recommandé**

**Pourquoi** : Corrige les boucles infinies dans les RLS policies  
**Pour** : Sécurité Row Level Security  
**Statut** : 🟢 Probablement déjà fait

```sql
-- Si erreurs RLS ou récursion infinie
-- Ouvrir le fichier supabase/fix-rls.sql
-- Copier et Run
```

---

### 5. `create-athlete-function.sql` 🔵 **Recommandé**

**Pourquoi** : Fonction pour créer des profils athlètes  
**Pour** : Ajout d'athlètes par les coachs  
**Statut** : 🟢 Probablement déjà fait

```sql
-- Si problèmes lors de l'ajout d'athlètes
-- Ouvrir le fichier supabase/create-athlete-function.sql
-- Copier et Run
```

**Vérification** :
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'create_athlete_profile';
-- Devrait retourner : create_athlete_profile
```

---

### 6. `fix-trigger.sql` 🔵 **Recommandé**

**Pourquoi** : Trigger pour création automatique des profils  
**Pour** : Inscription automatique  
**Statut** : 🟢 Probablement déjà fait

```sql
-- Si les profils ne se créent pas à l'inscription
-- Ouvrir le fichier supabase/fix-trigger.sql
-- Copier et Run
```

---

## 📝 Ordre d'Exécution Complet

```
1. ✅ add-completed-at.sql      (Logging séances)
2. ✅ add-pr-columns.sql        (Colonnes PRs)
3. ✅ auto-detect-prs.sql       (PRs automatiques)
4. ⚪ fix-rls.sql              (Si nécessaire)
5. ⚪ create-athlete-function.sql (Si nécessaire)
6. ⚪ fix-trigger.sql           (Si nécessaire)
```

---

## 🎯 Checklist Complète

### Avant de commencer
- [ ] Accès à Supabase SQL Editor
- [ ] Connexion à : https://doiheofprwqdibkrqjiw.supabase.co
- [ ] Fichiers SQL disponibles dans `/supabase/`

### Scripts obligatoires
- [ ] **Script 1** : add-completed-at.sql exécuté
- [ ] **Script 2** : add-pr-columns.sql exécuté
- [ ] **Script 3** : auto-detect-prs.sql exécuté

### Vérifications
- [ ] Colonne `completed_at` existe dans `session_logs`
- [ ] Colonnes `date` et `notes` existent dans `personal_records`
- [ ] Trigger `trigger_auto_create_pr` existe
- [ ] Fonction `auto_create_pr_from_set_log` existe

### Tests
- [ ] Logger une séance fonctionne
- [ ] Ajouter un PR manuellement fonctionne
- [ ] PRs automatiques détectés lors du logging
- [ ] Notification de PRs s'affiche

---

## 🚀 Commandes de Vérification

### Vérifier toutes les colonnes nécessaires
```sql
-- session_logs
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'session_logs' 
AND column_name = 'completed_at';

-- personal_records
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'personal_records' 
AND column_name IN ('date', 'notes');
```

### Vérifier les triggers et fonctions
```sql
-- Trigger PRs automatiques
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_auto_create_pr';

-- Fonction PRs automatiques
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name = 'auto_create_pr_from_set_log';

-- Fonction création athlète
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name = 'create_athlete_profile';
```

### Tester le trigger PRs
```sql
-- Vérifier qu'un PR a été créé automatiquement
SELECT * FROM personal_records 
WHERE notes = 'Auto-détecté lors de la séance'
ORDER BY created_at DESC
LIMIT 5;
```

---

## ❌ Erreurs Communes

### Erreur 1 : "Could not find the 'completed_at' column"
**Solution** : Exécuter `add-completed-at.sql`

### Erreur 2 : "Could not find the 'date' column"
**Solution** : Exécuter `add-pr-columns.sql`

### Erreur 3 : PRs pas détectés automatiquement
**Solution** : 
1. Vérifier que `add-pr-columns.sql` a été exécuté
2. Exécuter `auto-detect-prs.sql`
3. Vérifier le trigger avec les commandes ci-dessus

### Erreur 4 : RLS recursion infinie
**Solution** : Exécuter `fix-rls.sql`

### Erreur 5 : Impossible d'ajouter un athlète
**Solution** : Exécuter `create-athlete-function.sql`

---

## 📊 État des Fonctionnalités

| Fonctionnalité | Script Requis | État |
|---------------|---------------|------|
| Logging séances | add-completed-at.sql | 🟡 |
| Ajout PRs manuels | add-pr-columns.sql | 🟡 |
| PRs automatiques | auto-detect-prs.sql | 🟡 |
| RLS correct | fix-rls.sql | 🟢 |
| Ajout athlètes | create-athlete-function.sql | 🟢 |
| Création profils | fix-trigger.sql | 🟢 |

**Légende** :
- 🟢 Déjà fait / Optionnel
- 🟡 À FAIRE maintenant
- 🔴 Bloquant

---

## ✅ Une fois tous les scripts exécutés

**L'application sera 100% fonctionnelle avec** :

✅ Authentification complète  
✅ Gestion des athlètes  
✅ Création de programmes  
✅ Calcul automatique RPE  
✅ Logging des séances  
✅ Statistiques complètes  
✅ Graphiques interactifs  
✅ **Gestion des PRs manuels**  
✅ **🆕 Détection AUTOMATIQUE des PRs** 🏆  

---

## 📖 Documentation Associée

- **SCRIPTS_SQL_A_EXECUTER.md** - Guide détaillé des scripts
- **FIX_PR_COLUMNS.md** - Fix colonnes PRs
- **AUTO_PR_DETECTION.md** - Guide PRs automatiques
- **RECAP_AUTO_PR.md** - Récapitulatif PRs auto
- **SESSION_LOGGING.md** - Guide logging
- **PERSONAL_RECORDS.md** - Guide PRs manuels

---

**🎯 Action Immédiate** : Exécuter les 3 scripts obligatoires dans l'ordre 1-2-3 !
