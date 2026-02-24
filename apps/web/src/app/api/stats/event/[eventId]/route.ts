import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { getEventDetailedStats } from '@/lib/advancedStatsService';

export async function GET(
    request: NextRequest,
    { params }: { params: { eventId: string } }
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

        const stats = await getEventDetailedStats(params.eventId);

        return NextResponse.json(stats);
    } catch (error) {
        console.error('Erreur stats événement:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
