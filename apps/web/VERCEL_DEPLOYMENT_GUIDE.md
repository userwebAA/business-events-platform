# 🚀 Guide de Déploiement Vercel - Business Events PWA

## 📋 Prérequis

- Compte GitHub (gratuit)
- Compte Vercel (gratuit) : https://vercel.com
- Base de données PostgreSQL (voir options ci-dessous)

---

## 🗄️ Étape 1 : Configurer la Base de Données PostgreSQL

Vous avez plusieurs options **gratuites** :

### Option A : Vercel Postgres (Recommandé - Le plus simple)
1. Connectez-vous sur Vercel
2. Dans votre projet, allez dans **Storage** > **Create Database**
3. Choisissez **Postgres**
4. Copiez la `DATABASE_URL` fournie

### Option B : Neon (Gratuit, excellent)
1. Créez un compte sur https://neon.tech
2. Créez un nouveau projet
3. Copiez la `DATABASE_URL` (format: `postgresql://...`)

### Option C : Supabase (Gratuit)
1. Créez un compte sur https://supabase.com
2. Créez un nouveau projet
3. Allez dans **Settings** > **Database**
4. Copiez la **Connection string** (mode "Session")

### Option D : Railway (Gratuit avec $5/mois de crédit)
1. Créez un compte sur https://railway.app
2. Créez un nouveau projet PostgreSQL
3. Copiez la `DATABASE_URL`

---

## 📦 Étape 2 : Pousser le Code sur GitHub

Si ce n'est pas déjà fait :

```bash
# Initialisez Git (si pas déjà fait)
cd "c:\Users\Alex\Desktop\TAFF\BUISNESS APP"
git init

# Ajoutez tous les fichiers
git add .

# Créez le premier commit
git commit -m "Initial commit - Business Events PWA"

# Créez un nouveau repo sur GitHub, puis :
git remote add origin https://github.com/VOTRE-USERNAME/business-events.git
git branch -M main
git push -u origin main
```

---

## 🌐 Étape 3 : Déployer sur Vercel

### Méthode 1 : Via l'Interface Web (Plus Simple)

1. **Connectez-vous sur Vercel** : https://vercel.com

2. **Importez votre projet** :
   - Cliquez sur **"Add New..."** > **"Project"**
   - Connectez votre compte GitHub
   - Sélectionnez le repository `business-events`
   - Cliquez sur **"Import"**

3. **Configurez le projet** :
   - **Framework Preset** : Next.js (détecté automatiquement)
   - **Root Directory** : `apps/web`
   - **Build Command** : `npm run build` (ou laissez par défaut)
   - **Output Directory** : `.next` (par défaut)

4. **Ajoutez les Variables d'Environnement** :
   
   Cliquez sur **"Environment Variables"** et ajoutez :

   ```
   DATABASE_URL = postgresql://votre-connection-string
   JWT_SECRET = [générez avec: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"]
   SMTP_HOST = smtp.gmail.com
   SMTP_PORT = 587
   SMTP_USER = votre-email@gmail.com
   SMTP_PASS = votre-mot-de-passe-app
   RATE_LIMIT_MAX_REQUESTS = 5
   RATE_LIMIT_WINDOW_MS = 900000
   BCRYPT_ROUNDS = 10
   ```

   **Important pour Gmail** :
   - N'utilisez PAS votre mot de passe Gmail normal
   - Créez un "App Password" :
     1. Allez sur https://myaccount.google.com/security
     2. Activez la validation en 2 étapes
     3. Créez un "App Password" pour "Mail"
     4. Utilisez ce mot de passe dans `SMTP_PASS`

5. **Déployez** :
   - Cliquez sur **"Deploy"**
   - Attendez 2-3 minutes ⏳
   - Votre app sera disponible sur : `votre-projet.vercel.app`

### Méthode 2 : Via CLI (Pour les développeurs)

```bash
# Installez Vercel CLI
npm i -g vercel

# Connectez-vous
vercel login

# Déployez depuis le dossier web
cd apps/web
vercel

# Suivez les instructions
# Ajoutez les variables d'environnement quand demandé
```

---

## 🔧 Étape 4 : Initialiser la Base de Données

Une fois déployé, vous devez créer les tables :

### Option A : Via Prisma Studio (Interface graphique)
```bash
# En local, connectez-vous à votre DB de production
DATABASE_URL="votre-url-de-production" npx prisma studio
```

### Option B : Via Migrations
```bash
# Générez et appliquez les migrations
cd apps/web
DATABASE_URL="votre-url-de-production" npx prisma migrate deploy
```

### Option C : Via SQL Direct
Connectez-vous à votre base de données et exécutez les fichiers :
- `prisma/migrations/.../*.sql` (toutes les migrations)

---

## 📱 Étape 5 : Tester la PWA

1. **Ouvrez votre app** : `https://votre-projet.vercel.app`

2. **Testez sur mobile** :
   - **iOS** : Safari > Partager > "Sur l'écran d'accueil"
   - **Android** : Chrome > Menu > "Installer l'application"

3. **Vérifiez avec Lighthouse** :
   - Ouvrez Chrome DevTools (F12)
   - Onglet **Lighthouse**
   - Cochez **Progressive Web App**
   - Cliquez sur **"Analyze page load"**
   - Score PWA devrait être > 80%

---

## ✅ Checklist Post-Déploiement

- [ ] L'application se charge correctement
- [ ] La base de données est connectée
- [ ] Les migrations sont appliquées
- [ ] Le manifest.json est accessible (`/manifest.json`)
- [ ] Les icônes sont visibles
- [ ] Le service worker est enregistré (DevTools > Application > Service Workers)
- [ ] L'installation PWA fonctionne sur mobile
- [ ] Les emails de confirmation fonctionnent (testez une inscription)

---

## 🐛 Dépannage

### Erreur de Build
```
Error: Cannot find module 'next'
```
**Solution** : Vérifiez que le **Root Directory** est bien `apps/web`

### Erreur de Base de Données
```
Error: Can't reach database server
```
**Solution** : 
- Vérifiez que `DATABASE_URL` est correcte
- Vérifiez que votre DB accepte les connexions externes
- Pour Neon/Supabase : utilisez le mode "Pooling" ou "Session"

### Service Worker ne se charge pas
**Solution** :
- Le PWA ne fonctionne qu'en HTTPS (Vercel fournit HTTPS automatiquement)
- Videz le cache : DevTools > Application > Clear storage

### Les emails ne partent pas
**Solution** :
- Vérifiez `SMTP_USER` et `SMTP_PASS`
- Pour Gmail : utilisez un "App Password", pas votre mot de passe normal
- Vérifiez les logs Vercel : Dashboard > Functions > Logs

---

## 🔄 Mises à Jour Automatiques

Vercel redéploie automatiquement à chaque push sur `main` :

```bash
# Faites vos modifications
git add .
git commit -m "Nouvelle fonctionnalité"
git push

# Vercel redéploie automatiquement ! 🎉
```

---

## 📊 Monitoring

### Logs en temps réel
```bash
vercel logs votre-projet.vercel.app
```

### Dashboard Vercel
- **Analytics** : Visiteurs, performances
- **Functions** : Logs des API routes
- **Deployments** : Historique des déploiements

---

## 💰 Coûts

### Vercel (Hobby - Gratuit)
- ✅ Bande passante : 100 GB/mois
- ✅ Builds : Illimités
- ✅ Domaines : Illimités
- ✅ HTTPS : Inclus
- ✅ Parfait pour tester et petits projets

### Base de Données
- **Neon** : 0.5 GB gratuit
- **Supabase** : 500 MB gratuit
- **Vercel Postgres** : 256 MB gratuit
- **Railway** : $5 de crédit/mois

---

## 🌍 Domaine Personnalisé (Optionnel)

1. Achetez un domaine (ex: Namecheap, OVH)
2. Dans Vercel : **Settings** > **Domains**
3. Ajoutez votre domaine
4. Configurez les DNS selon les instructions Vercel
5. Votre PWA sera sur : `https://votre-domaine.com` 🎉

---

## 🎉 C'est Tout !

Votre PWA Business Events est maintenant en ligne et installable sur tous les appareils !

**URL de test** : `https://votre-projet.vercel.app`

### Prochaines Étapes :
1. Testez l'installation sur votre téléphone
2. Créez un super admin via SQL ou Prisma Studio
3. Créez votre premier événement
4. Partagez le lien avec vos utilisateurs !

---

## 📚 Ressources

- [Documentation Vercel](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma avec Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [PWA sur Vercel](https://vercel.com/guides/progressive-web-apps)

## 🆘 Support

En cas de problème :
1. Vérifiez les logs Vercel
2. Testez en local d'abord : `npm run build && npm start`
3. Consultez la documentation Vercel
4. Vérifiez que toutes les variables d'environnement sont définies

Bon déploiement ! 🚀
