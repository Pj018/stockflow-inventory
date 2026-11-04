import React from 'react';
import {
  X,
  Package,
  Layers,
  IndianRupee,
  Calendar,
  User,
  TrendingUp,
  History,
  ArrowUpDown,
  Edit2,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { Product } from '../types';
import { StockBadge } from './Badge';

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onAdjustStock: (product: Product) => void;
  onEdit: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  onClose,
  product,
  onAdjustStock,
  onEdit,
}) => {
  if (!isOpen || !product) return null;

  const cost = product.costPrice ?? null;
  const selling = product.sellingPrice ?? null;
  const margin =
    cost !== null && selling !== null && selling > 0
      ? Math.round(((selling - cost) / selling) * 100)
      : null;

  const totalCostValuation = cost !== null ? product.quantity * cost : null;
  const totalSellingValuation = selling !== null ? product.quantity * selling : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/60">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                {product.sku}
              </span>
              <StockBadge
                quantity={product.quantity}
                effectiveThreshold={product.effectiveThreshold}
              />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1.5">{product.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Description */}
          {product.description && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Description
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Key Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-blue-600" /> Units on Hand
              </span>
              <p className="text-lg font-bold text-slate-900 mt-1">
                {product.quantity}{' '}
                <span className="text-xs font-normal text-slate-500">units</span>
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Alert Threshold
              </span>
              <p className="text-lg font-bold text-slate-900 mt-1">
                {product.effectiveThreshold}{' '}
                <span className="text-xs font-normal text-slate-500">
                  {product.lowStockThreshold === null ? '(Default)' : ''}
                </span>
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5 text-slate-400" /> Cost Price
              </span>
              <p className="text-lg font-bold text-slate-900 mt-1">
                {cost !== null
                  ? `₹${cost.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : '—'}
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-600" /> Selling Price
              </span>
              <p className="text-lg font-bold text-slate-900 mt-1">
                {selling !== null
                  ? `₹${selling.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : '—'}
              </p>
            </div>
          </div>

          {/* Valuation & Margins */}
          <div className="bg-gradient-to-r from-slate-50 to-blue-50/40 p-4 rounded-xl border border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-xs font-semibold text-slate-500">Gross Margin</span>
              <p className="text-base font-bold text-slate-900 mt-0.5 flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                {margin !== null ? `${margin}%` : 'N/A'}
              </p>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500">Total Inventory Cost</span>
              <p className="text-base font-bold text-slate-900 mt-0.5">
                {totalCostValuation !== null
                  ? `₹${totalCostValuation.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : '—'}
              </p>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500">Total Potential Revenue</span>
              <p className="text-base font-bold text-blue-700 mt-0.5">
                {totalSellingValuation !== null
                  ? `₹${totalSellingValuation.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : '—'}
              </p>
            </div>
          </div>

          {/* Stock Movement Audit Log (PRD FR-5) */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              Stock Movement History
            </h4>

            {product.stockLogs && product.stockLogs.length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {product.stockLogs.map((log) => {
                  const isPositive = log.changeAmount > 0;
                  return (
                    <div
                      key={log.id}
                      className="p-3.5 flex items-center justify-between hover:bg-slate-50/60 transition text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                            isPositive
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {isPositive ? `+${log.changeAmount}` : log.changeAmount}
                        </span>
                        <div>
                          <p className="font-medium text-slate-800">
                            {log.note || (isPositive ? 'Restock / Inbound' : 'Stock reduced')}
                          </p>
                          <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>
                              From {log.previousQty} to {log.newQty} units
                            </span>
                            {log.updatedBy && (
                              <span className="flex items-center gap-0.5">
                                <User className="w-3 h-3" /> {log.updatedBy}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="text-right text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(log.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center text-xs text-slate-500">
                No recorded stock adjustments yet for this item.
              </div>
            )}
          </div>
        </div>

        {/* Action Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Created: {new Date(product.createdAt).toLocaleDateString('en-IN')}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onAdjustStock(product);
              }}
              className="px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1.5 transition"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              Adjust Stock
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(product);
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1.5 transition"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit Details
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
