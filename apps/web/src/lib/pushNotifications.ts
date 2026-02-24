export const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

export const subscribeToPushNotifications = async (): Promise<PushSubscription | null> => {
    try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('Push notifications non supportées');
            return null;
        }

        const registration = await navigator.serviceWorker.ready;
        
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
            console.error('Clé VAPID publique manquante');
            return null;
        }

        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey,
        });

        const token = localStorage.getItem('token');
        if (!token) {
            console.error('Token manquant');
            return null;
        }

        await fetch('/api/notifications/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                subscription: subscription.toJSON(),
            }),
        });

        console.log('✅ Souscription push enregistrée');
        return subscription;
    } catch (error) {
        console.error('Erreur souscription push:', error);
        return null;
    }
};

export const unsubscribeFromPushNotifications = async (): Promise<boolean> => {
    try {
        if (!('serviceWorker' in navigator)) {
            return false;
        }

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            return true;
        }

        const token = localStorage.getItem('token');
        if (token) {
            await fetch('/api/notifications/subscribe', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    endpoint: subscription.endpoint,
                }),
            });
        }

        await subscription.unsubscribe();
        console.log('✅ Désinscription push réussie');
        return true;
    } catch (error) {
        console.error('Erreur désinscription push:', error);
        return false;
    }
};

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
        console.warn('Notifications non supportées');
        return 'denied';
    }

    if (Notification.permission === 'granted') {
        return 'granted';
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission;
    }

    return Notification.permission;
};
