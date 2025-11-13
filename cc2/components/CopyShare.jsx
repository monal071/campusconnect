import { useState } from "react";
import { motion } from "framer-motion";
import {
  ClipboardIcon,
  ClipboardDocumentCheckIcon,
  ShareIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

// Copy to Clipboard Button
export function CopyButton({ text, label = "Copy", className = "" }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard!");

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
      toast.error("Failed to copy");
    }
  };

  return (
    <motion.button
      onClick={handleCopy}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`inline-flex items-center space-x-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
        copied
          ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
          : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
      } ${className}`}
    >
      {copied ? (
        <>
          <ClipboardDocumentCheckIcon className="h-4 w-4" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <ClipboardIcon className="h-4 w-4" />
          <span>{label}</span>
        </>
      )}
    </motion.button>
  );
}

// Copy Icon Button (compact)
export function CopyIconButton({ text, size = "md" }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied!");

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
      toast.error("Failed to copy");
    }
  };

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <button
      onClick={handleCopy}
      className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${
        copied ? "text-green-500" : "text-gray-500"
      }`}
      title={copied ? "Copied!" : "Copy to clipboard"}
    >
      {copied ? (
        <ClipboardDocumentCheckIcon className={sizeClasses[size]} />
      ) : (
        <ClipboardIcon className={sizeClasses[size]} />
      )}
    </button>
  );
}

// Share Button with Native Web Share API
export function ShareButton({
  url,
  title,
  text,
  className = "",
  label = "Share",
}) {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async (e) => {
    e.stopPropagation();
    setIsSharing(true);

    const shareData = {
      title: title || "CampusConnect",
      text: text || "Check this out!",
      url: url || window.location.href,
    };

    try {
      if (navigator.share) {
        // Use native share if available (mobile)
        await navigator.share(shareData);
        toast.success("Shared successfully!");
      } else {
        // Fallback: copy link
        await navigator.clipboard.writeText(shareData.url);
        toast.success("Link copied to clipboard!");
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Share failed:", error);
        toast.error("Failed to share");
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <motion.button
      onClick={handleShare}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      disabled={isSharing}
      className={`inline-flex items-center space-x-2 px-3 py-1.5 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <ShareIcon className="h-4 w-4" />
      <span>{isSharing ? "Sharing..." : label}</span>
    </motion.button>
  );
}

// Share Icon Button (compact)
export function ShareIconButton({ url, title, text, size = "md" }) {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async (e) => {
    e.stopPropagation();
    setIsSharing(true);

    const shareData = {
      title: title || "CampusConnect",
      text: text || "Check this out!",
      url: url || window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast.success("Shared!");
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success("Link copied!");
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Share failed:", error);
        toast.error("Failed to share");
      }
    } finally {
      setIsSharing(false);
    }
  };

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <button
      onClick={handleShare}
      disabled={isSharing}
      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 disabled:opacity-50"
      title="Share"
    >
      <ShareIcon className={sizeClasses[size]} />
    </button>
  );
}

// Copy Link Button (specifically for copying URLs)
export function CopyLinkButton({ url, className = "" }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();

    try {
      const linkToCopy = url || window.location.href;
      await navigator.clipboard.writeText(linkToCopy);
      setCopied(true);
      toast.success("Link copied to clipboard!");

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
      toast.error("Failed to copy link");
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center space-x-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
        copied
          ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
          : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
      } ${className}`}
    >
      <LinkIcon className="h-4 w-4" />
      <span>{copied ? "Copied!" : "Copy Link"}</span>
    </button>
  );
}

// Code Block with Copy Button
export function CodeBlock({ code, language = "javascript", className = "" }) {
  return (
    <div className={`relative group ${className}`}>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyIconButton text={code} />
      </div>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  );
}

// Copy utilities
export const copyUtils = {
  copyText: async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
      return true;
    } catch (error) {
      console.error("Copy failed:", error);
      toast.error("Failed to copy");
      return false;
    }
  },

  copyJSON: async (obj) => {
    try {
      const json = JSON.stringify(obj, null, 2);
      await navigator.clipboard.writeText(json);
      toast.success("JSON copied to clipboard!");
      return true;
    } catch (error) {
      console.error("Copy failed:", error);
      toast.error("Failed to copy");
      return false;
    }
  },

  copyEmail: async (email) => {
    try {
      await navigator.clipboard.writeText(email);
      toast.success("Email copied!");
      return true;
    } catch (error) {
      console.error("Copy failed:", error);
      toast.error("Failed to copy");
      return false;
    }
  },

  copyPhoneNumber: async (phone) => {
    try {
      await navigator.clipboard.writeText(phone);
      toast.success("Phone number copied!");
      return true;
    } catch (error) {
      console.error("Copy failed:", error);
      toast.error("Failed to copy");
      return false;
    }
  },
};
