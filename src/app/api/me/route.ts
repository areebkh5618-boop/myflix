import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/permissions";
import { updateProfileSchema } from "@/lib/validations/auth";

export async function GET() {
  const { error, user } = await requireUser();
  if (error) return error;

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user!.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            likes: true,
            wishlist: true,
            watchHistory: true,
          },
        },
      },
    });

    if (!dbUser) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: dbUser });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { error, user } = await requireUser();
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Validation failed", errors: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const data = parsed.data;

    if (data.username) {
      const existing = await prisma.user.findFirst({
        where: { username: data.username, NOT: { id: user!.id } },
      });
      if (existing) {
        return NextResponse.json({ success: false, message: "Username already taken" }, { status: 409 });
      }
    }

    if (data.email) {
      const existing = await prisma.user.findFirst({
        where: { email: data.email.toLowerCase(), NOT: { id: user!.id } },
      });
      if (existing) {
        return NextResponse.json({ success: false, message: "Email already in use" }, { status: 409 });
      }
    }

    const updated = await prisma.user.update({
      where: { id: user!.id },
      data: {
        ...(data.username && { username: data.username }),
        ...(data.email && { email: data.email.toLowerCase() }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        role: true,
      },
    });

    return NextResponse.json({ success: true, data: updated, message: "Profile updated" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
