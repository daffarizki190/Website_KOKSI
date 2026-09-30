import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare, Send, CheckCircle2, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface ChatUser {
  senderId: number;
  nama: string;
  pt: string;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="flex flex-col md:flex-row bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-[600px] max-h-[80vh]">
      {/* Sidebar: Users List */}
      <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col bg-slate-50">
        <div className="p-4 border-b border-slate-200 bg-white">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-teal-600" />
            Pesan Masuk
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chatUsers.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm">
              Belum ada pesan dari anggota.
            </div>
          ) : (
            chatUsers.map(u => (
              <button
                key={u.senderId}
                onClick={() => setSelectedUserId(u.senderId)}
                className={`w-full text-left p-4 border-b border-slate-100 hover:bg-slate-100 transition-colors flex items-center gap-3 ${selectedUserId === u.senderId ? 'bg-teal-50 border-l-4 border-l-teal-600' : 'border-l-4 border-l-transparent'}`}
              >
                <div className="w-10 h-10 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center shrink-0">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-slate-900 truncate">{u.nama}</h4>
                  <p className="text-xs text-slate-500 truncate">{u.pt}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="w-full md:w-2/3 flex flex-col bg-white h-[400px] md:h-auto">
        {selectedUserId ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-200 flex items-center gap-3 shadow-xs shrink-0 bg-white z-10">
              <div className="w-10 h-10 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center">
                <UserIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">
                  {chatUsers.find(u => u.senderId === selectedUserId)?.nama || 'Anggota'}
                </h4>
                <p className="text-xs text-slate-500">Percakapan Pribadi</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400">
                  Memuat pesan...
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.senderId === user?.id;
                  const prevMsg = idx > 0 ? messages[idx - 1] : null;
                  const showDate = !prevMsg || new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();
                  
                  return (
                    <React.Fragment key={msg.id}>
                      {showDate && (
                        <div className="flex justify-center my-4">
                          <span className="text-[10px] font-medium bg-slate-200 text-slate-600 px-3 py-1 rounded-full">
                            {format(new Date(msg.createdAt), 'dd MMMM yyyy', { locale: idLocale })}
                          </span>
                        </div>
                      )}
                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div 
                          className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                            isMe 
                              ? 'bg-teal-600 text-white rounded-tr-sm shadow-md' 
                              : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'
                          }`}
                        >
                          {msg.message}
                        </div>
                        <div className="flex items-center gap-1 mt-1 px-1">
                          <span className="text-[10px] text-slate-400">
                            {format(new Date(msg.createdAt), 'HH:mm')}
                          </span>
                          {isMe && (
                            <CheckCircle2 className={`w-3 h-3 ${msg.isRead ? 'text-teal-500' : 'text-slate-300'}`} />
                          )}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-200 shrink-0 flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Ketik balasan untuk anggota..."
                className="flex-1 bg-slate-100 border-transparent focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 rounded-full px-5 py-2.5 text-sm transition-all"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || isLoading}
                className="w-11 h-11 bg-teal-600 text-white rounded-full flex items-center justify-center hover:bg-teal-700 disabled:opacity-50 disabled:hover:bg-teal-600 transition-colors shrink-0 shadow-md"
              >
                <Send className="w-5 h-5 ml-1" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
            <MessageSquare className="w-16 h-16 text-slate-200 mb-4" />
            <h3 className="text-lg font-bold text-slate-600 mb-2">Pilih Obrolan</h3>
            <p className="text-sm">Klik salah satu nama anggota di sebelah kiri untuk mulai membaca dan membalas pesan mereka.</p>
          </div>
        )}
      </div>
    </div>
  );
};
