import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  BriefcaseIcon,
  CalendarIcon,
  UserIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function PendingApprovals() {
  const [pendingItems, setPendingItems] = useState({ jobs: [], events: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [processingItem, setProcessingItem] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(null);

  useEffect(() => {
    fetchPendingItems();
  }, []);

  const fetchPendingItems = async () => {
    try {
      const response = await fetch('/api/admin/pending-approvals');
      const data = await response.json();
      if (data.success) {
        setPendingItems(data.data);
      }
    } catch (error) {
      console.error('Error fetching pending items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (type, itemId, action, reason = '') => {
    setProcessingItem(itemId);
    try {
      const response = await fetch('/api/admin/pending-approvals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          itemId,
          action,
          reason
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Refresh the list
        await fetchPendingItems();
        setShowRejectModal(null);
        setRejectionReason('');
      }
    } catch (error) {
      console.error('Error processing approval:', error);
    } finally {
      setProcessingItem(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const ItemCard = ({ item, type }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-6 mb-4 border-l-4 border-l-orange-500"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            {type === 'job' ? (
              <BriefcaseIcon className="h-5 w-5 text-blue-500 mr-2" />
            ) : (
              <CalendarIcon className="h-5 w-5 text-green-500 mr-2" />
            )}
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">
              {type}
            </span>
            <span className="ml-2 px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full">
              Pending
            </span>
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {item.title}
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
            {item.description}
          </p>
          
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
            <UserIcon className="h-4 w-4 mr-1" />
            <span>Submitted by: {item.submittedBy?.name || 'Unknown'}</span>
            <ClockIcon className="h-4 w-4 ml-4 mr-1" />
            <span>{formatDate(item.createdAt)}</span>
          </div>

          {type === 'job' && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Company:</span> {item.company || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Location:</span> {item.location || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Type:</span> {item.type || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Salary:</span> {item.salary || 'N/A'}
              </div>
            </div>
          )}

          {type === 'event' && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Date:</span> {item.date ? formatDate(item.date) : 'N/A'}
              </div>
              <div>
                <span className="font-medium">Location:</span> {item.location || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Type:</span> {item.type || 'N/A'}
              </div>
            </div>
          )}
        </div>

        <div className="flex space-x-2 ml-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleApproval(type, item._id, 'approve')}
            disabled={processingItem === item._id}
            className="btn btn-success flex items-center space-x-2"
          >
            <CheckCircleIcon className="h-4 w-4" />
            <span>Approve</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowRejectModal(item._id)}
            disabled={processingItem === item._id}
            className="btn btn-danger flex items-center space-x-2"
          >
            <XCircleIcon className="h-4 w-4" />
            <span>Reject</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading pending approvals...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Pending Approvals
        </h2>
        <div className="flex items-center space-x-2">
          <div className="px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full text-sm font-medium">
            {pendingItems.total} pending
          </div>
        </div>
      </div>

      {pendingItems.total === 0 ? (
        <div className="text-center py-12">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Pending Approvals
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            All submissions have been reviewed.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingItems.jobs.map(job => (
            <ItemCard key={job._id} item={job} type="job" />
          ))}
          {pendingItems.events.map(event => (
            <ItemCard key={event._id} item={event} type="event" />
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4"
          >
            <div className="flex items-center mb-4">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Reject Submission
              </h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Please provide a reason for rejection (optional):
            </p>
            
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Reason for rejection..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              rows={3}
            />
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectionReason('');
                }}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const item = [...pendingItems.jobs, ...pendingItems.events].find(i => i._id === showRejectModal);
                  const type = pendingItems.jobs.some(j => j._id === showRejectModal) ? 'job' : 'event';
                  handleApproval(type, showRejectModal, 'reject', rejectionReason);
                }}
                className="btn btn-danger flex-1"
              >
                Reject
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
