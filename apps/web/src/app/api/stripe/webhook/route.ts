import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe, calculatePlatformFee, PAYOUT_DELAY_DAYS } from '@/lib/stripe';
import { generateTicket } from '@/lib/ticketService';
import { sendConfirmationEmailWithTicket } from '@/lib/emailTemplates';
import { generateTicketPDF } from '@/lib/pdfTicketGenerator';
import Stripe from 'stripe';

// Désactiver le body parser de Next.js pour les webhooks Stripe
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
        return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                await handleCheckoutCompleted(session);
                break;
            }

            case 'charge.refunded': {
                const charge = event.data.object as Stripe.Charge;
                await handleChargeRefunded(charge);
                break;
            }

            case 'account.updated': {
                const account = event.data.object as Stripe.Account;
                await handleAccountUpdated(account);
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook handler error:', error);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
    }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const metadata = session.metadata;
    if (!metadata?.eventId || !metadata?.userId) {
        console.error('Missing metadata in checkout session');
        return;
    }

    const eventId = metadata.eventId;
    const userId = metadata.userId;
    const organizerId = metadata.organizerId;
    const formData = metadata.formData ? JSON.parse(metadata.formData) : {};

    // Récupérer l'événement
    const eventData = await prisma.event.findUnique({ where: { id: eventId } });
    if (!eventData) {
        console.error('Event not found:', eventId);
        return;
    }

    const amount = (session.amount_total || 0) / 100;
    const platformFee = calculatePlatformFee(amount);
    const creatorAmount = amount - platformFee;

    // Calculer la date d'éligibilité au payout
    const payoutEligibleAt = new Date();
    payoutEligibleAt.setDate(payoutEligibleAt.getDate() + PAYOUT_DELAY_DAYS);

    // Créer l'inscription
    const registration = await prisma.registration.create({
        data: {
            eventId,
            formData,
        },
        include: { event: true },
    });

    // Incrémenter le nombre de participants
    await prisma.event.update({
        where: { id: eventId },
        data: { currentAttendees: { increment: 1 } },
    });

    // Créer le Payment en base
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

    // Attribuer un badge de soirée
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
    const ticket = await generateTicket(registration.id);

    // Envoyer l'email de confirmation
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
            console.error('PDF generation error:', e);
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
        } catch (e) {
            console.error('Email send error:', e);
        }
    }

    console.log(`✅ Payment completed: ${amount}€ for event ${eventData.title} (creator gets ${creatorAmount}€ after ${PAYOUT_DELAY_DAYS} days)`);
}

async function handleChargeRefunded(charge: Stripe.Charge) {
    const paymentIntentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
    if (!paymentIntentId) return;

    // Trouver le paiement en base
    const payment = await prisma.payment.findUnique({
        where: { stripePaymentId: paymentIntentId },
    });

    if (!payment) {
        console.log(`Charge refunded for unknown payment intent: ${paymentIntentId}`);
        return;
    }

    // Mettre à jour le statut si pas déjà fait (le refund API le fait aussi)
    if (payment.status !== 'REFUNDED') {
        await prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: 'REFUNDED',
                refundedAt: new Date(),
            },
        });
    }

    console.log(`💸 Webhook: Remboursement confirmé pour payment ${payment.id} (${payment.amount}€)`);
}

async function handleAccountUpdated(account: Stripe.Account) {
    if (!account.id) return;

    const isComplete = account.charges_enabled && account.payouts_enabled;

    await prisma.user.updateMany({
        where: { stripeAccountId: account.id },
        data: { stripeOnboardingComplete: isComplete },
    });

    console.log(`Stripe account ${account.id} updated: charges=${account.charges_enabled}, payouts=${account.payouts_enabled}`);
}
