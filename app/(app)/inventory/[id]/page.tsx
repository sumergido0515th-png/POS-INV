"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProductForm } from "@/components/inventory/product-form";
import { StockAdjustPanel } from "@/components/inventory/stock-adjust-panel";
import { formatCurrency, formatDate, toNumber } from "@/lib/utils";
import { MOVEMENT_TYPE_LABELS, MovementType } from "@/lib/types";
import { cn } from "@/lib/utils";

type StockMovement = {
  id: string;
  type: MovementType;
  quantity: number;
  reason: string | null;
  createdAt: string;
  user: { name: string };
};

type ProductDetail = {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  description: string | null;
  unit: string;
  costPrice: string;
  sellingPrice: string;
  quantity: number;
  reorderLevel: number;
  isActive: boolean;
  categoryId: string;
  brandId: string | null;
  supplierId: string | null;
  stockMovements: StockMovement[];
};

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    fetch(`/api/products/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then(setProduct)
      .catch(() => router.push("/inventory"))
      .finally(() => setLoading(false));
  }, [params.id, router]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !product) {
    return <p className="text-sm text-ink-500">Loading…</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-ink-900">Edit Product</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 items-start">
        <ProductForm
          mode="edit"
          productId={product.id}
          initial={{
            sku: product.sku,
            barcode: product.barcode || "",
            name: product.name,
            description: product.description || "",
            unit: product.unit,
            costPrice: String(toNumber(product.costPrice)),
            sellingPrice: String(toNumber(product.sellingPrice)),
            reorderLevel: String(product.reorderLevel),
            categoryId: product.categoryId,
            brandId: product.brandId || "",
            supplierId: product.supplierId || "",
            isActive: product.isActive,
          }}
        />

        <div className="space-y-4">
          <StockAdjustPanel productId={product.id} currentQuantity={product.quantity} onAdjusted={load} />

          <div className="card p-4">
            <h3 className="font-semibold text-ink-900 mb-3">Recent Stock Movements</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {product.stockMovements.length === 0 && (
                <p className="text-sm text-ink-400">No movements yet.</p>
              )}
              {product.stockMovements.map((m) => (
                <div key={m.id} className="text-xs border-b border-ink-50 pb-2 last:border-0">
                  <div className="flex justify-between">
                    <span
                      className={cn(
                        "font-medium",
                        m.type === "SALE" || m.type === "ADJUSTMENT_OUT" ? "text-red-600" : "text-emerald-600"
                      )}
                    >
                      {MOVEMENT_TYPE_LABELS[m.type]}
                    </span>
                    <span className="font-semibold">
                      {m.type === "SALE" || m.type === "ADJUSTMENT_OUT" ? "-" : "+"}
                      {m.quantity}
                    </span>
                  </div>
                  <p className="text-ink-400">
                    {formatDate(m.createdAt)} · {m.user.name}
                  </p>
                  {m.reason && <p className="text-ink-500">{m.reason}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
