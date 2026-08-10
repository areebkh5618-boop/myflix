"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { cn, getYouTubeId, isYouTubeUrl, getVimeoId, isVimeoUrl } from "@/lib/utils";

interface VideoPlayerProps {
  src: string;
  poster?: string | null;
  title?: string;
  contentId: string;
  episodeId?: string | null;
  initialTime?: number;
  onProgress?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
}

export function VideoPlayer({
  src,
  poster,
  title,
  contentId,
  episodeId,
  initialTime = 0,
  onProgress,
  onEnded,
}: VideoPlayerProps) {
  // YouTube embed
  if (isYouTubeUrl(src)) {
    const id = getYouTubeId(src);
    if (id) {
      return (
        <div className="relative aspect-video w-full bg-black">
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube.com/embed/${id}?rel=0&modestbranding=1${initialTime > 0 ? `&start=${Math.floor(initialTime)}` : ""}`}
            title={title || "Video"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
          <YouTubeProgressBeacon contentId={contentId} episodeId={episodeId} />
        </div>
      );
    }
  }

  // Vimeo embed
  if (isVimeoUrl(src)) {
    const id = getVimeoId(src);
    if (id) {
      return (
        <div className="relative aspect-video w-full bg-black">
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://player.vimeo.com/video/${id}`}
            title={title || "Video"}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
          <YouTubeProgressBeacon contentId={contentId} episodeId={episodeId} />
        </div>
      );
    }
  }

  return (
    <Html5Player
      src={src}
      poster={poster}
      title={title}
      contentId={contentId}
      episodeId={episodeId}
      initialTime={initialTime}
      onProgress={onProgress}
      onEnded={onEnded}
    />
  );
}

function YouTubeProgressBeacon({
  contentId,
  episodeId,
}: {
  contentId: string;
  episodeId?: string | null;
}) {
  useEffect(() => {
    // Register that user started watching (YouTube can't report exact progress easily)
    fetch(`/api/me/progress/${contentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentId,
        episodeId: episodeId || null,
        currentTime: 30,
        duration: 100,
      }),
    }).catch(() => {});
  }, [contentId, episodeId]);
  return null;
}

function Html5Player({
  src,
  poster,
  title,
  contentId,
  episodeId,
  initialTime = 0,
  onProgress,
  onEnded,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [speed, setSpeed] = useState(1);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSave = useRef(0);

  const format = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    if (h > 0)
      return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const saveProgress = useCallback(
    (time: number, dur: number) => {
      const now = Date.now();
      if (now - lastSave.current < 5000 && time < dur - 2) return;
      lastSave.current = now;
      onProgress?.(time, dur);
      fetch(`/api/me/progress/${contentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          episodeId: episodeId || null,
          currentTime: time,
          duration: dur,
        }),
      }).catch(() => {});
    },
    [contentId, episodeId, onProgress]
  );

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (initialTime > 0) v.currentTime = initialTime;
  }, [initialTime, src]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onTime = () => {
      setCurrent(v.currentTime);
      if (v.duration) saveProgress(v.currentTime, v.duration);
    };
    const onMeta = () => {
      setDuration(v.duration);
      setLoading(false);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => {
      setPlaying(false);
      if (v.duration) saveProgress(v.currentTime, v.duration);
    };
    const onEnd = () => {
      setPlaying(false);
      if (v.duration) saveProgress(v.duration, v.duration);
      onEnded?.();
    };
    const onWait = () => setLoading(true);
    const onCanPlay = () => setLoading(false);
    const onErr = () => {
      setError(true);
      setLoading(false);
    };

    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("ended", onEnd);
    v.addEventListener("waiting", onWait);
    v.addEventListener("canplay", onCanPlay);
    v.addEventListener("error", onErr);

    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("ended", onEnd);
      v.removeEventListener("waiting", onWait);
      v.removeEventListener("canplay", onCanPlay);
      v.removeEventListener("error", onErr);
    };
  }, [saveProgress, onEnded]);

  useEffect(() => {
    const handler = () => {
      const v = videoRef.current;
      if (v && v.duration) saveProgress(v.currentTime, v.duration);
    };
    window.addEventListener("beforeunload", handler);
    return () => {
      handler();
      window.removeEventListener("beforeunload", handler);
    };
  }, [saveProgress]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play();
    else v.pause();
  };

  const seek = (t: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(t, v.duration || 0));
  };

  const changeVolume = (val: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    setVolume(val);
    setMuted(val === 0);
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const toggleFs = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  const changeSpeed = () => {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const idx = speeds.indexOf(speed);
    const next = speeds[(idx + 1) % speeds.length];
    setSpeed(next);
    if (videoRef.current) videoRef.current.playbackRate = next;
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          seek(current - 10);
          break;
        case "ArrowRight":
          seek(current + 10);
          break;
        case "m":
          toggleMute();
          break;
        case "f":
          toggleFs();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const showControlsTemp = () => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  };

  if (error) {
    return (
      <div className="flex aspect-video flex-col items-center justify-center gap-2 bg-black text-white/70 p-4 text-center">
        <p>Unable to load this video.</p>
        <p className="text-xs text-white/40">
          Use a direct .mp4 / .webm URL, or a full YouTube link (youtube.com/watch?v=…).
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative aspect-video w-full bg-black group"
      onMouseMove={showControlsTemp}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster || undefined}
        className="h-full w-full"
        playsInline
        onClick={togglePlay}
      />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white border-t-transparent" />
        </div>
      )}

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 pb-4 pt-12 transition-opacity",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={current}
          onChange={(e) => seek(Number(e.target.value))}
          className="w-full h-1 accent-primary cursor-pointer mb-3"
        />
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button onClick={togglePlay} className="text-white p-1 hover:text-primary">
              {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 fill-current" />}
            </button>
            <button onClick={() => seek(current - 10)} className="text-white/80 p-1">
              <SkipBack className="h-5 w-5" />
            </button>
            <button onClick={() => seek(current + 10)} className="text-white/80 p-1">
              <SkipForward className="h-5 w-5" />
            </button>
            <button onClick={toggleMute} className="text-white/80 p-1">
              {muted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => changeVolume(Number(e.target.value))}
              className="w-20 h-1 accent-white"
            />
            <span className="text-xs text-white/80 tabular-nums ml-2">
              {format(current)} / {format(duration)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {title && (
              <span className="text-sm text-white/70 hidden md:block truncate max-w-[200px]">
                {title}
              </span>
            )}
            <button onClick={changeSpeed} className="text-xs text-white/80 px-2 py-1 rounded bg-white/10">
              {speed}x
            </button>
            <button onClick={toggleFs} className="text-white/80 p-1">
              {fullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
