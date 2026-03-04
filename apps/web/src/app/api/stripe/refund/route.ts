import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { requireAuth } from '@/lib/auth-middleware';

// POST: Rembourser un paiement (admin ou créateur de l'événement)
export async function POST(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);
        if (authResult.error) return authResult.error;

        const userId = authResult.user.userId;
        const userRole = authResult.user.role;
        const body = await request.json();
        const { paymentId, reason } = body;

        if (!paymentId) {
            return NextResponse.json({ error: 'paymentId requis' }, { status: 400 });
        }

        // Récupérer le paiement
        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
        });

        if (!payment) {
            return NextResponse.json({ error: 'Paiement non trouvé' }, { status: 404 });
        }

        if (payment.status === 'REFUNDED') {
            return NextResponse.json({ error: 'Ce paiement a déjà été remboursé' }, { status: 400 });
        }

        // Vérifier les droits : admin ou créateur de l'événement
        const isAdmin = userRole === 'ADMIN';
        const isOrganizer = payment.organizerId === userId;

        if (!isAdmin && !isOrganizer) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }

        // Effectuer le remboursement via Stripe
        // reverse_transfer: true → annule le transfert vers le compte Connect du créateur
        // refund_application_fee: false → on garde notre commission plateforme
        const refund = await stripe.refunds.create({
            payment_intent: payment.stripePaymentId,
            reason: 'requested_by_customer',
            reverse_transfer: true,
            refund_application_fee: false,
            metadata: {
                paymentId: payment.id,
                eventId: payment.eventId,
                reason: reason || 'Remboursement demandé',
            },
        });

        // Mettre à jour le paiement en base
        await prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: 'REFUNDED',
                refundedAt: new Date(),
                stripeRefundId: refund.id,
            },
        });

        // Décrémenter le nombre de participants
        await prisma.event.update({
            where: { id: payment.eventId },
            data: { currentAttendees: { decrement: 1 } },
        });

        // Supprimer l'inscription associée si elle existe
        if (payment.registrationId) {
            await prisma.registration.delete({
                where: { id: payment.registrationId },
            }).catch(() => {
                // Inscription peut ne plus exister
            });
        }

        console.log(`💸 Remboursement effectué: ${payment.amount}€ pour l'événement ${payment.eventId} (refund: ${refund.id})`);

        return NextResponse.json({
            success: true,
            refundId: refund.id,
            amount: payment.amount,
            message: `Remboursement de ${payment.amount}€ effectué`,
        });
    } catch (error: any) {
        console.error('Refund error:', error?.message || error);
        return NextResponse.json(
            { error: error?.message || 'Erreur lors du remboursement' },
            { status: 500 }
        );
    }
}