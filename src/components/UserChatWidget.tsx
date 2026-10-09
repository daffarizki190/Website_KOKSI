import React, { useState, useEffect, useRef } from 'react';
import { MessagesSquare, X, Send, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
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

export const UserChatWidget: React.FC = () => {
  const { user, token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpenedChat, setHasOpenedChat] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/chats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        
        // Mark incoming messages as read
        fetch('/api/chats/read', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({})
        });
      }
    } catch (err) {
      console.error('Failed to fetch chats', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000); // poll every 5s
      return () => clearInterval(interval);
    }
  }, [isOpen, token]);

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
  }, [messages, isOpen]);

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
        await fetchMessages();
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

  if (!user || user.role !== 'user') return null;

  return (
    <>
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
                  y: { repeat: Infinity, repeatType: 'reverse', duration: 1 } // Bouncy effect
                }}
                className="relative bg-teal-600 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-xl flex items-center justify-center cursor-pointer mb-2 mr-2"
                onClick={() => {
                  setIsOpen(true);
                  setHasOpenedChat(true);
                }}
              >
                <span>Chat Admin</span>
                {/* Chat bubble tail */}
                <div className="absolute -bottom-2 right-4 w-0 h-0 border-l-[8px] border-l-transparent border-t-[10px] border-t-teal-600 border-r-[8px] border-r-transparent"></div>
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
              className="tour-chat w-14 h-14 bg-gradient-to-br from-teal-400 to-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 transition-all relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 scale-0 group-hover:scale-100 rounded-full transition-transform duration-300"></div>
              <MessagesSquare className="w-7 h-7 relative z-10" />
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", bounce: 0.3 }}
            className="fixed bottom-0 right-0 md:bottom-6 md:right-6 w-full h-[100dvh] md:w-[350px] md:h-[500px] md:max-h-[80vh] bg-white md:rounded-2xl shadow-2xl flex flex-col overflow-hidden z-[100] md:z-50 border-0 md:border md:border-slate-200"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white px-4 py-3 flex items-center justify-between shadow-md z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <MessagesSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Hubungi Admin KOKSI</h3>
                  <p className="text-xs text-emerald-100 opacity-90">Biasanya membalas cepat</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-3">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <MessagesSquare className="w-10 h-10 opacity-20" />
                  <p className="text-sm text-center px-4">Belum ada pesan. Silakan kirim pesan ke Admin KOKSI.</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.senderId === user.id;
                  const prevMsg = idx > 0 ? messages[idx - 1] : null;
                  const showDate = !prevMsg || new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();
                  
                  return (
                    <React.Fragment key={msg.id}>
                      {showDate && (
                        <div className="flex justify-center my-3">
                          <span className="text-[10px] bg-slate-200/60 text-slate-500 px-2 py-1 rounded-full">
                            {format(new Date(msg.createdAt), 'dd MMMM yyyy', { locale: idLocale })}
                          </span>
                        </div>
                      )}
                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div 
                          className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                            isMe 
                              ? 'bg-emerald-600 text-white rounded-tr-sm' 
                              : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'
                          }`}
                        >
                          {msg.message}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 px-1">
                          {format(new Date(msg.createdAt), 'HH:mm')}
                        </span>
                      </div>
                    </React.Fragment>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Tulis pesan..."
                className="flex-1 bg-slate-100 border-transparent focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-full px-4 py-2 text-sm transition-all"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || isLoading}
                className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 transition-colors shrink-0"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
