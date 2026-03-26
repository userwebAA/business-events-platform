import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST - Soumettre un avis sur un organisateur après un événement
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

        const userId = decoded.userId;
        const body = await request.json();
        const { eventId, rating, comment } = body;

        // Vérifier que la note est entre 1 et 5
        if (!rating || rating < 1 || rating > 5) {
            return NextResponse.json({ error: 'La note doit être entre 1 et 5' }, { status: 400 });
        }

        // Récupérer l'événement
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { 
                id: true, 
                organizerId: true, 
                endDate: true, 
                date: true 
            },
        });

        if (!event) {
            return NextResponse.json({ error: 'Événement non trouvé' }, { status: 404 });
        }

        // Vérifier que l'événement est terminé
        const eventEndDate = event.endDate || event.date;
        if (new Date(eventEndDate) > new Date()) {
            return NextResponse.json({ error: 'Vous ne pouvez noter qu\'après la fin de l\'événement' }, { status: 400 });
        }

        // Vérifier que l'utilisateur a participé à l'événement
        const registration = await prisma.registration.findFirst({
            where: {
                eventId: eventId,
                userId: userId,
            },
        });

        if (!registration) {
            return NextResponse.json({ error: 'Vous devez avoir participé à l\'événement pour le noter' }, { status: 403 });
        }

        // Vérifier si l'utilisateur a déjà noté cet événement
        const existingRating = await prisma.rating.findUnique({
            where: {
                eventId_userId: {
                    eventId: eventId,
                    userId: userId,
                },
            },
        });

        if (existingRating) {
            // Mettre à jour l'avis existant
            const updatedRating = await prisma.rating.update({
                where: { id: existingRating.id },
                data: {
                    rating,
                    comment: comment || null,
                },
            });

            return NextResponse.json({ 
                message: 'Avis mis à jour avec succès',
                rating: updatedRating 
            });
        }

        // Créer un nouvel avis
        const newRating = await prisma.rating.create({
            data: {
                eventId,
                organizerId: event.organizerId,
                userId,
                rating,
                comment: comment || null,
            },
        });

        return NextResponse.json({ 
            message: 'Avis soumis avec succès',
            rating: newRating 
        });

    } catch (error) {
        console.error('Erreur lors de la soumission de l\'avis:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

// GET - Récupérer les avis d'un organisateur
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const organizerId = searchParams.get('organizerId');

        if (!organizerId) {
            return NextResponse.json({ error: 'organizerId requis' }, { status: 400 });
        }

        // Récupérer tous les avis de l'organisateur
        const ratings = await prisma.rating.findMany({
            where: { organizerId },
            orderBy: { createdAt: 'desc' },
        });

        // Calculer la note moyenne
        const averageRating = ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
            : 0;

        return NextResponse.json({
            ratings,
            averageRating: Math.round(averageRating * 10) / 10, // Arrondir à 1 décimale
            totalRatings: ratings.length,
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des avis:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
