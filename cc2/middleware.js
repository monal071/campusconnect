import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const publicPages = new Set(["/", "/login", "/signup", "/auth/signin", "/events", "/resources", "/jobs", "/posts", "/privacy", "/terms"]);
const publicReads = new Set(["/api/events", "/api/resources", "/api/jobs", "/api/posts"]);

export async function middleware(req) {
  const path = req.nextUrl.pathname;
  if (publicPages.has(path) || path.startsWith("/api/auth/") || path === "/api/uploadthing" ||
      (req.method === "GET" && publicReads.has(path))) {
    return NextResponse.next();
  }

  const isApi = path.startsWith("/api/");
  let token;
  try {
    token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  } catch {
    token = null;
  }
  if (!token) {
    if (isApi) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", path + req.nextUrl.search);
    return NextResponse.redirect(url);
  }
  if (!token.role && !path.startsWith("/profile")) {
    if (isApi) return NextResponse.json({ error: "Please complete your registration." }, { status: 403 });
    return NextResponse.redirect(new URL("/signup", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg$|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.ico$|sw\\.js$|offline\\.html$|manifest\\.json$).*)"],
};
