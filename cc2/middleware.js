import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req) {
  const pathname = req.nextUrl.pathname;

  // Only log non-static assets and API routes for debugging
  const shouldLog =
    !pathname.startsWith("/_next") &&
    !pathname.includes(".svg") &&
    !pathname.includes(".png");
  if (shouldLog) {
    console.log(`Middleware processing: ${pathname}`);
  }

  // List of paths that don't require authentication
  const publicPaths = [
    "/login",
    "/signup",
    "/dashboard",
    "/events",
    "/resources",
    "/jobs",
    "/posts",
    "/connections",
    "/quiz",
    "/api/auth/authenticate",
    "/api/debug/session",
    "/api/migrate-user-roles",
  ];

  // Public API routes that should be accessible without authentication
  const publicApiPaths = [
    "/api/events",
    "/api/resources",
    "/api/jobs",
    "/api/posts",
    "/api/dashboard/stats",
    "/api/notifications",
    "/api/connection-requests",
    "/api/connections",
    "/api/chat/unread-count",
  ];

  // Routes that are available without login (landing page and auth related)
  if (
    publicPaths.includes(pathname) ||
    publicApiPaths.includes(pathname) ||
    pathname === "/" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.includes("favicon") ||
    pathname.includes(".svg") ||
    pathname.includes(".png") ||
    pathname.includes(".jpg") ||
    pathname.includes(".jpeg") ||
    pathname.includes(".gif")
  ) {
    if (shouldLog) {
      console.log(`Public path access: ${pathname}`);
    }
    return NextResponse.next();
  }

  try {
    // Check authentication
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Check for guest access
    const guestCookie = req.cookies.get("guest");
    const hasGuestAccess = guestCookie?.value === "true";

    // If not authenticated and not guest access, redirect to login
    if (!token && !hasGuestAccess) {
      if (shouldLog) {
        console.log(
          `Unauthenticated access to ${pathname}. Redirecting to login.`
        );
      }
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // Get user role from token
    const userRole = token?.role;
    if (shouldLog) {
      console.log(`User with role '${userRole}' accessing: ${pathname}`);
    }

    // If user doesn't have a role, redirect to signup to complete registration
    // Allow access to signup and auth API routes
    if (!userRole && pathname !== "/signup" && !pathname.startsWith("/api/auth/")) {
      console.log(`User without role accessing ${pathname}. Redirecting to signup.`);
      const url = req.nextUrl.clone();
      url.pathname = "/signup";
      return NextResponse.redirect(url);
    }

    // No role-based restrictions - any authenticated user can access any page
    // We're relying on UI navigation controls to prevent normal users from accessing admin pages
  } catch (error) {
    console.error("Middleware error:", error);
  }

  return NextResponse.next();
}
