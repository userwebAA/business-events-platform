-- Créer le compte super admin Alex
INSERT INTO "User" (id, email, password, name, role, "createdAt", "updatedAt")
VALUES (
    'clx_alex_admin_' || substr(md5(random()::text), 1, 16),
    'alexalix58@gmail.com',
    '$2b$10$tWUfxX.prFX8aBHvcDb.DO/hHB.awsfnvglxUL/GxEsadmoi5/Ef6',
    'Alex Admin',
    'SUPER_ADMIN',
    NOW(),
    NOW()
)
ON CONFLICT (email) 
DO UPDATE SET 
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    "updatedAt" = NOW();
