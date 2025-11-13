# 🏋️ Techniques d'Intensification pour Blocs Généraux

## 📋 Objectif

Ajouter une fonctionnalité permettant aux coachs de sélectionner une technique d'intensification parmi les 15 principales pour chaque série dans les blocs de type **"Général"** uniquement.

## ✅ Implémentation Complète

### 1. Migration Base de Données

**Fichier** : `supabase/add-intensification-technique.sql`

**Commandes** :
```sql
-- Ajouter la colonne à la table sets
ALTER TABLE sets
ADD COLUMN intensification_technique VARCHAR(50) NULL;

-- Créer un index pour les performances
CREATE INDEX idx_sets_intensification_technique ON sets(intensification_technique);
```

**À exécuter** :
1. Aller sur le Dashboard Supabase
2. Ouvrir **SQL Editor**
3. Copier le contenu du fichier `supabase/add-intensification-technique.sql`
4. Exécuter la requête

### 2. Structures de Code

#### Fichier : `src/lib/intensification-techniques.ts`

Liste des 15 techniques avec descriptions :
- **Drop Set** — Baisser la charge après l'échec et continuer la série
- **Rest-Pause** — Prendre une courte pause (5–20s) après l'échec
- **Superset** — Enchaîner deux exercices sans repos
- **Giant Set** — Enchaîner quatre exercices ou plus
- **Pré-fatigue** — Isolement avant mouvement polyarticulaire
- **Post-fatigue** — Polyarticulaire puis isolement
- **Répétitions forcées** — Un partenaire aide à surpasser l'échec
- **Répétitions trichées** — Utiliser un léger élan
- **Répétitions partielles** — Continuer en amplitude réduite
- **Répétitions négatives** — Accent sur la phase excentrique
- **Tempo lent / TUT** — Exécuter les répétitions plus lentement
- **Isométrique** — Bloquer la charge dans une position
- **Mechanical Drop Set** — Changer vers une variante plus facile
- **Clusters** — Diviser la série en mini-blocs
- **Myo-Reps** — Série d'activation + mini-séries

#### Fichier : `src/components/shared/IntensificationTechniqueSelect.tsx`

Composant React réutilisable pour sélectionner une technique.

**Props** :
- `value`: `string | null` - ID de la technique sélectionnée
- `onChange`: `(value: string) => void` - Callback de changement
- `disabled`: `boolean` (optionnel) - Désactiver le select

#### Fichier : `src/components/coach/WeekEditor.tsx`

Intégration du composant dans l'interface de création de semaine.

**Modifications** :
- Ajout de `intensification_technique?: string | null` à l'interface `Set`
- Import du composant `IntensificationTechniqueSelect`
- Affichage du Select pour les blocs de type "Général" uniquement
- Le Select s'affiche à côté des Notes, avec une largeur réduite pour maintenir la mise en page

### 3. Flux d'Utilisation

#### Pour le Coach

1. **Créer un bloc de type "Général"**
   - Aller sur `Blocs d'entraînement`
   - Cliquer sur `Nouveau bloc`
   - Sélectionner `Type : Général`

2. **Ajouter des semaines avec exercices**
   - Cliquer sur `Ajouter une semaine`
   - Ajouter des séances et exercices

3. **Sélectionner une technique d'intensification**
   - Pour chaque série, un nouveau champ **"Technique d'intensification"** apparaît
   - Cliquer sur le Select et choisir une technique parmi les 15
   - La technique est sauvegardée automatiquement

#### Pour l'Athlète

- **Vue du programme** : La technique sélectionnée s'affiche avec la série (optionnel pour future implémentation)

## 🎨 Interface Visuelle

### Structure de la ligne de série (bloc Général)

```
┌─────────────────────────────────────────────────────────────┐
│ Série 1                                                     │
├─────────────────────────────────────────────────────────────┤
│ [Reps] [Poids] [Technique d'intensification] [Notes]       │
│  [5]   [100kg] [Drop Set ▼]                 [Strict form]  │
└─────────────────────────────────────────────────────────────┘
```

### Comparaison : Bloc Force vs Bloc Général

**Bloc Force** :
```
Série 1 | Reps [5] | Poids [100kg] | RPE Prescrit [8.0] | RPE Réel [8.0] | Notes [...]
```

**Bloc Général** (NOUVEAU) :
```
Série 1 | Reps [5] | Poids [100kg] | Technique [Drop Set ▼] | Notes [...]
```

## 📊 Schéma de Données

### Table `sets`

**Colonne ajoutée** :
- `intensification_technique` (VARCHAR(50), NULL)
  - Stocke l'ID de la technique
  - Exemples : `drop-set`, `rest-pause`, `superset`, etc.

**Index créé** :
```sql
CREATE INDEX idx_sets_intensification_technique ON sets(intensification_technique);
```

## 🔄 Logique de Conditionnement

Le champ n'apparaît que si :
- ✅ Le bloc est de type **"Général"** (`block.block_type === "general"`)
- ✅ L'utilisateur est un coach
- ✅ L'utilisateur est en train de créer/éditer une semaine

Le champ ne s'affiche PAS pour :
- ❌ Les blocs de type "Force"
- ❌ Les athlètes (vérification de rôle)

## 🚀 Exécution de la Migration

### Étape 1 : Exécuter la Migration SQL

```bash
# Depuis le Dashboard Supabase
# SQL Editor → Copier le contenu de supabase/add-intensification-technique.sql
```

### Étape 2 : Vérifier la Colonne

```sql
-- Vérifier que la colonne a été créée
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sets' AND column_name = 'intensification_technique';
```

### Étape 3 : Tester dans l'UI

1. Recharger l'application
2. Créer un nouveau bloc de type "Général"
3. Ajouter une semaine
4. Ajouter un exercice/série
5. ✅ Le champ "Technique d'intensification" doit apparaître

## 📝 Validation

### Avant implémentation
- [ ] Migration SQL exécutée
- [ ] Colonne `intensification_technique` présente dans `sets`
- [ ] Index créé pour les performances

### Après implémentation
- [ ] Bloc "Général" affiche le Select
- [ ] Bloc "Force" n'affiche pas le Select
- [ ] Sélection d'une technique → Sauvegarde automatique en BD
- [ ] Vérification des 15 techniques présentes
- [ ] Descriptions affichées correctement

## 🔮 Évolutions Futures

1. **Affichage pour l'athlète** : Afficher la technique d'intensification dans la vue du programme
2. **Conseils automatiques** : Suggérer une technique basée sur le profil d'entraînement
3. **Historique** : Tracker l'utilisation des techniques pour chaque athlète
4. **Statistiques** : Graphiques de progression par technique
5. **Combinaisons** : Permettre l'utilisation de plusieurs techniques par série

## 🐛 Dépannage

### Le Select n'apparaît pas
- ✅ Vérifier que `block_type = "general"`
- ✅ Recharger la page
- ✅ Vérifier la console du navigateur pour les erreurs

### Erreur à la sauvegarde
- ✅ Vérifier que la migration SQL a été exécutée
- ✅ Vérifier que la colonne existe en base
- ✅ Redémarrer le serveur de développement

### Les descriptions ne s'affichent pas dans le Select
- ✅ Vérifier que le composant `IntensificationTechniqueSelect` est correctement importé
- ✅ Vérifier le fichier `src/lib/intensification-techniques.ts`

## 📚 Fichiers Modifiés

```
src/
├── lib/
│   └── intensification-techniques.ts (NEW) - Liste des 15 techniques
├── components/
│   ├── shared/
│   │   └── IntensificationTechniqueSelect.tsx (NEW) - Composant Select
│   └── coach/
│       └── WeekEditor.tsx (MODIFIED) - Intégration du Select
└── 
supabase/
└── add-intensification-technique.sql (NEW) - Migration BD
```

---

**Status** : ✅ Implémentation Complète
**Date** : 13 Novembre 2025
**Bloc Concerné** : Type "Général" uniquement
