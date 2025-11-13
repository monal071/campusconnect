import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "default", // 'default', 'danger', 'warning', 'success'
  requireReason = false,
  reasonPlaceholder = "Please provide a reason...",
  showCheckbox = false,
  checkboxLabel = "I understand the consequences",
}) {
  const [reason, setReason] = useState("");
  const [isChecked, setIsChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (requireReason && !reason.trim()) {
      return;
    }
    if (showCheckbox && !isChecked) {
      return;
    }

    setLoading(true);
    try {
      await onConfirm(requireReason ? reason : undefined);
      handleClose();
    } catch (error) {
      console.error("Confirmation error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReason("");
    setIsChecked(false);
    onClose();
  };

  const getTypeStyles = () => {
    switch (type) {
      case "danger":
        return {
          icon: <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />,
          iconBg: "bg-red-100 dark:bg-red-900/20",
          buttonClass: "bg-red-500 hover:bg-red-600",
        };
      case "warning":
        return {
          icon: (
            <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500" />
          ),
          iconBg: "bg-yellow-100 dark:bg-yellow-900/20",
          buttonClass: "bg-yellow-500 hover:bg-yellow-600",
        };
      case "success":
        return {
          icon: <CheckCircleIcon className="h-12 w-12 text-green-500" />,
          iconBg: "bg-green-100 dark:bg-green-900/20",
          buttonClass: "bg-green-500 hover:bg-green-600",
        };
      default:
        return {
          icon: <InformationCircleIcon className="h-12 w-12 text-blue-500" />,
          iconBg: "bg-blue-100 dark:bg-blue-900/20",
          buttonClass: "bg-blue-500 hover:bg-blue-600",
        };
    }
  };

  const styles = getTypeStyles();
  const canConfirm =
    (!requireReason || reason.trim()) && (!showCheckbox || isChecked);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-50"
          >
            <div className="p-6">
              {/* Icon */}
              <div
                className={`flex items-center justify-center w-16 h-16 ${styles.iconBg} rounded-full mb-4 mx-auto`}
              >
                {styles.icon}
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
                {title}
              </h3>

              {/* Message */}
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
                {message}
              </p>

              {/* Reason Input */}
              {requireReason && (
                <div className="mb-4">
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={reasonPlaceholder}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    This reason will be recorded for accountability.
                  </p>
                </div>
              )}

              {/* Checkbox */}
              {showCheckbox && (
                <div className="mb-4">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => setIsChecked(e.target.checked)}
                      className="mt-1 w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {checkboxLabel}
                    </span>
                  </label>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelText}
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading || !canConfirm}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${styles.buttonClass}`}
                >
                  {loading ? "Processing..." : confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Quick confirmation helpers
export const confirmDeletion = (onConfirm, itemName = "this item") => {
  return {
    title: "Delete Confirmation",
    message: `Are you sure you want to delete ${itemName}? This action cannot be undone.`,
    confirmText: "Delete",
    type: "danger",
    onConfirm,
  };
};

export const confirmWithReason = (
  onConfirm,
  action = "perform this action"
) => {
  return {
    title: "Confirmation Required",
    message: `Please provide a reason to ${action}.`,
    confirmText: "Confirm",
    type: "warning",
    requireReason: true,
    onConfirm,
  };
};

export const confirmDangerousAction = (
  onConfirm,
  action = "perform this action"
) => {
  return {
    title: "Warning",
    message: `This is a potentially dangerous action. ${action}`,
    confirmText: "I Understand, Proceed",
    type: "danger",
    showCheckbox: true,
    checkboxLabel: "I understand this action is irreversible",
    onConfirm,
  };
};
