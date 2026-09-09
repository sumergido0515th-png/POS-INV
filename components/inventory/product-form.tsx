"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

type Option = { id: string; name: string };

type ProductFormValues = {
  sku: string;
  barcode: string;
  name: string;
  description: string;
  unit: string;
  costPrice: string;
  sellingPrice: string;
  quantity: string;
  reorderLevel: string;
  categoryId: string;
  brandId: string;
  supplierId: string;
  isActive: boolean;
};

const EMPTY: ProductFormValues = {
  sku: "",
  barcode: "",
  name: "",
  description: "",
  unit: "pc",
  costPrice: "",
  sellingPrice: "",
  quantity: "0",
  reorderLevel: "5",
  categoryId: "",
  brandId: "",
  supplierId: "",
  isActive: true,
};

export function ProductForm({
  mode,
  productId,
  initial,
}: {
  mode: "create" | "edit";
  productId?: string;
  initial?: Partial<ProductFormValues>;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ProductFormValues>({ ...EMPTY, ...initial });
  const [categories, setCategories] = useState<Option[]>([]);
  const [brands, setBrands] = useState<Option[]>([]);
  const [suppliers, setSuppliers] = useState<Option[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
    fetch("/api/brands").then((r) => r.json()).then(setBrands);
    fetch("/api/suppliers").then((r) => r.json()).then(setSuppliers);
  }, []);

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const url = mode === "create" ? "/api/products" : `/api/products/${productId}`;
    const method = mode === "create" ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Please check the form for errors.");
      return;
    }

    toast.success(mode === "create" ? "Product created" : "Product updated");
    router.push("/inventory");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card p-5 space-y-5 max-w-3xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">SKU *</label>
          <input required className="input" value={values.sku} onChange={(e) => set("sku", e.target.value)} />
        </div>
        <div>
          <label className="label">Barcode</label>
          <input className="input" value={values.barcode} onChange={(e) => set("barcode", e.target.value)} />
        </div>
      </div>

      <div>
        <label className="label">Product Name *</label>
        <input required className="input" value={values.name} onChange={(e) => set("name", e.target.value)} />
      </div>

      <div>
        <label className="label">Description</label>
        <textarea
          className="input"
          rows={2}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="label">Category *</label>
          <select required className="input" value={values.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
            <option value="">Select…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Brand / Compatibility</label>
          <select className="input" value={values.brandId} onChange={(e) => set("brandId", e.target.value)}>
            <option value="">None</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Supplier</label>
          <select className="input" value={values.supplierId} onChange={(e) => set("supplierId", e.target.value)}>
            <option value="">None</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <label className="label">Unit</label>
          <input className="input" value={values.unit} onChange={(e) => set("unit", e.target.value)} placeholder="pc, set, liter" />
        </div>
        <div>
          <label className="label">Cost Price *</label>
          <input required type="number" step="0.01" min={0} className="input" value={values.costPrice} onChange={(e) => set("costPrice", e.target.value)} />
        </div>
        <div>
          <label className="label">Selling Price *</label>
          <input required type="number" step="0.01" min={0} className="input" value={values.sellingPrice} onChange={(e) => set("sellingPrice", e.target.value)} />
        </div>
        <div>
          <label className="label">Reorder Level</label>
          <input type="number" min={0} className="input" value={values.reorderLevel} onChange={(e) => set("reorderLevel", e.target.value)} />
        </div>
      </div>

      {mode === "create" ? (
        <div className="sm:w-1/4">
          <label className="label">Initial Quantity</label>
          <input type="number" min={0} className="input" value={values.quantity} onChange={(e) => set("quantity", e.target.value)} />
          <p className="text-xs text-ink-400 mt-1">
            Use Stock Adjustments later to change quantity — this keeps history accurate.
          </p>
        </div>
      ) : (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={values.isActive}
            onChange={(e) => set("isActive", e.target.checked)}
            className="h-4 w-4 rounded border-ink-300"
          />
          Active (visible in POS)
        </label>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "create" ? "Create Product" : "Save Changes"}
        </button>
        <button type="button" onClick={() => router.push("/inventory")} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}
