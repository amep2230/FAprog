# 🏆 Gestion des Records Personnels (PRs)

## ✅ Fonctionnalités implémentées

### 1. **Ajout de PRs** - Les deux rôles peuvent ajouter des PRs

#### Pour les Athlètes
- **Où** : Dashboard athlète (`/dashboard/athlete`)
- **Bouton** : "Ajouter un PR" en haut à droite
- **Permissions** : L'athlète peut uniquement ajouter ses propres PRs

#### Pour les Coachs
- **Où** : Page profil athlète (`/dashboard/coach/athletes/[id]`)
- **Bouton** : "Ajouter un PR" dans le header, à côté de "Créer un programme"
- **Permissions** : Le coach peut ajouter des PRs pour tous ses athlètes

### 2. **Modal d'ajout de PR**

**Champs du formulaire** :
- ✅ **Exercice** (obligatoire) - Liste déroulante de tous les 113 exercices
- ✅ **Poids** (obligatoire) - En kilogrammes, avec incréments de 0.5 kg
- ✅ **Date** (obligatoire) - Date du PR (ne peut pas être dans le futur)
- ✅ **Notes** (optionnel) - Ex: "Avec ceinture", "Pause 2s", etc.

**Validation** :
- Tous les champs requis doivent être remplis
- Le poids doit être positif
- La date ne peut pas être dans le futur

### 3. **Affichage des PRs**

#### Vue principale (Tableau)
- **Exercice** : Nom de l'exercice
- **Record actuel** : Meilleur poids en kg
- **Date** : Quand le PR a été établi
- **Progression** : 
  - 🟢 Flèche montante verte si amélioration
  - 🔴 Flèche descendante rouge si régression
  - ⚪ Trait gris si premier PR ou identique
  - Affiche la différence en kg et en %
- **Notes** : Notes optionnelles

#### Historique détaillé (par exercice)
- Tous les PRs pour chaque exercice
- Trié par date (plus récent en premier)
- Badge "Actuel" sur le PR le plus récent

### 4. **API Route** (`/api/personal-records`)

#### POST - Créer un PR
```typescript
Body: {
  athlete_id: string,
  exercise_id: string,
  weight: number,
  date: string,
  notes?: string
}
```

**Sécurité** :
- Vérification de l'authentification
- L'athlète peut créer ses propres PRs
- Le coach peut créer des PRs pour ses athlètes uniquement

#### GET - Récupérer les PRs
```typescript
Query params: {
  athlete_id: string (required),
  exercise_id?: string (optional - filtrer par exercice)
}
```

**Sécurité** :
- Même règle que POST : athlète ou son coach

---

## 🗂️ Structure des fichiers

```
src/
├── app/
│   ├── dashboard/
│   │   ├── athlete/
│   │   │   └── page.tsx              ← Récupère PRs + exercices
│   │   └── coach/
│   │       └── athletes/
│   │           └── [id]/
│   │               └── page.tsx      ← Récupère PRs + exercices
│   └── api/
│       └── personal-records/
│           └── route.ts              ← POST/GET API
└── components/
    ├── athlete/
    │   └── AthleteDashboard.tsx      ← Affiche PRHistory + bouton PR
    ├── coach/
    │   └── AthleteProfileView.tsx    ← Affiche PRHistory + bouton PR
    └── shared/
        ├── AddPRDialog.tsx           ← Modal pour ajouter un PR
        └── PRHistory.tsx             ← Affichage historique PRs
```

---

## 🔄 Flux complet

### 1. L'athlète ajoute un PR
1. Dashboard athlète → Clic "Ajouter un PR"
2. Modal s'ouvre avec formulaire
3. Sélection de l'exercice dans la liste déroulante (113 exercices triés alphabétiquement)
4. Saisie du poids (ex: 150 kg)
5. Sélection de la date
6. Ajout de notes optionnelles (ex: "Sans ceinture")
7. Clic "Enregistrer"
8. Appel à `/api/personal-records` (POST)
9. Page se rafraîchit automatiquement
10. Le nouveau PR apparaît dans la section "Records Personnels"

### 2. Le coach ajoute un PR pour son athlète
1. Page profil athlète → Clic "Ajouter un PR"
2. Même processus que ci-dessus
3. Le PR est créé pour l'athlète sélectionné
4. Visible par l'athlète ET le coach

---

## 📊 Calcul de la progression

La progression est calculée entre le PR actuel (le plus récent) et le PR précédent :

```typescript
const latest = prs[0].weight;      // Ex: 150 kg
const previous = prs[1].weight;    // Ex: 145 kg
const diff = latest - previous;    // 5 kg
const percentage = (diff / previous) * 100;  // 3.4%

// Résultat affiché : +5kg (+3.4%) avec flèche verte montante
```

### Cas particuliers :
- **Premier PR** : Affiche "Premier PR" au lieu d'une progression
- **Aucun PR** : Message "Aucun record personnel enregistré"
- **Régression** : Flèche rouge descendante avec valeurs négatives

---

## 🎨 Interface utilisateur

### Composant AddPRDialog
- **Design** : Modal centré avec overlay semi-transparent
- **Taille** : max-w-md (medium width)
- **Icône** : 🏆 Trophy en jaune (#FFD700)
- **Formulaire** :
  - Select avec recherche pour les exercices
  - Input number avec step 0.5
  - Input date avec max=today
  - Input text pour les notes

### Composant PRHistory
- **Tableau principal** : Table shadcn/ui responsive
- **Cards historiques** : Une card par exercice avec fond gris clair
- **Couleurs** :
  - Progression positive : Vert (#10B981)
  - Progression négative : Rouge (#EF4444)
  - Neutre : Gris (#9CA3AF)
  - Badge "Actuel" : Jaune (#FCD34D)

---

## 🔒 Sécurité

### Row Level Security (RLS)
Les policies RLS sur la table `personal_records` permettent :
- ✅ Un athlète peut voir/créer ses propres PRs
- ✅ Un coach peut voir/créer les PRs de ses athlètes
- ❌ Un athlète ne peut pas voir les PRs d'un autre athlète
- ❌ Un coach ne peut pas voir les PRs des athlètes d'un autre coach

### Validation API
- Vérification de l'authentification (JWT Supabase)
- Vérification des permissions (athlete_id vs user.id ou coach_id)
- Validation des types de données
- Empêche les dates futures
- Empêche les poids négatifs

---

## 🧪 Tester le système

### En tant qu'athlète :
1. Se connecter avec un compte athlète
2. Aller sur le dashboard
3. Cliquer sur "Ajouter un PR"
4. Remplir le formulaire :
   - Exercice : "Squat"
   - Poids : 150
   - Date : Aujourd'hui
   - Notes : "Premier test"
5. Enregistrer
6. Vérifier que le PR apparaît dans la section "Records Personnels"

### En tant que coach :
1. Se connecter avec un compte coach
2. Aller sur le profil d'un athlète
3. Cliquer sur "Ajouter un PR" (dans le header)
4. Remplir le formulaire
5. Enregistrer
6. Vérifier que le PR apparaît dans la section PRs de la page

### Tester la progression :
1. Ajouter un premier PR (ex: 100 kg)
2. Ajouter un second PR avec un poids supérieur (ex: 105 kg)
3. Vérifier l'affichage : "+5kg (+5.0%)" avec flèche verte
4. Ajouter un troisième PR avec un poids inférieur (ex: 103 kg)
5. Vérifier l'affichage : "-2kg (-1.9%)" avec flèche rouge

---

## 📦 Dépendances utilisées

- **@radix-ui/react-dialog** : Modal système
- **@radix-ui/react-select** : Select déroulant
- **lucide-react** : Icônes (Trophy, TrendingUp, TrendingDown, Minus)
- **shadcn/ui** : Components (Dialog, Select, Table, Card, Button)

---

## 🚀 Améliorations futures possibles

### 1. **Graphiques de progression**
- Courbe d'évolution du PR sur chaque exercice
- Comparaison entre plusieurs exercices
- Tendances sur 3/6/12 mois

### 2. **Notifications**
- Alerte quand un athlète bat un PR
- Rappel pour tester un PR (tous les X mois)
- Félicitations automatiques

### 3. **Calculateurs**
- Estimateur de 1RM à partir d'un max à X reps
- Calculateur Wilks/IPF Points
- Prédiction de progression

### 4. **Export/Partage**
- Export CSV des PRs
- PDF avec graphiques
- Partage sur les réseaux sociaux

### 5. **Classement**
- Top 10 des athlètes d'un coach
- Comparaison avec standards internationaux
- Badges et achievements

---

## ✅ État actuel

**Toutes les fonctionnalités sont implémentées et fonctionnelles !**

- ✅ Les athlètes peuvent ajouter leurs PRs
- ✅ Les coachs peuvent ajouter des PRs pour leurs athlètes
- ✅ Affichage de l'historique avec progression
- ✅ API sécurisée avec RLS
- ✅ Interface intuitive et responsive
- ✅ Validation des données côté client et serveur

L'application permet maintenant un suivi complet des performances avec :
- 📋 Programmes personnalisés
- 📝 Logging des séances
- 📊 Statistiques détaillées
- 🏆 Gestion des records personnels

**Tout fonctionne ! 🎉**
