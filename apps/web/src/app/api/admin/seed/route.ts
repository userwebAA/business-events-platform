import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcryptjs from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    // Sécurité : vérifier un secret
    const secret = request.nextUrl.searchParams.get('secret');
    if (secret !== 'create-admin-2026') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Vérifier si l'admin existe déjà
        const existing = await prisma.user.findUnique({
            where: { email: 'alexalix58@gmail.com' },
        });

        if (existing) {
            // Mettre à jour le mot de passe avec bcryptjs
            const hashedPassword = await bcryptjs.hash('Pozerty321', 10);
            await prisma.user.update({
                where: { email: 'alexalix58@gmail.com' },
                data: { password: hashedPassword },
            });
            return NextResponse.json({
                message: 'Admin password updated with bcryptjs',
                user: { id: existing.id, email: existing.email, role: existing.role },
            });
        }

        // Créer le super admin
        const hashedPassword = await bcryptjs.hash('Pozerty321', 10);
        const user = await prisma.user.create({
            data: {
                email: 'alexalix58@gmail.com',
                password: hashedPassword,
                name: 'Alex Admin',
                role: 'SUPER_ADMIN',
            },
        });

        return NextResponse.json({
            message: 'Admin created successfully',
            user: { id: user.id, email: user.email, role: user.role },
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
