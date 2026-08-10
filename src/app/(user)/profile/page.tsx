import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import { Navbar } from "@/components/layout/navbar";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      username: true,
      email: true,
      avatarUrl: true,
      createdAt: true,
      lastLoginAt: true,
      _count: {
        select: { likes: true, wishlist: true, watchHistory: true, downloads: true },
      },
    },
  });

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar user={session.user} />
      <div className="pt-24 px-4 md:px-8 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Profile</h1>
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-primary/80 flex items-center justify-center text-3xl font-bold">
              {user.username[0]?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-semibold">{user.username}</h2>
              <p className="text-white/60">{user.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg bg-black/30 p-4">
              <p className="text-white/50">Joined</p>
              <p className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="rounded-lg bg-black/30 p-4">
              <p className="text-white/50">Last active</p>
              <p className="font-medium">
                {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "—"}
              </p>
            </div>
            <div className="rounded-lg bg-black/30 p-4">
              <p className="text-white/50">Likes</p>
              <p className="font-medium">{user._count.likes}</p>
            </div>
            <div className="rounded-lg bg-black/30 p-4">
              <p className="text-white/50">My List</p>
              <p className="font-medium">{user._count.wishlist}</p>
            </div>
            <div className="rounded-lg bg-black/30 p-4">
              <p className="text-white/50">Watch History</p>
              <p className="font-medium">{user._count.watchHistory}</p>
            </div>
            <div className="rounded-lg bg-black/30 p-4">
              <p className="text-white/50">Downloads</p>
              <p className="font-medium">{user._count.downloads}</p>
            </div>
          </div>
          <Link href="/settings">
            <Button variant="outline">Edit Settings</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
