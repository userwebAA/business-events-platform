import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';

interface Props {
    params: { id: string };
    children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: params.id },
            select: {
                name: true,
                firstName: true,
                lastName: true,
                bio: true,
                photo: true,
                company: true,
                position: true,
            },
        });

        if (!user) {
            return { title: 'Profil non trouvé' };
        }

        const displayName = user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.name;

        const roleInfo = [user.position, user.company].filter(Boolean).join(' chez ');
        const description = user.bio
            ? `${displayName}${roleInfo ? ` — ${roleInfo}` : ''} — ${user.bio.slice(0, 140)}${user.bio.length > 140 ? '...' : ''}`
            : `Profil de ${displayName}${roleInfo ? ` — ${roleInfo}` : ''} sur Business Events`;

        return {
            title: displayName,
            description,
            openGraph: {
                title: `${displayName} - Business Events`,
                description,
                type: 'profile',
                locale: 'fr_FR',
                siteName: 'Business Events',
                ...(user.photo && {
                    images: [{ url: user.photo, width: 400, height: 400, alt: displayName }],
                }),
            },
            twitter: {
                card: user.photo ? 'summary' : 'summary',
                title: `${displayName} - Business Events`,
                description,
                ...(user.photo && { images: [user.photo] }),
            },
        };
    } catch {
        return { title: 'Business Events' };
    }
}

export default function ProfileLayout({ children }: Props) {
    return <>{children}</>;
}
