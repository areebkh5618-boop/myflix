"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { signOut, useSession } from "next-auth/react";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setUsername(session.user.name || "");
      setEmail(session.user.email || "");
    }
  }, [session]);

  if (!session?.user) {
    return null; // middleware will redirect
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to update");
        return;
      }
      toast.success("Profile updated");
      await update({ name: username });
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed");
        return;
      }
      toast.success("Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar user={session.user} />
      <div className="pt-24 px-4 md:px-8 max-w-xl mx-auto space-y-10">
        <h1 className="text-3xl font-bold">Settings</h1>

        <form onSubmit={saveProfile} className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">Profile</h2>
          <div>
            <label className="text-sm text-white/60">Username</label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-sm text-white/60">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
          </div>
          <Button type="submit" disabled={loading}>Save Profile</Button>
        </form>

        <form onSubmit={changePassword} className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">Change Password</h2>
          <div>
            <label className="text-sm text-white/60">Current Password</label>
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="mt-1" required />
          </div>
          <div>
            <label className="text-sm text-white/60">New Password</label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1" required minLength={8} />
          </div>
          <div>
            <label className="text-sm text-white/60">Confirm New Password</label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1" required />
          </div>
          <Button type="submit" disabled={loading}>Update Password</Button>
        </form>

        <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-3">
          <h2 className="text-lg font-semibold">Session</h2>
          <Button variant="outline" onClick={() => signOut({ callbackUrl: "/" })}>
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
