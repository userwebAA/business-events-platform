import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
    return (
        <>
            <StatusBar style="auto" />
            <Stack>
                <Stack.Screen name="index" options={{ title: 'Business Events' }} />
                <Stack.Screen name="events" options={{ title: 'Événements' }} />
                <Stack.Screen name="events/[id]" options={{ title: 'Détails' }} />
                <Stack.Screen name="events/create" options={{ title: 'Créer un événement' }} />
            </Stack>
        </>
    );
}
