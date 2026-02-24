-- Script SQL pour créer les comptes admin et super_admin
-- Mot de passe pour tous: Admin123!
-- Hash bcrypt: $2b$10$BR./zM.I3zxZXeUeGoeHI.3bObl8azUEg3cvI0XKShC..UWzXS7B6

-- Super Admin
INSERT INTO "User" (id, email, password, name, role, "createdAt", "updatedAt")
VALUES (
    'clxsuperadmin001',
    'superadmin@taff.com',
    '$2b$10$BR./zM.I3zxZXeUeGoeHI.3bObl8azUEg3cvI0XKShC..UWzXS7B6',
    'Super Administrateur',
    'SUPER_ADMIN',
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Admin
INSERT INTO "User" (id, email, password, name, role, "createdAt", "updatedAt")
VALUES (
    'clxadmin001',
    'admin@taff.com',
    '$2b$10$BR./zM.I3zxZXeUeGoeHI.3bObl8azUEg3cvI0XKShC..UWzXS7B6',
    'Administrateur',
    'ADMIN',
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Utilisateur test
INSERT INTO "User" (id, email, password, name, role, "createdAt", "updatedAt")
VALUES (
    'clxuser001',
    'user@taff.com',
    '$2b$10$BR./zM.I3zxZXeUeGoeHI.3bObl8azUEg3cvI0XKShC..UWzXS7B6',
    'Utilisateur Test',
    'USER',
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;
