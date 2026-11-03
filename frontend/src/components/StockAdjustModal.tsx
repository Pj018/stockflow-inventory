import React, { useState } from 'react';
import { X, ArrowUpDown, AlertCircle, Plus, Minus } from 'lucide-react';
import { Product } from '../types';

interface StockAdjustModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onSubmit: (productId: string, changeAmount: number, note?: string) => Promise<void>;
}

export const StockAdjustModal: React.FC<StockAdjustModalProps> = ({
  isOpen,
  product,
  onClose,
  onSubmit,
}) => {
  const [changeAmount, setChangeAmount] = useState<number>(1);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !product) return null;

  const newStock = product.quantity + changeAmount;
  const isInvalid = newStock < 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (changeAmount === 0) {
      setError('Adjustment amount cannot be zero.');
      return;
    }
    if (newStock < 0) {
      setError(`Cannot reduce stock by ${Math.abs(changeAmount)}. Only ${product.quantity} units on hand.`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit(product.id, changeAmount, note.trim() || undefined);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to adjust stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  const setAmount = (val: number) => {
    setChangeAmount(val);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <ArrowUpDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Adjust Inventory Stock</h3>
              <p className="text-xs text-slate-500 font-mono">{product.sku}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Product Summary banner */}
          <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-500">Product</p>
              <p className="text-sm font-semibold text-slate-800">{product.name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Current Stock</p>
              <p className="text-lg font-bold text-slate-900">{product.quantity} units</p>
            </div>
          </div>

          {/* Quick Increment/Decrement Buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Quick Increment / Decrement
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setAmount(-10)}
                className="py-1.5 px-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg border border-rose-200 transition"
              >
                -10
              </button>
              <button
                type="button"
                onClick={() => setAmount(-5)}
                className="py-1.5 px-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg border border-rose-200 transition"
              >
                -5
              </button>
              <button
                type="button"
                onClick={() => setAmount(-1)}
                className="py-1.5 px-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg border border-rose-200 transition"
              >
                -1
              </button>
              <button
                type="button"
                onClick={() => setAmount(1)}
                className="py-1.5 px-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition"
              >
                +1
              </button>
              <button
                type="button"
                onClick={() => setAmount(5)}
                className="py-1.5 px-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition"
              >
                +5
              </button>
              <button
                type="button"
                onClick={() => setAmount(10)}
                className="py-1.5 px-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition"
              >
                +10
              </button>
            </div>
          </div>

          {/* Direct Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Adjustment Amount (+/- Units)
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setChangeAmount((prev) => prev - 1)}
                className="p-2 border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-700"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                step="1"
                required
                value={changeAmount}
                onChange={(e) => setAmount(parseInt(e.target.value, 10) || 0)}
                className={`w-full text-center font-bold text-lg px-3 py-1.5 rounded-lg outline-none transition ${
                  isInvalid || changeAmount === 0
                    ? 'border-2 border-rose-300 bg-rose-50/30 text-rose-900 focus:ring-2 focus:ring-rose-500'
                    : 'border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setChangeAmount((prev) => prev + 1)}
                className="p-2 border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-700"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {changeAmount === 0 && (
              <p className="mt-1.5 text-xs text-amber-600 font-medium">Adjustment amount cannot be 0.</p>
            )}
            {isInvalid && (
              <p className="mt-1.5 text-xs text-rose-600 font-medium">
                Cannot reduce stock below 0. Max reduction is -{product.quantity}.
              </p>
            )}
          </div>

          {/* Calculated Result Preview */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between ${
              isInvalid
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-blue-50/70 border-blue-200 text-blue-900'
            }`}
          >
            <span className="text-xs font-medium">Projected New Stock Level:</span>
            <span className="text-sm font-bold">
              {newStock} units {changeAmount > 0 ? `(+${changeAmount})` : `(${changeAmount})`}
            </span>
          </div>

          {/* Reason Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Note / Reason (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Supplier restock, damaged stock write-off"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
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
              disabled={isSubmitting || isInvalid || changeAmount === 0}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm hover:shadow transition disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Confirm Stock Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
