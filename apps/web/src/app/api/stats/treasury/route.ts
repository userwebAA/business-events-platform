import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);
        if (authResult.error) return authResult.error;

        const isAdmin = authResult.user.role === 'ADMIN' || authResult.user.role === 'SUPER_ADMIN';
        const userId = authResult.user.userId;

        if (isAdmin) {
            // Admin : tous les paiements Stripe + payouts + événements payants
            const [payments, payouts, paidEvents] = await Promise.all([
                prisma.payment.findMany({
                    orderBy: { createdAt: 'desc' },
                }),
                prisma.payout.findMany({
                    orderBy: { createdAt: 'desc' },
                }),
                prisma.event.findMany({
                    where: { type: 'paid' },
                    select: {
                        id: true, title: true, date: true, location: true,
                        price: true, currentAttendees: true, organizerId: true,
                        imageUrl: true, createdAt: true,
                    },
                    orderBy: { date: 'desc' },
                }),
            ]);

            // Map des événements
            const eventMap = Object.fromEntries(paidEvents.map(e => [e.id, e]));

            // Récupérer les organisateurs
            const allOrganizerIds = [...new Set([
                ...paidEvents.map(e => e.organizerId),
                ...payments.map(p => p.organizerId),
            ])];
            const organizers = await prisma.user.findMany({
                where: { id: { in: allOrganizerIds } },
                select: { id: true, name: true, firstName: true, lastName: true, email: true, stripeOnboardingComplete: true },
            });
            const organizerMap = Object.fromEntries(organizers.map(o => [o.id, o]));

            const getOrganizerName = (id: string) => {
                const o = organizerMap[id];
                if (!o) return 'Inconnu';
                return o.firstName && o.lastName ? `${o.firstName} ${o.lastName}` : o.name;
            };

            // Mouvements bancaires (paiements Stripe réels)
            const calcStripeFee = (amount: number) => Math.round((amount * 0.0325 + 0.25) * 100) / 100;

            const stripeMovements = payments.map(p => {
                const ev = eventMap[p.eventId];
                const stripeFee = calcStripeFee(p.amount);
                return {
                    id: p.id,
                    type: 'payment' as const,
                    stripePaymentId: p.stripePaymentId,
                    amount: p.amount,
                    platformFee: p.platformFee,
                    stripeFee,
                    creatorAmount: p.creatorAmount,
                    currency: p.currency,
                    status: p.status,
                    eventId: p.eventId,
                    eventTitle: ev?.title || 'Événement supprimé',
                    eventDate: ev?.date || p.createdAt,
                    eventImage: ev?.imageUrl || null,
                    userId: p.userId,
                    organizerId: p.organizerId,
                    organizerName: getOrganizerName(p.organizerId),
                    organizerEmail: organizerMap[p.organizerId]?.email || '',
                    payoutEligibleAt: p.payoutEligibleAt,
                    payoutId: p.payoutId,
                    refundedAt: p.refundedAt,
                    stripeRefundId: p.stripeRefundId,
                    createdAt: p.createdAt,
                };
            });

            // Payouts effectués
            const payoutsList = payouts.map(p => ({
                id: p.id,
                type: 'payout' as const,
                stripeTransferId: p.stripeTransferId,
                amount: p.amount,
                currency: p.currency,
                status: p.status,
                organizerId: p.organizerId,
                organizerName: getOrganizerName(p.organizerId),
                organizerEmail: organizerMap[p.organizerId]?.email || '',
                processedAt: p.processedAt,
                failureReason: p.failureReason,
                createdAt: p.createdAt,
            }));

            // Stats par organisateur (basé sur paiements Stripe)
            const revenueByOrganizer: Record<string, { name: string; email: string; totalRevenue: number; platformFees: number; creatorAmount: number; paymentCount: number; stripeReady: boolean }> = {};
            for (const p of payments.filter(p => p.status === 'SUCCEEDED')) {
                if (!revenueByOrganizer[p.organizerId]) {
                    revenueByOrganizer[p.organizerId] = {
                        name: getOrganizerName(p.organizerId),
                        email: organizerMap[p.organizerId]?.email || '',
                        totalRevenue: 0,
                        platformFees: 0,
                        creatorAmount: 0,
                        paymentCount: 0,
                        stripeReady: organizerMap[p.organizerId]?.stripeOnboardingComplete || false,
                    };
                }
                revenueByOrganizer[p.organizerId].totalRevenue += p.amount;
                revenueByOrganizer[p.organizerId].platformFees += p.platformFee;
                revenueByOrganizer[p.organizerId].creatorAmount += p.creatorAmount;
                revenueByOrganizer[p.organizerId].paymentCount += 1;
            }

            // Fallback: événements payants sans paiements Stripe (inscriptions avant Stripe)
            const eventsWithoutPayments = paidEvents.filter(e =>
                !payments.some(p => p.eventId === e.id)
            );
            const legacyMovements = eventsWithoutPayments.map(event => ({
                id: event.id,
                type: 'legacy' as const,
                eventTitle: event.title,
                eventDate: event.date,
                eventImage: event.imageUrl,
                location: event.location,
                price: event.price || 0,
                attendees: event.currentAttendees,
                revenue: (event.price || 0) * event.currentAttendees,
                organizerId: event.organizerId,
                organizerName: getOrganizerName(event.organizerId),
                organizerEmail: organizerMap[event.organizerId]?.email || '',
                createdAt: event.createdAt,
            }));

            // Totaux
            const succeededPayments = payments.filter(p => p.status === 'SUCCEEDED');
            const totalStripeRevenue = succeededPayments.reduce((sum, p) => sum + p.amount, 0);
            const totalPlatformFees = succeededPayments.reduce((sum, p) => sum + p.platformFee, 0);
            const totalCreatorAmount = succeededPayments.reduce((sum, p) => sum + p.creatorAmount, 0);
            const totalStripeFees = succeededPayments.reduce((sum, p) => sum + calcStripeFee(p.amount), 0);
            const refundedPayments = payments.filter(p => p.status === 'REFUNDED');
            const totalRefunded = refundedPayments.reduce((sum, p) => sum + p.amount, 0);
            const totalRefundedStripeFees = refundedPayments.reduce((sum, p) => sum + calcStripeFee(p.amount), 0);
            const totalLegacyRevenue = legacyMovements.reduce((sum, m) => sum + m.revenue, 0);

            // Paiements en attente de payout
            const now = new Date();
            const pendingPayouts = succeededPayments.filter(p => !p.payoutId);
            const eligibleForPayout = pendingPayouts.filter(p => new Date(p.payoutEligibleAt) <= now);
            const waitingForPayout = pendingPayouts.filter(p => new Date(p.payoutEligibleAt) > now);

            return NextResponse.json({
                stripeMovements,
                legacyMovements,
                payouts: payoutsList,
                organizerStats: Object.entries(revenueByOrganizer)
                    .map(([id, data]) => ({ id, ...data }))
                    .sort((a, b) => b.totalRevenue - a.totalRevenue),
                summary: {
                    totalRevenue: totalStripeRevenue + totalLegacyRevenue,
                    totalStripeRevenue,
                    totalLegacyRevenue,
                    totalPlatformFees,
                    totalCreatorAmount,
                    totalStripeFees,
                    totalPayments: succeededPayments.length,
                    totalPayouts: payouts.filter(p => p.status === 'COMPLETED').length,
                    pendingPayoutAmount: eligibleForPayout.reduce((sum, p) => sum + p.creatorAmount, 0),
                    waitingPayoutAmount: waitingForPayout.reduce((sum, p) => sum + p.creatorAmount, 0),
                    pendingPayoutCount: eligibleForPayout.length,
                    waitingPayoutCount: waitingForPayout.length,
                    totalRefunded,
                    totalRefundedCount: refundedPayments.length,
                    totalRefundedStripeFees,
                },
            });
        } else {
            // Utilisateur classique : ses paiements reçus en tant qu'organisateur
            const [payments, payouts, myPaidEvents] = await Promise.all([
                prisma.payment.findMany({
                    where: { organizerId: userId, status: 'SUCCEEDED' },
                    orderBy: { createdAt: 'desc' },
                }),
                prisma.payout.findMany({
                    where: { organizerId: userId },
                    orderBy: { createdAt: 'desc' },
                }),
                prisma.event.findMany({
                    where: { organizerId: userId, type: 'paid' },
                    select: {
                        id: true, title: true, date: true, location: true,
                        price: true, currentAttendees: true, imageUrl: true, createdAt: true,
                    },
                    orderBy: { date: 'desc' },
                }),
            ]);

            const eventMap = Object.fromEntries(myPaidEvents.map(e => [e.id, e]));

            // Paiements Stripe reçus
            const stripeMovements = payments.map(p => {
                const ev = eventMap[p.eventId];
                return {
                    id: p.id,
                    type: 'payment' as const,
                    amount: p.amount,
                    platformFee: p.platformFee,
                    creatorAmount: p.creatorAmount,
                    status: p.status,
                    eventId: p.eventId,
                    eventTitle: ev?.title || 'Événement supprimé',
                    eventDate: ev?.date || p.createdAt,
                    eventImage: ev?.imageUrl || null,
                    payoutEligibleAt: p.payoutEligibleAt,
                    payoutId: p.payoutId,
                    createdAt: p.createdAt,
                };
            });

            // Événements sans paiements Stripe (avant intégration)
            const eventsWithoutPayments = myPaidEvents.filter(e =>
                !payments.some(p => p.eventId === e.id)
            );
            const legacyMovements = eventsWithoutPayments.map(event => ({
                id: event.id,
                type: 'legacy' as const,
                eventTitle: event.title,
                eventDate: event.date,
                eventImage: event.imageUrl,
                price: event.price || 0,
                attendees: event.currentAttendees,
                revenue: (event.price || 0) * event.currentAttendees,
                createdAt: event.createdAt,
            }));

            const totalCreatorAmount = payments.reduce((sum, p) => sum + p.creatorAmount, 0);
            const totalLegacyRevenue = legacyMovements.reduce((sum, m) => sum + m.revenue, 0);
            const totalPaidOut = payouts.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + p.amount, 0);

            const now = new Date();
            const pendingPayouts = payments.filter(p => !p.payoutId);
            const waitingAmount = pendingPayouts.filter(p => new Date(p.payoutEligibleAt) > now).reduce((sum, p) => sum + p.creatorAmount, 0);
            const eligibleAmount = pendingPayouts.filter(p => new Date(p.payoutEligibleAt) <= now).reduce((sum, p) => sum + p.creatorAmount, 0);

            return NextResponse.json({
                stripeMovements,
                legacyMovements,
                payouts: payouts.map(p => ({
                    id: p.id,
                    amount: p.amount,
                    status: p.status,
                    processedAt: p.processedAt,
                    createdAt: p.createdAt,
                })),
                summary: {
                    totalRevenue: totalCreatorAmount + totalLegacyRevenue,
                    totalCreatorAmount,
                    totalLegacyRevenue,
                    totalPaidOut,
                    pendingAmount: eligibleAmount,
                    waitingAmount,
                    totalPayments: payments.length,
                },
            });
        }
    } catch (error) {
        console.error('Treasury stats error:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
