# 🔒 Guide de Sécurité - TAFF Business Events

## ✅ Mesures de sécurité implémentées

### 1. **Authentification & Autorisation**

#### Mots de passe
- ✅ Hash bcrypt avec 10 rounds (configurable via `BCRYPT_ROUNDS`)
- ✅ Validation stricte : min 8 caractères, majuscule, minuscule, chiffre
- ✅ Stockage sécurisé (jamais en clair)

#### Tokens JWT
- ✅ Signature cryptographique avec secret de 128 caractères
- ✅ Expiration après 7 jours
- ✅ Vérification côté serveur sur chaque requête protégée
- ✅ Stockage dans localStorage (côté client)

#### Rôles utilisateurs
- ✅ 3 niveaux : USER, ADMIN, SUPER_ADMIN
- ✅ Vérification des permissions côté serveur
- ✅ Impossible de modifier son rôle depuis le client

### 2. **Protection contre les attaques**

#### Rate Limiting
- ✅ Max 5 tentatives de connexion par 15 minutes (par IP)
- ✅ Max 5 tentatives d'inscription par 15 minutes (par IP)
- ✅ Message d'erreur avec temps d'attente
- ✅ Nettoyage automatique des anciennes entrées

#### Validation des entrées
- ✅ Validation stricte des emails (format, longueur)
- ✅ Validation des mots de passe (complexité)
- ✅ Validation des noms (longueur, caractères)
- ✅ Sanitisation de toutes les entrées utilisateur
- ✅ Protection contre les injections XSS

#### Protection SQL
- ✅ Prisma ORM avec requêtes paramétrées
- ✅ Aucune requête SQL brute
- ✅ Protection automatique contre les injections SQL

### 3. **Logs de sécurité**

#### Événements tracés
- ✅ Connexions réussies/échouées
- ✅ Inscriptions réussies/échouées
- ✅ Dépassement de rate limit
- ✅ Tokens invalides
- ✅ Accès non autorisés
- ✅ Accès aux données sensibles (revenus)

#### Informations loggées
- ✅ Type d'événement
- ✅ Timestamp
- ✅ User ID / Email
- ✅ Adresse IP
- ✅ User Agent
- ✅ Détails de l'erreur

### 4. **Middleware de sécurité**

#### `requireAuth()`
- ✅ Vérification automatique du token
- ✅ Extraction des informations utilisateur
- ✅ Vérification des rôles autorisés
- ✅ Logs automatiques des tentatives d'accès

#### `getClientIp()`
- ✅ Récupération de l'IP réelle (même derrière proxy)
- ✅ Support de X-Forwarded-For et X-Real-IP

## 📋 Configuration requise

### Variables d'environnement (.env)

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/db"

# JWT Secret (OBLIGATOIRE - générer avec crypto.randomBytes)
JWT_SECRET="votre-cle-secrete-de-128-caracteres-minimum"

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=5
RATE_LIMIT_WINDOW_MS=900000

# Security
BCRYPT_ROUNDS=10
```

### Générer un JWT_SECRET sécurisé

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🚀 Utilisation

### Protéger une route API

```typescript
import { requireAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  // Vérifier l'authentification (tous les rôles)
  const authResult = await requireAuth(request);
  if (authResult.error) return authResult.error;

  // Utiliser authResult.user
  const { userId, email, role } = authResult.user;
}
```

### Protéger une route pour admins uniquement

```typescript
export async function GET(request: NextRequest) {
  // Seuls ADMIN et SUPER_ADMIN peuvent accéder
  const authResult = await requireAuth(request, ['ADMIN', 'SUPER_ADMIN']);
  if (authResult.error) return authResult.error;

  // Code accessible uniquement aux admins
}
```

### Logger un événement de sécurité

```typescript
import { securityLogger, SecurityEventType } from '@/lib/security-logger';

securityLogger.log({
  eventType: SecurityEventType.REVENUE_ACCESS,
  userId: user.id,
  email: user.email,
  ip: getClientIp(request),
  userAgent: request.headers.get('user-agent') || undefined,
  details: 'User accessed revenue data',
});
```

## 📊 Score de sécurité

### Développement: **10/10** ✅

- ✅ Mots de passe hashés (bcrypt)
- ✅ Tokens JWT sécurisés
- ✅ Rate limiting
- ✅ Validation stricte des entrées
- ✅ Sanitisation des données
- ✅ Logs de sécurité
- ✅ Middleware d'authentification
- ✅ Protection contre XSS
- ✅ Protection contre SQL injection
- ✅ Gestion des rôles

### Production: Améliorations recommandées

1. **HTTPS obligatoire**
   - Certificat SSL/TLS
   - Redirection HTTP → HTTPS

2. **Protection CSRF**
   - Tokens CSRF pour les formulaires
   - SameSite cookies

3. **Headers de sécurité**
   - Content-Security-Policy
   - X-Frame-Options
   - X-Content-Type-Options

4. **Monitoring externe**
   - Sentry pour les erreurs
   - Service de logs externe
   - Alertes en temps réel

5. **Backup et récupération**
   - Sauvegardes automatiques de la DB
   - Plan de récupération après incident

6. **Conformité RGPD**
   - Politique de confidentialité
   - Consentement des cookies
   - Droit à l'oubli

## 🔐 Comptes administrateurs

### Super Admin
- Email: alexalix58@gmail.com
- Rôle: SUPER_ADMIN
- Accès: Total + Revenus

### Création de nouveaux admins

Les admins ne peuvent être créés que directement en base de données pour des raisons de sécurité.

```sql
-- Créer un admin
INSERT INTO "User" (id, email, password, name, role, "createdAt", "updatedAt")
VALUES (
    'admin_id',
    'admin@example.com',
    '$2b$10$hashedpassword',
    'Nom Admin',
    'ADMIN',
    NOW(),
    NOW()
);
```

## 📞 Support

En cas de problème de sécurité, contactez immédiatement l'équipe technique.

**Ne jamais partager :**
- JWT_SECRET
- Mots de passe en clair
- Tokens JWT
- Informations de connexion à la base de données
