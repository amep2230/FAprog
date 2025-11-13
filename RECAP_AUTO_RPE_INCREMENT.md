# Récapitulatif : Auto-Incrémentation RPE pour Blocs de Force

## 📋 Résumé

Implémentation d'un système d'auto-incrémentation du RPE pour les blocs de force, permettant de créer automatiquement des semaines d'entraînement basées sur la semaine 1 avec progression automatique du RPE et calcul des charges.

## ✅ Fichiers Créés

### 1. **`supabase/add-rpe-increment-params.sql`**
Migration ajoutant 3 paramètres configurables aux blocs :
- `rpe_increment_low` : Incrément si RPE < seuil (défaut: 1.0)
- `rpe_increment_high` : Incrément si RPE ≥ seuil (défaut: 0.5)
- `rpe_threshold` : Seuil pour choisir l'incrément (défaut: 6.0)

### 2. **`supabase/create-week-from-week-one-function.sql`**
Fonction PostgreSQL `create_week_from_week_one()` qui :
- Copie la structure de la semaine 1
- Calcule le RPE incrémenté selon les paramètres du bloc
- Calcule automatiquement les charges via `rpe_table`
- Utilise les PR de l'athlète pour le calcul

### 3. **`supabase/update-rpe-table.sql`**
Mise à jour complète de la table RPE avec :
- RPE de 0 à 12.5 (nouvelles valeurs : 12.5, 12, 11.5, 11, 10.5, etc.)
- Répétitions de 1 à 12
- Pourcentages précis selon le tableau fourni

### 4. **`AUTO_RPE_INCREMENT.md`**
Documentation complète de la fonctionnalité :
- Principe et logique d'incrémentation
- Exemples de progression
- Calcul automatique des charges
- Guide d'utilisation
- Avantages et limitations

## ✅ Fichiers Modifiés

### 1. **`src/lib/types.ts`**
Ajout des types TypeScript :
- `TrainingBlock` avec les nouveaux champs RPE
- `TrainingWeek`
- `TrainingSession`
- `TrainingSet`

## 🎯 Fonctionnalités Implémentées

### 1. Paramètres Configurables par Bloc
```typescript
interface TrainingBlock {
  rpe_increment_low?: number;   // Défaut: 1.0
  rpe_increment_high?: number;  // Défaut: 0.5
  rpe_threshold?: number;       // Défaut: 6.0
}
```

### 2. Logique d'Incrémentation Intelligente
```
Si RPE(N-1) < threshold:
    RPE(N) = RPE(N-1) + rpe_increment_low
Sinon:
    RPE(N) = RPE(N-1) + rpe_increment_high
```

### 3. Calcul Automatique des Charges
```
Poids = (1RM × Pourcentage_RPE_Table) / 100
```

### 4. Fonction SQL Complète
```sql
SELECT create_week_from_week_one(
  'block-uuid',
  week_number,
  'Nom de la semaine'
);
```

## 📊 Exemple de Progression

**Bloc avec paramètres par défaut :**

| Semaine | RPE Semaine 1 | Incrément | Nouveau RPE | Charge @ 5 reps | Note |
|---------|---------------|-----------|-------------|-----------------|------|
| 1       | 5.0           | -         | 5.0         | 78.6% 1RM       | Base |
| 2       | 5.0           | +1.0      | 6.0         | 74.1% 1RM       | < 6  |
| 3       | 6.0           | +0.5      | 6.5         | 77.4% 1RM       | ≥ 6  |
| 4       | 6.5           | +0.5      | 7.0         | 78.6% 1RM       | ≥ 6  |
| 5       | 7.0           | +0.5      | 7.5         | 79.9% 1RM       | ≥ 6  |
| 6       | 7.5           | +0.5      | 8.0         | 81.1% 1RM       | ≥ 6  |

## 🔄 Ordre d'Exécution des Migrations

```bash
# Dans l'interface Supabase SQL Editor ou via CLI

# 1. Ajouter les paramètres RPE aux blocs
-- Exécuter: supabase/add-rpe-increment-params.sql

# 2. Mettre à jour la table RPE avec les nouvelles données
-- Exécuter: supabase/update-rpe-table.sql

# 3. Créer la fonction de génération automatique
-- Exécuter: supabase/create-week-from-week-one-function.sql
```

## 💡 Utilisation

### SQL Direct
```sql
-- Créer la semaine 4 automatiquement
SELECT create_week_from_week_one(
  '7dcf9547-cdc7-457f-be61-7c77b42c91ee',
  4,
  'Semaine 4 - Intensification'
);
```

### Futur : Interface UI (À Implémenter)
```typescript
// Bouton dans BlockDetailView.tsx
<Button onClick={() => handleCreateNextWeek()}>
  Créer semaine suivante (Auto RPE)
</Button>
```

## 🎨 Prochaines Étapes (Interface UI)

### 1. Formulaire de Configuration du Bloc
- [ ] Champs pour `rpe_increment_low`, `rpe_increment_high`, `rpe_threshold`
- [ ] Validation des valeurs (0-5 pour incréments, 0-12.5 pour seuil)
- [ ] Prévisualisation de la progression

### 2. Bouton Création Automatique
- [ ] Bouton "Créer semaine suivante" dans `BlockDetailView`
- [ ] Appel de la fonction PostgreSQL via API
- [ ] Indication de la progression RPE prévue

### 3. Visualisation
- [ ] Graphique de progression RPE planifiée
- [ ] Tableau récapitulatif des charges calculées
- [ ] Indicateurs de charge de travail (volume, intensité)

## ✨ Avantages

1. **Gain de temps** : Création automatique des semaines
2. **Cohérence** : Même structure pour toutes les semaines
3. **Progression intelligente** : RPE adapté au niveau de difficulté
4. **Charges optimisées** : Calcul précis basé sur les PR
5. **Flexible** : Paramètres personnalisables par bloc
6. **Sécurisé** : Plafonnement à RPE 12.5

## ⚠️ Limitations Actuelles

1. Uniquement pour les blocs de type "force"
2. Nécessite un PR (1RM) enregistré pour chaque exercice
3. La semaine 1 doit obligatoirement exister
4. Pas d'interface UI (utilisation SQL uniquement pour l'instant)
5. Pas de gestion automatique des deloads

## 📝 Notes Techniques

### Validation des Données
- RPE limité entre 0 et 12.5
- Incréments limités entre 0 et 5
- Seuil limité entre 0 et 12.5

### Gestion des Erreurs
- Exception si le bloc n'est pas de type "force"
- Exception si la semaine 1 n'existe pas
- Exception si la semaine à créer existe déjà

### Performance
- Index sur `rpe_table(reps, rpe)` pour recherche rapide
- Fonction `SECURITY DEFINER` pour permissions
- Transactions atomiques pour cohérence

## 📚 Documentation Complète

Voir **`AUTO_RPE_INCREMENT.md`** pour la documentation détaillée incluant :
- Explication complète du principe
- Exemples de calculs
- Guide d'utilisation
- Schémas de progression
- Cas d'usage avancés
