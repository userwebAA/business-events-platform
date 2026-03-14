import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
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

        const registrations = await prisma.registration.findMany({
            where: { userId: decoded.userId },
            include: {
                event: true,
                tickets: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(registrations);
    } catch (error) {
        console.error('Erreur récupération inscriptions:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
