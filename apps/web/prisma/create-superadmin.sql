-- Créer le compte Super Admin
-- Email: alexalix58@gmail.com
-- Mot de passe: Pozerty321

INSERT INTO "User" (id, email, password, name, role, "createdAt", "updatedAt")
VALUES (
    'clxsuperadmin001',
    'alexalix58@gmail.com',
    '$2b$10$.2V/5UmwYZWlEXRbb6KfzuX7R1DDfqVrWRMfj4TM2agR/9bK3De/y',
    'Alex - Super Admin',
    'SUPER_ADMIN',
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    "updatedAt" = NOW();

-- Vérifier que le compte a été créé
SELECT id, email, name, role, "createdAt" FROM "User" WHERE email = 'alexalix58@gmail.com';
