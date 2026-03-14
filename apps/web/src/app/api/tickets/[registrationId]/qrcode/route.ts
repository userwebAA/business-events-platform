import { NextRequest, NextResponse } from 'next/server';
import { getTicketsByRegistration, generateTicket, generateQRCodeImage } from '@/lib/ticketService';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: { registrationId: string } }
) {
    try {
        // D'abord essayer de récupérer les tickets existants
        let tickets = await getTicketsByRegistration(params.registrationId);

        // Si pas de tickets, les générer puis les re-récupérer avec relations
        if (!tickets || tickets.length === 0) {
            await generateTicket(params.registrationId);
            tickets = await getTicketsByRegistration(params.registrationId);
        }

        if (!tickets || tickets.length === 0) {
            return NextResponse.json({ error: 'Impossible de générer les billets' }, { status: 500 });
        }

        const firstTicket = tickets[0];
        const formData = firstTicket.registration.formData as any;
        const attendeeName = formData?.name || formData?.firstName || 'Participant';

        // Générer les QR codes pour tous les billets
        const ticketsData = await Promise.all(
            tickets.map(async (ticket, index) => {
                const qrCodeImage = await generateQRCodeImage(ticket.qrCode);
                return {
                    ticketId: ticket.id,
                    qrCode: ticket.qrCode,
                    qrCodeImage,
                    status: ticket.status,
                    index: index + 1,
                };
            })
        );

        return NextResponse.json({
            // Rétrocompatibilité : garder les champs du premier billet
            ticketId: firstTicket.id,
            qrCode: firstTicket.qrCode,
            qrCodeImage: ticketsData[0].qrCodeImage,
            status: firstTicket.status,
            attendeeName,
            eventTitle: firstTicket.registration.event.title,
            eventDate: firstTicket.registration.event.date,
            eventLocation: firstTicket.registration.event.location,
            // Nouveau : tous les billets
            tickets: ticketsData,
            totalTickets: ticketsData.length,
        });
    } catch (error) {
        console.error('Erreur récupération QR code:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la récupération du QR code' },
            { status: 500 }
        );
    }
}
