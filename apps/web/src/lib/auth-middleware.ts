import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromHeader } from './jwt';
import { securityLogger, SecurityEventType } from './security-logger';

export interface AuthenticatedRequest extends NextRequest {
    user?: {
        userId: string;
        email: string;
        role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
    };
}

export function getClientIp(request: NextRequest): string {
    return request.headers.get('x-forwarded-for')?.split(',')[0] ||
        request.headers.get('x-real-ip') ||
        'unknown';
}

export async function requireAuth(
    request: NextRequest,
    allowedRoles?: ('USER' | 'ADMIN' | 'SUPER_ADMIN')[]
): Promise<{ user: any; error?: never } | { error: NextResponse; user?: never }> {
    const authHeader = request.headers.get('authorization');
    const token = getTokenFromHeader(authHeader);

    if (!token) {
        securityLogger.log({
            eventType: SecurityEventType.UNAUTHORIZED_ACCESS,
            ip: getClientIp(request),
            userAgent: request.headers.get('user-agent') || undefined,
            details: 'Missing token',
        });

        return {
            error: NextResponse.json(
                { error: 'Token manquant' },
                { status: 401 }
            ),
        };
    }

    const payload = verifyToken(token);

    if (!payload) {
        securityLogger.log({
            eventType: SecurityEventType.INVALID_TOKEN,
            ip: getClientIp(request),
            userAgent: request.headers.get('user-agent') || undefined,
            details: 'Invalid or expired token',
        });

        return {
            error: NextResponse.json(
                { error: 'Token invalide ou expiré' },
                { status: 401 }
            ),
        };
    }

    // Vérifier les rôles autorisés
    if (allowedRoles && !allowedRoles.includes(payload.role)) {
        securityLogger.log({
            eventType: SecurityEventType.UNAUTHORIZED_ACCESS,
            userId: payload.userId,
            email: payload.email,
            ip: getClientIp(request),
            userAgent: request.headers.get('user-agent') || undefined,
            details: `Required roles: ${allowedRoles.join(', ')}, User role: ${payload.role}`,
        });

        return {
            error: NextResponse.json(
                { error: 'Accès non autorisé' },
                { status: 403 }
            ),
        };
    }

    return { user: payload };
}
