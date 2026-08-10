"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload } from "lucide-react";

export default function NewMoviePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    releaseYear: new Date().getFullYear(),
    duration: 120,
    videoUrl: "",
    posterUrl: "",
    backdropUrl: "",
    status: "PUBLISHED",
    allowDownload: false,
    isFeatured: false,
  });

  function update(key: string, value: any) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function formatValidationMessage(errors: any) {
    const fieldErrors = errors?.fieldErrors;
    if (!fieldErrors) return null;

    const messages = Object.values(fieldErrors).flat().filter(Boolean) as string[];
    return messages.length ? messages[0] : null;
  }

  async function uploadFile(file: File, field: "posterUrl" | "backdropUrl" | "videoUrl") {
    setUploading(field);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Upload failed");
        return;
      }
      update(field, data.data.url);
      toast.success("Uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(null);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          cast: [],
          releaseYear: form.releaseYear === "" ? null : Number(form.releaseYear),
          duration: form.duration === "" ? null : Number(form.duration),
          videoUrl: form.videoUrl || null,
          posterUrl: form.posterUrl || null,
          backdropUrl: form.backdropUrl || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(formatValidationMessage(data.errors) || data.message || "Failed");
        return;
      }
      toast.success("Movie created");
      router.push("/admin/movies");
      router.refresh();
    } catch {
      toast.error("Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-3xl font-bold">Add Movie</h1>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-sm text-white/60">Title *</label>
          <Input value={form.title} onChange={(e) => update("title", e.target.value)} required className="mt-1" />
        </div>
        <div>
          <label className="text-sm text-white/60">Description *</label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            required
            rows={4}
            className="mt-1 w-full rounded-md border border-border bg-card px-4 py-3"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-white/60">Year</label>
            <Input type="number" value={form.releaseYear} onChange={(e) => update("releaseYear", e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-sm text-white/60">Duration (min)</label>
            <Input type="number" value={form.duration} onChange={(e) => update("duration", e.target.value)} className="mt-1" />
          </div>
        </div>

        <div>
          <label className="text-sm text-white/60">Video URL *</label>
          <p className="text-xs text-white/40 mb-1">
            YouTube: https://www.youtube.com/watch?v=xxxxx — OR direct .mp4 — OR upload file
          </p>
          <Input
            value={form.videoUrl}
            onChange={(e) => update("videoUrl", e.target.value)}
            className="mt-1"
            placeholder="https://www.youtube.com/watch?v=... or /uploads/..."
          />
          <label className="mt-2 inline-flex items-center gap-2 cursor-pointer text-sm text-primary">
            <Upload className="h-4 w-4" />
            {uploading === "videoUrl" ? "Uploading..." : "Upload local mp4"}
            <input
              type="file"
              accept="video/mp4,video/webm"
              className="hidden"
              disabled={!!uploading}
              onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "videoUrl")}
            />
          </label>
        </div>

        <div>
          <label className="text-sm text-white/60">Poster URL</label>
          <Input value={form.posterUrl} onChange={(e) => update("posterUrl", e.target.value)} className="mt-1" />
          <label className="mt-2 inline-flex items-center gap-2 cursor-pointer text-sm text-primary">
            <Upload className="h-4 w-4" />
            {uploading === "posterUrl" ? "Uploading..." : "Upload poster image"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={!!uploading}
              onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "posterUrl")}
            />
          </label>
        </div>

        <div>
          <label className="text-sm text-white/60">Backdrop URL</label>
          <Input value={form.backdropUrl} onChange={(e) => update("backdropUrl", e.target.value)} className="mt-1" />
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.allowDownload} onChange={(e) => update("allowDownload", e.target.checked)} />
            Allow Download
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => update("isFeatured", e.target.checked)} />
            Featured
          </label>
          <select
            value={form.status}
            onChange={(e) => update("status", e.target.value)}
            className="rounded bg-card border border-border px-2 py-1 text-sm"
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Movie"}
        </Button>
      </form>
    </div>
  );
}
