"use client";

import { useState } from "react";
import { Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function WishlistButton({
  contentId,
  initial = false,
}: {
  contentId: string;
  initial?: boolean;
}) {
  const [inList, setInList] = useState(initial);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      const method = inList ? "DELETE" : "POST";
      const res = await fetch(`/api/me/watchlist/${contentId}`, { method });
      if (res.ok) {
        setInList(!inList);
        toast.success(inList ? "Removed from My List" : "Added to My List");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="secondary" size="lg" onClick={toggle} disabled={loading} className="gap-2">
      {inList ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
      {inList ? "In My List" : "My List"}
    </Button>
  );
}
