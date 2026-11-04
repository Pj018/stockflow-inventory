import React, { useState, useEffect, useMemo } from 'react';
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
  Download,
  Eye,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  AlertOctagon,
  Layers,
} from 'lucide-react';
import { api } from '../api/client';
import { Product } from '../types';
import { StockBadge } from '../components/Badge';
import { ProductModal } from '../components/ProductModal';
import { StockAdjustModal } from '../components/StockAdjustModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { ProductDetailModal } from '../components/ProductDetailModal';
import { useAuth } from '../context/AuthContext';

type SortField = 'name' | 'sku' | 'quantity' | 'sellingPrice' | 'createdAt';
type SortOrder = 'asc' | 'desc';
type StatusFilter = 'all' | 'lowStock' | 'outOfStock';

export const ProductsPage: React.FC = () => {
  const { organization } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState<string>(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    searchParams.get('lowStockOnly') === 'true' ? 'lowStock' : 'all'
  );

  // Sorting
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.getProducts({
        search: searchTerm || undefined,
        lowStockOnly: statusFilter === 'lowStock',
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
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  // Client-side filtering & sorting
  const processedProducts = useMemo(() => {
    let result = [...products];

    // Out of stock client filter
    if (statusFilter === 'outOfStock') {
      result = result.filter((p) => p.quantity === 0);
    }

    // Sorting
    result.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'name' || sortField === 'sku') {
        valA = (valA || '').toLowerCase();
        valB = (valB || '').toLowerCase();
      } else if (sortField === 'createdAt') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      } else {
        valA = valA ?? 0;
        valB = valB ?? 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [products, statusFilter, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (processedProducts.length === 0) return;

    const headers = [
      'Name',
      'SKU',
      'Description',
      'Quantity',
      'Stock Status',
      'Cost Price (INR)',
      'Selling Price (INR)',
      'Alert Threshold',
      'Last Updated By',
      'Created At',
    ];

    const rows = processedProducts.map((p) => [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.sku}"`,
      `"${(p.description || '').replace(/"/g, '""')}"`,
      p.quantity,
      p.quantity === 0 ? 'Out of Stock' : p.isLowStock ? 'Low Stock' : 'In Stock',
      p.costPrice ?? '',
      p.sellingPrice ?? '',
      p.lowStockThreshold ?? `${organization?.defaultLowStockThreshold || 5} (Default)`,
      `"${p.lastUpdatedBy || ''}"`,
      `"${new Date(p.createdAt).toLocaleDateString('en-IN')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `stockflow_inventory_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const totalUnits = useMemo(
    () => processedProducts.reduce((sum, p) => sum + p.quantity, 0),
    [processedProducts]
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Inventory Catalog
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your store items, SKUs, inventory levels, and pricing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={processedProducts.length === 0}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition shadow-sm disabled:opacity-50"
            title="Download products as CSV spreadsheet"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition shadow-sm hover:shadow active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or SKU..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </form>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            All Items
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('lowStock')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              statusFilter === 'lowStock'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Low Stock
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('outOfStock')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              statusFilter === 'outOfStock'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            Out of Stock
          </button>

          <button
            onClick={fetchProducts}
            title="Refresh list"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition ml-auto"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Catalog Metric Summary Bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Showing <strong className="text-slate-800">{processedProducts.length}</strong> items (
          <strong className="text-slate-800">{totalUnits}</strong> total units on hand)
        </span>
        <span className="text-slate-400">
          Sorted by: <strong className="text-slate-600">{sortField}</strong> ({sortOrder})
        </span>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Products Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {processedProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/75 text-xs uppercase font-semibold text-slate-500 tracking-wider border-b border-slate-100">
                <tr>
                  <th
                    onClick={() => toggleSort('name')}
                    className="px-6 py-3.5 cursor-pointer hover:bg-slate-100/75 transition select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Product & Details</span>
                      {sortField === 'name' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-300" />
                      )}
                    </div>
                  </th>

                  <th
                    onClick={() => toggleSort('sku')}
                    className="px-6 py-3.5 font-mono cursor-pointer hover:bg-slate-100/75 transition select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>SKU</span>
                      {sortField === 'sku' && (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                      )}
                    </div>
                  </th>

                  <th
                    onClick={() => toggleSort('quantity')}
                    className="px-6 py-3.5 text-right cursor-pointer hover:bg-slate-100/75 transition select-none"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Quantity on Hand</span>
                      {sortField === 'quantity' && (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                      )}
                    </div>
                  </th>

                  <th className="px-6 py-3.5 text-center">Status</th>

                  <th className="px-6 py-3.5 text-right">Cost Price</th>

                  <th
                    onClick={() => toggleSort('sellingPrice')}
                    className="px-6 py-3.5 text-right cursor-pointer hover:bg-slate-100/75 transition select-none"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Selling Price</span>
                      {sortField === 'sellingPrice' && (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                      )}
                    </div>
                  </th>

                  <th className="px-6 py-3.5 text-right">Threshold</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {processedProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition group">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openDetailModal(p)}
                        className="text-left group-hover:text-blue-600 transition"
                      >
                        <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition">
                          {p.name}
                        </p>
                        {p.description && (
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                            {p.description}
                          </p>
                        )}
                      </button>
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
                          onClick={() => openDetailModal(p)}
                          title="View product details & history"
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

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
              {searchTerm || statusFilter !== 'all'
                ? 'Try clearing your search term or active filters to view all products.'
                : 'Get started by creating your very first inventory product.'}
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition"
            >
              <Plus className="w-3.5 h-3.5" />
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

      <ProductDetailModal
        isOpen={!!detailProduct}
        product={detailProduct}
        onClose={() => setDetailProduct(null)}
        onAdjustStock={(p) => setAdjustingProduct(p)}
        onEdit={(p) => openEditModal(p)}
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
