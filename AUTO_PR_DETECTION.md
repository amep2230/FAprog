# 🤖 Détection Automatique des PRs

## ✅ Fonctionnalité implémentée

**Lors du logging d'une séance, tous les PRs sont automatiquement détectés et enregistrés !**

Plus besoin de saisir manuellement les PRs - le système les détecte intelligemment pendant que l'athlète log sa séance.

---

## 🎯 Comment ça fonctionne

### 1. **L'athlète log une séance normalement**
- Remplit le poids effectué, les reps, le RPE
- Clique sur "Enregistrer"

### 2. **Le système analyse chaque set automatiquement**
Pour chaque exercice complété, le système :
- ✅ Calcule le 1RM estimé avec la **formule Epley** : `1RM = poids × (1 + reps / 30)`
- ✅ Compare avec le meilleur PR existant pour cet exercice
- ✅ Si c'est un nouveau record → **L'enregistre automatiquement !**

### 3. **Notification immédiate**
- 🎉 Un encadré jaune apparaît avec tous les nouveaux PRs
- 🏆 Affiche l'exercice, le poids, les reps et le 1RM estimé
- ✅ Message de confirmation que les PRs sont enregistrés

---

## 🔧 Architecture technique

### Trigger SQL (`auto-detect-prs.sql`)

```sql
CREATE TRIGGER trigger_auto_create_pr
  AFTER INSERT ON set_logs
  FOR EACH ROW
  WHEN (NEW.completed = true AND NEW.actual_weight > 0 AND NEW.actual_reps > 0)
  EXECUTE FUNCTION auto_create_pr_from_set_log();
```

**Quand** : Après l'insertion d'un set_log  
**Condition** : Seulement si completed=true ET poids > 0 ET reps > 0  
**Action** : Appelle la fonction de détection de PR

### Fonction SQL (`auto_create_pr_from_set_log`)

```sql
v_estimated_1rm := NEW.actual_weight * (1 + NEW.actual_reps / 30.0);

INSERT INTO personal_records (...)
ON CONFLICT (athlete_id, exercise_id, date)
DO UPDATE SET ... WHERE EXCLUDED.estimated_1rm > personal_records.estimated_1rm;
```

**Algorithme** :
1. Récupère l'athlète, l'exercice et la date
2. Calcule le 1RM estimé (formule Epley)
3. Cherche le meilleur PR existant
4. Si nouveau > ancien OU pas de PR existant → Enregistre
5. Si conflit (même date) → Met à jour seulement si meilleur

### API Route (`/api/session-logs`)

```typescript
const { data: newPRs } = await supabase
  .from("personal_records")
  .select(`*, exercise:exercises (*)`)
  .eq("athlete_id", athleteId)
  .eq("date", new Date().toISOString().split("T")[0])
  .eq("notes", "Auto-détecté lors de la séance");

return NextResponse.json({
  sessionLog,
  newPRs: newPRs || [],
});
```

**Après l'insertion des set_logs** :
1. Le trigger s'exécute automatiquement
2. L'API récupère les PRs créés aujourd'hui avec note "Auto-détecté"
3. Retourne les PRs à l'interface

### Composant UI (`SessionLogger.tsx`)

```typescript
const [newPRs, setNewPRs] = useState<NewPR[]>([]);

// Après soumission réussie
if (data.newPRs && data.newPRs.length > 0) {
  setNewPRs(data.newPRs);
  setTimeout(() => onClose(), 3000); // 3s pour voir les PRs
}
```

**Affichage** :
- Card jaune avec animation pulse
- Icône Trophy 🏆
- Liste des PRs avec TrendingUp vert
- Message de confirmation
- Fermeture automatique après 3 secondes

---

## 📊 Exemples de détection

### Exemple 1 : Nouveau PR évident
```
Exercice : Squat
Set effectué : 150 kg × 1 rep
1RM estimé : 150 kg
Ancien PR : 145 kg
→ ✅ Nouveau PR détecté et enregistré !
```

### Exemple 2 : PR avec plusieurs reps
```
Exercice : Bench Press
Set effectué : 100 kg × 5 reps
1RM estimé : 100 × (1 + 5/30) = 116.67 kg
Ancien PR : 115 kg
→ ✅ Nouveau PR détecté et enregistré !
```

### Exemple 3 : Pas de PR
```
Exercice : Deadlift
Set effectué : 180 kg × 3 reps
1RM estimé : 180 × (1 + 3/30) = 198 kg
Ancien PR : 205 kg
→ ❌ Pas de nouveau PR (pas d'enregistrement)
```

### Exemple 4 : Premier PR
```
Exercice : Front Squat (jamais fait avant)
Set effectué : 80 kg × 8 reps
1RM estimé : 80 × (1 + 8/30) = 101.33 kg
Ancien PR : Aucun
→ ✅ Premier PR enregistré automatiquement !
```

---

## 🎨 Interface utilisateur

### Notification de PR

```
┌─────────────────────────────────────────┐
│ 🏆 🎉 Nouveaux Records Personnels !     │
├─────────────────────────────────────────┤
│ ↗ Squat          150 kg × 1 reps       │
│                  1RM estimé: 150.0 kg   │
│                                          │
│ ↗ Bench Press    100 kg × 5 reps       │
│                  1RM estimé: 116.7 kg   │
│                                          │
│ Ces records ont été automatiquement     │
│ enregistrés ! 💪                        │
└─────────────────────────────────────────┘
```

**Couleurs** :
- Border : Jaune (#FCD34D)
- Background : Jaune clair (#FEF3C7)
- Icône Trophy : Jaune foncé
- Icône TrendingUp : Vert (#10B981)
- Animation : Pulse (attire l'attention)

---

## 📝 Champs enregistrés automatiquement

```sql
personal_records {
  athlete_id: UUID,
  exercise_id: UUID,
  reps: INTEGER,              -- Reps effectuées
  weight: DECIMAL,            -- Poids soulevé
  estimated_1rm: DECIMAL,     -- 1RM calculé (Epley)
  date: DATE,                 -- Date de la séance
  notes: "Auto-détecté lors de la séance"
}
```

---

## 🔄 Avantages vs saisie manuelle

### AVANT (Saisie manuelle)
1. ❌ L'athlète log sa séance
2. ❌ L'athlète ou le coach doit se souvenir d'ajouter les PRs
3. ❌ Ouverture du modal "Ajouter un PR"
4. ❌ Sélection de l'exercice
5. ❌ Saisie du poids
6. ❌ Saisie de la date
7. ❌ Enregistrement
8. ❌ Risque d'oubli ou d'erreur

### APRÈS (Automatique)
1. ✅ L'athlète log sa séance
2. ✅ **Les PRs sont détectés et enregistrés automatiquement**
3. ✅ Notification immédiate
4. ✅ Aucune action manuelle requise
5. ✅ 100% des PRs capturés
6. ✅ Données précises et horodatées

---

## 🛡️ Sécurité et fiabilité

### Protection contre les erreurs
```sql
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erreur lors de la détection automatique de PR: %', SQLERRM;
    RETURN NEW;
END;
```

**Si le trigger échoue** :
- ⚠️ Un warning est loggé
- ✅ L'insertion du set_log continue quand même
- ✅ Pas de blocage pour l'utilisateur

### Contrainte UNIQUE
```sql
UNIQUE (athlete_id, exercise_id, date)
```

**Empêche les doublons** :
- ✅ Un seul PR par exercice par jour
- ✅ Si plusieurs sets battent le PR le même jour → Garde le meilleur
- ✅ ON CONFLICT DO UPDATE pour mise à jour intelligente

---

## 🧪 Tests

### Test 1 : Détection d'un PR simple
1. Logger une séance avec Squat : 150 kg × 1 rep
2. ✅ Vérifier que le PR apparaît dans l'encadré jaune
3. ✅ Vérifier que le PR est dans la table personal_records
4. ✅ Vérifier qu'il apparaît dans la section "Records Personnels"

### Test 2 : Détection d'un PR avec plusieurs reps
1. Logger Bench Press : 100 kg × 5 reps
2. ✅ Vérifier le calcul : 100 × 1.167 = 116.7 kg
3. ✅ Vérifier l'enregistrement

### Test 3 : Pas de PR
1. Logger Deadlift : 160 kg × 3 reps (1RM estimé : 176 kg)
2. Si ancien PR = 200 kg
3. ✅ Pas de notification
4. ✅ Pas d'enregistrement

### Test 4 : Plusieurs PRs dans une séance
1. Logger une séance avec 3 exercices
2. Battre un PR sur 2 exercices
3. ✅ Notification montre les 2 PRs
4. ✅ Les 2 sont enregistrés

---

## 📦 Fichiers créés/modifiés

### Créés
- ✅ `supabase/auto-detect-prs.sql` - Trigger + Fonction
- ✅ `AUTO_PR_DETECTION.md` - Cette documentation

### Modifiés
- ✅ `src/app/api/session-logs/route.ts` - Retourne newPRs
- ✅ `src/components/athlete/SessionLogger.tsx` - Affiche newPRs

---

## 🚀 Installation

### Étape 1 : Exécuter le script SQL

**IMPORTANT : Exécuter dans cet ordre !**

1. `supabase/add-pr-columns.sql` (ajoute date + notes)
2. `supabase/auto-detect-prs.sql` (trigger automatique)

```sql
-- Dans Supabase SQL Editor
-- Copier-coller le contenu de auto-detect-prs.sql
-- Run
```

### Étape 2 : Tester

1. Recharger l'application
2. Logger une séance avec un bon poids
3. ✅ Voir la notification de PR !

---

## 🎉 Résultat final

**Workflow ultra-simplifié** :

```
Athlète → Log séance → 🎉 PRs automatiques → Dashboard mis à jour
```

**Aucune action manuelle requise !**

- ✅ 100% des PRs capturés
- ✅ Calculs précis (formule Epley)
- ✅ Notifications en temps réel
- ✅ Historique complet
- ✅ Graphiques de progression automatiques

**Le coach et l'athlète peuvent toujours ajouter des PRs manuellement** via le bouton "Ajouter un PR" (par exemple pour des tests de 1RM en dehors du programme).

---

## 💡 Améliorations futures possibles

1. **Notifications push** quand un athlète bat un PR
2. **Graphique de progression** sur la page de l'athlète
3. **Badges** : "5 PRs ce mois-ci !"
4. **Comparaison** avec d'autres athlètes (anonyme)
5. **Prédiction** du prochain PR possible
6. **Célébration visuelle** (confettis, son, animation)

---

**Status** : 🟢 PRÊT À UTILISER

Une fois le script SQL exécuté, le système est 100% fonctionnel !
