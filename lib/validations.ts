import { z } from "zod";

export const productSchema = z.object({
  sku: z.string().min(1, "SKU is required").max(64),
  barcode: z.string().max(64).optional().or(z.literal("")),
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(1000).optional().or(z.literal("")),
  unit: z.string().min(1).max(20).default("pc"),
  costPrice: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
  quantity: z.coerce.number().int().min(0).default(0),
  reorderLevel: z.coerce.number().int().min(0).default(5),
  categoryId: z.string().min(1, "Category is required"),
  brandId: z.string().optional().or(z.literal("")),
  supplierId: z.string().optional().or(z.literal("")),
  imageUrl: z.string().optional().or(z.literal("")),
  isActive: z.coerce.boolean().default(true),
});

export const categorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().or(z.literal("")),
});

export const brandSchema = z.object({
  name: z.string().min(1).max(100),
});

export const supplierSchema = z.object({
  name: z.string().min(1).max(200),
  contactPerson: z.string().max(200).optional().or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
});

export const stockAdjustSchema = z.object({
  productId: z.string().min(1),
  type: z.enum(["ADJUSTMENT_IN", "ADJUSTMENT_OUT", "RECEIVE"]),
  quantity: z.coerce.number().int().positive(),
  reason: z.string().max(300).optional().or(z.literal("")),
});

export const saleItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
});

export const saleSchema = z.object({
  items: z.array(saleItemSchema).min(1, "Cart is empty"),
  discount: z.coerce.number().min(0).default(0),
  paymentMethod: z.enum(["CASH", "GCASH", "CARD", "BANK_TRANSFER"]),
  amountPaid: z.coerce.number().min(0),
  customerName: z.string().max(200).optional().or(z.literal("")),
  customerPhone: z.string().max(50).optional().or(z.literal("")),
});

export const userSchema = z.object({
  name: z.string().min(1).max(200),
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9._-]+$/, "Letters, numbers, dot, underscore, dash only"),
  email: z.string().email().optional().or(z.literal("")),
  password: z.string().min(6).max(100).optional(),
  role: z.enum(["ADMIN", "CASHIER"]),
  isActive: z.coerce.boolean().default(true),
});

export const settingsSchema = z.object({
  businessName: z.string().min(1).max(200),
  address: z.string().max(500).optional().or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  currency: z.string().min(1).max(10).default("PHP"),
  receiptFooter: z.string().max(500).optional().or(z.literal("")),
  lowStockThreshold: z.coerce.number().int().min(0).default(5),
});
