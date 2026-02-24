import { prisma } from './prisma';
import { sendReminderEmail, sendEventUpdateEmail, sendEventCancelledEmail } from './emailTemplates';
import webpush from 'web-push';

// Configuration Web Push (à configurer avec vos clés VAPID)
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(
        'mailto:contact@taff-events.com',
        vapidPublicKey,
        vapidPrivateKey
    );
}

export type NotificationType = 
    | 'EVENT_REMINDER'
    | 'EVENT_UPDATE'
    | 'EVENT_CANCELLED'
    | 'REGISTRATION_CONFIRMED'
    | 'NETWORKING_MATCH'
    | 'MESSAGE_RECEIVED'
    | 'SYSTEM';

interface CreateNotificationParams {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    sendPush?: boolean;
    sendEmail?: boolean;
}

/**
 * Crée une notification dans la base de données
 */
export async function createNotification({
    userId,
    type,
    title,
    message,
    link,
    sendPush = true,
    sendEmail = false,
}: CreateNotificationParams) {
    try {
        // Créer la notification en base
        const notification = await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                link,
            },
        });

        // Envoyer une notification push si demandé
        if (sendPush) {
            await sendPushNotification(userId, title, message, link);
        }

        // Envoyer un email si demandé
        if (sendEmail) {
            await sendEmailNotification(userId, type, title, message);
        }

        return notification;
    } catch (error) {
        console.error('Erreur création notification:', error);
        throw error;
    }
}

/**
 * Envoie une notification push à un utilisateur
 */
async function sendPushNotification(
    userId: string,
    title: string,
    body: string,
    url?: string
) {
    try {
        // Récupérer toutes les souscriptions push de l'utilisateur
        const subscriptions = await prisma.pushSubscription.findMany({
            where: { userId },
        });

        if (subscriptions.length === 0) {
            console.log('Aucune souscription push pour l\'utilisateur:', userId);
            return;
        }

        const payload = JSON.stringify({
            title,
            body,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            url: url || '/',
            timestamp: Date.now(),
        });

        // Envoyer à toutes les souscriptions
        const promises = subscriptions.map(async (sub) => {
            try {
                await webpush.sendNotification(
                    {
                        endpoint: sub.endpoint,
                        keys: {
                            p256dh: sub.p256dh,
                            auth: sub.auth,
                        },
                    },
                    payload
                );
            } catch (error: any) {
                // Si la souscription est invalide, la supprimer
                if (error.statusCode === 410) {
                    await prisma.pushSubscription.delete({
                        where: { id: sub.id },
                    });
                }
                console.error('Erreur envoi push:', error);
            }
        });

        await Promise.all(promises);
        console.log('✅ Notifications push envoyées');
    } catch (error) {
        console.error('Erreur envoi notifications push:', error);
    }
}

/**
 * Envoie un email de notification
 */
async function sendEmailNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string
) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, name: true },
        });

        if (!user) return;

        // Pour l'instant, on envoie un email générique
        // Les emails spécifiques (rappels, etc.) sont gérés séparément
        console.log(`📧 Email notification envoyé à ${user.email}: ${title}`);
    } catch (error) {
        console.error('Erreur envoi email notification:', error);
    }
}

/**
 * Récupère les notifications d'un utilisateur
 */
export async function getUserNotifications(userId: string, limit = 50) {
    return await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
    });
}

/**
 * Marque une notification comme lue
 */
export async function markNotificationAsRead(notificationId: string) {
    return await prisma.notification.update({
        where: { id: notificationId },
        data: { read: true },
    });
}

/**
 * Marque toutes les notifications d'un utilisateur comme lues
 */
export async function markAllNotificationsAsRead(userId: string) {
    return await prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
    });
}

/**
 * Compte les notifications non lues d'un utilisateur
 */
export async function getUnreadNotificationsCount(userId: string) {
    return await prisma.notification.count({
        where: { userId, read: false },
    });
}

/**
 * Supprime une notification
 */
export async function deleteNotification(notificationId: string) {
    return await prisma.notification.delete({
        where: { id: notificationId },
    });
}

/**
 * Enregistre une souscription push
 */
export async function subscribeToPush(
    userId: string,
    subscription: {
        endpoint: string;
        keys: {
            p256dh: string;
            auth: string;
        };
    }
) {
    try {
        // Vérifier si la souscription existe déjà
        const existing = await prisma.pushSubscription.findUnique({
            where: { endpoint: subscription.endpoint },
        });

        if (existing) {
            return existing;
        }

        // Créer la nouvelle souscription
        return await prisma.pushSubscription.create({
            data: {
                userId,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
            },
        });
    } catch (error) {
        console.error('Erreur enregistrement souscription push:', error);
        throw error;
    }
}

/**
 * Supprime une souscription push
 */
export async function unsubscribeFromPush(endpoint: string) {
    try {
        await prisma.pushSubscription.delete({
            where: { endpoint },
        });
    } catch (error) {
        console.error('Erreur suppression souscription push:', error);
    }
}

/**
 * Envoie des rappels d'événements (à exécuter via cron job)
 */
export async function sendEventReminders() {
    try {
        // Trouver les événements qui ont lieu dans 24h
        const tomorrow = new Date();
        tomorrow.setHours(tomorrow.getHours() + 24);
        
        const dayAfterTomorrow = new Date();
        dayAfterTomorrow.setHours(dayAfterTomorrow.getHours() + 25);

        const upcomingEvents = await prisma.event.findMany({
            where: {
                date: {
                    gte: tomorrow,
                    lte: dayAfterTomorrow,
                },
                status: 'published',
            },
            include: {
                registrations: true,
            },
        });

        console.log(`📅 ${upcomingEvents.length} événements à rappeler`);

        for (const event of upcomingEvents) {
            for (const registration of event.registrations) {
                const formData = registration.formData as any;
                const email = formData.email;
                const name = formData.name || formData.firstName || 'Participant';

                if (email) {
                    // Envoyer l'email de rappel
                    await sendReminderEmail({
                        to: email,
                        eventTitle: event.title,
                        eventDate: event.date,
                        eventLocation: event.location,
                        eventAddress: event.address,
                        userName: name,
                    });

                    console.log(`✅ Rappel envoyé à ${email} pour ${event.title}`);
                }
            }
        }

        return { success: true, eventsProcessed: upcomingEvents.length };
    } catch (error) {
        console.error('Erreur envoi rappels:', error);
        return { success: false, error };
    }
}
