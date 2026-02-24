import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { sendEventCancelledEmail } from '@/lib/emailTemplates';
import { verifyToken } from '@/lib/auth';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Vérifier l'authentification
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = await verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
        }

        const body = await request.json();
        const { reason } = body;

        // Récupérer l'événement avec ses inscriptions
        const event = await prisma.event.findUnique({
            where: { id: params.id },
            include: { registrations: true },
        });

        if (!event) {
            return NextResponse.json({ error: 'Événement non trouvé' }, { status: 404 });
        }

        // Vérifier que l'utilisateur est l'organisateur ou admin
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!user) {
            return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
        }

        if (event.organizerId !== decoded.userId && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }

        // Mettre à jour le statut de l'événement
        await prisma.event.update({
            where: { id: params.id },
            data: { status: 'cancelled' },
        });

        // Rembourser automatiquement tous les paiements liés à cet événement
        let refundsProcessed = 0;
        let refundsFailed = 0;
        const payments = await prisma.payment.findMany({
            where: { eventId: params.id, status: 'SUCCEEDED' },
        });

        for (const payment of payments) {
            try {
                const refund = await stripe.refunds.create({
                    payment_intent: payment.stripePaymentId,
                    reason: 'requested_by_customer',
                    reverse_transfer: true,
                    refund_application_fee: false,
                    metadata: {
                        paymentId: payment.id,
                        eventId: params.id,
                        reason: 'Événement annulé',
                    },
                });

                await prisma.payment.update({
                    where: { id: payment.id },
                    data: {
                        status: 'REFUNDED',
                        refundedAt: new Date(),
                        stripeRefundId: refund.id,
                    },
                });

                refundsProcessed++;
                console.log(`💸 Remboursement auto: ${payment.amount}€ (payment ${payment.id})`);
            } catch (refundError: any) {
                refundsFailed++;
                console.error(`❌ Échec remboursement payment ${payment.id}:`, refundError?.message);
            }
        }

        if (payments.length > 0) {
            console.log(`💸 Remboursements: ${refundsProcessed} réussis, ${refundsFailed} échoués sur ${payments.length} paiements`);
        }

        // Envoyer un email d'annulation à chaque inscrit
        let emailsSent = 0;
        for (const registration of event.registrations) {
            const formData = registration.formData as any;
            const email = formData.email || formData.mail;
            const name = formData.name || formData.firstName || formData.nom || 'Participant';

            if (email) {
                try {
                    await sendEventCancelledEmail({
                        to: email,
                        eventTitle: event.title,
                        reason: reason || undefined,
                        userName: name,
                    });
                    emailsSent++;
                } catch (emailError) {
                    console.error(`⚠️ Erreur envoi email annulation à ${email}:`, emailError);
                }
            }
        }

        console.log(`✅ Événement ${event.title} annulé. ${emailsSent} emails envoyés.`);

        return NextResponse.json({
            success: true,
            message: 'Événement annulé avec succès',
            emailsSent,
            totalRegistrations: event.registrations.length,
            refundsProcessed,
            refundsFailed,
        });
    } catch (error) {
        console.error('❌ Erreur annulation événement:', error);
        return NextResponse.json(
            { error: 'Erreur lors de l\'annulation' },
            { status: 500 }
        );
    }
}
