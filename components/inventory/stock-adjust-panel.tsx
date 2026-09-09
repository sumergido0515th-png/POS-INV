"use client";

import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import { MovementType, MOVEMENT_TYPE_LABELS } from "@/lib/types";
import { Loader2 } from "lucide-react";

const ADJUST_TYPES: MovementType[] = ["RECEIVE", "ADJUSTMENT_IN", "ADJUSTMENT_OUT"];

export function StockAdjustPanel({
  productId,
  currentQuantity,
  onAdjusted,
}: {
  productId: string;
  currentQuantity: number;
  onAdjusted: () => void;
}) {
  const [type, setType] = useState<MovementType>("RECEIVE");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const res = await fetch("/api/stock/adjust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, type, quantity, reason }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Failed to adjust stock");
      return;
    }

    toast.success("Stock updated");
    setQuantity("");
    setReason("");
    onAdjusted();
  }

  return (
    <form onSubmit={handleSubmit} className="card p-4 space-y-3">
      <h3 className="font-semibold text-ink-900">Adjust Stock</h3>
      <p className="text-sm text-ink-500">
        Current quantity: <span className="font-semibold text-ink-900">{currentQuantity}</span>
      </p>

      <div>
        <label className="label">Type</label>
        <div className="grid grid-cols-1 gap-2">
          {ADJUST_TYPES.map((t) => (
            <label key={t} className="flex items-center gap-2 text-sm border border-ink-200 rounded-lg px-3 py-2 cursor-pointer has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
              <input type="radio" name="type" checked={type === t} onChange={() => setType(t)} />
              {MOVEMENT_TYPE_LABELS[t]}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Quantity</label>
        <input
          type="number"
          min={1}
          required
          className="input"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
      </div>

      <div>
        <label className="label">Reason / Note</label>
        <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Supplier delivery, stock count correction" />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      )}

      <button type="submit" disabled={submitting} className="btn-primary w-full">
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Apply
      </button>
    </form>
  );
}
