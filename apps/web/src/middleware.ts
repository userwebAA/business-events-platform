import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/jwt';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '');

  const { pathname, searchParams } = request.nextUrl;

  // Routes publiques accessibles sans authentification
  const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/profile', '/events', '/privacy'];
  const isPublicRoute = publicRoutes.some(route =>
    route === '/' ? pathname === '/' : pathname.startsWith(route)
  );

  // Si pas de token et route non publique, rediriger vers login
  if (!token && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Si token existe et utilisateur sur page login/register, rediriger vers dashboard
  const authPages = ['/login', '/register', '/forgot-password'];
  const isAuthPage = authPages.some(route => pathname.startsWith(route));
  if (token && isAuthPage) {
    const decoded = verifyToken(token);
    if (decoded) {
      // Respecter le paramètre redirect s'il existe
      const redirectTo = searchParams.get('redirect') || '/dashboard';
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
    // Token invalide ou expiré : supprimer le cookie et laisser passer
    const response = NextResponse.next();
    response.cookies.delete('token');
    return response;
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
