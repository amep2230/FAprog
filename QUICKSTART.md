# Guide de Démarrage Rapide - PowerCoach

Ce guide vous accompagne pas à pas pour mettre en place l'application.

## ⚡ Installation Express (5 minutes)

### Étape 1 : Installation des dépendances

```bash
npm install
```

### Étape 2 : Configuration Supabase

1. **Créer un compte sur [Supabase](https://supabase.com)**

2. **Créer un nouveau projet** :
   - Nom : `powercoach`
   - Mot de passe base de données : (choisissez un mot de passe fort)
   - Région : (choisissez la plus proche de vous)

3. **Récupérer les clés** :
   - Allez dans `Settings` → `API`
   - Copiez `Project URL` et `anon public`

4. **Configurer les variables d'environnement** :

```bash
# Copier le fichier d'exemple
cp .env.local.example .env.local

# Éditer .env.local avec vos valeurs
```

Exemple de `.env.local` :
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Étape 3 : Initialiser la base de données

Dans le dashboard Supabase :

1. **Allez dans `SQL Editor`**
2. **Cliquez sur `New Query`**
3. **Exécutez les fichiers dans cet ordre** :

#### a. Schema principal (copier/coller le contenu de `supabase/schema.sql`)

```sql
-- Copiez tout le contenu de supabase/schema.sql et exécutez
```

#### b. Table RPE (copier/coller le contenu de `supabase/seed-rpe.sql`)

```sql
-- Copiez tout le contenu de supabase/seed-rpe.sql et exécutez
```

#### c. Exercices de base (copier/coller le contenu de `supabase/seed-exercises.sql`)

```sql
-- Copiez tout le contenu de supabase/seed-exercises.sql et exécutez
```

### Étape 4 : Lancer l'application

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000)

## 🎉 Premiers Pas

### 1. Créer un compte Coach

1. Allez sur http://localhost:3000
2. Vous serez redirigé vers `/login`
3. Cliquez sur "Pas de compte ? S'inscrire"
4. Remplissez le formulaire :
   - Nom : `Votre nom`
   - Email : `coach@test.com`
   - Mot de passe : `test123`
   - Rôle : Sélectionnez **Coach**
5. Cliquez sur "Créer mon compte"

### 2. Ajouter un Athlète

1. Sur le dashboard coach, cliquez sur "Ajouter un athlète"
2. Remplissez :
   - Nom : `John Doe`
   - Email : `athlete@test.com`
   - Mot de passe temporaire : `test123`
3. Cliquez sur "Ajouter"

### 3. Créer un Programme (À venir)

1. Cliquez sur "Créer un programme" sur la fiche de l'athlète
2. Remplissez les informations du programme
3. Ajoutez des séances et des exercices

## 🔧 Résolution de Problèmes

### Problème : "Cannot connect to Supabase"

**Solution** :
- Vérifiez que vos clés dans `.env.local` sont correctes
- Vérifiez que vous avez bien redémarré le serveur après modification de `.env.local`

### Problème : "Relation does not exist"

**Solution** :
- Vérifiez que vous avez bien exécuté `schema.sql`
- Allez dans `Table Editor` sur Supabase pour vérifier que les tables existent

### Problème : "Row Level Security policy violation"

**Solution** :
- Les policies RLS sont créées dans `schema.sql`
- Vérifiez que vous êtes bien connecté
- Vérifiez que votre profil a le bon rôle (coach/athlete)

## 📚 Ressources

- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)

## 🚀 Déploiement sur Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel

# Configurer les variables d'environnement sur Vercel
# Settings → Environment Variables
# Ajoutez les mêmes valeurs que .env.local
```

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez la console du navigateur (F12)
2. Vérifiez les logs Supabase (Authentication & Logs)
3. Vérifiez que toutes les étapes ont été suivies

---

**Prêt à commencer ? Lancez `npm run dev` ! 🏋️**
