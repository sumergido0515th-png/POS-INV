import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, requireSession } from "@/lib/rbac";
import { brandSchema } from "@/lib/validations";

export async function GET() {
  const { error } = await requireSession();
  if (error) return error;

  const brands = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return NextResponse.json(brands);
}

export async function POST(req: NextRequest) {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  const body = await req.json();
  const parsed = brandSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const brand = await prisma.brand.create({ data: { name: parsed.data.name } });
    return NextResponse.json(brand, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Brand name already exists" }, { status: 409 });
  }
}
