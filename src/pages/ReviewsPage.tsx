import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import {
  Star,
  ArrowLeft,
  Search,
  Filter,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
  Clock,
  ThumbsUp,
  Tag,
  PackageCheck,
  RotateCcw,
  Edit3,
  Building2,
  Users,
  MessageSquareHeart,
  TrendingUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { OrderReviewModal } from '../components/modals/user/OrderReviewModal';

interface ReviewItem {
  id: number;
  orderId: number;
  userId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: {
    id: number;
    nama: string;
    pt: string;
    departemen: string;
  };
  order: {
    id: number;
    total_amount?: number;
    status?: string;
    createdAt?: string;
    items?: Array<{
      id: number;
      nama_barang: string;
      quantity: number;
    }>;
  } | null;
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  recommendationRate: number;
  distribution: Record<number, number>;
  tagCounts: Record<string, number>;
}

interface PendingReviewOrder {
  orderId: number;
  displayOrderId: string;
  items: Array<{ nama_barang: string; quantity: number }>;
}

const RATING_LABELS: Record<number, string> = {
  5: 'Sangat Puas & Rekomendasi',
  4: 'Puas & Senang',
  3: 'Cukup Baik',
  2: 'Kurang Puas',
  1: 'Sangat Kecewa',
};

const PREDEFINED_TAGS = [
  'Barang sesuai & lengkap',
  'Pelayanan koperasi cepat',
  'Kualitas barang bagus',
  'Pengambilan barcode praktis',
  'Harga terjangkau',
];

export const ReviewsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { toast } = useNotification();

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [onlyWithComment, setOnlyWithComment] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest'>('newest');

  // Pending reviews for logged-in user
  const [pendingOrders, setPendingOrders] = useState<PendingReviewOrder[]>([]);
  const [activeReviewModal, setActiveReviewModal] = useState<{
    orderId: number;
    displayOrderId: string;
    initialRating?: number;
    initialComment?: string | null;
  } | null>(null);

  useEffect(() => {
    fetchReviews();
    fetchPendingOrders();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/reviews', {
        headers: {
          Authorization: `Bearer ${token || localStorage.getItem('token')}`,
        },
      });

      if (!res.ok) {
        throw new Error('Gagal memuat ulasan');
      }

      const data = await res.json();
      setReviews(data.reviews || []);
      setStats(data.stats || null);
    } catch (err: unknown) {
      console.error('Error fetching reviews:', err);
      toast.error('Gagal memuat ulasan pelanggan');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingOrders = async () => {
    try {
      const res = await fetch(`/api/orders/history?t=${Date.now()}`, {
        headers: {
          Authorization: `Bearer ${token || localStorage.getItem('token')}`,
        },
      });

      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.orders || [];

      // Find finished orders without a review
      const unreviewed = list.filter(
        (o: { status?: string; review?: unknown }) => {
          const statusLower = (o.status || '').toLowerCase();
          const isDone = statusLower === 'selesai' || statusLower.includes('selesai');
          return isDone && !o.review;
        }
      );

      setPendingOrders(
        unreviewed.map((o: { id: number; createdAt: string; items?: Array<{ product?: { nama_barang: string }; quantity: number }> }) => ({
          orderId: o.id,
          displayOrderId: `#ORD-${String(o.id).padStart(4, '0')}`,
          items: (o.items || []).map((it) => ({
            nama_barang: it.product?.nama_barang || 'Barang Pesanan',
            quantity: it.quantity,
          })),
        }))
      );
    } catch (e) {
      console.warn('Could not check pending review orders:', e);
    }
  };

  // Filtered and sorted reviews
  const filteredReviews = useMemo(() => {
    return reviews
      .filter((rev) => {
        if (selectedRating !== null && rev.rating !== selectedRating) {
          return false;
        }

        if (onlyWithComment && (!rev.comment || rev.comment.trim() === '')) {
          return false;
        }

        if (selectedTag) {
          const commentLower = (rev.comment || '').toLowerCase();
          const tagLower = selectedTag.toLowerCase();
          if (!commentLower.includes(tagLower)) {
            return false;
          }
        }

        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const matchesName = rev.user?.nama?.toLowerCase().includes(q);
          const matchesDept = rev.user?.departemen?.toLowerCase().includes(q);
          const matchesPt = rev.user?.pt?.toLowerCase().includes(q);
          const matchesComment = rev.comment?.toLowerCase().includes(q);
          const matchesItems = rev.order?.items?.some((it) =>
            it.nama_barang.toLowerCase().includes(q)
          );

          if (!matchesName && !matchesDept && !matchesPt && !matchesComment && !matchesItems) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'highest') {
          return b.rating - a.rating;
        }
        if (sortBy === 'lowest') {
          return a.rating - b.rating;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [reviews, selectedRating, onlyWithComment, selectedTag, searchQuery, sortBy]);

  const handleReviewSubmitted = () => {
    fetchReviews();
    fetchPendingOrders();
    toast.success('Ulasan berhasil diperbarui');
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedRating(null);
    setSelectedTag(null);
    setOnlyWithComment(false);
    setSortBy('newest');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16">
      {/* Top Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl text-slate-600 hover:text-teal-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Kembali"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  Ulasan & Kepuasan Pelanggan
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                  <CheckCircle2 className="w-3 h-3 text-teal-600" />
                  KOKSI Terverifikasi
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Transparansi penilaian belanja & kualitas koperasi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/orders')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Pesanan Saya</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Pending Review CTA Banner */}
        {pendingOrders.length > 0 && (
          <section className="bg-gradient-to-r from-teal-800 to-teal-900 text-white rounded-3xl p-5 sm:p-6 shadow-md shadow-teal-950/10 border border-teal-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-slate-950">
                <Sparkles className="w-3.5 h-3.5" />
                Masukan Anda Sangat Berharga
              </div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
                Anda memiliki {pendingOrders.length} pesanan yang belum diulas
              </h2>
              <p className="text-xs sm:text-sm text-teal-100 max-w-xl">
                Bantu pengurus KOKSI menjaga kualitas dan pelayanan koperasi dengan memberikan bintang & ulasan pesanan yang telah diambil.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setActiveReviewModal({
                  orderId: pendingOrders[0].orderId,
                  displayOrderId: pendingOrders[0].displayOrderId,
                  initialRating: 5,
                  initialComment: '',
                })
              }
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-colors shadow-sm cursor-pointer shrink-0"
            >
              <Star className="w-4 h-4 fill-slate-950" />
              <span>Ulas Pesanan Sekarang</span>
            </button>
          </section>
        )}

        {/* Visual Analytics Hero Card */}
        {stats && (
          <section className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Scorecard Widget */}
              <div className="lg:col-span-4 flex flex-col items-center lg:items-start text-center lg:text-left border-b lg:border-b-0 lg:border-r border-slate-100 pb-6 lg:pb-0 lg:pr-6 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Skor Kepuasan Karyawan
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-slate-900 tracking-tight tabular-nums">
                    {stats.averageRating.toFixed(1)}
                  </span>
                  <span className="text-lg font-bold text-slate-400">/ 5.0</span>
                </div>

                <div className="flex items-center gap-1 text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(stats.averageRating)
                          ? 'fill-amber-400 stroke-amber-400'
                          : 'stroke-slate-300 fill-slate-100'
                      }`}
                    />
                  ))}
                </div>

                <p className="text-xs text-slate-500 font-medium">
                  Berdasarkan{' '}
                  <span className="font-bold text-slate-800">
                    {stats.totalReviews} ulasan
                  </span>{' '}
                  terverifikasi transaksi barcode
                </p>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold mt-1">
                  <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{stats.recommendationRate}% Pembeli Puas</span>
                </div>
              </div>

              {/* Rating Distribution Bars */}
              <div className="lg:col-span-5 space-y-2 border-b lg:border-b-0 lg:border-r border-slate-100 pb-6 lg:pb-0 lg:pr-6">
                <span className="text-xs font-bold text-slate-700 block mb-1">
                  Distribusi Bintang Penilaian
                </span>
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = stats.distribution[star] || 0;
                  const pct = stats.totalReviews > 0 ? Math.round((count / stats.totalReviews) * 100) : 0;
                  const isSelected = selectedRating === star;

                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSelectedRating(isSelected ? null : star)}
                      className={`w-full flex items-center gap-3 p-1.5 rounded-xl text-left transition-colors cursor-pointer ${
                        isSelected ? 'bg-amber-50/80 border border-amber-300' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1 w-12 shrink-0">
                        <span className="text-xs font-bold text-slate-700">{star}</span>
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      </div>
                      <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="w-16 text-right shrink-0">
                        <span className="text-xs font-medium text-slate-500">
                          {pct}% <span className="text-[10px] text-slate-400">({count})</span>
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Visual Tag Highlights */}
              <div className="lg:col-span-3 space-y-3">
                <div className="flex items-center gap-1.5 text-slate-800">
                  <TrendingUp className="w-4 h-4 text-teal-600" />
                  <span className="text-xs font-bold">Paling Banyak Diapresiasi</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {PREDEFINED_TAGS.map((tag) => {
                    const tagCount = stats.tagCounts[tag] || 0;
                    const isSelected = selectedTag === tag;
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSelectedTag(isSelected ? null : tag)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-teal-700 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <Tag className="w-3 h-3 shrink-0" />
                        <span>{tag}</span>
                        <span
                          className={`px-1 rounded-full text-[10px] font-bold ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {tagCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Filter and Search Bar */}
        <section className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari ulasan, nama karyawan, PT, barang..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
              />
            </div>

            {/* Sort Dropdown & Toggles */}
            <div className="flex items-center gap-2 flex-wrap">
              <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer select-none px-2 py-1.5 rounded-lg hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={onlyWithComment}
                  onChange={(e) => setOnlyWithComment(e.target.checked)}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span>Hanya Berkomentar</span>
              </label>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'highest' | 'lowest')}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                <option value="newest">Terbaru</option>
                <option value="highest">Rating Tertinggi</option>
                <option value="lowest">Rating Terendah</option>
              </select>

              {(selectedRating !== null || selectedTag !== null || searchQuery !== '' || onlyWithComment) && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Rating Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-slate-400 font-bold shrink-0">Filter:</span>
            <button
              type="button"
              onClick={() => setSelectedRating(null)}
              className={`px-3 py-1 rounded-full font-bold shrink-0 transition-colors cursor-pointer ${
                selectedRating === null
                  ? 'bg-teal-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({reviews.length})
            </button>
            {[5, 4, 3, 2, 1].map((r) => {
              const isSelected = selectedRating === r;
              const count = stats?.distribution[r] || 0;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedRating(isSelected ? null : r)}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-bold shrink-0 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{r}</span>
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  <span className="text-[10px] text-slate-500 font-normal">({count})</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Review Feed List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-medium">
            <span>
              Menampilkan <strong className="text-slate-900">{filteredReviews.length}</strong> ulasan
            </span>
            {selectedTag && (
              <span className="inline-flex items-center gap-1 text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full font-semibold">
                Tag: {selectedTag}
              </span>
            )}
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500">Memuat ulasan pelanggan...</p>
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                <Filter className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Tidak ada ulasan yang cocok</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Coba ubah kata kunci pencarian atau reset filter rating untuk melihat seluruh ulasan.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filter</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredReviews.map((rev) => {
                const isMyReview = user && rev.userId === user.id;
                const initials = rev.user?.nama
                  ? rev.user.nama
                      .split(' ')
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                  : 'K';

                return (
                  <article
                    key={rev.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:border-teal-200 transition-colors flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-3">
                      {/* Reviewer Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-700 to-teal-500 text-white flex items-center justify-center font-extrabold text-xs shadow-xs">
                            {initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-slate-900">
                                {rev.user?.nama || 'Karyawan KOKSI'}
                              </span>
                              {isMyReview && (
                                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-teal-100 text-teal-800">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 flex-wrap">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              <span>{rev.user?.pt || 'PT Sambu'}</span>
                              <span>•</span>
                              <span>{rev.user?.departemen || 'Umum'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Verified Pickup Badge */}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Ambil Barcode</span>
                        </span>
                      </div>

                      {/* Rating & Timestamp */}
                      <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= rev.rating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'stroke-slate-200 fill-slate-50'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-extrabold text-amber-950">
                            {rev.rating}.0
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            ({RATING_LABELS[rev.rating] || 'Puas'})
                          </span>
                        </div>

                        <span className="text-[11px] text-slate-400 font-medium shrink-0">
                          {format(new Date(rev.createdAt), 'dd MMM yyyy', { locale: id })}
                        </span>
                      </div>

                      {/* Comment */}
                      {rev.comment && rev.comment.trim() !== '' ? (
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal bg-slate-50/70 p-3 rounded-xl border border-slate-100 italic">
                          &ldquo;{rev.comment}&rdquo;
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">
                          (Pelanggan memberikan rating bintang tanpa catatan ulasan tertulis)
                        </p>
                      )}
                    </div>

                    {/* Footer: Order Items & Actions */}
                    <div className="border-t border-slate-100 pt-3 space-y-2">
                      {rev.order?.items && rev.order.items.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <PackageCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-[11px] text-slate-400 font-medium">Barang:</span>
                          {rev.order.items.map((it, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium"
                            >
                              {it.nama_barang} {it.quantity > 1 ? `x${it.quantity}` : ''}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Action for Author to edit */}
                      {isMyReview && (
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveReviewModal({
                                orderId: rev.orderId,
                                displayOrderId: `#ORD-${String(rev.orderId).padStart(4, '0')}`,
                                initialRating: rev.rating,
                                initialComment: rev.comment || '',
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Ubah Ulasan Anda</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Review Edit / Submit Modal */}
      {activeReviewModal && (
        <OrderReviewModal
          isOpen={true}
          onClose={() => setActiveReviewModal(null)}
          orderId={activeReviewModal.orderId}
          displayOrderId={activeReviewModal.displayOrderId}
          initialRating={activeReviewModal.initialRating}
          initialComment={activeReviewModal.initialComment}
          onSubmitSuccess={() => {
            setActiveReviewModal(null);
            handleReviewSubmitted();
          }}
        />
      )}
    </div>
  );
};
