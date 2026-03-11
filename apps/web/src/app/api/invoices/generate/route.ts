import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { generateInvoiceHTML, generateInvoiceNumber } from '@/lib/invoiceGenerator';
import { applyRateLimit } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  // Rate limiting: 5 req / 5 min
  const rateLimited = applyRateLimit(request, 'invoice', 5, 300000);
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const {
      registrationId,
      eventTitle,
      eventDate,
      attendeeName,
      attendeeEmail,
      company,
      price,
      currency
    } = body;

    // Validation
    if (!registrationId || !eventTitle || !eventDate || !attendeeName || !attendeeEmail || !price) {
      return NextResponse.json(
        { error: 'Données manquantes pour générer la facture' },
        { status: 400 }
      );
    }

    const now = new Date();
    const invoiceNumber = generateInvoiceNumber(registrationId, now);

    const invoiceHTML = generateInvoiceHTML({
      invoiceNumber,
      date: now,
      eventTitle,
      eventDate: new Date(eventDate),
      attendeeName,
      attendeeEmail,
      company,
      price,
      currency: currency || 'EUR',
      registrationId
    });

    return NextResponse.json({
      success: true,
      invoiceNumber,
      invoiceHTML
    });

  } catch (error) {
    console.error('Erreur génération facture:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération de la facture' },
      { status: 500 }
    );
  }
}
