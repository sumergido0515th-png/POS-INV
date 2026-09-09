import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, requireSession } from "@/lib/rbac";
import { categorySchema } from "@/lib/validations";

export async function GET() {
  const { error } = await requireSession();
  if (error) return error;

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  const body = await req.json();
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const category = await prisma.category.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
      },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Category name already exists" }, { status: 409 });
  }
}
