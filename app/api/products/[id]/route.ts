import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, requireSession } from "@/lib/rbac";
import { productSchema } from "@/lib/validations";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireSession();
  if (error) return error;

  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      category: true,
      brand: true,
      supplier: true,
      stockMovements: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { user: { select: { name: true } } },
      },
    },
  });

  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

// Quantity is intentionally NOT editable here — it only changes through
// stock movements (/api/stock/adjust) or completed sales, so history stays accurate.
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  const body = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;

  try {
    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        sku: d.sku,
        barcode: d.barcode || null,
        name: d.name,
        description: d.description || null,
        unit: d.unit,
        costPrice: d.costPrice,
        sellingPrice: d.sellingPrice,
        reorderLevel: d.reorderLevel,
        categoryId: d.categoryId,
        brandId: d.brandId || null,
        supplierId: d.supplierId || null,
        imageUrl: d.imageUrl || null,
        isActive: d.isActive,
      },
    });
    return NextResponse.json(product);
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "SKU or barcode already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  const referenced = await prisma.saleItem.count({ where: { productId: params.id } });
  if (referenced > 0) {
    await prisma.product.update({ where: { id: params.id }, data: { isActive: false } });
    return NextResponse.json({ ok: true, deactivated: true });
  }

  await prisma.stockMovement.deleteMany({ where: { productId: params.id } });
  await prisma.product.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true, deactivated: false });
}
