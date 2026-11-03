import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Product } from '../types';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: {
    name: string;
    sku: string;
    description?: string;
    quantity: number;
    costPrice?: number | null;
    sellingPrice?: number | null;
    lowStockThreshold?: number | null;
  }) => Promise<void>;
  productToEdit?: Product | null;
  defaultThreshold: number;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  productToEdit,
  defaultThreshold,
}) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState<number>(0);
  const [costPrice, setCostPrice] = useState<string>('');
  const [sellingPrice, setSellingPrice] = useState<string>('');
  const [lowStockThreshold, setLowStockThreshold] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    sku?: string;
    quantity?: string;
    costPrice?: string;
    sellingPrice?: string;
    lowStockThreshold?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setSku(productToEdit.sku);
      setDescription(productToEdit.description || '');
      setQuantity(productToEdit.quantity);
      setCostPrice(productToEdit.costPrice !== null && productToEdit.costPrice !== undefined ? String(productToEdit.costPrice) : '');
      setSellingPrice(productToEdit.sellingPrice !== null && productToEdit.sellingPrice !== undefined ? String(productToEdit.sellingPrice) : '');
      setLowStockThreshold(productToEdit.lowStockThreshold !== null && productToEdit.lowStockThreshold !== undefined ? String(productToEdit.lowStockThreshold) : '');
    } else {
      setName('');
      setSku('');
      setDescription('');
      setQuantity(0);
      setCostPrice('');
      setSellingPrice('');
      setLowStockThreshold('');
    }
    setError(null);
    setFieldErrors({});
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const newErrors: typeof fieldErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Product name is required.';
    }

    const trimmedSku = sku.trim().toUpperCase();
    if (!trimmedSku) {
      newErrors.sku = 'SKU identifier is required.';
    }

    if (quantity < 0 || isNaN(quantity)) {
      newErrors.quantity = 'Quantity cannot be negative.';
    }

    if (costPrice.trim() !== '') {
      const numCost = parseFloat(costPrice);
      if (isNaN(numCost) || numCost < 0) {
        newErrors.costPrice = 'Cost price cannot be negative.';
      }
    }

    if (sellingPrice.trim() !== '') {
      const numSell = parseFloat(sellingPrice);
      if (isNaN(numSell) || numSell < 0) {
        newErrors.sellingPrice = 'Selling price cannot be negative.';
      }
    }

    if (lowStockThreshold.trim() !== '') {
      const numThreshold = parseInt(lowStockThreshold, 10);
      if (isNaN(numThreshold) || numThreshold < 0) {
        newErrors.lowStockThreshold = 'Low stock threshold cannot be negative.';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      setError(
        newErrors.name ||
        newErrors.sku ||
        newErrors.quantity ||
        newErrors.costPrice ||
        newErrors.sellingPrice ||
        newErrors.lowStockThreshold ||
        'Please correct the highlighted errors.'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        name: name.trim(),
        sku: trimmedSku,
        description: description.trim() || undefined,
        quantity: Math.max(0, Number(quantity) || 0),
        costPrice: costPrice.trim() !== '' ? parseFloat(costPrice) : null,
        sellingPrice: sellingPrice.trim() !== '' ? parseFloat(sellingPrice) : null,
        lowStockThreshold: lowStockThreshold.trim() !== '' ? parseInt(lowStockThreshold, 10) : null,
      });
      onClose();
    } catch (err: any) {
      const msg = err.message || 'Failed to save product';
      setError(msg);
      if (err.status === 409 || msg.toLowerCase().includes('sku')) {
        setFieldErrors({ sku: msg });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {productToEdit ? 'Edit Product' : 'Add New Product'}
            </h3>
            <p className="text-xs text-slate-500">
              {productToEdit ? `Updating ${productToEdit.sku}` : 'Fill in the inventory and product details'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} noValidate className="overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Product Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Wireless Mechanical Keyboard"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: undefined }));
                if (error) setError(null);
              }}
              className={`w-full px-3.5 py-2 text-sm rounded-lg outline-none transition ${
                fieldErrors.name
                  ? 'border border-rose-300 bg-rose-50/30 text-rose-900 focus:ring-2 focus:ring-rose-500'
                  : 'border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              }`}
            />
            {fieldErrors.name && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                SKU <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., KBD-WL-01"
                value={sku}
                onChange={(e) => {
                  setSku(e.target.value);
                  if (fieldErrors.sku) setFieldErrors((p) => ({ ...p, sku: undefined }));
                  if (error) setError(null);
                }}
                className={`w-full px-3.5 py-2 text-sm uppercase font-mono rounded-lg outline-none transition ${
                  fieldErrors.sku
                    ? 'border border-rose-300 bg-rose-50/30 text-rose-900 focus:ring-2 focus:ring-rose-500'
                    : 'border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
              {fieldErrors.sku ? (
                <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.sku}</p>
              ) : (
                <span className="text-[11px] text-slate-400">Unique to your store</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Quantity on Hand
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={quantity}
                onChange={(e) => {
                  setQuantity(parseInt(e.target.value, 10) || 0);
                  if (fieldErrors.quantity) setFieldErrors((p) => ({ ...p, quantity: undefined }));
                  if (error) setError(null);
                }}
                className={`w-full px-3.5 py-2 text-sm rounded-lg outline-none transition ${
                  fieldErrors.quantity
                    ? 'border border-rose-300 bg-rose-50/30 text-rose-900 focus:ring-2 focus:ring-rose-500'
                    : 'border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
              {fieldErrors.quantity ? (
                <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.quantity}</p>
              ) : (
                <span className="text-[11px] text-slate-400">Initial units in stock</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Cost Price (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={costPrice}
                onChange={(e) => {
                  setCostPrice(e.target.value);
                  if (fieldErrors.costPrice) setFieldErrors((p) => ({ ...p, costPrice: undefined }));
                  if (error) setError(null);
                }}
                className={`w-full px-3.5 py-2 text-sm rounded-lg outline-none transition ${
                  fieldErrors.costPrice
                    ? 'border border-rose-300 bg-rose-50/30 text-rose-900 focus:ring-2 focus:ring-rose-500'
                    : 'border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
              {fieldErrors.costPrice && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.costPrice}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Selling Price (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={sellingPrice}
                onChange={(e) => {
                  setSellingPrice(e.target.value);
                  if (fieldErrors.sellingPrice) setFieldErrors((p) => ({ ...p, sellingPrice: undefined }));
                  if (error) setError(null);
                }}
                className={`w-full px-3.5 py-2 text-sm rounded-lg outline-none transition ${
                  fieldErrors.sellingPrice
                    ? 'border border-rose-300 bg-rose-50/30 text-rose-900 focus:ring-2 focus:ring-rose-500'
                    : 'border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
              {fieldErrors.sellingPrice && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.sellingPrice}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Low Stock Threshold (Units)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              placeholder={`Org Default: ${defaultThreshold}`}
              value={lowStockThreshold}
              onChange={(e) => {
                setLowStockThreshold(e.target.value);
                if (fieldErrors.lowStockThreshold) setFieldErrors((p) => ({ ...p, lowStockThreshold: undefined }));
                if (error) setError(null);
              }}
              className={`w-full px-3.5 py-2 text-sm rounded-lg outline-none transition ${
                fieldErrors.lowStockThreshold
                  ? 'border border-rose-300 bg-rose-50/30 text-rose-900 focus:ring-2 focus:ring-rose-500'
                  : 'border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              }`}
            />
            {fieldErrors.lowStockThreshold ? (
              <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.lowStockThreshold}</p>
            ) : (
              <span className="text-[11px] text-slate-400">
                Leave blank to use organization default ({defaultThreshold} units)
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Brief details or supplier notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm hover:shadow transition disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : productToEdit ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
