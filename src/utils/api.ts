import { User, Product, Sale } from '../App';

const API_BASE = 'http://localhost:5000/';

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

// Auth API
export const authAPI = {
  async signup(username: string, email: string, password: string, role: 'admin' | 'cashier', name: string) {
    const response = await fetch(`${API_BASE}/api/signup`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ username, email, password, role, name })
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
      body: JSON.stringify({ username, password })
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
    if (!token) {
      return { success: false };
    }

    try {
      const response = await fetch(`${API_BASE}/auth/verify`, {
        headers: getHeaders()
      });

      if (!response.ok) {
        setAccessToken(null);
        return { success: false };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Verify error:', error);
      setAccessToken(null);
      return { success: false };
    }
  },

  logout() {
    setAccessToken(null);
  }
};

// Products API
export const productsAPI = {
  async getAll(): Promise<Product[]> {
    const response = await fetch(`${API_BASE}/products`, {
      headers: getHeaders()
    });
  
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch products');
    }
  
    // 🔑 NORMALIZE Flask response → Frontend shape
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

  async create(product: Omit<Product, 'id'>): Promise<Product> {
    const response = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(product)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create product');
    }

    return data.product;
  },

  async update(id: string, updates: Partial<Product>): Promise<Product> {
    const response = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update product');
    }

    return data.product;
  }
};

// Sales API (Flask-compatible)
export const salesAPI = {
  async getAll(): Promise<Sale[]> {
    const response = await fetch(`${API_BASE}/transactions`);

    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }

    const data = await response.json();

    // Flask returns an ARRAY, not { sales: [...] }
    return data.map((t: any) => ({
      transaction_id: t.transaction_id,
      receiptNumber: `RCP-${t.transaction_id}`,
      total: t.total_amount,
      paymentMethod: t.payment_method,
      cashierName: t.cashier,
      timestamp: new Date(t.date_time),
      items: t.items ?? [],
    }));
  },

  async create(
    sale: Omit<Sale, 'transaction_id' | 'receiptNumber' | 'timestamp'>
  ): Promise<Sale> {
    const response = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        payment_method: sale.paymentMethod,
        total_amount: sale.total,
        items: sale.items,
        cashier: sale.cashierName,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create transaction');
    }

    return {
      ...sale,
      transaction_id: data.transaction_id,
      receiptNumber: `RCP-${data.transaction_id}`,
      timestamp: new Date().toISOString(),
    };
  },
};


// Initialize demo data
export async function initializeDemoData() {
  try {
    const response = await fetch(`${API_BASE}/initialize`, {
      method: 'POST',
      headers: getHeaders()
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Initialize error:', error);
    throw error;
  }
}

// Health check
export async function healthCheck() {
  try {
    const response = await fetch(`${API_BASE}/health`, {
      headers: getHeaders()
    });
    return await response.json();
  } catch (error) {
    console.error('Health check error:', error);
    return { status: 'error' };
  }
}
