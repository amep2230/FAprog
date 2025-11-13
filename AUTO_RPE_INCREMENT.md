:# Fonctionnalité d'Auto-Incrémentation RPE pour les Blocs de Force

## Vue d'ensemble

Pour les blocs de type "force", une nouvelle fonctionnalité permet de créer automatiquement des semaines d'entraînement en se basant sur la **semaine 1** avec une progression automatique du RPE.

## Principe

### Création de Nouvelles Semaines
- **Semaine de référence** : Toujours la semaine 1
- **Structure copiée** : Sessions, exercices, nombre de répétitions, repos, tempo
- **RPE progressif** : Augmentation automatique selon des paramètres configurables
- **Calcul de charge** : Poids calculé automatiquement depuis la table `rpe_table`

### Paramètres du Bloc

Chaque bloc de force possède 3 paramètres configurables :

| Paramètre | Colonne | Valeur par défaut | Description |
|-----------|---------|-------------------|-------------|
| **Incrément faible** | `rpe_increment_low` | 1.0 | Augmentation RPE si RPE semaine N-1 < seuil |
| **Incrément élevé** | `rpe_increment_high` | 0.5 | Augmentation RPE si RPE semaine N-1 ≥ seuil |
| **Seuil** | `rpe_threshold` | 6.0 | Seuil pour choisir l'incrément |

### Logique d'Incrémentation

```
Si RPE_semaine_précédente < rpe_threshold :
    Nouveau RPE = RPE_semaine_précédente + rpe_increment_low
Sinon :
    Nouveau RPE = RPE_semaine_précédente + rpe_increment_high

Maximum : RPE ne peut pas dépasser 12.5
```

### Exemple de Progression

Avec les paramètres par défaut (seuil = 6.0, faible = 1.0, élevé = 0.5) :

| Semaine | RPE initial | Incrément appliqué | Nouveau RPE |
|---------|-------------|-------------------|-------------|
| 1       | 5.0         | -                 | 5.0         |
| 2       | 5.0         | +1.0 (< 6)       | 6.0         |
| 3       | 6.0         | +0.5 (≥ 6)       | 6.5         |
| 4       | 6.5         | +0.5 (≥ 6)       | 7.0         |
| 5       | 7.0         | +0.5 (≥ 6)       | 7.5         |

## Calcul Automatique de la Charge

### Processus

1. **Récupération du pourcentage** : Depuis `rpe_table` avec le nouveau RPE et les répétitions
2. **Récupération du PR** : 1RM de l'athlète pour l'exercice concerné
3. **Calcul du poids** : `Poids = (1RM × Pourcentage) / 100`

### Table RPE

La table `rpe_table` contient les correspondances :
- Nombre de répétitions (1-12)
- RPE (0 à 12.5, par incréments de 0.2 ou 0.5)
- Pourcentage du 1RM

### Exemple de Calcul

**Données :**
- Exercice : Squat
- 1RM athlète : 150 kg
- Semaine 1 : 5 reps @ RPE 7
- Semaine 2 : 5 reps @ RPE 8 (auto-incrémenté)

**Calcul semaine 2 :**
```sql
-- Récupération du pourcentage pour 5 reps @ RPE 8
SELECT percentage_of_1rm FROM rpe_table 
WHERE reps = 5 AND rpe = 8.0
-- Résultat : 81.1%

-- Calcul du poids
Poids = 150 kg × 81.1% = 121.65 kg
```

## Utilisation

### SQL : Créer une nouvelle semaine

```sql
-- Créer la semaine 4 pour un bloc donné
SELECT create_week_from_week_one(
  'uuid-du-bloc',
  4,
  'Semaine 4 - Intensification'
);
```

### Fonction PostgreSQL

La fonction `create_week_from_week_one` :
- Vérifie que c'est bien un bloc de force
- Vérifie que la semaine 1 existe
- Copie toutes les sessions et sets de la semaine 1
- Calcule le RPE incrémenté pour chaque set
- Calcule le poids correspondant depuis `rpe_table`
- Retourne l'UUID de la nouvelle semaine créée

## Fichiers SQL

### Migration des Paramètres
**Fichier** : `supabase/add-rpe-increment-params.sql`

Ajoute les 3 colonnes de paramétrage à `training_blocks` :
- `rpe_increment_low` (DECIMAL 3,1, défaut 1.0)
- `rpe_increment_high` (DECIMAL 3,1, défaut 0.5)
- `rpe_threshold` (DECIMAL 3,1, défaut 6.0)

### Fonction de Création
**Fichier** : `supabase/create-week-from-week-one-function.sql`

Définit la fonction PostgreSQL `create_week_from_week_one` qui gère :
1. Validation du bloc (doit être de type 'force')
2. Copie de la structure de la semaine 1
3. Calcul RPE progressif
4. Calcul automatique des charges

### Table RPE Mise à Jour
**Fichier** : `supabase/update-rpe-table.sql`

Met à jour la table `rpe_table` avec les nouvelles données complètes incluant :
- RPE de 0 à 12.5
- Répétitions de 1 à 12
- Pourcentages précis

## Ordre d'Exécution des Scripts

```bash
# 1. Ajouter les paramètres RPE aux blocs
psql < supabase/add-rpe-increment-params.sql

# 2. Mettre à jour la table RPE
psql < supabase/update-rpe-table.sql

# 3. Créer la fonction de génération de semaine
psql < supabase/create-week-from-week-one-function.sql
```

## Avantages

✅ **Gain de temps** : Plus besoin de créer manuellement chaque semaine
✅ **Cohérence** : Structure identique basée sur la semaine 1
✅ **Progression automatique** : RPE augmente intelligemment
✅ **Charges calculées** : Poids automatiquement ajustés selon le RPE
✅ **Personnalisable** : Paramètres adaptables par bloc
✅ **Sécurisé** : RPE plafonné à 12.5 maximum

## Limitations

⚠️ **Blocs de force uniquement** : Ne s'applique pas aux blocs généraux
⚠️ **Besoin d'un PR** : Requiert un 1RM enregistré pour calculer les charges
⚠️ **Semaine 1 requise** : La semaine 1 doit exister pour servir de référence

## Évolutions Futures

- [ ] Interface UI pour configurer les paramètres RPE du bloc
- [ ] Bouton "Créer semaine suivante" dans l'interface
- [ ] Visualisation de la progression RPE prévue
- [ ] Export de la planification complète
- [ ] Gestion des décharges (deload) automatiques
