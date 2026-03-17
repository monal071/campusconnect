import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req) {
  const pathname = req.nextUrl.pathname;

  // Skip logging for static assets
  const shouldLog =
    !pathname.startsWith("/_next") &&
    !pathname.includes(".svg") &&
    !pathname.includes(".png");

  // Public pages (no auth required)
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
  ];

  // Public API routes
  const publicApiPaths = [
    "/api/events",
    "/api/resources",
    "/api/jobs",
    "/api/posts",
    "/api/dashboard/stats",
  ];

  // Allow public paths, auth routes, and static assets
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
    pathname.includes(".gif") ||
    pathname.includes(".ico")
  ) {
    return NextResponse.next();
  }

  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Not authenticated - redirect to login
    if (!token) {
      if (shouldLog) {
        console.log(
          `Unauthenticated access to ${pathname}. Redirecting to login.`,
        );
      }
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // User has no role - redirect to signup (except for signup & profile paths)
    const userRole = token?.role;
    if (
      !userRole &&
      pathname !== "/signup" &&
      !pathname.startsWith("/api/auth/") &&
      !pathname.startsWith("/profile")
    ) {
      const url = req.nextUrl.clone();
      url.pathname = "/signup";
      return NextResponse.redirect(url);
    }
  } catch (error) {
    console.error("Middleware error:", error);
  }

  return NextResponse.next();
}

// Only run middleware on specific paths (faster - skips static files automatically)
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.svg$|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.ico$|sw\\.js$|manifest\\.json$).*)",
  ],
};
