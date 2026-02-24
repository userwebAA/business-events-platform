import { prisma } from './prisma';
import QRCode from 'qrcode';
import crypto from 'crypto';

export async function generateTicket(registrationId: string) {
    try {
        const registration = await prisma.registration.findUnique({
            where: { id: registrationId },
            include: {
                event: true,
            },
        });

        if (!registration) {
            throw new Error('Inscription non trouvée');
        }

        const existingTicket = await prisma.ticket.findUnique({
            where: { registrationId },
        });

        if (existingTicket) {
            return existingTicket;
        }

        const qrCodeData = crypto.randomBytes(32).toString('hex');

        const ticket = await prisma.ticket.create({
            data: {
                registrationId,
                qrCode: qrCodeData,
                status: 'VALID',
            },
        });

        return ticket;
    } catch (error) {
        console.error('Erreur génération ticket:', error);
        throw error;
    }
}

export async function generateQRCodeImage(qrCodeData: string): Promise<string> {
    try {
        const qrCodeDataURL = await QRCode.toDataURL(qrCodeData, {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF',
            },
        });
        return qrCodeDataURL;
    } catch (error) {
        console.error('Erreur génération QR code:', error);
        throw error;
    }
}

export async function validateTicket(qrCode: string) {
    try {
        const ticket = await prisma.ticket.findUnique({
            where: { qrCode },
            include: {
                registration: {
                    include: {
                        event: true,
                    },
                },
            },
        });

        if (!ticket) {
            return {
                valid: false,
                message: 'Billet non trouvé',
            };
        }

        if (ticket.status === 'CANCELLED') {
            return {
                valid: false,
                message: 'Billet annulé',
                ticket,
            };
        }

        if (ticket.status === 'USED') {
            return {
                valid: false,
                message: 'Billet déjà utilisé',
                ticket,
                usedAt: ticket.usedAt,
            };
        }

        return {
            valid: true,
            message: 'Billet valide',
            ticket,
        };
    } catch (error) {
        console.error('Erreur validation ticket:', error);
        throw error;
    }
}

export async function markTicketAsUsed(qrCode: string) {
    try {
        const ticket = await prisma.ticket.update({
            where: { qrCode },
            data: {
                status: 'USED',
                usedAt: new Date(),
            },
            include: {
                registration: {
                    include: {
                        event: true,
                    },
                },
            },
        });

        return ticket;
    } catch (error) {
        console.error('Erreur marquage ticket:', error);
        throw error;
    }
}

export async function cancelTicket(ticketId: string) {
    try {
        const ticket = await prisma.ticket.update({
            where: { id: ticketId },
            data: {
                status: 'CANCELLED',
            },
        });

        return ticket;
    } catch (error) {
        console.error('Erreur annulation ticket:', error);
        throw error;
    }
}

export async function getTicketByRegistration(registrationId: string) {
    try {
        const ticket = await prisma.ticket.findUnique({
            where: { registrationId },
            include: {
                registration: {
                    include: {
                        event: true,
                    },
                },
            },
        });

        return ticket;
    } catch (error) {
        console.error('Erreur récupération ticket:', error);
        throw error;
    }
}

export async function getEventTickets(eventId: string) {
    try {
        const tickets = await prisma.ticket.findMany({
            where: {
                registration: {
                    eventId,
                },
            },
            include: {
                registration: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return tickets;
    } catch (error) {
        console.error('Erreur récupération tickets événement:', error);
        throw error;
    }
}
