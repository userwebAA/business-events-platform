import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Vérifie si un JWT est encore valide en décodant le payload (sans vérifier la signature côté Edge)
function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload.exp) return true;
    // Expiration en secondes, Date.now() en ms
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  const { pathname, searchParams } = request.nextUrl;

  // Routes publiques accessibles sans authentification
  const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/profile', '/events', '/privacy'];
  const isPublicRoute = publicRoutes.some(route =>
    route === '/' ? pathname === '/' : pathname.startsWith(route)
  );

  // Vérifier si le token est valide (non expiré)
  const hasValidToken = token && !isTokenExpired(token);

  // Si token expiré, le supprimer du cookie
  if (token && !hasValidToken) {
    const response = isPublicRoute
      ? NextResponse.next()
      : NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set('token', '', { path: '/', maxAge: 0 });
    return response;
  }

  // Si pas de token valide et route non publique : rediriger vers login
  if (!hasValidToken && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Si token valide et utilisateur sur page login/register : rediriger vers dashboard
  if (hasValidToken) {
    const authPages = ['/login', '/register', '/forgot-password'];
    const isAuthPage = authPages.some(route => pathname.startsWith(route));
    if (isAuthPage) {
      const redirectTo = searchParams.get('redirect') || '/dashboard';
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, manifest.json, sw.js (static files)
     * - any file with extension (images, fonts, etc.)
     */
    '/((?!api|_next|manifest.json|sw.js|favicon.ico|icons|.*\\..*).*)',
  ],
};
