import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: { token: string } }
) {
    try {
        const { token } = params;

        const event = await prisma.event.findUnique({
            where: {
                accessToken: token,
            },
            include: {
                registrationFields: true,
            },
        });

        if (!event) {
            return NextResponse.json(
                { error: 'Événement privé introuvable ou lien invalide' },
                { status: 404 }
            );
        }

        if (!event.isPrivate) {
            return NextResponse.json(
                { error: 'Cet événement n\'est pas privé' },
                { status: 400 }
            );
        }

        return NextResponse.json(event);
    } catch (error) {
        console.error('❌ Erreur récupération événement privé:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la récupération de l\'événement' },
            { status: 500 }
        );
    }
}
