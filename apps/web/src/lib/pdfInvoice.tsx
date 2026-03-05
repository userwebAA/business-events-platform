import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 10,
        fontFamily: 'Helvetica',
    },
    header: {
        marginBottom: 30,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    invoiceNumber: {
        fontSize: 12,
        color: '#666',
        marginBottom: 5,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    row: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    label: {
        width: '30%',
        color: '#666',
    },
    value: {
        width: '70%',
        fontWeight: 'bold',
    },
    table: {
        marginTop: 20,
        marginBottom: 20,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f0f0f0',
        padding: 8,
        fontWeight: 'bold',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        padding: 8,
    },
    col1: {
        width: '60%',
    },
    col2: {
        width: '20%',
        textAlign: 'right',
    },
    col3: {
        width: '20%',
        textAlign: 'right',
    },
    total: {
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingTop: 10,
        borderTopWidth: 2,
        borderTopColor: '#333',
    },
    totalLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        marginRight: 20,
    },
    totalValue: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    footer: {
        position: 'absolute',
        bottom: 40,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontSize: 8,
        color: '#999',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingTop: 10,
    },
});

interface InvoiceData {
    invoiceNumber: string;
    date: Date;
    eventTitle: string;
    eventDate: Date;
    attendeeName: string;
    attendeeEmail?: string;
    company?: string;
    price: number;
    currency: string;
    registrationId: string;
}

const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

const formatCurrency = (amount: number, currency: string) => {
    return `${amount.toFixed(2)} ${currency === 'EUR' ? '€' : currency}`;
};

export const createInvoiceDocument = (data: InvoiceData) => {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>FACTURE</Text>
                    <Text style={styles.invoiceNumber}>N° {data.invoiceNumber}</Text>
                    <Text style={styles.invoiceNumber}>Date: {formatDate(data.date)}</Text>
                </View>

                {/* Informations client */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Informations client</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Nom:</Text>
                        <Text style={styles.value}>{data.attendeeName}</Text>
                    </View>
                    {data.attendeeEmail && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Email:</Text>
                            <Text style={styles.value}>{data.attendeeEmail}</Text>
                        </View>
                    )}
                    {data.company && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Société:</Text>
                            <Text style={styles.value}>{data.company}</Text>
                        </View>
                    )}
                </View>

                {/* Informations événement */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Détails de l'événement</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Événement:</Text>
                        <Text style={styles.value}>{data.eventTitle}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Date:</Text>
                        <Text style={styles.value}>{formatDate(data.eventDate)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>ID inscription:</Text>
                        <Text style={styles.value}>{data.registrationId}</Text>
                    </View>
                </View>

                {/* Tableau des articles */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.col1}>Description</Text>
                        <Text style={styles.col2}>Quantité</Text>
                        <Text style={styles.col3}>Montant</Text>
                    </View>
                    <View style={styles.tableRow}>
                        <Text style={styles.col1}>Inscription - {data.eventTitle}</Text>
                        <Text style={styles.col2}>1</Text>
                        <Text style={styles.col3}>{formatCurrency(data.price, data.currency)}</Text>
                    </View>
                </View>

                {/* Total */}
                <View style={styles.total}>
                    <Text style={styles.totalLabel}>TOTAL:</Text>
                    <Text style={styles.totalValue}>{formatCurrency(data.price, data.currency)}</Text>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>Merci pour votre inscription !</Text>
                    <Text>Cette facture a été générée automatiquement.</Text>
                </View>
            </Page>
        </Document>
    );
};
