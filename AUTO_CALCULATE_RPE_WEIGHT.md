# Calcul Automatique RPE ↔ Charge

## Vue d'ensemble

Cette fonctionnalité permet le calcul automatique **bidirectionnel** entre RPE et charge dans les blocs de force, basé sur les Personal Records de l'athlète et la table RPE.

## Fonctionnalités

### 1. Calcul automatique RPE → Charge

Quand vous modifiez le **RPE prescrit** :
- Le système récupère le pourcentage du 1RM depuis `rpe_table` (basé sur RPE + Reps)
- Récupère le 1RM de l'athlète pour cet exercice depuis `personal_records`
- Calcule : `Charge = 1RM × (Pourcentage / 100)`
- Arrondit au 2.5kg le plus proche pour correspondre aux plaques standards
- Met à jour automatiquement le champ **Poids (kg)**

**Exemple :**
- Squat : 1RM = 160kg
- RPE prescrit = 8.0
- Reps = 5
- Table RPE : 8.0 @ 5 reps = 85% du 1RM
- **Calcul** : 160 × 0.85 = 136kg → arrondi à **135kg**

### 2. Calcul automatique Charge → RPE

Quand vous modifiez le **Poids (kg)** :
- Calcule le pourcentage du 1RM que représente ce poids
- Recherche dans `rpe_table` le RPE le plus proche pour ce pourcentage et ce nombre de reps
- Met à jour automatiquement le champ **RPE Prescrit**

**Exemple :**
- Squat : 1RM = 160kg
- Charge saisie = 140kg
- Reps = 5
- **Pourcentage** : (140/160) × 100 = 87.5%
- Table RPE : 87.5% @ 5 reps ≈ **RPE 8.5**

### 3. Recalcul sur changement de Reps

Quand vous modifiez les **Reps** :
- Le système recalcule automatiquement le poids basé sur le RPE actuel
- Utilise la nouvelle ligne dans `rpe_table` (même RPE, nouvelles reps)

### 4. RPE Réel vs RPE Prescrit

Deux champs distincts :

- **RPE Prescrit** (fond blanc) : 
  - Utilisé pour les calculs automatiques de charge
  - Planification théorique de l'intensité
  - Lié à la table RPE scientifique

- **RPE Réel** (fond ambre) :
  - Ressenti réel après l'exécution
  - **Initialisé automatiquement** avec la valeur du RPE Prescrit
  - Se met à jour automatiquement quand le RPE Prescrit change (sauf si modifié manuellement)
  - N'affecte PAS les calculs automatiques
  - Permet de comparer prescrit vs réel pour ajuster les semaines futures

**Comportement intelligent** :
- À la création : `actual_rpe = prescribed_rpe`
- Quand `prescribed_rpe` change : `actual_rpe` suit automatiquement **sauf si** l'utilisateur l'a modifié manuellement
- Modification manuelle : Dès que vous changez `actual_rpe`, il devient indépendant

## Architecture Technique

### Fonctions principales

#### `calculateWeightFromRPE(exerciseName, reps, rpe)`
```typescript
// 1. Récupère % du 1RM depuis rpe_table
// 2. Récupère le 1RM de l'athlète depuis personal_records
// 3. Calcule: poids = (1RM × %) / 100
// 4. Arrondit: ROUND(poids / 2.5) × 2.5
```

#### `calculateRPEFromWeight(exerciseName, reps, weight)`
```typescript
// 1. Récupère le 1RM de l'athlète
// 2. Calcule: percentage = (poids / 1RM) × 100
// 3. Trouve le RPE le plus proche dans rpe_table
// 4. Retourne le RPE optimal
```

#### `handleUpdateSet(sessionId, setId, field, value)`
```typescript
// Logique intelligente :
// - Si field = 'prescribed_rpe' → calcule prescribed_weight + sync actual_rpe
// - Si field = 'prescribed_weight' → calcule prescribed_rpe + sync actual_rpe
// - Si field = 'prescribed_reps' → recalcule prescribed_weight + sync actual_rpe
// - Si field = 'actual_rpe' → pas de calcul (ressenti uniquement)

// Synchronisation actual_rpe :
// - Suit prescribed_rpe SAUF si déjà modifié manuellement
// - Détection : actual_rpe === null || actual_rpe === prescribed_rpe
// - Permet de garder les modifications manuelles
```

### Dépendances

- **Table RPE** : `rpe_table` (264 entrées : RPE 0-12.5 × Reps 1-12)
- **Personal Records** : `personal_records.estimated_1rm` calculé via formule de Brzycki
- **Type de bloc** : Fonctionne uniquement pour `block_type = 'force'`

### État React

```typescript
const [personalRecords, setPersonalRecords] = useState<Map<string, number>>(new Map());
// Map: exerciceName → estimated_1rm
```

Chargé au montage du composant via :
```sql
SELECT pr.*, e.name 
FROM personal_records pr
JOIN exercises e ON e.id = pr.exercise_id
WHERE pr.athlete_id = ?
```

## Interface Utilisateur

### Bannière d'information (Blocs de Force uniquement)

```
⚡ Calcul automatique activé (Bloc de Force)
RPE → Charge : Le poids se calcule automatiquement selon vos PR et la table RPE.
Charge → RPE : Le RPE prescrit s'ajuste automatiquement quand vous modifiez le poids.
RPE Réel : Notez le ressenti réel après l'exécution (n'affecte pas les calculs).
```

### Layout des champs (Blocs de Force)

```
┌─────────────┬─────────────┬─────────────┬──────────────┬──────────────┬─────────────┐
│ Série N     │ Reps        │ Poids (kg)  │ RPE Prescrit │ RPE Réel     │ Notes       │
│             │ [Input]     │ [Input]     │ [Input]      │ [Input]      │ [Input]     │
│             │             │ ↕ Semaine N-1│ ↕ Semaine N-1│ (fond ambre) │             │
└─────────────┴─────────────┴─────────────┴──────────────┴──────────────┴─────────────┘
```

- **RPE Prescrit** : Blanc, avec historique N-1 en dessous
- **RPE Réel** : Fond ambre (`bg-amber-50`) pour différenciation visuelle

## Workflow Typique

### Planification d'une semaine

1. **Semaine 1** : Remplir manuellement
   - Exercice : Squat
   - Reps : 5
   - RPE Prescrit : 7.0
   - Système calcule → Poids : 125kg (basé sur 1RM 160kg)

2. **Créer Semaine 2** (Auto RPE) :
   - Fonction SQL incrémente RPE automatiquement
   - RPE passe à 7.5 (selon `rpe_increment_low`)
   - Poids recalculé automatiquement → 130kg

3. **Édition manuelle Semaine 2** :
   - Coach peut ajuster le poids → RPE se recalcule → RPE réel suit
   - Coach peut ajuster le RPE → Poids se recalcule → RPE réel suit
   - Après exécution, athlète peut modifier le RPE Réel (devient indépendant)

### Exemple de session complète

| Série | Reps | Poids Prescrit | RPE Prescrit | RPE Réel | Notes |
|-------|------|----------------|--------------|----------|-------|
| 1     | 5    | 135kg          | 8.0          | 8.0 (auto)| -    |
| 2     | 5    | 135kg          | 8.0          | 8.0 (modifié → 8.5) | Plus dur |
| 3     | 5    | 135kg          | 8.0          | 8.0 (modifié → 9.0) | Très dur |

**États du RPE Réel** :
- Série 1 : Initialisé à 8.0 automatiquement, non modifié → reste synchronisé
- Série 2 : Modifié manuellement à 8.5 → devient indépendant
- Série 3 : Modifié manuellement à 9.0 → devient indépendant

**Analyse** : RPE réel augmente sur les séries 2-3 → indicateur de fatigue → possiblement réduire semaine suivante

## Cas particuliers

### Pas de PR disponible

Si aucun PR n'existe pour l'exercice :
- Pas de calcul automatique possible
- Les champs restent vides
- Le coach doit remplir manuellement
- **Solution** : Ajouter un PR via l'interface "Gérer les PR"

### Exercice non trouvé dans PR

Si le nom de l'exercice ne correspond pas exactement :
- Vérifier l'orthographe dans la table `exercises`
- Les noms doivent correspondre exactement (sensible à la casse)
- Ex: "Squat" ≠ "squat" ≠ "Back Squat"

### RPE hors limites

- **Min** : 0
- **Max** : 12.5 (selon littérature scientifique RPE)
- Si hors limites → pas de correspondance dans `rpe_table` → pas de calcul

### Reps hors limites

- **Min** : 1
- **Max** : 12 (limite de la table RPE actuelle)
- Si > 12 reps → pas de calcul automatique possible

## Blocs Généraux vs Blocs de Force

| Feature                    | Bloc Force | Bloc Général |
|----------------------------|------------|--------------|
| Calcul auto RPE → Charge   | ✅         | ❌           |
| Calcul auto Charge → RPE   | ✅         | ❌           |
| Champ RPE Prescrit         | ✅         | ❌           |
| Champ RPE Réel             | ✅         | ❌           |
| Recalcul sur changement Reps| ✅        | ❌           |
| Bannière d'information     | ✅         | ❌           |

**Blocs Généraux** : Saisie manuelle uniquement (Reps, Poids, Notes)

## Formules

### Brzycki (1RM estimé)
```
1RM = poids × (36 / (37 - reps))
```

### Calcul du poids prescrit
```
poids_prescrit = 1RM × (percentage_of_1rm / 100)
poids_arrondi = ROUND(poids_prescrit / 2.5) × 2.5
```

### Calcul du pourcentage actuel
```
pourcentage = (poids / 1RM) × 100
```

## Tests recommandés

### Test 1 : Calcul RPE → Poids
1. Créer un bloc de force
2. Ajouter des PR (ex: Squat 160kg × 1)
3. Créer une semaine avec Squat
4. Remplir Reps = 5, RPE = 8.0
5. **Vérifier** : Poids calculé automatiquement ≈ 135kg

### Test 2 : Calcul Poids → RPE
1. Dans la même série
2. Modifier Poids = 145kg
3. **Vérifier** : RPE se met à jour automatiquement ≈ 9.0

### Test 3 : RPE Réel indépendant
1. Remplir RPE Réel = 7.0
2. **Vérifier** : RPE Prescrit et Poids ne changent pas
3. **Vérifier** : RPE Réel reste 7.0 après sauvegarde

### Test 4 : Changement de Reps
1. Changer Reps de 5 à 3
2. **Vérifier** : Poids recalculé (plus lourd car moins de reps)
3. **Vérifier** : RPE Prescrit reste inchangé

## Fichiers modifiés

- ✅ `src/components/coach/WeekEditor.tsx`
  - Ajout `actual_rpe` dans interface `Set`
  - Ajout `personalRecords` state
  - Fonction `calculateWeightFromRPE`
  - Fonction `calculateRPEFromWeight`
  - Logique intelligente dans `handleUpdateSet`
  - Bannière d'information pour blocs de force
  - Champ "RPE Réel" avec fond ambre
  - Champ "RPE Prescrit" renommé pour clarté

- ✅ `src/app/dashboard/coach/athletes/[id]/blocks/[blockId]/weeks/[weekId]/page.tsx`
  - Déjà sélectionne `actual_rpe` dans la requête

## Améliorations futures possibles

1. **Indicateur visuel de calcul** : Spinner pendant le calcul automatique
2. **Historique des ajustements** : Log des modifications auto vs manuelles
3. **Suggestions intelligentes** : "Poids recommandé basé sur historique"
4. **Alertes de surcharge** : Si RPE réel >> RPE prescrit sur plusieurs séries
5. **Export des données** : Comparaison prescrit vs réel sur plusieurs semaines
6. **Graphiques** : Visualisation de l'évolution RPE prescrit vs réel

## Support

En cas de problème :
1. Vérifier que des PR existent pour l'exercice
2. Vérifier l'orthographe exacte du nom d'exercice
3. Vérifier que `rpe_table` contient 264 entrées
4. Vérifier que `block_type = 'force'`
5. Consulter la console navigateur pour erreurs SQL
