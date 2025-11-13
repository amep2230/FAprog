# Guide Rapide : Auto-Incrémentation RPE

## 🚀 Installation (Ordre Important)

### 1. Ajouter les paramètres RPE aux blocs
```sql
-- Copier et exécuter : supabase/add-rpe-increment-params.sql
```

### 2. Mettre à jour la table RPE
```sql
-- Copier et exécuter : supabase/update-rpe-table.sql
```

### 3. Créer la fonction de génération
```sql
-- Copier et exécuter : supabase/create-week-from-week-one-function.sql
```

## 📖 Utilisation

### Créer une nouvelle semaine automatiquement

```sql
-- Exemple : Créer la semaine 5 pour un bloc
SELECT create_week_from_week_one(
  'UUID_DU_BLOC',        -- Remplacer par l'UUID du bloc
  5,                      -- Numéro de la semaine à créer
  'Semaine 5 - Peak'      -- Nom optionnel (null par défaut)
);
```

## ⚙️ Configuration du Bloc (Optionnel)

Par défaut, chaque bloc de force utilise :
- **Seuil RPE** : 6.0
- **Incrément faible** : 1.0 (si RPE < 6.0)
- **Incrément élevé** : 0.5 (si RPE ≥ 6.0)

### Modifier les paramètres d'un bloc

```sql
UPDATE training_blocks
SET 
  rpe_threshold = 7.0,        -- Changer le seuil
  rpe_increment_low = 1.5,    -- Augmentation si < seuil
  rpe_increment_high = 0.5    -- Augmentation si ≥ seuil
WHERE id = 'UUID_DU_BLOC';
```

## 📊 Exemples de Progression

### Progression Standard (Défaut)
```
Paramètres : seuil=6.0, faible=1.0, élevé=0.5

Semaine 1 : RPE 5.0
Semaine 2 : RPE 6.0  (+1.0)
Semaine 3 : RPE 6.5  (+0.5)
Semaine 4 : RPE 7.0  (+0.5)
Semaine 5 : RPE 7.5  (+0.5)
```

### Progression Agressive
```
Paramètres : seuil=7.0, faible=1.5, élevé=1.0

Semaine 1 : RPE 5.0
Semaine 2 : RPE 6.5  (+1.5)
Semaine 3 : RPE 8.0  (+1.5)
Semaine 4 : RPE 9.0  (+1.0)
Semaine 5 : RPE 10.0 (+1.0)
```

### Progression Conservatrice
```
Paramètres : seuil=6.0, faible=0.5, élevé=0.2

Semaine 1 : RPE 6.0
Semaine 2 : RPE 6.2  (+0.2)
Semaine 3 : RPE 6.4  (+0.2)
Semaine 4 : RPE 6.6  (+0.2)
Semaine 5 : RPE 6.8  (+0.2)
```

## 💡 Cas d'Usage

### 1. Créer un bloc de 8 semaines

```sql
-- D'abord, créer manuellement la semaine 1 via l'interface

-- Puis, générer les semaines 2 à 8 automatiquement
SELECT create_week_from_week_one('UUID_BLOC', 2, 'Semaine 2');
SELECT create_week_from_week_one('UUID_BLOC', 3, 'Semaine 3');
SELECT create_week_from_week_one('UUID_BLOC', 4, 'Semaine 4');
SELECT create_week_from_week_one('UUID_BLOC', 5, 'Semaine 5');
SELECT create_week_from_week_one('UUID_BLOC', 6, 'Semaine 6');
SELECT create_week_from_week_one('UUID_BLOC', 7, 'Semaine 7 - Deload');
SELECT create_week_from_week_one('UUID_BLOC', 8, 'Semaine 8 - Test');
```

### 2. Créer semaine avec deload

```sql
-- Créer la semaine normalement
SELECT create_week_from_week_one('UUID_BLOC', 7, 'Semaine 7 - Deload');

-- Puis réduire manuellement le RPE de 20-30%
UPDATE sets
SET rpe = rpe * 0.7
WHERE session_id IN (
  SELECT id FROM sessions 
  WHERE week_id = (
    SELECT id FROM training_weeks 
    WHERE block_id = 'UUID_BLOC' AND week_number = 7
  )
);
```

## 🔍 Vérifications

### Voir les paramètres d'un bloc
```sql
SELECT 
  name,
  block_type,
  rpe_threshold,
  rpe_increment_low,
  rpe_increment_high
FROM training_blocks
WHERE id = 'UUID_DU_BLOC';
```

### Voir la progression RPE d'un bloc
```sql
SELECT 
  tw.week_number,
  tw.name,
  s.exercise_name,
  s.reps,
  s.rpe,
  s.weight
FROM training_weeks tw
JOIN sessions sess ON sess.week_id = tw.id
JOIN sets s ON s.session_id = sess.id
WHERE tw.block_id = 'UUID_DU_BLOC'
ORDER BY tw.week_number, sess.session_number, s.set_number;
```

## ⚠️ Important

1. **La semaine 1 doit exister** avant de créer d'autres semaines
2. **Uniquement pour blocs de force** (block_type = 'force')
3. **Les PR doivent être enregistrés** pour le calcul automatique des charges
4. **RPE maximum : 12.5** (plafond automatique)

## 🐛 Dépannage

### Erreur : "La semaine 1 n'existe pas"
➜ Créez d'abord la semaine 1 manuellement via l'interface

### Erreur : "La semaine X existe déjà"
➜ La semaine que vous tentez de créer existe déjà

### Erreur : "Cette fonction ne peut être utilisée que pour les blocs de force"
➜ Vérifiez que `block_type = 'force'` pour ce bloc

### Les poids ne sont pas calculés
➜ Vérifiez que l'athlète a un PR (1RM) enregistré pour cet exercice

## 📞 Support

Pour plus d'informations, consultez :
- **Documentation complète** : `AUTO_RPE_INCREMENT.md`
- **Récapitulatif** : `RECAP_AUTO_RPE_INCREMENT.md`
