import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { requireAuth } from '@/lib/auth-middleware';

// POST: Créer un compte Stripe Connect Express et retourner le lien d'onboarding
export async function POST(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);
        if (authResult.error) return authResult.error;

        const userId = authResult.user.userId;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, stripeAccountId: true, stripeOnboardingComplete: true, firstName: true, lastName: true },
        });

        if (!user) {
            return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
        }

        let stripeAccountId = user.stripeAccountId;

        // Vérifier si le compte existant est valide
        if (stripeAccountId) {
            try {
                await stripe.accounts.retrieve(stripeAccountId);
            } catch (e: any) {
                console.log('Existing Stripe account invalid, resetting:', e?.message);
                stripeAccountId = null;
                await prisma.user.update({
                    where: { id: userId },
                    data: { stripeAccountId: null, stripeOnboardingComplete: false },
                });
            }
        }

        // Si pas encore de compte Stripe, en créer un
        if (!stripeAccountId) {
            const account = await stripe.accounts.create({
                type: 'express',
                country: 'FR',
                email: user.email,
                settings: {
                    payouts: {
                        schedule: {
                            delay_days: 7,
                            interval: 'daily',
                        },
                    },
                },
                metadata: {
                    userId,
                },
            });

            stripeAccountId = account.id;

            await prisma.user.update({
                where: { id: userId },
                data: { stripeAccountId },
            });
        }

        // Générer le lien d'onboarding
        const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        const accountLink = await stripe.accountLinks.create({
            account: stripeAccountId,
            refresh_url: `${origin}/dashboard/settings?stripe=refresh`,
            return_url: `${origin}/dashboard/settings?stripe=success`,
            type: 'account_onboarding',
        });

        return NextResponse.json({ url: accountLink.url });
    } catch (error: any) {
        console.error('Stripe Connect error:', error?.message || error);
        return NextResponse.json(
            { error: error?.message || 'Erreur lors de la configuration Stripe' },
            { status: 500 }
        );
    }
}

// GET: Vérifier le statut du compte Stripe Connect
export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);
        if (authResult.error) return authResult.error;

        const userId = authResult.user.userId;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { stripeAccountId: true, stripeOnboardingComplete: true },
        });

        if (!user?.stripeAccountId) {
            return NextResponse.json({
                connected: false,
                onboardingComplete: false,
                chargesEnabled: false,
                payoutsEnabled: false,
            });
        }

        try {
            const account = await stripe.accounts.retrieve(user.stripeAccountId);

            const isComplete = account.charges_enabled && account.payouts_enabled;

            // Mettre à jour le statut si changé
            if (isComplete !== user.stripeOnboardingComplete) {
                await prisma.user.update({
                    where: { id: userId },
                    data: { stripeOnboardingComplete: isComplete },
                });
            }

            return NextResponse.json({
                connected: true,
                onboardingComplete: isComplete,
                chargesEnabled: account.charges_enabled,
                payoutsEnabled: account.payouts_enabled,
                accountId: user.stripeAccountId,
            });
        } catch (e: any) {
            // Compte invalide sur Stripe, reset
            console.log('Stripe account not found, resetting:', e?.message);
            await prisma.user.update({
                where: { id: userId },
                data: { stripeAccountId: null, stripeOnboardingComplete: false },
            });
            return NextResponse.json({
                connected: false,
                onboardingComplete: false,
                chargesEnabled: false,
                payoutsEnabled: false,
            });
        }
    } catch (error) {
        console.error('Stripe status error:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la vérification Stripe' },
            { status: 500 }
        );
    }
}