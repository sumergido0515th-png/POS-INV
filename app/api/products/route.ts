import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, requireSession } from "@/lib/rbac";
import { productSchema } from "@/lib/validations";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { error } = await requireSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const categoryId = searchParams.get("categoryId");
  const brandId = searchParams.get("brandId");
  const lowStock = searchParams.get("lowStock") === "true";
  const activeOnly = searchParams.get("activeOnly") !== "false";

  const where: Prisma.ProductWhereInput = {
    ...(activeOnly ? { isActive: true } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(brandId ? { brandId } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q } },
            { sku: { contains: q } },
            { barcode: { contains: q } },
          ],
        }
      : {}),
  };

  const products = await prisma.product.findMany({
    where,
    include: { category: true, brand: true, supplier: true },
    orderBy: { name: "asc" },
  });

  const filtered = lowStock
    ? products.filter((p) => p.quantity <= p.reorderLevel)
    : products;

  return NextResponse.json(filtered);
}

export async function POST(req: NextRequest) {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  const body = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;

  try {
    const product = await prisma.product.create({
      data: {
        sku: d.sku,
        barcode: d.barcode || null,
        name: d.name,
        description: d.description || null,
        unit: d.unit,
        costPrice: d.costPrice,
        sellingPrice: d.sellingPrice,
        quantity: d.quantity,
        reorderLevel: d.reorderLevel,
        categoryId: d.categoryId,
        brandId: d.brandId || null,
        supplierId: d.supplierId || null,
        imageUrl: d.imageUrl || null,
        isActive: d.isActive,
      },
    });

    if (d.quantity > 0) {
      const { session } = await requireRole(["ADMIN"]);
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          type: "RECEIVE",
          quantity: d.quantity,
          reason: "Initial stock on product creation",
          userId: session!.user.id,
        },
      });
    }

    return NextResponse.json(product, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "SKU or barcode already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
