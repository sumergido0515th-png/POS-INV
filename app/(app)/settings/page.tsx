"use client";

import { FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Save } from "lucide-react";

type SettingsForm = {
  businessName: string;
  address: string;
  phone: string;
  email: string;
  taxRate: string;
  currency: string;
  receiptFooter: string;
  lowStockThreshold: string;
};

export default function SettingsPage() {
  const [form, setForm] = useState<SettingsForm | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) =>
        setForm({
          businessName: d.businessName,
          address: d.address || "",
          phone: d.phone || "",
          email: d.email || "",
          taxRate: String(d.taxRate),
          currency: d.currency,
          receiptFooter: d.receiptFooter || "",
          lowStockThreshold: String(d.lowStockThreshold),
        })
      );
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSubmitting(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSubmitting(false);
    if (!res.ok) {
      toast.error("Failed to save settings");
      return;
    }
    toast.success("Settings saved");
  }

  if (!form) return <p className="text-sm text-ink-500">Loading…</p>;

  return (
    <form onSubmit={handleSubmit} className="card p-5 space-y-4 max-w-xl">
      <h2 className="font-semibold text-ink-900">Business Information</h2>

      <div>
        <label className="label">Business Name</label>
        <input required className="input" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
      </div>
      <div>
        <label className="label">Address</label>
        <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Phone</label>
          <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
      </div>

      <hr className="border-ink-100" />
      <h2 className="font-semibold text-ink-900">Sales Configuration</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Tax Rate (%)</label>
          <input type="number" step="0.01" min={0} className="input" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} />
        </div>
        <div>
          <label className="label">Currency</label>
          <input className="input" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="label">Default Low Stock Threshold</label>
        <input type="number" min={0} className="input" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} />
      </div>
      <div>
        <label className="label">Receipt Footer</label>
        <textarea rows={2} className="input" value={form.receiptFooter} onChange={(e) => setForm({ ...form, receiptFooter: e.target.value })} />
      </div>

      <button type="submit" disabled={submitting} className="btn-primary">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save Settings
      </button>
    </form>
  );
}
