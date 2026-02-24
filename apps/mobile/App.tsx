import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useState } from 'react';

export default function App() {
    const [screen, setScreen] = useState('home');

    if (screen === 'home') {
        return (
            <View style={styles.container}>
                <StatusBar style="auto" />
                <ScrollView style={styles.scrollView}>
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
                            onPress={() => setScreen('events')}
                        >
                            <Text style={styles.primaryButtonText}>Voir les événements</Text>
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
            </View>
        );
    }

    if (screen === 'events') {
        return (
            <View style={styles.container}>
                <StatusBar style="auto" />
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => setScreen('home')}>
                        <Text style={styles.backButton}>← Retour</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Événements</Text>
                </View>

                <ScrollView style={styles.scrollView}>
                    <View style={styles.eventCard}>
                        <Text style={styles.badge}>GRATUIT</Text>
                        <Text style={styles.eventTitle}>Networking Tech & Innovation 2025</Text>
                        <Text style={styles.eventDescription}>
                            Soirée de networking pour les professionnels de la tech
                        </Text>
                        <Text style={styles.eventInfo}>📅 25 janvier 2025</Text>
                        <Text style={styles.eventInfo}>📍 Paris</Text>
                    </View>

                    <View style={styles.eventCard}>
                        <Text style={styles.badgePaid}>49.99 €</Text>
                        <Text style={styles.eventTitle}>Conférence Leadership & Management</Text>
                        <Text style={styles.eventDescription}>
                            Conférence exclusive avec des experts en leadership
                        </Text>
                        <Text style={styles.eventInfo}>📅 5 février 2025</Text>
                        <Text style={styles.eventInfo}>📍 Lyon</Text>
                    </View>

                    <Text style={styles.infoText}>
                        💡 Connectez-vous au même WiFi que votre PC pour voir tous les événements
                    </Text>
                </ScrollView>
            </View>
        );
    }

    return null;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
        paddingTop: 60,
    },
    icon: {
        fontSize: 64,
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
        marginBottom: 16,
    },
    featureIcon: {
        fontSize: 32,
        marginBottom: 12,
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
    backButton: {
        fontSize: 18,
        color: '#0ea5e9',
        marginBottom: 16,
    },
    eventCard: {
        backgroundColor: '#ffffff',
        padding: 20,
        borderRadius: 12,
        marginHorizontal: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    badge: {
        backgroundColor: '#d1fae5',
        color: '#065f46',
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 12,
        fontSize: 12,
        fontWeight: '600',
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    badgePaid: {
        backgroundColor: '#dbeafe',
        color: '#1e40af',
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 12,
        fontSize: 12,
        fontWeight: '600',
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    eventTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    eventDescription: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 12,
    },
    eventInfo: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 4,
    },
    infoText: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        padding: 20,
        fontStyle: 'italic',
    },
});
