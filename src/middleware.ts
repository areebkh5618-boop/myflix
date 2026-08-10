import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Never interfere with Auth.js API routes
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  const isAdminRoute =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

  const protectedUserPaths = [
    "/browse",
    "/movies",
    "/series",
    "/watch",
    "/my-list",
    "/history",
    "/likes",
    "/profile",
    "/settings",
    "/search",
    "/new",
    "/popular",
    "/movie",
  ];
  const isProtectedUser = protectedUserPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (isAdminRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/browse", req.url));
    }
    return NextResponse.next();
  }

  if (isProtectedUser && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    loginUrl.searchParams.set("message", "Please sign in to continue.");
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && (pathname === "/login" || pathname === "/signup")) {
    if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.redirect(new URL("/browse", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all paths except static assets and Next internals.
     * Still include pages we need to protect; api/auth is handled above.
     * Exclude the admin upload endpoint so large multipart bodies are not buffered by middleware.
     */
    "/((?!_next/static|_next/image|favicon.ico|api/admin/upload|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
