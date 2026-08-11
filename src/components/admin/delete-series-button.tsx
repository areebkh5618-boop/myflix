"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function DeleteSeriesButton({ seriesId }: { seriesId: string }) {
  const router = useRouter();

  async function remove() {
    if (!confirm("Delete this series permanently?")) return;
    const res = await fetch(`/api/admin/series/${seriesId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Deleted");
      router.refresh();
    } else {
      toast.error("Delete failed");
    }
  }

  return (
    <Button variant="danger" size="sm" onClick={remove}>
      Delete
    </Button>
  );
}