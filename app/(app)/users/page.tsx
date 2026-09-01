"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";
import { Role, ROLE_LABELS } from "@/lib/rbac";
import { cn } from "@/lib/utils";

type User = {
  id: string;
  name: string;
  username: string;
  email: string | null;
  role: Role;
  isActive: boolean;
};

const EMPTY_FORM = { name: "", username: "", email: "", password: "", role: "CASHIER" as Role, isActive: true };

export default function UsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [editing, setEditing] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch("/api/users")
      .then((r) => r.json())
      .then(setUsers)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remove "${name}"?`)) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error || "Failed to remove user");
    toast.success(data.deactivated ? "User deactivated (has sales history)" : "User removed");
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-ink-500">Manage who can access the system and what they can do.</p>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" /> Add User
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink-500 border-b border-ink-100 bg-ink-50/50">
              <th className="py-3 px-4 font-medium">Name</th>
              <th className="py-3 px-4 font-medium">Username</th>
              <th className="py-3 px-4 font-medium">Email</th>
              <th className="py-3 px-4 font-medium">Role</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-ink-400">
                  Loading…
                </td>
              </tr>
            )}
            {!loading &&
              users.map((u) => (
                <tr key={u.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/40">
                  <td className="py-3 px-4 font-medium text-ink-900">
                    {u.name} {u.id === session?.user?.id && <span className="text-xs text-ink-400">(you)</span>}
                  </td>
                  <td className="py-3 px-4 text-ink-600">{u.username}</td>
                  <td className="py-3 px-4 text-ink-600">{u.email || "—"}</td>
                  <td className="py-3 px-4">
                    <span className={cn("badge", u.role === "ADMIN" ? "bg-brand-100 text-brand-700" : "bg-ink-100 text-ink-600")}>
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={cn("badge", u.isActive ? "bg-emerald-100 text-emerald-700" : "bg-ink-100 text-ink-500")}>
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => {
                          setEditing(u);
                          setShowForm(true);
                        }}
                        className="btn-ghost p-2"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(u.id, u.name)}
                        disabled={u.id === session?.user?.id}
                        className="btn-ghost p-2 text-red-500 hover:bg-red-50 disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <UserFormModal
          user={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function UserFormModal({
  user,
  onClose,
  onSaved,
}: {
  user: User | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(
    user
      ? { name: user.name, username: user.username, email: user.email || "", password: "", role: user.role, isActive: user.isActive }
      : EMPTY_FORM
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const url = user ? `/api/users/${user.id}` : "/api/users";
    const method = user ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Please check the form");
      return;
    }
    toast.success(user ? "User updated" : "User created");
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl w-full max-w-md p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg text-ink-900">{user ? "Edit User" : "Add User"}</h2>
          <button type="button" onClick={onClose} className="btn-ghost p-1.5">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div>
          <label className="label">Full Name *</label>
          <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Username *</label>
          <input required className="input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="label">{user ? "New Password (leave blank to keep)" : "Password *"}</label>
          <input
            type="password"
            required={!user}
            minLength={6}
            className="input"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Role</label>
          <select
            className="input"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
          >
            <option value="CASHIER">Cashier</option>
            <option value="ADMIN">Owner / Admin</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            className="h-4 w-4 rounded border-ink-300"
          />
          Active
        </label>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
        )}

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {user ? "Save Changes" : "Create User"}
        </button>
      </form>
    </div>
  );
}
