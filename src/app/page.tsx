import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) {
    if (session.user.role === "ADMIN") redirect("/admin");
    redirect("/browse");
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <section className="relative flex min-h-screen items-center justify-center">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />
        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Unlimited movies, series, and more.
          </h1>
          <p className="text-lg md:text-xl text-white/80">
            Watch anywhere. Completely free. No subscriptions.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/signup">
              <Button size="lg">Get Started Free</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">Sign In</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
