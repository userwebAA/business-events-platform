import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { verifyToken } from '@/lib/auth';

// GET: Liste tous les utilisateurs avec leur statut Stripe Connect
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

        const currentUser = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
            return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
        }

        const users = await prisma.user.findMany({
            where: { stripeAccountId: { not: null } },
            select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                email: true,
                stripeAccountId: true,
                stripeOnboardingComplete: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        // Récupérer les statuts Stripe en parallèle
        const accounts = await Promise.all(
            users.map(async (user) => {
                let stripeStatus = 'unknown';
                let chargesEnabled = false;
                let payoutsEnabled = false;
                let disabledReason: string | null = null;

                try {
                    const account = await stripe.accounts.retrieve(user.stripeAccountId!);
                    chargesEnabled = account.charges_enabled || false;
                    payoutsEnabled = account.payouts_enabled || false;

                    if (account.requirements?.disabled_reason) {
                        disabledReason = account.requirements.disabled_reason;
                        if (disabledReason.includes('rejected')) {
                            stripeStatus = 'rejected';
                        } else {
                            stripeStatus = 'restricted';
                        }
                    } else if (chargesEnabled && payoutsEnabled) {
                        stripeStatus = 'active';
                    } else {
                        stripeStatus = 'pending';
                    }
                } catch (e: any) {
                    stripeStatus = 'invalid';
                    disabledReason = e?.message || 'Compte introuvable';
                }

                return {
                    ...user,
                    displayName: user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.name || user.email,
                    stripeStatus,
                    chargesEnabled,
                    payoutsEnabled,
                    disabledReason,
                };
            })
        );

        return NextResponse.json(accounts);
    } catch (error) {
        console.error('Erreur admin stripe-accounts:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

// POST: Reset le compte Stripe d'un utilisateur (supprime le lien en base)
export async function POST(request: NextRequest) {
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

        const currentUser = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
            return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
        }

        const { userId, action } = await request.json();

        if (!userId || !action) {
            return NextResponse.json({ error: 'userId et action requis' }, { status: 400 });
        }

        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, stripeAccountId: true },
        });

        if (!targetUser) {
            return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
        }

        switch (action) {
            case 'reset': {
                // Supprimer le stripeAccountId en base → l'utilisateur pourra recréer un compte
                if (targetUser.stripeAccountId) {
                    try {
                        await stripe.accounts.del(targetUser.stripeAccountId);
                        console.log(`Stripe account ${targetUser.stripeAccountId} deleted for user ${userId}`);
                    } catch (e: any) {
                        // Le compte peut déjà être supprimé/rejeté, on continue
                        console.log(`Could not delete Stripe account: ${e?.message}`);
                    }
                }

                await prisma.user.update({
                    where: { id: userId },
                    data: { stripeAccountId: null, stripeOnboardingComplete: false },
                });

                return NextResponse.json({
                    success: true,
                    message: `Compte Stripe de ${targetUser.name || targetUser.email} réinitialisé`,
                });
            }

            case 'unlink': {
                // Juste retirer le lien en base sans supprimer le compte Stripe
                await prisma.user.update({
                    where: { id: userId },
                    data: { stripeAccountId: null, stripeOnboardingComplete: false },
                });

                return NextResponse.json({
                    success: true,
                    message: `Compte Stripe délié pour ${targetUser.name || targetUser.email}`,
                });
            }

            default:
                return NextResponse.json({ error: 'Action invalide (reset, unlink)' }, { status: 400 });
        }
    } catch (error) {
        console.error('Erreur admin stripe action:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
