# 🚀 Démarrage Rapide - Business Events

## Installation

### 1. Installer les dépendances

```bash
# À la racine du projet
npm install

# Pour l'application web
cd apps/web
npm install

# Pour l'application mobile
cd ../mobile
npm install

# Pour le package partagé
cd ../../packages/shared
npm install
```

### 2. Configuration Stripe (optionnel pour tester)

Créez un fichier `.env.local` dans `apps/web/` :

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_votre_clé
STRIPE_SECRET_KEY=sk_test_votre_clé
```

Pour obtenir vos clés :
1. Créez un compte sur [stripe.com](https://stripe.com)
2. Allez dans Développeurs > Clés API
3. Copiez les clés de test

## Lancer l'application

### Application Web (Next.js)

```bash
cd apps/web
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000)

### Application Mobile (Expo)

```bash
cd apps/mobile
npm start
```

Options :
- Appuyez sur `i` pour iOS Simulator
- Appuyez sur `a` pour Android Emulator  
- Scannez le QR code avec Expo Go sur votre téléphone

## 📱 Tester l'application

### Web

1. **Page d'accueil** : http://localhost:3000
2. **Créer un événement** : http://localhost:3000/events/create
3. **Liste des événements** : http://localhost:3000/events

### Fonctionnalités disponibles

✅ Créer un événement gratuit ou payant
✅ Définir les champs du formulaire d'inscription
✅ Voir la liste des événements
✅ S'inscrire à un événement
✅ Paiement Stripe (si configuré)

## 🔧 Commandes utiles

```bash
# Lancer le web en mode développement
npm run dev:web

# Lancer le mobile
npm run dev:mobile

# Build web pour production
npm run build:web

# Vérifier les types TypeScript
npm run type-check

# Linter
npm run lint
```

## 📝 Prochaines étapes

Pour une application complète en production :

1. **Base de données** : Ajouter PostgreSQL + Prisma
2. **Authentification** : Implémenter NextAuth.js
3. **Upload d'images** : Configurer Cloudinary ou AWS S3
4. **Emails** : Ajouter SendGrid ou Resend
5. **Déploiement** :
   - Web : Vercel ou Netlify
   - Mobile : EAS Build (Expo)

## ❓ Problèmes courants

### Port 3000 déjà utilisé
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Ou changez le port
PORT=3001 npm run dev
```

### Erreurs TypeScript
```bash
# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

### Expo ne démarre pas
```bash
# Nettoyer le cache
npx expo start -c
```

## 📚 Documentation

- [Next.js](https://nextjs.org/docs)
- [Expo](https://docs.expo.dev)
- [React Native](https://reactnative.dev)
- [Stripe](https://stripe.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🆘 Support

Consultez le `README.md` pour plus de détails sur l'architecture et les fonctionnalités.
