import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const downloadSampleTemplate = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        'name,sku,quantity,costPrice,sellingPrice,category,description',
        'Wireless Bluetooth Mouse,MSE-BT-01,25,350,799,Electronics,2.4G ergonomic optical mouse',
        'Mechanical Keycaps Set,KCP-RGB-02,50,150,450,Accessories,PBT double-shot keycaps',
        'USB-C Fast Cable 1M,CBL-TC-03,100,45,199,Cables,Braided heavy duty fast charging',
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'stockflow_products_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccessMessage(null);
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          setError('CSV file must have a header row and at least 1 product row.');
          return;
        }

        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));
        const nameIdx = headers.indexOf('name');
        const skuIdx = headers.indexOf('sku');

        if (nameIdx === -1 || skuIdx === -1) {
          setError('CSV missing mandatory headers: "name" and "sku". Download the sample template.');
          return;
        }

        const qtyIdx = headers.indexOf('quantity');
        const costIdx = headers.indexOf('costprice');
        const sellingIdx = headers.indexOf('sellingprice');
        const catIdx = headers.indexOf('category');
        const descIdx = headers.indexOf('description');

        const items: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
          const name = cols[nameIdx];
          const sku = cols[skuIdx];
          if (!name || !sku) continue;

          items.push({
            name,
            sku,
            quantity: qtyIdx !== -1 && cols[qtyIdx] ? parseInt(cols[qtyIdx], 10) || 0 : 0,
            costPrice: costIdx !== -1 && cols[costIdx] ? parseFloat(cols[costIdx]) || null : null,
            sellingPrice:
              sellingIdx !== -1 && cols[sellingIdx] ? parseFloat(cols[sellingIdx]) || null : null,
            category: catIdx !== -1 && cols[catIdx] ? cols[catIdx] : 'General',
            description: descIdx !== -1 && cols[descIdx] ? cols[descIdx] : null,
          });
        }

        if (items.length === 0) {
          setError('No valid product rows found in the CSV.');
        } else {
          setParsedRows(items);
        }
      } catch (err: any) {
        setError('Failed to parse CSV file: ' + err.message);
      }
    };
    reader.readAsText(uploadedFile);
  };

  const handleImport = async () => {
    if (parsedRows.length === 0) return;
    try {
      setIsSubmitting(true);
      setError(null);
      const res = await api.bulkImportProducts(parsedRows);
      if (res.success) {
        setSuccessMessage(res.message);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to import products.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Bulk CSV Product Import</h3>
              <p className="text-xs text-slate-500">
                Quickly populate or bulk update your inventory catalog
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Instructions & Template */}
          <div className="flex items-center justify-between bg-blue-50/50 border border-blue-100 p-4 rounded-xl">
            <div className="text-xs text-slate-600">
              <p className="font-semibold text-blue-900">Need the correct column format?</p>
              <p className="mt-0.5">
                Download our sample spreadsheet with pre-formatted headers.
              </p>
            </div>
            <button
              onClick={downloadSampleTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-white hover:bg-blue-100/50 border border-blue-200 rounded-lg transition shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Sample CSV
            </button>
          </div>

          {/* File Upload Zone */}
          <label className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition text-center">
            <Upload className="w-8 h-8 text-slate-400 mb-2" />
            <span className="text-sm font-semibold text-slate-700">
              {file ? file.name : 'Click to select CSV file'}
            </span>
            <span className="text-xs text-slate-400 mt-1">Accepts standard .csv spreadsheets</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Parsed Rows Preview */}
          {parsedRows.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
                <span>Preview Ready for Import ({parsedRows.length} items)</span>
                <span className="text-emerald-600 font-bold">Valid format</span>
              </div>
              <div className="border border-slate-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
                {parsedRows.slice(0, 8).map((row, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-900">{row.name}</span>
                      <span className="ml-2 font-mono text-slate-500">[{row.sku}]</span>
                    </div>
                    <div className="text-slate-600">
                      Qty: <strong>{row.quantity}</strong> | Price: ₹{row.sellingPrice || '—'}
                    </div>
                  </div>
                ))}
                {parsedRows.length > 8 && (
                  <div className="p-2 text-center text-slate-400 text-xs bg-slate-50">
                    + {parsedRows.length - 8} more items...
                  </div>
                )}
              </div>
            </div>
          )}
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
            onClick={handleImport}
            disabled={parsedRows.length === 0 || isSubmitting}
            className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-sm transition"
          >
            {isSubmitting ? 'Importing Products...' : `Import ${parsedRows.length} Products`}
          </button>
        </div>
      </div>
    </div>
  );
};
