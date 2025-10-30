# ✅ Problèmes résolus

## 🌐 Problème de connexion réseau (ENOTFOUND)

### Symptôme
```
Error: getaddrinfo ENOTFOUND doiheofprwqdibkrqjiw.supabase.co
TypeError: fetch failed
```

### Cause
Problème de résolution DNS avec Node.js et IPv6 sur votre système.

### Solution appliquée
Modification du script `dev` dans `package.json` pour forcer IPv4 :
```json
"dev": "NODE_OPTIONS='--dns-result-order=ipv4first' next dev"
```

Maintenant, lancez simplement `npm run dev` et ça fonctionnera !

---

## 👥 Erreur lors de l'ajout d'athlète

### Symptôme
```
POST /api/athletes 400 Bad Request
"Cannot coerce the result to a single JSON object"
```

### Cause
Le trigger Supabase ne créait pas toujours le profil immédiatement, donc `.single()` échouait sur un résultat vide.

### Solution appliquée
Modification de `/src/app/api/athletes/route.ts` :
1. Attente de 1 seconde pour laisser le trigger s'exécuter
2. Vérification de l'existence du profil
3. Création manuelle si nécessaire
4. Meilleure gestion des erreurs

---

## 🔐 Politiques RLS (Row Level Security)

### Fichiers SQL à exécuter dans Supabase

Dans l'ordre :

1. **`fix-rls.sql`** - Corrige la récursion infinie dans les politiques
2. **`fix-trigger.sql`** - Assure que le trigger de création de profil fonctionne
3. **`create-missing-profiles.sql`** - Crée les profils pour les utilisateurs existants

### Comment exécuter dans Supabase

1. Allez sur https://doiheofprwqdibkrqjiw.supabase.co
2. Cliquez sur **SQL Editor**
3. **New Query**
4. Copiez le contenu du fichier
5. Cliquez sur **Run** (ou Ctrl+Enter)

---

## 🧪 Test complet

### 1. Démarrer l'application
```bash
npm run dev
```
L'application démarre sur http://localhost:3002 (ou 3000/3001 si disponibles)

### 2. Créer un compte Coach
- Allez sur http://localhost:3002/login
- Cliquez sur "Créer un compte"
- Remplissez :
  - Nom : John Doe
  - Email : john@example.com
  - Mot de passe : (minimum 6 caractères)
  - Rôle : Coach
- Cliquez sur "Créer un compte"

### 3. Vérifier dans Supabase
- Vérifiez dans **Authentication > Users** que l'utilisateur existe
- Vérifiez dans **Table Editor > profiles** que le profil a été créé avec `role = 'coach'`

### 4. Se connecter
- Utilisez les mêmes identifiants
- Vous devriez être redirigé vers `/dashboard/coach`

### 5. Ajouter un athlète
- Dans le dashboard coach, cliquez sur "Ajouter un athlète"
- Remplissez le formulaire
- L'athlète devrait apparaître dans la liste

---

## 📝 Notes importantes

### Confirmation par email
Par défaut, Supabase envoie un email de confirmation. Pour désactiver temporairement (développement uniquement) :

1. Allez dans Supabase Dashboard
2. **Authentication > Providers > Email**
3. Décochez "Confirm email"

### Rate limiting
Supabase limite les créations de compte à 1 par minute pour éviter le spam. Attendez 60 secondes entre chaque test de création de compte.

### Ports occupés
Si les ports 3000, 3001, 3002 sont occupés, Next.js essaiera automatiquement le port suivant.

---

## 🚀 Prochaines étapes

L'application fonctionne maintenant ! Vous pouvez :

1. ✅ Créer des comptes (coach et athlète)
2. ✅ Se connecter
3. ✅ Ajouter des athlètes en tant que coach
4. ✅ Créer des programmes d'entraînement

Les fonctionnalités à développer ensuite :
- 📊 Vue détaillée des programmes pour les athlètes
- 📝 Interface de logging des sessions
- 📈 Graphiques de progression
- 🏆 Gestion des records personnels
