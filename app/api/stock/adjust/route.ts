import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { stockAdjustSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  const { session, error } = await requireRole(["ADMIN"]);
  if (error) return error;

  const body = await req.json();
  const parsed = stockAdjustSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { productId, type, quantity, reason } = parsed.data;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const delta = type === "ADJUSTMENT_OUT" ? -quantity : quantity;

  if (product.quantity + delta < 0) {
    return NextResponse.json(
      { error: `Cannot remove ${quantity} units — only ${product.quantity} in stock` },
      { status: 400 }
    );
  }

  const [updated] = await prisma.$transaction([
    prisma.product.update({
      where: { id: productId },
      data: { quantity: { increment: delta } },
    }),
    prisma.stockMovement.create({
      data: {
        productId,
        type,
        quantity,
        reason: reason || null,
        userId: session!.user.id,
      },
    }),
  ]);

  return NextResponse.json(updated);
}
