import { User, Product, Sale } from '../App';

const API_BASE = 'http://localhost:5000';

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) {
    localStorage.setItem('pos_access_token', token);
  } else {
    localStorage.removeItem('pos_access_token');
  }
}

export function getAccessToken(): string | null {
  if (!accessToken) {
    accessToken = localStorage.getItem('pos_access_token');
  }
  return accessToken;
}

function getHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
  };
}

/* ===================== AUTH API ===================== */

export const authAPI = {
  async signup(
    username: string,
    email: string,
    password: string,
    role: 'admin' | 'cashier',
    name: string
  ) {
    const response = await fetch(`${API_BASE}/api/signup`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ username, email, password, role, name }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Signup failed');
    }
    return data;
  },

  async login(username: string, password: string) {
    const response = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    if (data.accessToken) {
      setAccessToken(data.accessToken);
    }

    return data;
  },

  async verify(): Promise<{ success: boolean; user?: User }> {
    const token = getAccessToken();
    if (!token) return { success: false };

    try {
      const response = await fetch(`${API_BASE}/auth/verify`, {
        headers: getHeaders(),
      });

      if (!response.ok) {
        setAccessToken(null);
        return { success: false };
      }

      return await response.json();
    } catch {
      setAccessToken(null);
      return { success: false };
    }
  },

  logout() {
    setAccessToken(null);
  },
};

/* ===================== PRODUCTS API ===================== */

export const productsAPI = {
  async getAll(): Promise<Product[]> {
    const response = await fetch(`${API_BASE}/products`, {
      headers: getHeaders(),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch products');
    }

    return data.map((p: any) => ({
      id: p.product_id,
      name: p.product_name,
      price: p.price,
      stock: p.stock_quantity,
      minStock: p.min_stock,
      category: p.category_name,
      unit: p.unit,
      barcode: p.barcode,
      imagePath: p.image_path,
    }));
  },

  async update(id: string, updates: Partial<Product>): Promise<Product> {
    const response = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update product');
    }

    return data.product;
  },
};

/* ===================== SALES / TRANSACTIONS API ===================== */

// utils/api.ts
type CreateTransactionPayload = {
  user_id: number;
  payment_method: string;
  total_amount: number;
  cashier: string;
  items: {
    product_id: number;
    quantity: number;
    price: number;
  }[];
};

export const salesAPI = {
  async getAll(): Promise<Sale[]> {
    const response = await fetch(`${API_BASE}/api/transactions`);

    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }

    const data = await response.json();

    return data.map((t: any) => ({
      transaction_id: t.transaction_id,
      receiptNumber: `RCP-${t.transaction_id}`,
      total: t.total_amount,
      paymentMethod: t.payment_method,
      cashierName: t.cashier,
      timestamp: new Date(t.date_time + 'Z').toISOString(),
      items: t.items ?? [],
    }));
  },

  async create(payload: CreateTransactionPayload): Promise<Sale> {
    const response = await fetch(`${API_BASE}/api/transactions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create transaction');
    }

    return {
      transaction_id: data.transaction_id,
      receiptNumber: `RCP-${data.transaction_id}`,
      total: payload.total_amount,
      paymentMethod: payload.payment_method,
      cashierName: payload.cashier,
      timestamp: new Date().toISOString(),
      items: payload.items.map(i => ({
        product_id: i.product_id,
        product_name: '',
        quantity: i.quantity,
        price: i.price,
        subtotal: i.quantity * i.price,
      })),
    };
  },
};

/* ===================== SYSTEM ===================== */

export async function initializeDemoData() {
  const response = await fetch(`${API_BASE}/initialize`, {
    method: 'POST',
    headers: getHeaders(),
  });

  return await response.json();
}

export async function healthCheck() {
  try {
    const response = await fetch(`${API_BASE}/health`, {
      headers: getHeaders(),
    });
    return await response.json();
  } catch {
    return { status: 'error' };
  }
}
