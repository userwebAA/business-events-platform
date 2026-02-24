import nodemailer from 'nodemailer';

// Configuration du transporteur email
// Pour le développement, utilise un service comme Gmail ou Mailtrap
export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface SendConfirmationEmailParams {
  to: string;
  eventTitle: string;
  eventDate: Date;
  eventLocation: string;
  eventAddress: string;
  userName?: string;
  ticketPdf?: Buffer;
}

export async function sendConfirmationEmail({
  to,
  eventTitle,
  eventDate,
  eventLocation,
  eventAddress,
  userName = 'Participant',
  ticketPdf,
}: SendConfirmationEmailParams) {
  const formattedDate = new Date(eventDate).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const mailOptions: any = {
    from: `"TAFF Events" <${process.env.SMTP_USER}>`,
    to,
    subject: `🎫 Confirmation d'inscription - ${eventTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .event-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9; }
            .detail-row { margin: 10px 0; }
            .label { font-weight: bold; color: #0ea5e9; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .button { display: inline-block; background: #0ea5e9; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Inscription confirmée !</h1>
            </div>
            <div class="content">
              <p>Bonjour ${userName},</p>
              <p>Votre inscription à l'événement a été confirmée avec succès !</p>
              
              <div class="event-details">
                <h2 style="margin-top: 0; color: #0ea5e9;">📅 Détails de l'événement</h2>
                <div class="detail-row">
                  <span class="label">Événement :</span> ${eventTitle}
                </div>
                <div class="detail-row">
                  <span class="label">Date :</span> ${formattedDate}
                </div>
                <div class="detail-row">
                  <span class="label">Lieu :</span> ${eventLocation}
                </div>
                <div class="detail-row">
                  <span class="label">Adresse :</span> ${eventAddress}
                </div>
              </div>

              <p>🎫 <strong>Votre billet est en pièce jointe de cet email !</strong></p>
              <p>📧 Conservez cet email et votre billet pour accéder à l'événement.</p>
              <p>💡 Vous recevrez un rappel 24h avant l'événement.</p>
              
              <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; color: #92400e;">
                  <strong>📱 Le jour de l'événement :</strong><br>
                  Présentez votre billet (imprimé ou sur votre téléphone) à l'entrée.<br>
                  Le QR code sera scanné pour valider votre accès.
                </p>
              </div>

              <div style="text-align: center;">
                <p>À très bientôt !</p>
                <p style="color: #0ea5e9; font-weight: bold;">L'équipe TAFF Events</p>
              </div>
            </div>
            <div class="footer">
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Bonjour ${userName},

Votre inscription à l'événement a été confirmée avec succès !

DÉTAILS DE L'ÉVÉNEMENT
-----------------------
Événement : ${eventTitle}
Date : ${formattedDate}
Lieu : ${eventLocation}
Adresse : ${eventAddress}

Conservez cet email comme confirmation de votre inscription.
Vous recevrez un rappel 24h avant l'événement.

À très bientôt !
L'équipe TAFF Events
    `,
  };

  // Ajouter le billet PDF en pièce jointe si fourni
  if (ticketPdf) {
    mailOptions.attachments = [
      {
        filename: `billet-${eventTitle.replace(/\s+/g, '-')}.pdf`,
        content: ticketPdf,
        contentType: 'application/pdf',
      },
    ];
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Email de confirmation envoyé à:', to);
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    return { success: false, error };
  }
}
