"use client";

import { useState } from "react";
import { ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function LikeButton({
  contentId,
  initial = false,
  count = 0,
}: {
  contentId: string;
  initial?: boolean;
  count?: number;
}) {
  const [liked, setLiked] = useState(initial);
  const [likeCount, setLikeCount] = useState(count);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      const method = liked ? "DELETE" : "POST";
      const res = await fetch(`/api/me/likes/${contentId}`, { method });
      if (res.ok) {
        setLiked(!liked);
        setLikeCount((c) => (liked ? Math.max(0, c - 1) : c + 1));
        toast.success(liked ? "Removed like" : "Liked!");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={toggle}
      disabled={loading}
      className={cn("gap-2", liked && "border-primary text-primary")}
    >
      <ThumbsUp className={cn("h-5 w-5", liked && "fill-current")} />
      {likeCount > 0 ? likeCount : "Like"}
    </Button>
  );
}
