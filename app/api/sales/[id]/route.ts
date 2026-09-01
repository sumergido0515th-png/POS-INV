import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, requireSession } from "@/lib/rbac";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireSession();
  if (error) return error;

  const sale = await prisma.sale.findUnique({
    where: { id: params.id },
    include: {
      items: true,
      cashier: { select: { name: true } },
    },
  });

  if (!sale) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(sale);
}

// Void a sale — restores stock and marks it VOIDED. Owner/Admin only.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireRole(["ADMIN"]);
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  if (body?.action !== "void") {
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({ where: { id: params.id }, include: { items: true } });
      if (!sale) throw new Error("Sale not found");
      if (sale.status !== "COMPLETED") throw new Error("Sale is already voided or refunded");

      for (const item of sale.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { increment: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: "RETURN",
            quantity: item.quantity,
            reason: `Void of ${sale.invoiceNo}`,
            userId: session!.user.id,
            saleId: sale.id,
          },
        });
      }

      return tx.sale.update({ where: { id: sale.id }, data: { status: "VOIDED" } });
    });

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to void sale" }, { status: 400 });
  }
}
