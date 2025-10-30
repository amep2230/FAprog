# 🚀 Installation du Système de Blocs

## Étape 1 : Exécuter le Script SQL

1. Ouvrez votre projet Supabase : https://supabase.com/dashboard
2. Allez dans **SQL Editor**
3. Créez une nouvelle requête
4. Copiez/collez le contenu complet du fichier `supabase/add-training-blocks.sql`
5. Cliquez sur **Run** (ou Ctrl+Enter)
6. Vérifiez qu'il n'y a pas d'erreurs

## Étape 2 : Vérifier les Tables

Dans **Table Editor**, vous devriez voir :
- ✅ `training_blocks` (nouvelle table)
- ✅ `programs` (avec nouvelle colonne `block_id`)

## Étape 3 : Tester l'Application

### En tant que Coach :

1. **Créer un bloc** :
   ```
   Dashboard Coach → Sélectionner un athlète → "Gérer les blocs" → "Nouveau bloc"
   ```
   - Nom : "Bloc Hypertrophie 1"
   - Description : "Focus volume et technique"
   - Marquer comme actif
   - Cliquer sur "Créer le bloc"

2. **Créer la première semaine** :
   
   Option A - Via un programme existant :
   ```
   Retour → "Créer un programme" → Créer une semaine complète classique
   ```
   
   Option B - Via le bloc :
   ```
   Ouvrir le bloc → "Ajouter une semaine" → ...
   ```
   ⚠️ Vous aurez besoin d'une semaine existante pour dupliquer

3. **Ajouter une 2e semaine** :
   ```
   Ouvrir le bloc → "Ajouter une semaine"
   - Semaine : 2
   - Nom : "Intensification"
   - Dupliquer la structure de : "Semaine 1"
   - Cliquer sur "Créer la semaine"
   ```

4. **Modifier la semaine 2** :
   - L'éditeur s'ouvre automatiquement
   - Vous voyez les valeurs de la semaine 1 en gris
   - Ajustez les RPE et charges
   - Ajoutez/supprimez/modifiez les exercices
   - Cliquez sur "Enregistrer"

## Étape 4 : Vérifications

### ✅ Blocs triés correctement ?
- Les blocs les plus récents doivent apparaître en haut
- Dans le sélecteur de semaines, la plus récente doit être en haut

### ✅ Duplication fonctionne ?
- Nouvelle semaine contient tous les exercices de la précédente
- RPE = 0
- Charges = vide
- Instructions copiées

### ✅ Valeurs précédentes affichées ?
- Dans l'éditeur de semaine 2
- Sous chaque champ (RPE, Reps, Charge)
- En texte gris : "Précédent: [valeur]"

### ✅ Modification d'exercices ?
- Bouton "+" pour ajouter
- Bouton corbeille (rouge) pour supprimer
- Dropdown pour changer l'exercice
- Tous les champs éditables

## 🐛 Dépannage

### Erreur "Aucune semaine disponible" lors de l'ajout de semaine
**Solution** : Créez d'abord une semaine complète via "Créer un programme" standard, puis revenez au bloc.

### Les valeurs précédentes ne s'affichent pas
**Vérification** :
1. Assurez-vous que la semaine n-1 existe
2. Vérifiez que les exercices correspondent (même exercise_id)
3. Vérifiez que les sessions ont le même day_of_week

### Le tri ne fonctionne pas
**Vérification** :
- Vider le cache du navigateur (Ctrl+Shift+R)
- Vérifier que `created_at` est bien rempli dans la base de données

### Erreur lors de la sauvegarde
**Vérification** :
1. Ouvrir la console du navigateur (F12)
2. Regarder les erreurs dans l'onglet "Console"
3. Vérifier les permissions RLS dans Supabase

## 📝 Notes Importantes

1. **Un seul bloc actif** : Marquer un bloc comme actif désactive automatiquement les autres

2. **Numéros de semaine** : Peuvent être modifiés manuellement (pas forcément consécutifs)

3. **Suppression** : Supprimer un bloc supprime toutes ses semaines (CASCADE)

4. **RLS** : Les coachs ne voient que leurs propres blocs et ceux de leurs athlètes

## 🎯 Workflow Recommandé

```
Semaine 1 : Créer bloc → Créer programme standard → Lier au bloc
Semaine 2 : Ouvrir bloc → Ajouter semaine → Dupliquer S1 → Modifier
Semaine 3 : Ouvrir bloc → Ajouter semaine → Dupliquer S2 → Modifier
...
```

## 🔗 Ressources

- Documentation complète : `BLOCKS_SYSTEM.md`
- Schéma SQL : `supabase/add-training-blocks.sql`
- Code source : `src/components/coach/Block*.tsx`

---

**Besoin d'aide ?** Consultez `BLOCKS_SYSTEM.md` pour plus de détails techniques.
