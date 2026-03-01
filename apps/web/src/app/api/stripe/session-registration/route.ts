import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe, calculatePlatformFee, PAYOUT_DELAY_DAYS } from '@/lib/stripe';
import { generateTicket } from '@/lib/ticketService';
import { sendConfirmationEmailWithTicket, sendNewRegistrationEmail } from '@/lib/emailTemplates';
import { generateTicketPDF } from '@/lib/pdfTicketGenerator';

// GET: Récupérer le registrationId à partir du session_id Stripe
// Si le webhook n'a pas encore traité la session, on le fait ici (fallback)
export async function GET(request: NextRequest) {
    try {
        const sessionId = request.nextUrl.searchParams.get('session_id');
        if (!sessionId) {
            return NextResponse.json({ error: 'session_id requis' }, { status: 400 });
        }

        // 1. Vérifier si le payment existe déjà (webhook l'a créé)
        const existingPayment = await prisma.payment.findFirst({
            where: { stripeSessionId: sessionId },
            select: { registrationId: true },
        });

        if (existingPayment?.registrationId) {
            return NextResponse.json({ registrationId: existingPayment.registrationId });
        }

        // 2. Le webhook n'a pas encore traité → vérifier la session Stripe et créer nous-mêmes
        console.log('⚡ Fallback: webhook pas encore reçu, traitement de la session', sessionId);

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status !== 'paid') {
            return NextResponse.json({ error: 'Paiement non complété' }, { status: 402 });
        }

        const metadata = session.metadata;
        if (!metadata?.eventId || !metadata?.userId) {
            return NextResponse.json({ error: 'Metadata manquante' }, { status: 400 });
        }

        const eventId = metadata.eventId;
        const userId = metadata.userId;
        const organizerId = metadata.organizerId;
        const formData = metadata.formData ? JSON.parse(metadata.formData) : {};

        // Vérifier qu'on n'a pas déjà créé (race condition)
        const doubleCheck = await prisma.payment.findFirst({
            where: { stripeSessionId: sessionId },
            select: { registrationId: true },
        });
        if (doubleCheck?.registrationId) {
            return NextResponse.json({ registrationId: doubleCheck.registrationId });
        }

        const eventData = await prisma.event.findUnique({ where: { id: eventId } });
        if (!eventData) {
            return NextResponse.json({ error: 'Événement non trouvé' }, { status: 404 });
        }

        const amount = (session.amount_total || 0) / 100;
        const platformFee = calculatePlatformFee(amount);
        const creatorAmount = amount - platformFee;

        const payoutEligibleAt = new Date();
        payoutEligibleAt.setDate(payoutEligibleAt.getDate() + PAYOUT_DELAY_DAYS);

        // Créer l'inscription
        const registration = await prisma.registration.create({
            data: {
                eventId,
                formData,
                userId,
            },
        });

        // Incrémenter le nombre de participants
        await prisma.event.update({
            where: { id: eventId },
            data: { currentAttendees: { increment: 1 } },
        });

        // Créer le Payment
        await prisma.payment.create({
            data: {
                stripePaymentId: session.payment_intent as string,
                stripeSessionId: session.id,
                amount,
                platformFee,
                creatorAmount,
                currency: session.currency?.toUpperCase() || 'EUR',
                status: 'SUCCEEDED',
                userId,
                eventId,
                registrationId: registration.id,
                organizerId: organizerId || eventData.organizerId,
                payoutEligibleAt,
            },
        });

        // Badge
        try {
            await prisma.eventBadge.create({
                data: {
                    userId,
                    eventId,
                    eventTitle: eventData.title,
                    eventImage: eventData.imageUrl,
                    eventDate: eventData.date,
                    role: 'attendee',
                },
            });
        } catch (e) {
            // Badge déjà existant
        }

        // Générer le billet
        try {
            const ticket = await generateTicket(registration.id);

            // Envoyer l'email de confirmation au participant
            const userEmail = formData.email || formData.mail;
            const userName = formData.name || formData.firstName || formData.nom || 'Participant';

            if (userEmail) {
                let ticketPdfBuffer: Buffer | undefined;
                try {
                    ticketPdfBuffer = await generateTicketPDF({
                        ticketId: ticket.id,
                        qrCode: ticket.qrCode,
                        eventTitle: eventData.title,
                        eventDate: eventData.date,
                        eventLocation: eventData.location,
                        eventAddress: eventData.address,
                        attendeeName: userName,
                        attendeeEmail: userEmail,
                        registrationId: registration.id,
                    });
                } catch (e) {
                    console.error('⚠️ PDF generation error:', e);
                }

                try {
                    await sendConfirmationEmailWithTicket(
                        userEmail,
                        {
                            attendeeName: userName,
                            eventTitle: eventData.title,
                            eventDate: eventData.date,
                            eventLocation: eventData.location,
                            eventAddress: eventData.address,
                            registrationId: registration.id,
                            isPaid: true,
                            price: eventData.price || undefined,
                            currency: eventData.currency || undefined,
                        },
                        ticketPdfBuffer
                    );
                    console.log('✅ Email de confirmation envoyé à:', userEmail);
                } catch (e) {
                    console.error('⚠️ Erreur envoi email confirmation:', e);
                }
            }

            // Notifier l'organisateur
            try {
                const organizer = await prisma.user.findUnique({
                    where: { id: organizerId || eventData.organizerId },
                    select: { email: true, name: true, firstName: true },
                });
                if (organizer?.email) {
                    await sendNewRegistrationEmail({
                        to: organizer.email,
                        organizerName: organizer.firstName || organizer.name || 'Organisateur',
                        attendeeName: userName,
                        attendeeEmail: userEmail || 'Non renseigné',
                        eventTitle: eventData.title,
                        eventDate: eventData.date,
                        eventId: eventData.id,
                        currentAttendees: eventData.currentAttendees + 1,
                        maxAttendees: eventData.maxAttendees,
                    });
                    console.log('✅ Email notification envoyé à l\'organisateur:', organizer.email);
                }
            } catch (e) {
                console.error('⚠️ Erreur envoi notification organisateur:', e);
            }
        } catch (e) {
            console.error('⚠️ Erreur génération billet:', e);
        }

        console.log(`✅ Fallback: inscription créée pour session ${sessionId}`);
        return NextResponse.json({ registrationId: registration.id });
    } catch (error) {
        console.error('Erreur récupération/création registration par session:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
