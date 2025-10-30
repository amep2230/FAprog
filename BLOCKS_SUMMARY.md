# ✅ Système de Blocs d'Entraînement - Résumé de l'Implémentation

## 🎯 Demande Initiale

Le coach souhaitait :
1. ✅ **Créer et modifier des blocs** d'entraînement
2. ✅ **Blocs classés par ordre chronologique inverse** (plus récent en haut)
3. ✅ **Dupliquer la structure** lors de l'ajout d'une nouvelle semaine
4. ✅ **Afficher les charges et RPE** de la semaine précédente pour faciliter l'adaptation
5. ✅ **Exercices entièrement modifiables** : modification, suppression, ajout

## 📦 Ce qui a été créé

### 1. Base de Données (SQL)
```
supabase/add-training-blocks.sql
```
- Nouvelle table `training_blocks`
- Colonne `block_id` ajoutée à `programs`
- Policies RLS complètes
- Triggers pour `updated_at`

### 2. Composants React/TypeScript
```
src/components/coach/
├── BlockManager.tsx          (Nouveau) - Liste et création des blocs
├── BlockDetailView.tsx       (Nouveau) - Détail bloc + ajout semaines
├── WeekEditor.tsx            (Nouveau) - Édition semaine avec valeurs précédentes
└── AthleteProfileView.tsx    (Modifié) - Bouton "Gérer les blocs"

src/components/ui/
└── textarea.tsx              (Nouveau) - Composant UI manquant
```

### 3. Routes Next.js
```
src/app/dashboard/coach/athletes/[id]/
├── blocks/page.tsx                                    (Nouveau)
└── blocks/[blockId]/
    ├── page.tsx                                       (Nouveau)
    └── programs/[programId]/page.tsx                  (Nouveau)
```

### 4. Documentation
```
BLOCKS_SYSTEM.md           - Documentation technique complète
BLOCKS_INSTALLATION.md     - Guide d'installation pas à pas
```

## 🎨 Fonctionnalités Implémentées

### ✅ 1. Tri par Ordre Chronologique Inverse

**Dans BlockManager.tsx** :
```typescript
const sortedBlocks = [...blocks].sort((a, b) => 
  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
);
```

**Dans BlockDetailView.tsx** :
```typescript
const sortedPrograms = [...(block.programs || [])].sort((a, b) => 
  b.week_number - a.week_number
);
```

**Résultat** : 
- Les blocs les plus récents apparaissent en haut de la liste
- Dans le sélecteur de semaines, la plus récente est en premier

### ✅ 2. Duplication de Structure

**Lors de l'ajout d'une nouvelle semaine** :
- Sélection d'une semaine existante comme modèle
- Duplication complète de la structure :
  - Toutes les séances (jour de la semaine + nom)
  - Tous les exercices (ordre préservé)
  - Répétitions copiées
  - Instructions copiées
  - **RPE mis à 0** (à remplir par le coach)
  - **Charges mises à null** (à remplir par le coach)

**Code (BlockDetailView.tsx)** :
```typescript
const setsToInsert = session.sets.map((set: any) => ({
  session_id: newSession.id,
  exercise_id: set.exercise_id,
  set_order: set.set_order,
  reps: set.reps,
  rpe: 0,                    // ← À remplir
  prescribed_weight: null,   // ← À remplir
  instructions: set.instructions,
}));
```

### ✅ 3. Affichage des Valeurs Précédentes

**Dans WeekEditor.tsx** :
```typescript
const getPreviousSetData = (sessionDayOfWeek: number, exerciseId: string, setOrder: number) => {
  if (!previousProgram) return null;
  const previousSession = previousProgram.sessions.find(s => s.day_of_week === sessionDayOfWeek);
  const previousSet = previousSession?.sets.find(
    s => s.exercise_id === exerciseId && s.set_order === setOrder
  );
  return previousSet || null;
};
```

**Affichage UI** :
```tsx
{previousSet && (
  <p className="text-xs text-gray-500 mt-1">
    Précédent: {previousSet.rpe}
  </p>
)}
```

**Résultat** :
- RPE précédent affiché en gris sous le champ
- Charges précédentes affichées en gris
- Instructions précédentes affichées si différentes
- Le coach peut facilement comparer et adapter

### ✅ 4. Exercices Entièrement Modifiables

**Modification** :
- Dropdown pour changer l'exercice
- Input pour les répétitions
- Input pour le RPE
- Input pour la charge
- Input pour les instructions

**Suppression** :
```tsx
<Button
  variant="ghost"
  size="icon"
  onClick={() => handleDeleteSet(session.id, set.id)}
  className="text-red-500 hover:text-red-700"
>
  <Trash2 className="h-4 w-4" />
</Button>
```

**Ajout** :
```tsx
<Button onClick={() => {
  setSelectedSessionId(session.id);
  setIsAddExerciseDialogOpen(true);
}}>
  <Plus className="mr-2 h-4 w-4" />
  Ajouter un exercice
</Button>
```

**Dialog d'ajout** :
- Sélection de l'exercice
- Reps, RPE, Charge
- Instructions optionnelles

### ✅ 5. Interface Utilisateur Complète

**Navigation** :
```
Coach Dashboard
  └─ Profil Athlète
      └─ Bouton "Gérer les blocs" (avec icône FolderKanban)
          └─ Liste des blocs (carte cliquable, badge "Actif")
              └─ Détail du bloc (infos + liste semaines)
                  └─ Éditeur de semaine (tableau avec valeurs précédentes)
```

**Indicateurs visuels** :
- Badge "Actif" sur le bloc en cours (fond bleu)
- Nombre de semaines par bloc
- Dates de début/fin du bloc
- Valeurs précédentes en gris (text-gray-500)
- Boutons avec icônes (Plus, Edit, Trash, Save, Arrow)
- Card d'information bleue si semaine précédente disponible

## 🚀 Installation

### Étape 1 : Exécuter le SQL
```bash
# 1. Ouvrir Supabase Dashboard
# 2. SQL Editor → Nouvelle requête
# 3. Copier/coller supabase/add-training-blocks.sql
# 4. Run
```

### Étape 2 : Redémarrer l'application
```bash
npm run dev
```

### Étape 3 : Tester
1. Se connecter en tant que coach
2. Aller sur le profil d'un athlète
3. Cliquer sur "Gérer les blocs"
4. Créer un bloc
5. Ajouter une semaine (duplication)
6. Vérifier les valeurs précédentes
7. Modifier/Ajouter/Supprimer des exercices

## 📊 Structure de Données

### training_blocks
```typescript
{
  id: UUID
  coach_id: UUID
  athlete_id: UUID
  name: string
  description: string?
  start_date: date?
  end_date: date?
  is_active: boolean
  created_at: timestamp
  updated_at: timestamp
}
```

### programs (modifié)
```typescript
{
  // ... champs existants
  block_id: UUID?  // ← Nouveau
}
```

## ✨ Points Forts

1. **Tri intelligent** : Les blocs les plus récents en premier facilitent la navigation
2. **Duplication efficace** : Gain de temps avec copie de structure
3. **Référence visuelle** : Valeurs précédentes en gris pour guider la progression
4. **Flexibilité totale** : Modification complète de tous les exercices
5. **UX cohérente** : Interface claire avec icônes et badges
6. **Sécurité** : RLS pour isoler les données par coach/athlète

## 🔒 Sécurité (RLS)

```sql
-- Coaches can view their blocks
CREATE POLICY "Coaches can view their blocks" ON training_blocks
  FOR SELECT USING (auth.uid() = coach_id);

-- Athletes can view their blocks
CREATE POLICY "Athletes can view their blocks" ON training_blocks
  FOR SELECT USING (auth.uid() = athlete_id);

-- Coaches can manage their blocks
CREATE POLICY "Coaches can manage their blocks" ON training_blocks
  FOR ALL USING (auth.uid() = coach_id);
```

## 📈 Améliorations Futures Possibles

- [ ] Templates de blocs pré-configurés
- [ ] Copie de bloc pour un autre athlète
- [ ] Graphiques de progression par bloc
- [ ] Export/Import de blocs
- [ ] Statistiques agrégées par bloc
- [ ] Comparaison entre blocs

## 🎓 Technologies Utilisées

- **Next.js 14.2.33** (App Router)
- **TypeScript**
- **Supabase** (PostgreSQL + RLS)
- **TailwindCSS**
- **shadcn/ui** (composants)
- **Lucide Icons**

## ✅ Checklist de Validation

- ✅ Blocs triés par ordre chronologique inverse
- ✅ Semaines triées par ordre chronologique inverse dans les sélecteurs
- ✅ Duplication de structure lors de l'ajout de semaine
- ✅ RPE précédents affichés en gris
- ✅ Charges précédentes affichées en gris
- ✅ Instructions précédentes affichées si différentes
- ✅ Modification d'exercices (dropdown)
- ✅ Suppression d'exercices (bouton corbeille)
- ✅ Ajout d'exercices (dialog avec formulaire)
- ✅ Tous les champs éditables (reps, rpe, charge, instructions)
- ✅ Build Next.js sans erreurs
- ✅ RLS policies configurées
- ✅ Documentation complète

## 📞 Support

- Documentation technique : `BLOCKS_SYSTEM.md`
- Guide d'installation : `BLOCKS_INSTALLATION.md`
- Vue d'ensemble projet : `SUMMARY.md`

---

**Statut** : ✅ Toutes les fonctionnalités demandées sont implémentées et testées  
**Date** : 20 octobre 2025  
**Version** : 1.0.0
