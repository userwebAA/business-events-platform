import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { generateQRCodeImage } from './ticketService';

interface TicketData {
    ticketId: string;
    qrCode: string;
    eventTitle: string;
    eventDate: Date;
    eventLocation: string;
    eventAddress: string;
    attendeeName: string;
    attendeeEmail: string;
    registrationId: string;
}

export async function generateTicketPDF(ticketData: TicketData): Promise<Buffer> {
    try {
        // Créer un nouveau document PDF
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595, 842]); // A4 size
        const { width, height } = page.getSize();

        // Charger les polices
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        // Générer et embarquer le QR code
        const qrCodeImage = await generateQRCodeImage(ticketData.qrCode);
        const qrCodeBuffer = Buffer.from(qrCodeImage.split(',')[1], 'base64');
        const qrImage = await pdfDoc.embedPng(qrCodeBuffer);

        // Header bleu
        page.drawRectangle({
            x: 0,
            y: height - 150,
            width: width,
            height: 150,
            color: rgb(0.055, 0.647, 0.914), // #0ea5e9
        });

        // Titre
        page.drawText('🎫 BILLET', {
            x: width / 2 - 80,
            y: height - 70,
            size: 32,
            font: fontBold,
            color: rgb(1, 1, 1),
        });

        // Nom de l'événement
        const titleLines = splitText(ticketData.eventTitle, 50);
        titleLines.forEach((line, index) => {
            page.drawText(line, {
                x: 50,
                y: height - 120 - (index * 20),
                size: 16,
                font: fontBold,
                color: rgb(1, 1, 1),
            });
        });

        // Formater la date
        const formattedDate = new Date(ticketData.eventDate).toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

        let yPosition = height - 220;

        // Date et heure
        page.drawText('📅 Date et heure', {
            x: 50,
            y: yPosition,
            size: 14,
            font: fontBold,
            color: rgb(0, 0, 0),
        });
        page.drawText(formattedDate, {
            x: 50,
            y: yPosition - 20,
            size: 12,
            font: font,
            color: rgb(0, 0, 0),
        });

        yPosition -= 60;

        // Lieu
        page.drawText('📍 Lieu', {
            x: 50,
            y: yPosition,
            size: 14,
            font: fontBold,
            color: rgb(0, 0, 0),
        });
        page.drawText(ticketData.eventLocation, {
            x: 50,
            y: yPosition - 20,
            size: 12,
            font: font,
            color: rgb(0, 0, 0),
        });
        page.drawText(ticketData.eventAddress, {
            x: 50,
            y: yPosition - 40,
            size: 10,
            font: font,
            color: rgb(0.4, 0.4, 0.4),
        });

        yPosition -= 80;

        // Participant
        page.drawText('👤 Participant', {
            x: 50,
            y: yPosition,
            size: 14,
            font: fontBold,
            color: rgb(0, 0, 0),
        });
        page.drawText(ticketData.attendeeName, {
            x: 50,
            y: yPosition - 20,
            size: 12,
            font: font,
            color: rgb(0, 0, 0),
        });
        page.drawText(ticketData.attendeeEmail, {
            x: 50,
            y: yPosition - 40,
            size: 10,
            font: font,
            color: rgb(0.4, 0.4, 0.4),
        });

        // QR Code
        const qrSize = 200;
        page.drawImage(qrImage, {
            x: width - qrSize - 50,
            y: height - 220 - qrSize,
            width: qrSize,
            height: qrSize,
        });

        page.drawText('Scannez ce QR code à l\'entrée', {
            x: width - qrSize - 50 + 10,
            y: height - 220 - qrSize - 20,
            size: 10,
            font: font,
            color: rgb(0, 0, 0),
        });

        // Footer
        page.drawText('💡 Conseil : Présentez ce billet (imprimé ou sur votre téléphone) à l\'entrée.', {
            x: 50,
            y: 100,
            size: 10,
            font: font,
            color: rgb(0.4, 0.4, 0.4),
        });

        page.drawText(`ID: ${ticketData.ticketId}`, {
            x: 50,
            y: 60,
            size: 8,
            font: font,
            color: rgb(0.6, 0.6, 0.6),
        });

        page.drawText('Business Events - Votre plateforme d\'événements professionnels', {
            x: 50,
            y: 40,
            size: 8,
            font: font,
            color: rgb(0.6, 0.6, 0.6),
        });

        // Sauvegarder le PDF
        const pdfBytes = await pdfDoc.save();
        return Buffer.from(pdfBytes);
    } catch (error) {
        console.error('❌ Erreur génération PDF:', error);
        throw error;
    }
}

// Fonction utilitaire pour diviser le texte en lignes
function splitText(text: string, maxLength: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
        if ((currentLine + word).length <= maxLength) {
            currentLine += (currentLine ? ' ' : '') + word;
        } else {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
        }
    });

    if (currentLine) lines.push(currentLine);
    return lines;
}
