import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-01-28.clover',
    typescript: true,
    maxNetworkRetries: 3,
    timeout: 30000,
});

// Commission de la plateforme : 1.90€ fixe si ticket ≤ 50€, 4% si ticket > 50€
export const PLATFORM_FEE_FIXED = 1.90; // en euros
export const PLATFORM_FEE_THRESHOLD = 50; // seuil en euros
export const PLATFORM_FEE_PERCENT_ABOVE = 4; // % au-dessus du seuil

export function calculatePlatformFee(priceInEuros: number): number {
    if (priceInEuros <= PLATFORM_FEE_THRESHOLD) {
        return PLATFORM_FEE_FIXED;
    }
    return Math.round(priceInEuros * PLATFORM_FEE_PERCENT_ABOVE) / 100;
}

// Délai avant payout au créateur (en jours)
export const PAYOUT_DELAY_DAYS = Number(process.env.PAYOUT_DELAY_DAYS || '7');
