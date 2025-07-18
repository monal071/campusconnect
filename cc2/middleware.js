import { NextResponse } from 'next/server';

export async function middleware(req) {
  // List of paths that don't require authentication
  const publicPaths = ['/login', '/signup', '/home', '/api/auth/authenticate'];

  if (
    publicPaths.includes(req.nextUrl.pathname) ||
    req.nextUrl.pathname.startsWith('/api/auth') ||
    req.nextUrl.pathname.startsWith('/_next')
  ) {
    return NextResponse.next();
  }

  // Let NextAuth handle authentication, just redirect to /login if not authenticated
  // (You may want to add more sophisticated logic here if needed)
  const sessionCookie = req.cookies.get('next-auth.session-token') || req.cookies.get('__Secure-next-auth.session-token');
  if (!sessionCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}