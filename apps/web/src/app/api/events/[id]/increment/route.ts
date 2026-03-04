import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const event = await prisma.event.update({
            where: { id: params.id },
            data: {
                currentAttendees: {
                    increment: 1,
                },
            },
        });

        console.log('✅ Participants incrémentés:', event.currentAttendees);
        return NextResponse.json(event);
    } catch (error) {
        console.error('❌ Erreur incrémentation:', error);
        return NextResponse.json(
            { error: 'Erreur lors de l\'incrémentation' },
            { status: 500 }
        );
    }
}
