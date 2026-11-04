import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Layers,
  IndianRupee,
  AlertTriangle,
  ArrowRight,
  Plus,
  RefreshCw,
  Clock,
  Eye,
  ArrowUpDown,
} from 'lucide-react';
import { api } from '../api/client';
import { DashboardMetrics, Product } from '../types';
import { StatCard } from '../components/StatCard';
import { StockBadge } from '../components/Badge';
import { StockAdjustModal } from '../components/StockAdjustModal';
import { ProductModal } from '../components/ProductModal';
import { ProductDetailModal } from '../components/ProductDetailModal';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.getDashboardMetrics();
      if (res.success) {
        setData(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleAdjustStock = async (productId: string, changeAmount: number, note?: string) => {
    await api.adjustStock(productId, { changeAmount, note });
    await fetchMetrics();
  };

  const handleCreateProduct = async (formData: any) => {
    await api.createProduct(formData);
    await fetchMetrics();
  };

  const openDetailModal = async (product: Product) => {
    try {
      const res = await api.getProduct(product.id);
      if (res.success) {
        setDetailProduct(res.data);
      } else {
        setDetailProduct(product);
      }
    } catch {
      setDetailProduct(product);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Inventory Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            Overview of stock levels, low-stock warnings, and valuation for{' '}
            <span className="font-semibold text-slate-700">{data?.organization.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchMetrics}
            disabled={isLoading}
            className="p-2 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-sm"
            title="Refresh metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
          {error}
        </div>
      )}

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Products"
          value={data?.summary.totalProducts ?? 0}
          subtitle="Active SKUs in catalog"
          icon={<Package className="w-6 h-6" />}
          variant="default"
        />

        <StatCard
          title="Total Units on Hand"
          value={(data?.summary.totalQuantity ?? 0).toLocaleString()}
          subtitle="Across all catalog items"
          icon={<Layers className="w-6 h-6" />}
          variant="brand"
        />

        <StatCard
          title="Low Stock Alerts"
          value={data?.summary.lowStockCount ?? 0}
          subtitle={
            data?.summary.lowStockCount
              ? 'Items needing replenishment'
              : 'All inventory within healthy thresholds'
          }
          icon={<AlertTriangle className="w-6 h-6" />}
          variant={data?.summary.lowStockCount ? 'warning' : 'success'}
        />

        <StatCard
          title="Inventory Cost Value"
          value={`₹${(data?.summary.totalCostValuation ?? 0).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          subtitle={`Selling value: ₹${(data?.summary.totalSellingValuation ?? 0).toLocaleString(
            'en-IN',
            { minimumFractionDigits: 2, maximumFractionDigits: 2 }
          )}`}
          icon={<IndianRupee className="w-6 h-6" />}
          variant="default"
        />
      </div>

      {/* Low Stock Items Section (PRD FR-6) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Low Stock Items</h2>
              <p className="text-xs text-slate-500">
                Products where stock is at or below threshold (Default:{' '}
                {data?.organization.defaultLowStockThreshold} units)
              </p>
            </div>
          </div>

          <Link
            to="/products?lowStockOnly=true"
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            View in Catalog
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Low Stock Items Table */}
        {data?.lowStockItems && data.lowStockItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/75 text-xs uppercase font-semibold text-slate-500 tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Product Name</th>
                  <th className="px-6 py-3">SKU</th>
                  <th className="px-6 py-3 text-right">Quantity on Hand</th>
                  <th className="px-6 py-3 text-right">Threshold</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-right">Selling Price</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.lowStockItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      <button
                        onClick={() => openDetailModal(item)}
                        className="text-left hover:text-blue-600 transition"
                      >
                        {item.name}
                      </button>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{item.sku}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-500">
                      {item.lowStockThreshold} units
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StockBadge
                        quantity={item.quantity}
                        effectiveThreshold={item.lowStockThreshold || 0}
                      />
                    </td>
                    <td className="px-6 py-4 text-right text-slate-700">
                      {item.sellingPrice !== null && item.sellingPrice !== undefined
                        ? `₹${Number(item.sellingPrice).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openDetailModal(item)}
                          title="View Details"
                          className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setAdjustingProduct(item)}
                          className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition flex items-center gap-1"
                        >
                          <ArrowUpDown className="w-3.5 h-3.5" />
                          Adjust Stock
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500">
            <p className="text-sm font-medium text-slate-700">No low stock items! 🎉</p>
            <p className="text-xs text-slate-400 mt-1">
              All inventory levels are above their respective low-stock alert thresholds.
            </p>
          </div>
        )}
      </div>

      {/* Recent Catalog Items */}
      {data?.recentProducts && data.recentProducts.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Recent Catalog Items</h2>
                <p className="text-xs text-slate-500">Latest inventory additions and updates</p>
              </div>
            </div>

            <Link
              to="/products"
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Full Catalog ({data.summary.totalProducts})
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/75 text-xs uppercase font-semibold text-slate-500 tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Product Name</th>
                  <th className="px-6 py-3">SKU</th>
                  <th className="px-6 py-3 text-right">Units on Hand</th>
                  <th className="px-6 py-3 text-right">Selling Price</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-3.5 font-semibold text-slate-900">
                      <button
                        onClick={() => openDetailModal(p)}
                        className="text-left hover:text-blue-600 transition"
                      >
                        {p.name}
                      </button>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs text-slate-500">{p.sku}</td>
                    <td className="px-6 py-3.5 text-right font-bold text-slate-900">
                      {p.quantity}
                    </td>
                    <td className="px-6 py-3.5 text-right text-slate-700">
                      {p.sellingPrice !== null && p.sellingPrice !== undefined
                        ? `₹${Number(p.sellingPrice).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        : '—'}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => openDetailModal(p)}
                        className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <StockAdjustModal
        isOpen={!!adjustingProduct}
        product={adjustingProduct}
        onClose={() => setAdjustingProduct(null)}
        onSubmit={handleAdjustStock}
      />

      <ProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateProduct}
        defaultThreshold={data?.organization.defaultLowStockThreshold || 5}
      />

      <ProductDetailModal
        isOpen={!!detailProduct}
        product={detailProduct}
        onClose={() => setDetailProduct(null)}
        onAdjustStock={(p) => setAdjustingProduct(p)}
        onEdit={() => {}}
      />
    </div>
  );
};
