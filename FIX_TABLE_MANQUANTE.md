# 🚀 SOLUTION RAPIDE - Créer la table training_blocks

## ⚠️ Erreur Actuelle

```
Could not find the table 'public.training_blocks' in the schema cache
```

**Cause** : La table `training_blocks` n'existe pas encore dans votre base de données Supabase.

**Solution** : Exécuter le script SQL (1 minute)

---

## 📋 ÉTAPES RAPIDES (Suivez exactement)

### 1️⃣ Ouvrir Supabase SQL Editor

```
https://supabase.com/dashboard
→ Sélectionner votre projet
→ Menu gauche : "SQL Editor" ⚡
→ Cliquer "New query" (en haut à droite)
```

### 2️⃣ Copier le Script SQL

**Dans VS Code** :
```
Ouvrir le fichier : supabase/add-training-blocks.sql
Ctrl+A (tout sélectionner)
Ctrl+C (copier)
```

**Ou copier ci-dessous** :

```sql
-- ============================================
-- TABLE: training_blocks
-- Blocs d'entraînement (cycles de plusieurs semaines)
-- ============================================
CREATE TABLE IF NOT EXISTS training_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_training_blocks_coach ON training_blocks(coach_id);
CREATE INDEX idx_training_blocks_athlete ON training_blocks(athlete_id);
CREATE INDEX idx_training_blocks_is_active ON training_blocks(is_active);

-- Ajouter la colonne block_id à la table programs si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'programs' AND column_name = 'block_id'
  ) THEN
    ALTER TABLE programs 
    ADD COLUMN block_id UUID REFERENCES training_blocks(id) ON DELETE CASCADE;
    
    CREATE INDEX idx_programs_block ON programs(block_id);
  END IF;
END $$;

-- Activer RLS sur training_blocks
ALTER TABLE training_blocks ENABLE ROW LEVEL SECURITY;

-- Policies pour training_blocks
DROP POLICY IF EXISTS "Coaches can view their blocks" ON training_blocks;
CREATE POLICY "Coaches can view their blocks" ON training_blocks
  FOR SELECT USING (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Athletes can view their blocks" ON training_blocks;
CREATE POLICY "Athletes can view their blocks" ON training_blocks
  FOR SELECT USING (auth.uid() = athlete_id);

DROP POLICY IF EXISTS "Coaches can manage their blocks" ON training_blocks;
CREATE POLICY "Coaches can manage their blocks" ON training_blocks
  FOR ALL USING (auth.uid() = coach_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_training_blocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS update_training_blocks_updated_at_trigger ON training_blocks;
CREATE TRIGGER update_training_blocks_updated_at_trigger
  BEFORE UPDATE ON training_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_training_blocks_updated_at();
```

### 3️⃣ Coller et Exécuter

```
Dans l'éditeur SQL Supabase :
→ Ctrl+V (coller)
→ Cliquer "Run" (ou Ctrl+Enter / Cmd+Enter)
```

### 4️⃣ Vérifier le Succès

Vous devriez voir :
```
✅ Success. No rows returned
```

Si vous voyez une erreur, lisez le message et vérifiez que vous avez bien copié TOUT le script.

### 5️⃣ Vérifier la Table

```
Menu gauche : "Table Editor"
→ Vous devriez voir "training_blocks" dans la liste
→ Cliquer dessus pour voir la structure
```

### 6️⃣ Retourner à l'Application

```
localhost:3000
→ Rafraîchir la page (F5)
→ Essayer de créer un bloc
→ ✅ Ça devrait fonctionner maintenant !
```

---

## ✅ Checklist de Vérification

Après avoir exécuté le script :

- [ ] Message "Success" affiché dans Supabase
- [ ] Table `training_blocks` visible dans Table Editor
- [ ] Table `programs` a une nouvelle colonne `block_id`
- [ ] 3 policies visibles pour `training_blocks`
- [ ] Application rafraîchie (F5)
- [ ] Création de bloc fonctionne

---

## 🎯 Test Rapide

Une fois le script exécuté :

1. **Retourner sur l'application**
   - localhost:3000
   
2. **Se connecter en tant que Coach**
   
3. **Cliquer sur un athlète**
   
4. **Cliquer sur "Gérer les blocs"**
   
5. **Cliquer sur "Nouveau bloc"**
   
6. **Remplir** :
   ```
   Nom: Test Bloc 1
   Description: Premier test
   Actif: ✓
   ```
   
7. **Cliquer "Créer le bloc"**
   
8. **✅ Succès !** Vous devriez voir le bloc créé avec un badge "Actif"

---

## 🐛 Si l'Erreur Persiste

### Vérification Rapide

Ouvrir la console du navigateur (F12) et vérifier s'il y a d'autres erreurs.

### Cache du Navigateur

```
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

### Vérifier que la Table Existe

Dans Supabase → Table Editor :
- Rechercher "training_blocks"
- Si elle n'apparaît pas, le script n'a pas été exécuté correctement

### Réexécuter le Script

Le script utilise `IF NOT EXISTS`, donc vous pouvez le relancer sans problème.

---

## 📞 Toujours Bloqué ?

1. **Vérifier les logs Supabase** :
   - Supabase Dashboard → Logs → Postgres Logs
   
2. **Vérifier les permissions** :
   - Votre compte Supabase a les droits d'admin ?
   
3. **Consulter la doc complète** :
   - Fichier : `BLOCKS_QUICK_INSTALL.md`

---

**C'est tout !** Une fois le script SQL exécuté, tout devrait fonctionner parfaitement. 🎉

**Temps estimé** : 1-2 minutes ⏱️
