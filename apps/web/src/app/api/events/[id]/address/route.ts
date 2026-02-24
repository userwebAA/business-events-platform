import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { securityLogger, SecurityEventType } from '@/lib/security-logger';
import { getClientIp } from '@/lib/auth-middleware';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || undefined;

  try {
    const { registrationId } = await request.json();

    if (!registrationId) {
      return NextResponse.json(
        { error: 'ID d\'inscription requis' },
        { status: 400 }
      );
    }

    // Vérifier que l'inscription existe et correspond à cet événement
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        event: {
          select: {
            id: true,
            type: true,
            address: true,
            title: true,
          },
        },
      },
    });

    if (!registration) {
      securityLogger.log({
        eventType: SecurityEventType.UNAUTHORIZED_ACCESS,
        ip,
        userAgent,
        details: `Attempted to access address with invalid registration ID: ${registrationId}`,
      });

      return NextResponse.json(
        { error: 'Inscription non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier que l'inscription correspond bien à cet événement
    if (registration.eventId !== params.id) {
      securityLogger.log({
        eventType: SecurityEventType.UNAUTHORIZED_ACCESS,
        ip,
        userAgent,
        details: `Registration ${registrationId} does not match event ${params.id}`,
      });

      return NextResponse.json(
        { error: 'Inscription invalide pour cet événement' },
        { status: 403 }
      );
    }

    // Logger l'accès à l'adresse
    const formData = registration.formData as any;
    securityLogger.log({
      eventType: SecurityEventType.UNAUTHORIZED_ACCESS,
      email: formData?.email,
      ip,
      userAgent,
      details: `Address accessed for event: ${registration.event.title} (${params.id})`,
    });

    // Retourner l'adresse uniquement si l'utilisateur est inscrit
    return NextResponse.json({
      address: registration.event.address,
      eventId: registration.event.id,
      registrationId: registration.id,
    });
  } catch (error) {
    console.error('Address access error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'adresse' },
      { status: 500 }
    );
  }
}
