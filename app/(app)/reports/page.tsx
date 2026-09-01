"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

type Summary = {
  rangeTotal: number;
  rangeCount: number;
  trend: { date: string; sales: number; revenue: number }[];
  topProducts: { name: string; sku: string; qty: number; revenue: number }[];
  lowStock: { id: string; name: string; sku: string; quantity: number; reorderLevel: number }[];
  inventoryValue: number;
};

const RANGE_OPTIONS = [7, 14, 30, 90];

export default function ReportsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports/summary?days=${days}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [days]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-ink-500">Range:</span>
        {RANGE_OPTIONS.map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={
              "px-3 py-1.5 rounded-full text-xs font-medium border " +
              (days === d ? "bg-brand-500 text-white border-brand-500" : "border-ink-200 text-ink-600 hover:bg-ink-50")
            }
          >
            {d} days
          </button>
        ))}
      </div>

      {loading || !data ? (
        <p className="text-sm text-ink-500">Loading report…</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-4">
              <p className="text-xs text-ink-500">Total Revenue</p>
              <p className="text-2xl font-bold text-ink-900">{formatCurrency(data.rangeTotal)}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-ink-500">Transactions</p>
              <p className="text-2xl font-bold text-ink-900">{data.rangeCount}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-ink-500">Inventory Value (cost)</p>
              <p className="text-2xl font-bold text-ink-900">{formatCurrency(data.inventoryValue)}</p>
            </div>
          </div>

          <div className="card p-4">
            <h2 className="font-semibold text-ink-900 mb-4">Sales Volume by Day</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" />
                <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} fontSize={12} stroke="#8591a9" />
                <YAxis fontSize={12} stroke="#8591a9" width={70} tickFormatter={(v) => formatCurrency(v)} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="revenue" fill="#f9490c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card p-4">
              <h2 className="font-semibold text-ink-900 mb-3">Best Sellers</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ink-500 border-b border-ink-100">
                    <th className="py-2 font-medium">Product</th>
                    <th className="py-2 font-medium text-right">Qty Sold</th>
                    <th className="py-2 font-medium text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProducts.map((p) => (
                    <tr key={p.sku} className="border-b border-ink-50 last:border-0">
                      <td className="py-2 text-ink-800">{p.name}</td>
                      <td className="py-2 text-right">{p.qty}</td>
                      <td className="py-2 text-right font-medium">{formatCurrency(p.revenue)}</td>
                    </tr>
                  ))}
                  {data.topProducts.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-ink-400">
                        No sales in this range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="card p-4">
              <h2 className="font-semibold text-ink-900 mb-3">Low Stock</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ink-500 border-b border-ink-100">
                    <th className="py-2 font-medium">Product</th>
                    <th className="py-2 font-medium text-right">Stock</th>
                    <th className="py-2 font-medium text-right">Reorder At</th>
                  </tr>
                </thead>
                <tbody>
                  {data.lowStock.map((p) => (
                    <tr key={p.id} className="border-b border-ink-50 last:border-0">
                      <td className="py-2 text-ink-800">{p.name}</td>
                      <td className="py-2 text-right font-semibold text-red-600">{p.quantity}</td>
                      <td className="py-2 text-right text-ink-500">{p.reorderLevel}</td>
                    </tr>
                  ))}
                  {data.lowStock.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-ink-400">
                        All stocked up.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
