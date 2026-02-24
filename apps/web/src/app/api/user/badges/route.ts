import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

// GET - Récupérer les badges d'un utilisateur (par query param userId, ou le user connecté)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const targetUserId = searchParams.get('userId');

        let userId = targetUserId;

        if (!userId) {
            const token = request.headers.get('authorization')?.replace('Bearer ', '');
            if (!token) {
                return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
            }
            const decoded = verifyToken(token);
            if (!decoded) {
                return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
            }
            userId = decoded.userId;
        }

        const badges = await prisma.eventBadge.findMany({
            where: targetUserId
                ? { userId, visible: true }
                : { userId },
            orderBy: { eventDate: 'desc' },
        });

        return NextResponse.json({ badges });
    } catch (error) {
        console.error('Erreur récupération badges:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

// PATCH - Masquer/afficher un badge de soirée
export async function PATCH(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }
        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
        }

        const { badgeId, visible } = await request.json();

        if (!badgeId || typeof visible !== 'boolean') {
            return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
        }

        const badge = await prisma.eventBadge.findUnique({ where: { id: badgeId } });

        if (!badge || badge.userId !== decoded.userId) {
            return NextResponse.json({ error: 'Badge non trouvé' }, { status: 404 });
        }

        await prisma.eventBadge.update({
            where: { id: badgeId },
            data: { visible },
        });

        return NextResponse.json({ message: visible ? 'Badge affiché' : 'Badge masqué' });
    } catch (error) {
        console.error('Erreur mise à jour badge:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
