import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { userSchema } from "@/lib/validations";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireRole(["ADMIN"]);
  if (error) return error;

  const body = await req.json();
  const parsed = userSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;

  if (params.id === session!.user.id && d.role !== "ADMIN") {
    return NextResponse.json({ error: "You cannot remove your own admin role" }, { status: 400 });
  }
  if (params.id === session!.user.id && !d.isActive) {
    return NextResponse.json({ error: "You cannot deactivate your own account" }, { status: 400 });
  }

  try {
    const data: any = {
      name: d.name,
      username: d.username.toLowerCase(),
      email: d.email || null,
      role: d.role,
      isActive: d.isActive,
    };
    if (d.password) {
      if (d.password.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
      }
      data.passwordHash = await bcrypt.hash(d.password, 10);
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data,
      select: { id: true, name: true, username: true, email: true, role: true, isActive: true },
    });
    return NextResponse.json(user);
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Username or email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireRole(["ADMIN"]);
  if (error) return error;

  if (params.id === session!.user.id) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
  }

  const adminCount = await prisma.user.count({ where: { role: "ADMIN", isActive: true } });
  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (target?.role === "ADMIN" && adminCount <= 1) {
    return NextResponse.json({ error: "Cannot delete the last active Owner/Admin" }, { status: 400 });
  }

  const salesCount = await prisma.sale.count({ where: { cashierId: params.id } });
  if (salesCount > 0) {
    await prisma.user.update({ where: { id: params.id }, data: { isActive: false } });
    return NextResponse.json({ ok: true, deactivated: true });
  }

  await prisma.stockMovement.deleteMany({ where: { userId: params.id } });
  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true, deactivated: false });
}
