"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Episode = {
  id: string;
  episodeNumber: number;
  title: string;
  videoUrl?: string | null;
  duration?: number | null;
};
type Season = {
  id: string;
  seasonNumber: number;
  title?: string | null;
  episodes: Episode[];
};

export default function ManageSeriesPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [series, setSeries] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [seasonNum, setSeasonNum] = useState(1);
  const [epForm, setEpForm] = useState({
    seasonId: "",
    episodeNumber: 1,
    title: "",
    videoUrl: "",
    duration: 45,
  });

  async function load() {
    const res = await fetch(`/api/admin/series/${id}`);
    const data = await res.json();
    if (data.success) {
      setSeries(data.data);
      if (data.data.seasons?.length) {
        setEpForm((p) => ({
          ...p,
          seasonId: data.data.seasons[0].id,
          episodeNumber: (data.data.seasons[0].episodes?.length || 0) + 1,
        }));
      }
    } else {
      toast.error("Series not found");
      router.push("/admin/series");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function addSeason() {
    const res = await fetch("/api/admin/seasons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentId: id, seasonNumber: seasonNum }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.message || "Failed");
      return;
    }
    toast.success(`Season ${seasonNum} added`);
    setSeasonNum(seasonNum + 1);
    load();
  }

  async function addEpisode(e: React.FormEvent) {
    e.preventDefault();
    if (!epForm.seasonId) {
      toast.error("Add a season first");
      return;
    }
    const res = await fetch("/api/admin/episodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(epForm),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.message || "Failed");
      return;
    }
    toast.success("Episode added");
    setEpForm((p) => ({
      ...p,
      episodeNumber: p.episodeNumber + 1,
      title: "",
      videoUrl: "",
    }));
    load();
  }

  async function removeSeries() {
    if (!confirm("Delete this series permanently?")) return;
    const res = await fetch(`/api/admin/series/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Deleted");
      router.push("/admin/series");
      router.refresh();
    } else {
      toast.error("Delete failed");
    }
  }

  if (loading) return <div className="text-white/50">Loading...</div>;
  if (!series) return null;

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{series.title}</h1>
          <p className="text-white/60 text-sm mt-1">
            Status: {series.status} · Manage seasons & episodes below
          </p>
        </div>
        <Button variant="danger" size="sm" onClick={removeSeries}>
          Delete
        </Button>
      </div>

      {/* Existing seasons */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Seasons & Episodes</h2>
        {series.seasons?.length === 0 && (
          <p className="text-white/40 text-sm">No seasons yet. Add Season 1 below.</p>
        )}
        {series.seasons?.map((s: Season) => (
          <div key={s.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 className="font-medium mb-2">
              Season {s.seasonNumber} {s.title && s.title !== `Season ${s.seasonNumber}` ? `— ${s.title}` : ""}
            </h3>
            <ul className="space-y-1 text-sm text-white/70">
              {s.episodes.map((ep) => (
                <li key={ep.id} className="flex justify-between gap-2">
                  <span>
                    E{ep.episodeNumber}. {ep.title}
                    {ep.duration ? ` (${ep.duration}m)` : ""}
                  </span>
                  <span className="text-xs text-white/40 truncate max-w-[200px]">
                    {ep.videoUrl || "no video"}
                  </span>
                </li>
              ))}
              {s.episodes.length === 0 && (
                <li className="text-white/40">No episodes</li>
              )}
            </ul>
          </div>
        ))}
      </div>

      {/* Add season */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-end gap-3">
        <div>
          <label className="text-sm text-white/60">Season number</label>
          <Input
            type="number"
            min={1}
            value={seasonNum}
            onChange={(e) => setSeasonNum(Number(e.target.value))}
            className="mt-1 w-28"
          />
        </div>
        <Button type="button" onClick={addSeason}>
          Add Season
        </Button>
      </div>

      {/* Add episode */}
      <form onSubmit={addEpisode} className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <h3 className="font-medium">Add Episode</h3>
        <div>
          <label className="text-sm text-white/60">Season</label>
          <select
            value={epForm.seasonId}
            onChange={(e) => setEpForm((p) => ({ ...p, seasonId: e.target.value }))}
            className="mt-1 block w-full rounded bg-card border border-border px-3 py-2"
          >
            <option value="">Select season</option>
            {series.seasons?.map((s: Season) => (
              <option key={s.id} value={s.id}>
                Season {s.seasonNumber}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-white/60">Episode #</label>
            <Input
              type="number"
              min={1}
              value={epForm.episodeNumber}
              onChange={(e) => setEpForm((p) => ({ ...p, episodeNumber: Number(e.target.value) }))}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm text-white/60">Duration (min)</label>
            <Input
              type="number"
              value={epForm.duration}
              onChange={(e) => setEpForm((p) => ({ ...p, duration: Number(e.target.value) }))}
              className="mt-1"
            />
          </div>
        </div>
        <div>
          <label className="text-sm text-white/60">Title *</label>
          <Input
            value={epForm.title}
            onChange={(e) => setEpForm((p) => ({ ...p, title: e.target.value }))}
            required
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm text-white/60">Video URL</label>
          <p className="text-xs text-white/40 mb-1">
            YouTube link OR direct .mp4/.webm URL (not a random webpage)
          </p>
          <Input
            value={epForm.videoUrl}
            onChange={(e) => setEpForm((p) => ({ ...p, videoUrl: e.target.value }))}
            className="mt-1"
            placeholder="https://youtube.com/watch?v=... or https://....mp4"
          />
        </div>
        <Button type="submit">Add Episode</Button>
      </form>
    </div>
  );
}
