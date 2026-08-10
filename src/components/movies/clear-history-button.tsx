"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ClearHistoryButton() {
  const router = useRouter();
  async function clear() {
    if (!confirm("Clear entire watch history?")) return;
    const res = await fetch("/api/me/history", { method: "DELETE" });
    if (res.ok) {
      toast.success("History cleared");
      router.refresh();
    }
  }
  return (
    <Button variant="outline" size="sm" onClick={clear}>
      Clear All
    </Button>
  );
}
