// src/api/categories.ts
import api from "./client";

export interface Category {
  id: number;
  name: string;
  imagePath: string | null;
}

// Match your Flask /categories GET response
interface BackendCategory {
  category_id: number;
  category_name: string;
  image_path: string | null;
}

// Load categories from Flask
export async function fetchCategories(): Promise<Category[]> {
  const res = await api.get<BackendCategory[]>("/categories");
  return res.data.map(c => ({
    id: c.category_id,
    name: c.category_name,
    imagePath: c.image_path ?? null,
  }));
}

// Add new category (uses /api/add_category which expects form field "name")
export async function createCategory(name: string): Promise<Category> {
  const formData = new FormData();
  formData.append("name", name);

  const res = await api.post("/api/add_category", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  // Response: { category_id, image_path, ... }
  const data = res.data;
  return {
    id: data.category_id,
    name,
    imagePath: data.image_path ?? null,
  };
}

// Delete category
export async function deleteCategory(id: number): Promise<void> {
  await api.delete(`/api/categories/${id}`);
}
