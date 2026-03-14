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
    ticketNumber?: number;
    totalTickets?: number;
}

// Remplacer les caractères accentués par leurs équivalents ASCII
function sanitizeText(text: string): string {
    if (!text) return '';
    return text
        .replace(/[àâä]/g, 'a')
        .replace(/[éèêë]/g, 'e')
        .replace(/[îï]/g, 'i')
        .replace(/[ôö]/g, 'o')
        .replace(/[ùûü]/g, 'u')
        .replace(/[ç]/g, 'c')
        .replace(/[ÀÂÄÁ]/g, 'A')
        .replace(/[ÉÈÊË]/g, 'E')
        .replace(/[ÎÏ]/g, 'I')
        .replace(/[ÔÖ]/g, 'O')
        .replace(/[ÙÛÜÚ]/g, 'U')
        .replace(/[Ç]/g, 'C')
        .replace(/[^\x20-\x7E]/g, ''); // Supprimer tout caractère non-ASCII restant
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
        const headerTitle = ticketData.totalTickets && ticketData.totalTickets > 1
            ? `BILLET ${ticketData.ticketNumber}/${ticketData.totalTickets}`
            : 'BILLET D\'ENTREE';
        page.drawText(headerTitle, {
            x: width / 2 - 80,
            y: height - 70,
            size: 32,
            font: fontBold,
            color: rgb(1, 1, 1),
        });

        // Nom de l'événement
        const titleLines = splitText(sanitizeText(ticketData.eventTitle), 50);
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
        page.drawText('Date et heure', {
            x: 50,
            y: yPosition,
            size: 14,
            font: fontBold,
            color: rgb(0, 0, 0),
        });
        page.drawText(sanitizeText(formattedDate), {
            x: 50,
            y: yPosition - 20,
            size: 12,
            font: font,
            color: rgb(0, 0, 0),
        });

        yPosition -= 60;

        // Lieu
        page.drawText('Lieu', {
            x: 50,
            y: yPosition,
            size: 14,
            font: fontBold,
            color: rgb(0, 0, 0),
        });
        page.drawText(sanitizeText(ticketData.eventLocation), {
            x: 50,
            y: yPosition - 20,
            size: 12,
            font: font,
            color: rgb(0, 0, 0),
        });
        page.drawText(sanitizeText(ticketData.eventAddress), {
            x: 50,
            y: yPosition - 40,
            size: 10,
            font: font,
            color: rgb(0.4, 0.4, 0.4),
        });

        yPosition -= 80;

        // Participant
        page.drawText('Participant', {
            x: 50,
            y: yPosition,
            size: 14,
            font: fontBold,
            color: rgb(0, 0, 0),
        });
        page.drawText(sanitizeText(ticketData.attendeeName), {
            x: 50,
            y: yPosition - 20,
            size: 12,
            font: font,
            color: rgb(0, 0, 0),
        });
        page.drawText(sanitizeText(ticketData.attendeeEmail), {
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

        page.drawText('Scannez ce QR code a l\'entree', {
            x: width - qrSize - 50 + 10,
            y: height - 220 - qrSize - 20,
            size: 10,
            font: font,
            color: rgb(0, 0, 0),
        });

        // Footer
        page.drawText('Conseil : Presentez ce billet (imprime ou sur votre telephone) a l\'entree.', {
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

        page.drawText('Business Events - Votre plateforme d\'evenements professionnels', {
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

export async function generateMultiTicketPDF(ticketsData: TicketData[]): Promise<Buffer> {
    try {
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        for (const ticketData of ticketsData) {
            const page = pdfDoc.addPage([595, 842]);
            const { width, height } = page.getSize();

            const qrCodeImage = await generateQRCodeImage(ticketData.qrCode);
            const qrCodeBuffer = Buffer.from(qrCodeImage.split(',')[1], 'base64');
            const qrImage = await pdfDoc.embedPng(qrCodeBuffer);

            // Header bleu
            page.drawRectangle({
                x: 0, y: height - 150, width, height: 150,
                color: rgb(0.055, 0.647, 0.914),
            });

            const headerTitle = ticketData.totalTickets && ticketData.totalTickets > 1
                ? `BILLET ${ticketData.ticketNumber}/${ticketData.totalTickets}`
                : 'BILLET D\'ENTREE';
            page.drawText(headerTitle, {
                x: width / 2 - 80, y: height - 70, size: 32, font: fontBold, color: rgb(1, 1, 1),
            });

            const titleLines = splitText(sanitizeText(ticketData.eventTitle), 50);
            titleLines.forEach((line, index) => {
                page.drawText(line, {
                    x: 50, y: height - 120 - (index * 20), size: 16, font: fontBold, color: rgb(1, 1, 1),
                });
            });

            const formattedDate = new Date(ticketData.eventDate).toLocaleDateString('fr-FR', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
            });

            let yPosition = height - 220;

            page.drawText('Date et heure', { x: 50, y: yPosition, size: 14, font: fontBold, color: rgb(0, 0, 0) });
            page.drawText(sanitizeText(formattedDate), { x: 50, y: yPosition - 20, size: 12, font, color: rgb(0, 0, 0) });
            yPosition -= 60;

            page.drawText('Lieu', { x: 50, y: yPosition, size: 14, font: fontBold, color: rgb(0, 0, 0) });
            page.drawText(sanitizeText(ticketData.eventLocation), { x: 50, y: yPosition - 20, size: 12, font, color: rgb(0, 0, 0) });
            page.drawText(sanitizeText(ticketData.eventAddress), { x: 50, y: yPosition - 40, size: 10, font, color: rgb(0.4, 0.4, 0.4) });
            yPosition -= 80;

            page.drawText('Participant', { x: 50, y: yPosition, size: 14, font: fontBold, color: rgb(0, 0, 0) });
            page.drawText(sanitizeText(ticketData.attendeeName), { x: 50, y: yPosition - 20, size: 12, font, color: rgb(0, 0, 0) });
            page.drawText(sanitizeText(ticketData.attendeeEmail), { x: 50, y: yPosition - 40, size: 10, font, color: rgb(0.4, 0.4, 0.4) });

            const qrSize = 200;
            page.drawImage(qrImage, { x: width - qrSize - 50, y: height - 220 - qrSize, width: qrSize, height: qrSize });
            page.drawText('Scannez ce QR code a l\'entree', { x: width - qrSize - 50 + 10, y: height - 220 - qrSize - 20, size: 10, font, color: rgb(0, 0, 0) });

            page.drawText('Conseil : Presentez ce billet (imprime ou sur votre telephone) a l\'entree.', { x: 50, y: 100, size: 10, font, color: rgb(0.4, 0.4, 0.4) });
            page.drawText(`ID: ${ticketData.ticketId}`, { x: 50, y: 60, size: 8, font, color: rgb(0.6, 0.6, 0.6) });
            page.drawText('Business Events - Votre plateforme d\'evenements professionnels', { x: 50, y: 40, size: 8, font, color: rgb(0.6, 0.6, 0.6) });
        }

        const pdfBytes = await pdfDoc.save();
        return Buffer.from(pdfBytes);
    } catch (error) {
        console.error('Erreur generation PDF multi-billets:', error);
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
