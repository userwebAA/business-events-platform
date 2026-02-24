# 🧪 Guide de Test - Système de Notifications

## ✅ Serveur démarré sur http://localhost:3000

---

## 📝 Étapes de Test

### 1. Se connecter à l'application

1. Ouvrir http://localhost:3000
2. Se connecter avec un compte utilisateur
3. Vérifier que l'icône 🔔 apparaît dans la Navbar

### 2. Créer une notification de test via l'API

**Méthode 1 : Via la console du navigateur**

```javascript
// Ouvrir la console (F12) sur http://localhost:3000
const token = localStorage.getItem('token');

fetch('/api/notifications/test', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
        type: 'SYSTEM',
        title: '🎉 Test de notification',
        message: 'Ceci est une notification de test pour vérifier que le système fonctionne correctement !',
        link: '/dashboard',
        sendPush: false
    })
})
.then(res => res.json())
.then(data => console.log('Notification créée:', data))
.catch(err => console.error('Erreur:', err));
```

**Méthode 2 : Via Postman/Thunder Client**

```
POST http://localhost:3000/api/notifications/test
Headers:
  Content-Type: application/json
  Authorization: Bearer VOTRE_TOKEN

Body:
{
    "type": "EVENT_REMINDER",
    "title": "⏰ Rappel d'événement",
    "message": "Votre événement Networking Tech a lieu demain à 19h !",
    "link": "/events/123",
    "sendPush": false
}
```

### 3. Vérifier l'affichage

1. Cliquer sur l'icône 🔔 dans la Navbar
2. Vérifier que la notification apparaît
3. Vérifier le badge avec le nombre de notifications non lues
4. Cliquer sur la notification pour la marquer comme lue

### 4. Tester différents types de notifications

**Rappel d'événement (⏰)**
```javascript
fetch('/api/notifications/test', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({
        type: 'EVENT_REMINDER',
        title: '⏰ Rappel - Networking Tech',
        message: 'Votre événement a lieu demain à 19h00',
        link: '/events/123'
    })
}).then(r => r.json()).then(console.log);
```

**Mise à jour d'événement (📢)**
```javascript
fetch('/api/notifications/test', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({
        type: 'EVENT_UPDATE',
        title: '📢 Mise à jour - Networking Tech',
        message: 'Le lieu de l\'événement a changé',
        link: '/events/123'
    })
}).then(r => r.json()).then(console.log);
```

**Annulation d'événement (❌)**
```javascript
fetch('/api/notifications/test', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({
        type: 'EVENT_CANCELLED',
        title: '❌ Annulation - Networking Tech',
        message: 'Cet événement a été annulé',
        link: '/events/123'
    })
}).then(r => r.json()).then(console.log);
```

**Confirmation d'inscription (✅)**
```javascript
fetch('/api/notifications/test', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({
        type: 'REGISTRATION_CONFIRMED',
        title: '✅ Inscription confirmée',
        message: 'Votre inscription à Networking Tech est confirmée',
        link: '/events/123'
    })
}).then(r => r.json()).then(console.log);
```

**Match de networking (🤝)**
```javascript
fetch('/api/notifications/test', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({
        type: 'NETWORKING_MATCH',
        title: '🤝 Nouveau match !',
        message: 'Vous avez un nouveau match avec Jean Dupont',
        link: '/networking'
    })
}).then(r => r.json()).then(console.log);
```

**Nouveau message (💬)**
```javascript
fetch('/api/notifications/test', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({
        type: 'MESSAGE_RECEIVED',
        title: '💬 Nouveau message',
        message: 'Jean Dupont vous a envoyé un message',
        link: '/messages'
    })
}).then(r => r.json()).then(console.log);
```

### 5. Tester les actions

**Marquer comme lue**
- Cliquer sur une notification non lue
- Vérifier que le badge se met à jour
- Vérifier que la notification change d'apparence

**Supprimer une notification**
- Survoler une notification
- Cliquer sur l'icône poubelle 🗑️
- Vérifier qu'elle disparaît

**Marquer toutes comme lues**
- Cliquer sur "Tout marquer lu"
- Vérifier que toutes les notifications deviennent lues
- Vérifier que le badge passe à 0

### 6. Tester les notifications push (optionnel)

⚠️ **Prérequis** : HTTPS ou localhost

1. Autoriser les notifications dans le navigateur
2. Créer une notification avec `sendPush: true`
3. Vérifier qu'une notification système apparaît

```javascript
// Demander la permission
Notification.requestPermission().then(permission => {
    console.log('Permission:', permission);
    
    if (permission === 'granted') {
        // Créer une notification avec push
        fetch('/api/notifications/test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                type: 'SYSTEM',
                title: '🔔 Test Push',
                message: 'Notification push de test',
                sendPush: true
            })
        }).then(r => r.json()).then(console.log);
    }
});
```

---

## 🐛 Dépannage

### Le badge ne s'affiche pas
- Vérifier que vous êtes connecté
- Rafraîchir la page
- Vérifier la console pour les erreurs

### Les notifications n'apparaissent pas
- Vérifier que le token est valide : `console.log(localStorage.getItem('token'))`
- Vérifier les logs du serveur
- Vérifier la réponse de l'API dans l'onglet Network

### Erreur "Token invalide"
- Se reconnecter à l'application
- Vérifier que le JWT_SECRET est configuré dans .env.local

### Les notifications push ne fonctionnent pas
- Vérifier que les clés VAPID sont correctes dans .env.local
- Vérifier que vous êtes sur HTTPS ou localhost
- Vérifier que les permissions sont accordées

---

## ✅ Checklist de Test

- [ ] Le serveur démarre sans erreur
- [ ] L'icône 🔔 apparaît dans la Navbar
- [ ] Le badge affiche le bon nombre
- [ ] Les notifications s'affichent dans le centre
- [ ] Chaque type de notification a le bon emoji
- [ ] Le clic sur une notification la marque comme lue
- [ ] Le lien fonctionne (redirection)
- [ ] La suppression fonctionne
- [ ] "Tout marquer lu" fonctionne
- [ ] Le badge se met à jour en temps réel
- [ ] Les notifications push fonctionnent (optionnel)

---

## 📊 Résultats Attendus

✅ **Succès** : Toutes les fonctionnalités fonctionnent
⚠️ **Partiel** : Certaines fonctionnalités ne marchent pas
❌ **Échec** : Le système ne fonctionne pas du tout

---

**Prêt à tester ! 🚀**

Ouvre http://localhost:3000 et suis les étapes ci-dessus.
