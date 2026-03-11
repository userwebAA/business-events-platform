import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { verifyToken } from '@/lib/jwt';
import { validateTicket, markTicketAsUsed } from '@/lib/ticketService';

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
        const { qrCode, markAsUsed = false, eventId } = body;

        if (!qrCode) {
            return NextResponse.json({ error: 'QR code requis' }, { status: 400 });
        }

        const validation = await validateTicket(qrCode);

        if (!validation.valid) {
            return NextResponse.json({
                valid: false,
                message: validation.message,
                usedAt: validation.usedAt,
            }, { status: 200 });
        }

        // Vérifier que le billet correspond à l'événement scanné
        if (eventId && validation.ticket?.registration?.eventId !== eventId) {
            return NextResponse.json({
                valid: false,
                message: 'Ce billet ne correspond pas a cet evenement',
            }, { status: 200 });
        }

        if (markAsUsed && validation.ticket) {
            const updatedTicket = await markTicketAsUsed(qrCode);
            return NextResponse.json({
                valid: true,
                message: 'Billet validé et marqué comme utilisé',
                ticket: updatedTicket,
            });
        }

        return NextResponse.json({
            valid: true,
            message: validation.message,
            ticket: validation.ticket,
        });
    } catch (error) {
        console.error('Erreur validation billet:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
