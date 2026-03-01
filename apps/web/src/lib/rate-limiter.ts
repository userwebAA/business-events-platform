import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '5');
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 minutes par défaut

export function checkRateLimit(
  identifier: string,
  maxRequests: number = MAX_REQUESTS,
  windowMs: number = WINDOW_MS
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // Nettoyer les anciennes entrées
  if (entry && now > entry.resetTime) {
    rateLimitStore.delete(identifier);
  }

  const currentEntry = rateLimitStore.get(identifier);

  if (!currentEntry) {
    // Première requête
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { allowed: true };
  }

  if (currentEntry.count >= maxRequests) {
    // Limite atteinte
    const retryAfter = Math.ceil((currentEntry.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Incrémenter le compteur
  currentEntry.count++;
  return { allowed: true };
}

export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

// Helper pour extraire l'IP client
function getIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}

// Helper prêt à l'emploi : retourne null si OK, ou une NextResponse 429 si limité
export function applyRateLimit(
  request: NextRequest,
  routeKey: string,
  maxRequests: number = MAX_REQUESTS,
  windowMs: number = WINDOW_MS
): NextResponse | null {
  const ip = getIp(request);
  const result = checkRateLimit(`${routeKey}:${ip}`, maxRequests, windowMs);
  if (!result.allowed) {
    return NextResponse.json(
      { error: `Trop de requêtes. Réessayez dans ${result.retryAfter} secondes.` },
      { status: 429, headers: { 'Retry-After': result.retryAfter?.toString() || '60' } }
    );
  }
  return null;
}

// Nettoyer périodiquement les anciennes entrées
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Toutes les minutes
