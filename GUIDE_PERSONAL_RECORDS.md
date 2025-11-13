# 📊 Gestion des Personal Records (PR)

## 🎯 Objectif
Permettre aux athlètes et aux coachs de gérer les Personal Records pour calculer automatiquement les charges d'entraînement lors de la création de nouvelles semaines.

---

## ✅ Ce qui a été implémenté

### 1️⃣ **Composant Principal** : `PersonalRecordsManager`
**Fichier** : `src/components/athlete/PersonalRecordsManager.tsx`

**Fonctionnalités** :
- ✅ Affichage des PR groupés par exercice
- ✅ Calcul automatique du 1RM estimé (formule de Brzycki)
- ✅ Ajout de nouveaux PR
- ✅ Modification de PR existants
- ✅ Suppression de PR
- ✅ Mise en évidence du meilleur PR par exercice

**Formule de Brzycki** :
```typescript
1RM = poids × (36 / (37 - reps))
```

**Exemples** :
- 100 kg × 5 reps → 1RM estimé = **113 kg**
- 80 kg × 8 reps → 1RM estimé = **99 kg**
- 150 kg × 1 rep → 1RM = **150 kg**

---

### 2️⃣ **Pages créées**

#### Page Athlète
**Route** : `/dashboard/athlete/personal-records`
**Fichier** : `src/app/dashboard/athlete/personal-records/page.tsx`

- Accessible depuis le bouton "Mes PR" dans le header
- Permet à l'athlète de gérer ses propres PR

#### Page Coach
**Route** : `/dashboard/coach/athletes/[athleteId]/personal-records`
**Fichier** : `src/app/dashboard/coach/athletes/[athleteId]/personal-records/page.tsx`

- Accessible depuis le bouton "Gérer les PR" dans le profil de l'athlète
- Permet au coach de gérer les PR de ses athlètes

---

### 3️⃣ **Boutons d'accès ajoutés**

#### Dashboard Athlète
**Fichier** : `src/components/athlete/AthleteDashboard.tsx`
- Bouton "Mes PR" dans le header
- Icône : `Award`

#### Profil Athlète (vue coach)
**Fichier** : `src/components/coach/AthleteProfileView.tsx`
- Bouton "Gérer les PR" à côté de "Gérer les blocs"
- Icône : `Dumbbell`

---

## 🎨 Interface Utilisateur

### Vue principale
```
┌─────────────────────────────────────────────┐
│  Personal Records             [+ Ajouter]   │
│  John Doe                                   │
├─────────────────────────────────────────────┤
│                                             │
│  Squat                          150 kg      │
│  ├─ 1RM: 150 kg                            │
│  ├─ 5 reps: 140 kg → 157 kg (estimé)      │
│  └─ 3 reps: 145 kg → 153 kg (estimé)      │
│                                             │
│  Bench Press                    110 kg      │
│  ├─ 1RM: 110 kg                            │
│  └─ 8 reps: 95 kg → 117 kg (estimé)       │
│                                             │
│  Deadlift                       175 kg      │
│  └─ 1RM: 175 kg                            │
│                                             │
└─────────────────────────────────────────────┘
```

### Dialog Ajouter/Modifier
```
┌─────────────────────────────────┐
│  Ajouter un PR           [X]    │
├─────────────────────────────────┤
│                                 │
│  Exercice *                     │
│  [Sélectionner un exercice ▼]  │
│                                 │
│  Répétitions *     Poids (kg) * │
│  [    5     ]      [   140   ]  │
│                                 │
│  ┌─────────────────────────────┐│
│  │ 1RM estimé : 157 kg        ││
│  │ Calculé avec Brzycki       ││
│  └─────────────────────────────┘│
│                                 │
│         [Annuler]  [Ajouter]   │
└─────────────────────────────────┘
```

---

## 🔗 Intégration avec l'auto-incrément RPE

### Comment ça fonctionne

1. **L'athlète ou le coach entre un PR** (ex: Squat 140kg × 5 reps)
2. **Le système calcule le 1RM estimé** (157 kg)
3. **Lors de la création de la Semaine 2** via le bouton auto-incrément :
   - Le RPE est incrémenté (ex: 5.0 → 6.0)
   - Le système cherche le % dans `rpe_table` (ex: 80.9%)
   - Le poids est calculé : `157 kg × 80.9% = 127 kg`
   - Le poids est arrondi à 2.5kg : **127.5 kg**

### Exemple complet

**Données** :
- PR : Squat 140 kg × 5 reps
- 1RM estimé : 157 kg
- Semaine 1 : RPE 5.0
- Semaine 2 : RPE 6.0 (auto-incrémenté)

**Calcul** :
```
1. 1RM estimé = 140 × (36 / (37 - 5)) = 157 kg
2. RPE 6.0 @ 3 reps = 80.9% (depuis rpe_table)
3. Poids brut = 157 × 80.9% = 127 kg
4. Arrondi 2.5kg = 127.5 kg ✅
```

---

## 📊 Structure des données

### Table `personal_records`
```sql
personal_records (
  id UUID,
  athlete_id UUID,
  exercise_id UUID,
  reps INTEGER,           -- Nombre de répétitions
  weight DECIMAL(5,2),    -- Poids soulevé
  estimated_1rm DECIMAL(5,2), -- 1RM calculé automatiquement
  created_at TIMESTAMP
)
```

### Relation avec les exercices
```sql
SELECT 
  pr.reps,
  pr.weight,
  pr.estimated_1rm,
  e.name as exercise_name
FROM personal_records pr
JOIN exercises e ON e.id = pr.exercise_id
WHERE pr.athlete_id = 'ATHLETE_ID'
ORDER BY pr.estimated_1rm DESC;
```

---

## 🧪 Tests recommandés

### Test 1 : Ajouter un PR
1. Aller sur "Mes PR" (athlète) ou "Gérer les PR" (coach)
2. Cliquer sur "Ajouter un PR"
3. Sélectionner "Squat"
4. Entrer : 5 reps, 140 kg
5. Vérifier : 1RM estimé = 157 kg
6. Cliquer "Ajouter"
7. ✅ Le PR apparaît dans la liste

### Test 2 : Modifier un PR
1. Cliquer sur l'icône "Modifier" d'un PR
2. Changer le poids : 140 kg → 145 kg
3. Vérifier : 1RM estimé = 163 kg
4. Cliquer "Mettre à jour"
5. ✅ Le PR est mis à jour

### Test 3 : Utilisation avec auto-incrément
1. Ajouter un PR : Squat 150 kg × 1 rep
2. Créer une Semaine 1 avec Squat @ RPE 5.0
3. Cliquer sur "Créer semaine suivante (auto RPE)"
4. ✅ La Semaine 2 a le poids calculé automatiquement

### Test 4 : Suppression
1. Cliquer sur l'icône "Supprimer" d'un PR
2. Confirmer la suppression
3. ✅ Le PR est supprimé

---

## 🎯 Cas d'usage

### Cas 1 : Athlète enregistre son 1RM réel
```typescript
Exercice: Squat
Reps: 1
Poids: 150 kg
→ 1RM estimé: 150 kg (réel)
```

### Cas 2 : Athlète enregistre un 5RM
```typescript
Exercice: Bench Press
Reps: 5
Poids: 100 kg
→ 1RM estimé: 113 kg
```

### Cas 3 : Plusieurs PR pour le même exercice
```typescript
Squat:
- 1 rep × 150 kg → 150 kg (meilleur)
- 3 reps × 140 kg → 147 kg
- 5 reps × 130 kg → 146 kg
→ Affiché: 150 kg
```

---

## 📚 Fichiers créés/modifiés

| Fichier | Description |
|---------|-------------|
| `src/components/athlete/PersonalRecordsManager.tsx` | Composant principal |
| `src/app/dashboard/athlete/personal-records/page.tsx` | Page athlète |
| `src/app/dashboard/coach/athletes/[athleteId]/personal-records/page.tsx` | Page coach |
| `src/components/athlete/AthleteDashboard.tsx` | Ajout bouton "Mes PR" |
| `src/components/coach/AthleteProfileView.tsx` | Ajout bouton "Gérer les PR" |
| `GUIDE_PERSONAL_RECORDS.md` | Ce document |

---

## 🔄 Workflow complet

```
1. Coach/Athlète ajoute des PR
   ↓
2. PR stockés avec 1RM estimé
   ↓
3. Création Semaine 1 manuelle
   ↓
4. Clic "Créer semaine suivante (auto RPE)"
   ↓
5. Fonction SQL récupère le 1RM estimé
   ↓
6. Calcul : (1RM × % RPE) arrondi 2.5kg
   ↓
7. Semaine 2 créée avec charges optimales ✅
```

---

## 💡 Améliorations futures possibles

- [ ] Graphique d'évolution des PR dans le temps
- [ ] Export des PR en PDF
- [ ] Historique des modifications
- [ ] Comparaison avec d'autres athlètes (anonymisée)
- [ ] Suggestions de PR basées sur les performances récentes
- [ ] Import de PR en masse (CSV)
- [ ] Calcul de différentes formules de 1RM (Epley, Lander, etc.)

---

**Date** : 6 novembre 2025  
**Version** : 1.0.0  
**Status** : ✅ PRODUCTION READY
