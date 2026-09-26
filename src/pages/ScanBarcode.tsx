import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { ArrowLeft, CheckCircle, XCircle, Camera, Loader2 } from 'lucide-react';

export const ScanBarcodeAdmin = () => {
  const { token, user } = useAuth();
  const { toast } = useNotification();
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState<{ type: 'success' | 'error', message: string, orderId?: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const html5QrRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    const qr = new Html5Qrcode('qr-reader');
    html5QrRef.current = qr;

    const startCamera = async () => {
      try {
        setIsStarting(true);
        setCamError(null);

        await qr.start(
          { facingMode: 'environment' }, // kamera belakang
          {
            fps: 10,
            qrbox: { width: 260, height: 260 },
            aspectRatio: 1.0,
          },
          async (decodedText) => {
            if (isScanningRef.current || isProcessing) return;
            isScanningRef.current = true;
            setIsProcessing(true);

            try {
              await qr.pause(true);
            } catch (_) {}

            try {
              const authToken = token || localStorage.getItem('token');
              const res = await fetch('/api/orders/pickup', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${authToken}`
                },
                body: JSON.stringify({ pickupToken: decodedText })
              });

              const data = await res.json();
              if (res.ok) {
                setScanResult({ type: 'success', message: data.message || 'Pesanan berhasil diselesaikan.', orderId: data.orderId });
                toast.success(data.message || 'Berhasil verifikasi pengambilan!');
                setTimeout(() => {
                  setScanResult(null);
                  isScanningRef.current = false;
                  setIsProcessing(false);
                  try { qr.resume(); } catch (_) {}
                }, 4000);
              } else {
                setScanResult({ type: 'error', message: data.error || 'Token tidak valid atau kadaluarsa.' });
                toast.error(data.error || 'Gagal memverifikasi token');
                setTimeout(() => {
                  setScanResult(null);
                  isScanningRef.current = false;
                  setIsProcessing(false);
                  try { qr.resume(); } catch (_) {}
                }, 3000);
              }
            } catch (err) {
              setScanResult({ type: 'error', message: 'Kesalahan koneksi ke server.' });
              toast.error('Kesalahan koneksi.');
              setTimeout(() => {
                setScanResult(null);
                isScanningRef.current = false;
                setIsProcessing(false);
                try { qr.resume(); } catch (_) {}
              }, 3000);
            }
          },
          () => { /* per-frame errors, ignored */ }
        );

        setIsStarting(false);
      } catch (err: any) {
        setIsStarting(false);
        const msg = err?.message || String(err);
        if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('notallowed')) {
          setCamError('Akses kamera ditolak. Silakan izinkan kamera di pengaturan browser Anda.');
        } else {
          setCamError('Gagal membuka kamera. Pastikan kamera tersedia dan izin diberikan.');
        }
      }
    };

    startCamera();

    return () => {
      isScanningRef.current = true; // prevent new scans
      if (html5QrRef.current) {
        html5QrRef.current.stop().catch(() => {}).finally(() => {
          html5QrRef.current?.clear().catch(() => {});
        });
      }
    };
  }, [user, navigate, token]);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 bg-slate-800/80 backdrop-blur border-b border-slate-700">
        <button
          onClick={() => navigate('/admin')}
          className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-bold text-base">Scan Barcode Pesanan</h1>
          <p className="text-slate-400 text-xs">Arahkan ke QR Code anggota</p>
        </div>
      </div>

      {/* Camera area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4">

        {/* QR viewfinder */}
        <div className="relative w-full max-w-sm">
          {/* The html5-qrcode video element mounts here */}
          <div
            id="qr-reader"
            className="w-full rounded-2xl overflow-hidden bg-black"
            style={{ minHeight: 300 }}
          />

          {/* Overlay: loading */}
          {isStarting && !camError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 rounded-2xl">
              <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
              <p className="text-sm text-slate-300 font-medium">Membuka kamera...</p>
            </div>
          )}

          {/* Overlay: corner brackets */}
          {!isStarting && !camError && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-[200px] h-[200px]">
                {/* TL */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-teal-400 rounded-tl-lg" />
                {/* TR */}
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-teal-400 rounded-tr-lg" />
                {/* BL */}
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-teal-400 rounded-bl-lg" />
                {/* BR */}
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-teal-400 rounded-br-lg" />
                {/* Scan line */}
                <div className="absolute left-0 right-0 h-0.5 bg-teal-400/70 animate-bounce" style={{ top: '50%' }} />
              </div>
            </div>
          )}

          {/* Camera error */}
          {camError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/95 rounded-2xl p-6 text-center">
              <Camera className="w-10 h-10 text-red-400" />
              <p className="text-red-300 text-sm font-semibold">{camError}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 px-5 py-2 bg-teal-600 hover:bg-teal-500 rounded-xl text-sm font-bold transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          )}
        </div>

        {/* Processing indicator */}
        {isProcessing && !scanResult && (
          <div className="flex items-center gap-2 text-teal-300 text-sm font-medium">
            <Loader2 className="w-4 h-4 animate-spin" />
            Memverifikasi barcode...
          </div>
        )}

        {/* Scan result */}
        {scanResult && (
          <div className={`w-full max-w-sm p-4 rounded-2xl flex items-start gap-3 border ${
            scanResult.type === 'success'
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-100'
              : 'bg-red-500/20 border-red-500/40 text-red-100'
          }`}>
            {scanResult.type === 'success'
              ? <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              : <XCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
            }
            <div>
              <h4 className="font-bold text-base">{scanResult.type === 'success' ? '✅ Berhasil!' : '❌ Gagal'}</h4>
              <p className="text-sm mt-0.5 opacity-90">{scanResult.message}</p>
              {scanResult.orderId && (
                <p className="text-xs mt-1 font-bold opacity-70">ID Pesanan: #{scanResult.orderId}</p>
              )}
            </div>
          </div>
        )}

        {/* Hint */}
        {!isStarting && !camError && !scanResult && (
          <p className="text-slate-400 text-xs text-center max-w-[260px]">
            Posisikan QR Code anggota di dalam kotak. Scan otomatis berjalan.
          </p>
        )}
      </div>
    </div>
  );
};
