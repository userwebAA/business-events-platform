import { NextRequest, NextResponse } from 'next/server';
import { getTicketByRegistration, generateTicket, generateQRCodeImage } from '@/lib/ticketService';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: { registrationId: string } }
) {
    try {
        // D'abord essayer de récupérer le ticket existant (avec relations)
        let ticket = await getTicketByRegistration(params.registrationId);

        // Si pas de ticket, le générer puis le re-récupérer avec relations
        if (!ticket) {
            await generateTicket(params.registrationId);
            ticket = await getTicketByRegistration(params.registrationId);
        }

        if (!ticket) {
            return NextResponse.json({ error: 'Impossible de générer le billet' }, { status: 500 });
        }

        const qrCodeImage = await generateQRCodeImage(ticket.qrCode);

        const formData = ticket.registration.formData as any;
        const attendeeName = formData?.name || formData?.firstName || 'Participant';

        return NextResponse.json({
            ticketId: ticket.id,
            qrCode: ticket.qrCode,
            qrCodeImage,
            status: ticket.status,
            attendeeName,
            eventTitle: ticket.registration.event.title,
            eventDate: ticket.registration.event.date,
            eventLocation: ticket.registration.event.location,
        });
    } catch (error) {
        console.error('Erreur récupération QR code:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la récupération du QR code' },
            { status: 500 }
        );
    }
}
