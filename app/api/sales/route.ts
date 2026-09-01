import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, requireSession } from "@/lib/rbac";
import { saleSchema } from "@/lib/validations";
import { generateInvoiceNo } from "@/lib/utils";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { error } = await requireSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const cashierId = searchParams.get("cashierId");
  const q = searchParams.get("q")?.trim();

  const where: Prisma.SaleWhereInput = {
    ...(cashierId ? { cashierId } : {}),
    ...(q ? { invoiceNo: { contains: q } } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to + "T23:59:59.999") } : {}),
          },
        }
      : {}),
  };

  const sales = await prisma.sale.findMany({
    where,
    include: {
      cashier: { select: { name: true } },
      items: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json(sales);
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireRole(["ADMIN", "CASHIER"]);
  if (error) return error;

  const body = await req.json();
  const parsed = saleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { items, discount, paymentMethod, amountPaid, customerName, customerPhone } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const productIds = items.map((i) => i.productId);
      const products = await tx.product.findMany({ where: { id: { in: productIds } } });

      const productMap = new Map(products.map((p) => [p.id, p]));

      let subtotal = 0;
      const lineItems: {
        productId: string;
        productName: string;
        sku: string;
        unitPrice: number;
        quantity: number;
        lineTotal: number;
      }[] = [];

      for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product) throw new Error(`Product not found: ${item.productId}`);
        if (!product.isActive) throw new Error(`${product.name} is no longer available`);
        if (product.quantity < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name} (${product.quantity} left)`);
        }
        const unitPrice = Number(product.sellingPrice);
        const lineTotal = unitPrice * item.quantity;
        subtotal += lineTotal;
        lineItems.push({
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          unitPrice,
          quantity: item.quantity,
          lineTotal,
        });
      }

      const settings = await tx.settings.findFirst();
      const taxRate = settings ? Number(settings.taxRate) : 0;
      const discountedSubtotal = Math.max(0, subtotal - discount);
      const tax = (discountedSubtotal * taxRate) / 100;
      const total = discountedSubtotal + tax;

      if (amountPaid < total) {
        throw new Error(`Amount paid (${amountPaid.toFixed(2)}) is less than total (${total.toFixed(2)})`);
      }

      const sale = await tx.sale.create({
        data: {
          invoiceNo: generateInvoiceNo(),
          cashierId: session!.user.id,
          customerName: customerName || null,
          customerPhone: customerPhone || null,
          subtotal,
          discount,
          tax,
          total,
          amountPaid,
          changeDue: amountPaid - total,
          paymentMethod,
          items: { create: lineItems },
        },
        include: { items: true },
      });

      for (const item of lineItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { decrement: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: "SALE",
            quantity: item.quantity,
            reason: `Sale ${sale.invoiceNo}`,
            userId: session!.user.id,
            saleId: sale.id,
          },
        });
      }

      return sale;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to process sale" }, { status: 400 });
  }
}
