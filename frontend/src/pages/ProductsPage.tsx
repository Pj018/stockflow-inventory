import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Package,
  Search,
  Plus,
  Filter,
  Edit2,
  Trash2,
  ArrowUpDown,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../api/client';
import { Product, Organization } from '../types';
import { StockBadge } from '../components/Badge';
import { ProductModal } from '../components/ProductModal';
import { StockAdjustModal } from '../components/StockAdjustModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { useAuth } from '../context/AuthContext';

export const ProductsPage: React.FC = () => {
  const { organization } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>(searchParams.get('search') || '');
  const [lowStockFilter, setLowStockFilter] = useState<boolean>(
    searchParams.get('lowStockOnly') === 'true'
  );

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.getProducts({
        search: searchTerm || undefined,
        lowStockOnly: lowStockFilter,
      });
      if (res.success) {
        setProducts(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [lowStockFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleCreateOrUpdate = async (formData: any) => {
    if (editingProduct) {
      await api.updateProduct(editingProduct.id, formData);
    } else {
      await api.createProduct(formData);
    }
    await fetchProducts();
  };

  const handleAdjustStock = async (productId: string, changeAmount: number, note?: string) => {
    await api.adjustStock(productId, { changeAmount, note });
    await fetchProducts();
  };

  const handleDeleteProduct = async (productId: string) => {
    await api.deleteProduct(productId);
    await fetchProducts();
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Products Catalog
          </h1>
          <p className="text-sm text-slate-500">
            Manage your store's inventory, SKUs, pricing, and stock alerts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchProducts}
            disabled={isLoading}
            className="p-2.5 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-sm"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            Add New Product
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
          {error}
        </div>
      )}

      {/* Search and Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Product Name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-20 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
          >
            Filter
          </button>
        </form>

        {/* Filter buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={() => {
              setLowStockFilter(false);
              setSearchParams({});
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              !lowStockFilter
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Products
          </button>

          <button
            type="button"
            onClick={() => {
              setLowStockFilter(true);
              setSearchParams({ lowStockOnly: 'true' });
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              lowStockFilter
                ? 'bg-amber-50 text-amber-800 border border-amber-300'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Low Stock Only
          </button>
        </div>
      </div>

      {/* Products Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/75 text-xs uppercase font-semibold text-slate-500 tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Product & Description</th>
                  <th className="px-6 py-3.5 font-mono">SKU</th>
                  <th className="px-6 py-3.5 text-right">Quantity on Hand</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5 text-right">Cost Price</th>
                  <th className="px-6 py-3.5 text-right">Selling Price</th>
                  <th className="px-6 py-3.5 text-right">Threshold</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition group">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition">
                        {p.name}
                      </p>
                      {p.description && (
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                          {p.description}
                        </p>
                      )}
                    </td>

                    <td className="px-6 py-4 font-mono text-xs font-medium text-slate-700">
                      {p.sku}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <span className="text-base font-bold text-slate-900">
                        {p.quantity}
                      </span>{' '}
                      <span className="text-xs text-slate-400">units</span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <StockBadge
                        quantity={p.quantity}
                        effectiveThreshold={p.effectiveThreshold}
                      />
                    </td>

                    <td className="px-6 py-4 text-right text-slate-600">
                      {p.costPrice !== null && p.costPrice !== undefined
                        ? `₹${Number(p.costPrice).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        : '—'}
                    </td>

                    <td className="px-6 py-4 text-right font-medium text-slate-900">
                      {p.sellingPrice !== null && p.sellingPrice !== undefined
                        ? `₹${Number(p.sellingPrice).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        : '—'}
                    </td>

                    <td className="px-6 py-4 text-right text-xs text-slate-500">
                      {p.lowStockThreshold !== null && p.lowStockThreshold !== undefined ? (
                        <span>{p.lowStockThreshold}</span>
                      ) : (
                        <span className="text-slate-400">
                          {organization?.defaultLowStockThreshold || 5} (Default)
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setAdjustingProduct(p)}
                          title="Adjust stock quantity"
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                        >
                          <ArrowUpDown className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => openEditModal(p)}
                          title="Edit product"
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDeletingProduct(p)}
                          title="Delete product"
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No products found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {searchTerm || lowStockFilter
                ? 'Try clearing your search term or low-stock filter to view all products.'
                : 'Get started by creating your very first inventory product.'}
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow transition"
            >
              Add First Product
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <ProductModal
        isOpen={isModalOpen}
        productToEdit={editingProduct}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        defaultThreshold={organization?.defaultLowStockThreshold || 5}
      />

      <StockAdjustModal
        isOpen={!!adjustingProduct}
        product={adjustingProduct}
        onClose={() => setAdjustingProduct(null)}
        onSubmit={handleAdjustStock}
      />

      <DeleteConfirmModal
        isOpen={!!deletingProduct}
        product={deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleDeleteProduct}
      />
    </div>
  );
};
