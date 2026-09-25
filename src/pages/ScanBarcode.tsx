import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

export const ScanBarcodeAdmin = () => {
  const { token, user } = useAuth();
  const { toast } = useNotification();
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState<{ type: 'success' | 'error', message: string, orderId?: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    let isScanning = true;

    scanner.render(async (decodedText) => {
      // Pause scanner while processing
      if (isProcessing || !isScanning) return;
      
      setIsProcessing(true);
      scanner.pause(true);

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
          setScanResult({
            type: 'success',
            message: data.message || 'Pesanan berhasil diselesaikan.',
            orderId: data.orderId
          });
          toast.success(data.message || 'Berhasil verifikasi pengambilan!');
        } else {
          setScanResult({
            type: 'error',
            message: data.error || 'Token tidak valid atau kadaluarsa.'
          });
          toast.error(data.error || 'Gagal memverifikasi token');
        }
      } catch (err: any) {
        setScanResult({
          type: 'error',
          message: 'Kesalahan koneksi ke server.'
        });
        toast.error('Kesalahan koneksi.');
      } finally {
        setIsProcessing(false);
        // Resume scanner after 3 seconds if error, or user can clear success
        setTimeout(() => {
          if (isScanning) {
            setScanResult(null);
            try {
              scanner.resume();
            } catch (e) {}
          }
        }, 3000);
      }
    }, (error) => {
      // Ignored: parse errors during scanning
    });

    return () => {
      isScanning = false;
      scanner.clear().catch(console.error);
    };
  }, [user, navigate, token]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center py-8">
      <div className="w-full max-w-lg px-4">
        <button 
          onClick={() => navigate('/admin')}
          className="mb-6 flex items-center gap-2 text-teal-700 hover:text-teal-800 font-semibold"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali ke Dashboard Admin</span>
        </button>

        <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden p-6">
          <h2 className="text-xl font-bold text-slate-900 text-center mb-2">Scan Barcode Pesanan</h2>
          <p className="text-sm text-slate-500 text-center mb-6">Arahkan kamera ke barcode pesanan anggota untuk menyelesaikan transaksi.</p>
          
          <div id="reader" className="w-full bg-slate-100 rounded-xl overflow-hidden min-h-[300px] mb-4"></div>

          {scanResult && (
            <div className={`mt-6 p-4 rounded-xl flex items-start gap-3 border ${scanResult.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
              {scanResult.type === 'success' ? (
                <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="font-bold">{scanResult.type === 'success' ? 'Berhasil!' : 'Gagal'}</h4>
                <p className="text-sm mt-1">{scanResult.message}</p>
                {scanResult.orderId && (
                  <p className="text-xs mt-1 font-bold">ID Pesanan: {scanResult.orderId}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
