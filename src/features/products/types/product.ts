export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  supplier: string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  minimumStock: number;
  status: "active" | "inactive";
}