# 🧪 Guide de Test - Techniques d'Intensification

## 📋 Checklist de Vérification

### Avant de commencer
- [ ] La migration SQL a été exécutée sur Supabase
- [ ] La colonne `intensification_technique` existe dans la table `sets`
- [ ] L'application a été rechargée (`npm run dev`)

---

## 🧪 Scénarios de Test

### Test 1 : Bloc "Général" affiche le Select ✅

**Étapes** :
1. Se connecter en tant que coach
2. Aller sur `Blocs d'entraînement` → sélectionner un athlète
3. Cliquer sur `Nouveau bloc`
4. Remplir le formulaire :
   - Nom : "TEST_INTENSIFICATION_GENERAL"
   - Type : **"Général"** ← Important !
   - Valider
5. Cliquer sur le bloc créé
6. Cliquer sur `Ajouter une semaine`
7. Créer une semaine avec une séance et un exercice

**Résultat attendu** :
- ✅ La ligne de série affiche le champ **"Technique d'intensification"**
- ✅ Le Select est accessible et contient les 15 techniques
- ✅ Chaque technique a sa description visible

**Capture d'écran attendue** :
```
┌──────────────────────────────────────────────────┐
│ Série 1                                          │
├──────────────────────────────────────────────────┤
│ [Reps: 5] [Poids: 100kg] [Technique ▼] [Notes]  │
└──────────────────────────────────────────────────┘
```

---

### Test 2 : Bloc "Force" N'affiche PAS le Select ❌

**Étapes** :
1. Se connecter en tant que coach
2. Aller sur `Blocs d'entraînement`
3. Cliquer sur `Nouveau bloc`
4. Remplir le formulaire :
   - Nom : "TEST_FORCE"
   - Type : **"Force"** ← Important !
   - Valider
5. Créer une semaine avec un exercice

**Résultat attendu** :
- ✅ La ligne de série affiche : `Reps | Poids | RPE Prescrit | RPE Réel | Notes`
- ❌ Le champ "Technique d'intensification" N'APPARAÎT PAS
- ✅ Les champs RPE sont toujours présents

**Capture d'écran attendue** :
```
┌────────────────────────────────────────────────────────────┐
│ Série 1                                                    │
├────────────────────────────────────────────────────────────┤
│ [Reps] [Poids] [RPE Prescrit] [RPE Réel] [Notes]          │
│  [5]   [100kg]  [8.0]         [8.0]     [Notes...]        │
└────────────────────────────────────────────────────────────┘
```

---

### Test 3 : Sélection d'une technique et sauvegarde

**Étapes** :
1. Être sur un bloc "Général" avec une série
2. Cliquer sur le Select "Technique d'intensification"
3. Sélectionner **"Drop Set"** dans la liste
4. Attendre 1-2 secondes (sauvegarde automatique)
5. Recharger la page (F5 ou Ctrl+R)

**Résultat attendu** :
- ✅ Le Select affiche la description : "Baisser la charge après l'échec et continuer la série"
- ✅ Après sauvegarde, le sélectionneur reste sur "Drop Set"
- ✅ Après rechargement, la technique "Drop Set" est toujours sélectionnée

---

### Test 4 : Tester toutes les 15 techniques

**Étapes** :
1. Créer 5 séries dans une même séance (ou utiliser plusieurs séries)
2. Pour chaque série, sélectionner une technique différente :
   - Série 1 : Drop Set
   - Série 2 : Rest-Pause
   - Série 3 : Superset
   - Série 4 : Giant Set
   - Série 5 : Pré-fatigue
3. Sauvegarder et recharger

**Résultat attendu** :
- ✅ Les 5 techniques sont correctement sauvegardées
- ✅ Chaque technique conserve sa valeur après rechargement
- ✅ Les descriptions s'affichent dans le dropdown

---

### Test 5 : "Aucune" technique (sélection vide)

**Étapes** :
1. Sélectionner une technique (ex: "Drop Set")
2. Cliquer à nouveau sur le Select
3. Sélectionner **"Aucune"** (première option)
4. Sauvegarder et recharger

**Résultat attendu** :
- ✅ Le Select affiche "Sélectionner une technique..."
- ✅ La valeur en base est `NULL` ou vide
- ✅ Après rechargement, le Select reste vide

---

### Test 6 : Vérification en Base de Données

**Étapes** :
1. Exécuter cette requête SQL dans Supabase SQL Editor :
```sql
SELECT 
  s.id,
  s.exercise_id,
  s.set_order,
  s.intensification_technique
FROM sets s
WHERE s.intensification_technique IS NOT NULL
LIMIT 10;
```

**Résultat attendu** :
- ✅ Les séries que vous avez modifiées apparaissent avec leur technique
- ✅ Les colonnes sont : `id`, `exercise_id`, `set_order`, `intensification_technique`
- ✅ Les valeurs correspondent à vos sélections (ex: "drop-set", "rest-pause", etc.)

---

### Test 7 : Edition d'une technique existante

**Étapes** :
1. Retourner sur une série avec une technique sélectionnée
2. Cliquer sur le Select
3. Choisir une AUTRE technique (ex: Rest-Pause à la place de Drop Set)
4. Vérifier la sauvegarde

**Résultat attendu** :
- ✅ La technique se change sans erreur
- ✅ La nouvelle technique est sauvegardée
- ✅ Après rechargement, la nouvelle technique s'affiche

---

### Test 8 : Performances - Pas de lag au changement

**Étapes** :
1. Créer 20 séries dans une même semaine
2. Changer rapidement les techniques de plusieurs séries
3. Mesurer le temps de réponse

**Résultat attendu** :
- ✅ Pas de lag visible
- ✅ Chaque changement se sauvegarde en < 1 seconde
- ✅ L'UI reste réactive

---

## 🐛 Dépannage

### Le Select n'apparaît pas

**Problèmes possibles** :
1. ❌ C'est un bloc "Force", pas "Général"
   - **Solution** : Créer un nouveau bloc de type "Général"

2. ❌ La migration SQL n'a pas été exécutée
   - **Solution** : Aller sur Supabase SQL Editor et exécuter le script

3. ❌ L'application n'a pas été rechargée
   - **Solution** : `npm run dev` ou recharger la page (F5)

4. ❌ Erreur dans le composant
   - **Solution** : Vérifier la console du navigateur (F12 → Console) pour les erreurs

### Erreur à la sauvegarde

**Message possible** : `"column intensification_technique does not exist"`

**Solution** :
1. Vérifier que la migration SQL a été exécutée
2. Exécuter cette requête pour vérifier :
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'sets' AND column_name = 'intensification_technique';
```
3. Si elle n'existe pas, exécuter `supabase/add-intensification-technique.sql`

### Les descriptions ne s'affichent pas

**Vérifier** :
1. Le fichier `src/lib/intensification-techniques.ts` existe
2. Le fichier contient toutes les 15 techniques
3. Chaque technique a un `name` et une `description`

---

## 📊 Résumé des Résultats

Après tous les tests, remplir ce formulaire :

```
Test 1 : Bloc "Général" affiche le Select        [✅/❌]
Test 2 : Bloc "Force" n'affiche pas le Select    [✅/❌]
Test 3 : Sélection et sauvegarde                 [✅/❌]
Test 4 : Les 15 techniques fonctionnent          [✅/❌]
Test 5 : Option "Aucune" fonctionne             [✅/❌]
Test 6 : Vérification en base de données         [✅/❌]
Test 7 : Edition d'une technique                [✅/❌]
Test 8 : Performances acceptables               [✅/❌]

Nombre de tests réussis : __/8
```

---

## ✅ Points de Contrôle Finaux

- [ ] Migration SQL exécutée
- [ ] Colonne `intensification_technique` présente en base
- [ ] Composant `IntensificationTechniqueSelect` importé dans WeekEditor
- [ ] Select visible uniquement pour blocs "Général"
- [ ] Les 15 techniques sont disponibles
- [ ] Descriptions visibles dans le dropdown
- [ ] Sauvegarde automatique fonctionne
- [ ] Les données persistent après rechargement
- [ ] Aucune erreur console

---

**Documentation** : Voir `INTENSIFICATION_TECHNIQUES.md`
**Status** : ✅ Prêt pour les tests
**Date** : 13 Novembre 2025
