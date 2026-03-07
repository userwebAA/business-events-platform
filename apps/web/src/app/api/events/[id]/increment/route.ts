import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const quantity = body.quantity || 1;

        const event = await prisma.event.update({
            where: { id: params.id },
            data: {
                currentAttendees: {
                    increment: quantity,
                },
            },
        });

        console.log(`✅ ${quantity} participant(s) incrémenté(s):`, event.currentAttendees);
        return NextResponse.json(event);
    } catch (error) {
        console.error('❌ Erreur incrémentation:', error);
        return NextResponse.json(
            { error: 'Erreur lors de l\'incrémentation' },
            { status: 500 }
        );
    }
}
