import { transporter } from './email';

interface EmailData {
  attendeeName: string;
  eventTitle: string;
  eventDate: Date;
  eventLocation: string;
  eventAddress?: string;
  registrationId: string;
  isPaid: boolean;
  price?: number;
  currency?: string;
  invoiceHTML?: string;
}

interface ReminderEmailParams {
  to: string;
  eventTitle: string;
  eventDate: Date;
  eventLocation: string;
  eventAddress: string;
  userName?: string;
}

interface EventUpdateEmailParams {
  to: string;
  eventTitle: string;
  updateMessage: string;
  eventDate: Date;
  eventLocation: string;
  userName?: string;
}

interface EventCancelledEmailParams {
  to: string;
  eventTitle: string;
  reason?: string;
  userName?: string;
}

export function generateConfirmationEmail(data: EmailData): string {
  const formattedDate = data.eventDate.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const addressSection = data.eventAddress ? `
    <div style="background: #f0f9ff; padding: 20px; border-radius: 10px; margin: 20px 0;">
      <h3 style="color: #0ea5e9; margin-bottom: 10px;">📍 Adresse de l'événement</h3>
      <p style="margin: 0; color: #334155;">${data.eventAddress}</p>
    </div>
  ` : '';

  const paymentSection = data.isPaid ? `
    <div style="background: #f0fdf4; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #10b981;">
      <h3 style="color: #10b981; margin-bottom: 10px;">✓ Paiement confirmé</h3>
      <p style="margin: 0; color: #334155;">Montant: <strong>${data.price} ${data.currency}</strong></p>
      <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">Votre facture est jointe à cet email</p>
    </div>
  ` : '';

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation d'inscription</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 32px;">✓ Inscription confirmée !</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="font-size: 18px; color: #334155; margin: 0 0 20px 0;">
                Bonjour <strong>${data.attendeeName}</strong>,
              </p>
              
              <p style="font-size: 16px; color: #64748b; line-height: 1.6; margin: 0 0 30px 0;">
                Votre inscription à l'événement <strong style="color: #0ea5e9;">${data.eventTitle}</strong> a bien été confirmée !
              </p>
              
              ${paymentSection}
              
              <!-- Event Details -->
              <div style="background: #f8fafc; padding: 25px; border-radius: 10px; margin: 20px 0;">
                <h3 style="color: #0ea5e9; margin: 0 0 15px 0; font-size: 18px;">📅 Détails de l'événement</h3>
                
                <div style="margin-bottom: 15px;">
                  <p style="margin: 0; color: #94a3b8; font-size: 14px;">Date et heure</p>
                  <p style="margin: 5px 0 0 0; color: #334155; font-size: 16px; font-weight: bold;">${formattedDate}</p>
                </div>
                
                <div style="margin-bottom: 15px;">
                  <p style="margin: 0; color: #94a3b8; font-size: 14px;">Lieu</p>
                  <p style="margin: 5px 0 0 0; color: #334155; font-size: 16px; font-weight: bold;">${data.eventLocation}</p>
                </div>
                
                <div>
                  <p style="margin: 0; color: #94a3b8; font-size: 14px;">ID d'inscription</p>
                  <p style="margin: 5px 0 0 0; color: #334155; font-size: 14px; font-family: monospace;">${data.registrationId}</p>
                </div>
              </div>
              
              ${addressSection}
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/events" 
                   style="display: inline-block; background: #0ea5e9; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                  Voir mes événements
                </a>
              </div>
              
              <!-- Info Box -->
              <div style="background: #fef3c7; padding: 20px; border-radius: 10px; margin: 30px 0; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>💡 Bon à savoir :</strong> La liste des participants sera accessible 30 minutes avant l'événement pour faciliter le networking.
                </p>
              </div>
              
              <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 20px 0 0 0;">
                À très bientôt !<br>
                <strong style="color: #0ea5e9;">L'équipe Business Events</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px 0; color: #64748b; font-size: 14px;">
                <strong>Business Events</strong>
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                123 Avenue des Champs-Élysées, 75008 Paris, France
              </p>
              <p style="margin: 10px 0 0 0; color: #94a3b8; font-size: 12px;">
                contact@businessevents.com
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export async function sendReminderEmail({
  to,
  eventTitle,
  eventDate,
  eventLocation,
  eventAddress,
  userName = 'Participant',
}: ReminderEmailParams) {
  const formattedDate = new Date(eventDate).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const mailOptions = {
    from: `"TAFF Events - No Reply" <${process.env.SMTP_USER}>`,
    to,
    subject: `⏰ Rappel - ${eventTitle} demain !`,
    html: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rappel d'événement</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 32px;">⏰ C'est demain !</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="font-size: 18px; color: #334155; margin: 0 0 20px 0;">
                Bonjour <strong>${userName}</strong>,
              </p>
              <p style="font-size: 16px; color: #64748b; line-height: 1.6; margin: 0 0 30px 0;">
                Nous vous rappelons que l'événement <strong style="color: #f59e0b;">${eventTitle}</strong> aura lieu demain !
              </p>
              <div style="background: #fef3c7; padding: 25px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <h3 style="color: #f59e0b; margin: 0 0 15px 0; font-size: 18px;">📅 Détails de l'événement</h3>
                <div style="margin-bottom: 15px;">
                  <p style="margin: 0; color: #92400e; font-size: 14px;">Date et heure</p>
                  <p style="margin: 5px 0 0 0; color: #334155; font-size: 16px; font-weight: bold;">${formattedDate}</p>
                </div>
                <div style="margin-bottom: 15px;">
                  <p style="margin: 0; color: #92400e; font-size: 14px;">Lieu</p>
                  <p style="margin: 5px 0 0 0; color: #334155; font-size: 16px; font-weight: bold;">${eventLocation}</p>
                </div>
                <div>
                  <p style="margin: 0; color: #92400e; font-size: 14px;">Adresse</p>
                  <p style="margin: 5px 0 0 0; color: #334155; font-size: 16px; font-weight: bold;">${eventAddress}</p>
                </div>
              </div>
              <div style="background: #dbeafe; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <p style="margin: 0; color: #1e40af; font-size: 14px;">
                  <strong>💡 Conseil :</strong> Préparez vos cartes de visite et n'oubliez pas de consulter la liste des participants pour optimiser votre networking !
                </p>
              </div>
              <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 20px 0 0 0;">
                À très bientôt !<br>
                <strong style="color: #0ea5e9;">L'équipe Business Events</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                Cet email a été envoyé automatiquement
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Email de rappel envoyé à:', to);
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur envoi email rappel:', error);
    return { success: false, error };
  }
}

export async function sendEventUpdateEmail({
  to,
  eventTitle,
  updateMessage,
  eventDate,
  eventLocation,
  userName = 'Participant',
}: EventUpdateEmailParams) {
  const formattedDate = new Date(eventDate).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const mailOptions = {
    from: `"TAFF Events - No Reply" <${process.env.SMTP_USER}>`,
    to,
    subject: `📢 Mise à jour - ${eventTitle}`,
    html: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mise à jour d'événement</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 32px;">📢 Mise à jour</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="font-size: 18px; color: #334155; margin: 0 0 20px 0;">
                Bonjour <strong>${userName}</strong>,
              </p>
              <p style="font-size: 16px; color: #64748b; line-height: 1.6; margin: 0 0 30px 0;">
                L'événement <strong style="color: #8b5cf6;">${eventTitle}</strong> a été mis à jour.
              </p>
              <div style="background: #faf5ff; padding: 25px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #8b5cf6;">
                <h3 style="color: #8b5cf6; margin: 0 0 15px 0; font-size: 18px;">📝 Détails de la mise à jour</h3>
                <p style="margin: 0; color: #334155; font-size: 16px; line-height: 1.6;">${updateMessage}</p>
              </div>
              <div style="background: #f8fafc; padding: 25px; border-radius: 10px; margin: 20px 0;">
                <h3 style="color: #0ea5e9; margin: 0 0 15px 0; font-size: 18px;">📅 Informations de l'événement</h3>
                <div style="margin-bottom: 15px;">
                  <p style="margin: 0; color: #94a3b8; font-size: 14px;">Date et heure</p>
                  <p style="margin: 5px 0 0 0; color: #334155; font-size: 16px; font-weight: bold;">${formattedDate}</p>
                </div>
                <div>
                  <p style="margin: 0; color: #94a3b8; font-size: 14px;">Lieu</p>
                  <p style="margin: 5px 0 0 0; color: #334155; font-size: 16px; font-weight: bold;">${eventLocation}</p>
                </div>
              </div>
              <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 20px 0 0 0;">
                À très bientôt !<br>
                <strong style="color: #0ea5e9;">L'équipe Business Events</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                Cet email a été envoyé automatiquement
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Email de mise à jour envoyé à:', to);
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur envoi email mise à jour:', error);
    return { success: false, error };
  }
}

export async function sendConfirmationEmailWithTicket(
  to: string,
  data: EmailData,
  ticketPdfBuffer?: Buffer
) {
  const htmlContent = generateConfirmationEmail(data);

  const mailOptions: any = {
    from: `"TAFF Events - No Reply" <${process.env.SMTP_USER}>`,
    to,
    subject: `🎫 Confirmation d'inscription - ${data.eventTitle}`,
    html: htmlContent,
  };

  // Ajouter le billet PDF en pièce jointe si fourni
  if (ticketPdfBuffer) {
    mailOptions.attachments = [
      {
        filename: `billet-${data.eventTitle.replace(/\s+/g, '-')}.pdf`,
        content: ticketPdfBuffer,
        contentType: 'application/pdf',
      },
    ];
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Email de confirmation avec billet envoyé à:', to);
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    return { success: false, error };
  }
}

interface NewRegistrationEmailParams {
  to: string;
  organizerName: string;
  attendeeName: string;
  attendeeEmail: string;
  eventTitle: string;
  eventDate: Date;
  eventId: string;
  currentAttendees: number;
  maxAttendees?: number | null;
}

export async function sendNewRegistrationEmail({
  to,
  organizerName,
  attendeeName,
  attendeeEmail,
  eventTitle,
  eventDate,
  eventId,
  currentAttendees,
  maxAttendees,
}: NewRegistrationEmailParams) {
  const formattedDate = new Date(eventDate).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const spotsInfo = maxAttendees
    ? `${currentAttendees}/${maxAttendees} places occupées`
    : `${currentAttendees} inscrit${currentAttendees > 1 ? 's' : ''}`;

  const mailOptions = {
    from: `"TAFF Events - No Reply" <${process.env.SMTP_USER}>`,
    to,
    subject: `🎉 Nouvelle inscription - ${eventTitle}`,
    html: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nouvelle inscription</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 32px;">🎉 Nouvelle inscription !</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="font-size: 18px; color: #334155; margin: 0 0 20px 0;">
                Bonjour <strong>${organizerName}</strong>,
              </p>
              <p style="font-size: 16px; color: #64748b; line-height: 1.6; margin: 0 0 30px 0;">
                Bonne nouvelle ! Un nouveau participant vient de s'inscrire à votre événement <strong style="color: #10b981;">${eventTitle}</strong>.
              </p>

              <!-- Participant info -->
              <div style="background: #f0fdf4; padding: 25px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #10b981;">
                <h3 style="color: #10b981; margin: 0 0 15px 0; font-size: 18px;">👤 Nouveau participant</h3>
                <div style="margin-bottom: 10px;">
                  <p style="margin: 0; color: #94a3b8; font-size: 14px;">Nom</p>
                  <p style="margin: 5px 0 0 0; color: #334155; font-size: 16px; font-weight: bold;">${attendeeName}</p>
                </div>
                <div>
                  <p style="margin: 0; color: #94a3b8; font-size: 14px;">Email</p>
                  <p style="margin: 5px 0 0 0; color: #334155; font-size: 16px;">
                    <a href="mailto:${attendeeEmail}" style="color: #10b981; text-decoration: none;">${attendeeEmail}</a>
                  </p>
                </div>
              </div>

              <!-- Event stats -->
              <div style="background: #f8fafc; padding: 25px; border-radius: 10px; margin: 20px 0;">
                <h3 style="color: #0ea5e9; margin: 0 0 15px 0; font-size: 18px;">📊 État de l'événement</h3>
                <div style="margin-bottom: 10px;">
                  <p style="margin: 0; color: #94a3b8; font-size: 14px;">Date</p>
                  <p style="margin: 5px 0 0 0; color: #334155; font-size: 16px; font-weight: bold;">${formattedDate}</p>
                </div>
                <div>
                  <p style="margin: 0; color: #94a3b8; font-size: 14px;">Inscriptions</p>
                  <p style="margin: 5px 0 0 0; color: #334155; font-size: 16px; font-weight: bold;">${spotsInfo}</p>
                </div>
              </div>

              <!-- CTA -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/events/${eventId}/participants"
                   style="display: inline-block; background: #10b981; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                  Voir les participants
                </a>
              </div>

              <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 20px 0 0 0;">
                Continuez à promouvoir votre événement !<br>
                <strong style="color: #0ea5e9;">L'équipe Business Events</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                Cet email a été envoyé automatiquement
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Email nouvelle inscription envoyé à:', to);
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur envoi email nouvelle inscription:', error);
    return { success: false, error };
  }
}

export async function sendEventCancelledEmail({
  to,
  eventTitle,
  reason,
  userName = 'Participant',
}: EventCancelledEmailParams) {
  const mailOptions = {
    from: `"TAFF Events - No Reply" <${process.env.SMTP_USER}>`,
    to,
    subject: `❌ Annulation - ${eventTitle}`,
    html: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Annulation d'événement</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 32px;">❌ Événement annulé</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="font-size: 18px; color: #334155; margin: 0 0 20px 0;">
                Bonjour <strong>${userName}</strong>,
              </p>
              <p style="font-size: 16px; color: #64748b; line-height: 1.6; margin: 0 0 30px 0;">
                Nous sommes désolés de vous informer que l'événement <strong style="color: #ef4444;">${eventTitle}</strong> a été annulé.
              </p>
              ${reason ? `
              <div style="background: #fef2f2; padding: 25px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #ef4444;">
                <h3 style="color: #ef4444; margin: 0 0 15px 0; font-size: 18px;">📝 Raison de l'annulation</h3>
                <p style="margin: 0; color: #334155; font-size: 16px; line-height: 1.6;">${reason}</p>
              </div>
              ` : ''}
              <div style="background: #dbeafe; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <p style="margin: 0; color: #1e40af; font-size: 14px;">
                  <strong>💡 Remboursement :</strong> Si vous avez effectué un paiement, vous serez remboursé automatiquement sous 5 à 7 jours ouvrés.
                </p>
              </div>
              <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 20px 0 0 0;">
                Nous nous excusons pour ce désagrément et espérons vous retrouver lors d'un prochain événement.<br><br>
                <strong style="color: #0ea5e9;">L'équipe Business Events</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                Cet email a été envoyé automatiquement
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Email d\'annulation envoyé à:', to);
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur envoi email annulation:', error);
    return { success: false, error };
  }
}
