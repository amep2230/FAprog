# 🚀 INSTALLATION COMPLÈTE - Système de Blocs

## ⚡ Installation Rapide (3 minutes)

### 1️⃣ Exécuter le Script SQL (2 min)

1. Ouvrir **Supabase Dashboard** : https://supabase.com/dashboard
2. Sélectionner votre projet
3. Aller dans **SQL Editor** (icône ⚡)
4. Cliquer sur **"New query"**
5. Copier tout le contenu du fichier : `supabase/add-training-blocks.sql`
6. Coller dans l'éditeur
7. Cliquer sur **"Run"** (ou Ctrl+Enter)
8. Vérifier : ✅ "Success. No rows returned"

### 2️⃣ Vérifier les Tables (30 sec)

1. Aller dans **Table Editor**
2. Vérifier que vous voyez :
   - ✅ `training_blocks` (nouvelle table)
   - ✅ `programs` → colonne `block_id` (nouvelle colonne)

### 3️⃣ L'Application est Prête ! (30 sec)

- Le serveur de développement est déjà lancé sur http://localhost:3000
- Les nouveaux fichiers sont automatiquement détectés
- Aucun redémarrage nécessaire

---

## 🧪 Test Rapide (5 minutes)

### Scénario de Test

1. **Se connecter en tant que Coach**
   - Email coach existant
   - Mot de passe

2. **Aller sur un athlète**
   - Dashboard Coach
   - Cliquer sur une carte athlète

3. **Créer un bloc**
   - Cliquer sur **"Gérer les blocs"** (nouveau bouton avec 📁)
   - Cliquer sur **"Nouveau bloc"**
   - Remplir :
     ```
     Nom: Test Bloc 1
     Description: Bloc de test
     Actif: ✓ Coché
     ```
   - Cliquer sur **"Créer le bloc"**
   - ✅ Vous devez voir le bloc apparaître avec un badge "Actif"

4. **Créer la première semaine** (2 options)

   **Option A - Via programme classique** :
   - Retour au profil athlète
   - **"Créer un programme"**
   - Créer une semaine normale avec 2-3 exercices
   - Revenir aux blocs

   **Option B - Si vous avez déjà des programmes** :
   - Ouvrir le bloc
   - **"Ajouter une semaine"**
   - Sélectionner un programme existant
   - Créer

5. **Ajouter une 2e semaine (DUPLICATION)**
   - Ouvrir le bloc
   - Cliquer sur **"Ajouter une semaine"**
   - Remplir :
     ```
     Numéro: 2
     Nom: Semaine 2
     Dupliquer la structure de: Semaine 1
     ```
   - Cliquer sur **"Créer la semaine"**
   - ✅ L'éditeur s'ouvre automatiquement

6. **Vérifier la duplication**
   - Tous les exercices de la semaine 1 sont présents
   - RPE = 0 (à remplir)
   - Charges = vide (à remplir)
   - **Sous chaque champ** : texte gris "Précédent: [valeur]"

7. **Modifier les exercices**
   - Remplir le RPE (ex: 8)
   - Remplir la charge (ex: 100)
   - Comparer avec les valeurs précédentes en gris
   - Cliquer sur **"+ Ajouter un exercice"**
   - Ajouter un exercice
   - Cliquer sur 🗑️ pour supprimer un exercice
   - Cliquer sur **"Enregistrer"**

8. **Vérifier le tri**
   - Liste des blocs : le plus récent en haut ✅
   - Sélecteur de semaines : la plus récente en haut ✅

---

## ✅ Checklist de Validation

Après l'installation, vérifiez que :

- [ ] La table `training_blocks` existe dans Supabase
- [ ] La colonne `block_id` existe dans la table `programs`
- [ ] Le bouton "Gérer les blocs" apparaît sur le profil athlète
- [ ] Vous pouvez créer un nouveau bloc
- [ ] Les blocs sont triés du plus récent au plus ancien
- [ ] Vous pouvez ajouter une semaine par duplication
- [ ] Les valeurs précédentes s'affichent en gris
- [ ] Vous pouvez modifier un exercice
- [ ] Vous pouvez supprimer un exercice
- [ ] Vous pouvez ajouter un exercice
- [ ] Le bouton "Enregistrer" fonctionne
- [ ] Le build compile sans erreurs (`npm run build`)

---

## 📁 Fichiers Créés/Modifiés

### Base de Données
```
supabase/
└── add-training-blocks.sql         (Nouveau) Script d'installation
```

### Composants
```
src/components/coach/
├── BlockManager.tsx                 (Nouveau) Gestion des blocs
├── BlockDetailView.tsx              (Nouveau) Détail d'un bloc
├── WeekEditor.tsx                   (Nouveau) Édition de semaine
└── AthleteProfileView.tsx           (Modifié) Ajout bouton blocs

src/components/ui/
└── textarea.tsx                     (Nouveau) Composant manquant
```

### Routes
```
src/app/dashboard/coach/athletes/[id]/
├── blocks/
│   ├── page.tsx                                    (Nouveau)
│   └── [blockId]/
│       ├── page.tsx                                (Nouveau)
│       └── programs/
│           └── [programId]/
│               └── page.tsx                        (Nouveau)
```

### Documentation
```
BLOCKS_GUIDE.md              Guide utilisateur rapide
BLOCKS_SYSTEM.md             Documentation technique
BLOCKS_INSTALLATION.md       Guide d'installation détaillé
BLOCKS_SUMMARY.md            Résumé de l'implémentation
BLOCKS_QUICK_INSTALL.md      Ce fichier
```

---

## 🐛 Dépannage

### Erreur SQL lors de l'exécution
**Solution** : 
- Vérifiez que vous avez copié TOUT le fichier
- Vérifiez que les tables `profiles` et `programs` existent
- Réessayez l'exécution

### Le bouton "Gérer les blocs" n'apparaît pas
**Solution** :
- Vider le cache du navigateur (Ctrl+Shift+R)
- Redémarrer le serveur dev (`npm run dev`)
- Vérifier que vous êtes sur le profil d'un athlète (pas le dashboard coach)

### "Aucune semaine disponible" lors de l'ajout
**C'est normal** : Il faut d'abord créer une semaine via "Créer un programme"

### Les valeurs précédentes ne s'affichent pas
**Vérifications** :
- La semaine n-1 existe ?
- Les exercices ont le même `exercise_id` ?
- Les séances ont le même `day_of_week` ?
- Rafraîchir la page (F5)

### Erreur TypeScript dans VS Code
**Solution** :
- Redémarrer VS Code
- Supprimer le dossier `.next` et refaire `npm run dev`

---

## 🎯 Prochaines Étapes

Après l'installation :

1. **Lire le guide utilisateur** : `BLOCKS_GUIDE.md`
2. **Créer votre premier bloc** de test
3. **Tester la duplication** de semaine
4. **Vérifier l'affichage** des valeurs précédentes
5. **Former les coachs** sur le nouveau système

---

## 📞 Support

- **Guide rapide** : `BLOCKS_GUIDE.md`
- **Documentation technique** : `BLOCKS_SYSTEM.md`
- **Installation détaillée** : `BLOCKS_INSTALLATION.md`
- **Résumé** : `BLOCKS_SUMMARY.md`

---

## 🎉 C'est Tout !

Le système de blocs est maintenant installé et fonctionnel.

**Temps d'installation** : ~3 minutes  
**Temps de test** : ~5 minutes  
**Total** : ~8 minutes

✨ **Bon entraînement !** 💪
