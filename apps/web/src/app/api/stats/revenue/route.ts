import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-middleware';
import { securityLogger, SecurityEventType } from '@/lib/security-logger';

export async function GET(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est authentifié (tous les rôles)
    const authResult = await requireAuth(request);

    if (authResult.error) {
      return authResult.error;
    }

    const isAdmin = authResult.user.role === 'ADMIN' || authResult.user.role === 'SUPER_ADMIN';

    // Logger l'accès aux recettes
    securityLogger.log({
      eventType: SecurityEventType.REVENUE_ACCESS,
      userId: authResult.user.userId,
      email: authResult.user.email,
      ip: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
      userAgent: request.headers.get('user-agent') || undefined,
      details: 'User accessed revenue statistics',
    });

    // Admins voient tout, utilisateurs classiques voient leurs propres événements
    const where: any = {};
    if (!isAdmin) {
      where.organizerId = authResult.user.userId;
    }

    const events = await prisma.event.findMany({
      where,
      select: {
        id: true,
        type: true,
        price: true,
        currentAttendees: true,
      },
    });

    // Calculer les recettes
    const totalRevenue = events
      .filter(e => e.type === 'paid')
      .reduce((sum, e) => sum + (e.price || 0) * e.currentAttendees, 0);

    const paidEvents = events.filter(e => e.type === 'paid').length;

    return NextResponse.json({
      totalRevenue,
      paidEvents,
      accessedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Revenue stats error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des revenus' },
      { status: 500 }
    );
  }
}
