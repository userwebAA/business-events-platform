import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { calculatePlatformFee, PLATFORM_FEE_FIXED, PLATFORM_FEE_THRESHOLD, PLATFORM_FEE_PERCENT_ABOVE } from '@/lib/stripe';

// GET: Récupérer les paiements reçus par l'organisateur
export async function GET(request: NextRequest) {
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

        const userId = decoded.userId;

        // Récupérer tous les paiements où l'utilisateur est l'organisateur
        const payments = await prisma.payment.findMany({
            where: { organizerId: userId },
            orderBy: { createdAt: 'desc' },
        });

        // Récupérer les événements associés
        const eventIds = [...new Set(payments.map(p => p.eventId))];
        const events = await prisma.event.findMany({
            where: { id: { in: eventIds } },
            select: { id: true, title: true, date: true, price: true, type: true, status: true },
        });
        const eventMap = new Map(events.map(e => [e.id, e]));

        // Calculer les stats
        const succeededPayments = payments.filter(p => p.status === 'SUCCEEDED');
        const refundedPayments = payments.filter(p => p.status === 'REFUNDED');

        const totalEarned = succeededPayments.reduce((sum, p) => sum + p.creatorAmount, 0);
        const totalRefunded = refundedPayments.reduce((sum, p) => sum + p.amount, 0);
        const totalPlatformFees = succeededPayments.reduce((sum, p) => sum + p.platformFee, 0);

        // Enrichir les paiements avec les infos événement
        const enrichedPayments = payments.map(p => {
            const event = eventMap.get(p.eventId);
            return {
                id: p.id,
                amount: p.amount,
                platformFee: p.platformFee,
                creatorAmount: p.creatorAmount,
                currency: p.currency,
                status: p.status,
                createdAt: p.createdAt,
                refundedAt: p.refundedAt,
                eventId: p.eventId,
                eventTitle: event?.title || 'Événement supprimé',
                eventDate: event?.date,
                eventStatus: event?.status,
                registrationId: p.registrationId,
            };
        });

        return NextResponse.json({
            payments: enrichedPayments,
            stats: {
                totalEarned: Math.round(totalEarned * 100) / 100,
                totalRefunded: Math.round(totalRefunded * 100) / 100,
                totalPlatformFees: Math.round(totalPlatformFees * 100) / 100,
                totalPayments: succeededPayments.length,
                totalRefunds: refundedPayments.length,
            },
            feeInfo: {
                fixedFee: PLATFORM_FEE_FIXED,
                threshold: PLATFORM_FEE_THRESHOLD,
                percentAbove: PLATFORM_FEE_PERCENT_ABOVE,
                stripeFeePercent: 2.9,
                stripeFeeFixed: 0.25,
                stripeConnectPercent: 0.25,
            },
        });
    } catch (error) {
        console.error('Erreur organizer payments:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
