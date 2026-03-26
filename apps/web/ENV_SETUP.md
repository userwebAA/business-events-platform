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
```

## Cartes de Localisation

La plateforme utilise **Leaflet + OpenStreetMap** pour afficher les cartes de localisation des événements.

### Avantages
- ✅ **100% Gratuit** - Pas de frais, pas de quota
- ✅ **Open Source** - Leaflet et OpenStreetMap sont open-source
- ✅ **Géocodage gratuit** - Via Nominatim (OpenStreetMap)
- ✅ **Aucune clé API requise** - Fonctionne immédiatement

### Fonctionnalités
- Affichage d'un **périmètre approximatif** (cercle) avant inscription
- Affichage de l'**adresse exacte** (marqueur) après inscription
- Géocodage automatique des adresses
- Cartes interactives avec zoom et déplacement

## Notes Importantes

- **NEXT_PUBLIC_** : Les variables avec ce préfixe sont exposées côté client
- Ne commitez **JAMAIS** le fichier `.env.local` dans Git
- Pour la production, configurez ces variables dans votre plateforme de déploiement (Vercel, etc.)

## Respect de la Politique d'Utilisation

Nominatim (géocodage OpenStreetMap) a une politique d'utilisation équitable :
- Maximum 1 requête par seconde
- Utilisez un User-Agent identifiable
- Pour un usage intensif, envisagez d'héberger votre propre instance Nominatim
