import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { 
  XMarkIcon, 
  PaperAirplaneIcon,
  UserCircleIcon,
  TrashIcon 
} from '@heroicons/react/24/outline';

export default function ChatModal({ 
  isOpen, 
  onClose, 
  participant,
  conversationId: initialConversationId 
}) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [sending, setSending] = useState(false);
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef(null);
  const messageContainerRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && participant) {
      if (conversationId) {
        fetchMessages();
      } else {
        createConversation();
      }
    }
  }, [isOpen, participant, conversationId]);

  // Auto-refresh messages every 3 seconds when chat is open
  useEffect(() => {
    let interval;
    if (isOpen && conversationId) {
      interval = setInterval(() => {
        fetchMessages();
      }, 3000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isOpen, conversationId]);

  const createConversation = async () => {
    if (!participant?._id) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId: participant._id })
      });

      const data = await response.json();
      if (response.ok) {
        setConversationId(data.conversation._id);
        if (!data.isNew) {
          fetchMessages(data.conversation._id);
        }
      } else {
        console.error('Error creating conversation:', data.message);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId = conversationId) => {
    if (!convId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/chat/messages?conversationId=${convId}`);
      const data = await response.json();
      
      if (response.ok) {
        setMessages(data.messages || []);
        // Mark messages as read
        markAsRead(convId);
      } else {
        console.error('Error fetching messages:', data.message);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (convId = conversationId) => {
    if (!convId) return;
    
    try {
      await fetch('/api/chat/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: convId })
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          content: messageContent
        })
      });

      const data = await response.json();
      if (response.ok) {
        setMessages(prev => [...prev, data.message]);
      } else {
        console.error('Error sending message:', data.message);
        setNewMessage(messageContent); // Restore message on error
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageContent); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const clearChat = async () => {
    if (!conversationId) return;
    
    const confirmClear = window.confirm('Are you sure you want to clear this chat? This action cannot be undone.');
    if (!confirmClear) return;

    try {
      const response = await fetch(`/api/chat/clear?conversationId=${conversationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessages([]);
      } else {
        const data = await response.json();
        console.error('Error clearing chat:', data.message);
        alert('Failed to clear chat. Please try again.');
      }
    } catch (error) {
      console.error('Error clearing chat:', error);
      alert('Failed to clear chat. Please try again.');
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString();
    }
  };

  const getUserInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach(message => {
      const date = formatDate(message.createdAt);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  };

  if (!isOpen || !mounted) return null;

  const messageGroups = groupMessagesByDate(messages);

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-70 z-[10000] flex items-center justify-center p-4"
          style={{ margin: 0, padding: '1rem' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-lg h-[650px] flex flex-col relative mx-auto"
            style={{ maxWidth: '32rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center overflow-hidden">
                  {participant?.image ? (
                    <img
                      src={participant.image}
                      alt={participant.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                      {getUserInitials(participant?.name)}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {participant?.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {participant?.role}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {/* Clear Chat Button */}
                {conversationId && messages.length > 0 && (
                  <button
                    onClick={clearChat}
                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Clear chat"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                )}
                
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={messageContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : Object.keys(messageGroups).length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <UserCircleIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Start your conversation with {participant?.name}</p>
                  </div>
                </div>
              ) : (
                Object.keys(messageGroups).map(date => (
                  <div key={date}>
                    {/* Date separator */}
                    <div className="flex items-center justify-center my-4">
                      <div className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {date}
                        </span>
                      </div>
                    </div>
                    
                    {/* Messages for this date */}
                    {messageGroups[date].map((message, index) => {
                      const isOwn = message.senderId === session?.user?.id;
                      return (
                        <motion.div
                          key={message._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              isOwn
                                ? 'bg-indigo-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              isOwn 
                                ? 'text-indigo-100' 
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {formatTime(message.createdAt)}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {sending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <PaperAirplaneIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}