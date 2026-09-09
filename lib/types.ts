// SQLite has no native enum support, so Prisma models store these as plain
// strings (see prisma/schema.prisma). These union types are the app-level
// source of truth for allowed values — keep them in sync with lib/validations.ts.

export type Role = "ADMIN" | "CASHIER";

export type MovementType = "RECEIVE" | "ADJUSTMENT_IN" | "ADJUSTMENT_OUT" | "SALE" | "RETURN";

export type PaymentMethod = "CASH" | "GCASH" | "CARD" | "BANK_TRANSFER";

export type SaleStatus = "COMPLETED" | "VOIDED" | "REFUNDED";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Cash",
  GCASH: "GCash",
  CARD: "Card",
  BANK_TRANSFER: "Bank Transfer",
};

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  RECEIVE: "Stock Received",
  ADJUSTMENT_IN: "Adjustment (+)",
  ADJUSTMENT_OUT: "Adjustment (-)",
  SALE: "Sale",
  RETURN: "Return / Void",
};
