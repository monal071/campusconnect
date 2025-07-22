import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req) {
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
    // Check authentication
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    // If not authenticated, redirect to login
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    
    // Get user role from token
    const userRole = token.role || "user";
    
    // Role-based access control
    // 1. Admin-only paths - restrict to admin users
    if (req.nextUrl.pathname.startsWith('/admin') && userRole !== 'admin') {
      console.log('Non-admin trying to access admin page. Redirecting to home.');
      const url = req.nextUrl.clone();
      url.pathname = "/home";
      return NextResponse.redirect(url);
    }
    
    // 2. User-only paths - admins should not access these
    const userOnlyPaths = ['/home', '/dashboard', '/events', '/resources', '/jobs', '/posts', '/connections'];
    if (userRole === 'admin' && userOnlyPaths.some(path => req.nextUrl.pathname === path || 
        req.nextUrl.pathname.startsWith(`${path}/`))) {
      console.log('Admin trying to access user page. Redirecting to admin.');
      const url = req.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
    
  } catch (error) {
    console.error('Middleware error:', error);
  }

  return NextResponse.next();
}