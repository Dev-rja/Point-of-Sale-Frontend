// src/api/products.ts
import api from "./client";
import type { Product } from "../App";

// Shape returned by your Flask /products endpoint
interface BackendProduct {
  product_id: number;
  product_name: string;
  category_id: number | null;
  category_name: string | null;
  price: number;
  stock_quantity: number;
  unit: string;
  image_path?: string | null;
  expiry_date?: string | null;
}

// Convert Flask DB format -> your React Product type
function convertToFrontend(p: BackendProduct): Product {
  return {
    id: String(p.product_id),
    name: p.product_name,
    category: p.category_name || "Uncategorized",
    price: p.price,
    stock: p.stock_quantity,
    barcode: "",     // Flask does not have these fields yet
    minStock: 0,     // you can add later to DB if needed
  };
}

// ======================= API Calls =======================

// Load products
export async function fetchProducts(): Promise<Product[]> {
  const res = await api.get<BackendProduct[]>("/products");
  return res.data.map(convertToFrontend);
}

// Add new product
export async function createProduct(
    input: Omit<Product, "id">,
    createdBy?: string
  ): Promise<void> {
    await api.post("/products", {
      product_name: input.name,
      price: input.price,
      stock_quantity: input.stock,
      unit: "pcs",
      created_by: createdBy ?? "Unknown",
      // // Later: send category_id when you connect real categories table
    });
  }
  
// Edit product
export async function updateProduct(
  id: string,
  updates: Partial<Product>
): Promise<void> {
  const body: any = {};
  if (updates.name !== undefined) body.product_name = updates.name;
  if (updates.price !== undefined) body.price = updates.price;
  if (updates.stock !== undefined) body.stock_quantity = updates.stock;

  await api.put(`/api/update_product/${id}`, body);
}
