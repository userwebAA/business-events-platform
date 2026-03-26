# Configuration des Variables d'Environnement

## Variables Requises

Créez un fichier `.env.local` à la racine du projet avec les variables suivantes :

```env
# Base de données PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# JWT Secret pour l'authentification
JWT_SECRET="votre_secret_jwt_tres_securise"

# Stripe (Paiements)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Resend (Emails)
RESEND_API_KEY="re_..."

# Google Maps API (pour la carte de localisation des événements)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIza..."
```

## Obtenir une clé API Google Maps

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez l'API **Maps JavaScript API** et **Geocoding API**
4. Créez des identifiants (API Key)
5. Restreignez la clé à votre domaine pour la sécurité
6. Copiez la clé dans `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

## Notes Importantes

- **NEXT_PUBLIC_** : Les variables avec ce préfixe sont exposées côté client
- Ne commitez **JAMAIS** le fichier `.env.local` dans Git
- Pour la production, configurez ces variables dans votre plateforme de déploiement (Vercel, etc.)
