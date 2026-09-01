"use client";

import { formatCurrency, formatDate } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS, PaymentMethod } from "@/lib/types";
import { X, Printer } from "lucide-react";

export type ReceiptData = {
  invoiceNo: string;
  createdAt: string;
  cashierName: string;
  customerName?: string | null;
  items: { productName: string; sku: string; unitPrice: number | string; quantity: number; lineTotal: number | string }[];
  subtotal: number | string;
  discount: number | string;
  tax: number | string;
  total: number | string;
  amountPaid: number | string;
  changeDue: number | string;
  paymentMethod: PaymentMethod;
};

export function Receipt({
  sale,
  businessName,
  address,
  phone,
  footer,
  currency,
  onClose,
}: {
  sale: ReceiptData;
  businessName: string;
  address?: string | null;
  phone?: string | null;
  footer?: string | null;
  currency: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100 print:hidden">
          <h2 className="font-semibold text-ink-900">Sale Complete</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="btn-secondary py-1.5 px-3 text-xs">
              <Printer className="h-3.5 w-3.5" /> Print
            </button>
            <button onClick={onClose} className="btn-ghost p-1.5">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div id="receipt" className="p-6 font-mono text-xs text-ink-900">
          <div className="text-center mb-3">
            <p className="font-bold text-sm">{businessName}</p>
            {address && <p>{address}</p>}
            {phone && <p>{phone}</p>}
          </div>
          <div className="border-t border-dashed border-ink-300 my-2" />
          <p>Invoice: {sale.invoiceNo}</p>
          <p>Date: {formatDate(sale.createdAt)}</p>
          <p>Cashier: {sale.cashierName}</p>
          {sale.customerName && <p>Customer: {sale.customerName}</p>}
          <div className="border-t border-dashed border-ink-300 my-2" />

          <div className="space-y-1">
            {sale.items.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between">
                  <span>{item.productName}</span>
                </div>
                <div className="flex justify-between text-ink-500">
                  <span>
                    {item.quantity} × {formatCurrency(item.unitPrice, currency)}
                  </span>
                  <span>{formatCurrency(item.lineTotal, currency)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-ink-300 my-2" />

          <div className="space-y-0.5">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(sale.subtotal, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount</span>
              <span>-{formatCurrency(sale.discount, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>{formatCurrency(sale.tax, currency)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm pt-1">
              <span>TOTAL</span>
              <span>{formatCurrency(sale.total, currency)}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span>{PAYMENT_METHOD_LABELS[sale.paymentMethod]}</span>
              <span>{formatCurrency(sale.amountPaid, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span>Change</span>
              <span>{formatCurrency(sale.changeDue, currency)}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-ink-300 my-2" />
          {footer && <p className="text-center">{footer}</p>}
        </div>

        <div className="px-4 pb-4 print:hidden">
          <button onClick={onClose} className="btn-primary w-full">
            New Sale
          </button>
        </div>
      </div>
    </div>
  );
}
