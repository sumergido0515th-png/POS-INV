import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { brandSchema } from "@/lib/validations";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  const body = await req.json();
  const parsed = brandSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const brand = await prisma.brand.update({
      where: { id: params.id },
      data: { name: parsed.data.name },
    });
    return NextResponse.json(brand);
  } catch (e) {
    return NextResponse.json({ error: "Brand not found or name already in use" }, { status: 409 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  const inUse = await prisma.product.count({ where: { brandId: params.id } });
  if (inUse > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${inUse} product(s) use this brand` },
      { status: 409 }
    );
  }

  await prisma.brand.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
