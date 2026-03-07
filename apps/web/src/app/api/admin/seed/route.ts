import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST /api/admin/seed — Crée des faux événements de démo
// DELETE /api/admin/seed — Supprime tous les faux événements (tag [DEMO])
export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        // Vérifier que c'est un admin
        const { verifyToken } = await import('@/lib/jwt');
        const payload = verifyToken(token);
        if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { id: payload.userId } });
        if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        const now = new Date();

        const fakeEvents = [
            {
                title: '[DEMO] Soirée Networking Tech',
                description: 'Rejoignez-nous pour une soirée de networking entre professionnels de la tech. Échangez, partagez vos expériences et développez votre réseau dans une ambiance décontractée.',
                date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
                location: 'Paris',
                address: '42 Rue de Rivoli, 75001 Paris',
                organizerId: user.id,
                type: 'free',
                maxAttendees: 50,
                currentAttendees: 23,
                imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
                status: 'published',
                isPrivate: false,
            },
            {
                title: '[DEMO] Conférence IA & Business',
                description: 'Une journée dédiée à l\'intelligence artificielle et son impact sur le monde des affaires. Speakers internationaux, ateliers pratiques et cocktail networking.',
                date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
                location: 'Lyon',
                address: '15 Place Bellecour, 69002 Lyon',
                organizerId: user.id,
                type: 'paid',
                price: 29.99,
                maxAttendees: 120,
                currentAttendees: 87,
                imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80',
                status: 'published',
                isPrivate: false,
            },
            {
                title: '[DEMO] Afterwork Entrepreneurs',
                description: 'Un afterwork convivial pour les entrepreneurs et freelances. Venez pitcher vos projets et rencontrer vos futurs partenaires autour d\'un verre.',
                date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
                location: 'Bordeaux',
                address: '8 Quai des Chartrons, 33000 Bordeaux',
                organizerId: user.id,
                type: 'free',
                maxAttendees: 30,
                currentAttendees: 12,
                imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80',
                status: 'published',
                isPrivate: false,
            },
            {
                title: '[DEMO] Workshop UX Design',
                description: 'Atelier pratique sur les dernières tendances en UX/UI Design. Apprenez les meilleures pratiques de conception centrée utilisateur avec des experts du domaine.',
                date: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
                location: 'Toulouse',
                address: '25 Allées Jean Jaurès, 31000 Toulouse',
                organizerId: user.id,
                type: 'paid',
                price: 15,
                maxAttendees: 25,
                currentAttendees: 18,
                imageUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&q=80',
                status: 'published',
                isPrivate: false,
            },
            {
                title: '[DEMO] Meetup Marketing Digital',
                description: 'Échangez sur les stratégies marketing digital qui fonctionnent en 2025. SEO, réseaux sociaux, content marketing et growth hacking au programme.',
                date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
                location: 'Marseille',
                address: '3 Cours Julien, 13006 Marseille',
                organizerId: user.id,
                type: 'free',
                maxAttendees: 40,
                currentAttendees: 31,
                imageUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&q=80',
                status: 'published',
                isPrivate: false,
            },
            {
                title: '[DEMO] Gala Startup Nation',
                description: 'Le gala annuel réunissant les startups les plus prometteuses de France. Dîner de gala, remise de prix et networking exclusif avec des investisseurs.',
                date: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
                location: 'Nice',
                address: '1 Promenade des Anglais, 06000 Nice',
                organizerId: user.id,
                type: 'paid',
                price: 49.99,
                maxAttendees: 200,
                currentAttendees: 142,
                imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
                status: 'published',
                isPrivate: false,
            },
        ];

        const created = await Promise.all(
            fakeEvents.map(event => prisma.event.create({ data: event }))
        );

        return NextResponse.json({
            message: `${created.length} événements de démo créés`,
            events: created.map(e => ({ id: e.id, title: e.title })),
        });
    } catch (error) {
        console.error('Seed error:', error);
        return NextResponse.json({ error: 'Erreur lors du seed' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { verifyToken } = await import('@/lib/jwt');
        const payload = verifyToken(token);
        if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { id: payload.userId } });
        if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        const deleted = await prisma.event.deleteMany({
            where: { title: { startsWith: '[DEMO]' } },
        });

        return NextResponse.json({
            message: `${deleted.count} événements de démo supprimés`,
        });
    } catch (error) {
        console.error('Seed delete error:', error);
        return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
    }
}
