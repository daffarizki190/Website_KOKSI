import React, { useState, useEffect } from 'react';
import { ShoppingCart, PackageCheck, CheckCircle2, ChevronRight, X } from 'lucide-react';

export const TutorialModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('hasSeenTutorial', 'true');
    setIsOpen(false);
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleClose();
    }
  };

  const slides = [
    {
      title: "Selamat Datang di BelanjaIn Saza!",
      description: "Aplikasi khusus untuk karyawan PT. Siemens Indonesia dalam berbelanja di Koperasi Saza. Lebih mudah, cepat, dan praktis tanpa antre kasir.",
      icon: <ShoppingCart className="w-16 h-16 text-teal-600 mb-4 mx-auto" />
    },
    {
      title: "1. Pesan & Checkout",
      description: "Pilih kebutuhan Anda dari berbagai kategori yang tersedia, masukkan ke keranjang, dan selesaikan pesanan (Checkout) langsung dari HP Anda.",
      icon: <ShoppingCart className="w-16 h-16 text-emerald-500 mb-4 mx-auto" />
    },
    {
      title: "2. Pengambilan Barang",
      description: "Anda akan mendapatkan ID Pesanan. Tunjukkan ID tersebut ke petugas koperasi saat mengambil barang pesanan Anda.",
      icon: <PackageCheck className="w-16 h-16 text-indigo-500 mb-4 mx-auto" />
    },
    {
      title: "3. Transaksi Selesai",
      description: "Setelah barang diambil, status pesanan akan menjadi Selesai. Anda dapat melihat seluruh riwayat belanja Anda di menu Riwayat.",
      icon: <CheckCircle2 className="w-16 h-16 text-teal-500 mb-4 mx-auto" />
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl relative">
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 text-center min-h-[320px] flex flex-col justify-center animate-in slide-in-from-bottom-4 duration-500">
          {slides[currentSlide].icon}
          <h2 className="text-xl font-extrabold text-slate-900 mb-3">{slides[currentSlide].title}</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {slides[currentSlide].description}
          </p>
        </div>

        <div className="bg-slate-50 p-6 flex flex-col items-center border-t border-slate-100">
          <div className="flex gap-2 mb-6">
            {slides.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-2 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-6 bg-teal-600' : 'w-2 bg-slate-300'}`}
              />
            ))}
          </div>

          <button 
            onClick={handleNext}
            className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-2xl font-bold flex justify-center items-center gap-2 transition-colors shadow-lg shadow-teal-600/30"
          >
            {currentSlide === slides.length - 1 ? 'Mulai Belanja Sekarang!' : 'Lanjut'}
            {currentSlide < slides.length - 1 && <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

