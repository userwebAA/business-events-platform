import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Event } from 'shared';

export default function EventsScreen() {
    const router = useRouter();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'free' | 'paid'>('all');

    useEffect(() => {
        fetchEvents();
    }, [filter]);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const url = filter === 'all'
                ? 'http://192.168.1.2:3000/api/events'
                : `http://192.168.1.2:3000/api/events?type=${filter}`;
            const response = await fetch(url);
            const data = await response.json();
            setEvents(data.map((e: any) => ({ ...e, date: new Date(e.date) })));
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderEvent = ({ item }: { item: Event }) => (
        <TouchableOpacity
            style={styles.eventCard}
            onPress={() => router.push(`/events/${item.id}`)}
        >
            <View style={styles.eventHeader}>
                <View style={[
                    styles.badge,
                    item.type === 'free' ? styles.freeBadge : styles.paidBadge
                ]}>
                    <Text style={[
                        styles.badgeText,
                        item.type === 'free' ? styles.freeBadgeText : styles.paidBadgeText
                    ]}>
                        {item.type === 'free' ? 'Gratuit' : `${item.price}€`}
                    </Text>
                </View>
                <Text style={styles.attendees}>
                    {item.currentAttendees}/{item.maxAttendees || '∞'}
                </Text>
            </View>

            <Text style={styles.eventTitle}>{item.title}</Text>
            <Text style={styles.eventDescription} numberOfLines={2}>
                {item.description}
            </Text>

            <View style={styles.eventInfo}>
                <View style={styles.infoRow}>
                    <Text style={styles.infoIcon}>📅</Text>
                    <Text style={styles.infoText}>
                        {new Date(item.date).toLocaleDateString('fr-FR')}
                    </Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoIcon}>📍</Text>
                    <Text style={styles.infoText}>{item.location}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.filterContainer}>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
                    onPress={() => setFilter('all')}
                >
                    <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
                        Tous
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'free' && styles.filterButtonActive]}
                    onPress={() => setFilter('free')}
                >
                    <Text style={[styles.filterText, filter === 'free' && styles.filterTextActive]}>
                        Gratuits
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'paid' && styles.filterButtonActive]}
                    onPress={() => setFilter('paid')}
                >
                    <Text style={[styles.filterText, filter === 'paid' && styles.filterTextActive]}>
                        Payants
                    </Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#0ea5e9" />
                </View>
            ) : (
                <FlatList
                    data={events}
                    renderItem={renderEvent}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={
                        <View style={styles.centerContainer}>
                            <Text style={styles.emptyText}>Aucun événement trouvé</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    filterContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 8,
    },
    filterButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#ffffff',
        alignItems: 'center',
    },
    filterButtonActive: {
        backgroundColor: '#0ea5e9',
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
    },
    filterTextActive: {
        color: '#ffffff',
    },
    listContainer: {
        padding: 16,
        gap: 16,
    },
    eventCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    eventHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    badge: {
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    freeBadge: {
        backgroundColor: '#d1fae5',
    },
    paidBadge: {
        backgroundColor: '#dbeafe',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    freeBadgeText: {
        color: '#065f46',
    },
    paidBadgeText: {
        color: '#1e40af',
    },
    attendees: {
        fontSize: 12,
        color: '#6b7280',
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
        gap: 8,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#6b7280',
    },
    infoIcon: {
        fontSize: 16,
        marginRight: 4,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#6b7280',
    },
});
