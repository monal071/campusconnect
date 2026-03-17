import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  UserPlusIcon,
  CheckIcon,
  XMarkIcon,
  UserMinusIcon,
  SparklesIcon,
  InboxIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

export default function ConnectionsPage() {
  const { data: session } = useSession();

  // View state
  const [activeTab, setActiveTab] = useState("connections"); // 'connections' or 'chat'
  const [activeSection, setActiveSection] = useState("friends"); // 'friends', 'find', 'requests', 'suggestions'

  // Chat state
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Connections state
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [sentRequests, setSentRequests] = useState(new Set());
  const [processingRequests, setProcessingRequests] = useState(new Set());

  // Initial fetch
  useEffect(() => {
    if (session?.user?.id) {
      fetchFriends();
      fetchRequests();
      fetchRecommendations();
      fetchConversations();
    }
  }, [session]);

  // Auto-refresh conversations
  useEffect(() => {
    if (!session?.user?.id) return;
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, [session]);

  // Auto-refresh messages when chat is open
  useEffect(() => {
    if (!conversationId) return;
    const interval = setInterval(() => fetchMessages(conversationId), 3000);
    return () => clearInterval(interval);
  }, [conversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch functions
  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/chat/conversations");
      const data = await res.json();
      if (res.ok) setConversations(data.conversations || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const fetchFriends = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/connections/friends?id=${session.user.id}`);
      const data = await res.json();
      setFriends(data.friends || []);
    } catch (error) {
      console.error("Error fetching friends:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/connections/incoming");
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const res = await fetch(
        `/api/connections/recommendations?id=${session.user.id}`,
      );
      const data = await res.json();
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;

    setSearchLoading(true);
    try {
      const res = await fetch(
        `/api/connections/users?q=${encodeURIComponent(search.trim())}`,
      );
      const data = await res.json();
      if (res.ok) {
        const filtered = (data.users || []).filter(
          (user) => user._id !== session?.user?.id,
        );
        setSearchResults(filtered);
      }
    } catch (error) {
      toast.error("Error searching users");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleConnect = async (toUserId) => {
    try {
      const res = await fetch("/api/connections/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromUserId: session.user.id,
          toUserId,
        }),
      });

      if (res.ok) {
        toast.success("Connection request sent!");
        setSentRequests((prev) => new Set([...prev, toUserId]));
        fetchRecommendations();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to send request");
      }
    } catch (error) {
      toast.error("Failed to send request");
    }
  };

  const handleAcceptRequest = async (fromUserId) => {
    setProcessingRequests((prev) => new Set([...prev, fromUserId]));
    try {
      const res = await fetch("/api/connections/request", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromUserId,
          toUserId: session.user.id,
          action: "accept",
        }),
      });

      if (res.ok) {
        toast.success("Connection accepted!");
        fetchRequests();
        fetchFriends();
      } else {
        toast.error("Failed to accept request");
      }
    } catch (error) {
      toast.error("Failed to accept request");
    } finally {
      setProcessingRequests((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fromUserId);
        return newSet;
      });
    }
  };

  const handleRejectRequest = async (fromUserId) => {
    setProcessingRequests((prev) => new Set([...prev, fromUserId]));
    try {
      const res = await fetch("/api/connections/request", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromUserId,
          toUserId: session.user.id,
          action: "reject",
        }),
      });

      if (res.ok) {
        toast.success("Request declined");
        fetchRequests();
      } else {
        toast.error("Failed to decline request");
      }
    } catch (error) {
      toast.error("Failed to decline request");
    } finally {
      setProcessingRequests((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fromUserId);
        return newSet;
      });
    }
  };

  const handleRemoveConnection = async (friendId) => {
    if (!confirm("Remove this connection?")) return;

    try {
      const res = await fetch("/api/connections/request", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId1: session.user.id,
          userId2: friendId,
        }),
      });

      if (res.ok) {
        toast.success("Connection removed");
        fetchFriends();
        fetchRecommendations();
      }
    } catch (error) {
      toast.error("Failed to remove connection");
    }
  };

  // Chat functions
  const openChat = async (user) => {
    setSelectedChat(user);
    setActiveTab("chat");
    setChatLoading(true);

    try {
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: user._id }),
      });

      const data = await res.json();
      if (res.ok) {
        setConversationId(data.conversation._id);
        await fetchMessages(data.conversation._id);
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
    } finally {
      setChatLoading(false);
    }
  };

  const openConversation = async (conversation) => {
    setSelectedChat(conversation.otherUser);
    setConversationId(conversation._id);
    setActiveTab("chat");
    await fetchMessages(conversation._id);
    markAsRead(conversation._id);
  };

  const fetchMessages = async (convId) => {
    if (!convId) return;
    try {
      const res = await fetch(`/api/chat/messages?conversationId=${convId}`);
      const data = await res.json();
      if (res.ok) setMessages(data.messages || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const markAsRead = async (convId) => {
    try {
      await fetch("/api/chat/messages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: convId }),
      });
      fetchConversations();
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId || sending) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, content }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, data.message]);
        fetchConversations();
      } else {
        setNewMessage(content);
      }
    } catch (error) {
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  const closeChat = () => {
    setSelectedChat(null);
    setConversationId(null);
    setMessages([]);
    setActiveTab("connections");
  };

  // Utility functions
  const getUserInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    const diffHours = (now - d) / (1000 * 60 * 60);

    if (diffHours < 24)
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diffHours < 168) return d.toLocaleDateString([], { weekday: "short" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const formatMessageTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalUnread = conversations.reduce(
    (sum, c) => sum + (c.unreadCount || 0),
    0,
  );

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Please log in to view connections</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] bg-gray-100 dark:bg-gray-900 flex">
      {/* Left Sidebar - Conversations */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <ChatBubbleLeftRightIcon className="w-6 h-6 mr-2 text-indigo-600" />
            Messages
            {totalUnread > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {totalUnread}
              </span>
            )}
          </h2>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
              <ChatBubbleLeftRightIcon className="w-12 h-12 mb-2 opacity-50" />
              <p className="text-sm text-center">No conversations yet</p>
              <p className="text-xs text-center mt-1">
                Start chatting with your connections
              </p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv._id}
                onClick={() => openConversation(conv)}
                className={`p-4 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                  selectedChat?._id === conv.otherUser?._id
                    ? "bg-indigo-50 dark:bg-indigo-900/20"
                    : ""
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white font-medium">
                        {getUserInitials(conv.otherUser?.name)}
                      </span>
                    </div>
                    {conv.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {conv.otherUser?.name}
                      </p>
                      <span className="text-xs text-gray-400">
                        {formatTime(conv.lastMessageAt)}
                      </span>
                    </div>
                    <p
                      className={`text-sm truncate ${
                        conv.unreadCount > 0
                          ? "text-gray-900 dark:text-white font-medium"
                          : "text-gray-500"
                      }`}
                    >
                      {conv.lastMessage?.content || "Start conversation"}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {activeTab === "chat" && selectedChat ? (
          /* Chat View */
          <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-medium">
                    {getUserInitials(selectedChat.name)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {selectedChat.name}
                  </h3>
                  <p className="text-xs text-gray-500">{selectedChat.email}</p>
                </div>
              </div>
              <button
                onClick={closeChat}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
              {chatLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <ChatBubbleLeftRightIcon className="w-16 h-16 mb-4 opacity-50" />
                  <p>Start your conversation with {selectedChat.name}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => {
                    const isOwn = msg.senderId === session.user.id;
                    return (
                      <motion.div
                        key={msg._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                            isOwn
                              ? "bg-indigo-600 text-white rounded-br-sm"
                              : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm shadow"
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isOwn ? "text-indigo-200" : "text-gray-400"
                            }`}
                          >
                            {formatMessageTime(msg.createdAt)}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <form
              onSubmit={sendMessage}
              className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Connections View */
          <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
            {/* Tabs */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4">
              <div className="flex space-x-1">
                {[
                  {
                    id: "friends",
                    label: "My Connections",
                    icon: UserGroupIcon,
                    count: friends.length,
                  },
                  {
                    id: "requests",
                    label: "Requests",
                    icon: InboxIcon,
                    count: requests.length,
                  },
                  {
                    id: "find",
                    label: "Find People",
                    icon: MagnifyingGlassIcon,
                  },
                  {
                    id: "suggestions",
                    label: "Suggestions",
                    icon: SparklesIcon,
                    count: recommendations.length,
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSection(tab.id)}
                    className={`flex items-center px-4 py-3 border-b-2 transition-colors ${
                      activeSection === tab.id
                        ? "border-indigo-600 text-indigo-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    <tab.icon className="w-5 h-5 mr-2" />
                    <span className="font-medium">{tab.label}</span>
                    {tab.count > 0 && (
                      <span
                        className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                          activeSection === tab.id
                            ? "bg-indigo-100 text-indigo-600"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <AnimatePresence mode="wait">
                {/* My Connections */}
                {activeSection === "friends" && (
                  <motion.div
                    key="friends"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    {loading ? (
                      <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
                      </div>
                    ) : friends.length === 0 ? (
                      <div className="text-center py-12">
                        <UserGroupIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          No connections yet
                        </h3>
                        <p className="text-gray-500 mb-4">
                          Start connecting with people in your campus
                        </p>
                        <button
                          onClick={() => setActiveSection("find")}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                          Find People
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {friends.map((friend, i) => (
                          <motion.div
                            key={friend._id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
                                <span className="text-white font-medium">
                                  {getUserInitials(friend.name)}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                                  {friend.name}
                                </h4>
                                <p className="text-sm text-gray-500 truncate">
                                  {friend.email}
                                </p>
                                {friend.department && (
                                  <p className="text-xs text-green-600">
                                    {friend.department}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => openChat(friend)}
                                className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                              >
                                Message
                              </button>
                              <button
                                onClick={() =>
                                  handleRemoveConnection(friend._id)
                                }
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              >
                                <UserMinusIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Requests */}
                {activeSection === "requests" && (
                  <motion.div
                    key="requests"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    {requests.length === 0 ? (
                      <div className="text-center py-12">
                        <InboxIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          No pending requests
                        </h3>
                        <p className="text-gray-500">
                          When someone sends you a connection request, it will
                          appear here
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {requests.map((req, i) => (
                          <motion.div
                            key={req._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm flex items-center justify-between"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center">
                                <span className="text-white font-medium">
                                  {getUserInitials(req.name)}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                  {req.name}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  {req.email}
                                </p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleAcceptRequest(req._id)}
                                disabled={processingRequests.has(req._id)}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                              >
                                <CheckIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleRejectRequest(req._id)}
                                disabled={processingRequests.has(req._id)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                              >
                                <XMarkIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Find People */}
                {activeSection === "find" && (
                  <motion.div
                    key="find"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <form onSubmit={handleSearch} className="mb-6">
                      <div className="flex space-x-2">
                        <div className="relative flex-1">
                          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name or email..."
                            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={searchLoading}
                          className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium"
                        >
                          {searchLoading ? "..." : "Search"}
                        </button>
                      </div>
                    </form>

                    {searchResults.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {searchResults.map((user, i) => (
                          <motion.div
                            key={user._id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm"
                          >
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                <span className="text-white font-medium">
                                  {getUserInitials(user.name)}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                                  {user.name}
                                </h4>
                                <p className="text-sm text-gray-500 truncate">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleConnect(user._id)}
                              disabled={sentRequests.has(user._id)}
                              className={`w-full py-2 rounded-lg font-medium transition-colors ${
                                sentRequests.has(user._id)
                                  ? "bg-gray-100 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                                  : "bg-indigo-600 text-white hover:bg-indigo-700"
                              }`}
                            >
                              {sentRequests.has(user._id)
                                ? "Request Sent"
                                : "Connect"}
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <MagnifyingGlassIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          Search for people
                        </h3>
                        <p className="text-gray-500">
                          Enter a name or email to find people to connect with
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Suggestions */}
                {activeSection === "suggestions" && (
                  <motion.div
                    key="suggestions"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    {recommendations.length === 0 ? (
                      <div className="text-center py-12">
                        <SparklesIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          No suggestions yet
                        </h3>
                        <p className="text-gray-500">
                          We'll suggest people for you to connect with as more
                          users join
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recommendations.map((user, i) => (
                          <motion.div
                            key={user._id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm"
                          >
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                <span className="text-white font-medium">
                                  {getUserInitials(user.name)}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                                  {user.name}
                                </h4>
                                <p className="text-sm text-gray-500 truncate">
                                  {user.email}
                                </p>
                                {user.department && (
                                  <p className="text-xs text-indigo-600">
                                    {user.department}
                                  </p>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => handleConnect(user._id)}
                              disabled={sentRequests.has(user._id)}
                              className={`w-full py-2 rounded-lg font-medium transition-colors flex items-center justify-center ${
                                sentRequests.has(user._id)
                                  ? "bg-gray-100 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                                  : "bg-indigo-600 text-white hover:bg-indigo-700"
                              }`}
                            >
                              <UserPlusIcon className="w-4 h-4 mr-2" />
                              {sentRequests.has(user._id) ? "Sent" : "Connect"}
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
