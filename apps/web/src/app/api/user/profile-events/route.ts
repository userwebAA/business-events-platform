import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function PATCH(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
        }

        const { eventId, hidden } = await request.json();

        if (!eventId) {
            return NextResponse.json({ error: 'eventId requis' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { hiddenProfileEvents: true },
        });

        if (!user) {
            return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
        }

        let updatedHidden = [...user.hiddenProfileEvents];

        if (hidden) {
            // Ajouter l'événement à la liste des masqués
            if (!updatedHidden.includes(eventId)) {
                updatedHidden.push(eventId);
            }
        } else {
            // Retirer l'événement de la liste des masqués
            updatedHidden = updatedHidden.filter(id => id !== eventId);
        }

        await prisma.user.update({
            where: { id: decoded.userId },
            data: { hiddenProfileEvents: updatedHidden },
        });

        return NextResponse.json({ success: true, hiddenProfileEvents: updatedHidden });
    } catch (error) {
        console.error('Erreur toggle event visibility:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}