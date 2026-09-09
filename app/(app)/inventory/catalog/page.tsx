"use client";

import { FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Trash2, Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Category = { id: string; name: string; description: string | null; _count: { products: number } };
type Brand = { id: string; name: string; _count: { products: number } };
type Supplier = {
  id: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  _count: { products: number };
};

type Tab = "categories" | "brands" | "suppliers";

export default function CatalogPage() {
  const [tab, setTab] = useState<Tab>("categories");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/inventory" className="btn-ghost p-2">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-xl font-semibold text-ink-900">Categories, Brands &amp; Suppliers</h1>
      </div>

      <div className="flex gap-2 border-b border-ink-100">
        {(["categories", "brands", "suppliers"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px",
              tab === t ? "border-brand-500 text-brand-600" : "border-transparent text-ink-500 hover:text-ink-800"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "categories" && <CategoriesTab />}
      {tab === "brands" && <BrandsTab />}
      {tab === "suppliers" && <SuppliersTab />}
    </div>
  );
}

function CategoriesTab() {
  const [items, setItems] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function load() {
    fetch("/api/categories").then((r) => r.json()).then(setItems);
  }
  useEffect(load, []);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error || "Failed to add category");
    setName("");
    setDescription("");
    toast.success("Category added");
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category?")) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error || "Failed to delete");
    toast.success("Deleted");
    load();
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-4">
      <div className="card divide-y divide-ink-50">
        {items.map((c) => (
          <div key={c.id} className="flex items-center justify-between p-3">
            <div>
              <p className="font-medium text-ink-900">{c.name}</p>
              {c.description && <p className="text-xs text-ink-400">{c.description}</p>}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-ink-400">{c._count.products} product(s)</span>
              <button onClick={() => handleDelete(c.id)} className="btn-ghost p-2 text-red-500 hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="p-4 text-sm text-ink-400">No categories yet.</p>}
      </div>

      <form onSubmit={handleAdd} className="card p-4 space-y-3 h-fit">
        <h3 className="font-semibold text-ink-900">Add Category</h3>
        <input required className="input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input" placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
        <button type="submit" className="btn-primary w-full">
          <Plus className="h-4 w-4" /> Add
        </button>
      </form>
    </div>
  );
}

function BrandsTab() {
  const [items, setItems] = useState<Brand[]>([]);
  const [name, setName] = useState("");

  function load() {
    fetch("/api/brands").then((r) => r.json()).then(setItems);
  }
  useEffect(load, []);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error || "Failed to add brand");
    setName("");
    toast.success("Brand added");
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this brand?")) return;
    const res = await fetch(`/api/brands/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error || "Failed to delete");
    toast.success("Deleted");
    load();
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-4">
      <div className="card divide-y divide-ink-50">
        {items.map((b) => (
          <div key={b.id} className="flex items-center justify-between p-3">
            <p className="font-medium text-ink-900">{b.name}</p>
            <div className="flex items-center gap-3">
              <span className="text-xs text-ink-400">{b._count.products} product(s)</span>
              <button onClick={() => handleDelete(b.id)} className="btn-ghost p-2 text-red-500 hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="p-4 text-sm text-ink-400">No brands yet.</p>}
      </div>

      <form onSubmit={handleAdd} className="card p-4 space-y-3 h-fit">
        <h3 className="font-semibold text-ink-900">Add Brand</h3>
        <input required className="input" placeholder="e.g. Honda, Universal" value={name} onChange={(e) => setName(e.target.value)} />
        <button type="submit" className="btn-primary w-full">
          <Plus className="h-4 w-4" /> Add
        </button>
      </form>
    </div>
  );
}

function SuppliersTab() {
  const [items, setItems] = useState<Supplier[]>([]);
  const [form, setForm] = useState({ name: "", contactPerson: "", phone: "", email: "", address: "" });

  function load() {
    fetch("/api/suppliers").then((r) => r.json()).then(setItems);
  }
  useEffect(load, []);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error || "Failed to add supplier");
    setForm({ name: "", contactPerson: "", phone: "", email: "", address: "" });
    toast.success("Supplier added");
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this supplier?")) return;
    const res = await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error || "Failed to delete");
    toast.success("Deleted");
    load();
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-4">
      <div className="card divide-y divide-ink-50">
        {items.map((s) => (
          <div key={s.id} className="flex items-center justify-between p-3">
            <div>
              <p className="font-medium text-ink-900">{s.name}</p>
              <p className="text-xs text-ink-400">
                {[s.contactPerson, s.phone, s.email].filter(Boolean).join(" · ") || "No contact info"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-ink-400">{s._count.products} product(s)</span>
              <button onClick={() => handleDelete(s.id)} className="btn-ghost p-2 text-red-500 hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="p-4 text-sm text-ink-400">No suppliers yet.</p>}
      </div>

      <form onSubmit={handleAdd} className="card p-4 space-y-3 h-fit">
        <h3 className="font-semibold text-ink-900">Add Supplier</h3>
        <input required className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="input" placeholder="Contact person" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
        <input className="input" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="input" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="input" placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <button type="submit" className="btn-primary w-full">
          <Plus className="h-4 w-4" /> Add
        </button>
      </form>
    </div>
  );
}
