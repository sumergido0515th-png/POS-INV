import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { userSchema } from "@/lib/validations";

export async function GET() {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  const body = await req.json();
  const parsed = userSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  if (!d.password || d.password.length < 6) {
    return NextResponse.json({ error: "Password is required (min 6 characters)" }, { status: 400 });
  }

  try {
    const passwordHash = await bcrypt.hash(d.password, 10);
    const user = await prisma.user.create({
      data: {
        name: d.name,
        username: d.username.toLowerCase(),
        email: d.email || null,
        role: d.role,
        isActive: d.isActive,
        passwordHash,
      },
      select: { id: true, name: true, username: true, email: true, role: true, isActive: true },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Username or email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
