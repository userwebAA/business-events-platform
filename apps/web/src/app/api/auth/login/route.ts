import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { signToken } from '@/lib/jwt';
import { validateEmail } from '@/lib/validation';
import { checkRateLimit } from '@/lib/rate-limiter';
import { securityLogger, SecurityEventType } from '@/lib/security-logger';
import { getClientIp } from '@/lib/auth-middleware';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    const ip = getClientIp(request);
    const userAgent = request.headers.get('user-agent') || undefined;

    try {
        const { email, password } = await request.json();

        // Validation des entrées
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email et mot de passe requis' },
                { status: 400 }
            );
        }

        // Valider l'email
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
            return NextResponse.json(
                { error: emailValidation.errors[0] },
                { status: 400 }
            );
        }

        // Rate limiting par IP
        const rateLimitResult = checkRateLimit(`login:${ip}`);
        if (!rateLimitResult.allowed) {
            securityLogger.log({
                eventType: SecurityEventType.RATE_LIMIT_EXCEEDED,
                email,
                ip,
                userAgent,
                details: `Retry after ${rateLimitResult.retryAfter} seconds`,
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

        // Trouver l'utilisateur
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user) {
            securityLogger.log({
                eventType: SecurityEventType.LOGIN_FAILED,
                email,
                ip,
                userAgent,
                details: 'User not found',
            });

            return NextResponse.json(
                { error: 'Email ou mot de passe incorrect' },
                { status: 401 }
            );
        }

        // Vérifier le mot de passe
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            securityLogger.log({
                eventType: SecurityEventType.LOGIN_FAILED,
                userId: user.id,
                email,
                ip,
                userAgent,
                details: 'Invalid password',
            });

            return NextResponse.json(
                { error: 'Email ou mot de passe incorrect' },
                { status: 401 }
            );
        }

        // Générer le token JWT
        const token = signToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        // Log succès
        securityLogger.log({
            eventType: SecurityEventType.LOGIN_SUCCESS,
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
        console.error('Login error:', error);
        securityLogger.log({
            eventType: SecurityEventType.LOGIN_FAILED,
            ip,
            userAgent,
            details: `Server error: ${error instanceof Error ? error.message : 'Unknown'}`,
        });

        return NextResponse.json(
            { error: 'Erreur lors de la connexion' },
            { status: 500 }
        );
    }
}
