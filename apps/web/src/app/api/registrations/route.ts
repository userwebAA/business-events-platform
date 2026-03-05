import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { sendConfirmationEmailWithTicket, sendNewRegistrationEmail } from '@/lib/emailTemplates';
import { generateTicket } from '@/lib/ticketService';
import { generateTicketPDF } from '@/lib/pdfTicketGenerator';
import { verifyToken } from '@/lib/jwt';
import { applyRateLimit } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
    // Rate limiting: 10 req / 5 min
    const rateLimited = applyRateLimit(request, 'registration', 10, 300000);
    if (rateLimited) return rateLimited;

    try {
        console.log('🔵 Début de la requête d\'inscription');
        const body = await request.json();
        console.log('📦 Body reçu:', JSON.stringify(body, null, 2));

        // Extraire le userId si connecté
        let userId: string | null = null;
        try {
            const authHeader = request.headers.get('authorization');
            if (authHeader) {
                const token = authHeader.replace('Bearer ', '');
                const decoded = verifyToken(token);
                if (decoded) userId = decoded.userId;
            }
        } catch { }

        console.log('🔵 Création de l\'inscription dans Prisma...');
        const registration = await prisma.registration.create({
            data: {
                eventId: body.eventId,
                formData: body.formData,
                ...(userId && { userId }),
            },
            include: {
                event: true,
            },
        });

        console.log('✅ Inscription créée avec Prisma:', registration.id);

        // Attribuer un badge de soirée à l'utilisateur connecté
        try {
            const authHeader = request.headers.get('authorization');
            if (authHeader) {
                const token = authHeader.replace('Bearer ', '');
                const decoded = verifyToken(token);
                if (decoded) {
                    await prisma.eventBadge.create({
                        data: {
                            userId: decoded.userId,
                            eventId: registration.event.id,
                            eventTitle: registration.event.title,
                            eventImage: registration.event.imageUrl,
                            eventDate: registration.event.date,
                            role: 'attendee',
                        },
                    });
                }
            }
        } catch (e) {
            // Ignorer si le badge existe déjà (contrainte unique)
        }

        // Générer le billet avec QR code
        console.log('🔵 Génération du billet...');
        const ticket = await generateTicket(registration.id);
        console.log('✅ Billet généré:', ticket.id);

        // Récupérer les données utilisateur
        const formData = body.formData as any;
        const userEmail = formData.email || formData.mail;
        const userName = formData.name || formData.firstName || formData.nom || 'Participant';
        console.log('📧 Email utilisateur:', userEmail);
        console.log('👤 Nom utilisateur:', userName);

        // Générer le PDF du billet avec QR code
        let ticketPdfBuffer: Buffer | undefined;
        try {
            console.log('🔵 Génération du PDF avec QR code...');
            ticketPdfBuffer = await generateTicketPDF({
                ticketId: ticket.id,
                qrCode: ticket.qrCode,
                eventTitle: registration.event.title,
                eventDate: registration.event.date,
                eventLocation: registration.event.location,
                eventAddress: registration.event.address,
                attendeeName: userName,
                attendeeEmail: userEmail,
                registrationId: registration.id,
            });
            console.log('✅ PDF du billet généré, taille:', ticketPdfBuffer.length, 'bytes');
        } catch (pdfError) {
            console.error('⚠️ Erreur génération PDF (email sera envoyé sans PDF):', pdfError);
        }

        // Envoyer l'email de confirmation avec le billet PDF
        if (userEmail && registration.event) {
            try {
                await sendConfirmationEmailWithTicket(
                    userEmail,
                    {
                        attendeeName: userName,
                        eventTitle: registration.event.title,
                        eventDate: registration.event.date,
                        eventLocation: registration.event.location,
                        eventAddress: registration.event.address,
                        registrationId: registration.id,
                        isPaid: registration.event.type === 'paid',
                        price: registration.event.price || undefined,
                        currency: registration.event.currency || undefined,
                    },
                    ticketPdfBuffer
                );
                console.log('✅ Email de confirmation avec billet envoyé à:', userEmail);
            } catch (emailError) {
                console.error('⚠️ Erreur envoi email (inscription enregistrée):', emailError);
            }
        } else {
            console.error('⚠️ Email manquant dans formData:', formData);
        }

        // Notifier l'organisateur de la nouvelle inscription
        try {
            const organizer = await prisma.user.findUnique({
                where: { id: registration.event.organizerId },
                select: { email: true, name: true, firstName: true },
            });
            if (organizer?.email) {
                await sendNewRegistrationEmail({
                    to: organizer.email,
                    organizerName: organizer.firstName || organizer.name || 'Organisateur',
                    attendeeName: userName,
                    attendeeEmail: userEmail || 'Non renseigné',
                    eventTitle: registration.event.title,
                    eventDate: registration.event.date,
                    eventId: registration.event.id,
                    currentAttendees: registration.event.currentAttendees + 1,
                    maxAttendees: registration.event.maxAttendees,
                });
            }
        } catch (notifError) {
            console.error('⚠️ Erreur envoi notification organisateur:', notifError);
        }

        // Retourner l'inscription avec l'ID pour accéder à l'adresse de manière sécurisée
        const responseData = {
            ...registration,
            event: registration.event.type === 'paid'
                ? { ...registration.event, address: '🔒 Adresse révélée après inscription' }
                : registration.event,
        };

        return NextResponse.json(responseData, { status: 201 });
    } catch (error) {
        console.error('❌ Erreur création inscription:', error);
        console.error('❌ Message d\'erreur:', error instanceof Error ? error.message : 'Erreur inconnue');
        console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'Pas de stack trace');
        return NextResponse.json(
            {
                error: 'Erreur lors de l\'inscription',
                details: error instanceof Error ? error.message : 'Erreur inconnue'
            },
            { status: 400 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const eventId = searchParams.get('eventId');

        const where = eventId ? { eventId } : {};

        const registrations = await prisma.registration.findMany({
            where,
            include: {
                event: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Récupérer les profils utilisateurs par userId (priorité) puis par email (fallback)
        const userIds = registrations
            .map(r => r.userId)
            .filter(Boolean) as string[];

        const emails = registrations
            .filter(r => !r.userId)
            .map(r => {
                const fd = r.formData as any;
                return fd?.email || fd?.mail || null;
            })
            .filter(Boolean) as string[];

        const userSelect = {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
            photo: true,
            company: true,
            position: true,
        };

        const [usersById, usersByEmail] = await Promise.all([
            userIds.length > 0
                ? prisma.user.findMany({ where: { id: { in: userIds } }, select: userSelect })
                : [],
            emails.length > 0
                ? prisma.user.findMany({ where: { email: { in: emails } }, select: userSelect })
                : [],
        ]);

        const userByIdMap = new Map(usersById.map(u => [u.id, u]));
        const userByEmailMap = new Map(usersByEmail.map(u => [u.email, u]));

        const responseData = registrations.map(registration => {
            let matchedUser = null;
            if (registration.userId) {
                matchedUser = userByIdMap.get(registration.userId) || null;
            }
            if (!matchedUser) {
                const fd = registration.formData as any;
                const email = fd?.email || fd?.mail || null;
                if (email) matchedUser = userByEmailMap.get(email) || null;
            }

            return {
                ...registration,
                userProfile: matchedUser,
                event: registration.event.type === 'paid'
                    ? { ...registration.event, address: '🔒 Adresse révélée après inscription' }
                    : registration.event,
            };
        });

        return NextResponse.json(responseData);
    } catch (error) {
        console.error('❌ Erreur récupération inscriptions:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la récupération des inscriptions' },
            { status: 500 }
        );
    }
}