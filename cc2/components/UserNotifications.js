import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  BellIcon,
  UserPlusIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function UserNotifications() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [processingRequests, setProcessingRequests] = useState(new Set());

  useEffect(() => {
    if (session?.user) {
      fetchNotifications();
    }
  }, [session]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ read: true }),
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notification =>
            notification._id === notificationId
              ? { ...notification, read: true }
              : notification
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleFriendRequest = async (notificationId, senderId, action) => {
    try {
      setProcessingRequests(prev => new Set([...prev, notificationId]));
      
      const response = await fetch('/api/connections/request', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          fromUserId: senderId, 
          toUserId: session.user.id,
          action 
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to process request');
      }
      
      toast.success(action === 'accept' ? 'Friend request accepted!' : 'Friend request declined');
      
      // Remove the notification from the list
      setNotifications(prev => prev.filter(notification => notification._id !== notificationId));
      
    } catch (error) {
      console.error('Error handling friend request:', error);
      toast.error('Failed to process friend request');
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'approval':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'rejection':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'friend_request':
        return <UserPlusIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <BellIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'approval':
        return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
      case 'rejection':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'friend_request':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
      default:
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
    }
  };

  const unreadNotifications = notifications.filter(n => !n.read);
  const displayNotifications = showAll ? notifications : notifications.slice(0, 5);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <BellIcon className="h-6 w-6 text-slate-600 dark:text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Notifications
          </h3>
          {unreadNotifications.length > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadNotifications.length}
            </span>
          )}
        </div>
        {notifications.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            {showAll ? 'Show Less' : 'Show All'}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          <BellIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {displayNotifications.map((notification) => (
              <motion.div
                key={notification._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`p-4 rounded-lg border ${getNotificationColor(notification.type)} ${
                  !notification.read ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''
                }`}
                onClick={() => !notification.read && markAsRead(notification._id)}
              >
                <div className="flex items-start space-x-3">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {notification.title || notification.message}
                    </p>
                    {notification.title && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {notification.message}
                      </p>
                    )}
                    {notification.reason && (
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-2 italic">
                        Reason: {notification.reason}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </p>
                    
                    {/* Friend Request Action Buttons */}
                    {notification.type === 'friend_request' && notification.senderId && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFriendRequest(notification._id, notification.senderId, 'accept');
                          }}
                          disabled={processingRequests.has(notification._id)}
                          className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processingRequests.has(notification._id) ? (
                            <div className="w-3 h-3 border-t-2 border-white rounded-full animate-spin"></div>
                          ) : (
                            <CheckIcon className="w-3 h-3" />
                          )}
                          Accept
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFriendRequest(notification._id, notification.senderId, 'reject');
                          }}
                          disabled={processingRequests.has(notification._id)}
                          className="flex items-center gap-1 px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processingRequests.has(notification._id) ? (
                            <div className="w-3 h-3 border-t-2 border-white rounded-full animate-spin"></div>
                          ) : (
                            <XMarkIcon className="w-3 h-3" />
                          )}
                          Ignore
                        </button>
                      </div>
                    )}
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
