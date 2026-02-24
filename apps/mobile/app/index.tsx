import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
    const router = useRouter();

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.icon}>📅</Text>
                <Text style={styles.title}>Business Events</Text>
                <Text style={styles.subtitle}>
                    Organisez vos événements business en toute simplicité
                </Text>
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.button, styles.primaryButton]}
                    onPress={() => router.push('/events')}
                >
                    <Text style={styles.primaryButtonText}>Découvrir les événements</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.features}>
                <View style={styles.featureCard}>
                    <Text style={styles.featureIcon}>📅</Text>
                    <Text style={styles.featureTitle}>Création facile</Text>
                    <Text style={styles.featureDescription}>
                        Créez vos événements en quelques clics
                    </Text>
                </View>

                <View style={styles.featureCard}>
                    <Text style={styles.featureIcon}>👥</Text>
                    <Text style={styles.featureTitle}>Gestion des participants</Text>
                    <Text style={styles.featureDescription}>
                        Collectez les informations professionnelles
                    </Text>
                </View>

                <View style={styles.featureCard}>
                    <Text style={styles.featureIcon}>💳</Text>
                    <Text style={styles.featureTitle}>Paiements sécurisés</Text>
                    <Text style={styles.featureDescription}>
                        Acceptez les paiements en ligne via Stripe
                    </Text>
                </View>

                <View style={styles.featureCard}>
                    <Text style={styles.featureIcon}>🔒</Text>
                    <Text style={styles.featureTitle}>Sécurisé</Text>
                    <Text style={styles.featureDescription}>
                        Vos données sont protégées
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    header: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#111827',
        marginTop: 16,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 18,
        color: '#6b7280',
        textAlign: 'center',
        marginTop: 8,
    },
    buttonContainer: {
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 40,
    },
    button: {
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        alignItems: 'center',
    },
    primaryButton: {
        backgroundColor: '#0ea5e9',
    },
    primaryButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: '#ffffff',
        borderWidth: 2,
        borderColor: '#0ea5e9',
    },
    secondaryButtonText: {
        color: '#0ea5e9',
        fontSize: 18,
        fontWeight: '600',
    },
    features: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        gap: 16,
    },
    featureCard: {
        backgroundColor: '#ffffff',
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    featureIcon: {
        fontSize: 32,
        marginBottom: 12,
    },
    icon: {
        fontSize: 64,
    },
    featureTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 8,
    },
    featureDescription: {
        fontSize: 14,
        color: '#6b7280',
    },
});
