"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload } from "lucide-react";

export default function NewSeriesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    releaseYear: new Date().getFullYear(),
    posterUrl: "",
    backdropUrl: "",
    status: "PUBLISHED",
    isFeatured: false,
  });

  function update(key: string, value: any) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function uploadPoster(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        update("posterUrl", data.data.url);
        toast.success("Poster uploaded");
      } else toast.error(data.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          cast: [],
          releaseYear: Number(form.releaseYear),
          posterUrl: form.posterUrl || null,
          backdropUrl: form.backdropUrl || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed");
        return;
      }
      toast.success("Series created — now add seasons & episodes");
      router.push(`/admin/series/${data.data.id}`);
      router.refresh();
    } catch {
      toast.error("Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-3xl font-bold">Add Series</h1>
      <p className="text-white/60 text-sm">
        Step 1: Create series → Step 2: Add seasons → Step 3: Add episodes with video URLs
      </p>
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
        <div>
          <label className="text-sm text-white/60">Year</label>
          <Input type="number" value={form.releaseYear} onChange={(e) => update("releaseYear", e.target.value)} className="mt-1" />
        </div>
        <div>
          <label className="text-sm text-white/60">Poster URL</label>
          <Input value={form.posterUrl} onChange={(e) => update("posterUrl", e.target.value)} className="mt-1" />
          <label className="mt-2 inline-flex items-center gap-2 cursor-pointer text-sm text-primary">
            <Upload className="h-4 w-4" />
            {uploading ? "Uploading..." : "Upload poster"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadPoster(e.target.files[0])}
            />
          </label>
        </div>
        <div>
          <label className="text-sm text-white/60">Status</label>
          <select
            value={form.status}
            onChange={(e) => update("status", e.target.value)}
            className="mt-1 block rounded bg-card border border-border px-3 py-2"
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Series"}
        </Button>
      </form>
    </div>
  );
}
