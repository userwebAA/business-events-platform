import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Événements',
    description: 'Découvrez tous les événements business à venir. Soirées networking, conférences, afterworks et plus encore.',
    openGraph: {
        title: 'Événements - Business Events',
        description: 'Découvrez tous les événements business à venir. Soirées networking, conférences, afterworks et plus encore.',
    },
};

export default function EventsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
