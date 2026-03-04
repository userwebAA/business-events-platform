import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { markNotificationAsRead, deleteNotification } from '@/lib/notificationService';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
        }

        const notification = await prisma.notification.findUnique({
            where: { id: params.id },
        });

        if (!notification || notification.userId !== decoded.userId) {
            return NextResponse.json({ error: 'Notification non trouvée' }, { status: 404 });
        }

        await markNotificationAsRead(params.id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erreur marquage notification:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
        }

        const notification = await prisma.notification.findUnique({
            where: { id: params.id },
        });

        if (!notification || notification.userId !== decoded.userId) {
            return NextResponse.json({ error: 'Notification non trouvée' }, { status: 404 });
        }

        await deleteNotification(params.id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erreur suppression notification:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
