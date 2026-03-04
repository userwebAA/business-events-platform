import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { sendEventReminders } from '@/lib/notificationService';

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET || 'dev-secret-key';

        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const result = await sendEventReminders();

        return NextResponse.json(result);
    } catch (error) {
        console.error('Erreur envoi rappels:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}