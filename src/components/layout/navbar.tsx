"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Search, Bell, User, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { signOut } from "next-auth/react";

interface NavbarProps {
  user?: { name?: string | null; role?: string; image?: string | null } | null;
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = user?.role === "ADMIN";

  const links = user
    ? [
        { href: "/browse", label: "Home" },
        { href: "/movies", label: "Movies" },
        { href: "/series", label: "Series" },
        { href: "/new", label: "New & Popular" },
        { href: "/my-list", label: "My List" },
      ]
    : [
        { href: "/", label: "Home" },
      ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/90 to-transparent">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
        <div className="flex items-center gap-8">
          <Link href={user ? "/browse" : "/"} className="text-2xl font-bold tracking-tight text-primary">
            MYFLIX
          </Link>
          <div className="hidden md:flex items-center gap-6">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "text-sm font-medium transition hover:text-white",
                  pathname === l.href || pathname.startsWith(l.href + "/")
                    ? "text-white"
                    : "text-white/70"
                )}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/search" className="text-white/80 hover:text-white">
                <Search className="h-5 w-5" />
              </Link>
              {isAdmin && (
                <Link href="/admin" className="text-sm text-white/70 hover:text-white">
                  Admin
                </Link>
              )}
              <Link href="/profile" className="flex items-center gap-2 text-white/80 hover:text-white">
                <div className="h-8 w-8 rounded bg-primary/80 flex items-center justify-center text-sm font-bold">
                  {user.name?.[0]?.toUpperCase() || "U"}
                </div>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-white/70 hover:text-white"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-white/80 hover:text-white">
                Sign In
              </Link>
              <Link
                href="/signup"
                className="rounded bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
              >
                Sign Up
              </Link>
            </>
          )}
          <button className="md:hidden text-white" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="md:hidden bg-black/95 px-4 py-4 space-y-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block text-white/80 hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
