import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEventUpdateNotificationEmail } from '@/lib/emailTemplates';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const event = await prisma.event.findUnique({
            where: { id: params.id },
            include: {
                registrationFields: true,
                registrations: true,
            },
        });

        if (!event) {
            return NextResponse.json(
                { error: 'Événement non trouvé' },
                { status: 404 }
            );
        }

        // Récupérer le profil public de l'organisateur
        let organizer = null;
        if (event.organizerId) {
            organizer = await prisma.user.findUnique({
                where: { id: event.organizerId },
                select: {
                    id: true,
                    name: true,
                    firstName: true,
                    lastName: true,
                    photo: true,
                    company: true,
                    position: true,
                    bio: true,
                    location: true,
                },
            });
        }

        const eventWithOrganizer = { ...event, organizer };

        // Masquer l'adresse exacte pour les événements payants
        // L'adresse sera accessible uniquement via /api/events/:id/address après inscription
        if (event.type === 'paid') {
            return NextResponse.json({
                ...eventWithOrganizer,
                address: '🔒 Adresse révélée après inscription',
            });
        }

        return NextResponse.json(eventWithOrganizer);
    } catch (error) {
        console.error(' Erreur récupération événement:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la récupération de l\'événement' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { notifyAttendees, updateMessage, ...eventData } = body;

        // Récupérer l'événement avant modification pour comparaison
        const oldEvent = await prisma.event.findUnique({
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

        const event = await prisma.event.update({
            where: { id: params.id },
            data: {
                ...eventData,
                date: eventData.date ? new Date(eventData.date) : undefined,
                endDate: eventData.endDate ? new Date(eventData.endDate) : undefined,
            },
            include: {
                registrationFields: true,
            },
        });

        // Envoyer les notifications si demandé et qu'il y a des inscrits
        if (notifyAttendees && oldEvent?.registrations && oldEvent.registrations.length > 0) {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || 'https://app.example.com';
            const eventUrl = event.isPrivate && event.accessToken
                ? `${baseUrl}/events/private/${event.accessToken}`
                : `${baseUrl}/events/${event.id}`;

            // Envoyer les notifications par batch de 20
            const batchSize = 20;
            const registrations = oldEvent.registrations;

            for (let i = 0; i < registrations.length; i += batchSize) {
                const batch = registrations.slice(i, i + batchSize);
                await Promise.allSettled(
                    batch.map(async (registration) => {
                        const formData = registration.formData as any;
                        const email = formData?.email || formData?.mail;
                        const name = formData?.name || formData?.firstName || formData?.nom || 'Participant';

                        if (!email) return;

                        return sendEventUpdateNotificationEmail({
                            to: email,
                            attendeeName: name,
                            eventTitle: event.title,
                            eventDate: event.date,
                            eventLocation: event.location,
                            eventUrl,
                            changes: updateMessage || 'L\'événement a été modifié. Consultez les détails mis à jour.',
                        });
                    })
                );
            }
        }

        return NextResponse.json(event);
    } catch (error) {
        console.error(' Erreur mise à jour événement:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la mise à jour de l\'événement' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.event.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ message: 'Événement supprimé', id: params.id });
    } catch (error) {
        console.error(' Erreur suppression événement:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la suppression de l\'événement' },
            { status: 500 }
        );
    }
}
