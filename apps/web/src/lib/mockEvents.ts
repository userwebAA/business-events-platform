import { Event } from 'shared';

// Générer des dates dynamiques à partir d'aujourd'hui
const today = new Date();
const in7Days = new Date(today);
in7Days.setDate(today.getDate() + 7);
const in14Days = new Date(today);
in14Days.setDate(today.getDate() + 14);

// Utiliser let au lieu de const pour permettre les modifications
let mockEventsArray: Event[] = [
    {
        id: '1',
        title: 'Networking Tech & Innovation',
        description: 'Soirée de networking pour les professionnels de la tech. Rencontrez des entrepreneurs, investisseurs et experts du secteur.',
        date: new Date(in7Days.setHours(19, 0, 0, 0)),
        endDate: new Date(in7Days.setHours(23, 0, 0, 0)),
        location: 'Paris',
        address: '123 Avenue des Champs-Élysées, 75008 Paris',
        organizerId: 'user1',
        type: 'free',
        currency: 'EUR',
        maxAttendees: 100,
        currentAttendees: 45,
        imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
        status: 'published',
        registrationFields: [
            { id: '1', name: 'company', label: 'Entreprise', type: 'text', required: true },
            { id: '2', name: 'position', label: 'Poste', type: 'text', required: true },
            { id: '3', name: 'phone', label: 'Téléphone', type: 'phone', required: true },
        ],
        createdAt: today,
        updatedAt: today,
    },
    {
        id: '2',
        title: 'Conférence Leadership & Management',
        description: 'Conférence exclusive avec des experts en leadership. Places limitées.',
        date: new Date(in14Days.setHours(14, 0, 0, 0)),
        endDate: new Date(in14Days.setHours(18, 0, 0, 0)),
        location: 'Lyon',
        address: '45 Rue de la République, 69002 Lyon',
        organizerId: 'user2',
        type: 'paid',
        price: 49.99,
        currency: 'EUR',
        maxAttendees: 50,
        currentAttendees: 32,
        imageUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800',
        status: 'published',
        registrationFields: [
            { id: '1', name: 'company', label: 'Entreprise', type: 'text', required: true },
            { id: '2', name: 'position', label: 'Poste', type: 'text', required: true },
            { id: '3', name: 'phone', label: 'Téléphone', type: 'phone', required: true },
        ],
        createdAt: today,
        updatedAt: today,
    },
];

// Exporter un objet avec des méthodes pour gérer les événements
export const mockEvents = {
    getAll: () => mockEventsArray,
    getById: (id: string) => mockEventsArray.find(e => e.id === id),
    add: (event: Event) => {
        mockEventsArray.push(event);
        return event;
    },
    update: (id: string, updates: Partial<Event>) => {
        const index = mockEventsArray.findIndex(e => e.id === id);
        if (index !== -1) {
            mockEventsArray[index] = { ...mockEventsArray[index], ...updates };
            return mockEventsArray[index];
        }
        return null;
    },
    delete: (id: string) => {
        const index = mockEventsArray.findIndex(e => e.id === id);
        if (index !== -1) {
            mockEventsArray.splice(index, 1);
            return true;
        }
        return false;
    }
};
