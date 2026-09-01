import { ProductForm } from "@/components/inventory/product-form";

export default function NewProductPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-ink-900">Add Product</h1>
      <ProductForm mode="create" />
    </div>
  );
}
