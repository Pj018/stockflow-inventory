import React, { useRef } from 'react';
import { X, Printer, Barcode, Check } from 'lucide-react';
import { Product } from '../types';
import { useAuth } from '../context/AuthContext';

interface BarcodeModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
}

export const BarcodeModal: React.FC<BarcodeModalProps> = ({ isOpen, product, onClose }) => {
  const { organization } = useAuth();
  const labelRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !product) return null;

  const handlePrint = () => {
    window.print();
  };

  const codeString = product.barcode || product.sku;

  // Generate deterministic barcode bar widths based on char codes
  const generateBars = (code: string) => {
    const bars: boolean[] = [true, false, true]; // Start guard
    for (let i = 0; i < code.length; i++) {
      const charCode = code.charCodeAt(i);
      const pattern = (charCode * 31) % 128;
      for (let b = 0; b < 6; b++) {
        bars.push((pattern & (1 << b)) !== 0);
      }
      bars.push(false);
    }
    bars.push(true, false, true, true); // End guard
    return bars;
  };

  const bars = generateBars(codeString);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
              <Barcode className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Printable Barcode Label</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Label Preview Card (Printer target) */}
        <div className="p-6">
          <div
            ref={labelRef}
            className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center space-y-3 shadow-sm"
          >
            <div className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              {organization?.name || 'StockFlow Store'}
            </div>

            <h4 className="font-bold text-slate-900 text-base leading-snug">{product.name}</h4>

            {/* SVG Barcode Graphic */}
            <div className="py-2 flex flex-col items-center justify-center">
              <svg className="w-56 h-16" viewBox={`0 0 ${bars.length * 2} 60`}>
                {bars.map((isDark, idx) =>
                  isDark ? (
                    <rect key={idx} x={idx * 2} y="0" width="1.8" height="60" fill="#0f172a" />
                  ) : null
                )}
              </svg>
              <span className="font-mono text-xs tracking-widest text-slate-600 mt-1 font-semibold">
                {codeString}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
              <span className="text-slate-500 font-medium">SKU: {product.sku}</span>
              <span className="text-base font-extrabold text-blue-600">
                {product.sellingPrice !== null && product.sellingPrice !== undefined
                  ? `₹${Number(product.sellingPrice).toLocaleString('en-IN')}`
                  : '—'}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400 text-center mt-3">
            Designed for 50mm × 30mm or standard sticker label printers.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            Print Barcode Label
          </button>
        </div>
      </div>
    </div>
  );
};
