import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import authConfig from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const isLoggedIn = Boolean(req.auth);
  const role = req.auth?.user?.role;

  const isAdminRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin");

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

  const isProtectedUser =
    protectedUserPaths.some(
      (path) =>
        pathname === path ||
        pathname.startsWith(`${path}/`)
    );

  if (isAdminRoute) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", req.url);

      loginUrl.searchParams.set(
        "callbackUrl",
        pathname
      );

      return NextResponse.redirect(loginUrl);
    }

    if (role !== "ADMIN") {
      return NextResponse.redirect(
        new URL("/browse", req.url)
      );
    }

    return NextResponse.next();
  }

  if (isProtectedUser && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url);

    loginUrl.searchParams.set(
      "callbackUrl",
      pathname
    );

    loginUrl.searchParams.set(
      "message",
      "Please sign in to continue."
    );

    return NextResponse.redirect(loginUrl);
  }

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/register";

  if (isLoggedIn && isAuthPage) {
    if (role === "ADMIN") {
      return NextResponse.redirect(
        new URL("/admin", req.url)
      );
    }

    return NextResponse.redirect(
      new URL("/browse", req.url)
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/admin/upload|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};