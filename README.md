# Business Events Platform

Plateforme d'organisation de soirées business avec support web et mobile (iOS/Android).

## 🚀 Fonctionnalités

- ✅ Création d'événements gratuits ou payants
- ✅ Formulaire d'inscription personnalisable (entreprise, poste, téléphone, etc.)
- ✅ Système de paiement sécurisé via Stripe
- ✅ Gestion des participants
- ✅ Interface web responsive (Next.js)
- ✅ Application mobile native (React Native + Expo)
- ✅ Code partagé entre web et mobile

## 📦 Structure du projet

```
BUISNESS APP/
├── apps/
│   ├── web/              # Application web Next.js
│   │   ├── src/
│   │   │   ├── app/      # Pages et API routes
│   │   │   └── components/
│   │   └── package.json
│   └── mobile/           # Application mobile Expo
│       ├── app/          # Screens avec Expo Router
│       └── package.json
├── packages/
│   └── shared/           # Types et validation partagés
│       ├── types/
│       └── validation/
└── package.json
```

## 🛠️ Installation

### Prérequis

- Node.js 18+
- npm ou yarn

### Installation des dépendances

```bash
# À la racine du projet
npm install

# Pour l'application web
cd apps/web
npm install

# Pour l'application mobile
cd apps/mobile
npm install

# Pour le package partagé
cd packages/shared
npm install
```

## 🚀 Démarrage

### Application Web

```bash
cd apps/web
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

### Application Mobile

```bash
cd apps/mobile
npm start
```

Options disponibles:
- Appuyez sur `i` pour iOS Simulator
- Appuyez sur `a` pour Android Emulator
- Scannez le QR code avec Expo Go sur votre téléphone

## 🔧 Configuration

### Variables d'environnement (Web)

Créez un fichier `.env.local` dans `apps/web/`:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_votre_clé
STRIPE_SECRET_KEY=sk_test_votre_clé
```

### Stripe

1. Créez un compte sur [Stripe](https://stripe.com)
2. Récupérez vos clés API (mode test)
3. Ajoutez-les dans `.env.local`

## 📱 Fonctionnalités détaillées

### Création d'événements

- Titre, description, date et lieu
- Type: gratuit ou payant
- Nombre de participants (limité ou illimité)
- Formulaire d'inscription personnalisable
- Champs par défaut: entreprise, poste, téléphone

### Inscription aux événements

- Formulaire dynamique basé sur les champs définis
- Validation des données
- Paiement sécurisé pour les événements payants
- Confirmation par email (à implémenter)

### Gestion des participants

- Liste des inscrits
- Statut des paiements
- Export des données (à implémenter)

## 🏗️ Technologies utilisées

### Web
- **Next.js 14** - Framework React avec App Router
- **TypeScript** - Typage statique
- **Tailwind CSS** - Styling
- **React Hook Form** - Gestion des formulaires
- **Zod** - Validation des schémas
- **Stripe** - Paiements
- **Lucide React** - Icônes

### Mobile
- **React Native** - Framework mobile
- **Expo** - Toolchain et SDK
- **Expo Router** - Navigation
- **TypeScript** - Typage statique
- **Lucide React Native** - Icônes

### Partagé
- **TypeScript** - Types partagés
- **Zod** - Validation partagée

## 📝 API Routes

### Événements
- `GET /api/events` - Liste des événements
- `GET /api/events/[id]` - Détails d'un événement
- `POST /api/events` - Créer un événement
- `PUT /api/events/[id]` - Modifier un événement
- `DELETE /api/events/[id]` - Supprimer un événement

### Inscriptions
- `GET /api/registrations` - Liste des inscriptions
- `POST /api/registrations` - Créer une inscription

### Paiements
- `POST /api/create-payment-intent` - Créer une intention de paiement Stripe

## 🔐 Sécurité

- Validation des données côté client et serveur
- Paiements sécurisés via Stripe
- Protection CSRF (à implémenter)
- Authentification utilisateur (à implémenter)

## 🚧 Prochaines étapes

- [ ] Authentification utilisateur (NextAuth.js)
- [ ] Base de données (PostgreSQL + Prisma)
- [ ] Upload d'images pour les événements
- [ ] Notifications push (mobile)
- [ ] Emails de confirmation
- [ ] Dashboard organisateur
- [ ] Statistiques et analytics
- [ ] Export des participants (CSV/Excel)
- [ ] Système de tickets/QR codes
- [ ] Chat entre participants

## 📄 Licence

MIT

## 👥 Support

Pour toute question ou problème, créez une issue sur le repository.
