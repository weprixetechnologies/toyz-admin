'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '../../../lib/api';
import { Upload, CheckCircle, FileText } from 'lucide-react';

export default function CsvImportPage() {
  const router = useRouter();
  const [csvText, setCsvText] = useState(
    `sku,name,slug,base_price,stock_qty\nCSV-ITEM-101,Imported Item 101,imported-item-101,1499.00,50\nCSV-ITEM-102,Imported Item 102,imported-item-102,2499.00,100`
  );
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setCsvText(evt.target.result);
      };
      reader.readAsText(file);
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    const res = await adminApi.post('/products/import', { csv_data: csvText });
    if (res.success) {
      setResult(res.data);
    } else {
      alert(res.message || 'CSV Import failed');
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-black text-slate-900">CSV Product Catalog Import</h1>
        <p className="text-xs text-gray-500">Bulk import products into the catalog with automated SKU reconciliation</p>
      </div>

      <form onSubmit={handleImportSubmit} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-md space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
            <Upload size={14} /> Upload CSV File or Paste Raw CSV Text:
          </label>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileUpload}
            className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase">Raw CSV Data Preview:</label>
          <textarea
            rows="8"
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            required
            className="w-full p-3 font-mono text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-sky-500"
          />
        </div>

        {result && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl space-y-1">
            <div className="font-bold text-sm flex items-center gap-1.5">
              <CheckCircle size={16} /> Import Complete!
            </div>
            <p className="text-xs">Successfully imported {result.imported_count || result.count || 0} products into catalog.</p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="bg-sky-600 text-white font-bold text-xs px-6 py-3 rounded-xl hover:bg-sky-700 transition"
          >
            {submitting ? 'Processing Batch Import...' : 'Confirm & Import Catalog CSV'}
          </button>
        </div>
      </form>
    </div>
  );
}
