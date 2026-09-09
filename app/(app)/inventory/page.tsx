"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, Search, Pencil, Trash2, Tags } from "lucide-react";
import { formatCurrency, toNumber, cn } from "@/lib/utils";

type Product = {
  id: string;
  sku: string;
  name: string;
  unit: string;
  costPrice: string;
  sellingPrice: string;
  quantity: number;
  reorderLevel: number;
  isActive: boolean;
  category: { name: string };
  brand: { name: string } | null;
};

function InventoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(searchParams.get("lowStock") === "true");
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (showInactive) params.set("activeOnly", "false");
    fetch(`/api/products?${params.toString()}`)
      .then((r) => r.json())
      .then(setProducts)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInactive]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (lowStockOnly && p.quantity > p.reorderLevel) return false;
      if (search) {
        const q = search.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      }
      return true;
    });
  }, [products, search, lowStockOnly]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? Products with sales history will be deactivated instead.`)) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Failed to delete");
      return;
    }
    toast.success(data.deactivated ? "Product deactivated (has sales history)" : "Product deleted");
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-400" />
            <input
              className="input pl-9"
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-600 shrink-0">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="h-4 w-4 rounded border-ink-300"
            />
            Low stock only
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-600 shrink-0">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="h-4 w-4 rounded border-ink-300"
            />
            Show inactive
          </label>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link href="/inventory/catalog" className="btn-secondary">
            <Tags className="h-4 w-4" /> Categories &amp; Brands
          </Link>
          <Link href="/inventory/new" className="btn-primary">
            <Plus className="h-4 w-4" /> Add Product
          </Link>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink-500 border-b border-ink-100 bg-ink-50/50">
              <th className="py-3 px-4 font-medium">Product</th>
              <th className="py-3 px-4 font-medium">Category</th>
              <th className="py-3 px-4 font-medium">Brand</th>
              <th className="py-3 px-4 font-medium text-right">Cost</th>
              <th className="py-3 px-4 font-medium text-right">Price</th>
              <th className="py-3 px-4 font-medium text-right">Stock</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="py-6 text-center text-ink-400">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="py-6 text-center text-ink-400">
                  No products found.
                </td>
              </tr>
            )}
            {filtered.map((p) => {
              const low = p.quantity <= p.reorderLevel;
              return (
                <tr key={p.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/40">
                  <td className="py-3 px-4">
                    <p className="font-medium text-ink-900">{p.name}</p>
                    <p className="text-xs text-ink-400">{p.sku}</p>
                  </td>
                  <td className="py-3 px-4 text-ink-600">{p.category.name}</td>
                  <td className="py-3 px-4 text-ink-600">{p.brand?.name ?? "—"}</td>
                  <td className="py-3 px-4 text-right text-ink-600">{formatCurrency(toNumber(p.costPrice))}</td>
                  <td className="py-3 px-4 text-right font-medium text-ink-900">
                    {formatCurrency(toNumber(p.sellingPrice))}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={cn("font-semibold", low ? "text-red-600" : "text-ink-900")}>
                      {p.quantity}
                    </span>
                    <span className="text-ink-400"> {p.unit}</span>
                  </td>
                  <td className="py-3 px-4">
                    {!p.isActive ? (
                      <span className="badge bg-ink-100 text-ink-500">Inactive</span>
                    ) : low ? (
                      <span className="badge bg-amber-100 text-amber-700">Low stock</span>
                    ) : (
                      <span className="badge bg-emerald-100 text-emerald-700">In stock</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end gap-1">
                      <Link href={`/inventory/${p.id}`} className="btn-ghost p-2">
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button onClick={() => handleDelete(p.id, p.name)} className="btn-ghost p-2 text-red-500 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<p className="text-sm text-ink-500">Loading…</p>}>
      <InventoryContent />
    </Suspense>
  );
}
