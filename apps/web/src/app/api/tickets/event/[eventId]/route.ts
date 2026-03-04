import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { getEventTickets } from '@/lib/ticketService';

export const dynamic = 'force-dynamic';

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

        const tickets = await getEventTickets(params.eventId);

        const stats = {
            total: tickets.length,
            valid: tickets.filter((t: any) => t.status === 'VALID').length,
            used: tickets.filter((t: any) => t.status === 'USED').length,
            cancelled: tickets.filter((t: any) => t.status === 'CANCELLED').length,
        };

        return NextResponse.json({
            tickets,
            stats,
        });
    } catch (error) {
        console.error('Erreur récupération billets:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
