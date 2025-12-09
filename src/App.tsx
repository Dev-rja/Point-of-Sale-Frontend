import { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { SignUpPage } from './components/SignUpPage';
import { AdminDashboard } from './components/AdminDashboard';
import { CashierInterface } from './components/CashierInterface';
import { authAPI, productsAPI, salesAPI, initializeDemoData, healthCheck, setAccessToken } from './utils/api';

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'cashier';
  name: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  barcode: string;
  minStock: number;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  total: number;
  paymentMethod: string;
  cashierId: string;
  cashierName: string;
  timestamp: Date;
  receiptNumber: string;
}

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showSignUp, setShowSignUp] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize app and check for existing session
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check backend health
        const health = await healthCheck();
        console.log('Backend health:', health);

        // Initialize demo data if needed (only once)
        const initialized = localStorage.getItem('pos_initialized');
        if (!initialized) {
          console.log('Initializing demo data...');
          const result = await initializeDemoData();
          console.log('Demo data initialization result:', result);
          localStorage.setItem('pos_initialized', 'true');
          console.log('Demo data initialized successfully');
          console.log('Demo credentials - Admin: username="admin", password="admin123"');
          console.log('Demo credentials - Cashier: username="cashier", password="cashier123"');
        } else {
          console.log('System already initialized');
          console.log('Use these credentials to login:');
          console.log('Admin: username="admin", password="admin123"');
          console.log('Cashier: username="cashier", password="cashier123"');
        }

        // Check for existing session
        const { success, user } = await authAPI.verify();
        if (success && user) {
          setCurrentUser(user);
          await loadData();
        }
      } catch (error) {
        console.error('App initialization error:', error);
        // Clear initialization flag if there was an error, so it can retry next time
        localStorage.removeItem('pos_initialized');
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Load products and sales
  const loadData = async () => {
    try {
      const [productsData, salesData] = await Promise.all([
        productsAPI.getAll(),
        salesAPI.getAll()
      ]);
      
      setProducts(productsData);
      setSales(salesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleLogin = async (username: string, password: string) => {
    try {
      const { user } = await authAPI.login(username, password);
      setCurrentUser(user);
      setShowSignUp(false);
      await loadData();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    setCurrentUser(null);
    setProducts([]);
    setSales([]);
  };

  const handleSignUp = async (username: string, email: string, password: string, role: 'admin' | 'cashier') => {
    try {
      const name = username.charAt(0).toUpperCase() + username.slice(1);
      await authAPI.signup(username, email, password, role, name);
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const handleGoToSignUp = () => {
    setShowSignUp(true);
  };

  const handleBackToLogin = () => {
    setShowSignUp(false);
  };

  const handleUpdateProducts = async (updatedProducts: Product[]) => {
    setProducts(updatedProducts);
  };

  const handleAddProduct = async (product: Omit<Product, 'id'>) => {
    try {
      const newProduct = await productsAPI.create(product);
      setProducts(prev => [...prev, newProduct]);
      return newProduct;
    } catch (error) {
      console.error('Failed to add product:', error);
      throw error;
    }
  };

  const handleUpdateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const updatedProduct = await productsAPI.update(id, updates);
      setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
      return updatedProduct;
    } catch (error) {
      console.error('Failed to update product:', error);
      throw error;
    }
  };

  const handleAddSale = async (saleData: Omit<Sale, 'id' | 'receiptNumber' | 'timestamp'>) => {
    try {
      const newSale = await salesAPI.create(saleData);
      setSales(prev => [newSale, ...prev]);
      
      // Reload products to get updated stock
      const updatedProducts = await productsAPI.getAll();
      setProducts(updatedProducts);
      
      return newSale;
    } catch (error) {
      console.error('Failed to add sale:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f0f9ed 0%, #ffffff 100%)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a5a1a] mx-auto"></div>
          <p className="mt-4 text-gray-600">Connecting to backend...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    if (showSignUp) {
      return <SignUpPage onSignUp={handleSignUp} onBackToLogin={handleBackToLogin} />;
    }
    return <LoginPage onLogin={handleLogin} onGoToSignUp={handleGoToSignUp} />;
  }

  return (
    <>
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f0f9ed 0%, #ffffff 100%)' }}>
        {currentUser.role === 'admin' ? (
          <AdminDashboard
            user={currentUser}
            products={products}
            sales={sales}
            onLogout={handleLogout}
            onUpdateProducts={handleUpdateProducts}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onAddSale={handleAddSale}
          />
        ) : (
          <CashierInterface
            user={currentUser}
            products={products}
            sales={sales}
            onLogout={handleLogout}
            onAddSale={handleAddSale}
          />
        )}
      </div>
    </>
  );
}

export default App;