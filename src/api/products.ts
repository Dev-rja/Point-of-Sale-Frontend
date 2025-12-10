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
  min_stock: number | null;
  unit: string;
  image_path?: string | null;
  expiry_date?: string | null;
  barcode?: string | null;
}

const CATEGORY_MAP: Record<string, number> = {
    Groceries: 1,
    Beverages: 2,
    Food: 3,
    Snacks: 4,
    Dairy: 5,
    Frozen: 6,
    Bakery: 7,
    "Meat & Seafood": 8,
    "Fruits & Vegetables": 9,
    "Personal Care": 10,
    Household: 11,
    Other: 12,
  };

// Convert Flask DB format -> your React Product type
function convertToFrontend(p: BackendProduct): Product {
  return {
    id: String(p.product_id),
    name: p.product_name,
    category: p.category_name || "Uncategorized",
    categoryId: p.category_id,
    price: p.price,
    stock: p.stock_quantity,
    barcode: "",     // Flask does not have these fields yet
    minStock: p.min_stock ?? 0,
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
      category_name: input.category,
      price: input.price,
      stock_quantity: input.stock,
      unit: "pcs",
      min_stock: input.minStock,
      barcode: input.barcode, 
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
  if (updates.category !== undefined)
    body.category_id = CATEGORY_MAP[updates.category] ?? null;
  if (updates.minStock !== undefined) body.min_stock = updates.minStock;
  if (updates.barcode !== undefined) body.barcode = updates.barcode; 

  await api.put(`/api/update_product/${id}`, body);
}
