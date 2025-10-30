# Documentation Technique - PowerCoach

## Architecture

### Vue d'ensemble

```
┌─────────────┐
│   Client    │ (Next.js App Router)
│  (Browser)  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│    Next.js Server (Vercel)      │
│  ┌───────────────────────────┐  │
│  │  Server Components         │  │
│  │  - Fetch initial data      │  │
│  │  - SSR pages               │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │  API Routes                │  │
│  │  - /api/athletes           │  │
│  │  - /api/programs           │  │
│  │  - /api/...                │  │
│  └───────────────────────────┘  │
└───────────┬─────────────────────┘
            │
            ▼
    ┌───────────────┐
    │   Supabase    │
    │               │
    │ - PostgreSQL  │
    │ - Auth        │
    │ - RLS         │
    └───────────────┘
```

### Stack Détaillée

- **Framework** : Next.js 14+ avec App Router
- **Language** : TypeScript
- **Styling** : TailwindCSS + shadcn/ui
- **Database** : PostgreSQL (via Supabase)
- **Auth** : Supabase Auth avec RLS
- **Déploiement** : Vercel

## Structure des Dossiers

```
src/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Layout racine
│   ├── page.tsx             # Page d'accueil (redirection)
│   ├── globals.css          # Styles globaux
│   │
│   ├── login/               # Authentification
│   │   ├── page.tsx         # UI login/signup
│   │   └── actions.ts       # Server Actions
│   │
│   ├── dashboard/
│   │   ├── coach/           # Dashboard coach
│   │   │   └── page.tsx
│   │   └── athlete/         # Dashboard athlète
│   │       └── page.tsx
│   │
│   └── api/                 # API Routes
│       └── athletes/
│           └── route.ts
│
├── components/              # Composants React
│   ├── ui/                 # Composants de base (shadcn)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   └── table.tsx
│   │
│   ├── coach/              # Composants spécifiques coach
│   │   ├── CoachDashboard.tsx
│   │   ├── AthleteCard.tsx
│   │   └── AddAthleteDialog.tsx
│   │
│   └── athlete/            # Composants spécifiques athlète
│       └── AthleteDashboard.tsx
│
├── lib/                    # Librairies et utilitaires
│   ├── supabase/
│   │   ├── server.ts      # Client Supabase server
│   │   ├── client.ts      # Client Supabase browser
│   │   └── middleware.ts  # Middleware auth
│   │
│   ├── types.ts           # Types TypeScript
│   └── utils.ts           # Fonctions utilitaires
│
└── middleware.ts          # Middleware Next.js
```

## Flux de Données

### Authentification

```
1. User submits login form
   ↓
2. login() Server Action
   ↓
3. Supabase Auth (signInWithPassword)
   ↓
4. Cookie set (session)
   ↓
5. Redirect to appropriate dashboard
   ↓
6. Middleware checks auth on every request
```

### Création d'un Athlète (Coach)

```
1. Coach clicks "Ajouter athlète"
   ↓
2. Dialog opens (client component)
   ↓
3. Form submit → POST /api/athletes
   ↓
4. API Route validates user is coach
   ↓
5. Supabase Auth signUp (create user)
   ↓
6. Trigger auto-creates profile
   ↓
7. Update profile with coach_id
   ↓
8. Return new athlete data
   ↓
9. Update UI optimistically
```

## Base de Données

### Relations Clés

```sql
profiles (coach)
  ├─ has many → profiles (athletes via coach_id)
  └─ has many → programs (via coach_id)
                   └─ has many → sessions
                                  └─ has many → sets
                                                 └─ references → exercises

profiles (athlete)
  ├─ belongs to → profiles (coach via coach_id)
  ├─ has many → programs (via athlete_id)
  ├─ has many → personal_records
  └─ has many → session_logs
                  └─ has many → set_logs
```

### Indexes Importants

```sql
-- Pour les performances
idx_profiles_coach_id       -- Requêtes: liste athlètes d'un coach
idx_programs_athlete        -- Requêtes: programmes d'un athlète
idx_sessions_program        -- Requêtes: séances d'un programme
idx_sets_session           -- Requêtes: exercices d'une séance
idx_rpe_table_lookup       -- Calculs de charge
```

## Sécurité

### Row Level Security (RLS)

Toutes les tables ont RLS activé. Exemples de policies :

```sql
-- Coaches peuvent voir leurs athlètes
CREATE POLICY "Coaches can view their athletes" ON profiles
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'coach'
    ) AND coach_id = auth.uid()
  );

-- Athletes peuvent voir leurs propres programmes
CREATE POLICY "Athletes can view their programs" ON programs
  FOR SELECT USING (athlete_id = auth.uid());
```

### Protection des Routes

Le middleware vérifie l'authentification sur toutes les routes sauf :
- `/login`
- `/auth/*`
- Fichiers statiques

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}
```

## Calculs RPE

### Table de Référence

La table RPE contient 240 entrées (12 reps × 20 RPE levels) basées sur la recherche scientifique en powerlifting.

### Formule de Calcul

```typescript
// Calculer la charge à partir de 1RM, reps et RPE
function calculateWeight(oneRM: number, reps: number, rpe: number) {
  const percentage = getRPEPercentage(reps, rpe);
  return (oneRM * percentage) / 100;
}

// Example:
// 1RM = 150kg
// 5 reps @ RPE 8 = 81.1%
// Charge = 150 × 0.811 = 121.65kg
```

### Estimer le 1RM

```typescript
// Calculer 1RM estimé à partir d'une performance
function estimateOneRM(weight: number, reps: number, rpe: number) {
  const percentage = getRPEPercentage(reps, rpe);
  return (weight / percentage) * 100;
}

// Example:
// Levé : 120kg × 5 reps @ RPE 8 (81.1%)
// 1RM estimé = 120 / 0.811 = 147.97kg ≈ 148kg
```

## API Routes

### Pattern Standard

```typescript
// src/app/api/[resource]/route.ts

export async function GET(request: NextRequest) {
  // 1. Vérifier l'authentification
  const user = await getUser();
  if (!user) return 401;

  // 2. Vérifier les permissions
  const hasPermission = await checkPermission(user);
  if (!hasPermission) return 403;

  // 3. Récupérer les données
  const data = await supabase
    .from('table')
    .select('*')
    .eq('user_id', user.id);

  // 4. Retourner la réponse
  return NextResponse.json(data);
}
```

## Performance

### Server Components

Utiliser les Server Components par défaut pour :
- Fetching initial data
- SEO
- Réduire le JavaScript côté client

```tsx
// app/dashboard/coach/page.tsx
export default async function CoachPage() {
  const athletes = await getAthletes(); // Server-side
  return <CoachDashboard athletes={athletes} />;
}
```

### Client Components

Utiliser "use client" uniquement pour :
- Interactivité (onClick, onChange, etc.)
- State management (useState, useContext)
- Browser APIs

```tsx
// components/coach/AddAthleteDialog.tsx
"use client";

export default function AddAthleteDialog() {
  const [open, setOpen] = useState(false);
  // ...
}
```

## Tests (À venir)

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Type checking
npm run type-check
```

## Contribution

### Workflow Git

```bash
# Créer une branche
git checkout -b feature/nouvelle-fonctionnalite

# Commit
git commit -m "feat: ajouter création de programme"

# Push
git push origin feature/nouvelle-fonctionnalite

# Créer une Pull Request
```

### Conventions de Commit

- `feat:` nouvelle fonctionnalité
- `fix:` correction de bug
- `docs:` documentation
- `style:` formatage
- `refactor:` refactoring
- `test:` tests
- `chore:` tâches diverses

## Ressources Avancées

- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

---

**Maintenu avec ❤️ par l'équipe PowerCoach**
