import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { sendEventReminders } from '@/lib/notificationService';

// Clé secrète pour protéger le cron (à définir dans .env)
const CRON_SECRET = process.env.CRON_SECRET || '';

export async function GET(request: NextRequest) {
    try {
        // Vérifier l'autorisation
        const authHeader = request.headers.get('authorization');
        if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const result = await sendEventReminders();

        return NextResponse.json({
            success: result.success,
            eventsProcessed: result.eventsProcessed || 0,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('❌ Erreur cron rappels:', error);
        return NextResponse.json(
            { error: 'Erreur lors de l\'envoi des rappels' },
            { status: 500 }
        );
    }
}