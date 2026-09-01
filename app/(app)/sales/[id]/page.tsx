"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { ArrowLeft, Ban } from "lucide-react";
import { formatCurrency, formatDate, toNumber, cn } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS, PaymentMethod } from "@/lib/types";
import Link from "next/link";

type SaleDetail = {
  id: string;
  invoiceNo: string;
  createdAt: string;
  status: string;
  paymentMethod: PaymentMethod;
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
  amountPaid: string;
  changeDue: string;
  customerName: string | null;
  customerPhone: string | null;
  cashier: { name: string };
  items: { id: string; productName: string; sku: string; unitPrice: string; quantity: number; lineTotal: string }[];
};

export default function SaleDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [voiding, setVoiding] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/sales/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setSale)
      .catch(() => router.push("/sales"))
      .finally(() => setLoading(false));
  }, [params.id, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleVoid() {
    if (!confirm("Void this sale? Stock will be restored.")) return;
    setVoiding(true);
    const res = await fetch(`/api/sales/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "void" }),
    });
    const data = await res.json();
    setVoiding(false);
    if (!res.ok) return toast.error(data.error || "Failed to void sale");
    toast.success("Sale voided");
    load();
  }

  if (loading || !sale) {
    return <p className="text-sm text-ink-500">Loading…</p>;
  }

  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/sales" className="btn-ghost p-2">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-xl font-semibold text-ink-900">Sale {sale.invoiceNo}</h1>
        <span
          className={cn(
            "badge ml-auto",
            sale.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
          )}
        >
          {sale.status}
        </span>
      </div>

      <div className="card p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-ink-400">Date</p>
            <p className="font-medium text-ink-900">{formatDate(sale.createdAt)}</p>
          </div>
          <div>
            <p className="text-ink-400">Cashier</p>
            <p className="font-medium text-ink-900">{sale.cashier.name}</p>
          </div>
          <div>
            <p className="text-ink-400">Payment Method</p>
            <p className="font-medium text-ink-900">{PAYMENT_METHOD_LABELS[sale.paymentMethod]}</p>
          </div>
          {sale.customerName && (
            <div>
              <p className="text-ink-400">Customer</p>
              <p className="font-medium text-ink-900">
                {sale.customerName} {sale.customerPhone && `· ${sale.customerPhone}`}
              </p>
            </div>
          )}
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink-500 border-b border-ink-100">
              <th className="py-2 font-medium">Item</th>
              <th className="py-2 font-medium text-right">Price</th>
              <th className="py-2 font-medium text-right">Qty</th>
              <th className="py-2 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item) => (
              <tr key={item.id} className="border-b border-ink-50 last:border-0">
                <td className="py-2 text-ink-800">
                  {item.productName}
                  <span className="text-ink-400 text-xs block">{item.sku}</span>
                </td>
                <td className="py-2 text-right text-ink-600">{formatCurrency(toNumber(item.unitPrice))}</td>
                <td className="py-2 text-right text-ink-600">{item.quantity}</td>
                <td className="py-2 text-right font-medium text-ink-900">{formatCurrency(toNumber(item.lineTotal))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-1 text-sm ml-auto max-w-xs">
          <div className="flex justify-between">
            <span className="text-ink-500">Subtotal</span>
            <span>{formatCurrency(toNumber(sale.subtotal))}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-500">Discount</span>
            <span>-{formatCurrency(toNumber(sale.discount))}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-500">Tax</span>
            <span>{formatCurrency(toNumber(sale.tax))}</span>
          </div>
          <div className="flex justify-between font-bold text-base pt-1 border-t border-ink-100">
            <span>Total</span>
            <span>{formatCurrency(toNumber(sale.total))}</span>
          </div>
          <div className="flex justify-between text-ink-500">
            <span>Paid</span>
            <span>{formatCurrency(toNumber(sale.amountPaid))}</span>
          </div>
          <div className="flex justify-between text-ink-500">
            <span>Change</span>
            <span>{formatCurrency(toNumber(sale.changeDue))}</span>
          </div>
        </div>

        {isAdmin && sale.status === "COMPLETED" && (
          <button onClick={handleVoid} disabled={voiding} className="btn-danger">
            <Ban className="h-4 w-4" /> Void Sale
          </button>
        )}
      </div>
    </div>
  );
}
