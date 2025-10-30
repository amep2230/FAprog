# 🧪 Guide de Test - Vue Hebdomadaire

## ✅ Checklist de Test Rapide

### 1. Prérequis
- [ ] Serveur dev running sur localhost:3002
- [ ] Scripts SQL exécutés (voir ORDRE_SCRIPTS_SQL.md)
- [ ] Au moins 1 athlète en base
- [ ] Au moins 1 programme avec sessions/sets assigné à l'athlète

### 2. Test Basique - Affichage

**Étapes** :
1. Se connecter en tant qu'athlète
2. Vérifier dashboard affiche :
   - [ ] Stats cards (3 cartes en haut)
   - [ ] Section "Programme de la semaine"
   - [ ] Cards pour chaque séance du programme
   - [ ] Tables Excel-style avec toutes les séries

**Résultat attendu** : Tout le programme de la semaine visible sans navigation

### 3. Test Logging - Séance Non Complétée

**Étapes** :
1. Identifier une séance NON complétée (bordure grise)
2. Cliquer bouton "Logger" (bleu)
3. Vérifier modal s'ouvre avec :
   - [ ] Nom de la séance correct
   - [ ] Formulaire wellness (fatigue, stress, etc.)
   - [ ] Liste de toutes les séries à logger
4. Remplir le formulaire :
   - [ ] Wellness scores
   - [ ] Pour chaque série : poids réalisé, reps
5. Cliquer "Valider et enregistrer"
6. Vérifier :
   - [ ] Modal se ferme
   - [ ] Page se rafraîchit
   - [ ] Card de la séance devient VERTE
   - [ ] Icône CheckCircle verte apparaît
   - [ ] Date de complétion affichée
   - [ ] Bouton change en "Re-logger"

**Résultat attendu** : Séance marquée comme complétée avec indicateurs visuels

### 4. Test Re-Logging

**Étapes** :
1. Sur une séance COMPLÉTÉE (bordure verte)
2. Cliquer bouton "Re-logger" (outline)
3. Vérifier modal s'ouvre normalement
4. Modifier quelques valeurs
5. Valider
6. Vérifier que la séance reste verte (nouvelle date de complétion)

**Résultat attendu** : Possibilité de re-logger une séance déjà faite

### 5. Test Auto PR Detection

**Étapes** :
1. Logger une séance avec de BONNES performances :
   - Poids plus élevé que d'habitude
   - Ou plus de reps qu'avant
2. Valider le formulaire
3. Vérifier notification PR :
   - [ ] Card jaune apparaît avec Trophy icon
   - [ ] Liste des nouveaux PRs affichée
   - [ ] Estimé 1RM calculé
   - [ ] Card disparaît après 3 secondes

**Résultat attendu** : PRs automatiquement détectés et notifiés

### 6. Test Responsive - Mobile

**Étapes** :
1. Ouvrir DevTools (F12)
2. Activer mode responsive (Ctrl+Shift+M)
3. Sélectionner iPhone/Android
4. Vérifier :
   - [ ] Stats cards s'empilent verticalement
   - [ ] Tables ont scroll horizontal
   - [ ] Boutons restent visibles
   - [ ] Texte reste lisible

**Résultat attendu** : Interface adaptée au mobile

### 7. Test Cas Limites

#### Cas 1 : Aucun Programme
**Étapes** :
1. Utiliser un athlète SANS programme assigné
2. Vérifier :
   - [ ] Pas de section "Programme de la semaine"
   - [ ] Message "Aucun programme" dans section "Tous mes programmes"

#### Cas 2 : Plusieurs Programmes
**Étapes** :
1. Créer 2-3 programmes pour l'athlète
2. Vérifier :
   - [ ] Section "Programme de la semaine" affiche le PLUS RÉCENT
   - [ ] Section "Tous mes programmes" liste TOUS les programmes

#### Cas 3 : Programme Sans Séances
**Étapes** :
1. Créer un programme SANS séances
2. Vérifier :
   - [ ] Section "Programme de la semaine" visible mais vide
   - [ ] Pas d'erreur JS

#### Cas 4 : Séance Avec Notes
**Étapes** :
1. Programme avec session ayant des notes
2. Vérifier :
   - [ ] Notes affichées en bas de la table
   - [ ] Fond jaune avec bordure gauche
   - [ ] Icône ou label "Note :"

## 🐛 Bugs Connus à Vérifier

### Bug Potentiel 1 : Refresh Après Logging
**Symptôme** : Card ne devient pas verte immédiatement
**Solution** : `window.location.reload()` dans `handleCloseLogger`
**Test** :
- [ ] Vérifier que refresh se déclenche
- [ ] Vérifier que nouvelles données s'affichent

### Bug Potentiel 2 : Tri des Sessions
**Symptôme** : Sessions dans le mauvais ordre
**Solution** : Sort par `day_of_week`
**Test** :
- [ ] Créer programme avec sessions : Mercredi (3), Lundi (1), Vendredi (5)
- [ ] Vérifier ordre : Lundi, Mercredi, Vendredi

### Bug Potentiel 3 : Logs Multiples Même Séance
**Symptôme** : Plusieurs logs pour même séance, lequel afficher ?
**Solution** : Actuellement prend le plus récent (premier dans query)
**Test** :
- [ ] Logger 2 fois la même séance
- [ ] Vérifier que date affichée = dernière complétion

## 📊 Données de Test Recommandées

### Programme Type pour Tests

**Programme** : "Semaine Test"
- Week: 1
- Athlète: votre_athlète_test

**Session 1** : "Lundi - Squat" (day_of_week = 1)
- Set 1 : Squat, 5 reps, RPE 7, 140kg
- Set 2 : Squat, 5 reps, RPE 8, 150kg
- Set 3 : Front Squat, 8 reps, RPE 7, 100kg

**Session 2** : "Mercredi - Bench" (day_of_week = 3)
- Set 1 : Bench Press, 5 reps, RPE 7, 110kg
- Set 2 : Bench Press, 5 reps, RPE 8, 115kg
- Set 3 : Incline Press, 10 reps, RPE 8, 32kg

**Session 3** : "Vendredi - Deadlift" (day_of_week = 5)
- Set 1 : Deadlift, 5 reps, RPE 7, 180kg
- Set 2 : Deadlift, 5 reps, RPE 8, 190kg
- Set 3 : Romanian DL, 8 reps, RPE 8, 140kg

**Session 4** : "Samedi - Accessoires" (day_of_week = 6)
- Set 1 : Dips, 12 reps, RPE 8, BW+10kg
- Set 2 : Pull-ups, 10 reps, RPE 8, BW

### Script SQL pour Créer Données Test

```sql
-- Créer le programme
INSERT INTO programs (name, week_number, athlete_id, coach_id)
VALUES ('Programme Test Semaine', 1, 'ATHLETE_ID', 'COACH_ID')
RETURNING id; -- noter l'ID

-- Créer sessions (remplacer PROGRAM_ID)
INSERT INTO sessions (program_id, name, day_of_week, notes)
VALUES 
  ('PROGRAM_ID', 'Lundi - Squat', 1, 'Focus sur la technique'),
  ('PROGRAM_ID', 'Mercredi - Bench', 3, NULL),
  ('PROGRAM_ID', 'Vendredi - Deadlift', 5, 'Attention au dos'),
  ('PROGRAM_ID', 'Samedi - Accessoires', 6, NULL)
RETURNING id; -- noter les IDs

-- Créer sets pour chaque session (remplacer SESSION_ID et EXERCISE_ID)
-- Session Lundi Squat
INSERT INTO sets (session_id, exercise_id, set_order, reps, rpe, prescribed_weight, instructions)
VALUES
  ('SESSION1_ID', 'SQUAT_EXERCISE_ID', 1, 5, 7, 140, 'Tempo 3-0-1'),
  ('SESSION1_ID', 'SQUAT_EXERCISE_ID', 2, 5, 8, 150, 'Tempo 3-0-1'),
  ('SESSION1_ID', 'FRONT_SQUAT_EXERCISE_ID', 1, 8, 7, 100, 'Pause 2s');

-- Répéter pour les autres sessions...
```

## 📸 Captures d'Écran à Faire

Pour documentation/feedback :
1. [ ] Dashboard avec programme semaine visible
2. [ ] Séance non complétée (bordure grise)
3. [ ] Séance complétée (bordure verte, date)
4. [ ] Modal de logging ouvert
5. [ ] Notification PR (card jaune)
6. [ ] Vue mobile avec scroll horizontal
7. [ ] Section "Tous mes programmes" en bas

## ⏱️ Performance à Vérifier

### Temps de Chargement
**Test** :
1. Ouvrir DevTools → Network
2. Rafraîchir dashboard athlète
3. Vérifier :
   - [ ] Temps total < 2 secondes
   - [ ] Requête programs avec relations < 1 seconde
   - [ ] Requête session_logs < 500ms

### Optimisations Possibles
Si lent :
- Ajouter index sur `programs.athlete_id`
- Ajouter index sur `session_logs.athlete_id`
- Limiter nombre de programmes chargés (`.limit(1)` déjà fait)

## ✅ Checklist Finale Avant Production

- [ ] Tous les tests ci-dessus passent
- [ ] Aucune erreur console JavaScript
- [ ] Aucune erreur TypeScript
- [ ] Design cohérent sur desktop/mobile
- [ ] Auto PR detection fonctionne
- [ ] Refresh après logging fonctionne
- [ ] Indicateurs visuels corrects (vert/gris)
- [ ] Performance acceptable (< 2s chargement)
- [ ] Documentation à jour
- [ ] Coach testé et approuvé l'UX
- [ ] Athlète test confirmé que c'est mieux qu'avant

## 🎯 Test d'Acceptation Utilisateur

### Scénario Réel
1. Coach crée un nouveau programme avec 4 séances
2. Assigne à un athlète
3. Athlète se connecte
4. **Vérifie** : Voit immédiatement tout le programme
5. Athlète clique "Logger" sur séance du jour
6. **Vérifie** : Modal s'ouvre sans délai
7. Athlète remplit et valide
8. **Vérifie** : Card devient verte, date affichée
9. **Vérifie** : Si PR détecté, notification apparaît
10. Athlète consulte son profil
11. **Vérifie** : Nouveaux PRs dans l'historique

### Questions à Poser à l'Athlète
1. Est-ce plus rapide qu'avant ?
2. Est-ce plus clair qu'avant ?
3. Le format Excel-style est-il familier ?
4. Manque-t-il quelque chose ?
5. Y a-t-il trop d'informations affichées ?

## 🚀 Déploiement

### Avant de Déployer
- [ ] Exécuter scripts SQL sur prod (voir ORDRE_SCRIPTS_SQL.md)
- [ ] Backup de la base de données
- [ ] Vérifier variables d'environnement
- [ ] Test complet sur environnement staging

### Après Déploiement
- [ ] Vérifier que l'app charge (smoke test)
- [ ] Tester avec 1 athlète réel
- [ ] Monitorer erreurs (Sentry ou logs)
- [ ] Collecter feedback premiers utilisateurs

## 📝 Notes de Test

**Date du test** : _______________

**Testeur** : _______________

**Résultats** :
- Tests passés : ___ / ___
- Bugs trouvés : ___ (lister ci-dessous)
- Performance : ⭐⭐⭐⭐⭐

**Bugs trouvés** :
1. ___________________________________
2. ___________________________________
3. ___________________________________

**Améliorations suggérées** :
1. ___________________________________
2. ___________________________________
3. ___________________________________

**Verdict final** : ✅ Prêt pour prod / ⚠️ Corrections mineures / ❌ Corrections majeures
