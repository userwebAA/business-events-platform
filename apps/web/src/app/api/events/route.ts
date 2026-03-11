import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const type = searchParams.get('type');
        const location = searchParams.get('location');
        const search = searchParams.get('search');

        const where: any = {
            isPrivate: false,
            status: { not: 'cancelled' },
        };

        // Filtre par type (gratuit/payant)
        if (type && (type === 'free' || type === 'paid')) {
            where.type = type;
        }

        // Filtre par ville/localisation
        if (location) {
            where.location = {
                contains: location,
                mode: 'insensitive',
            };
        }

        // Recherche générale (titre, description, ville)
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { location: { contains: search, mode: 'insensitive' } },
            ];
        }

        const events = await prisma.event.findMany({
            where,
            include: {
                registrationFields: true,
            },
            orderBy: {
                date: 'asc',
            },
        });

        return NextResponse.json(events);
    } catch (error) {
        console.error('❌ Erreur récupération événements:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la récupération des événements' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Récupérer le userId depuis le token
        let organizerId = 'anonymous';
        const authHeader = request.headers.get('authorization');
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const decoded = verifyToken(token);
            if (decoded) organizerId = decoded.userId;
        }

        // Vérifier que l'utilisateur a validé son identité (sauf admin)
        if (organizerId !== 'anonymous') {
            const organizer = await prisma.user.findUnique({
                where: { id: organizerId },
                select: { identityStatus: true, role: true },
            });

            if (organizer && organizer.role === 'USER' && organizer.identityStatus !== 'verified') {
                return NextResponse.json(
                    { error: 'Vous devez vérifier votre identité avant de pouvoir organiser un événement. Rendez-vous dans Paramètres > Sécurité.' },
                    { status: 403 }
                );
            }
        }

        const isPrivate = body.isPrivate || false;
        const accessToken = isPrivate ? crypto.randomBytes(32).toString('hex') : null;

        const event = await prisma.event.create({
            data: {
                title: body.title,
                description: body.description,
                date: new Date(body.date),
                endDate: body.endDate ? new Date(body.endDate) : null,
                location: body.location,
                address: body.address,
                organizerId,
                type: body.type,
                price: body.price || null,
                currency: body.currency || 'EUR',
                maxAttendees: body.maxAttendees || null,
                currentAttendees: 0,
                imageUrl: body.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
                status: 'published',
                isPrivate,
                accessToken,
                registrationFields: {
                    create: body.registrationFields?.map((field: any) => ({
                        name: field.name,
                        label: field.label,
                        type: field.type,
                        required: field.required || false,
                        options: field.options || [],
                        placeholder: field.placeholder || null,
                    })) || [],
                },
            },
            include: {
                registrationFields: true,
            },
        });

        console.log('✅ Événement créé avec Prisma:', event.id);

        // Attribuer un badge de soirée au créateur
        if (organizerId !== 'anonymous') {
            try {
                await prisma.eventBadge.create({
                    data: {
                        userId: organizerId,
                        eventId: event.id,
                        eventTitle: event.title,
                        eventImage: event.imageUrl,
                        eventDate: event.date,
                        role: 'organizer',
                    },
                });
            } catch (e) {
                // Ignorer si le badge existe déjà (contrainte unique)
            }
        }

        // Notifier les followers du créateur
        if (organizerId !== 'anonymous' && !isPrivate) {
            try {
                const followers = await prisma.follow.findMany({
                    where: { followingId: organizerId },
                    select: { followerId: true },
                });

                if (followers.length > 0) {
                    const organizer = await prisma.user.findUnique({
                        where: { id: organizerId },
                        select: { name: true, firstName: true, lastName: true },
                    });
                    const organizerName = organizer?.firstName && organizer?.lastName
                        ? `${organizer.firstName} ${organizer.lastName}`
                        : organizer?.name || 'Un organisateur';

                    await prisma.notification.createMany({
                        data: followers.map((f: { followerId: string }) => ({
                            userId: f.followerId,
                            type: 'NEW_EVENT' as const,
                            title: 'Nouvelle soirée',
                            message: `${organizerName} a créé une nouvelle soirée : "${event.title}"`,
                            link: `/events/${event.id}`,
                        })),
                    });
                }
            } catch (e) {
                console.error('Erreur notification followers:', e);
            }
        }

        return NextResponse.json(event, { status: 201 });
    } catch (error) {
        console.error('❌ Erreur création événement:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la création de l\'événement' },
            { status: 400 }
        );
    }
}
