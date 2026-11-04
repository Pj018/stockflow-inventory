import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  CreditCard,
  QrCode,
  Banknote,
  CheckCircle2,
  Package,
  Layers,
  ArrowRight,
  RefreshCw,
  User,
  Phone,
  Sparkles,
} from 'lucide-react';
import { api } from '../api/client';
import { Product, Order } from '../types';
import { useAuth } from '../context/AuthContext';
import { StockBadge } from '../components/Badge';

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
}

export const PosBillingPage: React.FC = () => {
  const { organization } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD' | 'OTHER'>('UPI');
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // Checkout & receipt state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const res = await api.getProducts();
      if (res.success) {
        setProducts(res.data);
      }
    } catch {
      setError('Failed to load products for POS billing.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products by search and category
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return ['ALL', ...Array.from(cats)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q));

      const matchCat =
        selectedCategory === 'ALL' || (p.category && p.category === selectedCategory);

      return matchSearch && matchCat;
    });
  }, [products, searchTerm, selectedCategory]);

  // Handle barcode / scanner enter key
  const handleScannerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    // Check exact match by barcode or SKU
    const exactMatch = products.find(
      (p) =>
        p.sku.toLowerCase() === searchTerm.toLowerCase().trim() ||
        (p.barcode && p.barcode.toLowerCase() === searchTerm.toLowerCase().trim())
    );

    if (exactMatch) {
      addToCart(exactMatch);
      setSearchTerm('');
    } else if (filteredProducts.length === 1) {
      addToCart(filteredProducts[0]);
      setSearchTerm('');
    }
  };

  const addToCart = (product: Product) => {
    if (product.quantity <= 0) {
      setError(`Cannot add "${product.name}": Out of stock.`);
      return;
    }

    setError(null);
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          setError(`Max stock reached for "${product.name}" (${product.quantity} units).`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          product,
          quantity: 1,
          unitPrice: product.sellingPrice || 0,
        },
      ];
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    setError(null);
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.quantity) {
              setError(`Only ${item.product.quantity} units available in stock.`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setDiscountAmount(0);
    setError(null);
  };

  // Calculations
  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [cart]
  );

  const taxRate = organization?.taxRate || 0;
  const taxAmount = useMemo(
    () => Math.round(((subtotal - discountAmount) * (taxRate / 100)) * 100) / 100,
    [subtotal, discountAmount, taxRate]
  );

  const grandTotal = useMemo(
    () => Math.max(0, subtotal - discountAmount + (taxAmount > 0 ? taxAmount : 0)),
    [subtotal, discountAmount, taxAmount]
  );

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    try {
      setIsSubmitting(true);
      setError(null);
      const res = await api.createOrder({
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        paymentMethod,
        discountAmount,
        taxAmount,
        items: cart.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      });

      if (res.success) {
        setCompletedOrder(res.data);
        clearCart();
        fetchProducts(); // Refresh live catalog stock
      }
    } catch (err: any) {
      setError(err.message || 'Failed to complete sale transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShoppingCart className="w-7 h-7 text-blue-600" />
            Point of Sale (POS) Counter
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tap or scan items to generate customer sales, deduct inventory, and print bills.
          </p>
        </div>

        <button
          onClick={fetchProducts}
          title="Refresh products"
          className="self-start sm:self-center p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl transition shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Main POS Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Product Picker (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Barcode & Search Bar */}
          <form
            onSubmit={handleScannerSubmit}
            className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Scan barcode or type SKU / Name (press Enter to add)..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition shrink-0"
            >
              Add Item
            </button>
          </form>

          {/* Category Tabs */}
          {categories.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cat === 'ALL' ? 'All Products' : cat}
                </button>
              ))}
            </div>
          )}

          {/* Products Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto pr-1">
            {filteredProducts.map((p) => {
              const isOutOfStock = p.quantity <= 0;
              return (
                <div
                  key={p.id}
                  onClick={() => !isOutOfStock && addToCart(p)}
                  className={`p-3.5 bg-white rounded-2xl border border-slate-200 text-left transition select-none flex flex-col justify-between ${
                    isOutOfStock
                      ? 'opacity-50 cursor-not-allowed bg-slate-50'
                      : 'hover:border-blue-500 hover:shadow-md cursor-pointer active:scale-[0.98]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-mono text-[10px] font-semibold text-slate-400">
                        {p.sku}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                          isOutOfStock
                            ? 'bg-rose-100 text-rose-700'
                            : p.isLowStock
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {p.quantity} left
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 line-clamp-2 leading-tight">
                      {p.name}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-sm font-extrabold text-blue-700">
                      ₹{Number(p.sellingPrice || 0).toLocaleString('en-IN')}
                    </span>
                    <button
                      type="button"
                      disabled={isOutOfStock}
                      className="p-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Cart & Bill Register (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          {/* Cart Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/75">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-slate-700" />
              <h3 className="font-bold text-slate-900 text-base">Current Cart</h3>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                {cart.reduce((sum, i) => sum + i.quantity, 0)} items
              </span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
              >
                Clear Cart
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="p-4 flex-1 overflow-y-auto max-h-[300px] divide-y divide-slate-100">
            {cart.length > 0 ? (
              cart.map((item) => (
                <div key={item.product.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-slate-900 text-xs truncate">
                      {item.product.name}
                    </h5>
                    <p className="text-[11px] text-slate-400 font-mono">
                      ₹{item.unitPrice} × {item.quantity} ={' '}
                      <strong className="text-slate-700">
                        ₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}
                      </strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                      <button
                        onClick={() => updateCartQty(item.product.id, -1)}
                        className="px-2 py-1 text-slate-600 hover:bg-slate-200 transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-xs font-bold text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQty(item.product.id, 1)}
                        className="px-2 py-1 text-slate-600 hover:bg-slate-200 transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                <ShoppingCart className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                Cart is empty. Tap items on the left to start billing.
              </div>
            )}
          </div>

          {/* Customer & Payment Inputs */}
          <div className="p-4 bg-slate-50/50 border-t border-slate-100 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Customer Name (optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Phone Number (optional)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-1.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
                  paymentMethod === 'UPI'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                UPI / QR
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
                  paymentMethod === 'CASH'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Banknote className="w-3.5 h-3.5" />
                Cash
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
                  paymentMethod === 'CARD'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                Card
              </button>
            </div>
          </div>

          {/* Pricing Summary & Checkout Button */}
          <div className="p-4 bg-slate-900 text-white space-y-2">
            <div className="flex justify-between text-xs text-slate-300">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>

            {taxRate > 0 && (
              <div className="flex justify-between text-xs text-slate-300">
                <span>Tax ({taxRate}%)</span>
                <span>+ ₹{taxAmount.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
              <span>Discount (₹)</span>
              <input
                type="number"
                min="0"
                value={discountAmount || ''}
                onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-20 px-2 py-0.5 text-right text-xs bg-slate-800 border border-slate-700 rounded text-white focus:outline-none"
                placeholder="0"
              />
            </div>

            <div className="flex justify-between text-base font-extrabold text-white border-t border-slate-800 pt-2">
              <span>Grand Total</span>
              <span className="text-xl text-emerald-400">
                ₹{grandTotal.toLocaleString('en-IN')}
              </span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || isSubmitting}
              className="w-full mt-3 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                'Processing Sale...'
              ) : (
                <>
                  <Printer className="w-4 h-4" />
                  Complete Sale & Print Bill (₹{grandTotal.toLocaleString('en-IN')})
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Completed Sale Receipt Modal */}
      {completedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in duration-200">
            {/* Printable Receipt Container */}
            <div className="p-6 space-y-4 print:p-0">
              <div className="text-center border-b border-slate-200 pb-4">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-lg text-slate-900">
                  {completedOrder.organization?.name || organization?.name || 'StockFlow Store'}
                </h3>
                {completedOrder.organization?.address && (
                  <p className="text-xs text-slate-500">{completedOrder.organization.address}</p>
                )}
                {completedOrder.organization?.phone && (
                  <p className="text-xs text-slate-500">Ph: {completedOrder.organization.phone}</p>
                )}
                <div className="font-mono text-xs font-bold text-slate-700 mt-2">
                  Invoice #{completedOrder.orderNumber}
                </div>
                <div className="text-[11px] text-slate-400">
                  {new Date(completedOrder.createdAt).toLocaleString('en-IN')}
                </div>
              </div>

              {/* Customer Info */}
              {(completedOrder.customerName || completedOrder.customerPhone) && (
                <div className="text-xs border-b border-slate-100 pb-2">
                  <span className="text-slate-400">Customer: </span>
                  <span className="font-semibold text-slate-800">
                    {completedOrder.customerName || 'Walk-in Customer'}
                  </span>
                  {completedOrder.customerPhone && (
                    <span className="text-slate-500 ml-1">({completedOrder.customerPhone})</span>
                  )}
                </div>
              )}

              {/* Line Items Table */}
              <div className="space-y-2 text-xs divide-y divide-slate-100">
                {completedOrder.items.map((item) => (
                  <div key={item.id} className="pt-2 flex justify-between">
                    <div>
                      <p className="font-bold text-slate-800">{item.productName}</p>
                      <p className="text-[10px] text-slate-400">
                        {item.quantity} × ₹{item.unitPrice}
                      </p>
                    </div>
                    <span className="font-bold text-slate-900">
                      ₹{item.totalPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t-2 border-dashed border-slate-200 pt-3 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>₹{completedOrder.subtotal.toLocaleString('en-IN')}</span>
                </div>
                {completedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span>- ₹{completedOrder.discountAmount}</span>
                  </div>
                )}
                {completedOrder.taxAmount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Tax</span>
                    <span>+ ₹{completedOrder.taxAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-200 pt-2">
                  <span>Grand Total</span>
                  <span>₹{completedOrder.totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="text-[11px] text-slate-500 pt-1">
                  Payment: <strong>{completedOrder.paymentMethod}</strong>
                </div>
              </div>

              {/* Footer Note */}
              <div className="text-center text-xs text-slate-400 border-t border-slate-100 pt-3">
                {completedOrder.organization?.invoiceFooter || 'Thank you for shopping with us!'}
              </div>
            </div>

            {/* Receipt Modal Buttons */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                onClick={() => setCompletedOrder(null)}
                className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition"
              >
                New Sale
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
