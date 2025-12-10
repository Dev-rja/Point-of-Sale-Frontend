// src/api/categories.ts
import api from "./client";

export interface Category {
  id: number;
  name: string;
  imagePath: string | null;
}

// GET /categories  (Flask returns: category_id, category_name, image_path, ...)
export async function fetchCategories(): Promise<Category[]> {
  const res = await api.get("/categories");
  return res.data.map((c: any) => ({
    id: c.category_id,
    name: c.category_name,
    imagePath: c.image_path ?? null,
  }));
}

// POST /api/add_category  (multipart form: name + optional image)
export async function createCategory(
  name: string,
  imageFile?: File | null   // ← imageFile is OPTIONAL
): Promise<Category> {
  const formData = new FormData();
  formData.append("name", name);
  if (imageFile) {
    formData.append("image", imageFile);
  }

  const res = await api.post("/api/add_category", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  const { category_id, image_path } = res.data;

  return {
    id: category_id,
    name,
    imagePath: image_path ?? null,
  };
}

// DELETE /api/categories/<id>
export async function deleteCategory(id: number): Promise<void> {
  await api.delete(`/api/categories/${id}`);
}
