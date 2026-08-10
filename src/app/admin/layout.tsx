import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Film,
  Tv,
  Users,
  BarChart3,
  Settings,
  Upload,
  LogOut,
} from "lucide-react";
import { signOut } from "@/lib/auth";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/movies", label: "Movies", icon: Film },
  { href: "/admin/series", label: "Series", icon: Tv },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/uploads", label: "Uploads", icon: Upload },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/browse");
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex">
      <aside className="w-64 border-r border-white/10 bg-black/50 p-4 flex flex-col">
        <Link href="/admin" className="text-xl font-bold text-primary mb-8 px-2">
          MYFLIX Admin
        </Link>
        <nav className="flex-1 space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition"
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 pt-4 space-y-2">
          <Link href="/browse" className="block text-sm text-white/50 hover:text-white px-3">
            ← Back to App
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button type="submit" className="flex items-center gap-2 text-sm text-white/50 hover:text-white px-3">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6 md:p-8">{children}</main>
    </div>
  );
}
