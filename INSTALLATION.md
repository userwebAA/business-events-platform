# 📦 Guide d'Installation Complet

## Étape 1 : Vérifier les prérequis

### Node.js et npm
```bash
node --version  # Doit être >= 18.0.0
npm --version   # Doit être >= 9.0.0
```

Si vous n'avez pas Node.js, téléchargez-le depuis [nodejs.org](https://nodejs.org/)

### Git (optionnel)
```bash
git --version
```

## Étape 2 : Installation des dépendances

### Installation automatique (recommandé)

```bash
# À la racine du projet
npm install
```

Cette commande installera automatiquement les dépendances pour :
- Le workspace racine
- L'application web (`apps/web`)
- L'application mobile (`apps/mobile`)
- Le package partagé (`packages/shared`)

### Installation manuelle (si l'automatique échoue)

```bash
# 1. Racine
npm install

# 2. Package partagé
cd packages/shared
npm install

# 3. Application web
cd ../../apps/web
npm install

# 4. Application mobile
cd ../mobile
npm install

# 5. Retour à la racine
cd ../..
```

## Étape 3 : Configuration de l'environnement

### Configuration Web (Stripe)

1. Créez un fichier `.env.local` dans `apps/web/` :

```bash
cd apps/web
copy .env.local.example .env.local  # Windows
# ou
cp .env.local.example .env.local    # Mac/Linux
```

2. Éditez `.env.local` et ajoutez vos clés Stripe :

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_votre_clé_publique
STRIPE_SECRET_KEY=sk_test_votre_clé_secrète
```

**Pour obtenir vos clés Stripe :**
1. Créez un compte sur [stripe.com](https://stripe.com)
2. Allez dans **Développeurs** > **Clés API**
3. Utilisez les clés de **test** (commencent par `pk_test_` et `sk_test_`)

> ⚠️ **Important** : Ne commitez JAMAIS vos clés API dans Git !

## Étape 4 : Vérification de l'installation

### Vérifier les dépendances web

```bash
cd apps/web
npm list next react typescript
```

Vous devriez voir :
- next@14.x.x
- react@18.x.x
- typescript@5.x.x

### Vérifier les dépendances mobile

```bash
cd apps/mobile
npm list expo react-native
```

Vous devriez voir :
- expo@~50.x.x
- react-native@0.73.x

## Étape 5 : Premier lancement

### Lancer l'application web

```bash
cd apps/web
npm run dev
```

**Résultat attendu :**
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- Ready in 2.5s
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

### Lancer l'application mobile

```bash
cd apps/mobile
npm start
```

**Résultat attendu :**
```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

**Options de test :**
- **iOS** : Appuyez sur `i` (nécessite Xcode sur Mac)
- **Android** : Appuyez sur `a` (nécessite Android Studio)
- **Téléphone** : Scannez le QR code avec Expo Go

## 🔧 Résolution des problèmes courants

### Erreur : "Port 3000 already in use"

**Windows :**
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Mac/Linux :**
```bash
lsof -ti:3000 | xargs kill -9
```

**Ou changez le port :**
```bash
PORT=3001 npm run dev
```

### Erreur : "Cannot find module"

```bash
# Nettoyez et réinstallez
rm -rf node_modules package-lock.json
npm install
```

### Erreur : "EACCES: permission denied"

**Mac/Linux :**
```bash
sudo chown -R $USER ~/.npm
sudo chown -R $USER /usr/local/lib/node_modules
```

**Windows :** Exécutez le terminal en tant qu'administrateur

### Erreur Expo : "Unable to resolve module"

```bash
# Nettoyez le cache
cd apps/mobile
npx expo start -c
```

### Erreurs TypeScript persistantes

Les erreurs TypeScript dans l'IDE sont normales avant l'installation des dépendances. Après `npm install`, redémarrez votre éditeur :

- **VS Code** : `Ctrl+Shift+P` > "Reload Window"
- **WebStorm** : File > Invalidate Caches / Restart

## 📱 Installation d'Expo Go (pour tester sur téléphone)

### iOS
1. Ouvrez l'App Store
2. Recherchez "Expo Go"
3. Installez l'application
4. Scannez le QR code avec l'appareil photo

### Android
1. Ouvrez le Google Play Store
2. Recherchez "Expo Go"
3. Installez l'application
4. Scannez le QR code depuis l'app Expo Go

## 🎯 Prochaines étapes

Une fois l'installation terminée :

1. ✅ Consultez `QUICKSTART.md` pour un guide de démarrage rapide
2. ✅ Lisez `README.md` pour la documentation complète
3. ✅ Testez la création d'un événement sur http://localhost:3000/events/create
4. ✅ Explorez le code dans `apps/web/src/app/`

## 🆘 Besoin d'aide ?

- **Documentation Next.js** : https://nextjs.org/docs
- **Documentation Expo** : https://docs.expo.dev
- **Documentation Stripe** : https://stripe.com/docs

## ✅ Checklist d'installation

- [ ] Node.js 18+ installé
- [ ] Dépendances installées (`npm install`)
- [ ] Fichier `.env.local` créé (optionnel)
- [ ] Application web démarre sur http://localhost:3000
- [ ] Application mobile démarre avec Expo
- [ ] Aucune erreur TypeScript dans l'éditeur

Si toutes les cases sont cochées, vous êtes prêt à développer ! 🚀
