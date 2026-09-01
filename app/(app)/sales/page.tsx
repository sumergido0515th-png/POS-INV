"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Search, Eye } from "lucide-react";
import { formatCurrency, formatDate, toNumber, cn } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS, PaymentMethod } from "@/lib/types";

type Sale = {
  id: string;
  invoiceNo: string;
  createdAt: string;
  total: string;
  paymentMethod: PaymentMethod;
  status: string;
  cashier: { name: string };
  items: { id: string }[];
};

export default function SalesPage() {
  const { data: session } = useSession();
  const [sales, setSales] = useState<Sale[]>([]);
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (session?.user?.role === "CASHIER") params.set("cashierId", session.user.id);
    fetch(`/api/sales?${params.toString()}`)
      .then((r) => r.json())
      .then(setSales)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (session) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const total = sales
    .filter((s) => s.status === "COMPLETED")
    .reduce((sum, s) => sum + toNumber(s.total), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 items-end sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-end">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-400" />
            <input
              className="input pl-9 w-48"
              placeholder="Invoice no."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
            />
          </div>
          <div>
            <label className="label">From</label>
            <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="label">To</label>
            <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <button onClick={load} className="btn-secondary">
            Filter
          </button>
        </div>
        <div className="text-right">
          <p className="text-xs text-ink-500">Total (filtered)</p>
          <p className="text-lg font-bold text-ink-900">{formatCurrency(total)}</p>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink-500 border-b border-ink-100 bg-ink-50/50">
              <th className="py-3 px-4 font-medium">Invoice</th>
              <th className="py-3 px-4 font-medium">Date</th>
              <th className="py-3 px-4 font-medium">Cashier</th>
              <th className="py-3 px-4 font-medium">Items</th>
              <th className="py-3 px-4 font-medium">Payment</th>
              <th className="py-3 px-4 font-medium text-right">Total</th>
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
            {!loading && sales.length === 0 && (
              <tr>
                <td colSpan={8} className="py-6 text-center text-ink-400">
                  No sales found.
                </td>
              </tr>
            )}
            {sales.map((s) => (
              <tr key={s.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/40">
                <td className="py-3 px-4 font-medium text-ink-900">{s.invoiceNo}</td>
                <td className="py-3 px-4 text-ink-600">{formatDate(s.createdAt)}</td>
                <td className="py-3 px-4 text-ink-600">{s.cashier.name}</td>
                <td className="py-3 px-4 text-ink-600">{s.items.length}</td>
                <td className="py-3 px-4 text-ink-600">{PAYMENT_METHOD_LABELS[s.paymentMethod]}</td>
                <td className="py-3 px-4 text-right font-semibold text-ink-900">{formatCurrency(toNumber(s.total))}</td>
                <td className="py-3 px-4">
                  <span
                    className={cn(
                      "badge",
                      s.status === "COMPLETED"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    )}
                  >
                    {s.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <Link href={`/sales/${s.id}`} className="btn-ghost p-2 inline-flex">
                    <Eye className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
