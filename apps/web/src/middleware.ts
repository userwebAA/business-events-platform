import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/jwt';

export function middleware(request: NextRequest) {
  const cookieToken = request.cookies.get('token')?.value;
  const token = cookieToken || request.headers.get('authorization')?.replace('Bearer ', '');

  const { pathname, searchParams } = request.nextUrl;

  // Routes publiques accessibles sans authentification
  const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/profile', '/events', '/privacy'];
  const isPublicRoute = publicRoutes.some(route =>
    route === '/' ? pathname === '/' : pathname.startsWith(route)
  );

  // Si token existe, vérifier sa validité
  if (token) {
    const decoded = verifyToken(token);

    // Token invalide/expiré : nettoyer le cookie
    if (!decoded) {
      const response = NextResponse.next();
      response.cookies.delete('token');
      // Si route non publique, rediriger vers login
      if (!isPublicRoute) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
      return response;
    }

    // Token valide : si sur page auth, rediriger vers dashboard
    const authPages = ['/login', '/register', '/forgot-password'];
    const isAuthPage = authPages.some(route => pathname.startsWith(route));
    if (isAuthPage) {
      const redirectTo = searchParams.get('redirect') || '/dashboard';
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }

    // Token valide mais pas dans le cookie (seulement dans header) : synchroniser
    if (!cookieToken) {
      const response = NextResponse.next();
      response.cookies.set('token', token, { path: '/', maxAge: 60 * 60 * 24 * 7 });
      return response;
    }

    return NextResponse.next();
  }

  // Pas de token et route non publique : rediriger vers login
  if (!isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
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
