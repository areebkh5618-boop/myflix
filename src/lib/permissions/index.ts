import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 }), user: null };
  }
  return { error: null, user: session.user };
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 }), user: null };
  }
  if (session.user.role !== Role.ADMIN) {
    return { error: NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 }), user: null };
  }
  return { error: null, user: session.user };
}

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export function isAdmin(role?: Role | string) {
  return role === Role.ADMIN || role === "ADMIN";
}
