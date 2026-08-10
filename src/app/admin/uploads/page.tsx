"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, Copy, Check } from "lucide-react";
import Link from "next/link";

export default function AdminUploadsPage() {
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<{ url: string; type: string; filename: string }[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    const uploaded: typeof results = [];

    for (const file of Array.from(files)) {
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) {
          toast.error(`${file.name}: ${data.message || "Failed"}`);
          continue;
        }
        uploaded.push(data.data);
        toast.success(`${file.name} uploaded`);
      } catch {
        toast.error(`${file.name} failed`);
      }
    }

    setResults((prev) => [...uploaded, ...prev]);
    setUploading(false);
    e.target.value = "";
  }

  function copyUrl(url: string) {
    const full = url.startsWith("http") ? url : `${window.location.origin}${url}`;
    navigator.clipboard.writeText(full);
    setCopied(url);
    toast.success("URL copied");
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">Uploads</h1>
        <p className="text-white/60 mt-1">
          Upload posters, backdrops, or video files. Copy the URL and paste it into a movie form.
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-10 text-center">
        <Upload className="h-12 w-12 mx-auto text-white/40 mb-4" />
        <p className="text-white/70 mb-2">Images (jpg, png, webp) or Videos (mp4, webm)</p>
        <p className="text-xs text-white/40 mb-4">Max image 10MB · Max video 1GB</p>
        <label className="inline-flex cursor-pointer">
          <span
            className={`inline-flex items-center justify-center rounded-md px-5 py-2.5 text-base font-semibold text-white bg-primary hover:bg-primary-hover ${
              uploading ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            {uploading ? "Uploading..." : "Choose files"}
          </span>
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70 space-y-2">
        <p className="font-medium text-white">Video tips</p>
        <ul className="list-disc list-inside space-y-1 text-white/50">
          <li>
            <strong className="text-white/70">YouTube:</strong> paste{" "}
            <code className="text-xs">https://www.youtube.com/watch?v=VIDEO_ID</code> in the
            movie Video URL field — player embeds it automatically.
          </li>
          <li>
            <strong className="text-white/70">Local file:</strong> upload .mp4 here, copy URL, paste
            into Video URL on the movie form.
          </li>
        </ul>
        <p className="pt-2">
          <Link href="/admin/movies/new" className="text-primary hover:underline">
            Add a new movie →
          </Link>
        </p>
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">This session</h2>
          {results.map((r) => (
            <div
              key={r.url}
              className="flex items-center gap-4 rounded-lg border border-white/10 bg-black/30 p-3"
            >
              {r.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.url} alt="" className="h-16 w-12 object-cover rounded" />
              ) : (
                <div className="h-16 w-12 rounded bg-white/10 flex items-center justify-center text-xs">
                  VID
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{r.filename}</p>
                <p className="text-xs text-white/40 truncate">{r.url}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => copyUrl(r.url)} className="gap-1">
                {copied === r.url ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Copy
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
