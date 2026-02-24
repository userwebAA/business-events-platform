import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { signToken } from '@/lib/jwt';
import { validateEmail, validatePassword, validateName, sanitizeInput } from '@/lib/validation';
import { checkRateLimit } from '@/lib/rate-limiter';
import { securityLogger, SecurityEventType } from '@/lib/security-logger';
import { getClientIp } from '@/lib/auth-middleware';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10');

export async function POST(request: NextRequest) {
    const ip = getClientIp(request);
    const userAgent = request.headers.get('user-agent') || undefined;

    try {
        const { email, password, name } = await request.json();

        // Validation des entrées
        if (!email || !password || !name) {
            return NextResponse.json(
                { error: 'Email, mot de passe et nom requis' },
                { status: 400 }
            );
        }

        // Valider l'email
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
            return NextResponse.json(
                { error: emailValidation.errors.join(', ') },
                { status: 400 }
            );
        }

        // Valider le mot de passe
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            return NextResponse.json(
                { error: passwordValidation.errors.join(', ') },
                { status: 400 }
            );
        }

        // Valider le nom
        const nameValidation = validateName(name);
        if (!nameValidation.isValid) {
            return NextResponse.json(
                { error: nameValidation.errors.join(', ') },
                { status: 400 }
            );
        }

        // Rate limiting par IP
        const rateLimitResult = checkRateLimit(`register:${ip}`);
        if (!rateLimitResult.allowed) {
            securityLogger.log({
                eventType: SecurityEventType.RATE_LIMIT_EXCEEDED,
                email,
                ip,
                userAgent,
                details: `Registration rate limit exceeded`,
            });

            return NextResponse.json(
                {
                    error: `Trop de tentatives. Réessayez dans ${rateLimitResult.retryAfter} secondes.`,
                },
                {
                    status: 429,
                    headers: {
                        'Retry-After': rateLimitResult.retryAfter?.toString() || '900',
                    },
                }
            );
        }

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (existingUser) {
            securityLogger.log({
                eventType: SecurityEventType.REGISTER_FAILED,
                email,
                ip,
                userAgent,
                details: 'Email already exists',
            });

            return NextResponse.json(
                { error: 'Cet email est déjà utilisé' },
                { status: 409 }
            );
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

        // Sanitiser le nom
        const sanitizedName = sanitizeInput(name);

        // Créer l'utilisateur
        const user = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                password: hashedPassword,
                name: sanitizedName,
                role: 'USER',
            },
        });

        // Générer le token JWT
        const token = signToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        // Log succès
        securityLogger.log({
            eventType: SecurityEventType.REGISTER_SUCCESS,
            userId: user.id,
            email: user.email,
            ip,
            userAgent,
        });

        // Retourner l'utilisateur et le token (sans le mot de passe)
        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            token,
        });
    } catch (error) {
        console.error('Register error:', error);
        securityLogger.log({
            eventType: SecurityEventType.REGISTER_FAILED,
            ip,
            userAgent,
            details: `Server error: ${error instanceof Error ? error.message : 'Unknown'}`,
        });

        return NextResponse.json(
            { error: 'Erreur lors de la création du compte' },
            { status: 500 }
        );
    }
}
