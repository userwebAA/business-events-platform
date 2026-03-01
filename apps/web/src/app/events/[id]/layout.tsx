import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Props {
    params: { id: string };
    children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    try {
        const event = await prisma.event.findUnique({
            where: { id: params.id },
            select: {
                title: true,
                description: true,
                date: true,
                location: true,
                imageUrl: true,
                type: true,
                price: true,
                currency: true,
            },
        });

        if (!event) {
            return {
                title: 'Événement non trouvé - Business Events',
            };
        }

        const dateStr = format(new Date(event.date), "EEEE d MMMM yyyy 'à' HH'h'mm", { locale: fr });
        const priceStr = event.type === 'paid' && event.price
            ? `${event.price}€`
            : 'Gratuit';

        const description = `${event.description.slice(0, 150)}${event.description.length > 150 ? '...' : ''} — ${dateStr} à ${event.location} — ${priceStr}`;

        return {
            title: `${event.title} - Business Events`,
            description,
            openGraph: {
                title: event.title,
                description,
                type: 'website',
                locale: 'fr_FR',
                siteName: 'Business Events',
                ...(event.imageUrl && {
                    images: [
                        {
                            url: event.imageUrl,
                            width: 1200,
                            height: 630,
                            alt: event.title,
                        },
                    ],
                }),
            },
            twitter: {
                card: event.imageUrl ? 'summary_large_image' : 'summary',
                title: event.title,
                description,
                ...(event.imageUrl && { images: [event.imageUrl] }),
            },
        };
    } catch {
        return {
            title: 'Business Events - Plateforme de Soirées Business',
        };
    }
}

export default function EventLayout({ children }: Props) {
    return <>{children}</>;
}
