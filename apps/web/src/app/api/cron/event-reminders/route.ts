import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEventReminderEmail } from '@/lib/emailTemplates';

export const dynamic = 'force-dynamic';

// API Cron pour envoyer les rappels 1 semaine avant les événements
// À appeler quotidiennement via un service cron (Vercel Cron, GitHub Actions, etc.)
export async function GET(request: NextRequest) {
    try {
        // Vérifier l'authentification du cron (optionnel mais recommandé)
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;
        
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        // Calculer la date dans 7 jours (avec une marge de 12h)
        const now = new Date();
        const sevenDaysFromNow = new Date(now);
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        
        // Plage : entre 6.5 et 7.5 jours
        const startRange = new Date(sevenDaysFromNow);
        startRange.setHours(startRange.getHours() - 12);
        const endRange = new Date(sevenDaysFromNow);
        endRange.setHours(endRange.getHours() + 12);

        // Récupérer les événements dans 7 jours (non annulés)
        const upcomingEvents = await prisma.event.findMany({
            where: {
                date: {
                    gte: startRange,
                    lte: endRange,
                },
                status: {
                    not: 'cancelled',
                },
            },
            include: {
                registrations: {
                    select: {
                        id: true,
                        formData: true,
                    },
                },
            },
        });

        let totalSent = 0;
        let totalFailed = 0;

        // Pour chaque événement, envoyer un rappel à tous les inscrits
        for (const event of upcomingEvents) {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.example.com';
            const eventUrl = event.isPrivate && event.accessToken
                ? `${baseUrl}/events/private/${event.accessToken}`
                : `${baseUrl}/events/${event.id}`;

            // Envoyer les rappels par batch de 20
            const batchSize = 20;
            const registrations = event.registrations;

            for (let i = 0; i < registrations.length; i += batchSize) {
                const batch = registrations.slice(i, i + batchSize);
                const results = await Promise.allSettled(
                    batch.map(async (registration) => {
                        const formData = registration.formData as any;
                        const email = formData?.email || formData?.mail;
                        const name = formData?.name || formData?.firstName || formData?.nom || 'Participant';

                        if (!email) {
                            return { success: false };
                        }

                        return sendEventReminderEmail({
                            to: email,
                            attendeeName: name,
                            eventTitle: event.title,
                            eventDate: event.date,
                            eventLocation: event.location,
                            eventAddress: event.address,
                            eventUrl,
                        });
                    })
                );

                results.forEach((result) => {
                    if (result.status === 'fulfilled' && (result.value as any).success) {
                        totalSent++;
                    } else {
                        totalFailed++;
                    }
                });
            }
        }

        return NextResponse.json({
            success: true,
            eventsProcessed: upcomingEvents.length,
            remindersSent: totalSent,
            remindersFailed: totalFailed,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Erreur cron rappels événements:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
