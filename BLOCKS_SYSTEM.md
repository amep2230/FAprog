# 📦 Système de Blocs d'Entraînement - Documentation

## 🎯 Vue d'ensemble

Le système de blocs d'entraînement permet aux coachs de créer des cycles d'entraînement structurés sur plusieurs semaines, avec duplication intelligente des structures et affichage des valeurs précédentes pour faciliter la progression.

## ✨ Fonctionnalités Implémentées

### 1. 📋 Gestion des Blocs

**Création de blocs** :
- Nom du bloc (ex: "Bloc Hypertrophie", "Phase Force")
- Description optionnelle
- Dates de début et fin (optionnelles)
- Statut actif/inactif (un seul bloc actif à la fois)

**Liste des blocs** :
- ✅ **Tri par ordre chronologique inverse** (plus récent en premier)
- Affichage du statut actif
- Nombre de semaines dans chaque bloc
- Navigation vers le détail

### 2. 🔄 Duplication de Semaines

**Ajouter une nouvelle semaine** :
1. Sélectionner une semaine existante comme modèle
2. La structure complète est dupliquée :
   - ✅ Tous les exercices
   - ✅ Nombre de répétitions
   - ✅ Ordre des séances
   - ✅ Instructions
3. **Charges et RPE mis à zéro** pour que le coach les remplisse

**Affichage des valeurs précédentes** :
- ✅ RPE de la semaine n-1 affiché en gris
- ✅ Charges de la semaine n-1 affichées en gris
- ✅ Instructions précédentes affichées si différentes
- Permet au coach d'adapter facilement la progression

### 3. ✏️ Édition Complète des Exercices

**Chaque exercice est entièrement modifiable** :
- ✅ Changer l'exercice (sélecteur dropdown)
- ✅ Modifier les répétitions
- ✅ Modifier le RPE
- ✅ Modifier la charge
- ✅ Modifier les instructions
- ✅ **Supprimer** l'exercice (bouton corbeille)
- ✅ **Ajouter** de nouveaux exercices (bouton +)

### 4. 🎨 Interface Utilisateur

**Navigation claire** :
```
Profil athlète
  └─ Bouton "Gérer les blocs"
      └─ Liste des blocs (triés récent→ancien)
          └─ Détail d'un bloc
              └─ Liste des semaines (triées récent→ancien)
                  └─ Éditeur de semaine (avec valeurs précédentes)
```

**Indicateurs visuels** :
- Badge "Actif" sur le bloc en cours
- Nombre de semaines par bloc
- Dates des blocs
- Valeurs précédentes en gris pour référence

## 📁 Structure des Fichiers Créés

### Base de Données
```sql
supabase/add-training-blocks.sql
├─ Table training_blocks
├─ Colonne block_id ajoutée à programs
├─ Policies RLS
└─ Triggers updated_at
```

### Composants Coach
```tsx
src/components/coach/
├─ BlockManager.tsx          # Liste et création des blocs
├─ BlockDetailView.tsx       # Détail d'un bloc + ajout semaine
├─ WeekEditor.tsx            # Édition d'une semaine avec valeurs précédentes
└─ AthleteProfileView.tsx    # Modifié pour ajouter bouton "Gérer les blocs"
```

### Routes
```tsx
src/app/dashboard/coach/athletes/[id]/
├─ blocks/
│   ├─ page.tsx                                    # Liste des blocs
│   └─ [blockId]/
│       ├─ page.tsx                                # Détail d'un bloc
│       └─ programs/
│           └─ [programId]/
│               └─ page.tsx                        # Édition d'une semaine
```

### Composants UI
```tsx
src/components/ui/
└─ textarea.tsx              # Composant Textarea (créé)
```

## 🔄 Flux de Travail Typique

### Créer un nouveau bloc
1. Aller sur le profil de l'athlète
2. Cliquer sur "Gérer les blocs"
3. Cliquer sur "Nouveau bloc"
4. Remplir les informations
5. Marquer comme "Actif" si nécessaire

### Créer la première semaine
1. Ouvrir un bloc
2. Cliquer sur "Ajouter une semaine"
3. **Si aucune semaine existante** : Créer d'abord un programme complet via "Créer un programme"
4. Revenir au bloc et ajouter la semaine

### Ajouter une semaine suivante
1. Ouvrir le bloc
2. Cliquer sur "Ajouter une semaine"
3. **Sélectionner la semaine précédente** dans le dropdown (semaines triées par ordre décroissant)
4. Donner un nom à la nouvelle semaine
5. Cliquer sur "Créer la semaine"
6. L'éditeur s'ouvre avec :
   - Structure dupliquée (exercices, reps, instructions)
   - Charges et RPE à 0
   - **Valeurs de la semaine n-1 affichées en gris**

### Modifier une semaine
1. Cliquer sur une semaine dans le bloc
2. Pour chaque exercice :
   - Voir les valeurs précédentes en gris
   - Modifier exercice, reps, RPE, charge
   - Ajouter/supprimer des exercices
3. Cliquer sur "Enregistrer"

## 🔑 Points Clés Techniques

### Tri par Ordre Chronologique Inverse
```typescript
// Dans BlockManager.tsx
const sortedBlocks = [...blocks].sort((a, b) => 
  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
);

// Dans BlockDetailView.tsx
const sortedPrograms = [...(block.programs || [])].sort((a, b) => 
  b.week_number - a.week_number
);
```

### Récupération des Valeurs Précédentes
```typescript
// Dans WeekEditor.tsx
const getPreviousSetData = (sessionDayOfWeek: number, exerciseId: string, setOrder: number) => {
  if (!previousProgram) return null;
  
  const previousSession = previousProgram.sessions.find(
    s => s.day_of_week === sessionDayOfWeek
  );
  if (!previousSession) return null;
  
  const previousSet = previousSession.sets.find(
    s => s.exercise_id === exerciseId && s.set_order === setOrder
  );
  
  return previousSet || null;
};
```

### Duplication de Semaine
```typescript
// Création du nouveau programme
const { data: newProgram } = await supabase
  .from("programs")
  .insert({
    coach_id: previousProgram.coach_id,
    athlete_id: previousProgram.athlete_id,
    block_id: block.id,
    week_number: newWeekFormData.week_number,
    name: newWeekFormData.name,
  })
  .select()
  .single();

// Duplication des sets avec RPE=0 et prescribed_weight=null
const setsToInsert = session.sets.map((set: any) => ({
  session_id: newSession.id,
  exercise_id: set.exercise_id,
  set_order: set.set_order,
  reps: set.reps,
  rpe: 0,                    // ✅ RPE à 0
  prescribed_weight: null,   // ✅ Charge à null
  instructions: set.instructions,
}));
```

## 📊 Structure de Base de Données

### Table training_blocks
```sql
CREATE TABLE training_blocks (
  id UUID PRIMARY KEY,
  coach_id UUID REFERENCES profiles(id),
  athlete_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Relation avec programs
```sql
ALTER TABLE programs ADD COLUMN block_id UUID REFERENCES training_blocks(id);
```

## 🚀 Prochaines Étapes

1. **Exécuter le script SQL** :
   ```bash
   # Dans Supabase SQL Editor
   # Copier/coller le contenu de supabase/add-training-blocks.sql
   ```

2. **Tester le flux complet** :
   - Créer un bloc
   - Créer la première semaine (via programme standard)
   - Ajouter une 2e semaine en dupliquant la 1ère
   - Vérifier que les valeurs précédentes s'affichent
   - Modifier les exercices (changer, ajouter, supprimer)

3. **Améliorations possibles** (futures) :
   - Copier un bloc entier pour un autre athlète
   - Templates de blocs pré-configurés
   - Graphiques de progression par bloc
   - Export/import de blocs

## ✅ Checklist Fonctionnalités Demandées

- ✅ Blocs classés en ordre chronologique inverse (récent en premier)
- ✅ Sélection de semaines triées (récent en premier)
- ✅ Duplication de structure lors de "Ajouter une nouvelle semaine"
- ✅ Affichage des RPE précédents en gris
- ✅ Affichage des charges précédentes en gris
- ✅ Exercices entièrement modifiables
- ✅ Possibilité de supprimer des exercices
- ✅ Possibilité d'ajouter de nouveaux exercices

## 📞 Support

Pour toute question sur l'utilisation du système de blocs, consulter cette documentation ou le fichier `SUMMARY.md` pour la vue d'ensemble du projet.
