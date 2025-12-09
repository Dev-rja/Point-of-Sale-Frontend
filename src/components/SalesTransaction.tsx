import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { User, Product, Sale, SaleItem } from '../App';
import { Plus, Minus, Trash2, Search, ShoppingCart } from 'lucide-react';
import { PaymentModal } from './PaymentModal';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface SalesTransactionProps {
  user: User;
  products: Product[];
  onAddSale: (sale: any) => Promise<Sale>;
}

const CATEGORY_DATA = [
  {
    name: 'Vegetables',
    image: 'https://images.unsplash.com/photo-1574955598898-d105479382e5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMHZlZ2V0YWJsZXMlMjBhc3NvcnRlZHxlbnwxfHx8fDE3NjQzODQyODF8MA&ixlib=rb-4.1.0&q=80&w=1080',
    bgColor: 'from-green-100 to-green-200',
    matchCategories: ['Fruits & Vegetables', 'Vegetables']
  },
  {
    name: 'Fruits',
    image: 'https://images.unsplash.com/photo-1731085906186-abc92cce0a7a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cm9waWNhbCUyMGZydWl0cyUyMHZhcmlldHl8ZW58MXx8fHwxNzY0Mzg0MjgxfDA&ixlib=rb-4.1.0&q=80&w=1080',
    bgColor: 'from-yellow-100 to-yellow-200',
    matchCategories: ['Fruits & Vegetables', 'Fruits']
  },
  {
    name: 'Meats',
    image: 'https://images.unsplash.com/photo-1677607219966-22fbfa433667?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyYXclMjBtZWF0JTIwYmVlZnxlbnwxfHx8fDE3NjQzNDY2NjR8MA&ixlib=rb-4.1.0&q=80&w=1080',
    bgColor: 'from-red-100 to-red-200',
    matchCategories: ['Meat & Seafood', 'Meats']
  },
  {
    name: 'Snacks',
    image: 'https://images.unsplash.com/photo-1742972459942-aed536c720cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbmFja3MlMjBjaGlwcyUyMHZhcmlldHl8ZW58MXx8fHwxNzY0Mzg0MjgzfDA&ixlib=rb-4.1.0&q=80&w=1080',
    bgColor: 'from-pink-100 to-pink-200',
    matchCategories: ['Snacks']
  },
  {
    name: 'Beverages',
    image: 'https://images.unsplash.com/photo-1636245297990-c641560ff4b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZXZlcmFnZXMlMjBkcmlua3MlMjBib3R0bGVzfGVufDF8fHx8MTc2NDMzMjgxMXww&ixlib=rb-4.1.0&q=80&w=1080',
    bgColor: 'from-amber-100 to-amber-200',
    matchCategories: ['Beverages']
  },
  {
    name: 'Canned Goods',
    image: 'https://images.unsplash.com/photo-1760612887290-62645e654eaf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW5uZWQlMjBmb29kJTIwZ3JvY2VyaWVzfGVufDF8fHx8MTc2NDM4NDI4M3ww&ixlib=rb-4.1.0&q=80&w=1080',
    bgColor: 'from-blue-100 to-blue-200',
    matchCategories: ['Groceries', 'Food', 'Canned Goods']
  },
  {
    name: 'Toiletries/Hygiene',
    image: 'https://images.unsplash.com/photo-1760184762833-7c6bd9ef1415?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b2lsZXRyaWVzJTIwaHlnaWVuZSUyMHByb2R1Y3RzfGVufDF8fHx8MTc2NDM4NDI4NHww&ixlib=rb-4.1.0&q=80&w=1080',
    bgColor: 'from-purple-100 to-purple-200',
    matchCategories: ['Personal Care', 'Toiletries']
  },
  {
    name: 'Medicines',
    image: 'https://images.unsplash.com/photo-1646392206581-2527b1cae5cb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2luZSUyMHBoYXJtYWN5JTIwcGlsbHN8ZW58MXx8fHwxNzY0MzEwMDExfDA&ixlib=rb-4.1.0&q=80&w=1080',
    bgColor: 'from-indigo-100 to-indigo-200',
    matchCategories: ['Medicines', 'Pharmacy']
  },
  {
    name: 'Household Essentials',
    image: 'https://images.unsplash.com/photo-1758887262204-a49092d85f15?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbGVhbmluZyUyMGhvdXNlaG9sZCUyMHByb2R1Y3RzfGVufDF8fHx8MTc2NDM4NDI4NHww&ixlib=rb-4.1.0&q=80&w=1080',
    bgColor: 'from-gray-100 to-gray-200',
    matchCategories: ['Household']
  },
  {
    name: 'Baby Products',
    image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWJ5JTIwcHJvZHVjdHMlMjBjYXJlfGVufDF8fHx8MTc2NDM4NDI4NHww&ixlib=rb-4.1.0&q=80&w=1080',
    bgColor: 'from-orange-100 to-orange-200',
    matchCategories: ['Baby Products', 'Baby Care']
  }
];

export function SalesTransaction({ user, products, onAddSale }: SalesTransactionProps) {
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode.includes(searchTerm);
    
    if (!selectedCategory) return matchesSearch;
    
    const categoryData = CATEGORY_DATA.find(cat => cat.name === selectedCategory);
    const matchesCategory = categoryData?.matchCategories.includes(product.category) || false;
    
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert('Product out of stock!');
      return;
    }

    const existingItem = cart.find(item => item.productId === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        alert('Not enough stock available!');
        return;
      }
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price: product.price,
        subtotal: product.price
      }]);
    }
  };

  const updateQuantity = (productId: string, change: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQuantity = item.quantity + change;
        if (newQuantity <= 0) return item;
        if (newQuantity > product.stock) {
          alert('Not enough stock available!');
          return item;
        }
        return {
          ...item,
          quantity: newQuantity,
          subtotal: newQuantity * item.price
        };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Cart is empty!');
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = async (paymentMethod: string) => {
    const saleData = {
      items: cart,
      total: calculateTotal(),
      paymentMethod,
      cashierId: user.id,
      cashierName: user.name
    };

    try {
      await onAddSale(saleData);
      clearCart();
      setShowPaymentModal(false);
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed. Please try again.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Product Selection */}
      <div className="lg:col-span-2 space-y-4">
        <Card className="border-[#D1EDC5] shadow-md">
          <CardContent className="pt-6">
            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search product..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-[#D1EDC5] rounded-full"
                />
              </div>
            </div>

            {/* Product Display Area */}
            <div className="bg-gray-100 rounded-3xl p-6 mb-4 min-h-[350px] max-h-[350px] overflow-y-auto">
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {filteredProducts.map(product => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      disabled={product.stock <= 0}
                      className={`text-left p-4 rounded-xl border transition-all ${
                        product.stock <= 0
                          ? 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
                          : 'bg-white border-[#D1EDC5] hover:border-[#a8dfa0] hover:shadow-lg hover:scale-105'
                      }`}
                    >
                      <div className="text-sm text-gray-900 mb-1">{product.name}</div>
                      <div className="text-xs text-gray-500 mb-2">{product.category}</div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#1a5a1a]">₱{product.price.toFixed(2)}</span>
                        <span className={`text-xs ${product.stock <= product.minStock ? 'text-red-600' : 'text-gray-500'}`}>
                          Stock: {product.stock}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  {selectedCategory ? `No products in ${selectedCategory}` : 'No products found'}
                </div>
              )}
            </div>

            {/* Category Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {CATEGORY_DATA.map(category => (
                <button
                  key={category.name}
                  onClick={() => setSelectedCategory(selectedCategory === category.name ? null : category.name)}
                  className={`relative overflow-hidden rounded-2xl p-4 transition-all hover:scale-105 ${
                    selectedCategory === category.name ? 'ring-4 ring-[#4a9d5f]' : ''
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${category.bgColor} opacity-80`}></div>
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-full h-20 mb-2 overflow-hidden rounded-lg">
                      <ImageWithFallback
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-xs text-gray-800 text-center">{category.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cart */}
      <div className="space-y-4">
        <Card className="border-[#D1EDC5] shadow-md">
          <CardHeader className="bg-gradient-to-r from-[#D1EDC5] to-[#a8dfa0]">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center text-[#1a5a1a]">
                <ShoppingCart className="size-5 mr-2" />
                Cart
              </CardTitle>
              {cart.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearCart} className="text-[#1a5a1a] hover:bg-white/50">
                  Clear
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Cart is empty
              </div>
            ) : (
              <div className="space-y-3">
                <div className="max-h-[400px] overflow-y-auto space-y-3">
                  {cart.map(item => (
                    <div key={item.productId} className="bg-[#f0f9ed] p-3 rounded-xl border border-[#D1EDC5]">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="text-sm text-gray-900">{item.productName}</div>
                          <div className="text-xs text-gray-500">₱{item.price.toFixed(2)} each</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.productId)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.productId, -1)}
                            disabled={item.quantity <= 1}
                            className="border-[#D1EDC5] hover:bg-white"
                          >
                            <Minus className="size-3" />
                          </Button>
                          <span className="text-sm text-gray-900 w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.productId, 1)}
                            className="border-[#D1EDC5] hover:bg-white"
                          >
                            <Plus className="size-3" />
                          </Button>
                        </div>
                        <div className="text-sm text-[#1a5a1a]">
                          ₱{item.subtotal.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#D1EDC5] pt-3 mt-3">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-900">Total</span>
                    <span className="text-2xl text-[#1a5a1a]">
                      ₱{calculateTotal().toFixed(2)}
                    </span>
                  </div>
                  
                  <Button
                    onClick={handleCheckout}
                    className="w-full bg-gradient-to-r from-[#D1EDC5] to-[#a8dfa0] hover:from-[#a8dfa0] hover:to-[#7fcd77] text-[#1a5a1a]"
                    size="lg"
                  >
                    Proceed to Payment
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {showPaymentModal && (
        <PaymentModal
          total={calculateTotal()}
          cart={cart}
          cashierName={user.name}
          onClose={() => setShowPaymentModal(false)}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </div>
  );
}