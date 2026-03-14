import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { sendEventInvitationEmail } from '@/lib/emailTemplates';

export const dynamic = 'force-dynamic';

// POST - Envoyer des invitations par email pour un événement
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
        }

        const body = await request.json();
        const { emails } = body;

        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            return NextResponse.json({ error: 'Liste d\'emails requise' }, { status: 400 });
        }

        // Récupérer l'événement
        const event = await prisma.event.findUnique({
            where: { id: params.id },
        });

        if (!event) {
            return NextResponse.json({ error: 'Événement non trouvé' }, { status: 404 });
        }

        // Vérifier que l'utilisateur est l'organisateur
        if (event.organizerId !== decoded.userId) {
            return NextResponse.json({ error: 'Seul l\'organisateur peut envoyer des invitations' }, { status: 403 });
        }

        // Récupérer le nom de l'organisateur
        const organizer = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { firstName: true, name: true },
        });
        const organizerName = organizer?.firstName || organizer?.name || 'Un organisateur';

        // Construire l'URL de l'événement
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || 'https://app.example.com';
        const eventUrl = event.isPrivate && event.accessToken
            ? `${baseUrl}/events/private/${event.accessToken}`
            : `${baseUrl}/events/${event.id}`;

        // Envoyer les emails en parallèle (par lots de 20 pour supporter 100+ destinataires)
        const batchSize = 20;
        let sent = 0;
        let failed = 0;

        for (let i = 0; i < emails.length; i += batchSize) {
            const batch = emails.slice(i, i + batchSize);
            const results = await Promise.allSettled(
                batch.map((email: string) =>
                    sendEventInvitationEmail({
                        to: email.trim().toLowerCase(),
                        eventTitle: event.title,
                        eventDate: event.date,
                        eventLocation: event.location,
                        eventDescription: event.description,
                        organizerName,
                        eventUrl,
                        isPaid: event.type === 'paid',
                        price: event.price || undefined,
                    })
                )
            );

            results.forEach((result) => {
                if (result.status === 'fulfilled' && (result.value as any).success) {
                    sent++;
                } else {
                    failed++;
                }
            });
        }

        return NextResponse.json({
            success: true,
            sent,
            failed,
            total: emails.length,
        });
    } catch (error) {
        console.error('Erreur envoi invitations:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
