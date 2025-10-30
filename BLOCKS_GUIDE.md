# 🎯 Guide Rapide - Système de Blocs (Coach)

## 📋 Accéder aux Blocs

1. **Dashboard Coach** → Cliquer sur un athlète
2. Cliquer sur le bouton **"Gérer les blocs"** (icône 📁)

---

## ➕ Créer un Nouveau Bloc

1. Cliquer sur **"Nouveau bloc"**
2. Remplir :
   - **Nom** : "Bloc Hypertrophie 1", "Phase Force", etc.
   - **Description** (optionnel) : Objectifs du bloc
   - **Dates** (optionnel) : Période du bloc
   - **Actif** : Cocher si c'est le bloc en cours
3. Cliquer sur **"Créer le bloc"**

> 💡 **Tri automatique** : Les blocs les plus récents apparaissent en haut

---

## 📅 Ajouter une Semaine à un Bloc

### Première Semaine (si aucune semaine n'existe)

1. Retour → **"Créer un programme"** (méthode classique)
2. Créer une semaine complète avec tous les exercices
3. Revenir au bloc

### Semaines Suivantes (méthode recommandée)

1. Ouvrir le bloc
2. Cliquer sur **"Ajouter une semaine"**
3. Remplir :
   - **Numéro de semaine** : 2, 3, 4...
   - **Nom de la semaine** : "Intensification", "Deload"...
   - **Dupliquer la structure de** : Sélectionner la semaine précédente
4. Cliquer sur **"Créer la semaine"**

✨ **Magie** : L'éditeur s'ouvre automatiquement avec :
- Tous les exercices de la semaine précédente
- RPE et charges à 0 (à remplir)
- **Valeurs précédentes affichées en gris** pour comparaison

> 💡 **Tri automatique** : Dans le sélecteur, les semaines les plus récentes sont en haut

---

## ✏️ Modifier une Semaine

1. Ouvrir le bloc
2. Cliquer sur une semaine

### Pour chaque exercice, vous pouvez :

#### Modifier
- **Exercice** : Dropdown pour changer l'exercice
- **Répétitions** : Changer le nombre de reps
- **RPE** : Ajuster l'intensité (0-10)
- **Charge** : Kg ou % (ex: 80kg ou 75%)
- **Instructions** : Tempo, pause, etc.

#### Voir les valeurs précédentes
- Sous chaque champ, en texte gris :
  ```
  Précédent: 8 RPE
  Précédent: 100kg
  ```

#### Supprimer
- Bouton 🗑️ (corbeille rouge) à droite de l'exercice
- Confirmation demandée

#### Ajouter
- Bouton **"+ Ajouter un exercice"** en haut de chaque séance
- Remplir le formulaire :
  - Exercice (dropdown)
  - Reps, RPE, Charge
  - Instructions (optionnel)

### Sauvegarder
- Cliquer sur **"Enregistrer"** en haut à droite
- ✅ Confirmation de sauvegarde

---

## 🎨 Interface Visuelle

### Cartes de Bloc
```
┌─────────────────────────────────┐
│ Bloc Hypertrophie 1    [Actif]  │  ← Badge bleu si actif
│ Focus volume et technique        │  ← Description
│ 📅 01/01/2025 - 28/02/2025      │  ← Dates
│ 4 semaines                       │  ← Nombre de semaines
└─────────────────────────────────┘
```

### Éditeur de Semaine
```
┌─────────────────────────────────────────────────────┐
│ ℹ️ Semaine précédente disponible                    │  ← Info bleue
│   Les valeurs de la semaine 1 sont affichées        │
│   en gris pour référence                            │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Lundi - Force            [+ Ajouter un exercice]    │
├─────────────────────────────────────────────────────┤
│ #1  Squat        5 reps    8 RPE    120kg    [🗑️]  │
│     Précédent: 5 reps  7.5 RPE   115kg              │  ← Gris
│                                                      │
│ #2  Bench Press  6 reps    7 RPE    90kg     [🗑️]  │
│     Précédent: 6 reps  7 RPE     85kg               │
└─────────────────────────────────────────────────────┘
```

---

## 🔄 Workflow Typique

### Cycle de 4 semaines

```
Semaine 1 : Accumulation
  ├─ Créer le bloc "Bloc Hypertrophie"
  ├─ Créer la semaine 1 (programme classique)
  └─ Volume modéré, RPE 7-8

Semaine 2 : Intensification
  ├─ Dupliquer la semaine 1
  ├─ Voir les charges de S1 en gris
  ├─ Augmenter charges de 2.5-5kg
  └─ Augmenter RPE à 8-9

Semaine 3 : Peak
  ├─ Dupliquer la semaine 2
  ├─ Voir les charges de S2 en gris
  ├─ Augmenter encore de 2.5kg
  └─ RPE 9-10

Semaine 4 : Deload
  ├─ Dupliquer la semaine 3
  ├─ Voir les charges de S3 en gris
  ├─ RÉDUIRE les charges de 30%
  └─ RPE 6-7
```

---

## 📊 Avantages du Système

✅ **Gain de temps** : Duplication de structure en 1 clic  
✅ **Progression visible** : Voir les valeurs précédentes pour ajuster  
✅ **Flexibilité** : Modifier/Ajouter/Supprimer n'importe quel exercice  
✅ **Organisation** : Blocs triés, semaines organisées  
✅ **Historique** : Toutes les semaines conservées pour analyse  

---

## 🐛 Problèmes Fréquents

### "Aucune semaine disponible" lors de l'ajout
**Solution** : Créez d'abord une semaine via "Créer un programme"

### Les valeurs précédentes ne s'affichent pas
**Vérification** :
- La semaine n-1 existe ?
- Les exercices sont les mêmes ?
- Les jours de séance correspondent ?

### Je veux supprimer un bloc
**Attention** : Supprimer un bloc supprime TOUTES ses semaines

---

## 🎓 Astuces

💡 Utilisez des noms clairs pour les semaines : "S1 Accumulation", "S2 Intensification"  
💡 Marquez toujours un bloc comme "Actif" pour que l'athlète sache lequel suivre  
💡 Dupliquez la semaine la plus proche, pas forcément la précédente  
💡 Utilisez les instructions pour noter tempos, pauses, etc.  
💡 N'oubliez pas de cliquer sur "Enregistrer" ! 💾

---

## 📱 Navigation Rapide

```
Dashboard Coach
  → Athlète
    → Gérer les blocs
      → Nouveau bloc / Cliquer sur un bloc
        → Ajouter une semaine / Cliquer sur une semaine
          → Modifier exercices
            → Enregistrer
```

---

**Besoin d'aide ?** Consultez `BLOCKS_SYSTEM.md` pour plus de détails techniques.
