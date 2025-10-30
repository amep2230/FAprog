# 📊 Page de Profil d'Athlète - Complète

## ✅ Fonctionnalités implémentées

### 1. **Cartes de statistiques**
- 📅 Séances complétées
- 💪 Tonnage total
- 🏋️ 1RM Squat, Bench, Deadlift
- 📊 Total SBD (Squat + Bench + Deadlift)

### 2. **Graphiques interactifs** (Recharts)
- 📈 **Graphique de ligne** : Évolution du tonnage par semaine (Squat, Bench, Deadlift)
- 🥧 **Camembert** : Répartition des maxs entre les 3 mouvements

### 3. **Tableaux détaillés par semaine**
- 📋 **Nombre de séries** par exercice et par semaine
- 🏋️ **Max effectués** (poids maximum) par exercice
- 📦 **Tonnage** (volume total) par exercice
- 😤 **RPE moyen** par exercice
- 🎯 **1RM théorique** calculé avec la formule d'Epley

### 4. **Liste des programmes**
- Affichage de tous les programmes créés
- Lien vers les détails de chaque programme

---

## 🔧 Scripts SQL à exécuter dans Supabase

### Script 1 : Ajouter le champ `completed_at`
**Fichier** : `supabase/add-completed-at.sql`

Ce champ permet de tracker quand une séance a été complétée.

```sql
ALTER TABLE session_logs 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

UPDATE session_logs 
SET completed_at = created_at 
WHERE completed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_session_logs_completed_at ON session_logs(completed_at);
```

**→ À exécuter dans Supabase SQL Editor**

---

## 📦 Dépendances installées

```bash
npm install recharts
```

Recharts est une bibliothèque de graphiques React construite sur D3. Elle permet de créer :
- Graphiques en ligne
- Camemberts
- Barres
- Et bien plus...

---

## 🗂️ Structure des fichiers

### Composants créés

1. **`AthleteProfileView.tsx`** (principal)
   - Affiche l'en-tête avec les infos de l'athlète
   - Cartes de statistiques
   - Intègre les graphiques et tableaux
   - Liste des programmes

2. **`WeeklyStatsTable.tsx`** (tableaux)
   - Calcule toutes les statistiques par semaine
   - Affiche 5 tableaux :
     * Nombre de séries
     * Max effectués
     * Tonnage
     * RPE moyen
     * 1RM théorique

3. **`AthleteCharts.tsx`** (graphiques)
   - Graphique de tonnage par semaine
   - Camembert de répartition des maxs

### Page route

**`/dashboard/coach/athletes/[id]/page.tsx`**
- Récupère les données de l'athlète
- Récupère les programmes, PRs et session logs
- Passe tout au composant `AthleteProfileView`

---

## 📊 Calculs implémentés

### 1RM théorique (Formule d'Epley)
```typescript
1RM = weight × (1 + reps / 30)
```

### Tonnage
```typescript
Tonnage = Σ (poids × répétitions)
```

### RPE moyen
```typescript
RPE moyen = Σ RPE / nombre de sets
```

---

## 🧪 Tester avec des données

Pour voir les graphiques et tableaux en action, vous devez avoir des **session_logs** et **set_logs** dans votre base de données.

### Option 1 : Créer des données manuellement

Voir le fichier `supabase/test-data-logs.sql` pour des exemples de requêtes.

### Option 2 : Créer une interface de logging

L'athlète doit pouvoir logger ses séances pour remplir automatiquement ces données (à développer).

---

## 🎨 Couleurs utilisées

- **Squat** : Rose (`#EC4899`)
- **Bench** : Bleu (`#3B82F6`)
- **Deadlift** : Violet (`#A855F7`)

Ces couleurs sont cohérentes dans tous les tableaux et graphiques.

---

## 📝 Notes sur la base de données

### Tables utilisées
- `profiles` - Infos de l'athlète
- `programs` - Programmes créés
- `sessions` - Séances dans un programme
- `sets` - Sets dans une séance
- `personal_records` - Records personnels
- `session_logs` - Logs de séances complétées ⭐
- `set_logs` - Logs de sets effectués ⭐

### Requêtes optimisées
- Utilisation de `select` avec jointures imbriquées
- Index sur les colonnes les plus utilisées
- Tri par date pour afficher les données récentes en premier

---

## 🚀 Prochaines étapes recommandées

1. **Interface de logging pour les athlètes**
   - Page où l'athlète peut logger ses séances
   - Saisie des poids/reps/RPE réels
   - Sauvegarde dans `session_logs` et `set_logs`

2. **Graphique de progression des 1RM**
   - Suivi de l'évolution des PRs dans le temps
   - Graphique de ligne pour chaque mouvement

3. **Analyse de la charge d'entraînement**
   - Fatigue tracking
   - Volume hebdomadaire
   - Intensité moyenne

4. **Export des données**
   - CSV pour analyse externe
   - PDF pour rapports

5. **Comparaison entre athlètes**
   - Benchmarking
   - Classement

---

## ❓ FAQ

### Les tableaux sont vides ?
→ Il faut que l'athlète ait des `session_logs` avec des `set_logs`. Ces données sont créées quand l'athlète log ses séances.

### Les graphiques ne s'affichent pas ?
→ Vérifiez que `recharts` est bien installé (`npm install recharts`).

### Les 1RM ne correspondent pas à mes PRs ?
→ Les 1RM dans les tableaux sont **théoriques** (calculés à partir des performances), les PRs sont les **vrais maxs testés**.

### Comment ajouter d'autres exercices dans les tableaux ?
→ Les tableaux affichent automatiquement tous les exercices loggés. Les 3 principaux (SBD) sont mis en évidence.

---

## 🎉 Résultat final

Vous avez maintenant une page de profil d'athlète complète avec :
- ✅ Statistiques globales
- ✅ Graphiques interactifs
- ✅ Tableaux détaillés par semaine
- ✅ Calculs automatiques (1RM, tonnage, RPE)
- ✅ Design responsive et coloré

La page est prête à afficher des données dès que l'athlète commencera à logger ses séances ! 📊
