export type PosProduct = {
  id: string;
  sku: string;
  name: string;
  unit: string;
  sellingPrice: string | number;
  quantity: number;
  reorderLevel: number;
  imageUrl: string | null;
  category: { id: string; name: string };
  brand: { id: string; name: string } | null;
};

export type CartLine = {
  productId: string;
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  maxQuantity: number;
  unit: string;
};
