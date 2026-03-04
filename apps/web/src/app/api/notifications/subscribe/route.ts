import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { verifyToken } from '@/lib/jwt';
import { subscribeToPush, unsubscribeFromPush } from '@/lib/notificationService';

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
        const { subscription } = body;

        if (!subscription || !subscription.endpoint || !subscription.keys) {
            return NextResponse.json(
                { error: 'Données de souscription invalides' },
                { status: 400 }
            );
        }

        await subscribeToPush(decoded.userId, subscription);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erreur souscription push:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
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
        const { endpoint } = body;

        if (!endpoint) {
            return NextResponse.json(
                { error: 'Endpoint requis' },
                { status: 400 }
            );
        }

        await unsubscribeFromPush(endpoint);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erreur désinscription push:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}