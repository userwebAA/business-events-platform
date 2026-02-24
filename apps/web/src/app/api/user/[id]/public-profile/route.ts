import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                position: true,
                company: true,
                bio: true,
                photo: true,
                location: true,
                skills: true,
                linkedin: true,
                profileCompleted: true,
                identityStatus: true,
                role: true,
                createdAt: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
        }

        // Fetch events organized by this user (only published, non-private)
        const organizedEvents = await prisma.event.findMany({
            where: {
                organizerId: id,
                status: { not: 'cancelled' },
                isPrivate: false,
            },
            select: {
                id: true,
                title: true,
                date: true,
                location: true,
                imageUrl: true,
                type: true,
                price: true,
                currentAttendees: true,
                maxAttendees: true,
            },
            orderBy: { date: 'desc' },
            take: 6,
        });

        // Count total events organized
        const totalEventsOrganized = await prisma.event.count({
            where: {
                organizerId: id,
                status: { not: 'cancelled' },
            },
        });

        // Count total attendees across all events
        const allEvents = await prisma.event.findMany({
            where: { organizerId: id, status: { not: 'cancelled' } },
            select: { currentAttendees: true },
        });
        const totalAttendees = allEvents.reduce((sum, e) => sum + e.currentAttendees, 0);

        // Récupérer les badges de soirées visibles
        let eventBadges: any[] = [];
        try {
            eventBadges = await prisma.eventBadge.findMany({
                where: { userId: id, visible: true },
                orderBy: { eventDate: 'desc' },
            });
        } catch (e) {
            // Table peut ne pas encore exister
        }

        return NextResponse.json({
            user,
            organizedEvents,
            eventBadges,
            stats: {
                totalEventsOrganized,
                totalAttendees,
            },
        });
    } catch (error) {
        console.error('❌ Erreur récupération profil public:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la récupération du profil' },
            { status: 500 }
        );
    }
}
