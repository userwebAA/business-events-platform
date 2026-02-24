import { Event } from 'shared';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'src', 'lib', 'db.json');

interface Database {
    events: Event[];
    registrations: any[];
}

// Lire la base de données
function readDb(): Database {
    try {
        if (!fs.existsSync(DB_PATH)) {
            const initialDb: Database = { events: [], registrations: [] };
            fs.writeFileSync(DB_PATH, JSON.stringify(initialDb, null, 2));
            return initialDb;
        }
        const data = fs.readFileSync(DB_PATH, 'utf-8');
        const db = JSON.parse(data);
        
        // Convertir les dates en objets Date
        db.events = db.events.map((event: any) => ({
            ...event,
            date: new Date(event.date),
            endDate: event.endDate ? new Date(event.endDate) : undefined,
            createdAt: new Date(event.createdAt),
            updatedAt: new Date(event.updatedAt),
        }));
        
        return db;
    } catch (error) {
        console.error('Erreur lecture DB:', error);
        return { events: [], registrations: [] };
    }
}

// Écrire dans la base de données
function writeDb(db: Database): void {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    } catch (error) {
        console.error('Erreur écriture DB:', error);
    }
}

// Gestion des événements
export const eventDb = {
    getAll: (): Event[] => {
        const db = readDb();
        return db.events;
    },
    
    getById: (id: string): Event | undefined => {
        const db = readDb();
        return db.events.find(e => e.id === id);
    },
    
    create: (event: Event): Event => {
        const db = readDb();
        db.events.push(event);
        writeDb(db);
        return event;
    },
    
    update: (id: string, updates: Partial<Event>): Event | null => {
        const db = readDb();
        const index = db.events.findIndex(e => e.id === id);
        if (index !== -1) {
            db.events[index] = { ...db.events[index], ...updates };
            writeDb(db);
            return db.events[index];
        }
        return null;
    },
    
    delete: (id: string): boolean => {
        const db = readDb();
        const index = db.events.findIndex(e => e.id === id);
        if (index !== -1) {
            db.events.splice(index, 1);
            writeDb(db);
            return true;
        }
        return false;
    },
    
    increment: (id: string): Event | null => {
        const db = readDb();
        const index = db.events.findIndex(e => e.id === id);
        if (index !== -1) {
            db.events[index].currentAttendees = (db.events[index].currentAttendees || 0) + 1;
            writeDb(db);
            return db.events[index];
        }
        return null;
    }
};

// Gestion des inscriptions
export const registrationDb = {
    getAll: () => {
        const db = readDb();
        return db.registrations;
    },
    
    create: (registration: any) => {
        const db = readDb();
        db.registrations.push(registration);
        writeDb(db);
        return registration;
    },
    
    getByEventId: (eventId: string) => {
        const db = readDb();
        return db.registrations.filter(r => r.eventId === eventId);
    }
};
