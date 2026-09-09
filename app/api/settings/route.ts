import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, requireSession } from "@/lib/rbac";
import { settingsSchema } from "@/lib/validations";

export async function GET() {
  const { error } = await requireSession();
  if (error) return error;

  let settings = await prisma.settings.findFirst();
  if (!settings) {
    settings = await prisma.settings.create({ data: {} });
  }
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  const body = await req.json();
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;

  let settings = await prisma.settings.findFirst();
  if (!settings) {
    settings = await prisma.settings.create({ data: d as any });
  } else {
    settings = await prisma.settings.update({
      where: { id: settings.id },
      data: {
        businessName: d.businessName,
        address: d.address || null,
        phone: d.phone || null,
        email: d.email || null,
        taxRate: d.taxRate,
        currency: d.currency,
        receiptFooter: d.receiptFooter || null,
        lowStockThreshold: d.lowStockThreshold,
      },
    });
  }

  return NextResponse.json(settings);
}
