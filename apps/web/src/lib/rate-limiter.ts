interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '5');
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 minutes par défaut

export function checkRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
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
      resetTime: now + WINDOW_MS,
    });
    return { allowed: true };
  }

  if (currentEntry.count >= MAX_REQUESTS) {
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

// Nettoyer périodiquement les anciennes entrées
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Toutes les minutes
