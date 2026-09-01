"use client";

import { CartLine } from "@/lib/pos-types";
import { formatCurrency } from "@/lib/utils";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";

export function CartPanel({
  cart,
  onIncrease,
  onDecrease,
  onRemove,
  subtotal,
  onCheckout,
}: {
  cart: CartLine[];
  onIncrease: (id: string) => void;
  onDecrease: (id: string) => void;
  onRemove: (id: string) => void;
  subtotal: number;
  onCheckout: () => void;
}) {
  return (
    <div className="card flex flex-col h-full">
      <div className="p-4 border-b border-ink-100 flex items-center gap-2">
        <ShoppingCart className="h-4 w-4 text-brand-600" />
        <h2 className="font-semibold text-ink-900">Current Sale</h2>
        <span className="badge bg-ink-100 text-ink-600 ml-auto">{cart.length} item(s)</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px]">
        {cart.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-ink-400 text-sm py-10">
            <ShoppingCart className="h-8 w-8 mb-2 opacity-40" />
            Cart is empty. Tap a product to add it.
          </div>
        )}
        {cart.map((line) => (
          <div key={line.productId} className="flex items-center gap-2 py-2 border-b border-ink-50 last:border-0">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink-900 truncate">{line.name}</p>
              <p className="text-xs text-ink-400">
                {formatCurrency(line.unitPrice)} × {line.quantity}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => onDecrease(line.productId)}
                className="h-6 w-6 rounded-md border border-ink-200 flex items-center justify-center hover:bg-ink-50"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-6 text-center text-sm font-medium">{line.quantity}</span>
              <button
                onClick={() => onIncrease(line.productId)}
                disabled={line.quantity >= line.maxQuantity}
                className="h-6 w-6 rounded-md border border-ink-200 flex items-center justify-center hover:bg-ink-50 disabled:opacity-40"
              >
                <Plus className="h-3 w-3" />
              </button>
              <button
                onClick={() => onRemove(line.productId)}
                className="h-6 w-6 rounded-md text-red-500 flex items-center justify-center hover:bg-red-50 ml-1"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
            <p className="w-20 text-right text-sm font-semibold text-ink-900 shrink-0">
              {formatCurrency(line.unitPrice * line.quantity)}
            </p>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-ink-100 space-y-3">
        <div className="flex items-center justify-between text-sm text-ink-500">
          <span>Subtotal</span>
          <span className="font-semibold text-ink-900">{formatCurrency(subtotal)}</span>
        </div>
        <button
          onClick={onCheckout}
          disabled={cart.length === 0}
          className="btn-primary w-full py-3 text-base"
        >
          Charge {formatCurrency(subtotal)}
        </button>
      </div>
    </div>
  );
}
