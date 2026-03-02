import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/jwt';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '');

  const { pathname } = request.nextUrl;

  // Routes de profil setup (accessibles seulement avec token, pas publiques)
  const isProfileSetup = pathname.startsWith('/profile/setup');

  // Routes publiques accessibles sans authentification
  const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/profile', '/events', '/privacy'];
  const isPublicRoute = !isProfileSetup && publicRoutes.some(route =>
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
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Token invalide ou expiré : supprimer le cookie et laisser passer
    const response = NextResponse.next();
    response.cookies.delete('token');
    return response;
  }

  // Vérifier si le profil est complété pour les routes protégées (sauf /profile/setup)
  if (token && !isPublicRoute && !isProfileSetup) {
    try {
      const decoded = verifyToken(token);
      if (decoded) {
        // Faire un appel à l'API pour vérifier profileCompleted
        const apiUrl = new URL('/api/auth/me', request.url);
        const meResponse = await fetch(apiUrl.toString(), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (meResponse.ok) {
          const data = await meResponse.json();
          // Si le profil n'est pas complété, rediriger vers /profile/setup
          if (!data.user.profileCompleted) {
            return NextResponse.redirect(new URL('/profile/setup', request.url));
          }
        }
      }
    } catch (error) {
      console.error('Middleware error:', error);
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
