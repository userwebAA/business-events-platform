# Système de Notifications d'Événements

## 📧 Fonctionnalités

### 1. Rappel Automatique (1 semaine avant)
Les participants reçoivent automatiquement un email de rappel **7 jours avant l'événement**.

**Caractéristiques :**
- Email automatique avec design orange/amber
- Détails de l'événement (date, lieu, adresse)
- Lien direct vers la page de l'événement
- Envoi quotidien à 9h (UTC) via Vercel Cron

**Configuration :**
- API : `/api/cron/event-reminders`
- Cron : Tous les jours à 9h00
- Plage de détection : 6.5 à 7.5 jours avant l'événement
- Batch : 20 emails en parallèle

### 2. Notification de Modification
Lorsqu'un organisateur modifie un événement, il peut notifier tous les inscrits.

**Caractéristiques :**
- Email avec design bleu
- Message personnalisé de l'organisateur
- Détails actualisés de l'événement
- Envoi optionnel (activé par l'organisateur)

## 🔧 Utilisation

### Modifier un événement et notifier les inscrits

**API PUT `/api/events/[id]`**

```json
{
  "title": "Nouveau titre",
  "date": "2026-04-15T20:00:00Z",
  "location": "Nouveau lieu",
  "notifyAttendees": true,
  "updateMessage": "La date a été modifiée au 15 avril.\nLe lieu a changé pour le nouveau lieu.\nMerci de votre compréhension !"
}
```

**Paramètres :**
- `notifyAttendees` (boolean) : Active l'envoi de notifications aux inscrits
- `updateMessage` (string) : Message personnalisé décrivant les modifications
- Tous les autres champs : Données de l'événement à mettre à jour

**Exemple de modifications courantes :**
```
"updateMessage": "🗓️ Date modifiée : du 10 mars au 15 avril\n📍 Nouveau lieu : Salle des Fêtes\n⏰ Nouvelle heure : 20h00"
```

## 🔐 Sécurité

### Protection du Cron
Pour sécuriser l'endpoint cron, ajouter dans `.env` :

```env
CRON_SECRET=votre_secret_aleatoire_tres_long
```

L'API vérifiera le header `Authorization: Bearer votre_secret_aleatoire_tres_long`

### Configuration Vercel Cron
Le fichier `vercel.json` configure automatiquement le cron :

```json
{
  "crons": [
    {
      "path": "/api/cron/event-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

## 📊 Monitoring

### Vérifier les rappels envoyés
L'API cron retourne un rapport :

```json
{
  "success": true,
  "eventsProcessed": 3,
  "remindersSent": 45,
  "remindersFailed": 2,
  "timestamp": "2026-03-14T09:00:00.000Z"
}
```

### Logs
- ✅ Email de rappel envoyé à: user@example.com
- ✅ Email de modification envoyé à: user@example.com
- ❌ Erreur envoi rappel: [détails]

## 🎨 Templates Email

### Email de Rappel
- **Couleur** : Orange/Amber (#f59e0b)
- **Icône** : ⏰
- **Sujet** : "⏰ Rappel : [Titre] dans 1 semaine !"

### Email de Modification
- **Couleur** : Bleu (#3b82f6)
- **Icône** : 🔔
- **Sujet** : "🔔 Modification : [Titre]"

## 🚀 Déploiement

1. Les crons Vercel sont automatiquement déployés avec l'application
2. Aucune configuration supplémentaire nécessaire
3. Les rappels commenceront à s'envoyer dès le lendemain du déploiement

## 📝 Notes

- Les rappels ne sont envoyés qu'aux événements **non annulés**
- Les notifications de modification sont **optionnelles** (contrôlées par l'organisateur)
- Capacité : **100+ emails** par événement (batch de 20)
- Les emails privés utilisent le token d'accès dans l'URL
