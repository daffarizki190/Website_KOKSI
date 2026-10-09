import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare, Send, CheckCircle2, User as UserIcon, Search, Check, CheckCheck, ArrowLeft, Trash2, AlertTriangle, X } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface ChatUser {
  senderId: number;
  nama: string;
  pt: string;
  unreadCount?: number;
  lastMessageTime?: string;
  lastMessageText?: string;
}

interface ChatMessage {
  id: number;
  senderId: number;
  receiverId: number | null;
  message: string;
  isRead: boolean;
  createdAt: string;
  senderNama?: string;
}

export const AdminChatPanel: React.FC = () => {
  const { token, user } = useAuth();
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageToDelete, setMessageToDelete] = useState<ChatMessage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Clear chat state
  const [clearChatModalOpen, setClearChatModalOpen] = useState(false);
  const [clearChatReason, setClearChatReason] = useState('');
  const [isClearingChat, setIsClearingChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleClearChat = async () => {
    if (!selectedUserId || !token || !clearChatReason.trim()) return;
    setIsClearingChat(true);
    try {
      const res = await fetch(`/api/chats/clear/${selectedUserId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ reason: clearChatReason })
      });
      if (res.ok) {
        setMessages([]); // Kosongkan chat secara optimistik
        setClearChatModalOpen(false);
        setClearChatReason('');
        // Refresh users list to update the preview message if needed
        fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal menghapus percakapan');
      }
    } catch (err) {
      console.error('Failed to clear chat', err);
      alert('Terjadi kesalahan saat menghapus percakapan');
    } finally {
      setIsClearingChat(false);
    }
  };

  const handleDeleteMessage = async () => {
    if (!messageToDelete || !token) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/chats/${messageToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMessages(prev => prev.filter(m => m.id !== messageToDelete.id));
        setMessageToDelete(null);
      }
    } catch (err) {
      console.error('Failed to delete message', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchUsers = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/chats', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setChatUsers(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async (userId: number) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/chats?userId=${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        
        // Mark as read
        fetch('/api/chats/read', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ userId })
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(() => {
      fetchUsers();
      if (selectedUserId) {
        fetchMessages(selectedUserId);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [token, selectedUserId]);

  useEffect(() => {
    if (selectedUserId) {
      fetchMessages(selectedUserId);
    } else {
      setMessages([]);
    }
  }, [selectedUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUserId || !token) return;

    const tempMsg = newMessage;
    setNewMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: tempMsg, receiverId: selectedUserId })
      });
      if (res.ok) {
        await fetchMessages(selectedUserId);
      } else {
        setNewMessage(tempMsg);
      }
    } catch (err) {
      console.error(err);
      setNewMessage(tempMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredContacts = chatUsers.filter(c => 
    c.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.pt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeUser = chatUsers.find(u => u.senderId === selectedUserId);

  return (
    <div className="flex h-[85vh] bg-[#f0f2f5] overflow-hidden font-sans rounded-none shadow-sm border border-slate-200">
      
      {/* Sidebar (Contacts List) */}
      <div className={`w-full md:w-[350px] lg:w-[400px] bg-white border-r border-gray-200 flex flex-col shrink-0 ${selectedUserId ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Sidebar Header */}
        <div className="h-16 bg-[#f0f2f5] flex items-center justify-between px-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-300 rounded-full flex items-center justify-center text-white overflow-hidden">
               <UserIcon className="w-6 h-6 text-slate-100" />
            </div>
          </div>
          <div className="flex gap-4 text-[#54656f]">
            {/* Icons removed as they were non-functional decorations */}
          </div>
        </div>

        {/* Search */}
        <div className="p-2 border-b border-gray-200 shrink-0 bg-white">
          <div className="relative flex items-center bg-[#f0f2f5] rounded-lg px-3 py-1.5 h-9">
            <Search size={18} className="text-[#54656f]" />
            <input 
              type="text" 
              placeholder="Cari atau mulai chat baru" 
              className="bg-transparent w-full ml-4 outline-none text-sm text-[#111b21] placeholder-[#8696a0]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto bg-white">
          {filteredContacts.length === 0 ? (
             <div className="p-6 text-center text-[#8696a0] text-sm mt-4">
               Belum ada chat.
             </div>
          ) : (
            filteredContacts.map((contact) => (
              <div 
                key={contact.senderId} 
                onClick={() => setSelectedUserId(contact.senderId)}
                className={`flex items-center px-3 py-3 cursor-pointer hover:bg-[#f5f6f6] border-b border-[#f2f2f2] transition-colors ${selectedUserId === contact.senderId ? 'bg-[#f0f2f5]' : ''}`}
              >
                <div className="relative shrink-0 mr-3">
                  <div className="w-[49px] h-[49px] bg-slate-200 text-slate-400 rounded-full flex items-center justify-center overflow-hidden">
                     <UserIcon className="w-8 h-8" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex justify-between items-center mb-0.5">
                    <h4 className="text-[#111b21] font-normal truncate text-[16px]">{contact.nama}</h4>
                    <span className={`text-[12px] shrink-0 ${contact.unreadCount && contact.unreadCount > 0 ? 'text-[#25D366] font-medium' : 'text-[#667781]'}`}>
                      {contact.lastMessageTime || 'Hari ini'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[14px] text-[#667781] truncate pr-2">{contact.pt}</p>
                    {!!contact.unreadCount && contact.unreadCount > 0 && (
                      <span className="bg-[#25D366] text-white text-[12px] font-medium rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center shrink-0">
                        {contact.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      {selectedUserId ? (
        <div className={`flex-1 flex flex-col bg-[#efeae2] relative ${!selectedUserId ? 'hidden md:flex' : 'flex'}`}>
          {/* Chat Background Pattern */}
          <div className="absolute inset-0 opacity-[0.4] pointer-events-none z-0" style={{ backgroundImage: 'url("https://static.whatsapp.net/rsrc.php/v3/yl/r/gi_DckOUM5a.png")', backgroundRepeat: 'repeat', backgroundSize: '400px' }}></div>

          {/* Chat Header */}
          <div className="h-16 bg-[#f0f2f5] flex items-center justify-between px-4 border-b border-gray-200 shrink-0 z-10 relative shadow-sm">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedUserId(null)}>
              <button className="md:hidden p-1 -ml-2 text-[#54656f] hover:bg-gray-200 rounded-full">
                <ArrowLeft size={24} />
              </button>
              <div className="w-10 h-10 bg-slate-300 text-slate-100 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                <UserIcon className="w-6 h-6" />
              </div>
              <div className="flex flex-col justify-center">
                <h3 className="font-normal text-[#111b21] leading-tight text-[16px]">{activeUser?.nama}</h3>
                <p className="text-[13px] text-[#667781] leading-tight">{activeUser?.pt}</p>
              </div>
            </div>
            <div className="flex gap-2 text-[#54656f]">
              <button 
                onClick={() => setClearChatModalOpen(true)}
                title="Hapus Seluruh Chat"
                className="p-2 hover:bg-gray-200 rounded-full text-red-500 transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 md:px-[8%] lg:px-[10%] space-y-1.5 z-10 scrollbar-thin">
             {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <span className="bg-[#ffeecd] text-[#54656f] text-[12.5px] px-3 py-2 rounded-lg shadow-sm border border-yellow-200/50">
                    Mulai percakapan dengan {activeUser?.nama}
                  </span>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.senderId === user?.id;
                  const prevMsg = idx > 0 ? messages[idx - 1] : null;
                  const showDate = !prevMsg || new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();
                  // Check if previous message is from same sender to not show tail
                  const isFirstInGroup = !prevMsg || prevMsg.senderId !== msg.senderId || showDate;
                  
                  return (
                    <React.Fragment key={msg.id}>
                      {showDate && (
                        <div className="flex justify-center my-4">
                          <span className="text-[12px] font-normal bg-white text-[#54656f] px-3 py-1.5 rounded-lg shadow-sm uppercase tracking-wide">
                            {format(new Date(msg.createdAt), 'dd/MM/yyyy', { locale: idLocale })}
                          </span>
                        </div>
                      )}
                      
                      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-3' : 'mt-[2px]'} relative group`}>
                        <div className={`max-w-[85%] md:max-w-[65%] px-2.5 pt-1.5 pb-2 relative shadow-sm flex flex-col ${
                          isMe 
                            ? `bg-[#d9fdd3] ${isFirstInGroup ? 'rounded-l-lg rounded-br-lg rounded-tr-none' : 'rounded-lg'}` 
                            : `bg-white ${isFirstInGroup ? 'rounded-r-lg rounded-bl-lg rounded-tl-none' : 'rounded-lg'}`
                        }`}>
                          {/* Triangle tail for first message in group */}
                          {isFirstInGroup && (
                             <div className={`absolute top-0 w-2 h-3 ${isMe ? '-right-2' : '-left-2'}`}>
                               <svg viewBox="0 0 8 13" width="8" height="13" className={isMe ? "text-[#d9fdd3]" : "text-white"}>
                                 <path opacity=".13" d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z"></path>
                                 <path fill="currentColor" d="M5.188 0H0v11.193l6.467-8.625C7.526 1.156 6.958 0 5.188 0z"></path>
                               </svg>
                             </div>
                          )}
                          
                          <p className="text-[#111b21] text-[14.2px] leading-relaxed break-words pb-[10px] min-w-[70px] pr-10">
                             {msg.message}
                          </p>
                          <div className="flex items-center justify-end gap-[3px] absolute bottom-1 right-2">
                            <span className="text-[11px] text-[#667781] leading-none">
                              {format(new Date(msg.createdAt), 'HH:mm')}
                            </span>
                            {isMe && (
                              <span className={msg.isRead ? 'text-[#53bdeb]' : 'text-[#8696a0]'}>
                                {msg.isRead ? <CheckCheck size={15} strokeWidth={2.5} /> : <Check size={15} strokeWidth={2.5} />}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Delete button (shows on hover) */}
                        <div className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'right-full mr-2' : 'left-full ml-2'}`}>
                          <button 
                            onClick={() => setMessageToDelete(msg)}
                            className="p-1.5 bg-white shadow-sm border border-gray-200 rounded-full text-red-500 hover:bg-red-50 transition-colors"
                            title="Hapus Pesan"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              )}
              <div ref={messagesEndRef} className="h-4" />
          </div>

          {/* Chat Input */}
          <div className="bg-[#f0f2f5] px-4 py-2.5 flex items-end gap-2 z-10 shrink-0">
            <form onSubmit={handleSendMessage} className="flex-1 flex items-center">
              <input 
                type="text"
                placeholder="Ketik pesan"
                className="w-full bg-white px-4 py-2.5 outline-none text-[15px] text-[#111b21] rounded-lg shadow-sm placeholder-[#8696a0]"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={isLoading}
              />
            </form>
            
            <div className="py-1 shrink-0 ml-1">
              <button 
                onClick={handleSendMessage}
                disabled={isLoading || !newMessage.trim()}
                className={`${newMessage.trim() ? 'text-[#54656f] hover:text-gray-700' : 'text-slate-300'} p-2 rounded-full transition-colors`}
              >
                <Send size={24} strokeWidth={1.5} className="ml-1" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-[#f0f2f5] border-l border-gray-200 z-10 relative">
           <div className="absolute inset-0 opacity-[0.4] pointer-events-none z-0" style={{ backgroundImage: 'url("https://static.whatsapp.net/rsrc.php/v3/yl/r/gi_DckOUM5a.png")', backgroundRepeat: 'repeat', backgroundSize: '400px' }}></div>
          <div className="text-center max-w-md px-6 z-10">
            <div className="inline-flex mb-8 items-center justify-center">
              {/* WhatsApp-like Empty State Graphic */}
              <div className="w-[320px] h-[160px] bg-slate-200 rounded-lg flex items-center justify-center text-slate-400 opacity-60">
                <svg viewBox="0 0 100 100" width="100" height="100" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M30 30h40v40H30z" />
                  <circle cx="50" cy="50" r="10" />
                </svg>
              </div>
            </div>
            <h2 className="text-[32px] font-light text-[#41525d] mb-4">Chat KOKSI for Admin</h2>
            <p className="text-[#8696a0] text-[14px] leading-relaxed">
              Kirim dan terima pesan dengan anggota tanpa perlu repot. <br/>
              Pilih chat di sebelah kiri untuk mulai mengobrol.
            </p>
            <div className="mt-10 flex items-center justify-center gap-1.5 text-[13px] text-[#8696a0]">
               <svg viewBox="0 0 10 12" width="10" height="12" fill="currentColor">
                 <path d="M5 1.09L1.78 2.53v3.7c0 2.5 1.38 4.8 3.22 5.68 1.84-.88 3.22-3.17 3.22-5.68v-3.7L5 1.09zm0 6.66c-1.12 0-2.03-.91-2.03-2.03S3.88 3.69 5 3.69s2.03.91 2.03 2.03S6.12 7.75 5 7.75z"/>
               </svg>
               Mendukung enkripsi end-to-end
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {messageToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 text-center mb-2">Hapus Pesan?</h3>
              <p className="text-sm text-slate-600 text-center mb-6">
                Apakah Anda yakin ingin menghapus pesan ini? Tindakan ini tidak dapat dibatalkan.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setMessageToDelete(null)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteMessage}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Hapus
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear Chat Confirmation Modal */}
      {clearChatModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <button onClick={() => setClearChatModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Hapus Seluruh Percakapan?</h3>
              <p className="text-sm text-slate-600 mb-4">
                Semua riwayat chat dengan pengguna ini akan dihapus permanen. Mohon berikan alasan penghapusan ini.
              </p>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Alasan Penghapusan <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={clearChatReason}
                  onChange={(e) => setClearChatReason(e.target.value)}
                  placeholder="Contoh: Permintaan pengguna / Data tidak relevan"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none text-sm"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setClearChatModalOpen(false)}
                  disabled={isClearingChat}
                  className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleClearChat}
                  disabled={isClearingChat || !clearChatReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isClearingChat ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Hapus Semua'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
