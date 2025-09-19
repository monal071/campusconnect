import { useState } from 'react';
import { motion } from 'framer-motion';

export default function ConnectionCard({ 
  user, 
  type = 'recommended', // 'recommended', 'search', 'connection', 'request'
  onSendRequest,
  onAcceptRequest,
  onRejectRequest,
  onRemoveConnection,
  onStartChat,
  disabled = false
}) {
  const [isHovered, setIsHovered] = useState(false);

  const renderActionButton = () => {
    switch (type) {
      case 'recommended':
      case 'search':
        return (
          <button
            onClick={() => onSendRequest(user)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition duration-200"
            disabled={disabled}
          >
            {disabled ? 'Request Sent' : 'Connect'}
          </button>
        );
      case 'request':
        return (
          <div className="flex gap-2">
            <button
              onClick={() => onAcceptRequest(user._id)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition duration-200"
            >
              Accept
            </button>
            <button
              onClick={() => onRejectRequest(user._id)}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition duration-200"
            >
              Reject
            </button>
          </div>
        );
      case 'connection':
        return (
          <div className="flex justify-between mt-4 w-full">
            <button
              onClick={() => onStartChat && onStartChat(user)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition duration-200 text-sm"
            >
              Message
            </button>
            <button
              onClick={() => onRemoveConnection(user.connectionId)}
              className="text-red-400 hover:text-red-500 text-sm"
            >
              Remove
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`bg-[#2D2D2D] rounded-lg p-4 ${type === 'connection' ? 'flex flex-col' : 'flex items-center justify-between'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
    >
      <div className={`flex items-center gap-4 ${type === 'connection' ? 'mb-3' : ''}`}>
        <div className={`${type === 'connection' ? 'w-16 h-16' : 'w-12 h-12'} rounded-full bg-[#1D1D1D] flex items-center justify-center overflow-hidden`}>
          {user.image ? (
            <img
              src={user.image}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className={`text-white ${type === 'connection' ? 'text-2xl' : 'text-xl'}`}>
              {user.name?.charAt(0)}
            </span>
          )}
        </div>
        <div>
          <h3 className="text-white font-medium">{user.name}</h3>
          <p className="text-gray-400 text-sm">{user.email}</p>
          {user.department && (
            <p className="text-gray-400 text-xs mt-1">{user.department}</p>
          )}
          {type === 'connection' && user.connectedSince && (
            <p className="text-gray-500 text-xs mt-1">
              Connected since {new Date(user.connectedSince).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
      
      {renderActionButton()}
    </motion.div>
  );
}
