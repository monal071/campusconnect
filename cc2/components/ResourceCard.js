import { useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
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
  TagIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";
import {
  HeartIcon as HeartIconSolid,
  CheckBadgeIcon as CheckBadgeIconSolid,
} from "@heroicons/react/24/solid";

const typeIcons = {
  document: DocumentIcon,
  book: BookOpenIcon,
  video: PlayIcon,
  link: LinkIcon,
};

const typeColors = {
  document: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  book: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  video: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  link: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
};

export default function ResourceCard({
  resource,
  onLike,
  onEdit,
  onDelete,
  onView,
  onDownload,
  onVerify,
}) {
  const { data: session } = useSession();
  const [isLiked, setIsLiked] = useState(
    resource.likedBy?.includes(session?.user?.id) || false,
  );
  const [likes, setLikes] = useState(resource.likes || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(resource.isVerified || false);

  const TypeIcon = typeIcons[resource.type] || DocumentIcon;
  const typeColorClass = typeColors[resource.type] || typeColors.document;

  const canEdit =
    session?.user?.id === resource.userId ||
    session?.user?.role === "admin" ||
    session?.user?.role === "faculty";
  const isFaculty = session?.user?.role === "faculty";
  const canVerify = isFaculty && !isVerified;

  const handleLike = async () => {
    if (!session) {
      toast.error("Please sign in to like resources");
      return;
    }
    setIsLoading(true);
    try {
      const result = await onLike(resource._id);
      setIsLiked(result.liked);
      setLikes(result.likes);
    } catch {
      toast.error("Failed to update like");
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = async () => {
    try {
      if (onView) await onView(resource._id);
      if (resource.url) {
        window.open(resource.url, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      console.error("Error tracking view:", error);
    }
  };

  const handleDownload = async () => {
    try {
      if (onDownload) await onDownload(resource._id);
      const downloadUrl = resource.downloadUrl || resource.url;
      if (downloadUrl) {
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = resource.title || "download";
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Download started!");
      }
    } catch {
      toast.error("Failed to download file");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: resource.title,
          text: resource.description,
          url: resource.url || window.location.href,
        });
      } catch (error) {
        if (error.name !== "AbortError") toast.error("Failed to share");
      }
    } else {
      try {
        await navigator.clipboard.writeText(
          resource.url || window.location.href,
        );
        toast.success("Link copied to clipboard!");
      } catch {
        toast.error("Failed to copy link");
      }
    }
  };

  const handleVerify = async () => {
    if (!isFaculty) return;
    setIsLoading(true);
    try {
      if (onVerify) {
        await onVerify(resource._id);
        setIsVerified(true);
      }
    } catch {
      toast.error("Failed to verify resource");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getFileType = (url) => {
    if (!url) return null;
    const extension = url.split(".").pop().toLowerCase().split("?")[0];
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension))
      return "image";
    if (extension === "pdf") return "pdf";
    return "file";
  };

  const isImage = resource.url && getFileType(resource.url) === "image";
  const isPDF = resource.url && getFileType(resource.url) === "pdf";
  const hasFile =
    resource.url &&
    (resource.url.startsWith("/uploads") || resource.url.startsWith("http"));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`p-1.5 rounded-lg ${typeColorClass}`}>
              <TypeIcon className="h-4 w-4" />
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColorClass}`}
            >
              {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
            </span>
            {resource.category && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                {resource.category}
              </span>
            )}
            {isVerified && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                <CheckBadgeIconSolid className="h-3.5 w-3.5 mr-0.5" />
                Verified
              </span>
            )}
          </div>

          <div className="flex gap-0.5 ml-2">
            {canVerify && (
              <button
                onClick={handleVerify}
                disabled={isLoading}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors disabled:opacity-50"
                title="Verify"
              >
                <CheckBadgeIcon className="h-4 w-4" />
              </button>
            )}
            {canEdit && (
              <>
                <button
                  onClick={() => onEdit(resource)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                  title="Edit"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(resource._id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                  title="Delete"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Title and description */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1.5 line-clamp-2">
          {resource.title}
        </h3>
        {resource.description && (
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
            {resource.description}
          </p>
        )}

        {/* File preview */}
        {isImage && hasFile && (
          <div className="mb-3 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <img
              src={resource.url}
              alt={resource.title}
              className="w-full h-40 object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onClick={handleView}
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </div>
        )}

        {isPDF && hasFile && (
          <div
            onClick={handleView}
            className="mb-3 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <DocumentIcon className="h-8 w-8 text-red-600 dark:text-red-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  PDF Document
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Click to view
                </p>
              </div>
            </div>
          </div>
        )}

        {hasFile && !isImage && !isPDF && (
          <div
            onClick={handleView}
            className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <DocumentIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Document
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Click to open
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tags */}
        {resource.tags && resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {resource.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300"
              >
                <TagIcon className="h-3 w-3 mr-0.5" />
                {tag}
              </span>
            ))}
            {resource.tags.length > 3 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                +{resource.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700">
        {/* Author */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            {resource.authorImage ? (
              <Image
                src={resource.authorImage}
                alt={resource.author}
                width={20}
                height={20}
                className="rounded-full"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                <UserIcon className="h-3 w-3 text-gray-600 dark:text-gray-400" />
              </div>
            )}
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {resource.author || "Unknown"}
            </span>
            {resource.authorRole === "faculty" && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                Faculty
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <CalendarDaysIcon className="h-3.5 w-3.5" />
            <span>{formatDate(resource.createdAt)}</span>
          </div>
        </div>

        {/* Stats and actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-0.5">
              <EyeIcon className="h-3.5 w-3.5" />
              {resource.views || 0}
            </span>
            {resource.downloads !== undefined && (
              <span className="flex items-center gap-0.5">
                <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                {resource.downloads || 0}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleLike}
              disabled={isLoading}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-sm transition-colors ${
                isLiked
                  ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-400"
              }`}
            >
              {isLiked ? (
                <HeartIconSolid className="h-3.5 w-3.5" />
              ) : (
                <HeartIcon className="h-3.5 w-3.5" />
              )}
              <span className="text-xs font-medium">{likes}</span>
            </button>

            <button
              onClick={handleShare}
              className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-colors"
              title="Share"
            >
              <ShareIcon className="h-3.5 w-3.5" />
            </button>

            {(resource.downloadUrl || resource.url) && (
              <button
                onClick={handleDownload}
                className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                title="Download"
              >
                <ArrowDownTrayIcon className="h-3.5 w-3.5" />
              </button>
            )}

            {resource.url && (
              <button
                onClick={handleView}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-md transition-colors"
              >
                View
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
