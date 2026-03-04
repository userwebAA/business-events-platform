import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { verifyToken } from '@/lib/jwt';
import { getPlatformStats } from '@/lib/advancedStatsService';

export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
        }

        if (decoded.role !== 'ADMIN' && decoded.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        const stats = await getPlatformStats();

        return NextResponse.json(stats);
    } catch (error) {
        console.error('Erreur stats plateforme:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}