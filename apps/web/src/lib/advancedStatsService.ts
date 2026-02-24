import { prisma } from './prisma';

export async function getEventDetailedStats(eventId: string) {
    try {
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                registrations: true,
            },
        });

        if (!event) {
            throw new Error('Événement non trouvé');
        }

        const now = new Date();
        const registrationsByDay = await getRegistrationsByDay(eventId);
        const registrationsByHour = await getRegistrationsByHour(eventId);
        
        return {
            event: {
                id: event.id,
                title: event.title,
                date: event.date,
                maxAttendees: event.maxAttendees,
                currentAttendees: event.currentAttendees,
            },
            registrations: {
                total: event.registrations.length,
                fillRate: event.maxAttendees ? (event.registrations.length / event.maxAttendees) * 100 : 0,
                remaining: event.maxAttendees ? event.maxAttendees - event.registrations.length : null,
            },
            timeline: {
                byDay: registrationsByDay,
                byHour: registrationsByHour,
            },
        };
    } catch (error) {
        console.error('Erreur stats détaillées événement:', error);
        throw error;
    }
}

async function getRegistrationsByDay(eventId: string) {
    const registrations = await prisma.registration.findMany({
        where: { eventId },
        orderBy: { createdAt: 'asc' },
    });

    const byDay: { [key: string]: number } = {};
    
    registrations.forEach(reg => {
        const day = reg.createdAt.toISOString().split('T')[0];
        byDay[day] = (byDay[day] || 0) + 1;
    });

    return Object.entries(byDay).map(([date, count]) => ({
        date,
        count,
    }));
}

async function getRegistrationsByHour(eventId: string) {
    const registrations = await prisma.registration.findMany({
        where: { eventId },
        orderBy: { createdAt: 'asc' },
    });

    const byHour: { [key: number]: number } = {};
    
    registrations.forEach(reg => {
        const hour = reg.createdAt.getHours();
        byHour[hour] = (byHour[hour] || 0) + 1;
    });

    return Object.entries(byHour).map(([hour, count]) => ({
        hour: parseInt(hour),
        count,
    }));
}

export async function getOrganizerStats(userId: string) {
    try {
        const events = await prisma.event.findMany({
            where: { organizerId: userId },
            include: {
                registrations: true,
            },
        });

        const totalEvents = events.length;
        const totalRegistrations = events.reduce((sum, e) => sum + e.registrations.length, 0);
        const totalRevenue = events
            .filter(e => e.type === 'paid')
            .reduce((sum, e) => sum + (e.price || 0) * e.registrations.length, 0);

        const now = new Date();
        const upcomingEvents = events.filter(e => new Date(e.date) > now);
        const pastEvents = events.filter(e => new Date(e.date) <= now);

        const avgAttendeesPerEvent = totalEvents > 0 ? totalRegistrations / totalEvents : 0;
        const avgFillRate = events.reduce((sum, e) => {
            if (!e.maxAttendees) return sum;
            return sum + (e.registrations.length / e.maxAttendees) * 100;
        }, 0) / (events.filter(e => e.maxAttendees).length || 1);

        const eventsByMonth = getEventsByMonth(events);
        const registrationsByMonth = getRegistrationsByMonth(events);

        return {
            overview: {
                totalEvents,
                totalRegistrations,
                totalRevenue,
                avgAttendeesPerEvent: Math.round(avgAttendeesPerEvent),
                avgFillRate: Math.round(avgFillRate),
            },
            events: {
                upcoming: upcomingEvents.length,
                past: pastEvents.length,
                published: events.filter(e => e.status === 'published').length,
                draft: events.filter(e => e.status === 'draft').length,
                cancelled: events.filter(e => e.status === 'cancelled').length,
            },
            timeline: {
                eventsByMonth,
                registrationsByMonth,
            },
            topEvents: getTopEvents(events),
        };
    } catch (error) {
        console.error('Erreur stats organisateur:', error);
        throw error;
    }
}

function getEventsByMonth(events: any[]) {
    const byMonth: { [key: string]: number } = {};
    
    events.forEach(event => {
        const month = new Date(event.createdAt).toISOString().slice(0, 7);
        byMonth[month] = (byMonth[month] || 0) + 1;
    });

    return Object.entries(byMonth)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month));
}

function getRegistrationsByMonth(events: any[]) {
    const byMonth: { [key: string]: number } = {};
    
    events.forEach(event => {
        event.registrations.forEach((reg: any) => {
            const month = new Date(reg.createdAt).toISOString().slice(0, 7);
            byMonth[month] = (byMonth[month] || 0) + 1;
        });
    });

    return Object.entries(byMonth)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month));
}

function getTopEvents(events: any[]) {
    return events
        .map(event => ({
            id: event.id,
            title: event.title,
            date: event.date,
            registrations: event.registrations.length,
            maxAttendees: event.maxAttendees,
            fillRate: event.maxAttendees ? (event.registrations.length / event.maxAttendees) * 100 : 0,
            revenue: event.type === 'paid' ? (event.price || 0) * event.registrations.length : 0,
        }))
        .sort((a, b) => b.registrations - a.registrations)
        .slice(0, 5);
}

export async function getPlatformStats() {
    try {
        const totalUsers = await prisma.user.count();
        const totalEvents = await prisma.event.count();
        const totalRegistrations = await prisma.registration.count();

        const events = await prisma.event.findMany({
            include: {
                registrations: true,
            },
        });

        const totalRevenue = events
            .filter(e => e.type === 'paid')
            .reduce((sum, e) => sum + (e.price || 0) * e.registrations.length, 0);

        const now = new Date();
        const upcomingEvents = events.filter(e => new Date(e.date) > now).length;
        const pastEvents = events.filter(e => new Date(e.date) <= now).length;

        const avgAttendeesPerEvent = totalEvents > 0 ? totalRegistrations / totalEvents : 0;

        const usersByMonth = await getUsersByMonth();
        const eventsByMonth = getEventsByMonth(events);
        const registrationsByMonth = getRegistrationsByMonth(events);

        return {
            overview: {
                totalUsers,
                totalEvents,
                totalRegistrations,
                totalRevenue,
                avgAttendeesPerEvent: Math.round(avgAttendeesPerEvent),
            },
            events: {
                upcoming: upcomingEvents,
                past: pastEvents,
                free: events.filter(e => e.type === 'free').length,
                paid: events.filter(e => e.type === 'paid').length,
            },
            timeline: {
                usersByMonth,
                eventsByMonth,
                registrationsByMonth,
            },
        };
    } catch (error) {
        console.error('Erreur stats plateforme:', error);
        throw error;
    }
}

async function getUsersByMonth() {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'asc' },
    });

    const byMonth: { [key: string]: number } = {};
    
    users.forEach(user => {
        const month = new Date(user.createdAt).toISOString().slice(0, 7);
        byMonth[month] = (byMonth[month] || 0) + 1;
    });

    return Object.entries(byMonth)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month));
}
