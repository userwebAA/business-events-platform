import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-middleware';

export const dynamic = 'force-dynamic';

// PUT /api/admin/featured — Toggle isFeatured on an event
export async function PUT(request: NextRequest) {
    try {
        const authResult = await requireAuth(request, ['ADMIN', 'SUPER_ADMIN']);
        if (authResult.error) return authResult.error;

        const { eventId } = await request.json();
        if (!eventId) {
            return NextResponse.json({ error: 'eventId requis' }, { status: 400 });
        }

        const event = await prisma.event.findUnique({ where: { id: eventId } });
        if (!event) {
            return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 });
        }

        const updated = await prisma.event.update({
            where: { id: eventId },
            data: { isFeatured: !event.isFeatured },
        });

        return NextResponse.json({
            id: updated.id,
            isFeatured: updated.isFeatured,
            message: updated.isFeatured ? 'Événement mis en avant 🔥' : 'Mise en avant retirée',
        });
    } catch (error) {
        console.error('Featured toggle error:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
