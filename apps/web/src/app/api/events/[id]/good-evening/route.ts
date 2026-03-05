import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// POST: "Bonne soirée" - follow tous les participants de l'événement
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const eventId = params.id;
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
        }

        const currentUserId = decoded.userId;

        // Vérifier que l'événement existe et est passé
        const event = await prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            return NextResponse.json({ error: 'Événement non trouvé' }, { status: 404 });
        }

        // Vérifier que l'utilisateur est inscrit ou organisateur
        const isOrganizer = event.organizerId === currentUserId;
        let isRegistered = false;
        if (!isOrganizer) {
            const reg = await prisma.registration.findFirst({
                where: { eventId, userId: currentUserId },
            });
            isRegistered = !!reg;
        }

        if (!isOrganizer && !isRegistered) {
            return NextResponse.json({ error: 'Vous devez être participant de cet événement' }, { status: 403 });
        }

        // Récupérer tous les participants (userId des inscriptions + organisateur)
        const registrations = await prisma.registration.findMany({
            where: { eventId, userId: { not: null } },
            select: { userId: true },
        });

        const participantIds = new Set<string>();
        registrations.forEach(r => {
            if (r.userId && r.userId !== currentUserId) {
                participantIds.add(r.userId);
            }
        });
        // Ajouter l'organisateur si ce n'est pas l'utilisateur courant
        if (event.organizerId !== currentUserId) {
            participantIds.add(event.organizerId);
        }

        // Créer les follows en batch (ignorer les doublons)
        let followedCount = 0;
        for (const targetUserId of participantIds) {
            try {
                await prisma.follow.upsert({
                    where: {
                        followerId_followingId: {
                            followerId: currentUserId,
                            followingId: targetUserId,
                        },
                    },
                    create: {
                        followerId: currentUserId,
                        followingId: targetUserId,
                    },
                    update: {},
                });
                followedCount++;
            } catch {
                // Ignorer les erreurs individuelles
            }
        }

        return NextResponse.json({
            success: true,
            followedCount,
            totalParticipants: participantIds.size,
        });
    } catch (error) {
        console.error('Erreur good-evening:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
