import { NextRequest, NextResponse } from 'next/server';
import { generateTicket, getTicketByRegistration } from '@/lib/ticketService';
import { generateTicketPDF } from '@/lib/pdfTicketGenerator';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: { registrationId: string } }
) {
    try {
        const registration = await prisma.registration.findUnique({
            where: { id: params.registrationId },
            include: {
                event: true,
            },
        });

        if (!registration) {
            return NextResponse.json({ error: 'Inscription non trouvée' }, { status: 404 });
        }

        let ticket: any = await getTicketByRegistration(params.registrationId);

        if (!ticket) {
            ticket = await generateTicket(params.registrationId);
        }

        if (!ticket) {
            return NextResponse.json({ error: 'Impossible de générer le billet' }, { status: 500 });
        }

        const formData = registration.formData as any;
        const attendeeName = formData.name || formData.firstName || 'Participant';
        const attendeeEmail = formData.email || '';

        const pdfBuffer = await generateTicketPDF({
            ticketId: ticket.id,
            qrCode: ticket.qrCode,
            eventTitle: registration.event.title,
            eventDate: registration.event.date,
            eventLocation: registration.event.location,
            eventAddress: registration.event.address,
            attendeeName,
            attendeeEmail,
            registrationId: registration.id,
        });

        return new NextResponse(new Uint8Array(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="billet-${registration.event.title.replace(/\s+/g, '-')}.pdf"`,
            },
        });
    } catch (error) {
        console.error('Erreur génération billet:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la génération du billet' },
            { status: 500 }
        );
    }
}
