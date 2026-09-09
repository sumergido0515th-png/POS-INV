"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { DollarSign, ShoppingBag, AlertTriangle, Package } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

type Summary = {
  todayTotal: number;
  todayCount: number;
  rangeTotal: number;
  rangeCount: number;
  trend: { date: string; sales: number; revenue: number }[];
  topProducts: { name: string; sku: string; qty: number; revenue: number }[];
  lowStock: { id: string; name: string; sku: string; quantity: number; reorderLevel: number }[];
  lowStockCount: number;
  totalProducts: number;
  inventoryValue: number;
};

export default function DashboardPage() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/summary?days=14")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return <div className="text-ink-500 text-sm">Loading dashboard…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today's Sales"
          value={formatCurrency(data.todayTotal)}
          hint={`${data.todayCount} transaction(s)`}
          icon={DollarSign}
        />
        <StatCard
          label="Sales (14 days)"
          value={formatCurrency(data.rangeTotal)}
          hint={`${data.rangeCount} transaction(s)`}
          icon={ShoppingBag}
          tone="success"
        />
        <StatCard
          label="Low Stock Items"
          value={String(data.lowStockCount)}
          hint="At or below reorder level"
          icon={AlertTriangle}
          tone={data.lowStockCount > 0 ? "danger" : "default"}
        />
        <StatCard
          label="Inventory Value"
          value={formatCurrency(data.inventoryValue)}
          hint={`${data.totalProducts} active products (at cost)`}
          icon={Package}
          tone="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-4 lg:col-span-2">
          <h2 className="font-semibold text-ink-900 mb-4">Revenue — last 14 days</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.trend}>
              <defs>
                <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f9490c" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f9490c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => d.slice(5)}
                fontSize={12}
                stroke="#8591a9"
              />
              <YAxis fontSize={12} stroke="#8591a9" width={70} tickFormatter={(v) => formatCurrency(v)} />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(l) => `Date: ${l}`}
              />
              <Area type="monotone" dataKey="revenue" stroke="#f9490c" fill="url(#revenue)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-4">
          <h2 className="font-semibold text-ink-900 mb-4">Top Products</h2>
          <div className="space-y-3">
            {data.topProducts.length === 0 && (
              <p className="text-sm text-ink-400">No sales in this period yet.</p>
            )}
            {data.topProducts.map((p) => (
              <div key={p.sku} className="flex items-center justify-between text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-ink-800 truncate">{p.name}</p>
                  <p className="text-xs text-ink-400">{p.sku}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="font-semibold text-ink-900">{p.qty} sold</p>
                  <p className="text-xs text-ink-400">{formatCurrency(p.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-ink-900">Low Stock Alerts</h2>
          <Link href="/inventory?lowStock=true" className="text-sm text-brand-600 hover:underline">
            View all in inventory →
          </Link>
        </div>
        {data.lowStock.length === 0 ? (
          <p className="text-sm text-ink-400">All products are sufficiently stocked. 🎉</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-500 border-b border-ink-100">
                  <th className="py-2 font-medium">Product</th>
                  <th className="py-2 font-medium">SKU</th>
                  <th className="py-2 font-medium text-right">In Stock</th>
                  <th className="py-2 font-medium text-right">Reorder Level</th>
                </tr>
              </thead>
              <tbody>
                {data.lowStock.map((p) => (
                  <tr key={p.id} className="border-b border-ink-50 last:border-0">
                    <td className="py-2 text-ink-800">{p.name}</td>
                    <td className="py-2 text-ink-500">{p.sku}</td>
                    <td className="py-2 text-right font-semibold text-red-600">{p.quantity}</td>
                    <td className="py-2 text-right text-ink-500">{p.reorderLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
