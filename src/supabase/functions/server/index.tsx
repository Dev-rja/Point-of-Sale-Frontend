import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger(console.log));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Helper function to generate unique IDs
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ==================== AUTH ROUTES ====================

// Sign up
app.post('/make-server-6f1f8962/auth/signup', async (c) => {
  try {
    const { username, email, password, role, name } = await c.req.json();

    // Check if username already exists
    const existingUser = await kv.get(`user:${username}`);
    if (existingUser) {
      return c.json({ error: 'Username already exists' }, 400);
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm since email server isn't configured
      user_metadata: {
        username,
        role,
        name
      }
    });

    if (authError) {
      console.log('Supabase auth signup error:', authError);
      return c.json({ error: `Authentication error during signup: ${authError.message}` }, 400);
    }

    // Store user data in KV store
    const userData = {
      id: authData.user.id,
      username,
      email,
      role,
      name,
      createdAt: new Date().toISOString()
    };

    await kv.set(`user:${username}`, userData);
    await kv.set(`user:id:${authData.user.id}`, userData);

    return c.json({ 
      success: true, 
      user: userData
    });
  } catch (error) {
    console.log('Signup error:', error);
    return c.json({ error: `Signup failed: ${error.message}` }, 500);
  }
});

// Login
app.post('/make-server-6f1f8962/auth/login', async (c) => {
  try {
    const { username, password } = await c.req.json();

    // Get user from KV store
    const userData = await kv.get(`user:${username}`);
    if (!userData) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Sign in with Supabase Auth using email
    const { data, error } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password
    });

    if (error) {
      console.log('Supabase auth login error:', error);
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    return c.json({
      success: true,
      user: {
        id: userData.id,
        username: userData.username,
        role: userData.role,
        name: userData.name
      },
      accessToken: data.session.access_token
    });
  } catch (error) {
    console.log('Login error:', error);
    return c.json({ error: `Login failed: ${error.message}` }, 500);
  }
});

// Verify session
app.get('/make-server-6f1f8962/auth/verify', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No token provided' }, 401);
    }

    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error || !data.user) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    const userData = await kv.get(`user:id:${data.user.id}`);
    if (!userData) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({
      success: true,
      user: {
        id: userData.id,
        username: userData.username,
        role: userData.role,
        name: userData.name
      }
    });
  } catch (error) {
    console.log('Verify error:', error);
    return c.json({ error: `Verification failed: ${error.message}` }, 500);
  }
});

// ==================== PRODUCT ROUTES ====================

// Get all products
app.get('/make-server-6f1f8962/products', async (c) => {
  try {
    const products = await kv.getByPrefix('product:');
    return c.json({ products: products || [] });
  } catch (error) {
    console.log('Get products error:', error);
    return c.json({ error: `Failed to fetch products: ${error.message}` }, 500);
  }
});

// Create product
app.post('/make-server-6f1f8962/products', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:id:${user.id}`);
    if (userData.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const product = await c.req.json();
    const productId = generateId();
    const newProduct = {
      ...product,
      id: productId,
      createdAt: new Date().toISOString()
    };

    await kv.set(`product:${productId}`, newProduct);

    return c.json({ success: true, product: newProduct });
  } catch (error) {
    console.log('Create product error:', error);
    return c.json({ error: `Failed to create product: ${error.message}` }, 500);
  }
});

// Update product
app.put('/make-server-6f1f8962/products/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:id:${user.id}`);
    if (userData.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const productId = c.req.param('id');
    const updates = await c.req.json();

    const existingProduct = await kv.get(`product:${productId}`);
    if (!existingProduct) {
      return c.json({ error: 'Product not found' }, 404);
    }

    const updatedProduct = {
      ...existingProduct,
      ...updates,
      id: productId,
      updatedAt: new Date().toISOString()
    };

    await kv.set(`product:${productId}`, updatedProduct);

    return c.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.log('Update product error:', error);
    return c.json({ error: `Failed to update product: ${error.message}` }, 500);
  }
});

// ==================== SALES ROUTES ====================

// Get all sales
app.get('/make-server-6f1f8962/sales', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const sales = await kv.getByPrefix('sale:');
    return c.json({ sales: sales || [] });
  } catch (error) {
    console.log('Get sales error:', error);
    return c.json({ error: `Failed to fetch sales: ${error.message}` }, 500);
  }
});

// Create sale
app.post('/make-server-6f1f8962/sales', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const saleData = await c.req.json();
    const saleId = generateId();
    
    // Generate receipt number
    const receiptNumber = `RCP-${Date.now()}`;
    
    const newSale = {
      ...saleData,
      id: saleId,
      receiptNumber,
      timestamp: new Date().toISOString()
    };

    await kv.set(`sale:${saleId}`, newSale);

    // Update product stock
    for (const item of saleData.items) {
      const product = await kv.get(`product:${item.productId}`);
      if (product) {
        const updatedProduct = {
          ...product,
          stock: product.stock - item.quantity,
          updatedAt: new Date().toISOString()
        };
        await kv.set(`product:${item.productId}`, updatedProduct);
      }
    }

    return c.json({ success: true, sale: newSale });
  } catch (error) {
    console.log('Create sale error:', error);
    return c.json({ error: `Failed to create sale: ${error.message}` }, 500);
  }
});

// ==================== INITIALIZE DATA ====================

// Initialize with demo data
app.post('/make-server-6f1f8962/initialize', async (c) => {
  try {
    // Check if users already exist
    const existingAdmin = await kv.get('user:admin');
    if (existingAdmin) {
      console.log('Demo users already exist, skipping user creation');
      
      // Still create products if they don't exist
      const existingProducts = await kv.getByPrefix('product:');
      if (!existingProducts || existingProducts.length === 0) {
        // Create demo products (code below)
        const demoProducts = [
          {
            name: 'Rice 25kg',
            category: 'Groceries',
            price: 1250,
            stock: 50,
            barcode: '8901234567890',
            minStock: 10
          },
          {
            name: 'Cooking Oil 1L',
            category: 'Groceries',
            price: 180,
            stock: 30,
            barcode: '8901234567891',
            minStock: 5
          },
          {
            name: 'Sugar 1kg',
            category: 'Groceries',
            price: 65,
            stock: 45,
            barcode: '8901234567892',
            minStock: 10
          },
          {
            name: 'Coffee 3-in-1 Pack',
            category: 'Beverages',
            price: 120,
            stock: 60,
            barcode: '8901234567893',
            minStock: 15
          },
          {
            name: 'Instant Noodles Pack',
            category: 'Food',
            price: 85,
            stock: 100,
            barcode: '8901234567894',
            minStock: 20
          }
        ];

        for (const product of demoProducts) {
          const productId = generateId();
          const newProduct = {
            ...product,
            id: productId,
            createdAt: new Date().toISOString()
          };
          await kv.set(`product:${productId}`, newProduct);
        }
        console.log('Demo products created');
      }
      
      return c.json({ success: true, message: 'Already initialized' });
    }

    console.log('Starting initialization - creating demo users and products...');

    // Create demo users
    const demoUsers = [
      {
        username: 'admin',
        email: 'admin@pos.com',
        password: 'admin123',
        role: 'admin',
        name: 'Erica Monacillo'
      },
      {
        username: 'cashier',
        email: 'cashier@pos.com',
        password: 'cashier123',
        role: 'cashier',
        name: 'Jars Christian Lerio'
      }
    ];

    for (const user of demoUsers) {
      console.log(`Creating user: ${user.username}`);
      
      // Create in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          username: user.username,
          role: user.role,
          name: user.name
        }
      });

      if (authError) {
        console.error(`Error creating user ${user.username} in Supabase Auth:`, authError);
        // Continue even if user creation fails (might already exist)
      } else if (authData) {
        console.log(`User ${user.username} created in Supabase Auth with ID: ${authData.user.id}`);
        const userData = {
          id: authData.user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          name: user.name,
          createdAt: new Date().toISOString()
        };
        await kv.set(`user:${user.username}`, userData);
        await kv.set(`user:id:${authData.user.id}`, userData);
        console.log(`User ${user.username} saved to KV store`);
      }
    }

    // Create demo products
    const demoProducts = [
      {
        name: 'Rice 25kg',
        category: 'Groceries',
        price: 1250,
        stock: 50,
        barcode: '8901234567890',
        minStock: 10
      },
      {
        name: 'Cooking Oil 1L',
        category: 'Groceries',
        price: 180,
        stock: 30,
        barcode: '8901234567891',
        minStock: 5
      },
      {
        name: 'Sugar 1kg',
        category: 'Groceries',
        price: 65,
        stock: 45,
        barcode: '8901234567892',
        minStock: 10
      },
      {
        name: 'Coffee 3-in-1 Pack',
        category: 'Beverages',
        price: 120,
        stock: 60,
        barcode: '8901234567893',
        minStock: 15
      },
      {
        name: 'Instant Noodles Pack',
        category: 'Food',
        price: 85,
        stock: 100,
        barcode: '8901234567894',
        minStock: 20
      }
    ];

    for (const product of demoProducts) {
      const productId = generateId();
      const newProduct = {
        ...product,
        id: productId,
        createdAt: new Date().toISOString()
      };
      await kv.set(`product:${productId}`, newProduct);
    }

    return c.json({ success: true, message: 'Demo data initialized successfully' });
  } catch (error) {
    console.log('Initialize error:', error);
    return c.json({ error: `Initialization failed: ${error.message}` }, 500);
  }
});

app.get('/make-server-6f1f8962/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

Deno.serve(app.fetch);