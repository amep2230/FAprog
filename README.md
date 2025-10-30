# PowerCoach - Application de Coaching Powerlifting

Application web complète pour la gestion de programmes d'entraînement en powerlifting, permettant aux coachs de créer et gérer les programmes de leurs athlètes, et aux athlètes de suivre leurs performances.

## 🎯 Fonctionnalités

### Pour les Coachs
- ✅ Gestion des athlètes (ajout, visualisation)
- � **Système de blocs d'entraînement** (cycles de plusieurs semaines)
- �📊 Création de programmes personnalisés
- � **Duplication de semaines** avec affichage des valeurs précédentes
- �📈 Suivi des performances des athlètes
- 💪 Calcul automatique des charges basé sur RPE et 1RM
- 📅 Organisation des séances par semaine
- ✏️ **Modification complète des exercices** (ajout/suppression/édition)

### Pour les Athlètes
- 📱 Consultation des programmes
- 📋 Vue hebdomadaire Excel-style du programme
- ✓ Suivi des exercices (fait/fail)
- 💬 Ajout de commentaires et ressenti (RPE)
- 📊 Historique des performances
- 📝 Journalisation complète (poids, sommeil, nutrition, etc.)
- 🏆 Détection automatique des PRs (Personal Records)

## 🛠️ Stack Technique

- **Frontend**: Next.js 14+ (App Router), TypeScript, TailwindCSS
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **UI**: shadcn/ui (composants React réutilisables)
- **Déploiement**: Vercel

## 🚀 Installation

### 1. Prérequis

- Node.js 18+ et npm/yarn/pnpm
- Un compte Supabase (gratuit)

### 2. Cloner et installer les dépendances

```bash
# Cloner le repository
git clone <votre-repo>
cd FAprog

# Installer les dépendances
npm install
```

### 3. Configuration Supabase

#### a. Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez votre `SUPABASE_URL` et `SUPABASE_ANON_KEY`

#### b. Exécuter les migrations SQL

Dans le dashboard Supabase, allez dans **SQL Editor** et exécutez dans l'ordre :

1. `supabase/schema.sql` - Création des tables et RLS
2. `supabase/seed-rpe.sql` - Table RPE de référence
3. `supabase/seed-exercises.sql` - Exercices de base
4. `supabase/add-training-blocks.sql` - **Système de blocs d'entraînement** ⭐ NOUVEAU

#### c. Configurer les variables d'environnement

Créez un fichier `.env.local` à la racine :

```bash
cp .env.local.example .env.local
```

Modifiez `.env.local` avec vos vraies valeurs :

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Lancer l'application

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000)

## 📁 Structure du Projet

```
FAprog/
├── src/
│   ├── app/                          # App Router Next.js
│   │   ├── login/                    # Page de connexion
│   │   ├── dashboard/
│   │   │   ├── coach/               # Dashboard coach
│   │   │   └── athlete/             # Dashboard athlète
│   │   └── api/                     # Routes API
│   │       └── athletes/            # CRUD athlètes
│   ├── components/                   # Composants React
│   │   ├── ui/                      # Composants UI de base
│   │   ├── coach/                   # Composants coach
│   │   └── athlete/                 # Composants athlète
│   ├── lib/                         # Utilitaires
│   │   ├── supabase/               # Clients Supabase
│   │   ├── types.ts                # Types TypeScript
│   │   └── utils.ts                # Fonctions utilitaires
│   └── middleware.ts               # Protection des routes
└── supabase/                        # SQL Schemas & Seeds
    ├── schema.sql                  # Schéma de base de données
    ├── seed-rpe.sql               # Table RPE
    └── seed-exercises.sql         # Exercices de base
```

## 🗃️ Modèle de Données

### Tables Principales

- **profiles**: Utilisateurs (coaches et athlètes)
- **exercises**: Catalogue d'exercices
- **rpe_table**: Table de référence RPE → % 1RM
- **personal_records**: Records personnels des athlètes
- **programs**: Programmes d'entraînement
- **sessions**: Séances dans un programme
- **sets**: Séries d'exercices dans une séance
- **session_logs**: Logs des séances effectuées
- **set_logs**: Logs des séries effectuées

### Relations

```
profiles (coach) ──1:N──> profiles (athletes)
                └──1:N──> programs
                            └──1:N──> sessions
                                      └──1:N──> sets
                                                  └──references──> exercises

athletes ──1:N──> session_logs
                   └──1:N──> set_logs
                              └──references──> sets
```

## 🔐 Sécurité (Row Level Security)

Toutes les tables sont protégées par RLS :

- Les **coaches** peuvent voir et gérer leurs athlètes et leurs programmes
- Les **athlètes** peuvent voir leurs propres programmes et logs
- Les **exercices** et la **table RPE** sont publics en lecture

## 📊 Calcul Automatique des Charges

L'application utilise la table RPE pour calculer automatiquement les charges :

```typescript
// Exemple de calcul
charge = 1RM × (% de 1RM selon RPE et reps) / 100

// Exemple : 1RM squat = 150kg, 5 reps @ RPE 8
// Table RPE : 5 reps @ RPE 8 = 81.1%
// Charge = 150 × 81.1 / 100 = 121.65kg ≈ 122kg
```

## 🎨 Personnalisation du Design

Les couleurs et le thème sont configurables dans :
- `tailwind.config.ts` - Configuration Tailwind
- `src/app/globals.css` - Variables CSS personnalisées

## 📝 Prochaines Étapes

Après l'installation de base, vous pouvez :

1. **Créer un compte coach** via `/login`
2. **Ajouter des athlètes** depuis le dashboard coach
3. **Créer des blocs d'entraînement** 📦 (voir `BLOCKS_QUICK_INSTALL.md`)
4. **Créer des programmes** pour vos athlètes
5. **Personnaliser les exercices** dans la base de données
6. **Déployer sur Vercel** :

```bash
vercel --prod
```

## 📦 Système de Blocs (Nouvelle Fonctionnalité)

Le système de blocs permet aux coachs de créer des cycles d'entraînement structurés :

- ✅ **Création de blocs** : Organiser les programmes par cycles (hypertrophie, force, etc.)
- ✅ **Duplication de semaines** : Copier la structure d'une semaine précédente
- ✅ **Valeurs de référence** : Voir les RPE et charges de la semaine précédente en gris
- ✅ **Tri chronologique inverse** : Les blocs et semaines les plus récents en premier
- ✅ **Modification complète** : Ajouter, modifier, supprimer des exercices librement

**Documentation complète** :
- 🚀 Installation rapide : `BLOCKS_QUICK_INSTALL.md`
- 📖 Guide utilisateur : `BLOCKS_GUIDE.md`
- 🔧 Documentation technique : `BLOCKS_SYSTEM.md`

## 🔄 Workflow de Développement

```bash
# Développement
npm run dev

# Build de production
npm run build

# Lancer en production
npm start

# Linting
npm run lint
```

## 🤝 Support

Pour toute question ou problème :
1. Vérifiez que Supabase est bien configuré
2. Vérifiez les logs dans la console navigateur
3. Vérifiez les logs Supabase (Authentication & Database)

## 📄 License

Ce projet est sous licence MIT.

---

**Bon coaching ! 💪**
