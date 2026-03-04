import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);

        if (authResult.error) {
            return authResult.error;
        }

        // Récupérer l'utilisateur depuis la base de données
        const user = await prisma.user.findUnique({
            where: { id: authResult.user.userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                profileCompleted: true,
                firstName: true,
                lastName: true,
                phone: true,
                position: true,
                company: true,
                bio: true,
                location: true,
                skills: true,
                linkedin: true,
                photo: true,
                createdAt: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Utilisateur non trouvé' },
                { status: 404 }
            );
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error('Get user error:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la récupération de l\'utilisateur' },
            { status: 500 }
        );
    }
}