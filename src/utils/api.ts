import { projectId, publicAnonKey } from './supabase/info';
import { User, Product, Sale } from '../App';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-6f1f8962`;

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

function getHeaders(requireAuth = false): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (requireAuth && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  } else if (!requireAuth) {
    headers['Authorization'] = `Bearer ${publicAnonKey}`;
  }

  return headers;
}

// Auth API
export const authAPI = {
  async signup(username: string, email: string, password: string, role: 'admin' | 'cashier', name: string) {
    const response = await fetch(`${API_BASE}/auth/signup`, {
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
    const response = await fetch(`${API_BASE}/auth/login`, {
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
        headers: getHeaders(true)
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

    return data.products;
  },

  async create(product: Omit<Product, 'id'>): Promise<Product> {
    const response = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: getHeaders(true),
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
      headers: getHeaders(true),
      body: JSON.stringify(updates)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update product');
    }

    return data.product;
  }
};

// Sales API
export const salesAPI = {
  async getAll(): Promise<Sale[]> {
    const response = await fetch(`${API_BASE}/sales`, {
      headers: getHeaders(true)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch sales');
    }

    // Convert timestamp strings to Date objects
    return data.sales.map((sale: any) => ({
      ...sale,
      timestamp: new Date(sale.timestamp)
    }));
  },

  async create(sale: Omit<Sale, 'id' | 'receiptNumber' | 'timestamp'>): Promise<Sale> {
    const response = await fetch(`${API_BASE}/sales`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(sale)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create sale');
    }

    // Convert timestamp string to Date object
    return {
      ...data.sale,
      timestamp: new Date(data.sale.timestamp)
    };
  }
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
