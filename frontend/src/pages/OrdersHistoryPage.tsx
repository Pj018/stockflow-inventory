import React, { useState, useEffect, useMemo } from 'react';
import {
  Receipt,
  Search,
  Printer,
  Calendar,
  CreditCard,
  QrCode,
  Banknote,
  ArrowRight,
  RefreshCw,
  Eye,
  X,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { api } from '../api/client';
import { Order } from '../types';
import { useAuth } from '../context/AuthContext';

export const OrdersHistoryPage: React.FC = () => {
  const { organization } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const res = await api.getOrders();
      if (res.success) {
        setOrders(res.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        (o.customerPhone && o.customerPhone.includes(q))
    );
  }, [orders, searchTerm]);

  const totalSales = useMemo(
    () => orders.reduce((sum, o) => sum + o.totalAmount, 0),
    [orders]
  );

  const avgOrderValue = useMemo(
    () => (orders.length > 0 ? Math.round(totalSales / orders.length) : 0),
    [orders, totalSales]
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Receipt className="w-7 h-7 text-emerald-600" />
            Sales & Invoice History
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse completed customer transactions, track revenue, and reprint bills.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          title="Refresh orders"
          className="self-start sm:self-center p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl transition shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Total Sales Revenue</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            ₹{totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> All-time completed orders
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Invoices Generated</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            {orders.length}
          </p>
          <span className="text-xs text-slate-400 mt-1">POS & register bills</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Avg. Order Value</span>
          <p className="text-2xl font-extrabold text-blue-700 mt-1">
            ₹{avgOrderValue.toLocaleString('en-IN')}
          </p>
          <span className="text-xs text-slate-400 mt-1">Per transaction average</span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search invoice #, customer name, phone..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        <span className="text-xs text-slate-400 hidden sm:inline">
          Showing <strong>{filteredOrders.length}</strong> invoices
        </span>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/75 text-xs uppercase font-semibold text-slate-500 tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Invoice #</th>
                  <th className="px-6 py-3.5">Date & Time</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5 text-center">Items</th>
                  <th className="px-6 py-3.5 text-center">Payment</th>
                  <th className="px-6 py-3.5 text-right">Total Amount</th>
                  <th className="px-6 py-3.5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4 font-mono font-bold text-xs text-slate-900">
                      {o.orderNumber}
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(o.createdAt).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800 text-xs">
                        {o.customerName || 'Walk-in Customer'}
                      </p>
                      {o.customerPhone && (
                        <p className="text-[11px] text-slate-400">{o.customerPhone}</p>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-md">
                        {o.items?.length || 0} items
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          o.paymentMethod === 'UPI'
                            ? 'bg-blue-100 text-blue-700'
                            : o.paymentMethod === 'CARD'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {o.paymentMethod}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right font-extrabold text-slate-900">
                      ₹{o.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setViewingOrder(o)}
                        className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition inline-flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Bill
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400">
            <Receipt className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-700">No sales transactions found</h3>
            <p className="text-xs text-slate-400 mt-1">
              Start billing from the Point of Sale counter to generate customer invoices.
            </p>
          </div>
        )}
      </div>

      {/* Invoice Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in duration-200">
            <div className="p-6 space-y-4 print:p-0">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">
                    {organization?.name || 'StockFlow Store'}
                  </h3>
                  <p className="text-xs text-slate-500">Invoice #{viewingOrder.orderNumber}</p>
                </div>
                <button
                  onClick={() => setViewingOrder(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-xs space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(viewingOrder.createdAt).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span className="font-semibold text-slate-800">
                    {viewingOrder.customerName || 'Walk-in Customer'}
                  </span>
                </div>
                {viewingOrder.customerPhone && (
                  <div className="flex justify-between">
                    <span>Phone:</span>
                    <span>{viewingOrder.customerPhone}</span>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                {viewingOrder.items?.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <div>
                      <p className="font-bold text-slate-800">{item.productName}</p>
                      <p className="text-[11px] text-slate-400">
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
                  <span>₹{viewingOrder.subtotal.toLocaleString('en-IN')}</span>
                </div>
                {viewingOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span>- ₹{viewingOrder.discountAmount}</span>
                  </div>
                )}
                {viewingOrder.taxAmount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Tax</span>
                    <span>+ ₹{viewingOrder.taxAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-200 pt-2">
                  <span>Total Amount</span>
                  <span>₹{viewingOrder.totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="text-[11px] text-slate-500 pt-1">
                  Payment: <strong>{viewingOrder.paymentMethod}</strong>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setViewingOrder(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm"
              >
                <Printer className="w-4 h-4" />
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
