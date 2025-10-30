# 🚨 Fix Urgent - Colonnes manquantes dans personal_records

## Problème identifié

```
Error creating PR: {
  code: 'PGRST204',
  message: "Could not find the 'date' column of 'personal_records' in the schema cache"
}
```

## ✅ Solution appliquée

### 1. Script SQL créé : `supabase/add-pr-columns.sql`

Ce script ajoute :
- ✅ Colonne `date` (DATE, NOT NULL) - Date du record
- ✅ Colonne `notes` (TEXT, nullable) - Notes optionnelles
- ✅ Index sur `date` pour performance
- ✅ Nouvelle contrainte UNIQUE : `(athlete_id, exercise_id, date)`

**Avantage** : Permet de tracker l'évolution des PRs dans le temps !

### 2. API modifiée : `/api/personal-records/route.ts`

Ajout des champs requis par la structure existante :
```typescript
{
  athlete_id,
  exercise_id,
  reps: 1,              // Toujours 1 pour un 1RM
  weight,               // Le poids du PR
  estimated_1rm: weight, // Égal au poids pour un 1RM
  date,                 // 🆕 Date du PR
  notes,                // 🆕 Notes optionnelles
}
```

## 🎯 À faire MAINTENANT

### Étape 1 : Exécuter le script SQL

1. Ouvrir Supabase SQL Editor : [https://doiheofprwqdibkrqjiw.supabase.co](https://doiheofprwqdibkrqjiw.supabase.co)
2. Copier le contenu de `supabase/add-pr-columns.sql`
3. Exécuter (Run)
4. Vérifier le succès

### Étape 2 : Tester

1. Recharger l'application
2. Cliquer sur "Ajouter un PR"
3. Remplir le formulaire
4. ✅ Devrait fonctionner !

## 📊 Différence avant/après

### AVANT
```sql
personal_records (
  id,
  athlete_id,
  exercise_id,
  reps,
  weight,
  estimated_1rm,
  created_at
)

UNIQUE (athlete_id, exercise_id, reps)
-- ❌ Impossible de tracker plusieurs PRs à différentes dates
```

### APRÈS
```sql
personal_records (
  id,
  athlete_id,
  exercise_id,
  reps,
  weight,
  estimated_1rm,
  date,          -- 🆕
  notes,         -- 🆕
  created_at
)

UNIQUE (athlete_id, exercise_id, date)
-- ✅ Permet plusieurs PRs pour le même exercice à des dates différentes
```

## 🎉 Bénéfices

1. **Suivi de progression** : Voir l'évolution d'un PR au fil du temps
2. **Historique complet** : Tous les records sont conservés
3. **Notes contextuelles** : "Avec ceinture", "Pause 3s", etc.
4. **Graphiques possibles** : Courbes d'évolution des PRs

## 📝 Fichiers créés/modifiés

### Créés
- ✅ `supabase/add-pr-columns.sql` - Script de migration
- ✅ `FIX_PR_COLUMNS.md` - Documentation détaillée

### Modifiés
- ✅ `src/app/api/personal-records/route.ts` - Ajout reps + estimated_1rm
- ✅ `SCRIPTS_SQL_A_EXECUTER.md` - Ajout du nouveau script

## ⚠️ Important

**Ce script doit être exécuté AVANT de pouvoir utiliser la fonctionnalité PRs !**

Sans ce script :
- ❌ Erreur 500 lors de l'ajout d'un PR
- ❌ Colonne 'date' introuvable
- ❌ Colonne 'notes' introuvable

Avec ce script :
- ✅ Ajout de PRs fonctionne
- ✅ Suivi de progression
- ✅ Notes personnalisées

---

**Status** : 🟡 EN ATTENTE D'EXÉCUTION DU SCRIPT SQL

Une fois le script exécuté : 🟢 100% FONCTIONNEL
