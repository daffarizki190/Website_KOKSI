import React, { useState, useEffect, useRef } from 'react';
import { 
  MessagesSquare, 
  X, 
  Send, 
  Check, 
  CheckCheck, 
  ChevronLeft, 
  Bot, 
  Clock, 
  PackageCheck, 
  CreditCard, 
  RefreshCw, 
  ExternalLink,
  PhoneCall,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface ChatMessage {
  id: number;
  senderId: number;
  receiverId: number | null;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface BotResponseItem {
  id: string;
  type: 'order_status' | 'operating_hours' | 'how_to_pickup' | 'wait_template' | 'general';
  title: string;
  content: string;
  data?: any;
  createdAt: Date;
}

interface UserChatWidgetProps {
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}

export const UserChatWidget: React.FC<UserChatWidgetProps> = ({ isOpen: propIsOpen, setIsOpen: propSetIsOpen }) => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = propIsOpen !== undefined ? propIsOpen : internalIsOpen;
  const setIsOpen = propSetIsOpen || setInternalIsOpen;
  const [hasOpenedChat, setHasOpenedChat] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Local Bot Interactive Messages & Order Status
  const [botMessages, setBotMessages] = useState<BotResponseItem[]>([]);
  const [latestOrder, setLatestOrder] = useState<any | null>(null);
  const [isCheckingOrder, setIsCheckingOrder] = useState(false);

  const fetchMessages = async (isChatOpen: boolean) => {
    if (!token) return;
    try {
      const res = await fetch('/api/chats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        
        const unread = data.filter((m: ChatMessage) => m.senderId !== user?.id && !m.isRead);
        setUnreadCount(unread.length);
        
        // Mark incoming messages as read ONLY if chat is open
        if (isChatOpen && unread.length > 0) {
          fetch('/api/chats/read', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({})
          }).then(() => {
            setUnreadCount(0);
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch chats', err);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchMessages(isOpen);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    fetchMessages(isOpen);
    const interval = setInterval(() => fetchMessages(isOpen), 5000); // poll every 5s
    return () => clearInterval(interval);
  }, [isOpen, token, user?.id]);

  useEffect(() => {
    const handleOpenChat = () => {
      setIsOpen(true);
      setHasOpenedChat(true);
    };
    window.addEventListener('openChat', handleOpenChat);
    return () => window.removeEventListener('openChat', handleOpenChat);
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, botMessages, isOpen]);

  // Fetch active order for quick status
  const fetchActiveOrderStatus = async () => {
    setIsCheckingOrder(true);
    try {
      const res = await fetch(`/api/orders/history?t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          // Cari pesanan yang belum selesai/dibatalkan terlebih dahulu
          const active = data.find((o: any) => o.status !== 'Selesai' && o.status !== 'Dibatalkan') || data[0];
          setLatestOrder(active);
          
          setBotMessages(prev => [
            ...prev,
            {
              id: 'order-' + Date.now(),
              type: 'order_status',
              title: 'Status Pesanan Terkini',
              content: `Pesanan #${active.id} saat ini berstatus: ${active.status}`,
              data: active,
              createdAt: new Date()
            }
          ]);
        } else {
          setBotMessages(prev => [
            ...prev,
            {
              id: 'order-' + Date.now(),
              type: 'order_status',
              title: 'Status Pesanan',
              content: 'Anda belum memiliki riwayat pesanan aktif di KOKSI.',
              createdAt: new Date()
            }
          ]);
        }
      }
    } catch (e) {
      setBotMessages(prev => [
        ...prev,
        {
          id: 'order-' + Date.now(),
          type: 'order_status',
          title: 'Status Pesanan',
          content: 'Tidak dapat memeriksa pesanan saat ini. Silakan buka menu Pesanan.',
          createdAt: new Date()
        }
      ]);
    } finally {
      setIsCheckingOrder(false);
    }
  };

  const handleSelectQuickAction = (actionKey: 'order' | 'hours' | 'pickup' | 'admin') => {
    if (actionKey === 'order') {
      fetchActiveOrderStatus();
    } else if (actionKey === 'hours') {
      setBotMessages(prev => [
        ...prev,
        {
          id: 'hours-' + Date.now(),
          type: 'operating_hours',
          title: 'Jadwal Operasional Pemesanan Web',
          content: 'Layanan pemesanan BelanjaIn Saza dibuka setiap hari Senin dan Selasa.\n\nDi luar hari tersebut (Rabu s/d Minggu), layanan pemesanan barang ditutup sesuai jadwal operasional sistem.',
          createdAt: new Date()
        }
      ]);
    } else if (actionKey === 'pickup') {
      setBotMessages(prev => [
        ...prev,
        {
          id: 'pickup-' + Date.now(),
          type: 'how_to_pickup',
          title: 'Cara Pengambilan & Pembayaran',
          content: '1. Pesan barang di BelanjaIn Saza.\n2. Pantau status hingga "Siap Diambil".\n3. Buka menu Pesanan, tunjukkan QR Code Barcode Anda ke kasir Koperasi untuk verifikasi!',
          createdAt: new Date()
        }
      ]);
    } else if (actionKey === 'admin') {
      // Template pesan mohon menunggu
      setBotMessages(prev => [
        ...prev,
        {
          id: 'admin-tpl-' + Date.now(),
          type: 'wait_template',
          title: 'Diteruskan ke Admin KOKSI',
          content: `Halo ${user?.nama || 'Kak'}! Silakan tulis pertanyaan atau keluhan Anda di bawah ini.\n\nTim Admin KOKSI akan segera membaca & membalas chat Anda secepat mungkin. Mohon menunggu sebentar ya!`,
          createdAt: new Date()
        }
      ]);
      inputRef.current?.focus();
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !token) return;

    const tempMessage = newMessage;
    setNewMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: tempMessage }) // receiverId is null (to Admin)
      });
      
      if (res.ok) {
        await fetchMessages(isOpen);
      } else {
        setNewMessage(tempMessage); // restore on fail
      }
    } catch (err) {
      console.error('Failed to send message', err);
      setNewMessage(tempMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || user.role?.toLowerCase() !== 'user') return null;

  return (
    <>
      {/* Floating Desktop Button */}
      <AnimatePresence>
        {!isOpen && (
          <div className="hidden md:flex fixed bottom-6 right-6 z-40 flex-col items-end gap-3">
            {!hasOpenedChat && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ 
                  delay: 0.5,
                  y: { repeat: Infinity, repeatType: 'reverse', duration: 1 }
                }}
                className="relative bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-xl flex items-center justify-center cursor-pointer mb-2 mr-2"
                onClick={() => {
                  setIsOpen(true);
                  setHasOpenedChat(true);
                }}
              >
                <span>Ada pertanyaan? Chat Admin di sini</span>
                <div className="absolute -bottom-2 right-4 w-0 h-0 border-l-[8px] border-l-transparent border-t-[10px] border-t-emerald-600 border-r-[8px] border-r-transparent"></div>
              </motion.div>
            )}

            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setIsOpen(true);
                setHasOpenedChat(true);
              }}
              className="tour-chat w-14 h-14 bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-teal-700/30 hover:shadow-xl hover:shadow-teal-700/40 transition-all relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 scale-0 group-hover:scale-100 rounded-full transition-transform duration-300"></div>
              <MessagesSquare className="w-6 h-6 relative z-10" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white z-20 shadow-sm animate-pulse">
                  {unreadCount}
                </span>
              )}
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      {/* Main Chat Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.97 }}
            transition={{ type: "spring", damping: 25, stiffness: 280 }}
            className="fixed inset-0 md:inset-auto md:bottom-6 md:right-6 w-full h-full md:w-[390px] md:h-[620px] md:max-h-[88vh] bg-slate-50 md:rounded-3xl shadow-2xl flex flex-col overflow-hidden z-[150] md:z-50 border-0 md:border md:border-slate-200/80 font-sans"
          >
            {/* Header: Clean Glassmorphism & Support CS Badge */}
            <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/70 px-4 py-3 shrink-0 flex items-center justify-between shadow-xs sticky top-0 z-20">
              <div className="flex items-center gap-3">
                {/* Back button for mobile/APK */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 -ml-1 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-full transition-colors active:scale-95"
                  title="Kembali"
                  aria-label="Kembali"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                {/* CS Avatar & Indicator */}
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-500 p-0.5 shadow-sm flex items-center justify-center text-white">
                    <MessagesSquare className="w-5 h-5" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  </span>
                </div>

                {/* Text Info */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-bold text-slate-800 text-sm leading-tight">Admin KOKSI</h2>
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-[10px] font-semibold px-1.5 py-0.2 rounded-md">
                      Support
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <p className="text-[11px] text-slate-500 font-medium">Online • Respon Cepat</p>
                  </div>
                </div>
              </div>

              {/* Action Header Icons */}
              <div className="flex items-center gap-1">
                <button 
                  onClick={handleManualRefresh}
                  className={`p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all ${isRefreshing ? 'animate-spin text-teal-600' : ''}`}
                  title="Segarkan Pesan"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                  title="Tutup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* Quick Action Chips Bar (FAQ & Shortcuts) */}
            <div className="bg-white/70 backdrop-blur-sm border-b border-slate-100 px-3 py-2 shrink-0 overflow-x-auto no-scrollbar flex items-center gap-1.5 z-10 shadow-xs">
              <button
                onClick={() => handleSelectQuickAction('order')}
                disabled={isCheckingOrder}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50/80 hover:bg-teal-100/90 text-teal-800 text-[11px] font-semibold rounded-full border border-teal-200/60 transition-all shrink-0 active:scale-95 disabled:opacity-50"
              >
                <PackageCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>Cek Pesanan</span>
              </button>

              <button
                onClick={() => handleSelectQuickAction('hours')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-full border border-slate-200/60 transition-all shrink-0 active:scale-95"
              >
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Jadwal Pemesanan</span>
              </button>

              <button
                onClick={() => handleSelectQuickAction('pickup')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-full border border-slate-200/60 transition-all shrink-0 active:scale-95"
              >
                <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                <span>Cara Ambil</span>
              </button>

              <button
                onClick={() => handleSelectQuickAction('admin')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold rounded-full border border-emerald-200/60 transition-all shrink-0 active:scale-95"
              >
                <Bot className="w-3.5 h-3.5 text-emerald-600" />
                <span>Chat Admin</span>
              </button>
            </div>

            {/* Chat Body & Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gradient-to-b from-slate-50 via-teal-50/10 to-slate-100/80">
              {/* Bot Welcome Card */}
              <div className="bg-white/95 rounded-2xl p-3.5 border border-teal-100/80 shadow-sm space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Asisten Layanan KOKSI</h4>
                    <p className="text-[10px] text-slate-400">Siap membantu informasi dan transaksi Anda</p>
                  </div>
                </div>
                
                <p className="text-xs text-slate-600 leading-relaxed">
                  Halo <strong>{user.nama}</strong>! Ada yang bisa kami bantu? Pilih menu bantuan instan di bawah atau ketik pesan langsung kepada tim admin koperasi.
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleSelectQuickAction('order')}
                    className="flex flex-col text-left p-2 rounded-xl bg-teal-50/60 hover:bg-teal-100/60 border border-teal-100 text-teal-900 transition-colors"
                  >
                    <span className="text-[11px] font-bold flex items-center gap-1">
                      <PackageCheck className="w-3.5 h-3.5 text-teal-600" />
                      Status Pesanan
                    </span>
                    <span className="text-[9px] text-teal-700/80 mt-0.5">Pantau pesanan Anda</span>
                  </button>

                  <button
                    onClick={() => handleSelectQuickAction('admin')}
                    className="flex flex-col text-left p-2 rounded-xl bg-emerald-50/60 hover:bg-emerald-100/60 border border-emerald-100 text-emerald-900 transition-colors"
                  >
                    <span className="text-[11px] font-bold flex items-center gap-1">
                      <MessagesSquare className="w-3.5 h-3.5 text-emerald-600" />
                      Bicara Admin
                    </span>
                    <span className="text-[9px] text-emerald-700/80 mt-0.5">Tanya stok / kendala</span>
                  </button>
                </div>
              </div>

              {/* Bot Interactive Responses */}
              {botMessages.map((botMsg) => (
                <motion.div
                  key={botMsg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-teal-700 flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5 text-teal-600" />
                      {botMsg.title}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {format(new Date(botMsg.createdAt), 'HH:mm')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                    {botMsg.content}
                  </p>

                  {/* Jika info order, tampilkan detail kartu pesanan */}
                  {botMsg.type === 'order_status' && botMsg.data && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 mt-2 space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-700">ID: #{botMsg.data.id}</span>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-teal-100 text-teal-800">
                          {botMsg.data.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-slate-500">
                        <span>Total Belanja:</span>
                        <span className="font-bold text-slate-800">Rp {botMsg.data.total_amount?.toLocaleString('id-ID')}</span>
                      </div>
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          navigate('/orders');
                        }}
                        className="w-full mt-1.5 py-1.5 px-3 bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors"
                      >
                        <span>Buka Detail di Riwayat Pesanan</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Chat History Messages */}
              {messages.map((msg, idx) => {
                const isMe = msg.senderId === user.id;
                const prevMsg = idx > 0 ? messages[idx - 1] : null;
                const showDate = !prevMsg || new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();
                
                return (
                  <React.Fragment key={msg.id}>
                    {showDate && (
                      <div className="flex justify-center my-3">
                        <span className="text-[10px] bg-slate-200/70 text-slate-500 font-medium px-3 py-1 rounded-full shadow-2xs">
                          {format(new Date(msg.createdAt), 'dd MMMM yyyy', { locale: idLocale })}
                        </span>
                      </div>
                    )}
                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {!isMe && (
                        <span className="text-[10px] font-semibold text-slate-500 mb-1 ml-1 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                          Admin KOKSI
                        </span>
                      )}
                      <div 
                        className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                          isMe 
                            ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-tr-xs font-normal shadow-teal-700/10' 
                            : 'bg-white border border-slate-200/80 text-slate-800 rounded-tl-xs shadow-slate-200/50'
                        }`}
                      >
                        {msg.message}
                      </div>
                      <div className={`flex items-center gap-1 mt-1 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-[10px] text-slate-400">
                          {format(new Date(msg.createdAt), 'HH:mm')}
                        </span>
                        {isMe && (
                          <span className={msg.isRead ? 'text-teal-600' : 'text-slate-300'}>
                            {msg.isRead ? <CheckCheck size={13} strokeWidth={2.5} /> : <Check size={13} strokeWidth={2.5} />}
                          </span>
                        )}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form Bar */}
            <footer className="p-3 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shrink-0">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Ketik pesan untuk Admin KOKSI..."
                  className="flex-1 bg-slate-100/90 border border-slate-200/70 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200/60 rounded-full px-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 transition-all outline-hidden"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isLoading}
                  className="w-10 h-10 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-full flex items-center justify-center hover:from-teal-700 hover:to-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 shadow-sm active:scale-95"
                  title="Kirim Pesan"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
              <div className="text-center mt-1.5">
                <p className="text-[10px] text-slate-400">
                  Layanan chat resmi Koperasi Karyawan • BelanjaIn Saza
                </p>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
