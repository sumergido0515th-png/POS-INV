"use client";

import { PosProduct } from "@/lib/pos-types";
import { formatCurrency, toNumber, cn } from "@/lib/utils";
import { Plus, PackageX } from "lucide-react";

export function ProductCard({
  product,
  onAdd,
}: {
  product: PosProduct;
  onAdd: (product: PosProduct) => void;
}) {
  const outOfStock = product.quantity <= 0;
  const lowStock = !outOfStock && product.quantity <= product.reorderLevel;

  return (
    <button
      onClick={() => !outOfStock && onAdd(product)}
      disabled={outOfStock}
      className={cn(
        "card p-3 text-left transition-all hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-card relative group"
      )}
    >
      {lowStock && (
        <span className="badge bg-amber-100 text-amber-700 absolute top-2 right-2">Low</span>
      )}
      {outOfStock && (
        <span className="badge bg-red-100 text-red-700 absolute top-2 right-2 flex items-center gap-1">
          <PackageX className="h-3 w-3" /> Out
        </span>
      )}
      <div className="h-8 w-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mb-2 group-hover:bg-brand-500 group-hover:text-white transition-colors">
        <Plus className="h-4 w-4" />
      </div>
      <p className="text-sm font-semibold text-ink-900 leading-tight line-clamp-2 min-h-[2.5rem]">
        {product.name}
      </p>
      <p className="text-xs text-ink-400 mt-1">{product.sku}</p>
      <div className="flex items-center justify-between mt-2">
        <p className="text-sm font-bold text-brand-600">{formatCurrency(toNumber(product.sellingPrice))}</p>
        <p className="text-xs text-ink-400">{product.quantity} {product.unit}</p>
      </div>
    </button>
  );
}
