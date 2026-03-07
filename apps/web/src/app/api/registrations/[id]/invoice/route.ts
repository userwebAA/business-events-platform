import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateInvoiceNumber } from '@/lib/invoiceGenerator';
import { renderToBuffer } from '@react-pdf/renderer';
import { createInvoiceDocument } from '@/lib/pdfInvoice';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const registrationId = params.id;

    // Récupérer l'inscription avec l'événement
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { event: true }
    });

    if (!registration) {
      return NextResponse.json(
        { error: 'Inscription non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier que l'événement est payant
    if (registration.event.type !== 'paid' || !registration.event.price) {
      return NextResponse.json(
        { error: 'Cet événement ne nécessite pas de facture' },
        { status: 400 }
      );
    }

    // Vérifier que la facture n'a pas expiré (2 mois après l'inscription)
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    if (new Date(registration.createdAt) < twoMonthsAgo) {
      return NextResponse.json(
        { error: 'Cette facture n\'est plus disponible (expirée après 2 mois)' },
        { status: 410 }
      );
    }

    // Générer la facture PDF
    const invoiceNumber = generateInvoiceNumber(registration.id, registration.createdAt);

    const invoiceData = {
      invoiceNumber,
      date: registration.createdAt,
      eventTitle: registration.event.title,
      eventDate: registration.event.date,
      attendeeName: (registration.formData as any)?.name || (registration.formData as any)?.firstName || 'Participant',
      attendeeEmail: (registration.formData as any)?.email,
      company: (registration.formData as any)?.company,
      price: registration.event.price,
      quantity: (registration as any).quantity || 1,
      currency: registration.event.currency || 'EUR',
      registrationId: registration.id
    };

    // Générer le PDF avec @react-pdf/renderer
    const pdfBuffer = await renderToBuffer(createInvoiceDocument(invoiceData));

    // Retourner le PDF
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="facture-${invoiceNumber}.pdf"`
      }
    });

  } catch (error) {
    console.error('Erreur génération facture PDF:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération de la facture PDF' },
      { status: 500 }
    );
  }
}
