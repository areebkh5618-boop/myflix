"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function DisableUserButton({ userId, isActive }: { userId: string; isActive: boolean }) {
  const router = useRouter();
  async function toggle() {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    if (res.ok) {
      toast.success(isActive ? "User disabled" : "User enabled");
      router.refresh();
    } else {
      toast.error("Failed");
    }
  }
  return (
    <Button variant="outline" size="sm" onClick={toggle}>
      {isActive ? "Disable" : "Enable"}
    </Button>
  );
}
