import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatModal from './ChatModal';
import {
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

export default function ChatList({ isOpen, onClose, onUnreadCountChange }) {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen && session) {
      fetchConversations();
    }
  }, [isOpen, session]);

  // Auto-refresh conversations every 5 seconds when chat list is open
  useEffect(() => {
    let interval;
    if (isOpen && session) {
      interval = setInterval(() => {
        fetchConversations();
      }, 5000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isOpen, session]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/chat/conversations');
      const data = await response.json();
      
      if (response.ok) {
        setConversations(data.conversations || []);
        
        // Calculate total unread count and notify parent
        const totalUnread = (data.conversations || []).reduce((total, conv) => {
          return total + (conv.unreadCount || 0);
        }, 0);
        
        if (onUnreadCountChange) {
          onUnreadCountChange(totalUnread);
        }
      } else {
        console.error('Error fetching conversations:', data.message);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const openChat = (conversation) => {
    setSelectedConversation({
      participant: conversation.otherUser,
      conversationId: conversation._id
    });
  };

  const closeChatModal = () => {
    setSelectedConversation(null);
    // Refresh conversations to update unread counts
    fetchConversations();
  };

  const getUserInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatLastMessage = (message) => {
    if (!message) return 'No messages yet';
    return message.content.length > 50 
      ? message.content.substring(0, 50) + '...'
      : message.content;
  };

  const formatTime = (date) => {
    if (!date) return '';
    
    const messageDate = new Date(date);
    const now = new Date();
    const diffInHours = (now - messageDate) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 168) { // 7 days
      return messageDate.toLocaleDateString([], { weekday: 'short' });
    } else {
      return messageDate.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const filteredConversations = conversations.filter(conversation =>
    conversation.otherUser?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-80 z-[9999] flex items-center justify-center p-4"
            onClick={onClose}
            style={{ margin: 0, padding: '1rem' }}
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.7, opacity: 0, y: 100 }}
              transition={{ type: "spring", damping: 20, stiffness: 280 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md h-[600px] flex flex-col relative mx-auto my-auto"
              onClick={(e) => e.stopPropagation()}
              style={{
                maxHeight: '90vh',
                maxWidth: '90vw',
                transform: 'translate(0, 0)'
              }}
            >
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <ChatBubbleLeftRightIcon className="w-6 h-6 mr-2 text-indigo-600" />
                Messages
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <div className="text-center p-6">
                  <ChatBubbleLeftRightIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No conversations yet</p>
                  <p className="text-sm">
                    {searchTerm 
                      ? 'No conversations match your search'
                      : 'Start chatting with your connections'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredConversations.map((conversation, index) => (
                  <motion.div
                    key={conversation._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                    onClick={() => openChat(conversation)}
                  >
                    <div className="flex items-center space-x-3">
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center overflow-hidden">
                          {conversation.otherUser?.image ? (
                            <img
                              src={conversation.otherUser.image}
                              alt={conversation.otherUser.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                              {getUserInitials(conversation.otherUser?.name)}
                            </span>
                          )}
                        </div>
                        
                        {/* Unread indicator */}
                        {conversation.unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                          </div>
                        )}
                      </div>

                      {/* Conversation info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {conversation.otherUser?.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTime(conversation.lastMessageAt)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className={`text-sm truncate ${
                            conversation.unreadCount > 0 
                              ? 'text-gray-900 dark:text-white font-medium' 
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {conversation.lastMessage?.senderId === session?.user?.id ? 'You: ' : ''}
                            {formatLastMessage(conversation.lastMessage)}
                          </p>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {conversation.otherUser?.role}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Chat Modal */}
      {selectedConversation && (
        <ChatModal
          isOpen={!!selectedConversation}
          onClose={closeChatModal}
          participant={selectedConversation.participant}
          conversationId={selectedConversation.conversationId}
        />
      )}
        </>
      )}
    </AnimatePresence>
  );
}