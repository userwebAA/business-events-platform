# Guide PWA - Business Events

## 🎯 Qu'est-ce qu'une PWA ?

Votre application Business Events est maintenant une **Progressive Web App (PWA)**. Cela signifie qu'elle peut être installée sur iOS et Android comme une application native, tout en restant une application web.

## ✨ Fonctionnalités PWA

- ✅ **Installation sur l'écran d'accueil** (iOS & Android)
- ✅ **Mode standalone** (s'ouvre comme une app native, sans barre d'adresse)
- ✅ **Responsive design** (s'adapte à tous les écrans)
- ✅ **Mode offline** (page de secours quand pas de connexion)
- ✅ **Icônes personnalisées** pour iOS et Android
- ✅ **Service Worker** pour le cache et les performances

## 📱 Installation sur iOS (iPhone/iPad)

1. Ouvrez Safari et accédez à votre application
2. Appuyez sur le bouton **Partager** (icône avec flèche vers le haut)
3. Faites défiler et appuyez sur **"Sur l'écran d'accueil"**
4. Personnalisez le nom si nécessaire
5. Appuyez sur **"Ajouter"**
6. L'icône apparaît sur votre écran d'accueil !

## 📱 Installation sur Android

1. Ouvrez Chrome et accédez à votre application
2. Appuyez sur le menu (3 points verticaux)
3. Sélectionnez **"Installer l'application"** ou **"Ajouter à l'écran d'accueil"**
4. Confirmez l'installation
5. L'application apparaît dans votre tiroir d'applications !

**Alternative :** Une bannière d'installation peut apparaître automatiquement en haut de la page.

## 🖥️ Installation sur Desktop (Chrome/Edge)

1. Ouvrez l'application dans Chrome ou Edge
2. Cliquez sur l'icône **"Installer"** dans la barre d'adresse (à droite)
3. Ou allez dans Menu > **"Installer Business Events"**
4. L'application s'ouvre dans sa propre fenêtre !

## 🎨 Icônes

Les icônes PWA sont générées automatiquement avec le logo "BE" (Business Events).

Pour personnaliser les icônes :
1. Créez vos propres icônes PNG aux tailles : 72, 96, 128, 144, 152, 192, 384, 512 pixels
2. Placez-les dans `/public/icons/`
3. Nommez-les : `icon-{taille}x{taille}.png` (ex: `icon-192x192.png`)

Ou utilisez le script de génération :
```bash
npm run generate-icons
```

## 🔧 Configuration Technique

### Fichiers PWA créés :
- `/public/manifest.json` - Configuration de l'application
- `/public/browserconfig.xml` - Configuration pour Windows
- `/src/app/layout.tsx` - Meta tags pour iOS/Android
- `/src/app/offline/page.tsx` - Page hors ligne
- `next.config.js` - Configuration next-pwa

### Manifest.json
Le fichier manifest définit :
- Nom de l'application
- Icônes (toutes les tailles)
- Couleur du thème (#2563eb - bleu)
- Mode d'affichage (standalone)
- Orientation (portrait)

### Service Worker
Le service worker est généré automatiquement par `next-pwa` et gère :
- Le cache des ressources
- Le mode offline
- Les mises à jour de l'application

## 🧪 Tester la PWA

### En développement :
Le PWA est **désactivé en développement** pour éviter les problèmes de cache.

### En production :
1. Build l'application : `npm run build`
2. Lancez en production : `npm start`
3. Ouvrez dans le navigateur
4. Testez l'installation

### Outils de test :
- **Chrome DevTools** > Application > Manifest
- **Lighthouse** (dans Chrome DevTools) > Progressive Web App
- **PWA Builder** : https://www.pwabuilder.com/

## 🌐 Déploiement

Pour que la PWA fonctionne correctement en production :

1. **HTTPS obligatoire** - Les PWA nécessitent HTTPS
2. **Service Worker** - Sera généré automatiquement au build
3. **Manifest** - Doit être accessible à `/manifest.json`

### Checklist de déploiement :
- [ ] Application déployée en HTTPS
- [ ] Manifest accessible
- [ ] Icônes présentes dans `/public/icons/`
- [ ] Service worker fonctionnel
- [ ] Test Lighthouse > 80% PWA score

## 📊 Responsive Design

L'application est déjà responsive grâce à :
- **Viewport meta tag** configuré
- **TailwindCSS** avec classes responsive
- **Flexbox/Grid** pour les layouts adaptatifs

### Breakpoints TailwindCSS :
- `sm:` - 640px et plus (mobile landscape)
- `md:` - 768px et plus (tablette)
- `lg:` - 1024px et plus (desktop)
- `xl:` - 1280px et plus (large desktop)

## 🔄 Mises à jour

Quand vous déployez une nouvelle version :
1. Le service worker détecte automatiquement les changements
2. L'utilisateur est notifié qu'une mise à jour est disponible
3. L'application se met à jour au prochain rechargement

## 🐛 Dépannage

### L'installation ne s'affiche pas :
- Vérifiez que vous êtes en HTTPS
- Vérifiez que le manifest est accessible
- Vérifiez dans DevTools > Application > Manifest

### Les icônes ne s'affichent pas :
- Vérifiez que les fichiers existent dans `/public/icons/`
- Vérifiez les chemins dans `manifest.json`
- Videz le cache et rechargez

### Le mode offline ne fonctionne pas :
- Vérifiez que le service worker est enregistré
- Vérifiez dans DevTools > Application > Service Workers
- Testez en mode avion ou en désactivant le réseau dans DevTools

## 📚 Ressources

- [Documentation Next-PWA](https://github.com/DuCanhGH/next-pwa)
- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)
- [MDN PWA Documentation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [PWA Builder](https://www.pwabuilder.com/)

## 🎉 C'est tout !

Votre application est maintenant une PWA complète, installable sur iOS, Android et Desktop !
