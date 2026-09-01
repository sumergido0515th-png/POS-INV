"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { Search } from "lucide-react";
import { PosProduct, CartLine } from "@/lib/pos-types";
import { toNumber, cn } from "@/lib/utils";
import { ProductCard } from "@/components/pos/product-card";
import { CartPanel } from "@/components/pos/cart-panel";
import { CheckoutModal } from "@/components/pos/checkout-modal";
import { Receipt, ReceiptData } from "@/components/pos/receipt";
import { PaymentMethod } from "@/lib/types";

type Category = { id: string; name: string };
type Settings = { businessName: string; address: string | null; phone: string | null; taxRate: string | number; currency: string; receiptFooter: string | null };

export default function PosPage() {
  const { data: session } = useSession();
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProducts() {
    const res = await fetch("/api/products?activeOnly=true");
    setProducts(await res.json());
  }

  useEffect(() => {
    Promise.all([
      loadProducts(),
      fetch("/api/categories").then((r) => r.json()).then(setCategories),
      fetch("/api/settings").then((r) => r.json()).then(setSettings),
    ]).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter && p.category.id !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.brand?.name.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [products, search, categoryFilter]);

  function addToCart(product: PosProduct) {
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          toast.error("No more stock available");
          return prev;
        }
        return prev.map((l) =>
          l.productId === product.id ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          unitPrice: toNumber(product.sellingPrice),
          quantity: 1,
          maxQuantity: product.quantity,
          unit: product.unit,
        },
      ];
    });
  }

  function increase(id: string) {
    setCart((prev) =>
      prev.map((l) => (l.productId === id && l.quantity < l.maxQuantity ? { ...l, quantity: l.quantity + 1 } : l))
    );
  }

  function decrease(id: string) {
    setCart((prev) =>
      prev
        .map((l) => (l.productId === id ? { ...l, quantity: l.quantity - 1 } : l))
        .filter((l) => l.quantity > 0)
    );
  }

  function remove(id: string) {
    setCart((prev) => prev.filter((l) => l.productId !== id));
  }

  const subtotal = cart.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);

  async function handleConfirm(payload: {
    discount: number;
    paymentMethod: PaymentMethod;
    amountPaid: number;
    customerName: string;
    customerPhone: string;
  }) {
    const res = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        discount: payload.discount,
        paymentMethod: payload.paymentMethod,
        amountPaid: payload.amountPaid,
        customerName: payload.customerName,
        customerPhone: payload.customerPhone,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to process sale");
    }

    setReceipt({
      invoiceNo: data.invoiceNo,
      createdAt: data.createdAt,
      cashierName: session?.user?.name || "Cashier",
      customerName: data.customerName,
      items: data.items,
      subtotal: data.subtotal,
      discount: data.discount,
      tax: data.tax,
      total: data.total,
      amountPaid: data.amountPaid,
      changeDue: data.changeDue,
      paymentMethod: data.paymentMethod,
    });
    setCart([]);
    setCheckoutOpen(false);
    toast.success("Sale completed!");
    loadProducts();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 h-full">
      <div className="space-y-4 min-w-0">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-400" />
            <input
              className="input pl-9"
              placeholder="Search by name, SKU, or brand…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setCategoryFilter("")}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border shrink-0",
              categoryFilter === "" ? "bg-brand-500 text-white border-brand-500" : "border-ink-200 text-ink-600 hover:bg-ink-50"
            )}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryFilter(c.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border shrink-0",
                categoryFilter === c.id ? "bg-brand-500 text-white border-brand-500" : "border-ink-200 text-ink-600 hover:bg-ink-50"
              )}
            >
              {c.name}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-ink-500">Loading products…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-ink-500">No products match your search.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} onAdd={addToCart} />
            ))}
          </div>
        )}
      </div>

      <div className="lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]">
        <CartPanel
          cart={cart}
          onIncrease={increase}
          onDecrease={decrease}
          onRemove={remove}
          subtotal={subtotal}
          onCheckout={() => setCheckoutOpen(true)}
        />
      </div>

      {checkoutOpen && settings && (
        <CheckoutModal
          subtotal={subtotal}
          taxRate={toNumber(settings.taxRate)}
          currency={settings.currency}
          onClose={() => setCheckoutOpen(false)}
          onConfirm={handleConfirm}
        />
      )}

      {receipt && settings && (
        <Receipt
          sale={receipt}
          businessName={settings.businessName}
          address={settings.address}
          phone={settings.phone}
          footer={settings.receiptFooter}
          currency={settings.currency}
          onClose={() => setReceipt(null)}
        />
      )}
    </div>
  );
}
