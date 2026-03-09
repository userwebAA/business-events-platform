import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { calculatePlatformFee, calculateStripeFee, PLATFORM_FEE_FIXED, PLATFORM_FEE_THRESHOLD, PLATFORM_FEE_PERCENT_ABOVE } from '@/lib/stripe';

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
            select: { id: true, title: true, date: true, price: true, type: true, status: true, currentAttendees: true },
        });
        const eventMap = new Map(events.map(e => [e.id, e]));

        // Récupérer les inscriptions associées (nom du participant)
        const registrationIds = payments.map(p => p.registrationId).filter(Boolean) as string[];
        const registrations = registrationIds.length > 0 ? await prisma.registration.findMany({
            where: { id: { in: registrationIds } },
            select: { id: true, formData: true },
        }) : [];
        const regMap = new Map(registrations.map(r => [r.id, r]));

        // Calculer les stats
        const succeededPayments = payments.filter(p => p.status === 'SUCCEEDED');
        const refundedPayments = payments.filter(p => p.status === 'REFUNDED');

        const totalEarned = succeededPayments.reduce((sum, p) => sum + p.creatorAmount, 0);
        const totalRefunded = refundedPayments.reduce((sum, p) => sum + p.amount, 0);
        const totalPlatformFees = succeededPayments.reduce((sum, p) => sum + p.platformFee, 0);
        const totalStripeFees = succeededPayments.reduce((sum, p) => sum + calculateStripeFee(p.amount), 0);

        // Enrichir les paiements avec les infos événement + participant
        const enrichedPayments = payments.map(p => {
            const event = eventMap.get(p.eventId);
            const reg = p.registrationId ? regMap.get(p.registrationId) : null;
            const formData = reg?.formData as any;
            const participantName = formData?.name || formData?.firstName || 'Participant';
            const participantEmail = formData?.email || '';
            const stripeFee = calculateStripeFee(p.amount);
            return {
                id: p.id,
                amount: p.amount,
                platformFee: p.platformFee,
                stripeFee,
                creatorAmount: p.creatorAmount,
                currency: p.currency,
                status: p.status,
                createdAt: p.createdAt,
                refundedAt: p.refundedAt,
                eventId: p.eventId,
                eventTitle: event?.title || 'Événement supprimé',
                eventDate: event?.date,
                eventPrice: event?.price,
                eventStatus: event?.status,
                eventAttendees: event?.currentAttendees || 0,
                registrationId: p.registrationId,
                participantName,
                participantEmail,
            };
        });

        return NextResponse.json({
            payments: enrichedPayments,
            stats: {
                totalEarned: Math.round(totalEarned * 100) / 100,
                totalRefunded: Math.round(totalRefunded * 100) / 100,
                totalPlatformFees: Math.round(totalPlatformFees * 100) / 100,
                totalStripeFees: Math.round(totalStripeFees * 100) / 100,
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
