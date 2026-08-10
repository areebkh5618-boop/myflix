import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    const body = await req.json();
    const data: any = {};
    if (typeof body.isActive === "boolean") data.isActive = body.isActive;

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, username: true, email: true, isActive: true, role: true },
    });

    await prisma.auditLog.create({
      data: {
        adminId: user!.id,
        action: body.isActive === false ? "USER_DISABLED" : "USER_UPDATED",
        targetType: "User",
        targetId: id,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    if (id === user!.id) {
      return NextResponse.json({ success: false, message: "Cannot delete yourself" }, { status: 400 });
    }
    await prisma.user.delete({ where: { id } });
    await prisma.auditLog.create({
      data: { adminId: user!.id, action: "USER_DELETED", targetType: "User", targetId: id },
    }).catch(() => {});
    return NextResponse.json({ success: true, message: "User deleted" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
