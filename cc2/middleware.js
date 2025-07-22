import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req) {
  const pathname = req.nextUrl.pathname;
  
  // Log the request for debugging
  console.log(`Middleware processing: ${pathname}`);
  
  // List of paths that don't require authentication
  const publicPaths = ['/login', '/signup', '/api/auth/authenticate'];
  
  // Routes that are available without login (landing page and auth related)
  if (
    publicPaths.includes(pathname) ||
    pathname === '/' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.includes('favicon') ||
    pathname.includes('.svg') ||
    pathname.startsWith('/signup') // Allow access to signup page
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
    
    // Check if user has completed registration
    const isRegistered = token.isRegistered !== false; // If undefined or true, consider registered
    
    // If user hasn't completed registration, redirect to signup
    if (!isRegistered && !pathname.startsWith('/signup')) {
      console.log(`User ${token.email} not fully registered. Redirecting to signup.`);
      const url = req.nextUrl.clone();
      url.pathname = "/signup";
      url.search = token.email ? `?email=${encodeURIComponent(token.email)}` : '';
      return NextResponse.redirect(url);
    }
    
    // No role-based restrictions - any authenticated user can access any page
    // We're relying on UI navigation controls to prevent normal users from accessing admin pages
    console.log(`Access granted to ${pathname} for role: ${userRole}`);
    
  } catch (error) {
    console.error('Middleware error:', error);
  }

  return NextResponse.next();
}