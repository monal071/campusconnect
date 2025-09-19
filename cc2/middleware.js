import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req) {
  const pathname = req.nextUrl.pathname;
  
  // Log the request for debugging
  console.log(`Middleware processing: ${pathname}`);
  
  // List of paths that don't require authentication
  const publicPaths = [
    '/login', 
    '/signup', 
    '/api/auth/authenticate',
    '/api/debug/session',  // Allow debug endpoints without auth
    '/api/migrate-user-roles'  // Allow migration during development
  ];
  
  // Routes that are available without login (landing page and auth related)
  if (
    publicPaths.includes(pathname) ||
    pathname === '/' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.includes('favicon') ||
    pathname.includes('.svg') ||
    pathname.includes('.png') ||
    pathname.includes('.jpg') ||
    pathname.includes('.jpeg') ||
    pathname.includes('.gif')
  ) {
    console.log(`Public path access: ${pathname}`);
    return NextResponse.next();
  }

  try {
    // Check authentication
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    // If not authenticated, redirect to login
    if (!token) {
      console.log(`Unauthenticated access to ${pathname}. Redirecting to login.`);
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    
    // Get user role from token
    const userRole = token.role || "user";
    console.log(`User with role '${userRole}' accessing: ${pathname}`);
    
    // No role-based restrictions - any authenticated user can access any page
    // We're relying on UI navigation controls to prevent normal users from accessing admin pages
    console.log(`Access granted to ${pathname} for role: ${userRole}`);
    
  } catch (error) {
    console.error('Middleware error:', error);
  }

  return NextResponse.next();
}