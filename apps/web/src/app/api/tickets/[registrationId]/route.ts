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
        console.log('🔵 Récupération inscription:', params.registrationId);

        const registration = await prisma.registration.findUnique({
            where: { id: params.registrationId },
            include: {
                event: true,
            },
        });

        if (!registration) {
            console.error('❌ Inscription non trouvée:', params.registrationId);
            return NextResponse.json({ error: 'Inscription non trouvée' }, { status: 404 });
        }

        console.log('✅ Inscription trouvée:', registration.id);

        let ticket = await getTicketByRegistration(params.registrationId);

        if (!ticket) {
            console.log('🔵 Génération nouveau ticket...');
            await generateTicket(params.registrationId);
            // Re-fetch pour avoir les relations
            ticket = await getTicketByRegistration(params.registrationId);
        }

        if (!ticket) {
            console.error('❌ Impossible de générer le billet');
            return NextResponse.json({ error: 'Impossible de générer le billet' }, { status: 500 });
        }

        console.log('✅ Ticket trouvé:', ticket.id, 'QR:', ticket.qrCode.substring(0, 10) + '...');

        const formData = registration.formData as any;
        const attendeeName = formData?.name || formData?.firstName || 'Participant';
        const attendeeEmail = formData?.email || '';

        console.log('🔵 Génération PDF...');

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

        console.log('✅ PDF généré, taille:', pdfBuffer.length, 'bytes');

        return new NextResponse(new Uint8Array(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="billet-${registration.event.title.replace(/\s+/g, '-').substring(0, 50)}.pdf"`,
            },
        });
    } catch (error: any) {
        console.error('❌ Erreur génération billet:', error);
        console.error('Stack:', error.stack);
        return NextResponse.json(
            { error: 'Erreur lors de la génération du billet', details: error.message },
            { status: 500 }
        );
    }
}
