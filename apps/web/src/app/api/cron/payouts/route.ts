import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

const CRON_SECRET = process.env.CRON_SECRET || '';

// GET: Traiter les payouts éligibles (paiements > 7 jours)
// Appelé automatiquement par Vercel Cron tous les jours à 6h
export async function GET(request: NextRequest) {
    try {
        // Vérifier l'autorisation
        const authHeader = request.headers.get('authorization');
        if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const now = new Date();

        // Trouver tous les paiements éligibles au payout (date dépassée, pas encore payés)
        const eligiblePayments = await prisma.payment.findMany({
            where: {
                status: 'SUCCEEDED',
                payoutEligibleAt: { lte: now },
                payoutId: null, // Pas encore associé à un payout
            },
            orderBy: { createdAt: 'asc' },
        });

        if (eligiblePayments.length === 0) {
            return NextResponse.json({ message: 'Aucun payout à traiter', processed: 0 });
        }

        // Grouper par organisateur
        const byOrganizer: Record<string, typeof eligiblePayments> = {};
        for (const payment of eligiblePayments) {
            if (!byOrganizer[payment.organizerId]) {
                byOrganizer[payment.organizerId] = [];
            }
            byOrganizer[payment.organizerId].push(payment);
        }

        let processedCount = 0;
        let failedCount = 0;
        const results: any[] = [];

        for (const [organizerId, payments] of Object.entries(byOrganizer)) {
            try {
                // Récupérer le compte Stripe du créateur
                const organizer = await prisma.user.findUnique({
                    where: { id: organizerId },
                    select: { stripeAccountId: true, stripeOnboardingComplete: true, name: true, email: true },
                });

                if (!organizer?.stripeAccountId || !organizer.stripeOnboardingComplete) {
                    console.warn(`Organizer ${organizerId} has no active Stripe account, skipping payout`);
                    results.push({
                        organizerId,
                        status: 'skipped',
                        reason: 'No active Stripe account',
                    });
                    continue;
                }

                // Calculer le montant total à transférer
                const totalAmount = payments.reduce((sum: number, p: any) => sum + p.creatorAmount, 0);
                const totalAmountCents = Math.round(totalAmount * 100);

                if (totalAmountCents <= 0) {
                    continue;
                }

                // Note: Avec Stripe Connect Express et payment_intent_data.transfer_data,
                // les transferts sont déjà effectués automatiquement lors du paiement.
                // Ce cron sert à tracker et enregistrer les payouts dans notre base.
                // Si on utilisait des transferts manuels, on ferait:
                // const transfer = await stripe.transfers.create({...});

                // Créer le payout en base
                const payout = await prisma.payout.create({
                    data: {
                        amount: totalAmount,
                        currency: payments[0].currency,
                        status: 'COMPLETED',
                        organizerId,
                        stripeAccountId: organizer.stripeAccountId,
                        processedAt: now,
                    },
                });

                // Associer les paiements au payout
                await prisma.payment.updateMany({
                    where: { id: { in: payments.map(p => p.id) } },
                    data: { payoutId: payout.id },
                });

                processedCount += payments.length;
                results.push({
                    organizerId,
                    organizerName: organizer.name,
                    amount: totalAmount,
                    paymentsCount: payments.length,
                    status: 'completed',
                    payoutId: payout.id,
                });

                console.log(`✅ Payout ${payout.id}: ${totalAmount}€ vers ${organizer.name} (${payments.length} paiements)`);
            } catch (error) {
                failedCount += payments.length;
                console.error(`❌ Payout failed for organizer ${organizerId}:`, error);
                results.push({
                    organizerId,
                    status: 'failed',
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }

        return NextResponse.json({
            message: `Payouts traités`,
            processed: processedCount,
            failed: failedCount,
            results,
        });
    } catch (error) {
        console.error('Cron payouts error:', error);
        return NextResponse.json({ error: 'Erreur lors du traitement des payouts' }, { status: 500 });
    }
}

// POST: Voir les payouts en attente (pour les admins)
export async function POST(request: NextRequest) {
    try {
        const now = new Date();

        const pendingPayments = await prisma.payment.findMany({
            where: {
                status: 'SUCCEEDED',
                payoutId: null,
            },
            orderBy: { payoutEligibleAt: 'asc' },
        });

        const eligible = pendingPayments.filter(p => new Date(p.payoutEligibleAt) <= now);
        const waiting = pendingPayments.filter(p => new Date(p.payoutEligibleAt) > now);

        return NextResponse.json({
            eligibleCount: eligible.length,
            eligibleAmount: eligible.reduce((sum, p) => sum + p.creatorAmount, 0),
            waitingCount: waiting.length,
            waitingAmount: waiting.reduce((sum, p) => sum + p.creatorAmount, 0),
        });
    } catch (error) {
        console.error('Pending payouts error:', error);
        return NextResponse.json({ error: 'Erreur' }, { status: 500 });
    }
}