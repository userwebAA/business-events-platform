# 🔔 Guide du Système de Notifications - Business Events

## ✅ Ce qui a été implémenté

### 1. Base de données
- ✅ Modèle `Notification` dans Prisma
- ✅ Modèle `PushSubscription` pour les notifications push web
- ✅ Enum `NotificationType` avec 7 types de notifications

### 2. Backend
- ✅ Service de notifications complet (`notificationService.ts`)
- ✅ Templates d'emails pour :
  - Rappels d'événements (24h avant)
  - Mises à jour d'événements
  - Annulations d'événements
- ✅ API complète :
  - `GET /api/notifications` - Récupérer les notifications
  - `PUT /api/notifications` - Marquer toutes comme lues
  - `PUT /api/notifications/[id]` - Marquer une notification comme lue
  - `DELETE /api/notifications/[id]` - Supprimer une notification
  - `GET /api/notifications/unread-count` - Compter les non lues
  - `POST /api/notifications/subscribe` - S'abonner aux push
  - `DELETE /api/notifications/subscribe` - Se désabonner
  - `POST /api/notifications/send-reminders` - Envoyer les rappels (cron)

### 3. Frontend
- ✅ Composant `NotificationCenter` dans la Navbar
- ✅ Badge avec compteur de notifications non lues
- ✅ Interface de gestion des notifications
- ✅ Support des notifications push web
- ✅ Utilitaires pour les push notifications

---

## 🚀 Configuration Requise

### 1. Installer les dépendances

```bash
cd apps/web
npm install web-push
```

### 2. Générer les clés VAPID

Les clés VAPID sont nécessaires pour les notifications push web.

```bash
npx web-push generate-vapid-keys
```

Cela va générer deux clés :
- **Public Key** (à mettre dans `.env.local` et côté client)
- **Private Key** (à garder secrète, uniquement côté serveur)

### 3. Configurer les variables d'environnement

Ajouter dans `apps/web/.env.local` :

```env
# Clés VAPID pour les notifications push
NEXT_PUBLIC_VAPID_PUBLIC_KEY=votre_cle_publique_vapid
VAPID_PRIVATE_KEY=votre_cle_privee_vapid

# Secret pour le cron job de rappels
CRON_SECRET=votre_secret_cron_unique

# Configuration email (déjà existante)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre_email@gmail.com
SMTP_PASS=votre_mot_de_passe_app

# URL de l'application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Mettre à jour la base de données

```bash
cd apps/web
npx prisma generate
npx prisma db push
```

---

## 📋 Types de Notifications

### 1. EVENT_REMINDER (⏰)
- **Déclencheur** : 24h avant un événement
- **Envoi** : Email + Push + Notification in-app
- **Automatique** : Via cron job

### 2. EVENT_UPDATE (📢)
- **Déclencheur** : Modification d'un événement
- **Envoi** : Email + Push + Notification in-app
- **Manuel** : Par l'organisateur

### 3. EVENT_CANCELLED (❌)
- **Déclencheur** : Annulation d'un événement
- **Envoi** : Email + Push + Notification in-app
- **Manuel** : Par l'organisateur

### 4. REGISTRATION_CONFIRMED (✅)
- **Déclencheur** : Inscription à un événement
- **Envoi** : Email + Notification in-app
- **Automatique** : Lors de l'inscription

### 5. NETWORKING_MATCH (🤝)
- **Déclencheur** : Match sur le networking
- **Envoi** : Push + Notification in-app
- **Automatique** : Quand 2 personnes se likent

### 6. MESSAGE_RECEIVED (💬)
- **Déclencheur** : Nouveau message
- **Envoi** : Push + Notification in-app
- **Automatique** : Lors de la réception

### 7. SYSTEM (🔔)
- **Déclencheur** : Notifications système
- **Envoi** : Notification in-app
- **Manuel** : Par les admins

---

## 💻 Utilisation dans le Code

### Créer une notification

```typescript
import { createNotification } from '@/lib/notificationService';

await createNotification({
    userId: 'user_id',
    type: 'EVENT_REMINDER',
    title: 'Rappel d\'événement',
    message: 'Votre événement a lieu demain !',
    link: '/events/event_id',
    sendPush: true,  // Envoyer une notification push
    sendEmail: false // Ne pas envoyer d'email (déjà géré séparément)
});
```

### Envoyer un email de rappel

```typescript
import { sendReminderEmail } from '@/lib/emailTemplates';

await sendReminderEmail({
    to: 'user@example.com',
    eventTitle: 'Networking Tech 2025',
    eventDate: new Date('2025-02-15T19:00:00'),
    eventLocation: 'Paris',
    eventAddress: '123 Rue de la Tech, 75001 Paris',
    userName: 'John Doe'
});
```

### Envoyer un email de mise à jour

```typescript
import { sendEventUpdateEmail } from '@/lib/emailTemplates';

await sendEventUpdateEmail({
    to: 'user@example.com',
    eventTitle: 'Networking Tech 2025',
    updateMessage: 'Le lieu de l\'événement a changé. Nouveau lieu : 456 Avenue Innovation.',
    eventDate: new Date('2025-02-15T19:00:00'),
    eventLocation: 'Paris - Nouveau lieu',
    userName: 'John Doe'
});
```

### Envoyer un email d'annulation

```typescript
import { sendEventCancelledEmail } from '@/lib/emailTemplates';

await sendEventCancelledEmail({
    to: 'user@example.com',
    eventTitle: 'Networking Tech 2025',
    reason: 'En raison de circonstances imprévues, nous devons annuler cet événement.',
    userName: 'John Doe'
});
```

---

## ⏰ Configuration du Cron Job

Pour envoyer automatiquement les rappels 24h avant les événements, configurer un cron job :

### Option 1 : Vercel Cron (Production)

Créer `vercel.json` à la racine du projet :

```json
{
  "crons": [{
    "path": "/api/notifications/send-reminders",
    "schedule": "0 10 * * *"
  }]
}
```

### Option 2 : Service externe (EasyCron, cron-job.org)

Configurer une requête HTTP :
- **URL** : `https://votre-domaine.com/api/notifications/send-reminders`
- **Méthode** : POST
- **Headers** : `Authorization: Bearer votre_CRON_SECRET`
- **Fréquence** : Tous les jours à 10h

### Option 3 : Script local (Développement)

Créer `scripts/send-reminders.js` :

```javascript
const fetch = require('node-fetch');

async function sendReminders() {
    const response = await fetch('http://localhost:3000/api/notifications/send-reminders', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.CRON_SECRET}`
        }
    });
    
    const data = await response.json();
    console.log('Rappels envoyés:', data);
}

sendReminders();
```

Puis utiliser `node-cron` ou le cron système.

---

## 🔧 Intégration dans les Événements

### Lors de la modification d'un événement

Dans `apps/web/src/app/api/events/[id]/route.ts` :

```typescript
import { createNotification } from '@/lib/notificationService';
import { sendEventUpdateEmail } from '@/lib/emailTemplates';

// Après la mise à jour de l'événement
const registrations = await prisma.registration.findMany({
    where: { eventId: event.id }
});

for (const registration of registrations) {
    const formData = registration.formData as any;
    
    // Créer une notification in-app
    await createNotification({
        userId: formData.userId || 'guest',
        type: 'EVENT_UPDATE',
        title: `Mise à jour - ${event.title}`,
        message: 'L\'événement a été modifié. Consultez les nouveaux détails.',
        link: `/events/${event.id}`,
        sendPush: true,
        sendEmail: false
    });
    
    // Envoyer l'email
    if (formData.email) {
        await sendEventUpdateEmail({
            to: formData.email,
            eventTitle: event.title,
            updateMessage: 'Les détails de l\'événement ont été mis à jour.',
            eventDate: event.date,
            eventLocation: event.location,
            userName: formData.name || 'Participant'
        });
    }
}
```

### Lors de l'annulation d'un événement

```typescript
import { sendEventCancelledEmail } from '@/lib/emailTemplates';

// Mettre à jour le statut
await prisma.event.update({
    where: { id: eventId },
    data: { status: 'cancelled' }
});

// Notifier tous les participants
const registrations = await prisma.registration.findMany({
    where: { eventId }
});

for (const registration of registrations) {
    const formData = registration.formData as any;
    
    await createNotification({
        userId: formData.userId || 'guest',
        type: 'EVENT_CANCELLED',
        title: `Annulation - ${event.title}`,
        message: 'Cet événement a été annulé.',
        link: `/events/${eventId}`,
        sendPush: true,
        sendEmail: false
    });
    
    if (formData.email) {
        await sendEventCancelledEmail({
            to: formData.email,
            eventTitle: event.title,
            reason: 'Raison de l\'annulation...',
            userName: formData.name || 'Participant'
        });
    }
}
```

---

## 🧪 Tests

### Tester les notifications in-app

1. Se connecter à l'application
2. Créer une notification de test via la console :

```typescript
await createNotification({
    userId: 'votre_user_id',
    type: 'SYSTEM',
    title: 'Test de notification',
    message: 'Ceci est un test',
    sendPush: false,
    sendEmail: false
});
```

3. Vérifier que la notification apparaît dans le centre de notifications

### Tester les emails

1. Configurer un service de test comme Mailtrap
2. Utiliser les fonctions d'envoi d'emails
3. Vérifier la réception dans Mailtrap

### Tester les notifications push

1. Activer les notifications dans le navigateur
2. S'abonner aux notifications push
3. Envoyer une notification de test avec `sendPush: true`

---

## 📊 Monitoring

### Logs à surveiller

- `✅ Email de rappel envoyé à: email@example.com`
- `✅ Notifications push envoyées`
- `✅ Souscription push enregistrée`
- `❌ Erreur envoi email:` (à investiguer)
- `📅 X événements à rappeler`

### Métriques importantes

- Nombre de notifications envoyées par jour
- Taux d'ouverture des notifications
- Nombre d'abonnés push actifs
- Taux de délivrabilité des emails

---

## 🔒 Sécurité

### Bonnes pratiques

1. **Clés VAPID** : Ne jamais commiter les clés privées
2. **CRON_SECRET** : Utiliser un secret fort et unique
3. **Rate limiting** : Limiter les appels API de notifications
4. **Validation** : Vérifier que l'utilisateur peut recevoir la notification
5. **RGPD** : Permettre la désinscription facile

### Permissions

- Les utilisateurs ne peuvent voir que leurs propres notifications
- Les admins peuvent envoyer des notifications système
- Les organisateurs peuvent notifier les participants de leurs événements

---

## 🎯 Prochaines Améliorations

### Court terme
- [ ] Ajouter des préférences de notifications par utilisateur
- [ ] Implémenter le groupement de notifications
- [ ] Ajouter des sons personnalisés

### Moyen terme
- [ ] Analytics des notifications (taux d'ouverture, etc.)
- [ ] Templates de notifications personnalisables
- [ ] Notifications par SMS (Twilio)

### Long terme
- [ ] Notifications intelligentes (IA pour timing optimal)
- [ ] Notifications riches (images, actions)
- [ ] Support multi-langues

---

## 🆘 Dépannage

### Les notifications n'apparaissent pas

1. Vérifier que l'utilisateur est connecté
2. Vérifier les logs du serveur
3. Vérifier la console du navigateur
4. Tester l'API directement avec Postman

### Les emails ne sont pas envoyés

1. Vérifier la configuration SMTP dans `.env.local`
2. Tester la connexion SMTP
3. Vérifier les logs d'erreur
4. Vérifier les quotas du service email

### Les notifications push ne fonctionnent pas

1. Vérifier que les clés VAPID sont correctes
2. Vérifier que le service worker est enregistré
3. Vérifier les permissions du navigateur
4. Tester sur HTTPS (requis pour les push)

---

## 📚 Ressources

- [Web Push Protocol](https://developers.google.com/web/fundamentals/push-notifications)
- [Notification API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [Nodemailer Documentation](https://nodemailer.com/)
- [Prisma Documentation](https://www.prisma.io/docs)

---

**Système de notifications implémenté avec succès ! 🎉**

Date : 29 janvier 2026
Version : 1.0.0
