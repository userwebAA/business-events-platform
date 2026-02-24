# 🎫 Guide du Système de QR Codes & Billets - Business Events

## ✅ Ce qui a été implémenté

### 1. Base de données
- ✅ Modèle `Ticket` dans Prisma
- ✅ Enum `TicketStatus` (VALID, USED, CANCELLED)
- ✅ Relation avec `Registration`

### 2. Backend
- ✅ Service de génération de tickets (`ticketService.ts`)
- ✅ Service de génération de QR codes
- ✅ Service de génération de billets PDF (`pdfTicketGenerator.ts`)
- ✅ API complète :
  - `GET /api/tickets/[registrationId]` - Télécharger le billet PDF
  - `POST /api/tickets/validate` - Valider un QR code
  - `GET /api/tickets/event/[eventId]` - Stats des billets d'un événement

### 3. Frontend
- ✅ Page de scan QR pour les organisateurs
- ✅ Scanner de QR codes avec caméra
- ✅ Validation en temps réel
- ✅ Statistiques des billets (total, valides, utilisés, annulés)

---

## 🎨 Design du Billet PDF

Le billet généré contient :
- **En-tête** : Titre de l'événement avec fond bleu
- **QR Code** : Code unique de 200x200px
- **Informations de l'événement** :
  - 📅 Date et heure
  - 📍 Lieu et adresse
  - 👤 Nom et email du participant
- **Instructions** : Comment utiliser le billet
- **ID unique** : Pour le support

---

## 🚀 Utilisation

### Pour les Participants

#### 1. Recevoir son billet

Après inscription à un événement, le participant peut télécharger son billet :

```
GET /api/tickets/[registrationId]
```

Le billet est automatiquement généré au premier téléchargement.

#### 2. Présenter le billet

Le participant peut :
- **Imprimer** le billet PDF
- **Afficher** le QR code sur son téléphone
- Le présenter à l'entrée de l'événement

---

### Pour les Organisateurs

#### 1. Accéder au scanner

```
/dashboard/events/[eventId]/scan
```

#### 2. Scanner les billets

- La caméra démarre automatiquement
- Positionner le QR code devant la caméra
- Le système valide automatiquement :
  - ✅ **Billet valide** : Marqué comme utilisé
  - ❌ **Billet invalide** : Raison affichée (déjà utilisé, annulé, etc.)

#### 3. Voir les statistiques

En haut de la page de scan :
- **Total** : Nombre total de billets
- **Valides** : Billets non encore utilisés
- **Utilisés** : Billets scannés
- **Annulés** : Billets annulés

---

## 💻 Intégration dans le Code

### Générer un billet pour une inscription

```typescript
import { generateTicket } from '@/lib/ticketService';

const ticket = await generateTicket(registrationId);
```

### Télécharger le PDF d'un billet

```typescript
// Côté client
const downloadTicket = async (registrationId: string) => {
    const response = await fetch(`/api/tickets/${registrationId}`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billet-${registrationId}.pdf`;
    a.click();
};
```

### Valider un QR code

```typescript
import { validateTicket, markTicketAsUsed } from '@/lib/ticketService';

// Vérifier sans marquer comme utilisé
const validation = await validateTicket(qrCode);

if (validation.valid) {
    // Marquer comme utilisé
    await markTicketAsUsed(qrCode);
}
```

### Obtenir les billets d'un événement

```typescript
import { getEventTickets } from '@/lib/ticketService';

const tickets = await getEventTickets(eventId);

const stats = {
    total: tickets.length,
    valid: tickets.filter(t => t.status === 'VALID').length,
    used: tickets.filter(t => t.status === 'USED').length,
    cancelled: tickets.filter(t => t.status === 'CANCELLED').length,
};
```

---

## 🔐 Sécurité

### Génération des QR Codes

Les QR codes sont générés avec :
- **crypto.randomBytes(32)** : 32 bytes aléatoires
- **toString('hex')** : Conversion en hexadécimal
- Résultat : Code unique de 64 caractères

### Validation

- Chaque QR code est **unique** dans la base de données
- Un billet ne peut être **scanné qu'une seule fois**
- Le statut est mis à jour en temps réel
- Historique avec `usedAt` (date d'utilisation)

---

## 📊 États des Billets

### VALID (Valide)
- Billet créé et non encore utilisé
- Peut être scanné à l'entrée
- Couleur : **Vert**

### USED (Utilisé)
- Billet déjà scanné
- Ne peut plus être utilisé
- Affiche la date d'utilisation
- Couleur : **Bleu**

### CANCELLED (Annulé)
- Billet annulé (événement annulé, remboursement, etc.)
- Ne peut pas être utilisé
- Couleur : **Rouge**

---

## 🎯 Flux Complet

### 1. Inscription à un événement
```
Utilisateur → Formulaire d'inscription → Registration créée
```

### 2. Génération du billet
```
Registration → generateTicket() → Ticket créé avec QR code unique
```

### 3. Téléchargement du PDF
```
GET /api/tickets/[registrationId] → PDF généré avec QR code → Téléchargement
```

### 4. Jour de l'événement
```
Participant présente le QR code → Organisateur scanne → Validation
```

### 5. Validation
```
Scanner → POST /api/tickets/validate → Vérification → Marquage USED
```

---

## 🛠️ Configuration Requise

### Dépendances installées

```bash
npm install qrcode @types/qrcode
npm install pdfkit @types/pdfkit
npm install html5-qrcode
```

### Base de données

```bash
npx prisma generate
npx prisma db push
```

---

## 📱 Compatibilité

### Scanner QR Code
- ✅ Chrome (Desktop & Mobile)
- ✅ Firefox (Desktop & Mobile)
- ✅ Safari (iOS 11+)
- ✅ Edge
- ⚠️ Nécessite **HTTPS** ou **localhost**
- ⚠️ Nécessite l'**autorisation caméra**

### PDF
- ✅ Tous les navigateurs modernes
- ✅ Lecteurs PDF (Adobe, Foxit, etc.)
- ✅ Mobile (iOS, Android)

---

## 🧪 Tests

### Tester la génération de billet

1. S'inscrire à un événement
2. Récupérer l'ID d'inscription
3. Accéder à `/api/tickets/[registrationId]`
4. Vérifier que le PDF se télécharge

### Tester le scanner

1. Générer un billet
2. Ouvrir le PDF
3. Accéder à `/dashboard/events/[eventId]/scan`
4. Scanner le QR code du PDF
5. Vérifier la validation

### Tester la double utilisation

1. Scanner un billet valide → ✅ Succès
2. Scanner le même billet → ❌ "Billet déjà utilisé"

---

## 🐛 Dépannage

### Le scanner ne démarre pas

**Causes possibles :**
- Pas d'autorisation caméra
- Pas en HTTPS (sauf localhost)
- Caméra utilisée par une autre app

**Solutions :**
1. Vérifier les permissions du navigateur
2. Utiliser HTTPS en production
3. Fermer les autres apps utilisant la caméra

### Le QR code n'est pas reconnu

**Causes possibles :**
- QR code flou ou mal imprimé
- Mauvaise luminosité
- QR code trop petit

**Solutions :**
1. Améliorer l'éclairage
2. Agrandir le QR code à l'écran
3. Imprimer en meilleure qualité

### Le PDF ne se génère pas

**Causes possibles :**
- Données manquantes dans Registration
- Erreur de génération du QR code

**Solutions :**
1. Vérifier les logs serveur
2. Vérifier que la registration existe
3. Vérifier les données formData

---

## 🔄 Intégration avec les Notifications

Le système de billets peut être intégré avec les notifications :

```typescript
import { createNotification } from '@/lib/notificationService';
import { generateTicket } from '@/lib/ticketService';

// Après inscription
const ticket = await generateTicket(registrationId);

// Notifier l'utilisateur
await createNotification({
    userId: user.id,
    type: 'REGISTRATION_CONFIRMED',
    title: '🎫 Votre billet est prêt !',
    message: `Téléchargez votre billet pour ${eventTitle}`,
    link: `/api/tickets/${registrationId}`,
    sendEmail: true,
});
```

---

## 📈 Statistiques Disponibles

### Par événement

```typescript
const stats = {
    total: 150,        // Total de billets
    valid: 45,         // Non encore utilisés
    used: 100,         // Déjà scannés
    cancelled: 5,      // Annulés
};

const attendance = (used / total) * 100; // Taux de présence
```

### Temps réel

Les statistiques sont mises à jour en temps réel lors du scan.

---

## 🎯 Prochaines Améliorations

### Court terme
- [ ] Envoi automatique du billet par email
- [ ] Bouton "Télécharger le billet" dans le dashboard
- [ ] Historique des scans

### Moyen terme
- [ ] Billets avec code-barres (en plus du QR)
- [ ] Export des statistiques en CSV
- [ ] Notifications push lors du scan

### Long terme
- [ ] Billets personnalisables (couleurs, logo)
- [ ] Wallet mobile (Apple Wallet, Google Pay)
- [ ] Analytics avancées (temps d'arrivée, etc.)

---

## 📚 Ressources

- [QRCode.js Documentation](https://github.com/soldair/node-qrcode)
- [PDFKit Documentation](https://pdfkit.org/)
- [Html5-QRCode Documentation](https://github.com/mebjas/html5-qrcode)
- [Prisma Documentation](https://www.prisma.io/docs)

---

**Système de QR Codes & Billets implémenté avec succès ! 🎉**

Date : 30 janvier 2026
Version : 1.0.0
