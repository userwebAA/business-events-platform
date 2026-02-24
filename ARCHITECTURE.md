# 🏗️ Architecture de la Plateforme

## Vue d'ensemble

Cette plateforme utilise une **architecture monorepo** pour partager du code entre les applications web et mobile.

```
business-events-platform/
├── apps/
│   ├── web/          # Application Next.js
│   └── mobile/       # Application React Native (Expo)
├── packages/
│   └── shared/       # Code partagé (types, validation)
└── package.json      # Configuration workspace
```

## 📱 Applications

### Web (`apps/web`)

**Framework** : Next.js 14 (App Router)

**Structure** :
```
apps/web/
├── src/
│   └── app/
│       ├── api/              # Routes API
│       │   ├── events/       # CRUD événements
│       │   ├── registrations/# Gestion inscriptions
│       │   └── create-payment-intent/  # Stripe
│       ├── events/
│       │   ├── page.tsx      # Liste événements
│       │   ├── create/       # Création événement
│       │   └── [id]/         # Détails + inscription
│       ├── layout.tsx        # Layout racine
│       ├── page.tsx          # Page d'accueil
│       └── globals.css       # Styles globaux
├── public/                   # Assets statiques
├── tailwind.config.ts        # Config Tailwind
├── next.config.js            # Config Next.js
└── package.json
```

**Technologies** :
- **Next.js 14** : Framework React avec App Router
- **TypeScript** : Typage statique
- **Tailwind CSS** : Styling utilitaire
- **React Hook Form** : Gestion des formulaires
- **Zod** : Validation de schémas
- **Stripe** : Paiements
- **Lucide React** : Icônes
- **date-fns** : Manipulation de dates

### Mobile (`apps/mobile`)

**Framework** : React Native avec Expo

**Structure** :
```
apps/mobile/
├── app/
│   ├── _layout.tsx           # Layout navigation
│   ├── index.tsx             # Écran d'accueil
│   └── events/
│       └── index.tsx         # Liste événements
├── assets/                   # Images, icônes
├── app.json                  # Config Expo
├── babel.config.js           # Config Babel
├── metro.config.js           # Config Metro bundler
└── package.json
```

**Technologies** :
- **Expo** : Plateforme React Native
- **Expo Router** : Navigation basée sur les fichiers
- **React Native** : Framework mobile
- **TypeScript** : Typage statique

## 📦 Package Partagé (`packages/shared`)

**Objectif** : Partager types et validation entre web et mobile

**Structure** :
```
packages/shared/
├── types/
│   └── index.ts              # Interfaces TypeScript
├── validation/
│   └── index.ts              # Schémas Zod
├── index.ts                  # Exports
└── package.json
```

**Exports** :
- **Types** : `User`, `Event`, `Registration`, `Payment`, `RegistrationField`
- **Validation** : `userSchema`, `eventSchema`, `registrationSchema`
- **Constantes** : `DEFAULT_REGISTRATION_FIELDS`

## 🔄 Flux de données

### Création d'événement

```
1. Utilisateur remplit le formulaire
   ↓
2. Validation côté client (Zod)
   ↓
3. POST /api/events
   ↓
4. Validation côté serveur
   ↓
5. Stockage (actuellement en mémoire)
   ↓
6. Redirection vers la page événement
```

### Inscription à un événement

```
1. Utilisateur accède à /events/[id]/register
   ↓
2. Chargement des champs personnalisés
   ↓
3. Remplissage du formulaire
   ↓
4. Si payant : Création Payment Intent (Stripe)
   ↓
5. Validation et soumission
   ↓
6. POST /api/registrations
   ↓
7. Confirmation d'inscription
```

## 🗄️ Stockage des données (actuel)

**Mode** : En mémoire (mock)

Les données sont stockées dans des tableaux en mémoire :
- `apps/web/src/app/api/events/route.ts` : `mockEvents[]`
- `apps/web/src/app/api/registrations/route.ts` : `mockRegistrations[]`

⚠️ **Les données sont perdues au redémarrage du serveur**

## 🔐 Sécurité

### Variables d'environnement

**Web** (`.env.local`) :
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

- `NEXT_PUBLIC_*` : Exposées au client
- Sans préfixe : Serveur uniquement

### Validation

**Double validation** :
1. **Client** : React Hook Form + Zod (UX rapide)
2. **Serveur** : Zod (sécurité)

## 🎨 Styling

### Web

**Tailwind CSS** avec configuration personnalisée :
- Palette de couleurs : `primary`, `secondary`, `accent`
- Mode sombre supporté
- Classes utilitaires

### Mobile

**StyleSheet React Native** :
- Styles inline
- Pas de CSS, uniquement JavaScript
- Responsive avec Dimensions API

## 🔌 API Routes (Next.js)

### GET /api/events
Liste tous les événements

**Query params** :
- `type` : `free` | `paid` | `all`

### GET /api/events/[id]
Détails d'un événement

### POST /api/events
Créer un événement

**Body** : `EventSchema`

### PUT /api/events/[id]
Modifier un événement

### DELETE /api/events/[id]
Supprimer un événement

### POST /api/registrations
Créer une inscription

**Body** : `RegistrationSchema`

### GET /api/registrations?eventId=[id]
Liste des inscriptions pour un événement

### POST /api/create-payment-intent
Créer un Payment Intent Stripe

**Body** :
```json
{
  "amount": 5000,
  "eventId": "1"
}
```

## 🚀 Évolutions futures

### Phase 2 : Base de données

**Stack recommandée** :
- **PostgreSQL** : Base de données relationnelle
- **Prisma** : ORM TypeScript
- **Supabase** ou **Neon** : Hébergement PostgreSQL

**Schéma** :
```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  name          String
  events        Event[]
  registrations Registration[]
}

model Event {
  id              String   @id @default(uuid())
  title           String
  description     String
  date            DateTime
  location        String
  isPaid          Boolean
  price           Float?
  maxParticipants Int?
  imageUrl        String?
  organizerId     String
  organizer       User     @relation(fields: [organizerId], references: [id])
  registrations   Registration[]
  customFields    Json
}

model Registration {
  id        String   @id @default(uuid())
  eventId   String
  event     Event    @relation(fields: [eventId], references: [id])
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  formData  Json
  paymentId String?
  createdAt DateTime @default(now())
}
```

### Phase 3 : Authentification

**Stack recommandée** :
- **NextAuth.js** : Authentification Next.js
- **Providers** : Google, Email, Credentials
- **Session** : JWT ou Database

### Phase 4 : Upload de fichiers

**Stack recommandée** :
- **Cloudinary** : Images et médias
- **AWS S3** : Stockage fichiers
- **UploadThing** : Upload simple Next.js

### Phase 5 : Notifications

**Stack recommandée** :
- **Resend** ou **SendGrid** : Emails transactionnels
- **Expo Notifications** : Push notifications mobile
- **Socket.io** : Notifications temps réel

### Phase 6 : Analytics

**Stack recommandée** :
- **Vercel Analytics** : Analytics web
- **Posthog** : Product analytics
- **Stripe Dashboard** : Analytics paiements

## 🧪 Tests (à implémenter)

### Tests unitaires
- **Vitest** : Tests rapides
- **React Testing Library** : Tests composants

### Tests E2E
- **Playwright** : Tests web
- **Detox** : Tests mobile

### Tests API
- **Supertest** : Tests routes API

## 📊 Performance

### Web
- **Next.js ISR** : Régénération incrémentale
- **Image Optimization** : Next.js Image
- **Code Splitting** : Automatique avec Next.js

### Mobile
- **Lazy Loading** : Chargement différé
- **Memoization** : React.memo, useMemo
- **FlatList** : Listes optimisées

## 🌍 Déploiement

### Web
**Recommandé** : Vercel (créateurs de Next.js)
- Deploy automatique depuis Git
- Preview deployments
- Edge Functions

**Alternatives** :
- Netlify
- AWS Amplify
- Railway

### Mobile
**Expo Application Services (EAS)** :
```bash
eas build --platform ios
eas build --platform android
eas submit
```

### Base de données
- **Supabase** : PostgreSQL hébergé
- **PlanetScale** : MySQL serverless
- **Neon** : PostgreSQL serverless

## 📝 Conventions de code

### Nommage
- **Composants** : PascalCase (`EventCard.tsx`)
- **Fonctions** : camelCase (`fetchEvents()`)
- **Types** : PascalCase (`Event`, `User`)
- **Constantes** : UPPER_SNAKE_CASE (`DEFAULT_FIELDS`)

### Structure des fichiers
- Un composant par fichier
- Co-location des styles et tests
- Index files pour exports groupés

### Git
- **Branches** : `feature/`, `fix/`, `chore/`
- **Commits** : Conventional Commits
  - `feat:` Nouvelle fonctionnalité
  - `fix:` Correction de bug
  - `docs:` Documentation
  - `style:` Formatage
  - `refactor:` Refactoring
  - `test:` Tests

## 🔗 Ressources

- [Next.js Docs](https://nextjs.org/docs)
- [Expo Docs](https://docs.expo.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Zod](https://zod.dev)
- [React Hook Form](https://react-hook-form.com)
- [Stripe Docs](https://stripe.com/docs)
