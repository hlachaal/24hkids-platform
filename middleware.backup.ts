import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/src/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected routes
  const protectedRoutes = [
    '/parent-dashboard',
    '/parent-dashboard/',
  ];

  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtected) {
    const session = await getSession();
    if (!session) {
      // Redirect to login page
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
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
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};