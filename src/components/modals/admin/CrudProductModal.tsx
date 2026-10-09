import React from 'react';
import { X, RefreshCw, Camera, Search } from 'lucide-react';
import Barcode from 'react-barcode';

interface CrudProductModalProps {
  isModalOpen: boolean;
  setIsModalOpen: (val: boolean) => void;
  editingProduct: any;
  handleSubmit: (e: React.FormEvent) => void;
  formData: any;
  setFormData: (data: any) => void;
  smartCategorize: (name: string) => any;
  CATEGORY_STRUCTURES: any[];
  imageFile: File | null;
  setImageFile: (file: File | null) => void;
  imageInputRef: React.RefObject<HTMLInputElement>;
  generateBarcode: () => void;
  loading: boolean;
}

export const CrudProductModal: React.FC<CrudProductModalProps> = ({
  isModalOpen, setIsModalOpen, editingProduct, handleSubmit, formData, setFormData,
  smartCategorize, CATEGORY_STRUCTURES, imageFile, setImageFile, imageInputRef, generateBarcode, loading
}) => {
  if (!isModalOpen) return null;
  
  return (
<div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">
                {editingProduct ? 'Edit Produk' : 'Tambah Produk'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Nama Barang</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pocari Sweat 500ml"
                  value={formData.nama_barang}
                  onChange={(e) => {
                    const newName = e.target.value;
                    let newCat = formData.kategori;
                    let newSub = formData.sub_kategori;

                    const smartCat = smartCategorize(newName);
                    if (smartCat) {
                      newCat = smartCat.kategori;
                      newSub = smartCat.sub_kategori;
                    }

                    setFormData({
                      ...formData,
                      nama_barang: newName,
                      kategori: newCat,
                      sub_kategori: newSub
                    });
                  }}
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent sm:text-sm font-medium text-slate-800 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Kategori Utama</label>
                <select
                  required
                  value={formData.kategori}
                  onChange={(e) => {
                    const newCat = e.target.value;
                    const catData = CATEGORY_STRUCTURES.find(c => c.name === newCat);
                    const availableSubs = catData ? catData.subCategories : [];
                    setFormData({
                      ...formData,
                      kategori: newCat,
                      sub_kategori: availableSubs[0] || ''
                    });
                  }}
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 sm:text-sm font-bold text-slate-800 transition-colors"
                >
                  <option value="" disabled>Pilih Kategori</option>
                  {CATEGORY_STRUCTURES.map((cat) => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Sub-Kategori</label>
                <select
                  required
                  value={formData.sub_kategori}
                  onChange={(e) => setFormData({ ...formData, sub_kategori: e.target.value })}
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 sm:text-sm font-semibold text-slate-800 transition-colors"
                >
                  <option value="" disabled>Pilih Sub-Kategori</option>
                  {CATEGORY_STRUCTURES.find(c => c.name === formData.kategori)?.subCategories.map((subName) => (
                    <option key={subName} value={subName}>{subName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Gambar Produk</label>
                <div className="mt-1 flex items-center gap-4">
                  {(imageFile || formData.imageUrl) ? (
                    <div className="relative w-16 h-16 rounded overflow-hidden border border-slate-200">
                      <img 
                        src={imageFile ? URL.createObjectURL(imageFile) : formData.imageUrl} 
                        alt="Preview" 
                        className="object-cover w-full h-full"
                      />
                      <button 
                        type="button"
                        onClick={() => { setImageFile(null); setFormData({...formData, imageUrl: ''}); }}
                        className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-slate-100 rounded border border-dashed border-slate-300 flex items-center justify-center">
                      <Camera className="w-6 h-6 text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      ref={imageInputRef}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setImageFile(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50"
                      >
                        Pilih Gambar
                      </button>
                      <button
                        type="button"
                        disabled={!formData.nama_barang?.trim()}
                        onClick={() => window.open(
                          `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(formData.nama_barang + ' produk')}`,
                          '_blank',
                          'noopener,noreferrer'
                        )}
                        className="px-4 py-2 border border-teal-300 shadow-sm text-sm font-medium rounded-md text-teal-700 bg-teal-50 hover:bg-teal-100 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Search className="w-4 h-4" />
                        Cari Foto
                      </button>
                    </div>
                    <input
                      type="url"
                      placeholder="Atau tempel link gambar (klik kanan gambar → Salin alamat gambar)"
                      value={imageFile ? '' : (formData.imageUrl || '')}
                      onChange={(e) => { setImageFile(null); setFormData({ ...formData, imageUrl: e.target.value }); }}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    {formData.imageUrl?.includes('google.com/search') || formData.imageUrl?.includes('google.com/imgres') ? (
                      <p className="text-[10px] text-red-500 font-medium">⚠️ Link yang Anda masukkan salah. Jangan salin link dari bagian atas browser, tapi <b>Klik Kanan Gambarnya</b> lalu pilih <b>"Salin Alamat Gambar" (Copy image address)</b>.</p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Harga (Rp)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.harga}
                    onChange={(e) => setFormData({ ...formData, harga: parseInt(e.target.value) || 0 })}
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent sm:text-sm font-medium text-slate-800 transition-colors"
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-white border border-slate-200 shadow-sm text-xs font-bold uppercase tracking-widest rounded-xl text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-600 shadow-sm text-xs font-bold uppercase tracking-widest rounded-xl text-white hover:bg-teal-700 transition-colors cursor-pointer"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      
  );
};
