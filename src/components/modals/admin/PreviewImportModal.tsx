import React from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, CheckSquare, ChevronDown, Info, PackageSearch, RefreshCw, Save, Table, Wand2, X } from 'lucide-react';
import { Product } from '../../../types';

interface PreviewImportModalProps {
  isPreviewModalOpen: boolean;
  setIsPreviewModalOpen: (val: boolean) => void;
  importPreviewData: any[] | null;
  setImportPreviewData: React.Dispatch<React.SetStateAction<any[]>>;
  isSubmittingPreview: boolean;
  handleSubmitPreview: () => void;
  smartCategorize: (name: string) => any;
  CATEGORY_STRUCTURES: any[];
}

export const PreviewImportModal: React.FC<PreviewImportModalProps> = ({
  isPreviewModalOpen, setIsPreviewModalOpen, importPreviewData, setImportPreviewData, isSubmittingPreview, handleSubmitPreview,
  smartCategorize, CATEGORY_STRUCTURES
}) => {
  if (!importPreviewData) return null;
  
  return (
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center">
                  <CheckSquare className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Preview Data Produk</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Periksa kembali kategori & sub-kategori sebelum disimpan. Sistem akan merekam pilihan Anda untuk ke depannya.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Table */}
            <div className="flex-1 overflow-auto bg-slate-50 p-6">
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3">Nama Produk</th>
                      <th className="px-4 py-3">Kategori</th>
                      <th className="px-4 py-3">Sub Kategori</th>
                      <th className="px-4 py-3">Harga</th>
                      <th className="px-4 py-3">Stok</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {importPreviewData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-800">{item.nama_barang}</td>
                        <td className="px-4 py-3">
                          <select
                            value={item.kategori}
                            onChange={(e) => {
                              const newCat = e.target.value;
                              const newSub = CATEGORY_STRUCTURES.find(c => c.name === newCat)?.subCategories[0] || '';
                              setImportPreviewData(prev => prev.map((p, i) => i === idx ? { ...p, kategori: newCat, sub_kategori: newSub, isModified: true } : p));
                            }}
                            className="w-full text-xs rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                          >
                            {CATEGORY_STRUCTURES.map(c => (
                              <option key={c.name} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={item.sub_kategori}
                            onChange={(e) => {
                              setImportPreviewData(prev => prev.map((p, i) => i === idx ? { ...p, sub_kategori: e.target.value, isModified: true } : p));
                            }}
                            className="w-full text-xs rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                          >
                            <option value="">Pilih Sub Kategori</option>
                            {(CATEGORY_STRUCTURES.find(c => c.name === item.kategori)?.subCategories || []).map(sc => (
                              <option key={sc} value={sc}>{sc}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">Rp {item.harga.toLocaleString('id-ID')}</td>
                        <td className="px-4 py-3">{item.stok}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {importPreviewData.length === 0 && (
                  <div className="text-center py-8 text-slate-500">Tidak ada produk untuk diimport.</div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
                disabled={isSubmittingPreview}
              >
                Batal
              </button>
              <button
                onClick={handleSubmitPreview}
                disabled={isSubmittingPreview || importPreviewData.length === 0}
                className="px-5 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-sm hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingPreview ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan ke Database</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      
  );
};
