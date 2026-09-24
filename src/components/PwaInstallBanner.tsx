import React, { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PwaInstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // 1. Cek apakah sudah diinstal (Standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone || 
                        document.referrer.includes('android-app://');

    if (isStandalone) {
      return; // Jangan tampilkan apa-apa jika sudah di-install
    }

    // 2. Tidak lagi mengecek sessionStorage agar banner selalu muncul saat di-refresh (jika belum diinstal)

    // 3. Deteksi tipe perangkat (iOS vs lainnya)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      // Di iOS, 'beforeinstallprompt' tidak didukung. 
      // Jadi kita langsung tampilkan banner setelah delay 3 detik agar tidak mengganggu loading awal.
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }

    // 4. Untuk Android/Desktop Chrome, tangkap event beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      // Mencegah prompt bawaan muncul secara otomatis
      e.preventDefault();
      // Simpan event untuk dipicu nanti ketika user klik banner
      setDeferredPrompt(e);
      // Tampilkan banner kustom kita
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      // Jika iOS, tampilkan instruksi manual karena Apple tidak mengizinkan trigger install otomatis
      setShowIOSInstructions(true);
      setShowBanner(false);
      return;
    }

    if (deferredPrompt) {
      // Tampilkan dialog install bawaan OS
      deferredPrompt.prompt();
      
      // Tunggu respons user
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      
      // Event ini hanya bisa dipakai sekali
      setDeferredPrompt(null);
    }
  };

  const dismissBanner = () => {
    setShowBanner(false);
  };

  return (
    <>
      <AnimatePresence>
        {showBanner && (
          <motion.div 
            initial={{ y: 150, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 150, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-[340px] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 rounded-2xl p-3 z-[100] flex items-center justify-between gap-3"
          >
            <div className="flex-1 flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center shrink-0">
                <Download className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-800 leading-tight">Install Aplikasi Saza</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Akses lebih cepat & tanpa browser</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button 
                onClick={handleInstallClick}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-[11px] uppercase tracking-wide font-bold rounded-lg transition-colors shadow-sm"
              >
                Install
              </button>
              <button 
                onClick={dismissBanner}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showIOSInstructions && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-end justify-center sm:items-center p-4"
            onClick={() => setShowIOSInstructions(false)}
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-teal-400 to-emerald-500"></div>
              <div className="flex justify-between items-center mb-5 mt-2">
                <h3 className="font-bold text-lg text-slate-900">Install di iOS (iPhone/iPad)</h3>
                <button 
                  onClick={() => setShowIOSInstructions(false)}
                  className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-5">
                <p className="text-[13px] text-slate-600 leading-relaxed">
                  Browser Safari (iOS) tidak mendukung instalasi otomatis. Untuk menginstal aplikasi ini, ikuti langkah mudah berikut:
                </p>
                <ol className="space-y-4">
                  <li className="flex gap-4 items-start">
                    <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-700 shrink-0 mt-0.5">1</span>
                    <p className="text-[13px] text-slate-700 leading-relaxed">
                      Tekan ikon <strong>Share</strong> (Bagikan) <Share className="w-4 h-4 inline-block mx-1 text-blue-500" /> di menu navigasi bawah Safari Anda.
                    </p>
                  </li>
                  <li className="flex gap-4 items-start">
                    <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-700 shrink-0 mt-0.5">2</span>
                    <p className="text-[13px] text-slate-700 leading-relaxed">
                      Gulir menu ke bawah lalu pilih opsi <br/><strong className="bg-slate-100 px-2 py-0.5 rounded text-slate-800 inline-block mt-1">Tambahkan ke Layar Utama</strong> <br/> (atau <em>Add to Home Screen</em>).
                    </p>
                  </li>
                  <li className="flex gap-4 items-start">
                    <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-700 shrink-0 mt-0.5">3</span>
                    <p className="text-[13px] text-slate-700 leading-relaxed">
                      Tekan tombol <strong>Tambah</strong> (Add) di sudut kanan atas layar.
                    </p>
                  </li>
                </ol>
                <button 
                  onClick={() => setShowIOSInstructions(false)}
                  className="w-full mt-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors"
                >
                  Saya Mengerti
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
