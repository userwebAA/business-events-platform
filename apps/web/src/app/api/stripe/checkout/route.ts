import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe, calculatePlatformFee } from '@/lib/stripe';
import { requireAuth } from '@/lib/auth-middleware';
import { applyRateLimit } from '@/lib/rate-limiter';

// POST: Créer une session Stripe Checkout pour un événement payant
export async function POST(request: NextRequest) {
    // Rate limiting: 5 req / 5 min
    const rateLimited = applyRateLimit(request, 'checkout', 5, 300000);
    if (rateLimited) return rateLimited;

    try {
        const authResult = await requireAuth(request);
        if (authResult.error) return authResult.error;

        const userId = authResult.user.userId;
        const body = await request.json();
        const { eventId, formData } = body;

        if (!eventId) {
            return NextResponse.json({ error: 'eventId requis' }, { status: 400 });
        }

        // Récupérer l'événement
        const event = await prisma.event.findUnique({
            where: { id: eventId },
        });

        if (!event) {
            return NextResponse.json({ error: 'Événement non trouvé' }, { status: 404 });
        }

        if (event.type !== 'paid' || !event.price) {
            return NextResponse.json({ error: 'Cet événement est gratuit' }, { status: 400 });
        }

        // Vérifier que le créateur a un compte Stripe Connect actif
        const organizer = await prisma.user.findUnique({
            where: { id: event.organizerId },
            select: { stripeAccountId: true, stripeOnboardingComplete: true },
        });

        if (!organizer?.stripeAccountId || !organizer.stripeOnboardingComplete) {
            return NextResponse.json(
                { error: 'Le créateur de cet événement n\'a pas encore configuré ses paiements' },
                { status: 400 }
            );
        }

        // Vérifier places disponibles
        if (event.maxAttendees && event.currentAttendees >= event.maxAttendees) {
            return NextResponse.json({ error: 'Événement complet' }, { status: 400 });
        }

        // Calculer les montants
        const amountInCents = Math.round(event.price * 100);
        const platformFeeInCents = Math.round(calculatePlatformFee(event.price) * 100);

        const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        // Créer la session Stripe Checkout avec transfert vers le compte Connect
        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: event.currency.toLowerCase(),
                        product_data: {
                            name: event.title,
                            description: `Inscription à ${event.title}`,
                            images: event.imageUrl && event.imageUrl.startsWith('http') && event.imageUrl.length < 2048 ? [event.imageUrl] : [],
                        },
                        unit_amount: amountInCents,
                    },
                    quantity: 1,
                },
            ],
            payment_intent_data: {
                application_fee_amount: platformFeeInCents,
                transfer_data: {
                    destination: organizer.stripeAccountId,
                },
                metadata: {
                    eventId: event.id,
                    userId,
                    organizerId: event.organizerId,
                    formData: JSON.stringify(formData),
                },
            },
            metadata: {
                eventId: event.id,
                userId,
                organizerId: event.organizerId,
                formData: JSON.stringify(formData),
            },
            success_url: `${origin}/events/${event.id}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/events/${event.id}/register`,
        });

        return NextResponse.json({ url: session.url, sessionId: session.id });
    } catch (error: any) {
        console.error('❌ Stripe Checkout error:', error?.message || error);
        console.error('❌ Stripe error type:', error?.type);
        console.error('❌ Stripe error code:', error?.code);
        return NextResponse.json(
            { error: 'Erreur lors de la création du paiement: ' + (error?.message || 'Unknown') },
            { status: 500 }
        );
    }
}
