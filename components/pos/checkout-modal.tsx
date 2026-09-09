"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { PaymentMethod, PAYMENT_METHOD_LABELS } from "@/lib/types";
import { X, Loader2 } from "lucide-react";

const QUICK_CASH = [100, 200, 500, 1000];

export function CheckoutModal({
  subtotal,
  taxRate,
  currency,
  onClose,
  onConfirm,
}: {
  subtotal: number;
  taxRate: number;
  currency: string;
  onClose: () => void;
  onConfirm: (payload: {
    discount: number;
    paymentMethod: PaymentMethod;
    amountPaid: number;
    customerName: string;
    customerPhone: string;
  }) => Promise<void>;
}) {
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const discountedSubtotal = Math.max(0, subtotal - discount);
  const tax = (discountedSubtotal * taxRate) / 100;
  const total = discountedSubtotal + tax;
  const paid = parseFloat(amountPaid) || 0;
  const change = Math.max(0, paid - total);
  const canSubmit = paid >= total && !submitting;

  async function handleSubmit() {
    setError("");
    if (paid < total) {
      setError("Amount paid must cover the total.");
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm({
        discount,
        paymentMethod,
        amountPaid: paid,
        customerName,
        customerPhone,
      });
    } catch (e: any) {
      setError(e.message || "Failed to process sale");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
          <h2 className="font-semibold text-lg text-ink-900">Checkout</h2>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-500">Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal, currency)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-ink-500">Discount</span>
              <input
                type="number"
                min={0}
                max={subtotal}
                value={discount || ""}
                onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="input w-28 text-right py-1"
                placeholder="0.00"
              />
            </div>
            <div className="flex justify-between">
              <span className="text-ink-500">Tax ({taxRate}%)</span>
              <span className="font-medium">{formatCurrency(tax, currency)}</span>
            </div>
            <div className="flex justify-between text-base font-bold pt-2 border-t border-ink-100">
              <span>Total</span>
              <span className="text-brand-600">{formatCurrency(total, currency)}</span>
            </div>
          </div>

          <div>
            <label className="label">Payment Method</label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={
                    "rounded-lg border px-2 py-2 text-xs font-medium " +
                    (paymentMethod === method
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-ink-200 text-ink-600 hover:bg-ink-50")
                  }
                >
                  {PAYMENT_METHOD_LABELS[method]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label" htmlFor="amountPaid">
              Amount Tendered
            </label>
            <input
              id="amountPaid"
              type="number"
              min={0}
              step="0.01"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              className="input text-lg font-semibold"
              placeholder="0.00"
              autoFocus
            />
            {paymentMethod === "CASH" && (
              <div className="flex flex-wrap gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setAmountPaid(String(total.toFixed(2)))}
                  className="btn-secondary py-1 px-2 text-xs"
                >
                  Exact
                </button>
                {QUICK_CASH.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAmountPaid(String(v))}
                    className="btn-secondary py-1 px-2 text-xs"
                  >
                    ₱{v}
                  </button>
                ))}
              </div>
            )}
            <p className="text-sm text-ink-500 mt-2">
              Change: <span className="font-semibold text-ink-900">{formatCurrency(change, currency)}</span>
            </p>
          </div>

          <details className="text-sm">
            <summary className="text-ink-500 cursor-pointer select-none">
              Customer info (optional)
            </summary>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <input
                className="input"
                placeholder="Customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
              <input
                className="input"
                placeholder="Phone number"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>
          </details>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button onClick={handleSubmit} disabled={!canSubmit} className="btn-primary w-full py-3 text-base">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Complete Sale
          </button>
        </div>
      </div>
    </div>
  );
}
