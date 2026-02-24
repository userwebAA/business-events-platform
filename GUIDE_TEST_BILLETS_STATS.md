# 🧪 Guide de Test - QR Codes & Billets + Statistiques Avancées

**Date :** 30 janvier 2026  
**Fonctionnalités à tester :**
- #2 : QR Codes & Billets
- #3 : Statistiques Avancées

---

## 🎫 Test #1 : QR Codes & Billets

### Prérequis

1. **Base de données à jour**
```bash
cd apps/web
npx prisma generate
npx prisma db push
```

2. **Serveur de développement lancé**
```bash
npm run dev
```

3. **Au moins un événement créé avec des inscriptions**

---

### Test 1.1 : Génération de Billet PDF

**Objectif :** Vérifier qu'un billet PDF peut être généré pour une inscription.

**Étapes :**

1. **Créer un événement de test**
   - Aller sur `/dashboard/my-events`
   - Créer un nouvel événement
   - Noter l'ID de l'événement (dans l'URL)

2. **S'inscrire à l'événement**
   - Aller sur `/events/[eventId]`
   - Cliquer sur "S'inscrire"
   - Remplir le formulaire
   - Soumettre l'inscription
   - Noter l'ID de l'inscription (dans la réponse ou la base de données)

3. **Télécharger le billet**
   - Ouvrir un nouvel onglet
   - Aller sur : `http://localhost:3000/api/tickets/[registrationId]`
   - Remplacer `[registrationId]` par l'ID de l'inscription

**Résultat attendu :**
- ✅ Un fichier PDF se télécharge automatiquement
- ✅ Le PDF contient :
  - Titre de l'événement
  - QR code (200x200px)
  - Date et heure
  - Lieu et adresse
  - Nom du participant
  - Email du participant
  - Instructions d'utilisation
  - ID unique du billet

**Test en console :**
```javascript
// Dans la console du navigateur
const token = localStorage.getItem('token');

// Récupérer une inscription
fetch('/api/registrations/[eventId]', {
    headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => {
    console.log('Inscriptions:', data);
    const registrationId = data[0]?.id;
    
    // Télécharger le billet
    window.open(`/api/tickets/${registrationId}`, '_blank');
});
```

---

### Test 1.2 : Validation de QR Code (API)

**Objectif :** Vérifier que l'API de validation fonctionne correctement.

**Test en console :**
```javascript
const token = localStorage.getItem('token');

// D'abord, récupérer un billet existant
fetch('/api/tickets/event/[eventId]', {
    headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => {
    console.log('Billets:', data);
    const qrCode = data.tickets[0]?.qrCode;
    
    // Valider le QR code (première fois)
    return fetch('/api/tickets/validate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            qrCode: qrCode,
            markAsUsed: true
        })
    });
})
.then(r => r.json())
.then(result => {
    console.log('Validation 1:', result);
    // Devrait être valide
});
```

**Résultat attendu (1ère validation) :**
```json
{
    "valid": true,
    "message": "Billet valide et marqué comme utilisé",
    "ticket": {
        "id": "...",
        "qrCode": "...",
        "status": "USED",
        "usedAt": "2026-01-30T...",
        "registration": { ... }
    }
}
```

**Test de double validation :**
```javascript
// Essayer de valider le même QR code une 2ème fois
const qrCode = 'le_meme_qr_code';

fetch('/api/tickets/validate', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
        qrCode: qrCode,
        markAsUsed: true
    })
})
.then(r => r.json())
.then(result => {
    console.log('Validation 2:', result);
    // Devrait être invalide
});
```

**Résultat attendu (2ème validation) :**
```json
{
    "valid": false,
    "message": "Ce billet a déjà été utilisé",
    "usedAt": "2026-01-30T..."
}
```

---

### Test 1.3 : Scanner QR Code (Interface)

**Objectif :** Tester l'interface de scan avec la caméra.

**Étapes :**

1. **Préparer un QR code**
   - Télécharger un billet PDF (Test 1.1)
   - Ouvrir le PDF
   - Afficher le QR code à l'écran ou l'imprimer

2. **Accéder au scanner**
   - Aller sur `/dashboard/my-events`
   - Cliquer sur un événement
   - Cliquer sur "Scanner les billets" (ou aller directement sur `/dashboard/events/[eventId]/scan`)

3. **Autoriser la caméra**
   - Le navigateur demande l'autorisation
   - Accepter l'accès à la caméra

4. **Scanner le QR code**
   - Positionner le QR code devant la caméra
   - Attendre la détection automatique

**Résultat attendu :**
- ✅ La caméra démarre automatiquement
- ✅ Les statistiques s'affichent en haut (Total, Valides, Utilisés, Annulés)
- ✅ Le QR code est détecté automatiquement
- ✅ Un message de validation apparaît :
  - **Valide :** ✅ Billet Valide (fond vert)
  - **Invalide :** ❌ Billet Invalide (fond rouge)
- ✅ Les statistiques se mettent à jour en temps réel
- ✅ Après 3 secondes, le scanner redémarre automatiquement

**Problèmes possibles :**

❌ **La caméra ne démarre pas**
- Vérifier que vous êtes en HTTPS ou localhost
- Vérifier les permissions du navigateur
- Essayer un autre navigateur (Chrome recommandé)

❌ **Le QR code n'est pas détecté**
- Améliorer l'éclairage
- Rapprocher/éloigner le QR code
- Vérifier que le QR code est net (pas flou)

---

### Test 1.4 : Statistiques des Billets

**Objectif :** Vérifier les statistiques d'un événement.

**Test en console :**
```javascript
const token = localStorage.getItem('token');

fetch('/api/tickets/event/[eventId]', {
    headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => {
    console.log('Stats billets:', data);
});
```

**Résultat attendu :**
```json
{
    "tickets": [
        {
            "id": "...",
            "qrCode": "...",
            "status": "VALID",
            "usedAt": null,
            "registration": { ... }
        }
    ],
    "stats": {
        "total": 10,
        "valid": 7,
        "used": 3,
        "cancelled": 0
    }
}
```

---

## 📊 Test #2 : Statistiques Avancées

### Test 2.1 : Statistiques d'un Événement

**Objectif :** Récupérer les statistiques détaillées d'un événement.

**Test en console :**
```javascript
const token = localStorage.getItem('token');

fetch('/api/stats/event/[eventId]', {
    headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => {
    console.log('Stats événement:', data);
});
```

**Résultat attendu :**
```json
{
    "event": {
        "id": "...",
        "title": "Mon Événement",
        "date": "2026-02-15T...",
        "maxAttendees": 100,
        "currentAttendees": 45
    },
    "registrations": {
        "total": 45,
        "fillRate": 45.0,
        "remaining": 55
    },
    "timeline": {
        "byDay": [
            { "date": "2026-01-20", "count": 5 },
            { "date": "2026-01-21", "count": 12 },
            { "date": "2026-01-22", "count": 8 }
        ],
        "byHour": [
            { "hour": 9, "count": 3 },
            { "hour": 10, "count": 8 },
            { "hour": 14, "count": 15 }
        ]
    }
}
```

**Données intéressantes :**
- **fillRate** : Taux de remplissage en %
- **byDay** : Inscriptions par jour (pour graphique)
- **byHour** : Inscriptions par heure (pour voir les pics)

---

### Test 2.2 : Statistiques de l'Organisateur

**Objectif :** Récupérer les statistiques globales de l'organisateur connecté.

**Test en console :**
```javascript
const token = localStorage.getItem('token');

fetch('/api/stats/organizer', {
    headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => {
    console.log('Stats organisateur:', data);
});
```

**Résultat attendu :**
```json
{
    "overview": {
        "totalEvents": 15,
        "totalRegistrations": 450,
        "totalRevenue": 12500,
        "avgAttendeesPerEvent": 30,
        "avgFillRate": 75
    },
    "events": {
        "upcoming": 5,
        "past": 10,
        "published": 12,
        "draft": 2,
        "cancelled": 1
    },
    "timeline": {
        "eventsByMonth": [
            { "month": "2026-01", "count": 5 },
            { "month": "2026-02", "count": 3 }
        ],
        "registrationsByMonth": [
            { "month": "2026-01", "count": 150 },
            { "month": "2026-02", "count": 80 }
        ]
    },
    "topEvents": [
        {
            "id": "...",
            "title": "Conférence Tech 2026",
            "registrations": 120,
            "fillRate": 95,
            "revenue": 6000
        }
    ]
}
```

**Données intéressantes :**
- **totalRevenue** : Revenus totaux générés
- **avgFillRate** : Taux de remplissage moyen
- **topEvents** : Top 5 des événements les plus populaires
- **timeline** : Évolution dans le temps (pour graphiques)

---

### Test 2.3 : Statistiques de la Plateforme (Admins)

**Objectif :** Récupérer les statistiques globales de la plateforme (réservé aux admins).

**Prérequis :** Être connecté avec un compte ADMIN ou SUPER_ADMIN.

**Test en console :**
```javascript
const token = localStorage.getItem('token');

fetch('/api/stats/platform', {
    headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => {
    console.log('Stats plateforme:', data);
});
```

**Résultat attendu (si admin) :**
```json
{
    "overview": {
        "totalUsers": 250,
        "totalEvents": 75,
        "totalRegistrations": 2500,
        "totalRevenue": 85000,
        "avgAttendeesPerEvent": 33
    },
    "events": {
        "upcoming": 25,
        "past": 50,
        "free": 45,
        "paid": 30
    },
    "timeline": {
        "usersByMonth": [
            { "month": "2025-12", "count": 50 },
            { "month": "2026-01", "count": 80 }
        ],
        "eventsByMonth": [...],
        "registrationsByMonth": [...]
    }
}
```

**Résultat attendu (si non-admin) :**
```json
{
    "error": "Accès refusé"
}
```
Status: 403

---

## 🎨 Test Visuel : Interface de Scan

### Checklist de l'Interface

**Page `/dashboard/events/[eventId]/scan` :**

- [ ] **Header**
  - [ ] Bouton "Retour" fonctionnel
  - [ ] Titre "Scanner les billets"
  - [ ] Description claire

- [ ] **Statistiques (4 cartes)**
  - [ ] Total (gris)
  - [ ] Valides (vert)
  - [ ] Utilisés (bleu)
  - [ ] Annulés (rouge)
  - [ ] Chiffres mis à jour en temps réel

- [ ] **Zone de scan**
  - [ ] Caméra démarre automatiquement
  - [ ] Cadre de visée visible
  - [ ] Message "Positionnez le QR code devant la caméra"

- [ ] **Feedback de validation**
  - [ ] ✅ Billet valide : Icône verte + message
  - [ ] ❌ Billet invalide : Icône rouge + message
  - [ ] Informations du participant affichées
  - [ ] Retour automatique au scan après 3s

- [ ] **Conseils d'utilisation**
  - [ ] Encart bleu avec icône info
  - [ ] 4 conseils listés

---

## 🐛 Problèmes Connus et Solutions

### Erreurs TypeScript

**Problème :** Erreurs `Property 'ticket' does not exist` dans `ticketService.ts`

**Solution :**
```bash
cd apps/web
npx prisma generate
```

### Erreurs de Caméra

**Problème :** `NotAllowedError: Permission denied`

**Solution :**
- Vérifier les permissions du navigateur (Paramètres > Confidentialité > Caméra)
- Utiliser HTTPS ou localhost
- Essayer un autre navigateur

### PDF ne se génère pas

**Problème :** Erreur 500 lors de `/api/tickets/[registrationId]`

**Solution :**
- Vérifier que l'inscription existe
- Vérifier les logs serveur
- Vérifier que `pdfkit` est installé : `npm list pdfkit`

### Statistiques vides

**Problème :** Les stats retournent des valeurs à 0

**Solution :**
- Créer des événements de test
- Créer des inscriptions
- Vérifier que l'organisateur est bien le créateur des événements

---

## ✅ Checklist Complète de Test

### QR Codes & Billets
- [ ] Génération de billet PDF réussie
- [ ] PDF contient toutes les informations
- [ ] QR code visible et scannable
- [ ] Validation API fonctionne (1ère fois = valide)
- [ ] Double validation échoue (déjà utilisé)
- [ ] Scanner démarre la caméra
- [ ] QR code détecté automatiquement
- [ ] Feedback visuel correct (✅/❌)
- [ ] Statistiques se mettent à jour
- [ ] Statistiques API retourne les bonnes données

### Statistiques Avancées
- [ ] API stats événement fonctionne
- [ ] Données byDay et byHour correctes
- [ ] API stats organisateur fonctionne
- [ ] Top events calculés correctement
- [ ] Timeline par mois correcte
- [ ] API stats plateforme (admins uniquement)
- [ ] Accès refusé pour non-admins

---

## 📝 Rapport de Test

**Tester et cocher au fur et à mesure :**

```
Date: ___________
Testeur: ___________

FONCTIONNALITÉ #2 : QR CODES & BILLETS
[ ] Test 1.1 : Génération PDF - ✅ / ❌
[ ] Test 1.2 : Validation API - ✅ / ❌
[ ] Test 1.3 : Scanner Interface - ✅ / ❌
[ ] Test 1.4 : Stats billets - ✅ / ❌

FONCTIONNALITÉ #3 : STATISTIQUES AVANCÉES
[ ] Test 2.1 : Stats événement - ✅ / ❌
[ ] Test 2.2 : Stats organisateur - ✅ / ❌
[ ] Test 2.3 : Stats plateforme - ✅ / ❌

BUGS TROUVÉS:
1. ___________________________________
2. ___________________________________
3. ___________________________________

AMÉLIORATIONS SUGGÉRÉES:
1. ___________________________________
2. ___________________________________
3. ___________________________________
```

---

## 🚀 Prochaines Étapes Après Tests

Si tous les tests passent :
1. ✅ Marquer les fonctionnalités comme 100% terminées
2. 📝 Documenter les bugs trouvés
3. 🎨 Créer l'interface de visualisation des stats (graphiques)
4. 📧 Intégrer l'envoi automatique des billets par email
5. ➡️ Passer à la fonctionnalité suivante

---

**Bon courage pour les tests ! 🧪**
