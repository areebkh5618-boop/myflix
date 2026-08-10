"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

export default function AdminSettingsPage() {
  const { data: session, update } = useSession();
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
        toast.error(data.message || "Failed");
        return;
      }
      toast.success("Profile updated");
      await update({ name: username });
    } catch {
      toast.error("Error");
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
      toast.error("Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl space-y-10">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-white/60 mt-1">Admin account & platform settings</p>
      </div>

      <form onSubmit={saveProfile} className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Admin Profile</h2>
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
          <label className="text-sm text-white/60">Confirm Password</label>
          <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1" required />
        </div>
        <Button type="submit" disabled={loading}>Update Password</Button>
      </form>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-2 text-sm text-white/60">
        <h2 className="text-lg font-semibold text-white">Platform</h2>
        <p>Site name: <span className="text-white">MyFlix</span></p>
        <p>Add movies via <a href="/admin/movies/new" className="text-primary">Movies → Add</a></p>
        <p>Add series via <a href="/admin/series/new" className="text-primary">Series → Add</a></p>
        <p>Upload files via <a href="/admin/uploads" className="text-primary">Uploads</a></p>
      </div>
    </div>
  );
}
