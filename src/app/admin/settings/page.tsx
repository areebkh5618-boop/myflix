"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
      setUsername(session.user.name ?? "");
      setEmail(session.user.email ?? "");
    }
  }, [session]);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message ?? "Failed to update profile");
        return;
      }

      toast.success("Profile updated");

      await update({
        name: username,
        email,
      });
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Unable to update profile");
    } finally {
      setLoading(false);
    }
  }

  async function changePassword(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/auth/change-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
            confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message ?? "Failed to update password");
        return;
      }

      toast.success("Password updated");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Password update error:", error);
      toast.error("Unable to update password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">
          Settings
        </h1>

        <p className="mt-1 text-white/60">
          Admin account and platform settings
        </p>
      </div>

      <form
        onSubmit={saveProfile}
        className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-6"
      >
        <h2 className="text-lg font-semibold text-white">
          Admin Profile
        </h2>

        <div>
          <label
            htmlFor="username"
            className="text-sm text-white/60"
          >
            Username
          </label>

          <Input
            id="username"
            value={username}
            onChange={(event) =>
              setUsername(event.target.value)
            }
            className="mt-1"
            required
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="text-sm text-white/60"
          >
            Email
          </label>

          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            className="mt-1"
            required
          />
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Profile"}
        </Button>
      </form>

      <form
        onSubmit={changePassword}
        className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-6"
      >
        <h2 className="text-lg font-semibold text-white">
          Change Password
        </h2>

        <div>
          <label
            htmlFor="current-password"
            className="text-sm text-white/60"
          >
            Current Password
          </label>

          <Input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(event) =>
              setCurrentPassword(event.target.value)
            }
            className="mt-1"
            required
          />
        </div>

        <div>
          <label
            htmlFor="new-password"
            className="text-sm text-white/60"
          >
            New Password
          </label>

          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(event) =>
              setNewPassword(event.target.value)
            }
            className="mt-1"
            required
            minLength={8}
          />
        </div>

        <div>
          <label
            htmlFor="confirm-password"
            className="text-sm text-white/60"
          >
            Confirm Password
          </label>

          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(event.target.value)
            }
            className="mt-1"
            required
            minLength={8}
          />
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Updating..." : "Update Password"}
        </Button>
      </form>

      <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
        <h2 className="text-lg font-semibold text-white">
          Platform
        </h2>

        <p>
          Site name:{" "}
          <span className="text-white">MyFlix</span>
        </p>

        <p>
          Add movies via{" "}
          <Link
            href="/admin/movies/new"
            className="text-primary hover:underline"
          >
            Movies → Add
          </Link>
        </p>

        <p>
          Add series via{" "}
          <Link
            href="/admin/series/new"
            className="text-primary hover:underline"
          >
            Series → Add
          </Link>
        </p>

        <p>
          Upload files via{" "}
          <Link
            href="/admin/uploads"
            className="text-primary hover:underline"
          >
            Uploads
          </Link>
        </p>
      </div>
    </div>
  );
}