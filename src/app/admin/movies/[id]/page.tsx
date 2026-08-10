"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload } from "lucide-react";

export default function EditMoviePage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    releaseYear: 2024,
    duration: 120,
    maturityRating: "PG-13",
    imdbRating: 7,
    director: "",
    cast: "",
    posterUrl: "",
    backdropUrl: "",
    trailerUrl: "",
    videoUrl: "",
    allowDownload: false,
    isFeatured: false,
    status: "DRAFT",
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/movies?q=`);
        const data = await res.json();
        if (data.success) {
          const movie = data.data.find((m: any) => m.id === id);
          if (movie) {
            setForm({
              title: movie.title || "",
              description: movie.description || "",
              releaseYear: movie.releaseYear || 2024,
              duration: movie.duration || 120,
              maturityRating: movie.maturityRating || "PG-13",
              imdbRating: movie.imdbRating || 7,
              director: movie.director || "",
              cast: (movie.cast || []).join(", "),
              posterUrl: movie.posterUrl || "",
              backdropUrl: movie.backdropUrl || "",
              trailerUrl: movie.trailerUrl || "",
              videoUrl: movie.videoUrl || "",
              allowDownload: movie.allowDownload || false,
              isFeatured: movie.isFeatured || false,
              status: movie.status || "DRAFT",
            });
          } else {
            toast.error("Movie not found");
            router.push("/admin/movies");
          }
        }
      } catch {
        toast.error("Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, router]);

  function update(key: string, value: any) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function uploadFile(file: File, field: "posterUrl" | "backdropUrl" | "videoUrl" | "trailerUrl") {
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

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/movies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          cast: form.cast.split(",").map((s) => s.trim()).filter(Boolean),
          releaseYear: Number(form.releaseYear),
          duration: Number(form.duration),
          imdbRating: Number(form.imdbRating),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to save");
        return;
      }
      toast.success("Movie updated");
      router.push("/admin/movies");
      router.refresh();
    } catch {
      toast.error("Error saving");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this movie permanently?")) return;
    const res = await fetch(`/api/admin/movies/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Deleted");
      router.push("/admin/movies");
      router.refresh();
    } else {
      toast.error("Delete failed");
    }
  }

  if (loading) {
    return <div className="text-white/50">Loading...</div>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Edit Movie</h1>
        <Button variant="danger" size="sm" onClick={remove}>
          Delete
        </Button>
      </div>

      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="text-sm text-white/60">Title</label>
          <Input value={form.title} onChange={(e) => update("title", e.target.value)} required className="mt-1" />
        </div>
        <div>
          <label className="text-sm text-white/60">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            required
            rows={4}
            className="mt-1 w-full rounded-md border border-border bg-card px-4 py-3 text-foreground"
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

        {/* Video URL + upload */}
        <div>
          <label className="text-sm text-white/60">Video URL</label>
          <p className="text-xs text-white/40 mb-1">
            YouTube link (youtube.com/watch?v=…) OR direct .mp4 URL OR upload file
          </p>
          <Input
            value={form.videoUrl}
            onChange={(e) => update("videoUrl", e.target.value)}
            className="mt-1"
            placeholder="https://youtube.com/watch?v=... or https://...mp4"
          />
          <label className="mt-2 inline-flex items-center gap-2 cursor-pointer text-sm text-primary">
            <Upload className="h-4 w-4" />
            {uploading === "videoUrl" ? "Uploading..." : "Upload local video (mp4)"}
            <input
              type="file"
              accept="video/mp4,video/webm"
              className="hidden"
              disabled={!!uploading}
              onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "videoUrl")}
            />
          </label>
        </div>

        {/* Poster */}
        <div>
          <label className="text-sm text-white/60">Poster URL</label>
          <Input value={form.posterUrl} onChange={(e) => update("posterUrl", e.target.value)} className="mt-1" />
          <label className="mt-2 inline-flex items-center gap-2 cursor-pointer text-sm text-primary">
            <Upload className="h-4 w-4" />
            {uploading === "posterUrl" ? "Uploading..." : "Upload poster"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={!!uploading}
              onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "posterUrl")}
            />
          </label>
          {form.posterUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.posterUrl} alt="" className="mt-2 h-32 rounded object-cover" />
          )}
        </div>

        <div>
          <label className="text-sm text-white/60">Backdrop URL</label>
          <Input value={form.backdropUrl} onChange={(e) => update("backdropUrl", e.target.value)} className="mt-1" />
          <label className="mt-2 inline-flex items-center gap-2 cursor-pointer text-sm text-primary">
            <Upload className="h-4 w-4" />
            {uploading === "backdropUrl" ? "Uploading..." : "Upload backdrop"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={!!uploading}
              onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "backdropUrl")}
            />
          </label>
        </div>

        <div>
          <label className="text-sm text-white/60">Director</label>
          <Input value={form.director} onChange={(e) => update("director", e.target.value)} className="mt-1" />
        </div>
        <div>
          <label className="text-sm text-white/60">Cast (comma separated)</label>
          <Input value={form.cast} onChange={(e) => update("cast", e.target.value)} className="mt-1" />
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

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/admin/movies")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
