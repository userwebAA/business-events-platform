import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { sendEventFollowUpEmail } from '@/lib/emailTemplates';

export const dynamic = 'force-dynamic';

// POST - Envoyer des emails de relance pour un événement
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
        const { targetType, contactListIds, customMessage } = body;
        // targetType: 'registered' | 'contactLists'
        // contactListIds: string[] (si targetType === 'contactLists')
        // customMessage: string (optionnel)

        // Récupérer l'événement
        const event = await prisma.event.findUnique({
            where: { id: params.id },
            include: {
                registrations: {
                    select: {
                        id: true,
                        formData: true,
                    },
                },
            },
        });

        if (!event) {
            return NextResponse.json({ error: 'Événement non trouvé' }, { status: 404 });
        }

        // Vérifier que l'utilisateur est l'organisateur
        if (event.organizerId !== decoded.userId) {
            return NextResponse.json({ error: 'Seul l\'organisateur peut envoyer des relances' }, { status: 403 });
        }

        // Construire l'URL de l'événement
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || 'https://app.example.com';
        const eventUrl = event.isPrivate && event.accessToken
            ? `${baseUrl}/events/private/${event.accessToken}`
            : `${baseUrl}/events/${event.id}`;

        let recipients: Array<{ email: string; name: string; isRegistered: boolean }> = [];

        // Récupérer les destinataires selon le type
        if (targetType === 'registered') {
            // Envoyer aux inscrits actuels
            recipients = event.registrations.map((reg) => {
                const formData = reg.formData as any;
                return {
                    email: formData?.email || formData?.mail,
                    name: formData?.name || formData?.firstName || formData?.nom || 'Participant',
                    isRegistered: true,
                };
            }).filter(r => r.email);
        } else if (targetType === 'contactLists' && contactListIds && contactListIds.length > 0) {
            // Envoyer aux listes de contacts sélectionnées
            const contactLists = await prisma.contactList.findMany({
                where: {
                    id: { in: contactListIds },
                    userId: decoded.userId,
                },
            });

            const allEmails = new Set<string>();
            contactLists.forEach(list => {
                (list.emails as string[]).forEach(email => allEmails.add(email.toLowerCase()));
            });

            recipients = Array.from(allEmails).map(email => ({
                email,
                name: email.split('@')[0],
                isRegistered: false,
            }));
        } else {
            return NextResponse.json({ error: 'Type de destinataires invalide' }, { status: 400 });
        }

        if (recipients.length === 0) {
            return NextResponse.json({ error: 'Aucun destinataire trouvé' }, { status: 400 });
        }

        // Envoyer les emails par batch de 20
        const batchSize = 20;
        let sent = 0;
        let failed = 0;

        for (let i = 0; i < recipients.length; i += batchSize) {
            const batch = recipients.slice(i, i + batchSize);
            const results = await Promise.allSettled(
                batch.map((recipient) =>
                    sendEventFollowUpEmail({
                        to: recipient.email,
                        recipientName: recipient.name,
                        eventTitle: event.title,
                        eventDate: event.date,
                        eventLocation: event.location,
                        eventUrl,
                        customMessage,
                        isRegistered: recipient.isRegistered,
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
            total: recipients.length,
        });
    } catch (error) {
        console.error('Erreur envoi relances:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
