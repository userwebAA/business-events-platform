import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const event = await prisma.event.findUnique({
            where: { id: params.id },
            include: {
                registrationFields: true,
                registrations: true,
            },
        });

        if (!event) {
            return NextResponse.json(
                { error: 'Événement non trouvé' },
                { status: 404 }
            );
        }

        // Masquer l'adresse exacte pour les événements payants
        // L'adresse sera accessible uniquement via /api/events/:id/address après inscription
        if (event.type === 'paid') {
            return NextResponse.json({
                ...event,
                address: '🔒 Adresse révélée après inscription', // Masquer l'adresse
            });
        }

        return NextResponse.json(event);
    } catch (error) {
        console.error(' Erreur récupération événement:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la récupération de l\'événement' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        
        const event = await prisma.event.update({
            where: { id: params.id },
            data: {
                ...body,
                date: body.date ? new Date(body.date) : undefined,
                endDate: body.endDate ? new Date(body.endDate) : undefined,
            },
            include: {
                registrationFields: true,
            },
        });

        return NextResponse.json(event);
    } catch (error) {
        console.error(' Erreur mise à jour événement:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la mise à jour de l\'événement' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.event.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ message: 'Événement supprimé', id: params.id });
    } catch (error) {
        console.error(' Erreur suppression événement:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la suppression de l\'événement' },
            { status: 500 }
        );
    }
}
