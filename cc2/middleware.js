import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req) {
  // Get the token
  let token;
  try {
    token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  } catch (e) {
    console.error('Error getting token:', e);
  }
  
  // Simple check - if user is admin and not on admin page, redirect to admin
  if (token?.role === 'admin' && 
      !req.nextUrl.pathname.startsWith('/admin') && 
      !req.nextUrl.pathname.startsWith('/_next') && 
      !req.nextUrl.pathname.includes('favicon') && 
      !req.nextUrl.pathname.includes('.svg') && 
      !req.nextUrl.pathname.startsWith('/api/')) {
    console.log(`Admin accessing: ${req.nextUrl.pathname}. Redirecting to admin.`);
    const url = req.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }
  
  // List of paths that don't require authentication
  const publicPaths = ['/login', '/signup', '/api/auth/authenticate'];
  
  // Routes that are available without login (landing page and auth related)
  if (
    publicPaths.includes(req.nextUrl.pathname) ||
    req.nextUrl.pathname === '/' ||
    req.nextUrl.pathname.startsWith('/api/auth') ||
    req.nextUrl.pathname.startsWith('/_next') ||
    req.nextUrl.pathname.includes('favicon') ||
    req.nextUrl.pathname.includes('.svg')
  ) {
    return NextResponse.next();
  }

  try {
    // If not authenticated, redirect to login
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    
    // Get user role from token
    const userRole = token.role || "user";
    
    // Admin-only paths - restrict to admin users
    if (req.nextUrl.pathname.startsWith('/admin') && userRole !== 'admin') {
      console.log('Non-admin trying to access admin page. Redirecting to home.');
      const url = req.nextUrl.clone();
      url.pathname = "/home";
      return NextResponse.redirect(url);
    }
    
  } catch (error) {
    console.error('Middleware error:', error);
  }

  return NextResponse.next();
}