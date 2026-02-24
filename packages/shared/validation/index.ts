import { z } from 'zod';

export const userSchema = z.object({
    email: z.string().email('Email invalide'),
    name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    company: z.string().optional(),
    position: z.string().optional(),
    phone: z.string().optional(),
});

export const eventSchema = z.object({
    title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères'),
    description: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
    date: z.date().min(new Date(), 'La date doit être dans le futur'),
    endDate: z.date().optional(),
    location: z.string().min(3, 'Le lieu doit être spécifié'),
    address: z.string().min(5, 'L\'adresse doit être complète'),
    type: z.enum(['free', 'paid']),
    price: z.number().min(0).optional(),
    currency: z.string().default('EUR'),
    maxAttendees: z.number().min(1).optional(),
    imageUrl: z.string().optional(), // Accepter URL ou base64
    registrationFields: z.array(z.object({
        id: z.string(),
        name: z.string(),
        label: z.string(),
        type: z.enum(['text', 'email', 'phone', 'select', 'textarea']),
        required: z.boolean(),
        options: z.array(z.string()).optional(),
        placeholder: z.string().optional(),
    })),
}).refine(data => {
    // Pour les événements payants, le prix est obligatoire
    if (data.type === 'paid' && (!data.price || data.price <= 0)) {
        return false;
    }
    // Pour les événements gratuits, pas besoin de prix
    return true;
}, {
    message: 'Un événement payant doit avoir un prix supérieur à 0',
    path: ['price'],
});

export const registrationSchema = z.object({
    eventId: z.string(),
    formData: z.record(z.any()),
});

export type UserInput = z.infer<typeof userSchema>;
export type EventInput = z.infer<typeof eventSchema>;
export type RegistrationInput = z.infer<typeof registrationSchema>;
