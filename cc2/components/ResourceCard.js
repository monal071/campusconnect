import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import {
  HeartIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  PencilIcon,
  TrashIcon,
  CalendarDaysIcon,
  UserIcon,
  LinkIcon,
  DocumentIcon,
  PlayIcon,
  BookOpenIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartIconSolid
} from '@heroicons/react/24/solid';

const typeIcons = {
  document: DocumentIcon,
  book: BookOpenIcon,
  video: PlayIcon,
  link: LinkIcon
};

const typeColors = {
  document: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  book: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  video: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  link: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
};

export default function ResourceCard({ resource, onLike, onEdit, onDelete, onView, onDownload }) {
  const { data: session } = useSession();
  const [isLiked, setIsLiked] = useState(
    resource.likedBy?.includes(session?.user?.id) || false
  );
  const [likes, setLikes] = useState(resource.likes || 0);
  const [isLoading, setIsLoading] = useState(false);

  const TypeIcon = typeIcons[resource.type] || DocumentIcon;
  const typeColorClass = typeColors[resource.type] || typeColors.document;

  const canEdit = session?.user?.id === resource.userId || session?.user?.role === 'admin';

  const handleLike = async () => {
    if (!session) {
      toast.error('Please sign in to like resources');
      return;
    }

    setIsLoading(true);
    try {
      const result = await onLike(resource._id);
      setIsLiked(result.liked);
      setLikes(result.likes);
    } catch (error) {
      toast.error('Failed to update like');
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = async () => {
    try {
      if (onView) {
        await onView(resource._id);
      }
      if (resource.url) {
        window.open(resource.url, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const handleDownload = async () => {
    try {
      if (onDownload) {
        await onDownload(resource._id);
      }
      if (resource.downloadUrl) {
        window.open(resource.downloadUrl, '_blank', 'noopener,noreferrer');
      } else if (resource.url) {
        window.open(resource.url, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Error tracking download:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: resource.title,
          text: resource.description,
          url: resource.url || window.location.href
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          toast.error('Failed to share');
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(resource.url || window.location.href);
        toast.success('Link copied to clipboard!');
      } catch (error) {
        toast.error('Failed to copy link');
      }
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return null;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${typeColorClass}`}>
              <TypeIcon className="h-5 w-5" />
            </div>
            <div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColorClass}`}>
                {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
              </span>
              {resource.category && (
                <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                  {resource.category}
                </span>
              )}
            </div>
          </div>
          
          {/* Action buttons for owner */}
          {canEdit && (
            <div className="flex space-x-1">
              <button
                onClick={() => onEdit(resource)}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                title="Edit resource"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(resource._id)}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Delete resource"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Title and description */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
          {resource.title}
        </h3>
        
        {resource.description && (
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
            {resource.description}
          </p>
        )}

        {/* Tags */}
        {resource.tags && resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {resource.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
              >
                <TagIcon className="h-3 w-3 mr-1" />
                {tag}
              </span>
            ))}
            {resource.tags.length > 3 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                +{resource.tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-750 border-t border-gray-200 dark:border-gray-700">
        {/* Author info */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {resource.authorImage ? (
              <Image
                src={resource.authorImage}
                alt={resource.author}
                width={24}
                height={24}
                className="rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                <UserIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </div>
            )}
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {resource.author}
            </span>
          </div>
          
          <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
            <CalendarDaysIcon className="h-4 w-4" />
            <span>{formatDate(resource.createdAt)}</span>
          </div>
        </div>

        {/* Stats and actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <EyeIcon className="h-4 w-4" />
              <span>{resource.views || 0}</span>
            </div>
            {resource.downloads !== undefined && (
              <div className="flex items-center space-x-1">
                <ArrowDownTrayIcon className="h-4 w-4" />
                <span>{resource.downloads || 0}</span>
              </div>
            )}
            {resource.fileSize && (
              <span className="text-xs">{formatFileSize(resource.fileSize)}</span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleLike}
              disabled={isLoading}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-colors ${
                isLiked
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-400'
              }`}
            >
              {isLiked ? (
                <HeartIconSolid className="h-4 w-4" />
              ) : (
                <HeartIcon className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">{likes}</span>
            </button>

            <button
              onClick={handleShare}
              className="p-1.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 dark:text-gray-400 dark:hover:text-indigo-400 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
              title="Share resource"
            >
              <ShareIcon className="h-4 w-4" />
            </button>

            {resource.downloadUrl && (
              <button
                onClick={handleDownload}
                className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 dark:text-gray-400 dark:hover:text-green-400 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                title="Download resource"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
              </button>
            )}

            {resource.url && (
              <button
                onClick={handleView}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                View
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}