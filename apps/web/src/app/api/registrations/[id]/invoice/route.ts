import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateInvoiceHTML, generateInvoiceNumber } from '@/lib/invoiceGenerator';
import puppeteer from 'puppeteer';

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

    // Générer la facture HTML
    const invoiceNumber = generateInvoiceNumber(registration.id, registration.createdAt);
    const invoiceHTML = generateInvoiceHTML({
      invoiceNumber,
      date: registration.createdAt,
      eventTitle: registration.event.title,
      eventDate: registration.event.date,
      attendeeName: (registration.formData as any)?.name || (registration.formData as any)?.firstName || 'Participant',
      attendeeEmail: (registration.formData as any)?.email,
      company: (registration.formData as any)?.company,
      price: registration.event.price,
      currency: registration.event.currency || 'EUR',
      registrationId: registration.id
    });

    // Générer le PDF avec Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(invoiceHTML, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    await browser.close();

    // Retourner le PDF pour affichage dans le navigateur
    return new NextResponse(Buffer.from(pdfBuffer), {
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
