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

        const events = await prisma.event.findMany({
            where: {
                organizerId: decoded.userId,
            },
            include: {
                registrationFields: true,
                registrations: true,
            },
            orderBy: {
                date: 'desc',
            },
        });

        return NextResponse.json(events);
    } catch (error) {
        console.error('❌ Erreur récupération mes événements:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la récupération des événements' },
            { status: 500 }
        );
    }
}