import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { toNumber } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const days = Math.min(Math.max(parseInt(searchParams.get("days") || "7", 10), 1), 90);

  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [sales, products] = await Promise.all([
    prisma.sale.findMany({
      where: { createdAt: { gte: since }, status: "COMPLETED" },
      include: { items: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.product.findMany({ where: { isActive: true } }),
  ]);

  const todaySales = sales.filter((s) => s.createdAt >= startOfToday);
  const todayTotal = todaySales.reduce((sum, s) => sum + toNumber(s.total), 0);
  const rangeTotal = sales.reduce((sum, s) => sum + toNumber(s.total), 0);

  const byDay = new Map<string, { date: string; sales: number; revenue: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    byDay.set(key, { date: key, sales: 0, revenue: 0 });
  }
  for (const s of sales) {
    const key = s.createdAt.toISOString().slice(0, 10);
    const bucket = byDay.get(key);
    if (bucket) {
      bucket.sales += 1;
      bucket.revenue += toNumber(s.total);
    }
  }

  const productTotals = new Map<string, { name: string; sku: string; qty: number; revenue: number }>();
  for (const s of sales) {
    for (const item of s.items) {
      const cur = productTotals.get(item.productId) || {
        name: item.productName,
        sku: item.sku,
        qty: 0,
        revenue: 0,
      };
      cur.qty += item.quantity;
      cur.revenue += toNumber(item.lineTotal);
      productTotals.set(item.productId, cur);
    }
  }
  const topProducts = Array.from(productTotals.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 8);

  const lowStock = products
    .filter((p) => p.quantity <= p.reorderLevel)
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 20)
    .map((p) => ({ id: p.id, name: p.name, sku: p.sku, quantity: p.quantity, reorderLevel: p.reorderLevel }));

  const inventoryValue = products.reduce(
    (sum, p) => sum + toNumber(p.costPrice) * p.quantity,
    0
  );

  return NextResponse.json({
    todayTotal,
    todayCount: todaySales.length,
    rangeTotal,
    rangeCount: sales.length,
    trend: Array.from(byDay.values()),
    topProducts,
    lowStock,
    lowStockCount: products.filter((p) => p.quantity <= p.reorderLevel).length,
    totalProducts: products.length,
    inventoryValue,
  });
}
