import React, { useState, useEffect } from 'react';
import { Star, X, CheckCircle2, MessageSquareHeart, AlertCircle } from 'lucide-react';

export interface OrderReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  displayOrderId: string;
  initialRating?: number;
  initialComment?: string | null;
  onSubmitSuccess: (review: { id: number; orderId: number; rating: number; comment?: string | null; createdAt: string }) => void;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Sangat Kecewa',
  2: 'Kurang Puas',
  3: 'Cukup Baik',
  4: 'Puas & Senang',
  5: 'Sangat Puas & Rekomendasi',
};

const QUICK_TAGS = [
  'Barang sesuai & lengkap',
  'Pelayanan koperasi cepat',
  'Kualitas barang bagus',
  'Pengambilan barcode praktis',
  'Harga terjangkau',
];

export const OrderReviewModal: React.FC<OrderReviewModalProps> = ({
  isOpen,
  onClose,
  orderId,
  displayOrderId,
  initialRating = 5,
  initialComment = '',
  onSubmitSuccess,
}) => {
  const [rating, setRating] = useState<number>(initialRating);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>(initialComment || '');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setRating(initialRating || 5);
      setComment(initialComment || '');
      setHoverRating(0);
      setErrorMessage(null);
    }
  }, [isOpen, initialRating, initialComment]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  const currentActiveRating = hoverRating || rating;

  const handleToggleTag = (tag: string) => {
    if (comment.includes(tag)) {
      setComment(prev => prev.replace(tag, '').replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '').trim());
    } else {
      setComment(prev => (prev ? `${prev}, ${tag}` : tag).slice(0, 500));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      setErrorMessage('Silakan pilih rating 1 sampai 5 bintang.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/orders/${orderId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          rating,
          comment: comment.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan ulasan');
      }

      onSubmitSuccess(data.review);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kendala saat mengirim ulasan';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 my-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center">
              <MessageSquareHeart className="w-5 h-5" />
            </div>
            <div>
              <h3 id="review-modal-title" className="text-base font-extrabold text-slate-900 leading-tight">
                {initialRating ? 'Ubah Ulasan Pesanan' : 'Beri Ulasan Pesanan'}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                ID Pesanan: {displayOrderId}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Tutup modal"
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col items-center justify-center text-center py-2 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-xs font-semibold text-slate-600 mb-2">Bagaimana pengalaman belanja Anda?</p>
            <div className="flex items-center gap-1.5" onMouseLeave={() => setHoverRating(0)}>
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = star <= currentActiveRating;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    aria-label={`Beri bintang ${star}`}
                    className="p-1 transition-transform hover:scale-110 active:scale-95 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-teal-500 rounded-lg"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        isFilled
                          ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                          : 'text-slate-300 stroke-slate-300'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <p className="text-xs font-extrabold text-teal-800 mt-2 h-4">
              {RATING_LABELS[currentActiveRating] || ''}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Pilihan Cepat
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TAGS.map((tag) => {
                const isSelected = comment.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-all ${
                      isSelected
                        ? 'bg-teal-50 border-teal-300 text-teal-800 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="order-review-comment" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Catatan Ulasan (Opsional)
              </label>
              <span className="text-[10px] text-slate-400 font-medium">
                {comment.length}/500
              </span>
            </div>
            <textarea
              id="order-review-comment"
              rows={3}
              maxLength={500}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ceritakan kepuasan Anda mengenai produk atau pelayanan pengambilan pesanan..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-hidden transition-all resize-none text-slate-800"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-xs shadow-teal-600/30 flex items-center justify-center gap-1.5"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{initialRating ? 'Perbarui Ulasan' : 'Kirim Ulasan'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
