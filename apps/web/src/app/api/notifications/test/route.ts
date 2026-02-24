import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { createNotification } from '@/lib/notificationService';

export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
        }

        const body = await request.json();
        const { type = 'SYSTEM', title, message, link, sendPush = false } = body;

        if (!title || !message) {
            return NextResponse.json(
                { error: 'Titre et message requis' },
                { status: 400 }
            );
        }

        const notification = await createNotification({
            userId: decoded.userId,
            type,
            title,
            message,
            link,
            sendPush,
            sendEmail: false,
        });

        return NextResponse.json({
            success: true,
            notification,
            message: 'Notification de test créée avec succès'
        });
    } catch (error) {
        console.error('Erreur création notification test:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
