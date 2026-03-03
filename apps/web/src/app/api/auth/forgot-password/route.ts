import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { transporter } from '@/lib/email';
import crypto from 'crypto';
import { applyRateLimit } from '@/lib/rate-limiter';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10');

function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const specialChars = '!@#$%&*';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
  // Shuffle
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

export async function POST(request: NextRequest) {
  // Rate limiting: 3 req / 15 min
  const rateLimited = applyRateLimit(request, 'forgot-password', 3, 900000);
  if (rateLimited) return rateLimited;

  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ message: 'Si un compte existe avec cet email, un nouveau mot de passe a été envoyé.' });
    }

    const tempPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    await transporter.sendMail({
      from: `"TAFF Events - No Reply" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: '🔐 Réinitialisation de votre mot de passe - TAFF Events',
      html: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Réinitialisation mot de passe</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Nouveau mot de passe</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="font-size: 18px; color: #334155; margin: 0 0 20px 0;">
                Bonjour <strong>${user.name || 'Utilisateur'}</strong>,
              </p>
              <p style="font-size: 16px; color: #64748b; line-height: 1.6; margin: 0 0 30px 0;">
                Vous avez demandé la réinitialisation de votre mot de passe. Voici votre nouveau mot de passe temporaire :
              </p>
              
              <div style="background: #fef3c7; padding: 25px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #f59e0b; text-align: center;">
                <p style="margin: 0 0 10px 0; color: #92400e; font-size: 14px; font-weight: bold;">Votre mot de passe temporaire</p>
                <p style="margin: 0; color: #1e293b; font-size: 28px; font-weight: bold; letter-spacing: 3px; font-family: 'Courier New', monospace;">${tempPassword}</p>
              </div>

              <div style="background: #fef2f2; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #ef4444;">
                <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.6;">
                  <strong>⚠️ Important :</strong><br>
                  Ce mot de passe est temporaire. Nous vous recommandons fortement de le modifier dès votre prochaine connexion dans <strong>Paramètres → Sécurité</strong>.
                </p>
              </div>

              <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 20px 0 0 0;">
                Si vous n'avez pas demandé cette réinitialisation, veuillez sécuriser votre compte immédiatement.<br><br>
                <strong style="color: #0ea5e9;">L'équipe TAFF Events</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                Cet email a été envoyé automatiquement. Ne partagez jamais votre mot de passe.
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
      text: `Bonjour ${user.name || 'Utilisateur'},\n\nVotre nouveau mot de passe temporaire est : ${tempPassword}\n\nVeuillez le modifier dès votre prochaine connexion dans Paramètres → Sécurité.\n\nL'équipe TAFF Events`,
    });

    console.log('✅ Email mot de passe temporaire envoyé à:', user.email);

    return NextResponse.json({ message: 'Si un compte existe avec cet email, un nouveau mot de passe a été envoyé.' });
  } catch (error) {
    console.error('❌ Erreur réinitialisation mot de passe:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
